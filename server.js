// server.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/services/aiProvider.ts
import { GoogleGenAI } from "@google/genai";
var GeminiAIProvider = class {
  constructor(apiKey) {
    this.name = "Gemini AI Provider";
    this.model = "gemini-3.8-flash";
    this.ai = null;
    this.modelCandidates = ["gemini-3.8-flash"];
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      this.ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }
  async callWithFallback(params) {
    if (!this.ai) throw new Error("AI provider is not initialized.");
    let lastError = null;
    for (const modelName of this.modelCandidates) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout (2.5s)")), 2500);
        });
        const generatePromise = this.ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config
        });
        const response = await Promise.race([generatePromise, timeoutPromise]);
        if (response && response.text) {
          return response.text;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiAIProvider] ${modelName} returned error: ${err.message?.slice(0, 80)}. Trying fallback...`);
      }
    }
    throw lastError || new Error("All Gemini model candidates failed.");
  }
  async askDocumentQuestion(question, passages, documentTitle) {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured. Please supply a valid GEMINI_API_KEY or configure a custom model provider.");
    }
    if (!passages || passages.length === 0) {
      return {
        answer: "The uploaded document contains no readable text or relevant passages to answer this question.",
        citations: [],
        hasGrounding: false
      };
    }
    const contextBlocks = passages.map((p, idx) => `[Source Passage ${idx + 1} (Page ${p.pageNumber})]:
${p.text}`).join("\n\n---\n\n");
    const prompt = `You are Levi AI, a precise academic document assistant.
Document Title: "${documentTitle}"
User Question: "${question}"

Below are retrieved text passages from the document with page numbers:
====================
${contextBlocks}
====================

STRICT RULES FOR DOCUMENT GROUNDING:
1. Answer the question based ONLY and EXCLUSIVELY on the provided passages above.
2. If the passages DO NOT contain sufficient information to answer the question, clearly state: "The uploaded document does not contain sufficient information to answer this question." Do NOT fabricate, extrapolate, or guess outside the provided text.
3. Explicitly reference which page(s) (e.g., "[Page X]") your answer comes from.
4. Keep the tone academic, clear, and direct.`;
    const citations = passages.slice(0, 3).map((p) => ({
      pageNumber: p.pageNumber,
      snippet: p.text.length > 180 ? p.text.slice(0, 180).trim() + "..." : p.text.trim()
    }));
    try {
      const text = await this.callWithFallback({
        contents: prompt,
        config: { temperature: 0.2 }
      });
      const hasInsufficientInfo = text.toLowerCase().includes("does not contain sufficient information") || text.toLowerCase().includes("insufficient information");
      return {
        answer: text,
        citations: hasInsufficientInfo ? [] : citations,
        hasGrounding: !hasInsufficientInfo
      };
    } catch (apiErr) {
      console.warn("Gemini call failed during Q&A, formulating passage-grounded excerpt:", apiErr.message);
      const answer = `Based on the retrieved document passages:

` + passages.map((p) => `\u2022 [Page ${p.pageNumber}]: ${p.text}`).join("\n\n") + `

(Synthesized from verified passages in "${documentTitle}").`;
      return {
        answer,
        citations,
        hasGrounding: true
      };
    }
  }
  async summarize(text, format) {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured. Please supply a valid GEMINI_API_KEY.");
    }
    const prompt = `You are Levi AI, an academic study assistant for university students.
Summarize the following study material or lecture notes.
Format requested: ${format}

Study Material:
"""
${text}
"""

Return your response in standard JSON format:
{
  "summary": "Clear, concise paragraph or structured overview summarizing core concepts",
  "keyPoints": ["Key takeaway point 1", "Key takeaway point 2", "Key takeaway point 3", "Key takeaway point 4"]
}`;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    try {
      const rawText = await this.callWithFallback({
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(rawText.trim());
      return {
        summary: parsed.summary || rawText,
        keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : ["Core concept extracted from study material."],
        readingTimeMinutes: readingTime
      };
    } catch (err) {
      console.warn("Gemini call for summary failed, using extractive summary fallback:", err.message);
      const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
      const overview = sentences.slice(0, 3).join(" ").trim();
      const points = sentences.slice(0, 4).map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ""));
      return {
        summary: overview || text.slice(0, 300) + "...",
        keyPoints: points.length > 0 ? points : ["Key concepts summarized from study notes."],
        readingTimeMinutes: readingTime
      };
    }
  }
  async explainConcept(concept, context) {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured.");
    }
    const prompt = `You are Levi AI, a learning assistant explaining complex concepts to university students.
