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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Brand / Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-md md:hidden hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            Levi AI
          </span>
          <span className="text-slate-400 font-normal">/</span>
          <span className="text-slate-600 font-medium whitespace-nowrap">
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
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200/60"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>AI Architecture & Settings</span>
        </button>
      </div>
    </header>
  );
};
