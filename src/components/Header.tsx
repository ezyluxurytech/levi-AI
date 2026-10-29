import React from "react";
import { Menu, Sun, Moon, LogOut, UserCheck } from "lucide-react";
import { AppMode, ProviderInfo, AuthUser } from "../types/index.ts";

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onToggleMobileMenu: () => void;
  providerInfo: ProviderInfo | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onToggleMobileMenu,
  providerInfo,
  theme,
  onToggleTheme,
  currentUser,
  onLogout,
}) => {
  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-6 px-3.5 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md border-b transition-colors ${
      theme === "light"
        ? "bg-white/95 border-slate-200 text-slate-800"
        : "bg-[#080D1B]/95 border-[#1F2942] text-white"
    }`}>
      {/* Zone 1: Brand / Platform Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-[#10182A] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs sm:text-sm min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#10182A] border border-[#1F2942] p-0.5 shrink-0 overflow-hidden shadow-[0_0_15px_rgba(72,221,247,0.15)] flex items-center justify-center">
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI"
              className="w-full h-full object-cover rounded"
            />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-white tracking-tight whitespace-nowrap text-base sm:text-lg">
              Levi AI
            </span>
            <span className="text-slate-400 font-medium text-xs hidden sm:inline">
              Learn · Understand · Grow
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-medium">
        <button
          onClick={() => onSelectMode("dashboard")}
          className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            currentMode === "dashboard"
              ? "bg-[#10182A] text-[#48DDF7] border border-[#48DDF7]/30 shadow-[0_0_12px_rgba(72,221,247,0.15)] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#10182A]/60"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectMode("document")}
          className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            currentMode === "document"
              ? "bg-[#10182A] text-[#48DDF7] border border-[#48DDF7]/30 shadow-[0_0_12px_rgba(72,221,247,0.15)] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#10182A]/60"
          }`}
        >
          Document Lab
        </button>
        <button
          onClick={() => onSelectMode("study")}
          className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            currentMode === "study"
              ? "bg-[#10182A] text-[#B6A1FF] border border-[#B6A1FF]/30 shadow-[0_0_12px_rgba(182,161,255,0.15)] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#10182A]/60"
          }`}
        >
          Study & Synthesis
        </button>
        <button
          onClick={() => onSelectMode("language")}
          className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            currentMode === "language"
              ? "bg-[#10182A] text-[#48DDF7] border border-[#48DDF7]/30 shadow-[0_0_12px_rgba(72,221,247,0.15)] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#10182A]/60"
          }`}
        >
          Language Bridge
        </button>
      </nav>

      {/* Zone 3: User Status, Theme Toggle & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* User Profile Badge (if logged in) */}
        {currentUser && (
          <div
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-[#10182A] border-[#1F2942] text-slate-300"
            }`}
            title={`Signed in as ${currentUser.email} (${currentUser.institution || "Student"})`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="max-w-[130px] lg:max-w-[180px] truncate">
              <span className="font-semibold text-xs block truncate leading-tight">
                {currentUser.name || currentUser.email}
              </span>
              <span className="text-[10px] text-slate-400 block truncate leading-tight">
                {currentUser.institution || currentUser.email}
              </span>
            </div>
          </div>
        )}

        {/* Eye-catching Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={`group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
            theme === "dark"
              ? "bg-[#10182A] hover:bg-[#162238] border border-[#1F2942] hover:border-[#48DDF7]/50 text-slate-200 shadow-[0_0_12px_rgba(0,0,0,0.3)]"
              : "bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-400 text-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
          }`}
        >
          {theme === "dark" ? (
            <>
              <div className="w-5 h-5 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:rotate-45 transition-transform duration-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]">
                <Sun className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span className="hidden md:inline font-medium text-slate-200 group-hover:text-white transition-colors">
                Light
              </span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:-rotate-12 transition-transform duration-300 shadow-[0_0_8px_rgba(99,102,241,0.25)]">
                <Moon className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span className="hidden md:inline font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                Dark
              </span>
            </>
          )}
        </button>

        {/* Sign Out Button */}
        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            title={`Sign out (${currentUser.email})`}
            aria-label="Sign out"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600"
                : "bg-[#10182A] hover:bg-rose-950/40 border-[#1F2942] hover:border-rose-500/40 text-slate-300 hover:text-rose-400"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
