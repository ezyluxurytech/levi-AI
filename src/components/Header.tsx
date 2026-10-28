import React from "react";
import { Menu, Settings, Sparkles, BookOpen } from "lucide-react";
import { AppMode, ProviderInfo } from "../types/index.ts";

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
  providerInfo: ProviderInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenSettings,
  onToggleMobileMenu,
  providerInfo,
}) => {
  const getModeTitle = () => {
    switch (currentMode) {
      case "dashboard":
        return "Workspace Overview";
      case "document":
        return "Document Understanding";
      case "study":
        return "Study & Practice Engine";
      case "language":
        return "Nigerian Languages Translation";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-8 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      {/* Zone 1: Brand / Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg md:hidden hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0A0E27] border border-indigo-950/40 p-0.5 shrink-0 overflow-hidden shadow-2xs">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI"
              className="w-full h-full object-cover rounded"
            />
          </div>
          <span className="font-bold text-slate-900 whitespace-nowrap">
            Levi AI
          </span>
          <span className="text-slate-300 font-normal">/</span>
          <span className="text-slate-600 font-medium truncate max-w-[125px] sm:max-w-none">
            {getModeTitle()}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (single line, whitespace-nowrap) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
        <button
          onClick={() => onSelectMode("dashboard")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            currentMode === "dashboard" ? "text-indigo-600 font-semibold" : ""
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectMode("document")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            currentMode === "document" ? "text-indigo-600 font-semibold" : ""
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => onSelectMode("study")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            currentMode === "study" ? "text-indigo-600 font-semibold" : ""
          }`}
        >
          Study & Quiz
        </button>
        <button
          onClick={() => onSelectMode("language")}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            currentMode === "language" ? "text-indigo-600 font-semibold" : ""
          }`}
        >
          Translations
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200/60"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">AI Architecture & Settings</span>
          <span className="sm:hidden text-[11px] font-semibold">Engine</span>
        </button>
      </div>
    </header>
  );
};
