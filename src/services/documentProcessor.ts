import { PDFParse } from "pdf-parse";

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentPassage {
  id: string;
  pageNumber: number;
  text: string;
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  fullText: string;
  pages: DocumentPage[];
  passages: DocumentPassage[];
  uploadedAt: string;
  isScannedOnly: boolean;
}

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
  "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
  "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
  "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
  "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
  "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
  "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
  "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
  "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through",
  "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
  "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
  "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
  "you're", "you've", "your", "yours", "yourself", "yourselves", "tell", "explain", "give", "find"
]);

export async function processPdfBuffer(
  buffer: Buffer,
  filename: string,
  fileSize: number
): Promise<ProcessedDocument> {
  const pages: DocumentPage[] = [];
  const passages: DocumentPassage[] = [];

  const parser = new PDFParse({ data: buffer });
  let textResult: any;

  try {
    textResult = await parser.getText();
  } catch (err: any) {
    await parser.destroy().catch(() => {});
    throw new Error(`Failed to parse PDF file "${filename}": ${err.message || "Invalid or corrupt PDF"}`);
  }

  if (textResult?.pages && Array.isArray(textResult.pages)) {
    for (const p of textResult.pages) {
      pages.push({
        pageNumber: p.pageNumber,
        text: p.text ? p.text.trim() : "",
      });
    }
  }

  await parser.destroy().catch(() => {});

  // Ensure pages are sorted by pageNumber
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  const fullText = textResult?.text ? textResult.text.trim() : pages.map((p) => p.text).join("\n\n");
  const isScannedOnly = fullText.replace(/\s+/g, "").length < 30;

  // Split into manageable passages with page tracking
  let passageCounter = 1;
  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;

    // Split page text into paragraphs or chunks of ~300-600 characters
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    if (paragraphs.length === 0 && page.text.length > 0) {
      passages.push({
        id: `p-${passageCounter++}`,
        pageNumber: page.pageNumber,
        text: page.text.slice(0, 1000),
      });
    } else {
      for (const para of paragraphs) {
        if (para.length > 900) {
          // Break large paragraphs
          const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)/g) || [para];
          let currentChunk = "";
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > 700) {
              if (currentChunk.trim()) {
                passages.push({
                  id: `p-${passageCounter++}`,
                  pageNumber: page.pageNumber,
                  text: currentChunk.trim(),
                });
              }
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
          if (currentChunk.trim()) {
            passages.push({
              id: `p-${passageCounter++}`,
              pageNumber: page.pageNumber,
              text: currentChunk.trim(),
            });
          }
        } else {
          passages.push({
            id: `p-${passageCounter++}`,
            pageNumber: page.pageNumber,
            text: para,
          });
        }
      }
    }
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: docId,
    filename,
    fileSize,
    pageCount: pages.length || 1,
    fullText,
    pages,
    passages,
    uploadedAt: new Date().toISOString(),
    isScannedOnly,
  };
}

/**
 * Fast keyword & term-frequency passage retriever for initial MVP.
 * Ranks passages by relevance to user query words.
 */
export function retrieveRelevantPassages(
  passages: DocumentPassage[],
  query: string,
  topK: number = 4
): DocumentPassage[] {
  if (!passages || passages.length === 0) return [];

  const rawTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

  if (rawTokens.length === 0) {
    // Return first K passages if query has only stopwords
    return passages.slice(0, topK);
  }

  const scored = passages.map((passage) => {
    const passageLower = passage.text.toLowerCase();
    let score = 0;

    for (const token of rawTokens) {
      // Exact word boundary match
      const regex = new RegExp(`\\b${token}\\b`, "g");
      const matches = passageLower.match(regex);
      if (matches) {
        score += matches.length * 3;
      } else if (passageLower.includes(token)) {
        score += 1;
      }
    }

    // Reward exact query phrase substring match
    if (query.trim().length > 4 && passageLower.includes(query.toLowerCase().trim())) {
      score += 10;
    }

    return { passage, score };
  });

  // Filter those with positive score, then sort descending
  const relevant = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.passage);

  if (relevant.length === 0) {
    // If no strong keyword match found, return top passages for overview
    return passages.slice(0, Math.min(topK, passages.length));
  }

  return relevant.slice(0, topK);
}
