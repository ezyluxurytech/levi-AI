from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import os

from app.schemas.models import (
    DocumentUploadResponse, QuestionRequest, QuestionResponse,
    SummarizeRequest, SummarizeResponse, ExplainRequest, ExplainResponse,
    QuizRequest, QuizResponse, TranslateRequest, TranslateResponse
)
from app.services.pdf_extractor import extract_pdf_data, rank_passages
from app.services.ai_provider import GeminiAIProvider, OfflineAIProvider, BaseAIProvider

app = FastAPI(
    title="Levi AI — Backend API",
    description="Backend API for Levi AI",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document store
DOCUMENTS_STORE: Dict[str, Dict[str, Any]] = {}

def get_ai_provider() -> BaseAIProvider:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "MY_GEMINI_API_KEY":
        return GeminiAIProvider(api_key)
    return OfflineAIProvider()

@app.get("/health")
def health_check(provider: BaseAIProvider = Depends(get_ai_provider)):
    return {
        "status": "ok",
        "service": "Levi AI FastAPI Engine",
        "provider": provider.name,
        "is_configured": provider.is_configured
    }

@app.post("/api/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 10MB.")

    data = extract_pdf_data(contents, file.filename)
    DOCUMENTS_STORE[data["id"]] = data

    message = (
        "Document uploaded, but contains no selectable text layer (likely scanned or image-based). OCR is not supported in the initial MVP."
        if data["is_scanned_only"]
        else f"Extracted {data['page_count']} page(s) and {len(data['passages'])} passage(s)."
    )

    return DocumentUploadResponse(
        id=data["id"],
        filename=data["filename"],
        file_size=len(contents),
        page_count=data["page_count"],
        is_scanned_only=data["is_scanned_only"],
        passages_count=len(data["passages"]),
        uploaded_at="2026-10-27T00:00:00Z",
        message=message
    )

@app.post("/api/documents/{doc_id}/question", response_model=QuestionResponse)
def ask_question(doc_id: str, payload: QuestionRequest, provider: BaseAIProvider = Depends(get_ai_provider)):
    doc = DOCUMENTS_STORE.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    if doc["is_scanned_only"]:
        raise HTTPException(status_code=422, detail="Document has no selectable text layer (scanned/image).")

    passages = rank_passages(doc["passages"], payload.question, top_k=4)
    try:
        res = provider.ask_document_question(payload.question, passages, doc["filename"])
        return QuestionResponse(
            question=payload.question,
            answer=res["answer"],
            citations=res["citations"],
            has_grounding=res["has_grounding"],
            passages_retrieved=passages
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/study/summarize", response_model=SummarizeResponse)
def summarize(payload: SummarizeRequest, provider: BaseAIProvider = Depends(get_ai_provider)):
    try:
        res = provider.summarize(payload.text, payload.format)
        return SummarizeResponse(**res)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/study/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest, provider: BaseAIProvider = Depends(get_ai_provider)):
    try:
        res = provider.explain_concept(payload.concept, payload.context)
        return ExplainResponse(**res)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/study/quiz", response_model=QuizResponse)
def generate_quiz(payload: QuizRequest, provider: BaseAIProvider = Depends(get_ai_provider)):
    try:
        questions = provider.generate_quiz(payload.content, payload.count)
        return QuizResponse(questions=questions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest, provider: BaseAIProvider = Depends(get_ai_provider)):
    try:
        res = provider.translate(payload.text, payload.source_lang, payload.target_lang)
        return TranslateResponse(**res)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
