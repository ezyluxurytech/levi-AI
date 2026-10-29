import React from "react";
import {
  BookOpen,
  FileText,
  Languages,
  LayoutDashboard,
  Settings,
  Cpu,
  Layers,
  Sparkles,
  X,
  Compass,
  Zap,
} from "lucide-react";
import { AppMode, ProviderInfo, AuthUser } from "../types/index.ts";
import { LogOut, GraduationCap } from "lucide-react";

interface SidebarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenSettings: () => void;
  providerInfo: ProviderInfo | null;
  uploadedCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onOpenSettings,
  providerInfo,
  uploadedCount,
  isOpen,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    {
      id: "dashboard" as AppMode,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Academic launchpad & overview",
    },
    {
      id: "document" as AppMode,
      label: "Document Lab",
      icon: FileText,
      badge: uploadedCount > 0 ? `${uploadedCount} PDF` : null,
      description: "PDF extraction & grounded citations",
    },
    {
      id: "study" as AppMode,
      label: "Study & Synthesis",
      icon: BookOpen,
      badge: "Quizzes",
      description: "Summaries, analogies & quizzes",
    },
    {
      id: "language" as AppMode,
      label: "Language Bridge",
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
          className="fixed inset-0 z-40 bg-[#080D1B]/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080D1B] text-slate-300 flex flex-col border-r border-[#1F2942] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo Zone */}
        <div className="p-4 border-b border-[#1F2942] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#10182A] border border-[#48DDF7]/30 p-1 shadow-[0_0_18px_rgba(72,221,247,0.2)] shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
                alt="Levi AI"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-white tracking-tight truncate">
                Levi AI
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate mt-0.5">
                Academic AI Platform
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#10182A] md:hidden transition-colors"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tagline Ribbon */}
        <div className="px-4 py-2 bg-[#10182A]/40 border-b border-[#1F2942]/60 text-[11px] text-[#48DDF7] font-medium tracking-wider flex items-center justify-between">
          <span>Learn · Understand · Grow</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#48DDF7] animate-pulse" />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-[#10182A] text-white border border-[#48DDF7]/40 shadow-[0_0_14px_rgba(72,221,247,0.12)]"
                    : "text-slate-300 hover:bg-[#10182A]/60 hover:text-white border border-transparent"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#48DDF7]/15 text-[#48DDF7] border border-[#48DDF7]/30"
                      : "bg-[#10182A] text-slate-400 group-hover:text-white group-hover:border-[#1F2942]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-semibold leading-tight text-white">
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? "text-[#48DDF7]" : "text-slate-400"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-[#48DDF7]/20 text-[#48DDF7] border border-[#48DDF7]/40 font-semibold"
                        : "bg-[#10182A] text-slate-400 border border-[#1F2942]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Provider Telemetry & Student Account Card */}
        <div className="p-3 border-t border-[#1F2942] space-y-2.5">
          {/* Active Student Info */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-[#10182A]/80 border border-[#1F2942] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentUser.name || currentUser.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    onCloseMobile();
                  }}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#162238] transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#10182A] border border-[#1F2942] shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#48DDF7]" />
                AI Engine
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  providerInfo?.isConfigured
                    ? "bg-[#48DDF7]/15 text-[#48DDF7] border border-[#48DDF7]/30"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {providerInfo?.isConfigured ? "Online" : "Standby"}
              </span>
            </div>
            <p className="text-xs font-semibold text-white truncate">
              {providerInfo?.name || "Initializing..."}
            </p>
            <p className="text-[10px] font-mono text-[#B6A1FF] truncate mt-0.5">
              Active: {providerInfo?.model || "Standard"}
            </p>
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#080D1B] hover:bg-[#162238] text-slate-200 hover:text-white text-xs rounded-lg font-medium transition-all border border-[#1F2942] hover:border-[#48DDF7]/30"
            >
              <Settings className="w-3 h-3 text-slate-400" />
              Engine Settings
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
