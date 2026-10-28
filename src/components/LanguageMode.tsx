import React, { useState } from "react";
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  Info,
  BookOpen,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { ProviderInfo, TranslationData } from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

interface LanguageModeProps {
  providerInfo: ProviderInfo | null;
  onOpenSettings: () => void;
  onLogActivity: (title: string, details?: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "English", label: "English", nativeName: "English", flag: "🇬🇧" },
  { id: "Yoruba", label: "Yoruba", nativeName: "Èdè Yorùbá", flag: "🇳🇬" },
  { id: "Igbo", label: "Igbo", nativeName: "Ásụ̀sụ́ Ìgbò", flag: "🇳🇬" },
  { id: "Hausa", label: "Hausa", nativeName: "Harshen Hausa", flag: "🇳🇬" },
];

const PRESET_ACADEMIC_PHRASES = [
  {
    title: "Professor Consultation",
    sourceText: "Good morning Professor, could you please clarify question 3 regarding the algorithm time complexity?",
  },
  {
    title: "Research Methodology",
    sourceText: "The methodology requires stratified random sampling across university undergraduate departments.",
  },
  {
    title: "Exam Instruction",
    sourceText: "Answer any four questions. All questions carry equal marks. Show all working clearly.",
  },
  {
    title: "Study Group Invitation",
    sourceText: "Let us review the organic chemistry reaction mechanisms together in the university library this evening.",
  },
];

export const LanguageMode: React.FC<LanguageModeProps> = ({
  providerInfo,
  onOpenSettings,
  onLogActivity,
}) => {
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Yoruba");
  const [sourceText, setSourceText] = useState(PRESET_ACADEMIC_PHRASES[0].sourceText);
  const [translationResult, setTranslationResult] = useState<TranslationData | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (translationResult?.translatedText) {
      setSourceText(translationResult.translatedText);
      setTranslationResult(null);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError("Please enter text to translate.");
      return;
    }

    if (sourceLang === targetLang) {
      setError("Source and target languages cannot be identical.");
      return;
    }

    setError(null);
    setIsTranslating(true);
    try {
      const res = await apiClient.translate(sourceText, sourceLang, targetLang);
      setTranslationResult(res);
      onLogActivity(
        `Translated ${sourceLang} to ${targetLang}`,
        `"${sourceText.slice(0, 35)}..."`
      );
    } catch (err: any) {
      setError(err.message || "Failed to translate text.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 p-1 shadow-xs shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/Levi_AI_Learning_Logo_a2b86b0f.png"
              alt="Levi AI Translation"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Nigerian Languages Translation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Translate academic summaries, explanations, and university coursework between English, Èdè Yorùbá, Ásụ̀sụ́ Ìgbò, and Harshen Hausa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>4 Languages</span>
          <span aria-hidden="true">·</span>
          <span>Tonal Diacritics Preservation</span>
        </div>
      </div>

      {/* Disconnected Provider Notification */}
      {providerInfo && !providerInfo.isConfigured && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Translation Provider Not Connected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                AI translation backend has not yet been connected. To translate into Yorùbá, Igbo, or Hausa, connect your model provider in settings.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-lg border border-amber-300 transition-colors shrink-0"
          >
            Configure Engine
          </button>
        </div>
      )}

      {/* Language Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Source Language Select */}
        <div className="flex-1 flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">
            Source:
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwapLanguages}
          className="p-2 self-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="Swap source and target languages"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* Target Language Select */}
        <div className="flex-1 flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">
            Target:
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Academic Phrases */}
      <div>
        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
          Preset Academic Sentences:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_ACADEMIC_PHRASES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setSourceText(preset.sourceText)}
              className="p-2.5 rounded-lg bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 text-left transition-colors"
            >
              <p className="text-[11px] font-bold text-slate-800">
                {preset.title}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {preset.sourceText}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Translation Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Source Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {sourceLang} Text
              </span>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                {sourceText.length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={`Enter academic notes or sentences in ${sourceLang}...`}
              className="w-full text-xs p-2 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setSourceText("")}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTranslating ? "Translating..." : `Translate to ${targetLang}`}</span>
            </button>
          </div>
        </div>

        {/* Translation Output Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {targetLang} Translation
              </span>
              {translationResult && (
                <button
                  onClick={() => handleCopy(translationResult.translatedText)}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {!translationResult ? (
              <div className="py-14 text-center text-slate-400">
                <Languages className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Translation will appear here</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Click "Translate to {targetLang}" to produce the translation with diacritics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap p-2 bg-slate-50/70 rounded-lg min-h-[140px]">
                  {translationResult.translatedText}
                </div>

                {translationResult.notes && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-snug">
                    <span className="font-semibold block mb-0.5">Linguistic Context:</span>
                    {translationResult.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Preserves tone marks & orthography</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
};
