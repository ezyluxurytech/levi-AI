import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  Download,
  FileDown,
  Compass,
} from "lucide-react";
import {
  QuizQuestion,
  SummaryData,
  ExplanationData,
  ProviderInfo,
} from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

export type StudyTab = "summarize" | "explain" | "quiz";

interface StudyModeProps {
  providerInfo: ProviderInfo | null;
  onOpenSettings: () => void;
  onLogActivity: (title: string, details?: string) => void;
  initialTab?: StudyTab;
}

const SAMPLE_NOTES = [
  {
    title: "Operating Systems: Virtual Memory & Page Replacement",
    content: `Virtual memory is a memory management capability of an operating system that uses hardware and software to enable a computer to compensate for physical memory shortages by temporarily transferring data from random access memory (RAM) to disk storage.

Key Mechanisms:
1. Paging: Memory is divided into fixed-size blocks called pages (in virtual address space) and page frames (in physical RAM). The page table translates virtual page numbers to physical frame numbers.
2. Page Fault: When a program attempts to access a virtual memory address that is not currently mapped into physical RAM, the CPU Memory Management Unit (MMU) raises an interrupt known as a page fault.
3. Page Replacement Algorithms:
   - FIFO (First-In, First-Out): Replaces the oldest page. Suffers from Belady's Anomaly where allocating more page frames can increase faults.
   - LRU (Least Recently Used): Replaces the page that has not been referenced for the longest time. Approximates the optimal algorithm well.
   - Optimal (OPT): Replaces the page that will not be used for the longest period into the future. Impossible to implement in real time without future knowledge, but serves as the theoretical benchmark.
4. Thrashing: Occurs when a computer's virtual memory subsystem is in a constant state of paging, rapidly exchanging data in memory for data on disk, to the exclusion of most application-level processing. Thrashing causes CPU utilization to plummet.`,
  },
  {
    title: "Economics: Elasticity of Demand & Market Equilibrium",
    content: `Price Elasticity of Demand (PED) measures the responsiveness of the quantity demanded of a good or service to a change in its price.

Formula:
PED = (% Change in Quantity Demanded) / (% Change in Price)

Classifications of Elasticity:
1. Inelastic Demand (PED < 1): A change in price causes a smaller proportional change in quantity demanded. Necessities like salt, staple grains, and life-saving medications generally exhibit inelastic demand.
2. Elastic Demand (PED > 1): A change in price leads to a larger proportional change in quantity demanded. Luxury goods and items with readily available substitutes have elastic demand.
3. Unitary Elasticity (PED = 1): Proportional change in quantity demanded exactly matches the proportional change in price.
4. Perfectly Inelastic (PED = 0): Quantity demanded does not change at all regardless of price changes (vertical demand curve).

Determinants of Price Elasticity:
- Availability of close substitutes: More substitutes mean higher elasticity.
- Proportion of income spent: Higher expenditure proportion implies higher elasticity.
- Time horizon: Demand is typically more elastic over the long run as consumers adjust habits.
- Necessity vs. Luxury: Luxuries have much higher elasticity than basic necessities.`,
  },
  {
    title: "Biochemistry: Enzyme Kinetics & Competitive Inhibition",
    content: `Enzymes are biological catalysts that accelerate chemical reactions by lowering the activation energy without being consumed in the process.

Michaelis-Menten Model:
The model relates the reaction rate (v) to the substrate concentration [S]:
v = (Vmax * [S]) / (Km + [S])

Key Parameters:
1. Vmax (Maximum Velocity): The theoretical maximum rate of the enzymatic reaction when the enzyme is completely saturated with substrate.
2. Km (Michaelis Constant): The substrate concentration at which the reaction velocity is half of Vmax (1/2 Vmax). A low Km indicates high substrate affinity, meaning less substrate is required to achieve half-maximal velocity.

Inhibition Mechanisms:
1. Competitive Inhibition: The inhibitor molecule closely resembles the natural substrate and competes directly for the active site of the enzyme.
   - Effect on kinetics: Apparent Km increases (lower apparent affinity), while Vmax remains unchanged because high substrate concentrations outcompete the inhibitor.
2. Non-Competitive Inhibition: The inhibitor binds to an allosteric site (different from the active site), altering the 3D conformation of the enzyme.
   - Effect on kinetics: Vmax decreases because a fraction of enzymes is inactivated, while Km remains unchanged.`,
  },
];

