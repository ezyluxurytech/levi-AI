import React from "react";
import {
  BookOpen,
  FileText,
  Languages,
  LayoutDashboard,
  Settings,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AppMode, ProviderInfo } from "../types/index.ts";

interface SidebarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenSettings: () => void;
  providerInfo: ProviderInfo | null;
  uploadedCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onOpenSettings,
  providerInfo,
  uploadedCount,
  isOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: "dashboard" as AppMode,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Overview & quick actions",
    },
    {
      id: "document" as AppMode,
      label: "Document Mode",
      icon: FileText,
      badge: uploadedCount > 0 ? `${uploadedCount} PDF` : null,
      description: "PDF upload & grounded Q&A",
    },
    {
      id: "study" as AppMode,
      label: "Study Mode",
      icon: BookOpen,
      badge: null,
      description: "Summaries, explanations & quizzes",
    },
    {
      id: "language" as AppMode,
      label: "Language Mode",
      icon: Languages,
      badge: "4 Langs",
      description: "Yorùbá, Igbo, Hausa, English",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo Zone */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-indigo-950/50 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/Levi_AI_Learning_Logo_a2b86b0f.png"
                alt="Levi AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                Levi AI
              </div>
              <p className="text-[10px] text-indigo-300/80 font-medium tracking-wide truncate">
                Learn • Understand • Grow
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectMode(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600/90 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-semibold leading-tight">
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-indigo-700/80 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Provider Status Card */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                AI Engine
              </span>
              <span
                className={`text-[10px] font-medium font-mono ${
                  providerInfo?.isConfigured
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {providerInfo?.isConfigured ? "Connected" : "Unconnected"}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 truncate">
              {providerInfo?.name || "Initializing..."}
            </p>
            <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
              Model: {providerInfo?.model || "Standard"}
            </p>
            <button
              onClick={onOpenSettings}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs rounded font-medium transition-colors"
            >
              <Settings className="w-3 h-3 text-slate-400" />
              Configure Provider
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
