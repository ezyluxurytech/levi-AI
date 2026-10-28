import React, { useRef, useState } from "react";
import {
  FileText,
  BookOpen,
  Languages,
  Upload,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Clock,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { AppMode, DocumentMetadata, ProviderInfo, RecentActivityItem } from "../types/index.ts";

interface DashboardProps {
  onSelectMode: (mode: AppMode) => void;
  onFileUpload: (file: File) => Promise<void>;
  onLoadSampleDocument?: () => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
  uploadedDocuments: DocumentMetadata[];
  recentActivities: RecentActivityItem[];
  providerInfo: ProviderInfo | null;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectMode,
  onFileUpload,
  onLoadSampleDocument,
  isUploading,
  uploadError,
  uploadedDocuments,
  recentActivities,
  providerInfo,
  onOpenSettings,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await onFileUpload(file);
      } else {
        alert("Please upload a PDF document (.pdf)");
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 md:p-8 shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div className="relative z-10 max-w-2xl">
          {/* Tagline & Mobile Logo Badge */}
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-[#0A0E27] border border-indigo-950 p-0.5 shadow-sm lg:hidden shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
                alt="Levi AI"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-[11px] font-semibold text-indigo-700 tracking-wide">
              <span>Learn</span>
              <span aria-hidden="true" className="text-indigo-400">✦</span>
              <span>Understand</span>
              <span aria-hidden="true" className="text-indigo-400">✦</span>
              <span>Grow</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
            Intelligent Document & Learning Assistant for University Students
          </h1>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed text-pretty">
            Levi AI combines document-grounded question answering with structured academic study tools and high-fidelity translations into Nigerian languages (Yorùbá, Igbo, Hausa).
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onSelectMode("document")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Upload PDF Document</span>
            </button>
            <button
              onClick={() => onSelectMode("study")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200 w-full sm:w-auto"
            >
              <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Open Study & Quiz Mode</span>
            </button>
            <button
              onClick={() => onSelectMode("language")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200 w-full sm:w-auto"
            >
              <Languages className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Translate to Nigerian Languages</span>
            </button>
          </div>
        </div>

        {/* Hero Logo Card (Desktop/Tablet) */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0 pr-2">
          <div className="w-40 h-40 rounded-2xl bg-[#0A0E27] border border-indigo-900/60 p-2 shadow-xl shadow-indigo-950/40 hover:scale-102 transition-transform flex items-center justify-center overflow-hidden">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI — Learn, Understand, Grow"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 tracking-wide">
            Levi AI Companion
          </span>
        </div>
      </div>

      {/* Core Modes: 3 Interactive Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Core Application Workspaces
          </h2>
          <span className="text-xs text-slate-500">
            3 Modular Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Document Mode Card */}
          <div
            onClick={() => onSelectMode("document")}
            className="group relative rounded-xl bg-white border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Document Mode
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Upload course syllabi, lecture slides, or journal papers. Ask questions grounded in extracted text with verified page citations and no hallucinations.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
              <span>{uploadedDocuments.length > 0 ? `${uploadedDocuments.length} document ready` : "Open Document Workspace"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Study Mode Card */}
          <div
            onClick={() => onSelectMode("study")}
            className="group relative rounded-xl bg-white border border-slate-200 p-5 hover:border-violet-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                Study Mode
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Synthesize dense notes into executive summaries, break down difficult theories with everyday analogies, and generate self-assessment practice quizzes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-violet-600">
              <span>Summaries & Practice Quizzes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Language Mode Card */}
          <div
            onClick={() => onSelectMode("language")}
            className="group relative rounded-xl bg-white border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Language Mode
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Translate summaries, technical terms, and complex university explanations between English, Yorùbá, Igbo, and Hausa while retaining academic clarity.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-600">
              <span>Translate in 4 Languages</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Dropzone & Direct Ingestion */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quick Document Dropzone
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a lecture slide or academic PDF up to 10MB to immediately explore document-grounded Q&A.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Digital PDF (Selectable text)</span>
            <span aria-hidden="true">·</span>
            <span>Max 10MB</span>
          </div>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/60"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isUploading ? "Uploading & Extracting Text..." : "Click to browse or drop your PDF here"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PyMuPDF extracts selectable text and tracks page boundaries
              </p>
            </div>
          </div>
        </div>

        {onLoadSampleDocument && (
          <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Don't have a PDF ready on this device?</span>
            <button
              onClick={onLoadSampleDocument}
              disabled={isUploading}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto text-left"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Load Sample Lecture Notes (CSC 304) &rarr;</span>
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <span className="font-semibold">Upload Error:</span> {uploadError}
          </div>
        )}
      </div>

      {/* Active Session Documents & Recent Activity (Genuine data only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Documents in Memory */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Active Session Documents
            </h3>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {uploadedDocuments.length} total
            </span>
          </div>

          {uploadedDocuments.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/60">
              <p className="text-xs text-slate-500">
                No documents uploaded yet in this session.
              </p>
              <button
                onClick={() => onSelectMode("document")}
                className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Upload your first lecture PDF
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectMode("document")}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="tabular-nums">{doc.pageCount} pages</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-mono">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                      {doc.isScannedOnly && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-600 font-medium">Scanned (No OCR)</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 shrink-0">
                    Open &rarr;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Genuine Session Activity */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Session Activity Log
            </h3>
            <span className="text-xs text-slate-500">
              Current Session
            </span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/60">
              <p className="text-xs text-slate-500">
                No activities logged yet in this session.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Completed summaries, questions, and translations will be recorded here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onSelectMode(act.mode)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {act.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {act.details && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {act.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Architecture & AI Provider Verification Card */}
      <div className="rounded-xl bg-slate-900 text-slate-200 p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                Pluggable AI Backend Architecture
              </h4>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  providerInfo?.isConfigured
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {providerInfo?.name || "Initializing"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Decoupled interface architecture. The backend does not hardcode a single provider and cleanly separates document grounding from inference.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 text-center"
        >
          Inspect Architecture
        </button>
      </div>
    </div>
  );
};
