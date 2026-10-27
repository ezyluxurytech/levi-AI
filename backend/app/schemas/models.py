from pydantic import BaseModel, Field
from typing import List, Optional

class PageModel(BaseModel):
    page_number: int
    text: str

class PassageModel(BaseModel):
    id: str
    page_number: int
    text: str

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    is_scanned_only: bool
    passages_count: int
    uploaded_at: str
    message: str

class CitationModel(BaseModel):
    page_number: int
    snippet: str

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The question about the document")

class QuestionResponse(BaseModel):
    question: str
    answer: str
    citations: List[CitationModel]
    has_grounding: bool
    passages_retrieved: List[PassageModel]

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=20)
    format: str = Field("bullets", pattern="^(bullets|executive|key_takeaways)$")

class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    reading_time_minutes: int

class ExplainRequest(BaseModel):
    concept: str = Field(..., min_length=1)
    context: Optional[str] = None

class ExplainResponse(BaseModel):
    concept: str
    simple_explanation: str
    intuitive_analogy: str
    exam_takeaway: str

class QuizQuestionModel(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    hint: Optional[str] = None

class QuizRequest(BaseModel):
    content: str = Field(..., min_length=30)
    count: int = Field(4, ge=1, le=8)

class QuizResponse(BaseModel):
    questions: List[QuizQuestionModel]

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_lang: str = Field("English")
    target_lang: str = Field("Yoruba")

class TranslateResponse(BaseModel):
    source_text: str
    translated_text: str
    source_language: str
    target_language: str
    notes: Optional[str] = None
