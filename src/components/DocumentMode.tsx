import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  FolderUp,
  Folder,
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
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Files,
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
  onBatchUpload?: (files: File[]) => Promise<void>;
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
  onBatchUpload,
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
  const [mobileActiveTab, setMobileActiveTab] = useState<"pages" | "chat">("pages");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentDoc = documents.find((d) => d.id === activeDocumentId) || documents[0] || null;

  // Scan a dropped file entry or directory recursively
  const scanFileSystemEntry = async (entry: any, fileList: File[]): Promise<void> => {
    if (entry.isFile) {
      return new Promise<void>((resolve) => {
        entry.file(
          (file: File) => {
            fileList.push(file);
            resolve();
          },
          () => resolve()
        );
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readBatch = (): Promise<any[]> =>
        new Promise((resolve) => {
          dirReader.readEntries(
            (entries: any[]) => resolve(entries || []),
            () => resolve([])
          );
        });

      let batch = await readBatch();
      while (batch.length > 0) {
        for (const child of batch) {
          await scanFileSystemEntry(child, fileList);
        }
        batch = await readBatch();
      }
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (onBatchUpload) {
        await onBatchUpload(files);
      } else {
        const pdf = files.find((f) => f.name.toLowerCase().endsWith(".pdf"));
        if (pdf) await onFileUpload(pdf);
      }
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const extractedFiles: File[] = [];
      const traversePromises: Promise<void>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof (item as any).webkitGetAsEntry === "function") {
          const entry = (item as any).webkitGetAsEntry();
          if (entry) {
            traversePromises.push(scanFileSystemEntry(entry, extractedFiles));
          }
        } else {
          const f = item.getAsFile();
          if (f) extractedFiles.push(f);
        }
      }

      await Promise.all(traversePromises);

      if (extractedFiles.length > 1 || (extractedFiles.length === 1 && !extractedFiles[0].name.toLowerCase().endsWith(".pdf"))) {
        if (onBatchUpload) {
          await onBatchUpload(extractedFiles);
          return;
        }
      } else if (extractedFiles.length === 1) {
        await onFileUpload(extractedFiles[0]);
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      if (fileList.length > 1 && onBatchUpload) {
        await onBatchUpload(fileList);
      } else if (fileList.length > 0) {
        await onFileUpload(fileList[0]);
      }
    }
  };

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
        text: `Notice: ${err.message || "Could not retrieve grounded answer."}`,
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
      setMobileActiveTab("pages");
    }
  };

  const currentPage = docDetails?.pages[activePageIndex];
  const totalPages = docDetails?.pages.length || 1;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-6 max-w-7xl mx-auto py-2 transition-all ${
        isDragging ? "ring-2 ring-[#48DDF7] rounded-3xl bg-[#48DDF7]/5 p-2" : ""
      }`}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#10182A] p-4 sm:p-5 rounded-2xl border border-[#1F2942] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#080D1B] border border-[#48DDF7]/30 p-1 shadow-[0_0_15px_rgba(72,221,247,0.15)] flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI Document Lab"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Document Lab
              </h2>
              {currentDoc && (
                <span className="text-[11px] font-mono text-[#48DDF7] bg-[#080D1B] px-2 py-0.5 rounded border border-[#1F2942]">
                  {currentDoc.filename} ({(currentDoc.fileSize / 1024).toFixed(0)} KB)
                </span>
              )}
              {documents.length > 1 && (
                <span className="text-[10px] font-mono text-[#B6A1FF] bg-[#B6A1FF]/10 px-2 py-0.5 rounded border border-[#B6A1FF]/20 flex items-center gap-1">
                  <Files className="w-3 h-3" />
                  {documents.length} docs loaded
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict document grounding with verified page citations and no hallucinated facts.
            </p>
          </div>
        </div>

        {/* Upload Buttons & Selector */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {documents.length > 1 && (
            <select
              value={currentDoc?.id || ""}
              onChange={(e) => onSelectDocument(e.target.value)}
              className="text-xs bg-[#080D1B] border border-[#1F2942] rounded-xl px-3 py-2 font-medium text-slate-200 focus:outline-none focus:border-[#48DDF7]/40 max-w-[170px] sm:max-w-none cursor-pointer"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename.length > 25 ? d.filename.slice(0, 22) + "..." : d.filename}
                </option>
              ))}
            </select>
          )}

          {/* Single PDF Input */}
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

          {/* Directory / Folder Input */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: "", directory: "" } as any)}
            className="hidden"
            onChange={handleFolderChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#48DDF7] to-cyan-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(72,221,247,0.25)] disabled:opacity-50"
            title="Upload a single PDF document"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "Extracting..." : "Upload PDF"}</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B6A1FF] bg-[#080D1B] hover:bg-[#162238] rounded-xl transition-colors border border-[#B6A1FF]/40 hover:border-[#B6A1FF] disabled:opacity-50"
            title="Upload an entire directory/folder containing PDF lecture notes"
          >
            <FolderUp className="w-3.5 h-3.5 text-[#B6A1FF]" />
            <span>Upload Folder</span>
          </button>

          {onLoadSampleDocument && (
            <button
              onClick={onLoadSampleDocument}
              disabled={isUploading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-[#080D1B] hover:bg-[#162238] rounded-xl transition-colors border border-[#1F2942] hover:border-[#48DDF7]/40"
              title="Load Computer Networks sample lecture"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#48DDF7]" />
              <span className="hidden xl:inline">Load Sample</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Empty State when no document has been uploaded */}
      {!currentDoc ? (
        <div className="bg-[#10182A] border border-[#1F2942] rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto my-8 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-[#080D1B] border border-[#48DDF7]/40 p-2 shadow-[0_0_25px_rgba(72,221,247,0.25)] flex items-center justify-center mx-auto mb-4">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI Document Lab"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#080D1B] border border-[#48DDF7]/30 text-[10px] font-semibold text-[#48DDF7] mb-3">
            Learn · Understand · Grow
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            No Academic Document Selected
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Upload single PDF files or entire course folders (drag & drop supported). Non-PDF files are ignored automatically.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#48DDF7] to-cyan-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_15px_rgba(72,221,247,0.3)] disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Select PDF File
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#B6A1FF] bg-[#080D1B] hover:bg-[#162238] rounded-xl transition-colors border border-[#B6A1FF]/40 hover:border-[#B6A1FF] disabled:opacity-50"
            >
              <FolderUp className="w-4 h-4 text-[#B6A1FF]" />
              Upload Entire Folder
            </button>
            {onLoadSampleDocument && (
              <button
                onClick={onLoadSampleDocument}
                disabled={isUploading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-[#080D1B] hover:bg-[#162238] rounded-xl transition-colors border border-[#1F2942] hover:border-[#48DDF7]/40"
              >
                <BookOpen className="w-4 h-4 text-[#48DDF7]" />
                Sample Lecture
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Scanned / Image-Only Alert Banner */}
          {currentDoc.isScannedOnly && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Image-Only / Scanned PDF Detected
                </h4>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  PyMuPDF detected that this document contains scanned images without an underlying selectable text layer.
                  Document-grounded question answering requires a digital PDF with selectable text.
                </p>
              </div>
            </div>
          )}

          {/* Mobile View Switcher (Pages vs Chat) */}
          <div className="lg:hidden flex items-center bg-[#10182A] p-1.5 rounded-xl border border-[#1F2942]">
            <button
              onClick={() => setMobileActiveTab("pages")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mobileActiveTab === "pages"
                  ? "bg-[#080D1B] text-[#48DDF7] border border-[#48DDF7]/30 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pages ({activePageIndex + 1}/{totalPages})</span>
            </button>
            <button
              onClick={() => setMobileActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mobileActiveTab === "chat"
                  ? "bg-[#080D1B] text-[#48DDF7] border border-[#48DDF7]/30 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Q&A Conversation {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
            </button>
          </div>

          {/* Document Lab 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Extracted Text & Page Navigation (7 cols) */}
            <div className={`${mobileActiveTab === "pages" ? "flex" : "hidden lg:flex"} lg:col-span-7 bg-[#10182A] rounded-2xl border border-[#1F2942] flex-col h-[580px] sm:h-[650px] shadow-sm overflow-hidden`}>
              {/* Header with Page Nav and Search */}
              <div className="p-3 sm:p-3.5 border-b border-[#1F2942] bg-[#10182A] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[200px]">
                    {currentDoc.filename}
                  </span>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-slate-300 font-mono">
                    <button
                      onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                      disabled={activePageIndex === 0}
                      className="p-1 hover:bg-[#080D1B] text-slate-400 hover:text-white rounded disabled:opacity-30 transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="tabular-nums px-1 text-[11px] sm:text-xs text-[#48DDF7] font-semibold">
                      Page {activePageIndex + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setActivePageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={activePageIndex >= totalPages - 1}
                      className="p-1 hover:bg-[#080D1B] text-slate-400 hover:text-white rounded disabled:opacity-30 transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* In-page search */}
                <div className="relative w-full sm:w-44 mt-1 sm:mt-0">
                  <input
                    type="text"
                    placeholder="Find in page..."
                    value={textSearchQuery}
                    onChange={(e) => setTextSearchQuery(e.target.value)}
                    className="w-full text-xs bg-[#080D1B] border border-[#1F2942] rounded-lg pl-7 pr-2 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#48DDF7]/40"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Page Content Viewer */}
              <div className="flex-1 p-5 overflow-y-auto text-xs leading-relaxed text-slate-200 font-sans whitespace-pre-wrap select-text bg-[#080D1B]/70">
                {currentPage?.text ? (
                  <div className="font-mono text-[11px] leading-relaxed tracking-tight">
                    {currentPage.text}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
                    <Info className="w-6 h-6 mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">No selectable text extracted on this page.</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      This page may contain scanned diagrams or raster images.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom metadata strip */}
              <div className="px-4 py-2.5 bg-[#10182A] border-t border-[#1F2942] text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono">Engine: PyMuPDF</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono tabular-nums text-[#48DDF7]">{docDetails?.pages.length || 0} Pages Loaded</span>
                </div>
                {currentPage?.text && (
                  <button
                    onClick={() => copyToClipboard(currentPage.text, `page-${activePageIndex}`)}
                    className="flex items-center gap-1 text-[#48DDF7] hover:underline font-semibold"
                  >
                    {copiedId === `page-${activePageIndex}` ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied Page</span>
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
            <div className={`${mobileActiveTab === "chat" ? "flex" : "hidden lg:flex"} lg:col-span-5 bg-[#10182A] rounded-2xl border border-[#1F2942] flex-col h-[580px] sm:h-[650px] shadow-sm overflow-hidden`}>
              {/* Header */}
              <div className="p-3.5 border-b border-[#1F2942] bg-[#10182A] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Document-Grounded Q&A
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Derived strictly from verified source passages
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#48DDF7]/15 text-[#48DDF7] border border-[#48DDF7]/30 font-semibold">
                  Strict Grounding
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#080D1B]/50">
                {chatMessages.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#10182A] border border-[#1F2942] text-[#48DDF7] flex items-center justify-center mx-auto shadow-xs">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Inquire about "{currentDoc.filename}"
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Levi AI indexes source passages and attaches verified page references to every factual statement.
                      </p>
                    </div>

                    {/* Pre-baked Suggested Questions */}
                    <div className="pt-2 text-left space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1 font-mono">
                        Suggested Document Inquiries:
                      </p>
                      <button
                        onClick={() => handleAskQuestion("What are the primary topics and key concepts covered in this document?")}
                        className="w-full text-left p-2.5 rounded-xl bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#48DDF7]/40 text-xs text-slate-300 hover:text-white transition-all"
                      >
                        "What are the primary topics covered?"
                      </button>
                      <button
                        onClick={() => handleAskQuestion("Can you summarize the main findings or methodology mentioned?")}
                        className="w-full text-left p-2.5 rounded-xl bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#48DDF7]/40 text-xs text-slate-300 hover:text-white transition-all"
                      >
                        "Summarize the main findings or methodology"
                      </button>
                      <button
                        onClick={() => handleAskQuestion("What conclusions or recommendations does the document reach?")}
                        className="w-full text-left p-2.5 rounded-xl bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#48DDF7]/40 text-xs text-slate-300 hover:text-white transition-all"
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
                        className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-[#48DDF7] to-cyan-300 text-[#080D1B] font-semibold shadow-xs"
                            : "bg-[#10182A] text-slate-200 border border-[#1F2942] shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Page Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#1F2942]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#48DDF7] mb-1.5 font-mono">
                              Verified Source Citations:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((cite, i) => (
                                <button
                                  key={i}
                                  onClick={() => jumpToPage(cite.pageNumber)}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#080D1B] text-[#48DDF7] border border-[#48DDF7]/40 hover:bg-[#48DDF7]/15 transition-colors"
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
                      <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))
                )}

                {isAsking && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#10182A] border border-[#1F2942] text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 border-2 border-[#48DDF7] border-t-transparent rounded-full animate-spin" />
                    <span>Indexing source passages & formulating grounded response...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Box */}
              <div className="p-3 border-t border-[#1F2942] bg-[#10182A]">
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
                    className="flex-1 text-xs bg-[#080D1B] border border-[#1F2942] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#48DDF7]/50 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!questionInput.trim() || isAsking || currentDoc.isScannedOnly}
                    className="p-2.5 rounded-xl bg-[#48DDF7] hover:brightness-110 text-[#080D1B] font-bold disabled:opacity-40 transition-all shadow-[0_0_12px_rgba(72,221,247,0.25)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                {currentDoc.isScannedOnly && (
                  <p className="text-[10px] text-amber-400 mt-1.5">
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
