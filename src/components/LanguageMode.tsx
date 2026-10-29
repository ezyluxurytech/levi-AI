import React, { useState } from "react";
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Compass,
} from "lucide-react";
import { TranslationData, ProviderInfo } from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

interface LanguageModeProps {
  providerInfo: ProviderInfo | null;
  onOpenSettings: () => void;
  onLogActivity: (title: string, details?: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "English", label: "English", nativeName: "English" },
  { id: "Yoruba", label: "Yorùbá", nativeName: "Èdè Yorùbá" },
  { id: "Igbo", label: "Igbo", nativeName: "Ásụ̀sụ́ Ìgbò" },
  { id: "Hausa", label: "Hausa", nativeName: "Harshen Hausa" },
];

const PRESET_ACADEMIC_PHRASES = [
  {
    title: "Operating Systems Concept",
    sourceText: "Virtual memory allows the computer to use hard drive space as additional RAM when physical memory runs low.",
  },
  {
    title: "Economics Definition",
    sourceText: "Price elasticity of demand measures how much the quantity demanded changes when the price increases.",
  },
  {
    title: "Biochemistry Definition",
    sourceText: "Enzymes act as biological catalysts that speed up biochemical reactions without being consumed in the process.",
  },
  {
    title: "Computer Networks Principle",
    sourceText: "TCP provides reliable, ordered, and error-checked delivery of a stream of packets across an IP network.",
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
    if (translationResult) {
      setSourceText(translationResult.translatedText);
      setTranslationResult(null);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setError(null);
    setIsTranslating(true);

    try {
      const res = await apiClient.translate(sourceText.trim(), sourceLang, targetLang);
      setTranslationResult(res);
      onLogActivity(
        `Language Bridge: ${sourceLang} → ${targetLang}`,
        `Translated: "${sourceText.slice(0, 30)}..."`
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
      <div className="bg-[#10182A] p-4 sm:p-5 rounded-2xl border border-[#1F2942] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#080D1B] border border-emerald-500/40 p-1 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI Language Bridge"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Language Bridge
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-[#080D1B] px-2 py-0.5 rounded border border-[#1F2942]">
                Multilingual Indigenous Bridge
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Translate academic summaries, explanations, and university coursework between English, Èdè Yorùbá, Ásụ̀sụ́ Ìgbò, and Harshen Hausa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-[#080D1B] border border-[#1F2942] text-slate-300">
            4 Supported Languages
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#080D1B] border border-emerald-500/30 text-emerald-400">
            Tonal Diacritics Preservation
          </span>
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
                AI translation backend has not yet been connected. To translate into Yorùbá, Igbo, or Hausa, connect your model provider in settings.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-200 bg-amber-900/60 hover:bg-amber-900 rounded-xl border border-amber-700 transition-colors shrink-0"
          >
            Configure Engine
          </button>
        </div>
      )}

      {/* Language Selector Bar */}
      <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        {/* Source Language Select */}
        <div className="flex-1 flex items-center gap-2">
          <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Source:
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full text-xs font-semibold bg-[#080D1B] border border-[#1F2942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
          className="p-2 self-center rounded-xl bg-[#080D1B] hover:bg-[#162238] text-slate-300 hover:text-white transition-colors border border-[#1F2942] hover:border-emerald-500/40"
          title="Swap source and target languages"
        >
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Target Language Select */}
        <div className="flex-1 flex items-center gap-2">
          <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Target:
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full text-xs font-semibold bg-[#080D1B] border border-[#1F2942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
        <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
          Preset Academic Sentences:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_ACADEMIC_PHRASES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setSourceText(preset.sourceText)}
              className="p-3 rounded-xl bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-emerald-500/40 text-left transition-all group shadow-2xs"
            >
              <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                {preset.title}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-1">
                {preset.sourceText}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Translation Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Source Box */}
        <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1F2942]">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {sourceLang} Source Notes
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
              className="w-full text-xs p-2.5 bg-[#080D1B] border border-[#1F2942] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-none font-sans"
            />
          </div>

          <div className="pt-3 border-t border-[#1F2942] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              onClick={() => setSourceText("")}
              className="text-xs text-slate-400 hover:text-white self-start sm:self-auto py-1 transition-colors"
            >
              Clear Text
            </button>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTranslating ? "Translating Text..." : `Translate to ${targetLang}`}</span>
            </button>
          </div>
        </div>

        {/* Translation Output Box */}
        <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1F2942]">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {targetLang} Translation
              </span>
              {translationResult && (
                <button
                  onClick={() => handleCopy(translationResult.translatedText)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Translation</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {!translationResult ? (
              <div className="py-14 text-center text-slate-500">
                <Languages className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">Translation output will appear here</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Click "Translate to {targetLang}" to produce the academic translation with tonal marks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-white leading-relaxed font-sans whitespace-pre-wrap p-3.5 bg-[#080D1B] border border-[#1F2942] rounded-xl min-h-[140px]">
                  {translationResult.translatedText}
                </div>

                {translationResult.notes && (
                  <div className="p-3 rounded-xl bg-[#080D1B] border border-emerald-500/30 text-[11px] text-emerald-300 leading-snug">
                    <span className="font-bold block mb-0.5 font-mono text-emerald-400">
                      Linguistic Context & Tonal Orthography:
                    </span>
                    {translationResult.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1F2942] text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Preserves tone marks & diacritics</span>
            <span className="text-emerald-400">Authentic Translation</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-300 bg-red-950/40 p-3.5 rounded-xl border border-red-800">
          {error}
        </p>
      )}
    </div>
  );
};
