import React, { useState } from "react";
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
} from "lucide-react";
import {
  QuizQuestion,
  SummaryData,
  ExplanationData,
  ProviderInfo,
} from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

interface StudyModeProps {
  providerInfo: ProviderInfo | null;
  onOpenSettings: () => void;
  onLogActivity: (title: string, details?: string) => void;
}

type StudyTab = "summarize" | "explain" | "quiz";

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
}) => {
  const [activeTab, setActiveTab] = useState<StudyTab>("summarize");

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
      const res = await apiClient.explainConcept(conceptName, conceptContext);
      setExplanationResult(res);
      onLogActivity(`Explained Concept: ${conceptName}`);
    } catch (err: any) {
      setExplainError(err.message || "Failed to explain concept.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!studyInput.trim() || studyInput.trim().length < 30) {
      setQuizError("Please enter sufficient study notes to generate practice questions.");
      return;
    }
    setQuizError(null);
    setIsGeneratingQuiz(true);
    setUserAnswers({});
    setShowHintFor({});
    setQuizSubmitted(false);
    try {
      const questions = await apiClient.generateQuiz(studyInput, 4);
      setQuizQuestions(questions);
      onLogActivity("Generated Practice Quiz", `${questions.length} questions`);
    } catch (err: any) {
      setQuizError(err.message || "Failed to generate practice quiz.");
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Study & Practice Engine
            </h2>
            <span className="text-xs font-mono text-slate-500">
              [Summarizer · Explainer · Interactive Quiz]
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transform dense university lecture notes into structured executive summaries, conceptual analogies, and self-testing quizzes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab("summarize")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "summarize"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Summarize Notes
          </button>
          <button
            onClick={() => setActiveTab("explain")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "explain"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Explain Concept
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "quiz"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Practice Quiz
          </button>
        </div>
      </div>

      {/* Disconnected Provider Notification */}
      {providerInfo && !providerInfo.isConfigured && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                AI Provider Not Configured
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                In strict compliance with OPEN//BUILD 2026 guidelines, Levi AI does not return random or fabricated AI answers when an AI provider is not connected.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-lg border border-amber-300 transition-colors shrink-0"
          >
            Connect AI Provider
          </button>
        </div>
      )}

      {/* TAB 1: SUMMARIZE */}
      {activeTab === "summarize" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notes Input Area (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lecture Notes / Text
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {studyInput.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {/* Sample Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Sample:</span>
              {SAMPLE_NOTES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setStudyInput(sample.content)}
                  className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded border border-slate-200 transition-colors"
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
              className="w-full text-xs font-sans p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-y"
            />

            {/* Format Selector & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Format:</span>
                <select
                  value={summaryFormat}
                  onChange={(e: any) => setSummaryFormat(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="bullets">Bullet Points & Highlights</option>
                  <option value="executive">Executive Summary</option>
                  <option value="key_takeaways">Exam Key Takeaways</option>
                </select>
              </div>

              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSummarizing ? "Synthesizing Summary..." : "Generate Summary"}</span>
              </button>
            </div>

            {summaryError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {summaryError}
              </p>
            )}
          </div>

          {/* Summary Output Area (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Synthesized Study Summary
                </h3>
                {summaryResult && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {summaryResult.readingTimeMinutes} min read
                    </span>
                    <button
                      onClick={() => handleCopy(summaryResult.summary, "sum")}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                      title="Copy summary"
                    >
                      {copiedKey === "sum" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {!summaryResult ? (
                <div className="py-20 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Ready to summarize study material</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Click "Generate Summary" to extract core insights and exam-focused takeaways.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="text-xs text-slate-800 leading-relaxed bg-slate-50/80 p-4 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1.5">Overview:</p>
                    <p className="whitespace-pre-wrap">{summaryResult.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 mb-2">
                      Key Takeaways for Students:
                    </p>
                    <ul className="space-y-2">
                      {summaryResult.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {summaryResult && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Grounded on provided notes</span>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Concept Explainer
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Struggling with a convoluted theorem or theory? Enter any academic term to receive an intuitive plain-language breakdown and a memorable analogy.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concept or Theory Name
                </label>
                <input
                  type="text"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g. Belady's Anomaly, CAP Theorem, Photosystem II..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course or Context (Optional)
                </label>
                <input
                  type="text"
                  value={conceptContext}
                  onChange={(e) => setConceptContext(e.target.value)}
                  placeholder="e.g. Operating Systems 300-level, Organic Chemistry..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick concept presets */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Try Preset Academic Concepts:</span>
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
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 rounded border border-slate-200 transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExplainConcept}
              disabled={isExplaining}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{isExplaining ? "Explaining Concept..." : "Explain This Concept"}</span>
            </button>

            {explainError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {explainError}
              </p>
            )}
          </div>

          {/* Explanation Output Area (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-5 min-h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Concept Breakdown: {explanationResult?.concept || conceptName}
              </h3>
              {explanationResult && (
                <button
                  onClick={() => handleCopy(explanationResult.simpleExplanation, "exp")}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                  title="Copy explanation"
                >
                  {copiedKey === "exp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {!explanationResult ? (
              <div className="py-24 text-center text-slate-400">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No concept explanation generated yet.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Enter a concept on the left and click "Explain This Concept".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Plain language breakdown */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    Plain-Language Explanation
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {explanationResult.simpleExplanation}
                  </p>
                </div>

                {/* 2. Intuitive Analogy */}
                <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/70 text-violet-950">
                  <h4 className="text-xs font-bold text-violet-900 mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-violet-600" />
                    Intuitive Everyday Analogy
                  </h4>
                  <p className="text-xs text-violet-900/90 leading-relaxed">
                    {explanationResult.intuitiveAnalogy}
                  </p>
                </div>

                {/* 3. Exam Takeaway Tip */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-950">
                  <h4 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    University Exam Takeaway
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Practice Quiz Generator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate dynamic multiple-choice questions with answer keys, hints, and explanations based on your study material.
              </p>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingQuiz ? "Generating Quiz..." : "Generate Practice Quiz"}</span>
            </button>
          </div>

          {quizError && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {quizError}
            </p>
          )}

          {/* Interactive Quiz Area */}
          {quizQuestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">
                No Active Quiz
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Make sure notes are entered in the Summarize tab or click below to generate questions from sample material.
              </p>
              <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Generate 4 Practice Questions
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score strip if submitted */}
              {quizSubmitted && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        correctCount === totalQuestions
                          ? "bg-emerald-100 text-emerald-800"
                          : correctCount >= totalQuestions / 2
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {Math.round((correctCount / totalQuestions) * 100)}%
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Quiz Completed: {correctCount} of {totalQuestions} Correct
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
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
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
                      className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {qIndex + 1}
                          </span>
                          <h4 className="text-xs md:text-sm font-semibold text-slate-900 leading-snug">
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
                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" />
                            <span>{showHintFor[q.id] ? "Hide Hint" : "Hint"}</span>
                          </button>
                        )}
                      </div>

                      {/* Hint display */}
                      {showHintFor[q.id] && q.hint && (
                        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
                          <span className="font-semibold">Hint:</span> {q.hint}
                        </div>
                      )}

                      {/* Multiple Choice Options */}
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isOptionCorrect = optIdx === q.correctIndex;

                          let optionStyle = "border-slate-200 hover:border-indigo-300 bg-white text-slate-800";
                          if (hasAnswered) {
                            if (isOptionCorrect) {
                              optionStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium";
                            } else if (isSelected && !isOptionCorrect) {
                              optionStyle = "border-red-400 bg-red-50 text-red-950 font-medium";
                            } else {
                              optionStyle = "border-slate-200 bg-slate-50/50 text-slate-400 opacity-60";
                            }
                          } else if (isSelected) {
                            optionStyle = "border-indigo-600 bg-indigo-50/60 text-indigo-950 font-medium";
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
                              className={`w-full p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${optionStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{option}</span>
                              </div>

                              {hasAnswered && isOptionCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {hasAnswered && isSelected && !isOptionCorrect && (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation feedback after answering */}
                      {hasAnswered && (
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed border ${
                            isCorrect
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                              : "bg-amber-50/60 border-amber-200 text-amber-900"
                          }`}
                        >
                          <p className="font-bold mb-1">
                            {isCorrect ? "Correct!" : "Explanation:"}
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
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-600">
                    Answered {answeredCount} of {totalQuestions} questions
                  </span>
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={answeredCount === 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
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