export const StudyMode: React.FC<StudyModeProps> = ({
  providerInfo,
  onOpenSettings,
  onLogActivity,
  initialTab = "summarize",
}) => {
  const [activeTab, setActiveTab] = useState<StudyTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Shared study content input
  const [studyInput, setStudyInput] = useState(SAMPLE_NOTES[0].content);

  // Summarize state
  const [summaryFormat, setSummaryFormat] = useState<"bullets" | "executive" | "key_takeaways">("bullets");
  const [summaryResult, setSummaryResult] = useState<SummaryData | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Explain concept state
  const [conceptName, setConceptName] = useState("Belady's Anomaly");
  const [conceptContext, setConceptContext] = useState("Operating Systems - Page replacement algorithms");
  const [explanationResult, setExplanationResult] = useState<ExplanationData | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showHintFor, setShowHintFor] = useState<Record<string, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportSummary = (format: "markdown" | "text") => {
    if (!summaryResult) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    let content = "";
    let filename = `levi-ai-study-summary-${dateStr}`;

    if (format === "markdown") {
      content = `# Study Summary: Levi AI\n*Generated on: ${new Date().toLocaleString()}*\n*Estimated Reading Time: ~${summaryResult.readingTimeMinutes} min*\n\n---\n\n## Overview\n${summaryResult.summary}\n\n## Key Takeaways for Students\n${summaryResult.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}\n\n---\n\n### Original Study Notes Source\n${studyInput}\n`;
      filename += ".md";
    } else {
      content = `LEVI AI — STUDY SUMMARY\nGenerated: ${new Date().toLocaleString()}\nEstimated Reading Time: ~${summaryResult.readingTimeMinutes} min\n\n========================================\nOVERVIEW:\n${summaryResult.summary}\n\n========================================\nKEY TAKEAWAYS FOR STUDENTS:\n${summaryResult.keyPoints.map((pt, i) => `[${i + 1}] ${pt}`).join("\n")}\n\n========================================\nORIGINAL STUDY NOTES SOURCE:\n${studyInput}\n`;
      filename += ".txt";
    }

    const mimeType = format === "markdown" ? "text/markdown;charset=utf-8;" : "text/plain;charset=utf-8;";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLogActivity("Exported Study Summary", `Downloaded as ${format.toUpperCase()} (${filename})`);
  };

  /* Actions */
  const handleSummarize = async () => {
    if (!studyInput.trim() || studyInput.trim().length < 20) {
      setSummaryError("Please enter at least 20 characters of study notes.");
      return;
    }
    setSummaryError(null);
    setIsSummarizing(true);
    try {
      const res = await apiClient.summarizeNotes(studyInput, summaryFormat);
      setSummaryResult(res);
      onLogActivity("Generated Study Summary", `${res.keyPoints.length} key takeaways extracted`);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExplainConcept = async () => {
    if (!conceptName.trim()) {
      setExplainError("Please enter a concept name to explain.");
      return;
    }
    setExplainError(null);
    setIsExplaining(true);
    try {
      const res = await apiClient.explainConcept(conceptName.trim(), conceptContext.trim());
      setExplanationResult(res);
      onLogActivity(`Explained Concept: ${res.concept}`);
    } catch (err: any) {
      setExplainError(err.message || "Failed to explain concept.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const contextToUse = studyInput.trim() || SAMPLE_NOTES[0].content;
    setQuizError(null);
    setIsGeneratingQuiz(true);
    setUserAnswers({});
    setShowHintFor({});
    setQuizSubmitted(false);

    try {
      const questions = await apiClient.generateQuiz(contextToUse, 4);
      setQuizQuestions(questions);
      onLogActivity("Generated Practice Quiz", `${questions.length} questions prepared`);
    } catch (err: any) {
      setQuizError(err.message || "Failed to generate quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Quiz scoring calculation
  const totalQuestions = quizQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = quizQuestions.filter(
    (q) => userAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-[#10182A] p-4 sm:p-5 rounded-2xl border border-[#1F2942] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#080D1B] border border-[#B6A1FF]/40 p-1 shadow-[0_0_15px_rgba(182,161,255,0.18)] shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Study & Synthesis
              </h2>
              <span className="text-[11px] font-mono text-[#B6A1FF] bg-[#080D1B] px-2 py-0.5 rounded border border-[#1F2942]">
                Synthesis · Explainer · Interactive Quiz
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Transform dense lecture notes into structured executive summaries, conceptual analogies, and self-testing quizzes.
            </p>
          </div>
        </div>

        {/* Tab Switcher - Responsive horizontal scrollable pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#080D1B] rounded-xl border border-[#1F2942] shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("summarize")}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "summarize"
                ? "bg-[#10182A] text-[#B6A1FF] border border-[#B6A1FF]/40 shadow-[0_0_12px_rgba(182,161,255,0.15)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Summarize Notes
          </button>
          <button
            onClick={() => setActiveTab("explain")}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "explain"
                ? "bg-[#10182A] text-[#48DDF7] border border-[#48DDF7]/40 shadow-[0_0_12px_rgba(72,221,247,0.15)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Explain Concept
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "quiz"
                ? "bg-[#10182A] text-amber-400 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Practice Quiz
          </button>
        </div>
      </div>

      {/* Disconnected Provider Notification */}
      {providerInfo && !providerInfo.isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                AI Provider Offline / Standby
              </p>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Levi AI does not return fabricated or hallucinatory responses when an AI provider is not connected.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-200 bg-amber-900/60 hover:bg-amber-900 rounded-xl border border-amber-700 transition-colors shrink-0"
          >
            Connect Provider
          </button>
        </div>
      )}

      {/* TAB 1: SUMMARIZE */}
      {activeTab === "summarize" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notes Input Area (6 cols) */}
          <div className="lg:col-span-6 bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Lecture Notes / Material
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {studyInput.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {/* Sample Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-mono mr-1">Presets:</span>
              {SAMPLE_NOTES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setStudyInput(sample.content)}
                  className="text-[11px] px-2.5 py-1 bg-[#080D1B] hover:bg-[#162238] hover:text-[#B6A1FF] text-slate-300 rounded-lg border border-[#1F2942] transition-colors"
                >
                  {sample.title.split(":")[0]}
                </button>
              ))}
            </div>

            <textarea
              rows={12}
              value={studyInput}
              onChange={(e) => setStudyInput(e.target.value)}
              placeholder="Paste lecture notes, textbook excerpt, or study material here..."
              className="w-full text-xs font-sans p-3.5 bg-[#080D1B] border border-[#1F2942] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#B6A1FF]/50 leading-relaxed resize-y"
            />

            {/* Format Selector & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Format:</span>
                <select
                  value={summaryFormat}
                  onChange={(e: any) => setSummaryFormat(e.target.value)}
                  className="text-xs bg-[#080D1B] border border-[#1F2942] rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="bullets">Bullet Points & Highlights</option>
                  <option value="executive">Executive Summary</option>
                  <option value="key_takeaways">Exam Key Takeaways</option>
                </select>
              </div>

              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#B6A1FF] to-violet-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(182,161,255,0.25)] disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSummarizing ? "Synthesizing Summary..." : "Generate Summary"}</span>
              </button>
            </div>

            {summaryError && (
              <p className="text-xs text-red-300 bg-red-950/40 p-3 rounded-xl border border-red-800">
                {summaryError}
              </p>
            )}
          </div>

          {/* Summary Output Area (6 cols) */}
          <div className="lg:col-span-6 bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 space-y-4 min-h-[460px] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F2942]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Synthesized Study Summary
                </h3>
                {summaryResult && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 mr-1 font-mono">
                      <Clock className="w-3 h-3 text-[#B6A1FF]" />
                      ~{summaryResult.readingTimeMinutes} min read
                    </span>
                    <button
                      onClick={() => handleExportSummary("markdown")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#B6A1FF] bg-[#080D1B] hover:bg-[#162238] rounded-lg border border-[#B6A1FF]/30 transition-colors"
                      title="Download Summary as Markdown (.md)"
                    >
                      <Download className="w-3 h-3 text-[#B6A1FF]" />
                      <span>.MD</span>
                    </button>
                    <button
                      onClick={() => handleExportSummary("text")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#48DDF7] bg-[#080D1B] hover:bg-[#162238] rounded-lg border border-[#48DDF7]/30 transition-colors"
                      title="Download Summary as Plain Text (.txt)"
                    >
                      <FileDown className="w-3 h-3 text-[#48DDF7]" />
                      <span>.TXT</span>
                    </button>
                    <button
                      onClick={() => handleCopy(summaryResult.summary, "sum")}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#080D1B] transition-colors"
                      title="Copy summary text"
                    >
                      {copiedKey === "sum" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {!summaryResult ? (
                <div className="py-24 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">Ready to synthesize study notes</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Click "Generate Summary" to extract core insights, structural concepts, and exam-focused takeaways.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="text-xs text-slate-200 leading-relaxed bg-[#080D1B] p-4 rounded-xl border border-[#1F2942]">
                    <p className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B6A1FF]" />
                      Executive Overview:
                    </p>
                    <p className="whitespace-pre-wrap">{summaryResult.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white mb-2 font-mono uppercase tracking-wider text-[11px]">
                      Key Takeaways for Students:
                    </p>
                    <ul className="space-y-2">
                      {summaryResult.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#080D1B]/60 p-2.5 rounded-lg border border-[#1F2942]/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B6A1FF] shrink-0 mt-1.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {summaryResult && (
              <div className="pt-4 border-t border-[#1F2942] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleExportSummary("markdown")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#080D1B] hover:bg-[#162238] hover:text-[#B6A1FF] rounded-xl border border-[#1F2942] hover:border-[#B6A1FF]/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B6A1FF]" />
                    <span>Download Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => handleExportSummary("text")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#080D1B] hover:bg-[#162238] hover:text-[#48DDF7] rounded-xl border border-[#1F2942] hover:border-[#48DDF7]/40 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#48DDF7]" />
                    <span>Download Text (.txt)</span>
                  </button>
                </div>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className="text-xs font-semibold text-[#B6A1FF] hover:underline flex items-center gap-1 self-end sm:self-auto"
                >
                  Generate Quiz from these notes &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPLAIN CONCEPT */}
      {activeTab === "explain" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Concept Explainer & Analogy Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Struggling with a convoluted theorem or theory? Enter any academic term to receive an intuitive plain-language breakdown and a memorable analogy.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concept or Theory Name
                </label>
                <input
                  type="text"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g. Belady's Anomaly, CAP Theorem, Photosystem II..."
                  className="w-full text-xs bg-[#080D1B] border border-[#1F2942] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#48DDF7]/50 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course or Context (Optional)
                </label>
                <input
                  type="text"
                  value={conceptContext}
                  onChange={(e) => setConceptContext(e.target.value)}
                  placeholder="e.g. Operating Systems 300-level, Organic Chemistry..."
                  className="w-full text-xs bg-[#080D1B] border border-[#1F2942] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#48DDF7]/50"
                />
              </div>
            </div>

            {/* Quick concept presets */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 block mb-1.5 font-mono">Try Preset Concepts:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "CAP Theorem", context: "Distributed Systems" },
                  { name: "Michaelis-Menten Kinetics", context: "Biochemistry" },
                  { name: "Opportunity Cost", context: "Microeconomics" },
                  { name: "Schrödinger Equation", context: "Quantum Mechanics" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setConceptName(item.name);
                      setConceptContext(item.context);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-[#080D1B] hover:bg-[#162238] hover:text-[#48DDF7] text-slate-300 rounded-lg border border-[#1F2942] transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExplainConcept}
              disabled={isExplaining}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#48DDF7] to-cyan-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(72,221,247,0.25)] disabled:opacity-50"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{isExplaining ? "Explaining Concept..." : "Explain This Concept"}</span>
            </button>

            {explainError && (
              <p className="text-xs text-red-300 bg-red-950/40 p-3 rounded-xl border border-red-800">
                {explainError}
              </p>
            )}
          </div>

          {/* Explanation Output Area (7 cols) */}
          <div className="lg:col-span-7 bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 space-y-4 min-h-[460px] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2942]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Concept Breakdown: {explanationResult?.concept || conceptName}
              </h3>
              {explanationResult && (
                <button
                  onClick={() => handleCopy(explanationResult.simpleExplanation, "exp")}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#080D1B]"
                  title="Copy explanation"
                >
                  {copiedKey === "exp" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {!explanationResult ? (
              <div className="py-24 text-center text-slate-500">
                <Lightbulb className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No concept breakdown generated yet.</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Enter an academic theorem or term on the left and click "Explain This Concept".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Plain language breakdown */}
                <div className="p-4 rounded-xl bg-[#080D1B] border border-[#1F2942]">
                  <h4 className="text-xs font-bold text-[#48DDF7] mb-1.5 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#48DDF7]" />
                    Plain-Language Explanation
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {explanationResult.simpleExplanation}
                  </p>
                </div>

                {/* 2. Intuitive Analogy */}
                <div className="p-4 rounded-xl bg-[#080D1B] border border-[#B6A1FF]/40 text-[#B6A1FF]">
                  <h4 className="text-xs font-bold text-[#B6A1FF] mb-1.5 flex items-center gap-1.5 font-mono">
                    <Lightbulb className="w-4 h-4 text-[#B6A1FF]" />
                    Intuitive Everyday Analogy
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {explanationResult.intuitiveAnalogy}
                  </p>
                </div>

                {/* 3. Exam Takeaway Tip */}
                <div className="p-4 rounded-xl bg-[#080D1B] border border-amber-400/40 text-amber-300">
                  <h4 className="text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5 font-mono">
                    <Award className="w-4 h-4 text-amber-400" />
                    University Exam Takeaway
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {explanationResult.examTakeaway}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRACTICE QUIZ */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Practice Quiz Challenge Generator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate dynamic multiple-choice questions with answer keys, hints, and explanations based on your study material.
              </p>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingQuiz ? "Synthesizing Quiz..." : "Generate Practice Quiz"}</span>
            </button>
          </div>

          {quizError && (
            <p className="text-xs text-red-300 bg-red-950/40 p-3.5 rounded-xl border border-red-800">
              {quizError}
            </p>
          )}

          {/* Interactive Quiz Area */}
          {quizQuestions.length === 0 ? (
            <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-8 sm:p-14 text-center max-w-md mx-auto shadow-sm">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white tracking-tight">
                No Active Practice Quiz
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Make sure lecture notes are entered in the Summarize tab or click below to generate questions from sample academic material.
              </p>
              <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="mt-5 w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              >
                Generate 4 Practice Questions
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score strip if submitted */}
              {quizSubmitted && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#10182A] border border-[#1F2942] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        correctCount === totalQuestions
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : correctCount >= totalQuestions / 2
                          ? "bg-[#080D1B] text-[#48DDF7] border-[#48DDF7]/40"
                          : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}
                    >
                      {Math.round((correctCount / totalQuestions) * 100)}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Quiz Completed: {correctCount} of {totalQuestions} Correct
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {correctCount === totalQuestions
                          ? "Mastery achieved! Excellent retention of concepts."
                          : "Review the question explanations below to reinforce your knowledge."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setShowHintFor({});
                      setQuizSubmitted(false);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#080D1B] hover:bg-[#162238] rounded-xl border border-[#1F2942] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-5">
                {quizQuestions.map((q, qIndex) => {
                  const userAnswer = userAnswers[q.id];
                  const hasAnswered = userAnswer !== undefined;
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 space-y-4 shadow-sm"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-md bg-[#080D1B] text-[#48DDF7] border border-[#48DDF7]/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {qIndex + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        {q.hint && (
                          <button
                            onClick={() =>
                              setShowHintFor((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                            className="text-[11px] font-semibold text-[#48DDF7] hover:underline shrink-0 flex items-center gap-1 font-mono"
                          >
                            <Lightbulb className="w-3 h-3" />
                            <span>{showHintFor[q.id] ? "Hide Hint" : "Hint"}</span>
                          </button>
                        )}
                      </div>

                      {/* Hint display */}
                      {showHintFor[q.id] && q.hint && (
                        <div className="p-3 rounded-xl bg-[#080D1B] border border-[#48DDF7]/30 text-[#48DDF7] text-xs">
                          <span className="font-bold">Hint:</span> {q.hint}
                        </div>
                      )}

                      {/* Multiple Choice Options */}
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isOptionCorrect = optIdx === q.correctIndex;

                          let optionStyle = "border-[#1F2942] hover:border-[#48DDF7]/40 bg-[#080D1B] text-slate-200";
                          if (hasAnswered) {
                            if (isOptionCorrect) {
                              optionStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold";
                            } else if (isSelected && !isOptionCorrect) {
                              optionStyle = "border-red-500 bg-red-950/40 text-red-200 font-semibold";
                            } else {
                              optionStyle = "border-[#1F2942]/60 bg-[#080D1B]/40 text-slate-500 opacity-60";
                            }
                          } else if (isSelected) {
                            optionStyle = "border-[#48DDF7] bg-[#48DDF7]/15 text-white font-semibold";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                if (!quizSubmitted) {
                                  setUserAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx,
                                  }));
                                }
                              }}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${optionStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-md border border-[#1F2942] bg-[#10182A] text-slate-400 flex items-center justify-center text-[10px] font-mono font-bold">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{option}</span>
                              </div>

                              {hasAnswered && isOptionCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {hasAnswered && isSelected && !isOptionCorrect && (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation feedback after answering */}
                      {hasAnswered && (
                        <div
                          className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                            isCorrect
                              ? "bg-emerald-950/30 border-emerald-800 text-emerald-200"
                              : "bg-amber-950/30 border-amber-800 text-amber-200"
                          }`}
                        >
                          <p className="font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
                            {isCorrect ? "Correct!" : "Concept Explanation:"}
                          </p>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Quiz Action */}
              {!quizSubmitted && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-[#10182A] rounded-2xl border border-[#1F2942]">
                  <span className="text-xs font-mono text-slate-400">
                    Answered {answeredCount} of {totalQuestions} questions
                  </span>
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={answeredCount === 0}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] disabled:opacity-50 text-center"
                  >
                    Finish & View Score Breakdown
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
