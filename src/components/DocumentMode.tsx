import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Send,
  AlertCircle,
  FileSearch,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Search,
} from "lucide-react";
import {
  DocumentMetadata,
  DocumentPage,
  ChatMessage,
  Citation,
  Passage,
} from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

interface DocumentModeProps {
  documents: DocumentMetadata[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  onLoadSampleDocument?: () => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
  onLogActivity: (title: string, details?: string) => void;
}

export const DocumentMode: React.FC<DocumentModeProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onFileUpload,
  onLoadSampleDocument,
  isUploading,
  uploadError,
  onLogActivity,
}) => {
  const [docDetails, setDocDetails] = useState<{
    pages: DocumentPage[];
    samplePassages: Passage[];
  } | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [textSearchQuery, setTextSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentDoc = documents.find((d) => d.id === activeDocumentId) || documents[0] || null;

  // Load document pages and text whenever current document changes
  useEffect(() => {
    if (currentDoc) {
      apiClient
        .getDocument(currentDoc.id)
        .then((res) => {
          setDocDetails({
            pages: res.pages,
            samplePassages: res.samplePassages,
          });
          setActivePageIndex(0);
        })
        .catch((err) => {
          console.error("Failed to load document details:", err);
        });
    } else {
      setDocDetails(null);
    }
  }, [currentDoc?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || questionInput).trim();
    if (!q || !currentDoc) return;

    setQuestionInput("");
    setAskError(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsAsking(true);

    try {
      const response = await apiClient.askDocumentQuestion(currentDoc.id, q);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: response.citations,
        passagesRetrieved: response.passagesRetrieved,
        hasGrounding: response.hasGrounding,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      onLogActivity(`Document Q&A: ${currentDoc.filename}`, `Q: ${q.slice(0, 40)}...`);
    } catch (err: any) {
      setAskError(err.message || "Failed to process question.");
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "assistant",
        text: `Error: ${err.message || "Could not retrieve answer."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const jumpToPage = (pageNumber: number) => {
    if (docDetails && pageNumber >= 1 && pageNumber <= docDetails.pages.length) {
      setActivePageIndex(pageNumber - 1);
    }
  };

  // Filtered page content if user is searching
  const currentPage = docDetails?.pages[activePageIndex];
  const totalPages = docDetails?.pages.length || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 shadow-2xs flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/Levi_AI_Learning_Logo_a2b86b0f.png"
              alt="Levi AI Document Workspace"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Document Workspace
              {currentDoc && (
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({(currentDoc.fileSize / 1024).toFixed(0)} KB)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Passage extraction with verified page citations and no hallucinated facts.
            </p>
          </div>
        </div>

        {/* Upload Button & Selector */}
        <div className="flex items-center gap-2">
          {documents.length > 1 && (
            <select
              value={currentDoc?.id || ""}
              onChange={(e) => onSelectDocument(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename.length > 25 ? d.filename.slice(0, 22) + "..." : d.filename}
                </option>
              ))}
            </select>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "Uploading..." : "Upload New PDF"}</span>
          </button>

          {onLoadSampleDocument && (
            <button
              onClick={onLoadSampleDocument}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
              title="Load Computer Networks sample lecture"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample Lecture</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Empty State when no document has been uploaded */}
      {!currentDoc ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/80 p-2.5 shadow-sm flex items-center justify-center mx-auto mb-4">
            <img
              src="/assets/aistudio/Levi_AI_Learning_Logo_a2b86b0f.png"
              alt="Levi AI Document Assistant"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[10px] font-semibold text-indigo-700 mb-2">
            Learn • Understand • Grow
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Academic Document Selected
          </h3>
          <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
            Upload your university lecture notes, research paper, or textbook chapter in PDF format (up to 10MB), or test immediately with a sample lecture.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Select PDF File
            </button>
            {onLoadSampleDocument && (
              <button
                onClick={onLoadSampleDocument}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Load Sample Academic PDF
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Scanned / Image-Only Alert Banner */}
          {currentDoc.isScannedOnly && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Image-Only / Scanned PDF Detected
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  PyMuPDF detected that this document contains scanned images without an underlying selectable text layer.
                  OCR is not included for scanned files.
                  Document-grounded question answering requires a PDF with extractable text. Please upload a digital PDF document.
                </p>
              </div>
            </div>
          )}

          {/* Document Workspace 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Extracted Text & Page Navigation (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 flex flex-col h-[650px] shadow-2xs">
              {/* Header with Page Nav and Search */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                    {currentDoc.filename}
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                    <button
                      onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                      disabled={activePageIndex === 0}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="tabular-nums px-1">
                      Page {activePageIndex + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setActivePageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={activePageIndex >= totalPages - 1}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* In-page search */}
                <div className="relative w-44">
                  <input
                    type="text"
                    placeholder="Find in page..."
                    value={textSearchQuery}
                    onChange={(e) => setTextSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-7 pr-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Page Content Viewer */}
              <div className="flex-1 p-5 overflow-y-auto text-xs leading-relaxed text-slate-800 font-sans whitespace-pre-wrap select-text bg-slate-50/40">
                {currentPage?.text ? (
                  <div>{currentPage.text}</div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                    <Info className="w-6 h-6 mb-2 text-slate-300" />
                    <p className="font-medium">No selectable text extracted on this page.</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      This page may contain scanned diagrams or images.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom metadata strip */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Extraction Engine: PyMuPDF</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{docDetails?.pages.length || 0} Pages</span>
                </div>
                {currentPage?.text && (
                  <button
                    onClick={() => copyToClipboard(currentPage.text, `page-${activePageIndex}`)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {copiedId === `page-${activePageIndex}` ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Page Text</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Grounded Q&A Assistant (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 flex flex-col h-[650px] shadow-2xs">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Document-Grounded Q&A
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Answers strictly derived from source passages
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Strict Grounding
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Ask questions about "{currentDoc.filename}"
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                        Levi AI retrieves the most relevant passages and provides citations with verified page numbers.
                      </p>
                    </div>

                    {/* Pre-baked Sample Questions */}
                    <div className="pt-2 text-left space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                        Suggested Inquiries:
                      </p>
                      <button
                        onClick={() => handleAskQuestion("What are the primary topics and key concepts covered in this document?")}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-900 transition-colors"
                      >
                        "What are the primary topics covered?"
                      </button>
                      <button
                        onClick={() => handleAskQuestion("Can you summarize the main findings or methodology mentioned?")}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-900 transition-colors"
                      >
                        "Summarize the main findings or methodology"
                      </button>
                      <button
                        onClick={() => handleAskQuestion("What conclusions or recommendations does the document reach?")}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-900 transition-colors"
                      >
                        "What conclusions does the document reach?"
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Page Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Source References:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((cite, i) => (
                                <button
                                  key={i}
                                  onClick={() => jumpToPage(cite.pageNumber)}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                                  title={`Snippet: "${cite.snippet}"`}
                                >
                                  <span>Page {cite.pageNumber}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))
                )}

                {isAsking && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Searching passages & formulating grounded answer...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Box */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask a question about this document..."
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    disabled={isAsking || currentDoc.isScannedOnly}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!questionInput.trim() || isAsking || currentDoc.isScannedOnly}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                {currentDoc.isScannedOnly && (
                  <p className="text-[10px] text-amber-600 mt-1.5">
                    Q&A is disabled for scanned/image PDFs because no selectable text exists.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
