import React, { useRef, useState } from "react";
import {
  FileText,
  BookOpen,
  Languages,
  Upload,
  FolderUp,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Clock,
  ShieldCheck,
  Cpu,
  Compass,
  CheckCircle2,
  Award,
  Zap,
  Radio,
  Search,
  ChevronRight,
  Database,
} from "lucide-react";
import { AppMode, DocumentMetadata, ProviderInfo, RecentActivityItem } from "../types/index.ts";

interface DashboardProps {
  onSelectMode: (mode: AppMode, initialTab?: "summarize" | "explain" | "quiz") => void;
  onFileUpload: (file: File) => Promise<void>;
  onBatchUpload?: (files: File[]) => Promise<void>;
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
  onBatchUpload,
  onLoadSampleDocument,
  isUploading,
  uploadError,
  uploadedDocuments,
  recentActivities,
  providerInfo,
  onOpenSettings,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [inquiryPrompt, setInquiryPrompt] = useState("");
  const [targetWorkspace, setTargetWorkspace] = useState<AppMode>("study");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const scanEntry = async (entry: any, fileList: File[]): Promise<void> => {
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
          await scanEntry(child, fileList);
        }
        batch = await readBatch();
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const extractedFiles: File[] = [];
      const promises: Promise<void>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof (item as any).webkitGetAsEntry === "function") {
          const entry = (item as any).webkitGetAsEntry();
          if (entry) promises.push(scanEntry(entry, extractedFiles));
        } else {
          const f = item.getAsFile();
          if (f) extractedFiles.push(f);
        }
      }

      await Promise.all(promises);

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

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleLaunchInquiry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inquiryPrompt.trim();
    if (!prompt) {
      onSelectMode(targetWorkspace);
      return;
    }

    // Direct routing based on user inquiry intent
    if (targetWorkspace === "document") {
      onSelectMode("document");
    } else if (targetWorkspace === "language") {
      onSelectMode("language");
    } else {
      // Study mode default
      onSelectMode("study");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. HERO SECTION */}
      <div className="relative rounded-3xl bg-[#10182A] border border-[#1F2942] p-6 sm:p-8 md:p-10 overflow-hidden shadow-2xl shadow-black/60">
        {/* Subtle background ambient nebula effect */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#48DDF7]/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#B6A1FF]/10 blur-[90px] pointer-events-none" />
        
        {/* Subtle coordinate grid background */}
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #48DDF7 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }} 
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
          {/* Left Column: Platform Identity & Headline */}
          <div className="max-w-2xl space-y-4">
            {/* Tagline */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080D1B] border border-[#48DDF7]/30 text-xs font-semibold text-[#48DDF7] shadow-[0_0_15px_rgba(72,221,247,0.15)]">
                <span className="w-2 h-2 rounded-full bg-[#48DDF7] animate-pulse" />
                <span className="tracking-wide">ACADEMIC WORKSPACE</span>
              </div>
              <div className="text-xs font-medium text-slate-300 tracking-wide">
                Learn · Understand · Grow
              </div>
            </div>

            {/* Compelling Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Your mind,{" "}
              <span className="bg-gradient-to-r from-[#48DDF7] via-cyan-200 to-[#B6A1FF] bg-clip-text text-transparent">
                amplified.
              </span>
            </h1>

            {/* Editorial Platform Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              An advanced AI academic intelligence environment designed for university students and researchers.
              Analyze complex lecture notes with strict document grounding, synthesize dense concepts into memorable analogies, and translate coursework across English, Èdè Yorùbá, Ásụ̀sụ́ Ìgbò, and Harshen Hausa.
            </p>

            {/* Live Telemetry Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080D1B]/80 border border-[#1F2942]">
                <Radio className="w-3.5 h-3.5 text-[#48DDF7]" />
                <span>Engine: {providerInfo?.model || "gemini-3.1-flash-lite"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080D1B]/80 border border-[#1F2942]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strict Grounding: Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080D1B]/80 border border-[#1F2942]">
                <FileCheck2 className="w-3.5 h-3.5 text-[#B6A1FF]" />
                <span>{uploadedDocuments.length} PDF(s) Indexed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Animated AI Intelligence-Core Visual */}
          <div className="flex flex-col items-center justify-center shrink-0 lg:pr-4">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
              {/* Outer Celestial Ring with Coordinate Ticks */}
              <div className="absolute inset-0 rounded-full border border-[#48DDF7]/25 animate-spin-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#48DDF7] shadow-[0_0_10px_#48DDF7]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#48DDF7]/60" />
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#48DDF7]/60" />
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#B6A1FF] shadow-[0_0_10px_#B6A1FF]" />
              </div>

              {/* Middle Intersecting Flux Ring */}
              <div className="absolute inset-3 rounded-full border border-dashed border-[#B6A1FF]/30 animate-spin-reverse-slow">
                <div className="absolute top-3 right-6 w-2 h-2 rounded-full bg-[#B6A1FF] shadow-[0_0_8px_#B6A1FF]" />
                <div className="absolute bottom-3 left-6 w-2 h-2 rounded-full bg-[#48DDF7] shadow-[0_0_8px_#48DDF7]" />
              </div>

              {/* Inner Orbital Gyroscope Ring */}
              <div className="absolute inset-7 rounded-full border border-[#48DDF7]/40 animate-spin-medium" />

              {/* Glowing Sphere */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#080D1B] border border-[#48DDF7]/40 p-2 shadow-[0_0_35px_rgba(72,221,247,0.3)] flex flex-col items-center justify-center overflow-hidden animate-pulse-core group">
                <img
                  src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
                  alt="Levi AI"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080D1B] via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                System Status
              </span>
              <p className="text-xs font-semibold text-[#48DDF7] flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48DDF7] animate-ping" />
                Resonance 100% · Ready
              </p>
            </div>
          </div>
        </div>

        {/* 2. COMMAND LAUNCHPAD (Working Prompt & Ingestion Area) */}
        <div className="mt-8 pt-6 border-t border-[#1F2942] relative z-10">
          <form
            onSubmit={handleLaunchInquiry}
            className="rounded-2xl bg-[#080D1B] border border-[#1F2942] p-2.5 sm:p-3 shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all focus-within:border-[#48DDF7]/50 focus-within:shadow-[0_0_20px_rgba(72,221,247,0.15)]"
          >
            {/* Target Workspace Selector */}
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Deck:
              </span>
              <select
                value={targetWorkspace}
                onChange={(e) => setTargetWorkspace(e.target.value as AppMode)}
                className="bg-[#10182A] text-xs font-semibold text-[#48DDF7] border border-[#1F2942] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="study">Study & Synthesis (Summaries & Quizzes)</option>
                <option value="document">Document Lab (PDF Q&A)</option>
                <option value="language">Language Bridge (Translations)</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={inquiryPrompt}
                onChange={(e) => setInquiryPrompt(e.target.value)}
                placeholder="Ask an academic question, enter lecture notes topic, or launch a workspace..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none px-2 py-1.5 font-normal"
              />
            </div>

            {/* Ingestion & Launch Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Document Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* Directory / Folder Trigger */}
              <input
                ref={folderInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: "", directory: "" } as any)}
                className="hidden"
                onChange={handleFolderInputChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#48DDF7]/40 transition-colors disabled:opacity-50"
                title="Upload PDF directly into Document Lab"
              >
                <Upload className="w-3.5 h-3.5 text-[#48DDF7]" />
                <span className="hidden sm:inline">{isUploading ? "Extracting..." : "Upload PDF"}</span>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#B6A1FF] bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#B6A1FF]/50 transition-colors disabled:opacity-50"
                title="Upload entire folder containing PDF lecture notes"
              >
                <FolderUp className="w-3.5 h-3.5 text-[#B6A1FF]" />
                <span className="hidden md:inline">Folder</span>
              </button>

              {/* Launch Button */}
              <button
                type="submit"
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#48DDF7] to-cyan-300 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(72,221,247,0.3)] shrink-0"
              >
                <span>Launch Inquiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Prompt Assist Shortcuts */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-mono">Quick Inquiries:</span>
              <button
                onClick={() => {
                  setInquiryPrompt("Virtual memory paging algorithms & Belady's anomaly");
                  setTargetWorkspace("study");
                }}
                className="px-2 py-0.5 rounded-md bg-[#080D1B] hover:bg-[#162238] border border-[#1F2942] text-[11px] text-slate-300 hover:text-[#48DDF7] transition-colors"
              >
                Virtual Memory & Paging
              </button>
              <button
                onClick={() => {
                  setInquiryPrompt("Explain Michaelis-Menten enzyme kinetics in everyday terms");
                  setTargetWorkspace("study");
                }}
                className="px-2 py-0.5 rounded-md bg-[#080D1B] hover:bg-[#162238] border border-[#1F2942] text-[11px] text-slate-300 hover:text-[#B6A1FF] transition-colors"
              >
                Michaelis-Menten Kinetics
              </button>
            </div>

            {onLoadSampleDocument && (
              <button
                type="button"
                onClick={onLoadSampleDocument}
                disabled={isUploading}
                className="text-[11px] text-[#48DDF7] hover:underline font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Test with CSC 304 Lecture Sample &rarr;</span>
              </button>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 text-xs text-red-400 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-2">
              <span className="font-bold">Notice:</span> {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* 3. FOUR VISUALLY DISTINCT FEATURE ENTRY POINTS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#48DDF7]" />
              Academic Feature Workspaces
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Four specialized academic intelligence modules for study, grounding, translation, and mastery
            </p>
          </div>
          <span className="text-xs font-mono text-[#48DDF7] hidden sm:inline">
            4 Modular Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Study & Synthesis */}
          <div
            onClick={() => onSelectMode("study", "summarize")}
            className="group rounded-2xl bg-[#10182A] border border-[#1F2942] hover:border-[#B6A1FF]/60 p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(182,161,255,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#080D1B] border border-[#B6A1FF]/30 text-[#B6A1FF] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(182,161,255,0.2)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-[#B6A1FF] transition-colors">
                  Study & Synthesis
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B6A1FF]/15 text-[#B6A1FF] border border-[#B6A1FF]/30">
                  Synthesis
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Synthesize lecture notes into concise bullet summaries, break down convoluted theorems with everyday analogies, and export takeaways in Markdown.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1F2942] flex items-center justify-between text-xs font-semibold text-[#B6A1FF]">
              <span>Open Study Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Document Lab */}
          <div
            onClick={() => onSelectMode("document")}
            className="group rounded-2xl bg-[#10182A] border border-[#1F2942] hover:border-[#48DDF7]/60 p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(72,221,247,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#080D1B] border border-[#48DDF7]/30 text-[#48DDF7] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(72,221,247,0.2)]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-[#48DDF7] transition-colors">
                  Document Lab
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#48DDF7]/15 text-[#48DDF7] border border-[#48DDF7]/30">
                  Strict Q&A
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Upload university slides, research papers, or entire course folders of lecture notes. Ask questions strictly grounded in extracted source text with verified page citations.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1F2942] flex items-center justify-between text-xs font-semibold text-[#48DDF7]">
              <span>
                {uploadedDocuments.length > 0 ? `${uploadedDocuments.length} Document${uploadedDocuments.length > 1 ? "s" : ""} Ready` : "Open Document Lab"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Language Bridge */}
          <div
            onClick={() => onSelectMode("language")}
            className="group rounded-2xl bg-[#10182A] border border-[#1F2942] hover:border-emerald-500/60 p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#080D1B] border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <Languages className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Language Bridge
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  4 Langs
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Translate academic concepts between English, Èdè Yorùbá, Ásụ̀sụ́ Ìgbò, and Harshen Hausa while preserving accurate tonal diacritics and scientific clarity.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1F2942] flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Bridge Multilingual</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Quick Challenge */}
          <div
            onClick={() => onSelectMode("study", "quiz")}
            className="group rounded-2xl bg-[#10182A] border border-[#1F2942] hover:border-amber-400/60 p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#080D1B] border border-amber-400/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Quick Challenge
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30">
                  Instant Quiz
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Rapidly evaluate your concept retention. Launch an interactive 4-question self-assessment test complete with answer keys, hints, and explanations.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1F2942] flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Take Quiz Challenge</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPACT RECENT-ACTIVITY & LEARNING-PROGRESS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Documents in Memory */}
        <div className="rounded-2xl bg-[#10182A] border border-[#1F2942] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2942]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#48DDF7]" />
              Active Documents in Memory
            </h3>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {uploadedDocuments.length} total
            </span>
          </div>

          {uploadedDocuments.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-[#1F2942] rounded-xl bg-[#080D1B]/60">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                No documents uploaded yet in this session.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#48DDF7] hover:underline"
                >
                  Upload First PDF
                </button>
                {onLoadSampleDocument && (
                  <>
                    <span className="text-slate-600">·</span>
                    <button
                      onClick={onLoadSampleDocument}
                      className="text-xs font-semibold text-[#B6A1FF] hover:underline"
                    >
                      Load Sample Lecture
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectMode("document")}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#080D1B] border border-[#1F2942] hover:border-[#48DDF7]/40 cursor-pointer transition-all group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-semibold text-white group-hover:text-[#48DDF7] transition-colors truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="tabular-nums">{doc.pageCount} pages</span>
                      <span className="text-slate-600">·</span>
                      <span className="tabular-nums font-mono">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                      {doc.isScannedOnly && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-amber-400 font-medium">Scanned PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#48DDF7] shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect &rarr;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Genuine Session Activity Log */}
        <div className="rounded-2xl bg-[#10182A] border border-[#1F2942] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2942]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B6A1FF]" />
              Learning Progress & Activity Log
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Live Session
            </span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 px-4 text-center border border-dashed border-[#1F2942] rounded-xl bg-[#080D1B]/60">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                No session inquiries logged yet.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Completed document citations, study summaries, and language translations will record here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onSelectMode(act.mode)}
                  className="p-3 rounded-xl bg-[#080D1B] border border-[#1F2942] hover:border-[#B6A1FF]/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white truncate">
                      {act.title}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {act.details && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {act.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. ARCHITECTURAL TRANSPARENCY CARD */}
      <div className="rounded-2xl bg-[#10182A] border border-[#1F2942] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#080D1B] border border-[#48DDF7]/30 text-[#48DDF7] shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                Decoupled AI Engine Architecture
              </h4>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#48DDF7]/15 text-[#48DDF7] border border-[#48DDF7]/30">
                {providerInfo?.name || "Initializing..."}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Levi AI separates document-grounded extraction from generative inference. The backend is vendor-neutral, providing hot-swappable support between Gemini 3.8 Flash, local open-weight endpoints, or offline test harnesses without touching application code.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-full md:w-auto px-4 py-2 text-xs font-bold text-white bg-[#080D1B] hover:bg-[#162238] rounded-xl transition-all border border-[#1F2942] hover:border-[#48DDF7]/40 shrink-0 text-center"
        >
          Inspect Architecture
        </button>
      </div>
    </div>
  );
};