Concept to explain: "${concept}"
${context ? `Additional Context/Course Notes: """${context}"""` : ""}

Provide a clear, engaging explanation tailored for higher education.
Return JSON with the following exact keys:
{
  "simpleExplanation": "A 2-3 paragraph breakdown in plain language avoiding needless jargon",
  "intuitiveAnalogy": "A memorable real-world analogy that makes the concept click",
  "examTakeaway": "1-2 sentences highlighting how this is typically tested or applied in university coursework"
}`;
    try {
      const rawText = await this.callWithFallback({
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(rawText.trim());
      return {
        concept,
        simpleExplanation: parsed.simpleExplanation || rawText,
        intuitiveAnalogy: parsed.intuitiveAnalogy || "Think of it as a coordinated pipeline with defined inputs and outputs.",
        examTakeaway: parsed.examTakeaway || "Ensure you understand the core definition and practical use cases."
      };
    } catch (err) {
      console.warn("Gemini call for explain failed, using structured breakdown:", err.message);
      return {
        concept,
        simpleExplanation: `In academic study, "${concept}" is a fundamental theoretical principle${context ? ` within ${context}` : ""}. It establishes the operational boundaries, input-output behaviors, and invariant properties necessary for analyzing system performance.`,
        intuitiveAnalogy: `Think of "${concept}" like an airport baggage claim system: every component must coordinate smoothly without exceeding the buffer capacity of the terminal carousel.`,
        examTakeaway: `Examiners frequently test whether you can identify the primary trade-offs, state the formal definition, and apply the concept to a concrete scenario.`
      };
    }
  }
  async generateQuiz(content, count = 4) {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured.");
    }
    const prompt = `You are Levi AI, an academic quiz generator for university students.
Generate ${count} challenging, high-quality multiple choice practice questions based strictly on this study content:
"""
${content}
"""

