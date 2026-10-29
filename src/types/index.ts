export type AppMode = 'dashboard' | 'study' | 'document' | 'language';

export interface AuthUser {
  email: string;
  name: string;
  institution?: string;
  loginAt: string;
}

export interface Citation {
  pageNumber: number;
  snippet: string;
}

export interface Passage {
  id: string;
  pageNumber: number;
  text: string;
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  isScannedOnly: boolean;
  passagesCount: number;
  uploadedAt: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Citation[];
  passagesRetrieved?: Passage[];
  hasGrounding?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export interface SummaryData {
  summary: string;
  keyPoints: string[];
  readingTimeMinutes: number;
}

export interface ExplanationData {
  concept: string;
  simpleExplanation: string;
  intuitiveAnalogy: string;
  examTakeaway: string;
}

export interface TranslationData {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  notes?: string;
}

export interface ProviderInfo {
  name: string;
  model: string;
  isConfigured: boolean;
  availableProviders: {
    id: string;
    name: string;
    defaultModel: string;
  }[];
}

export interface RecentActivityItem {
  id: string;
  type: 'document_qa' | 'study_summary' | 'study_quiz' | 'translation';
  title: string;
  timestamp: string;
  mode: AppMode;
  details?: string;
}
