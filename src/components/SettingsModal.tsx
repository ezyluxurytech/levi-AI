import React, { useState } from "react";
import {
  X,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  Code2,
  Terminal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { ProviderInfo } from "../types/index.ts";
import { apiClient } from "../services/apiClient.ts";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerInfo: ProviderInfo | null;
  onRefreshProvider: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providerInfo,
  onRefreshProvider,
}) => {
  const [selectedType, setSelectedType] = useState<"gemini" | "custom" | "offline">("gemini");
  const [customEndpoint, setCustomEndpoint] = useState("http://localhost:11434/v1");
  const [customModel, setCustomModel] = useState("llama3:8b");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyConfig = async () => {
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      const res = await apiClient.setProviderConfig({
        providerType: selectedType,
        customEndpoint,
        customModel,
      });
      setStatusMessage(res.message || "Provider updated successfully.");
      onRefreshProvider();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || "Failed to update provider."}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D1B]/80 backdrop-blur-md">
      <div className="bg-[#10182A] rounded-2xl border border-[#1F2942] shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1F2942] bg-[#10182A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#080D1B] border border-[#1F2942] p-1.5 shadow-inner flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
                alt="Levi AI"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  AI Engine & Architecture
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#48DDF7]/10 text-[#48DDF7] border border-[#48DDF7]/30">
                  Telemetry
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Decoupled Provider Architecture & Open-Weight Fallbacks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2942]/60 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs text-slate-300">
          {/* Active Status Banner */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#080D1B] border border-[#1F2942] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Active Telemetry & Model Engine
              </span>
              <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#48DDF7] shadow-[0_0_8px_#48DDF7]" />
                {providerInfo?.name || "Initializing..."}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Model: <span className="text-[#48DDF7]">{providerInfo?.model || "default"}</span>
              </p>
            </div>
            <span
              className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                providerInfo?.isConfigured
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerInfo?.isConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              {providerInfo?.isConfigured ? "Engine Connected" : "Provider Offline"}
            </span>
          </div>

          {/* Architectural Design Note */}
          <div className="p-3.5 rounded-xl bg-[#080D1B] border border-[#B6A1FF]/30 text-slate-300 text-xs space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-[#B6A1FF]">
              <ShieldCheck className="w-4 h-4 text-[#B6A1FF] shrink-0" />
              Decoupled Architectural Contract:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Levi AI adopts a vendor-neutral <code className="bg-[#10182A] border border-[#1F2942] px-1 py-0.5 rounded font-mono text-[10px] text-[#48DDF7]">BaseAIProvider</code> interface. Document parsing, passage-level retrieval, and linguistic algorithms operate independently of backend inference, enabling hot-swapping between Gemini, open-weight endpoints, or offline evaluation without code alterations.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#48DDF7]" />
              Select Inference Engine
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Option 1: Gemini */}
              <button
                type="button"
                onClick={() => setSelectedType("gemini")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "gemini"
                    ? "border-[#48DDF7] bg-[#48DDF7]/10 ring-1 ring-[#48DDF7]"
                    : "border-[#1F2942] hover:border-slate-600 bg-[#080D1B]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Gemini Flash</span>
                  {selectedType === "gemini" && <CheckCircle2 className="w-4 h-4 text-[#48DDF7] shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Cloud reasoning via Google AI Studio Gemini SDK.
                </p>
              </button>

              {/* Option 2: Custom / Open-Weight */}
              <button
                type="button"
                onClick={() => setSelectedType("custom")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "custom"
                    ? "border-[#48DDF7] bg-[#48DDF7]/10 ring-1 ring-[#48DDF7]"
                    : "border-[#1F2942] hover:border-slate-600 bg-[#080D1B]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Open-Weight</span>
                  {selectedType === "custom" && <CheckCircle2 className="w-4 h-4 text-[#48DDF7] shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Local Ollama, vLLM, or Hugging Face endpoint.
                </p>
              </button>

              {/* Option 3: Offline Test Mode */}
              <button
                type="button"
                onClick={() => setSelectedType("offline")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "offline"
                    ? "border-[#48DDF7] bg-[#48DDF7]/10 ring-1 ring-[#48DDF7]"
                    : "border-[#1F2942] hover:border-slate-600 bg-[#080D1B]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Offline / Test</span>
                  {selectedType === "offline" && <CheckCircle2 className="w-4 h-4 text-[#48DDF7] shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Fallback test harness and error simulation.
                </p>
              </button>
            </div>

            {/* Custom Endpoint Inputs */}
            {selectedType === "custom" && (
              <div className="p-3.5 bg-[#080D1B] rounded-xl border border-[#1F2942] space-y-3 mt-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Local Endpoint Advisory:</span> Addresses like <code className="font-mono bg-[#10182A] px-1 py-0.5 rounded text-white">http://localhost:11434</code> run in your local shell. In this cloud preview, connect to an accessible public tunnel or keep <span className="font-semibold text-white">Gemini Flash</span> active for zero-latency server-side AI.
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    API Base URL (OpenAI-compatible)
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full text-xs font-mono bg-[#10182A] border border-[#1F2942] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#48DDF7] focus:ring-1 focus:ring-[#48DDF7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Model Tag / Identifier
                  </label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="llama3:8b, mistral, deepseek-r1"
                    className="w-full text-xs font-mono bg-[#10182A] border border-[#1F2942] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#48DDF7] focus:ring-1 focus:ring-[#48DDF7]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Python Backend Reference Info */}
          <div className="rounded-xl border border-[#1F2942] p-4 bg-[#080D1B] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Code2 className="w-4 h-4 text-[#48DDF7] shrink-0" />
              Python FastAPI Backend Codebase Included
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The project root provides a complete FastAPI backend under <code className="font-mono bg-[#10182A] text-[#48DDF7] px-1 py-0.5 rounded text-[10px]">/backend</code> with <code className="font-mono bg-[#10182A] text-slate-300 px-1 py-0.5 rounded text-[10px]">PyMuPDF</code> extraction, Pydantic schemas, and endpoints ready for standalone microservice deployments.
            </p>
          </div>

          {statusMessage && (
            <p className="text-xs p-3 rounded-lg bg-[#080D1B] text-[#48DDF7] font-mono border border-[#48DDF7]/30">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#1F2942] bg-[#080D1B] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors text-center"
          >
            Close
          </button>
          <button
            onClick={handleApplyConfig}
            disabled={isUpdating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-[#080D1B] bg-gradient-to-r from-[#48DDF7] to-cyan-400 hover:from-cyan-300 hover:to-[#48DDF7] rounded-xl shadow-[0_0_20px_rgba(72,221,247,0.3)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply Engine Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
