# Levi AI — Intelligent Learning & Document Assistant

> **OPEN//BUILD 2026 Project Submission**  
> Developed for Open Source Community Africa (**OSCA**), Ile-Ife.  
> An open-source, responsible AI learning assistant designed to empower university students with document-grounded understanding, active study workflows, and multilingual translations into Nigerian languages.

---

## 🌟 Overview & Core Capabilities

Levi AI solves the critical challenge of academic comprehension and accessibility for higher-education students across Africa. Rather than functioning as a generic conversational chatbot or fabricating unsupported answers, Levi AI enforces **strict document grounding** and responsible AI boundaries.

The application features three dedicated modes:

1. **📄 Document Mode (Document Understanding & Grounded Q&A):**
   - Drag-and-drop PDF ingestion (up to 10MB) with frontend and backend file type and size validation.
   - Text extraction and page boundary tracking using **PyMuPDF**.
   - Passage-level semantic retrieval that extracts relevant paragraphs and provides verified page citations (e.g., `Page 2`, `Page 4`).
   - Honest uncertainty: When a document does not contain sufficient information to answer a question, Levi AI explicitly acknowledges the limitation rather than hallucinating.
   - Scanned document detection: Accurately identifies image-only/scanned PDFs lacking a selectable text layer and communicates that OCR is not included in the initial MVP.

2. **🎓 Study Mode (Synthesis & Active Recall):**
   - **Summarize Notes:** Converts dense academic lecture notes into structured bullet highlights, executive summaries, or exam takeaways with estimated reading time.
   - **Explain Concepts:** Deconstructs difficult theoretical concepts into plain language, memorable real-world analogies, and university exam tips.
   - **Practice Quizzes:** Dynamically generates multiple-choice practice questions with option feedback, hint toggles, answer explanations, and mastery scoring.

3. **🌍 Language Mode (Multilingual Nigerian Translations):**
   - High-fidelity academic translation supporting **English**, **Èdè Yorùbá**, **Ásụ̀sụ́ Ìgbò**, and **Harshen Hausa**.
   - Preserves grammatical tone marks and academic terminology.
   - Includes preset academic phrases for university coursework, professor consultations, and exam instructions.

---

## 🏛️ AI Architecture & Replaceable Provider Pattern

In accordance with OPEN//BUILD 2026 guidelines, Levi AI does not hard-code a single AI provider or falsely claim an open-weight model is permanently connected.

The backend implements an abstract `AIProvider` interface:
```typescript
export interface AIProvider {
  name: string;
  model: string;
  isConfigured: boolean;
  askDocumentQuestion(question: string, passages: { pageNumber: number; text: string }[], documentTitle: string): Promise<GroundedAnswer>;
  summarize(text: string, format: 'bullets' | 'executive' | 'key_takeaways'): Promise<SummaryResult>;
  explainConcept(concept: string, context?: string): Promise<ExplanationResult>;
  generateQuiz(content: string, count: number): Promise<QuizQuestion[]>;
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
}
```

### Supported Implementations:
- **GeminiAIProvider:** Server-side integration with `gemini-3.8-flash` via `@google/genai` (User-Agent telemetry enabled, API keys strictly kept on server).
- **CustomEndpointProvider:** Compatible with any local or self-hosted OpenAI-compatible endpoint (e.g. Ollama `llama3:8b`, vLLM, HuggingFace TGI).
- **OfflineAIProvider:** Graceful fallback test mode that communicates unconfigured status without returning hallucinated or random responses.

---

## 🛠️ Dual Backend Architecture

Levi AI is architected to support both modern full-stack development and standalone Python microservice deployments:

### 1. Active Web Runtime (Node.js + Express + Vite)
- Runs the single-page application and API proxy on port `3000`.
- Fast in-memory PDF extraction and passage retrieval.
- Hot-reloadable frontend with Tailwind CSS and Lucide React.

### 2. Reference Python FastAPI Backend (`/backend`)
- Standalone Python 3 service using **FastAPI** and **PyMuPDF (`fitz`)**.
- Pydantic models for request/response serialization.
- Fully documented interactive Swagger UI at `/docs`.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- Python >= 3.10 (optional, for running the Python backend)

### Running the Web Application
```bash
# Install dependencies
npm install

# Start the full-stack server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Python FastAPI Backend (Optional)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🔒 Security & Open-Source Integrity

- **Client/Server Secret Decoupling:** Model credentials reside exclusively on the backend; never exposed to browser bundles.
- **Strict Grounding:** Prompts instruct the model to base answers strictly on retrieved passages with citations.
- **Data Privacy & Ephemeral Retention:** Uploaded documents are kept in ephemeral memory and automatically purged after 2 hours; no unconsented storage or telemetry.
- **File Validation:** Strict 10MB limit and MIME-type enforcement prevent denial-of-service and buffer overflows.

---

## 👥 Credits

Developed for **OPEN//BUILD 2026** by the **Open Source Community Africa (OSCA), Ile-Ife chapter**.
Licensed under the Apache-2.0 License.
