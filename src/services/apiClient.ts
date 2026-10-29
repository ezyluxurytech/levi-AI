import {
  DocumentMetadata,
  DocumentPage,
  ChatMessage,
  Citation,
  Passage,
  QuizQuestion,
  SummaryData,
  ExplanationData,
  TranslationData,
  ProviderInfo,
} from "../types/index.ts";

export const apiClient = {
  async getHealth() {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("Failed to check backend health");
    return res.json();
  },

  async getProviderInfo(): Promise<ProviderInfo> {
    const res = await fetch("/api/provider-info");
    if (!res.ok) throw new Error("Failed to load provider info");
    return res.json();
  },

  async setProviderConfig(payload: {
    providerType: "gemini" | "custom" | "offline";
    customEndpoint?: string;
    customModel?: string;
  }) {
    const res = await fetch("/api/provider-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update AI provider configuration");
    }
    return res.json();
  },

  async uploadDocument(file: File): Promise<DocumentMetadata> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed with status ${res.status}`);
    }

    return res.json();
  },

  async uploadBatchDocuments(files: File[]): Promise<{
    documents: DocumentMetadata[];
    message: string;
    totalCount: number;
    ignoredCount?: number;
    errors?: Array<{ filename: string; error: string }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch("/api/documents/batch", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Folder upload failed with status ${res.status}`);
    }

    return res.json();
  },

  async loadSampleDocument(): Promise<DocumentMetadata> {
    const res = await fetch("/api/documents/sample", {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load sample document");
    }
    return res.json();
  },

  async getDocument(id: string): Promise<{
    id: string;
    filename: string;
    fileSize: number;
    pageCount: number;
    isScannedOnly: boolean;
    uploadedAt: string;
    pages: DocumentPage[];
    samplePassages: Passage[];
  }> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error("Document not found or session expired");
    return res.json();
  },

  async askDocumentQuestion(
    docId: string,
    question: string
  ): Promise<{
    question: string;
    answer: string;
    citations: Citation[];
    hasGrounding: boolean;
    passagesRetrieved: Passage[];
  }> {
    const res = await fetch(`/api/documents/${docId}/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to get answer for question");
    }

    return res.json();
  },

  async summarizeNotes(
    text: string,
    format: "bullets" | "executive" | "key_takeaways" = "bullets"
  ): Promise<SummaryData> {
    const res = await fetch("/api/study/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, format }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to summarize study notes");
    }

    return res.json();
  },

  async explainConcept(
    concept: string,
    context?: string
  ): Promise<ExplanationData> {
    const res = await fetch("/api/study/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, context }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to explain concept");
    }

    return res.json();
  },

  async generateQuiz(content: string, count: number = 4): Promise<QuizQuestion[]> {
    const res = await fetch("/api/study/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, count }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate quiz questions");
    }

    const data = await res.json();
    return data.questions;
  },

  async translate(
    text: string,
    sourceLang: string = "English",
    targetLang: string = "Yoruba"
  ): Promise<TranslationData> {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Translation request failed");
    }

    return res.json();
  },
};
