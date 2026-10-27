import fitz  # PyMuPDF
from typing import List, Dict, Any, Tuple
import uuid

def extract_pdf_data(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extracts selectable text and page boundaries using PyMuPDF (fitz).
    Detects scanned or image-only documents where selectable text is absent.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    passages = []
    total_text = ""
    passage_counter = 1

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_text = page.get_text("text").strip()
        total_text += page_text + "\n"

        pages.append({
            "page_number": page_num,
            "text": page_text
        })

        # Passage splitting by paragraphs / blocks
        if page_text:
            blocks = page_text.split("\n\n")
            for block in blocks:
                clean_block = block.strip()
                if len(clean_block) > 20:
                    passages.append({
                        "id": f"p-{passage_counter}",
                        "page_number": page_num,
                        "text": clean_block
                    })
                    passage_counter += 1

    doc.close()

    is_scanned_only = len(total_text.replace(" ", "").replace("\n", "")) < 30

    return {
        "id": f"doc_{uuid.uuid4().hex[:12]}",
        "filename": filename,
        "page_count": len(pages),
        "pages": pages,
        "passages": passages,
        "total_text": total_text,
        "is_scanned_only": is_scanned_only
    }

def rank_passages(passages: List[Dict[str, Any]], query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Scores and ranks passages based on keyword overlap with the query.
    """
    stopwords = {"what", "is", "the", "in", "and", "or", "to", "of", "a", "an", "how", "why", "when", "where"}
    tokens = [t.lower() for t in query.split() if len(t) > 2 and t.lower() not in stopwords]

    if not tokens:
        return passages[:top_k]

    scored = []
    for p in passages:
        text_lower = p["text"].lower()
        score = sum(text_lower.count(token) for token in tokens)
        if query.lower() in text_lower:
            score += 5
        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return passages[:top_k]

    return [item[1] for item in scored[:top_k]]
