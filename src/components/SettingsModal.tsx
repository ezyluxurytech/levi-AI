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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Levi_AI_Learning_Logo_a2b86b0f.png"
                alt="Levi AI"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Architecture & Provider Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Replaceable AI Provider Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Active Status Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Active Provider
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {providerInfo?.name || "Initializing..."}
              </p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Model: {providerInfo?.model || "default"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                providerInfo?.isConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {providerInfo?.isConfigured ? "Connected" : "Unconnected"}
            </span>
          </div>

          {/* Architectural Design Note */}
          <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Decoupled Architecture:
            </p>
            <p className="text-[11px] leading-relaxed text-indigo-900/90">
              Levi AI adopts a decoupled <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[10px]">BaseAIProvider</code> interface. No single vendor is hardcoded into the business logic. Document-grounded passage retrieval is independent of inference, allowing users to hot-swap between Gemini 3.8 Flash, local open-weight engines (Ollama / vLLM), or mock mode without modifying the application code.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Switch Backend Provider Engine
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Gemini */}
              <button
                type="button"
                onClick={() => setSelectedType("gemini")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "gemini"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Gemini 3.8 Flash</span>
                  {selectedType === "gemini" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Built-in server-side SDK using GEMINI_API_KEY.
                </p>
              </button>

              {/* Option 2: Custom / Open-Weight */}
              <button
                type="button"
                onClick={() => setSelectedType("custom")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "custom"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Open-Weight</span>
                  {selectedType === "custom" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Local Ollama, vLLM, or Hugging Face endpoint.
                </p>
              </button>

              {/* Option 3: Offline Test Mode */}
              <button
                type="button"
                onClick={() => setSelectedType("offline")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedType === "offline"
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Offline / Test</span>
                  {selectedType === "offline" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Tests fallback and error states when disconnected.
                </p>
              </button>
            </div>

            {/* Custom Endpoint Inputs */}
            {selectedType === "custom" && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-3">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Local Endpoint Advisory:</span> Addresses like <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">http://localhost:11434</code> require an Ollama instance running locally. In this cloud preview, connect to an external accessible URL or keep <span className="font-semibold">Gemini 3.8 Flash</span> selected for instant server-side AI.
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    API Base URL (OpenAI-compatible)
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Model Tag / Identifier
                  </label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="llama3:8b, mistral, deepseek-r1"
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Python Backend Reference Info */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Code2 className="w-4 h-4 text-indigo-600" />
              Python FastAPI Backend Codebase Included
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              The project root includes a complete Python FastAPI backend under <code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">/backend</code> with <code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">PyMuPDF</code> extraction, Pydantic schemas, and FastAPI routes for direct submission and deployment.
            </p>
          </div>

          {statusMessage && (
            <p className="text-xs p-2.5 rounded-lg bg-slate-100 text-slate-800 font-medium border border-slate-200">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
          <button
            onClick={handleApplyConfig}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply Provider Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
