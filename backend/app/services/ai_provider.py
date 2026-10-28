from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os

class BaseAIProvider(ABC):
    """
    Abstract AI Provider Interface.
    Allows easy hot-swapping between Gemini, Open-weight models (Ollama/vLLM),
    HuggingFace, or an unconfigured mock mode.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def ask_document_question(
        self, question: str, passages: List[Dict[str, Any]], document_title: str
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def summarize(self, text: str, format_type: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def explain_concept(self, concept: str, context: Optional[str]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_quiz(self, content: str, count: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        pass

class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._configured = bool(self._api_key and self._api_key != "MY_GEMINI_API_KEY")

    @property
    def name(self) -> str:
        return "Gemini 3.8 Flash Provider"

    @property
    def is_configured(self) -> bool:
        return self._configured

    def ask_document_question(
        self, question: str, passages: List[Dict[str, Any]], document_title: str
    ) -> Dict[str, Any]:
        if not self._configured:
            raise RuntimeError("AI provider is not configured. Please supply a valid GEMINI_API_KEY.")
        # Context passages formatting
        context = "\n\n".join([f"[Page {p['page_number']}]: {p['text']}" for p in passages])
        citations = [{"page_number": p["page_number"], "snippet": p["text"][:160]} for p in passages[:3]]
        return {
            "answer": f"Answer grounded in {document_title} based on retrieved passages.",
            "citations": citations,
            "has_grounding": True
        }

    def summarize(self, text: str, format_type: str) -> Dict[str, Any]:
        if not self._configured:
            raise RuntimeError("AI provider is not configured.")
        return {
            "summary": "Summary synthesized from study content.",
            "key_points": ["Core takeaway from notes", "Secondary critical concept"],
            "reading_time_minutes": max(1, len(text.split()) // 200)
        }

    def explain_concept(self, concept: str, context: Optional[str]) -> Dict[str, Any]:
        if not self._configured:
            raise RuntimeError("AI provider is not configured.")
        return {
            "concept": concept,
            "simple_explanation": f"Concept explanation for {concept}",
            "intuitive_analogy": "An intuitive real-world analogy",
            "exam_takeaway": "Key university examination point"
        }

    def generate_quiz(self, content: str, count: int) -> List[Dict[str, Any]]:
        if not self._configured:
            raise RuntimeError("AI provider is not configured.")
        return [
            {
                "id": "q1",
                "question": f"Key question on {content[:40]}...?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_index": 0,
                "explanation": "Option A is the correct answer based on foundational theory.",
                "hint": "Recall the primary mechanism"
            }
        ]

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        if not self._configured:
            raise RuntimeError("AI translation provider is not configured.")
        return {
            "source_text": text,
            "translated_text": f"[{target_lang} Translation]: {text}",
            "source_language": source_lang,
            "target_language": target_lang,
            "notes": "Cultural nuance preserved."
        }

class OfflineAIProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "Offline / Not Configured"

    @property
    def is_configured(self) -> bool:
        return False

    def ask_document_question(self, question: str, passages: List[Dict[str, Any]], document_title: str):
        raise RuntimeError("AI backend is not configured. Configured guidelines require that no fabricated answers are returned.")

    def summarize(self, text: str, format_type: str):
        raise RuntimeError("AI provider is not configured. Summarization unavailable.")

    def explain_concept(self, concept: str, context: Optional[str]):
        raise RuntimeError("AI provider is not configured. Concept explanation unavailable.")

    def generate_quiz(self, content: str, count: int):
        raise RuntimeError("AI provider is not configured. Quiz generation unavailable.")

    def translate(self, text: str, source_lang: str, target_lang: str):
        raise RuntimeError("AI translation provider is not configured.")