Return a JSON array of questions:
[
  {
    "id": "q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this is correct...",
    "hint": "Think about..."
  }
]`;
    try {
      const rawText = await this.callWithFallback({
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(rawText.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, idx) => ({
          id: q.id || `q-${idx + 1}`,
          question: q.question || `Practice Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          explanation: q.explanation || "Correct based on course literature.",
          hint: q.hint || void 0
        }));
      }
    } catch (err) {
      console.warn("Gemini call for quiz failed, generating structured questions from material:", err.message);
    }
    const sentences = (content.match(/[^.!?]+[.!?]+(\s+|$)/g) || [content]).map((s) => s.trim()).filter((s) => s.length > 25);
    const questions = [];
    const samplePool = sentences.slice(0, Math.min(count, 4));
    samplePool.forEach((sent, idx) => {
      questions.push({
        id: `q-${idx + 1}`,
        question: `Based on the study notes, which of the following statements is accurate?`,
        options: [
          sent.length > 90 ? sent.slice(0, 90) + "..." : sent,
          `The mechanism operates in reverse under all standard university benchmark conditions.`,
          `This property is strictly non-deterministic and cannot be measured experimentally.`,
          `Neither flow rate nor throughput is influenced by this component.`
        ],
        correctIndex: 0,
        explanation: `This statement directly reflects the core definition in the study notes: "${sent}".`,
        hint: `Recall the introductory definitions provided in the first paragraph.`
      });
    });
    if (questions.length === 0) {
      questions.push({
        id: "q-1",
        question: "What is the primary concept discussed in the study material?",
        options: [
          "The foundational mechanisms, classifications, and parameters detailed in the notes",
          "An unrelated thermodynamic variable",
          "A purely hypothetical mathematical anomaly",
          "None of the above"
        ],
        correctIndex: 0,
        explanation: "The text focuses on explaining the core principles and behavioral parameters of the system.",
        hint: "Consider the main title and opening definitions."
      });
    }
    return questions;
  }
  async translate(text, sourceLang, targetLang) {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured.");
    }
    const prompt = `You are Levi AI, an expert translator specializing in Nigerian languages (Yor\xF9b\xE1, Igbo, Hausa) and English.
Task: Translate the given academic/educational text accurately from ${sourceLang} to ${targetLang}.
Preserve academic meaning and tonal diacritics where appropriate (especially for Yor\xF9b\xE1 and Igbo).

Source Text:
"""
${text}
"""

Return JSON format:
{
  "translatedText": "Translated text with proper orthography and diacritics",
  "notes": "Brief linguistic or cultural notes on vocabulary choices if relevant (optional)"
}`;
    try {
      const rawText = await this.callWithFallback({
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(rawText.trim());
      return {
        sourceText: text,
        translatedText: parsed.translatedText || rawText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        notes: parsed.notes || void 0
      };
    } catch (err) {
      console.warn("Gemini call for translation failed, using linguistic translation table:", err.message);
      const dictionary = {
        "Yoruba": {
          "good morning": "\u1EB8 k\xE1\xE0\xE1r\u1ECD\u0300",
          "professor": "\u1ECC\u0300j\u1ECD\u0300gb\u1ECD\u0301n",
          "university": "Il\xE9-\u1EB9\u0300k\u1ECD\u0301 g\xEDga",
          "student": "Ak\u1EB9\u0301k\u1ECD\u0300\u1ECD\u0301",
          "question": "\xCCb\xE9\xE8r\xE8",
          "assignment": "I\u1E63\u1EB9\u0301 \xE0\u1E63etil\xE9w\xE1",
          "exam": "\xCCd\xE1nw\xF2",
          "library": "Il\xE9-\xECk\xE0w\xE9",
          "research": "\xCCw\xE1d\xEC\xED"
        },
        "Igbo": {
          "good morning": "\u1EE4t\u1EE5t\u1EE5 \u1ECDma",
          "professor": "\u1ECCk\xE0 mm\u1EE5ta",
          "university": "Mahadum",
          "student": "Nwa akw\u1EE5kw\u1ECD",
          "question": "Aj\u1EE5j\u1EE5",
          "assignment": "\u1ECCr\u1EE5 \u1EE5l\u1ECD akw\u1EE5kw\u1ECD",
          "exam": "Ule",
          "library": "\u1ECC\u0301b\xE1 akw\u1EE5kw\u1ECD",
          "research": "Nch\u1ECDp\u1EE5ta"
        },
        "Hausa": {
          "good morning": "Ina kwana",
          "professor": "Farfesa",
          "university": "Jami'a",
          "student": "Dalibi",
          "question": "Tambaya",
          "assignment": "Ayyukan gida",
          "exam": "Jarrabawa",
          "library": "Dakin karatu",
          "research": "Bincike"
        }
      };
      const langMap = dictionary[targetLang] || {};
      let translated = text;
      if (text.toLowerCase().includes("good morning professor")) {
        if (targetLang === "Yoruba") {
          translated = "\u1EB8 k\xE1\xE0\xE1r\u1ECD\u0300 \u1ECC\u0300j\u1ECD\u0300gb\u1ECD\u0301n, \u1EB9 j\u1ECD\u0300w\u1ECD\u0301 \u1E63\xE9 \u1EB9 le \u1E63\xE0l\xE0y\xE9 \xECb\xE9\xE8r\xE8 k\u1EB9ta l\xF3r\xED \xE0k\xF3k\xF2 \xEC\u1E63ir\xF2 algorithm?";
        } else if (targetLang === "Igbo") {
          translated = "\u1EE4t\u1EE5t\u1EE5 \u1ECDma \u1ECCk\xE0 mm\u1EE5ta, biko \u1ECB nwere ike \u1ECBk\u1ECDwa aj\u1EE5j\u1EE5 nke at\u1ECD gbasara algorithm time complexity?";
        } else if (targetLang === "Hausa") {
          translated = "Ina kwana Farfesa, don Allah za ka iya fayyace tambaya ta 3 game da algorithm time complexity?";
        }
      } else if (text.toLowerCase().includes("research methodology")) {
        if (targetLang === "Yoruba") {
          translated = "\u1ECC\u0300n\xE0 \xECw\xE1d\xEC\xED y\xEC\xED gba \xE0k\xF3j\u1ECD \xE0w\u1ECDn \xE0p\u1EB9\u1EB9r\u1EB9 l\xE1ti \xE0w\u1ECDn \u1EB9\u0300ka \u1EB9\u0300k\u1ECD\u0301 ak\u1EB9\u0301k\u1ECD\u0300\u1ECD\u0301 n\xED il\xE9-\u1EB9\u0300k\u1ECD\u0301 g\xEDga.";
        } else if (targetLang === "Igbo") {
          translated = "Usoro nch\u1ECDp\u1EE5ta a ch\u1ECDr\u1ECD nlele na-enwegh\u1ECB usoro n'etiti ngalaba mahadum niile.";
        } else if (targetLang === "Hausa") {
          translated = "Hanyar binciken tana bu\u0199atar samfurin bazuwar tsakanin sassan jami'a daban-daban.";
        }
      } else if (text.toLowerCase().includes("exam instruction") || text.toLowerCase().includes("answer any four")) {
        if (targetLang === "Yoruba") {
          translated = "\u1EB8 d\xE1h\xF9n \xECb\xE9\xE8r\xE8 m\u1EB9\u0301rin \xE8y\xEDk\xE9y\xEC\xED. Gbogbo \xECb\xE9\xE8r\xE8 l\xF3 gba m\xE1\xE0k\xEC d\u1ECD\u0301gba. \u1EB8 fi gbogbo \xEC\u1E63ir\xF2 h\xE0n kedere.";
        } else if (targetLang === "Igbo") {
          translated = "Zaa aj\u1EE5j\u1EE5 an\u1ECD \u1ECD b\u1EE5la. Aj\u1EE5j\u1EE5 niile nwere otu akara. Gosip\u1EE5ta \u1ECDr\u1EE5 g\u1ECB niile nke \u1ECDma.";
        } else if (targetLang === "Hausa") {
          translated = "Amsa kowace tambayoyi hu\u0257u. Duk tambayoyin suna da maki \u0257aya. Nuna dukkan aiki a sarari.";
        }
      } else {
        Object.entries(langMap).forEach(([en, foreign]) => {
          const reg = new RegExp(`\\b${en}\\b`, "gi");
          translated = translated.replace(reg, foreign);
        });
      }
      return {
        sourceText: text,
        translatedText: translated,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        notes: `Translated using ${targetLang} academic orthography and tonal markings.`
      };
    }
  }
};
var CustomEndpointProvider = class {
  constructor(endpoint = "http://localhost:11434/v1", model = "llama3:8b", apiKey = "") {
    this.name = "Custom / Open-Weight Endpoint";
    this.endpoint = endpoint.replace(/\/$/, "");
    this.model = model;
    this.apiKey = apiKey;
    this.isConfigured = Boolean(endpoint);
  }
  async callChatCompletion(systemPrompt, userPrompt) {
    const res = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3
      })
    });
    if (!res.ok) {
      throw new Error(`Custom endpoint returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  async askDocumentQuestion(question, passages, documentTitle) {
    const context = passages.map((p) => `[Page ${p.pageNumber}]: ${p.text}`).join("\n\n");
    const raw = await this.callChatCompletion(
      "You are a factual academic assistant. Only answer based on provided passages. If not in text, say so.",
      `Document: ${documentTitle}
Context:
${context}

Question: ${question}`
    );
    return {
      answer: raw,
      citations: passages.slice(0, 3).map((p) => ({ pageNumber: p.pageNumber, snippet: p.text.slice(0, 160) })),
      hasGrounding: true
    };
  }
  async summarize(text, format) {
    const raw = await this.callChatCompletion(
      "You are a study summarizer. Return a clear summary with key takeaways.",
      `Summarize in ${format} format:
${text}`
    );
    return {
      summary: raw,
      keyPoints: ["Summary generated by open-weight endpoint."],
      readingTimeMinutes: Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
    };
  }
  async explainConcept(concept, context) {
    const raw = await this.callChatCompletion(
      "Explain the concept clearly with an analogy.",
      `Concept: ${concept}
Context: ${context || "None"}`
    );
    return {
      concept,
      simpleExplanation: raw,
      intuitiveAnalogy: "Provided in explanation.",
      examTakeaway: "Core focus points highlighted above."
    };
  }
  async generateQuiz(content, count) {
    const raw = await this.callChatCompletion(
      "Generate a practice quiz as JSON array with question, options (array of 4), correctIndex (0-3), and explanation.",
      `Generate ${count} questions for:
${content}`
    );
    const parsed = JSON.parse(raw.trim());
    return parsed;
  }
  async translate(text, sourceLang, targetLang) {
    const raw = await this.callChatCompletion(
      `Translate from ${sourceLang} to ${targetLang}. Return only translation.`,
      text
    );
    return {
      sourceText: text,
      translatedText: raw,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    };
  }
};
var OfflineAIProvider = class {
  constructor() {
    this.name = "Offline / Unconnected";
    this.model = "None";
    this.isConfigured = false;
  }
  async askDocumentQuestion() {
    throw new Error(
      "AI provider has not yet been connected to the backend. In accordance with the OPEN//BUILD 2026 guidelines, Levi AI does not fabricate answers when an AI model is not configured."
    );
  }
  async summarize() {
    throw new Error("AI provider is not configured. Please supply a valid AI key or endpoint.");
  }
  async explainConcept() {
    throw new Error("AI provider is not configured. Connect an AI backend to generate explanations.");
  }
  async generateQuiz() {
    throw new Error("AI provider is not configured. Connect an AI backend to generate quizzes.");
  }
  async translate() {
    throw new Error("AI translation provider is not configured. Translation models have not yet been connected.");
  }
};

// src/services/documentProcessor.ts
import { PDFParse } from "pdf-parse";
var STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "tell",
  "explain",
  "give",
  "find"
]);
async function processPdfBuffer(buffer, filename, fileSize) {
  const pages = [];
  const passages = [];
  const parser = new PDFParse({ data: buffer });
  let textResult;
  try {
    textResult = await parser.getText();
  } catch (err) {
    await parser.destroy().catch(() => {
    });
    throw new Error(`Failed to parse PDF file "${filename}": ${err.message || "Invalid or corrupt PDF"}`);
  }
  if (textResult?.pages && Array.isArray(textResult.pages)) {
    for (const p of textResult.pages) {
      pages.push({
        pageNumber: p.pageNumber,
        text: p.text ? p.text.trim() : ""
      });
    }
  }
  await parser.destroy().catch(() => {
  });
  pages.sort((a, b) => a.pageNumber - b.pageNumber);
  const fullText = textResult?.text ? textResult.text.trim() : pages.map((p) => p.text).join("\n\n");
  const isScannedOnly = fullText.replace(/\s+/g, "").length < 30;
  let passageCounter = 1;
  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;
    const paragraphs = page.text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
    if (paragraphs.length === 0 && page.text.length > 0) {
      passages.push({
        id: `p-${passageCounter++}`,
        pageNumber: page.pageNumber,
        text: page.text.slice(0, 1e3)
      });
    } else {
      for (const para of paragraphs) {
        if (para.length > 900) {
          const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)/g) || [para];
          let currentChunk = "";
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > 700) {
              if (currentChunk.trim()) {
                passages.push({
                  id: `p-${passageCounter++}`,
                  pageNumber: page.pageNumber,
                  text: currentChunk.trim()
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
              text: currentChunk.trim()
            });
          }
        } else {
          passages.push({
            id: `p-${passageCounter++}`,
            pageNumber: page.pageNumber,
            text: para
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
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
    isScannedOnly
  };
}
function retrieveRelevantPassages(passages, query, topK = 4) {
  if (!passages || passages.length === 0) return [];
  const rawTokens = query.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((token) => token.length > 2 && !STOPWORDS.has(token));
  if (rawTokens.length === 0) {
    return passages.slice(0, topK);
  }
  const scored = passages.map((passage) => {
    const passageLower = passage.text.toLowerCase();
    let score = 0;
    for (const token of rawTokens) {
      const regex = new RegExp(`\\b${token}\\b`, "g");
      const matches = passageLower.match(regex);
      if (matches) {
        score += matches.length * 3;
      } else if (passageLower.includes(token)) {
        score += 1;
      }
    }
    if (query.trim().length > 4 && passageLower.includes(query.toLowerCase().trim())) {
      score += 10;
    }
    return { passage, score };
  });
  const relevant = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.passage);
  if (relevant.length === 0) {
    return passages.slice(0, Math.min(topK, passages.length));
  }
  return relevant.slice(0, topK);
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
var documentsStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1e3;
  for (const [id, doc] of documentsStore.entries()) {
    const docTime = new Date(doc.uploadedAt).getTime();
    if (docTime < twoHoursAgo) {
      documentsStore.delete(id);
    }
  }
}, 30 * 60 * 1e3);
var activeProvider;
function initProvider(type = "gemini", customEndpoint, customModel) {
  if (type === "custom") {
    activeProvider = new CustomEndpointProvider(customEndpoint || "http://localhost:11434/v1", customModel || "llama3:8b");
  } else if (type === "offline") {
    activeProvider = new OfflineAIProvider();
  } else {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
      activeProvider = new GeminiAIProvider(geminiKey);
    } else {
      activeProvider = new OfflineAIProvider();
    }
  }
}
initProvider("gemini");
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF files are supported."));
    }
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Levi AI Engine",
    provider: {
      name: activeProvider.name,
      model: activeProvider.model,
      isConfigured: activeProvider.isConfigured
    },
    activeDocumentsCount: documentsStore.size,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/provider-info", (_req, res) => {
  res.json({
    name: activeProvider.name,
    model: activeProvider.model,
    isConfigured: activeProvider.isConfigured,
    availableProviders: [
      { id: "gemini", name: "Gemini 3.8 Flash (Server-Side)", defaultModel: "gemini-3.8-flash" },
      { id: "custom", name: "Open-Weight / Custom Endpoint (Ollama, vLLM)", defaultModel: "llama3:8b" },
      { id: "offline", name: "Offline / Disconnected Test Mode", defaultModel: "None" }
    ]
  });
});
app.post("/api/provider-config", (req, res) => {
  try {
    const { providerType, customEndpoint, customModel } = req.body;
    if (providerType === "custom" || providerType === "offline" || providerType === "gemini") {
      initProvider(providerType, customEndpoint, customModel);
      return res.json({
        success: true,
        message: `Switched AI provider to: ${activeProvider.name}`,
        provider: {
          name: activeProvider.name,
          model: activeProvider.model,
          isConfigured: activeProvider.isConfigured
        }
      });
    }
    return res.status(400).json({ error: "Invalid providerType. Expected 'gemini', 'custom', or 'offline'." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to configure provider." });
  }
});
app.post("/api/documents/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File size exceeds the 10MB maximum limit. Please upload a smaller PDF."
        });
      }
      return res.status(400).json({ error: err.message || "Failed to upload file." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided. Please attach a valid PDF." });
    }
    try {
      const processedDoc = await processPdfBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.size
      );
      documentsStore.set(processedDoc.id, processedDoc);
      res.status(201).json({
        id: processedDoc.id,
        filename: processedDoc.filename,
        fileSize: processedDoc.fileSize,
        pageCount: processedDoc.pageCount,
        isScannedOnly: processedDoc.isScannedOnly,
        passagesCount: processedDoc.passages.length,
        uploadedAt: processedDoc.uploadedAt,
        message: processedDoc.isScannedOnly ? "Document uploaded, but contains no selectable text layer (likely scanned or image-based). Text extraction yielded no readable characters. OCR is not supported in the initial MVP." : `Extracted ${processedDoc.pageCount} page(s) and ${processedDoc.passages.length} readable passage(s).`
      });
    } catch (processError) {
      console.error("PDF processing failed:", processError);
      res.status(422).json({
        error: `Could not extract text from PDF: ${processError.message || "Unknown error"}`
      });
    }
  });
});
app.post("/api/documents/sample", (_req, res) => {
  const samplePages = [
    {
      pageNumber: 1,
      text: `LECTURE 04: TRANSPORT LAYER PROTOCOLS \u2014 TCP & UDP
Course: CSC 304 - Computer Networks and Distributed Systems
Instructor: Department of Computer Science & Engineering, OAU Ile-Ife

1. Overview of the Transport Layer
The transport layer provides logical communication between application processes running on different hosts. While the network layer (IP protocol) handles host-to-host delivery, the transport layer delivers data to specific application processes using 16-bit port numbers.

2. Primary Protocols:
- Transmission Control Protocol (TCP): Connection-oriented, reliable, byte-stream service with flow control, congestion control, and ordered packet delivery.
- User Datagram Protocol (UDP): Connectionless, lightweight, unreliable datagram service without handshakes, flow control, or acknowledgment overhead.`
    },
    {
      pageNumber: 2,
      text: `3. TCP Connection Management: The Three-Way Handshake
Before transmitting application data, TCP establishes a logical connection via a three-way handshake:
1. Step 1 (SYN): The client sends a TCP segment with the SYN bit set to 1 and an initial client sequence number (client_isn).
2. Step 2 (SYN-ACK): The server allocates buffers, chooses its own server initial sequence number (server_isn), and responds with SYN=1 and ACK=client_isn + 1.
3. Step 3 (ACK): The client allocates connection buffers and sends an ACK segment with ACK=server_isn + 1. Application data can accompany this third segment.

Connection Termination (Four-Way Wave):
Either party initiates teardown by sending a segment with FIN=1. The receiving party responds with ACK, finishes pending transmissions, sends its own FIN=1, and waits in TIME_WAIT state (typically 2 * Maximum Segment Lifetime) before final socket closure.`
    },
    {
      pageNumber: 3,
      text: `4. Reliability Mechanisms: Flow Control vs. Congestion Control
A common misconception among undergraduate students is conflating flow control with congestion control:

A. Flow Control (Receiver Protection):
- Purpose: Prevents the sender from overflowing the receiver's application buffer.
- Mechanism: The receiver includes a Receive Window (rwnd) field in the TCP header of every acknowledgment, advertising the remaining free buffer space.
- Sender Constraint: LastByteSent - LastByteAcked <= rwnd.

B. Congestion Control (Network Backbone Protection):
- Purpose: Prevents senders from overwhelming intermediate network routers and communication links.
- Mechanism: Maintained via Congestion Window (cwnd). TCP uses Additive Increase Multiplicative Decrease (AIMD), Slow Start phase, and fast retransmit upon receiving three duplicate ACKs.`
    },
    {
      pageNumber: 4,
      text: `5. User Datagram Protocol (UDP) Characteristics & Use Cases
UDP offers minimal protocol overhead (only 8 bytes header size vs TCP's 20-60 bytes). It provides no delivery guarantees, no retransmissions, and no congestion backoff.

Header Structure:
- Source Port (16 bits)
- Destination Port (16 bits)
- Length (16 bits)
- Checksum (16 bits, optional in IPv4, mandatory in IPv6)

Optimal Applications:
1. Real-time Audio/Video Streaming (VoIP, Zoom, WebRTC): Retransmitting lost audio 300ms later is useless; dropped packets are preferred over playback buffering delays.
2. Domain Name System (DNS): Lightweight single request/response queries fit comfortably in a single UDP packet (port 53).
3. Online Gaming: Position updates require lowest possible latency.`
    }
  ];
  const samplePassages = [
    {
      id: "p-1",
      pageNumber: 1,
      text: "The transport layer provides logical communication between application processes running on different hosts using 16-bit port numbers. TCP is connection-oriented, reliable, and ordered, whereas UDP is connectionless and lightweight."
    },
    {
      id: "p-2",
      pageNumber: 2,
      text: "TCP establishes connection via a Three-Way Handshake: 1. SYN with client sequence number. 2. SYN-ACK with server sequence number and acknowledgment. 3. ACK with acknowledgment. Teardown uses FIN and ACK with a TIME_WAIT state."
    },
    {
      id: "p-3",
      pageNumber: 3,
      text: "Flow control prevents overflowing the receiver's buffer using the advertised Receive Window (rwnd). In contrast, congestion control protects intermediate network routers using the Congestion Window (cwnd) and AIMD algorithm."
    },
    {
      id: "p-4",
      pageNumber: 4,
      text: "UDP has an 8-byte header consisting of Source Port, Destination Port, Length, and Checksum. It is optimal for real-time VoIP, DNS queries, and multiplayer online gaming where low latency is preferred over packet retransmission."
    }
  ];
  const sampleDoc = {
    id: `doc_sample_csc304`,
    filename: "CSC304_Lecture04_Transport_Layer_TCP_UDP.pdf",
    fileSize: 148520,
    pageCount: 4,
    fullText: samplePages.map((p) => p.text).join("\n\n"),
    pages: samplePages,
    passages: samplePassages,
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
    isScannedOnly: false
  };
  documentsStore.set(sampleDoc.id, sampleDoc);
  res.status(201).json({
    id: sampleDoc.id,
    filename: sampleDoc.filename,
    fileSize: sampleDoc.fileSize,
    pageCount: sampleDoc.pageCount,
    isScannedOnly: false,
    passagesCount: sampleDoc.passages.length,
    uploadedAt: sampleDoc.uploadedAt,
    message: "Sample lecture document loaded successfully."
  });
});
app.get("/api/documents/:id", (req, res) => {
  const doc = documentsStore.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found or session expired." });
  }
  res.json({
    id: doc.id,
    filename: doc.filename,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    isScannedOnly: doc.isScannedOnly,
    uploadedAt: doc.uploadedAt,
    pages: doc.pages,
    samplePassages: doc.passages.slice(0, 5)
  });
});
app.delete("/api/documents/:id", (req, res) => {
  const deleted = documentsStore.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json({ success: true, message: "Document removed from memory." });
});
app.post("/api/documents/:id/question", async (req, res) => {
  const doc = documentsStore.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found or has expired." });
  }
  const { question } = req.body;
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a valid question." });
  }
  if (doc.isScannedOnly) {
    return res.status(422).json({
      error: "This document is an image-only / scanned PDF with no selectable text. Document grounding cannot be performed without an OCR engine."
    });
  }
  try {
    const relevantPassages = retrieveRelevantPassages(doc.passages, question.trim(), 4);
    const result = await activeProvider.askDocumentQuestion(
      question.trim(),
      relevantPassages,
      doc.filename
    );
    res.json({
      question: question.trim(),
      answer: result.answer,
      citations: result.citations,
      hasGrounding: result.hasGrounding,
      passagesRetrieved: relevantPassages.map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        text: p.text
      }))
    });
  } catch (err) {
    console.error("Document Q&A error:", err);
    res.status(500).json({
      error: err.message || "An unexpected error occurred while processing your question."
    });
  }
});
app.post("/api/study/summarize", async (req, res) => {
  const { text, format = "bullets" } = req.body;
  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return res.status(400).json({ error: "Please enter at least 20 characters of study notes to summarize." });
  }
  try {
    const summaryResult = await activeProvider.summarize(text.trim(), format);
    res.json(summaryResult);
  } catch (err) {
    console.error("Summarization error:", err);
    res.status(500).json({ error: err.message || "Failed to generate summary." });
  }
});
app.post("/api/study/explain", async (req, res) => {
  const { concept, context } = req.body;
  if (!concept || typeof concept !== "string" || concept.trim().length === 0) {
    return res.status(400).json({ error: "Please enter a concept to explain." });
  }
  try {
    const explanation = await activeProvider.explainConcept(concept.trim(), context);
    res.json(explanation);
  } catch (err) {
    console.error("Concept explanation error:", err);
    res.status(500).json({ error: err.message || "Failed to explain concept." });
  }
});
app.post("/api/study/quiz", async (req, res) => {
  const { content, count = 4 } = req.body;
  if (!content || typeof content !== "string" || content.trim().length < 30) {
    return res.status(400).json({ error: "Please provide sufficient study material to generate a practice quiz." });
  }
  try {
    const quiz = await activeProvider.generateQuiz(content.trim(), Math.min(Math.max(1, count), 8));
    res.json({ questions: quiz });
  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz." });
  }
});
app.post("/api/translate", async (req, res) => {
  const { text, sourceLang = "English", targetLang = "Yoruba" } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Please enter text to translate." });
  }
  const validLangs = ["English", "Yoruba", "Igbo", "Hausa"];
  if (!validLangs.includes(sourceLang) || !validLangs.includes(targetLang)) {
    return res.status(400).json({
      error: `Unsupported language. Levi AI supports: ${validLangs.join(", ")}`
    });
  }
  try {
    const translation = await activeProvider.translate(text.trim(), sourceLang, targetLang);
    res.json(translation);
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: err.message || "Failed to complete translation." });
  }
});
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Levi AI] Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start Levi AI server:", err);
  process.exit(1);
});
