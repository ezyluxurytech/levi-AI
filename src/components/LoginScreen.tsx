import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react";
import { AuthUser } from "../types/index.ts";

interface LoginScreenProps {
  onLogin: (user: AuthUser, remember: boolean) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  theme,
  onToggleTheme,
}) => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Load remembered email on mount if previous user saved it
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("levi_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const handleClearRemembered = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("levi_remembered_email");
    setEmail("");
    setSuccessNotice("Remembered email cleared.");
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  const handleGuestAccess = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      onLogin(
        {
          email: "guest.scholar@academic.local",
          name: "Guest Scholar",
          institution: "Open Research",
          loginAt: new Date().toISOString(),
        },
        false
      );
      setIsLoading(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@university.edu).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (authMode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please retype carefully.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    // Save or clear remembered email
    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem("levi_remembered_email", cleanEmail);
      } else {
        localStorage.removeItem("levi_remembered_email");
      }
    }

    const derivedName =
      name.trim() ||
      cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    setTimeout(() => {
      onLogin(
        {
          email: cleanEmail,
          name: derivedName,
          institution: institution.trim() || (authMode === "signup" ? "Student Researcher" : "University Scholar"),
          loginAt: new Date().toISOString(),
        },
        rememberMe
      );
      setIsLoading(false);
    }, 400);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      return;
    }
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setSuccessNotice(`Password reset instructions sent to ${forgotEmail.trim()}`);
      setTimeout(() => setSuccessNotice(null), 4000);
    }, 1200);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
        theme === "light"
          ? "bg-[#F8FAFC] text-slate-900"
          : "bg-[#080D1B] text-slate-100"
      }`}
    >
      {/* Top Bar with Minimalist Brand & Theme Toggle */}
      <header
        className={`w-full px-5 sm:px-8 py-3.5 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
          theme === "light"
            ? "bg-white/80 border-slate-200"
            : "bg-[#080D1B]/80 border-[#1F2942]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg p-0.5 border flex items-center justify-center overflow-hidden transition-all ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 shadow-xs"
                : "bg-[#10182A] border-[#48DDF7]/30 shadow-[0_0_12px_rgba(72,221,247,0.2)]"
            }`}
          >
            <img
              src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
              alt="Levi AI"
              className="w-full h-full object-cover rounded-md"
            />
          </div>
          <div>
            <span
              className={`font-bold tracking-tight text-base ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              Levi AI
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-[#10182A] hover:bg-[#162238] border-[#1F2942] text-slate-200"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
          }`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Authentication Flow Container (ChatGPT-Style Centered Card) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative">
        <div className="w-full max-w-[420px]">
          {/* Brand Icon Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className={`w-14 h-14 rounded-2xl p-1 mb-3.5 border flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200 ${
                theme === "light"
                  ? "bg-white border-slate-200 shadow-slate-200/60"
                  : "bg-[#10182A] border-[#48DDF7]/40 shadow-[0_0_25px_rgba(72,221,247,0.25)]"
              }`}
            >
              <img
                src="/assets/aistudio/Levi_AI_Futuristic_Learning_Logo_70308b03.png"
                alt="Levi AI"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h1
              className={`text-2xl sm:text-[26px] font-bold tracking-tight ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p
              className={`text-xs mt-1.5 ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {authMode === "login"
                ? "Enter your academic credentials to access your Study Deck"
                : "Sign up to start document inquiry, quiz generation, and summaries"}
            </p>
          </div>

          {/* Success / Info Toast */}
          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card Form */}
          <div
            className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
                : "bg-[#10182A] border-[#1F2942] shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="auth-email"
                  className={`block text-xs font-semibold mb-1 ${
                    theme === "light" ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="name@university.edu"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        : "bg-[#080D1B] border-[#1F2942] text-white placeholder:text-slate-500 focus:border-[#48DDF7] focus:ring-2 focus:ring-[#48DDF7]/20"
                    }`}
                  />
                </div>
                {/* Remembered Email Clear Hint */}
                {email && rememberMe && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-0.5">
                    <span>Remembered on this device</span>
                    <button
                      type="button"
                      onClick={handleClearRemembered}
                      className="text-sky-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Extra Sign Up Fields */}
              {authMode === "signup" && (
                <>
                  <div>
                    <label
                      htmlFor="signup-name"
                      className={`block text-xs font-semibold mb-1 ${
                        theme === "light" ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Full name{" "}
                      <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                          theme === "light"
                            ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                            : "bg-[#080D1B] border-[#1F2942] text-white placeholder:text-slate-500 focus:border-[#48DDF7] focus:ring-2 focus:ring-[#48DDF7]/20"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-institution"
                      className={`block text-xs font-semibold mb-1 ${
                        theme === "light" ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      University or Institution{" "}
                      <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-institution"
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. University of Lagos"
                        className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                          theme === "light"
                            ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                            : "bg-[#080D1B] border-[#1F2942] text-white placeholder:text-slate-500 focus:border-[#48DDF7] focus:ring-2 focus:ring-[#48DDF7]/20"
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className={`block text-xs font-semibold ${
                      theme === "light" ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Password
                  </label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-medium text-sky-500 hover:text-sky-400 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        : "bg-[#080D1B] border-[#1F2942] text-white placeholder:text-slate-500 focus:border-[#48DDF7] focus:ring-2 focus:ring-[#48DDF7]/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up Mode) */}
              {authMode === "signup" && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className={`block text-xs font-semibold mb-1 ${
                      theme === "light" ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          : "bg-[#080D1B] border-[#1F2942] text-white placeholder:text-slate-500 focus:border-[#48DDF7] focus:ring-2 focus:ring-[#48DDF7]/20"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`text-xs ${
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    Remember my email on this device
                  </span>
                </label>
              </div>

              {/* Primary ChatGPT-Style Continue Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-3 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] ${
                  theme === "light"
                    ? "bg-[#10182A] hover:bg-slate-800 text-white shadow-slate-900/10"
                    : "bg-white hover:bg-slate-100 text-slate-950 shadow-white/10"
                }`}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div
                className={`absolute inset-0 flex items-center ${
                  theme === "light" ? "border-slate-200" : "border-[#1F2942]"
                }`}
              >
                <div
                  className={`w-full border-t ${
                    theme === "light" ? "border-slate-200" : "border-[#1F2942]"
                  }`}
                />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span
                  className={`px-2 text-[11px] font-medium ${
                    theme === "light"
                      ? "bg-white text-slate-400"
                      : "bg-[#10182A] text-slate-500"
                  }`}
                >
                  OR
                </span>
              </div>
            </div>

            {/* Quick Guest Scholar Access */}
            <button
              type="button"
              onClick={handleGuestAccess}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                theme === "light"
                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  : "bg-[#080D1B] hover:bg-[#162238] border-[#1F2942] text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Continue as Guest Scholar</span>
            </button>
          </div>

          {/* ChatGPT-Style Log in / Sign up Switcher Footer */}
          <div className="text-center mt-5">
            {authMode === "login" ? (
              <p
                className={`text-xs ${
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                }`}
              >
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setError(null);
                  }}
                  className={`font-semibold underline underline-offset-2 cursor-pointer ${
                    theme === "light"
                      ? "text-indigo-600 hover:text-indigo-700"
                      : "text-[#48DDF7] hover:text-[#7ce6f9]"
                  }`}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p
                className={`text-xs ${
                  theme === "light" ? "text-slate-600" : "text-slate-400"
                }`}
              >
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setError(null);
                  }}
                  className={`font-semibold underline underline-offset-2 cursor-pointer ${
                    theme === "light"
                      ? "text-indigo-600 hover:text-indigo-700"
                      : "text-[#48DDF7] hover:text-[#7ce6f9]"
                  }`}
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl relative ${
              theme === "light"
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#10182A] border-[#1F2942] text-white"
            }`}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2 text-sky-400">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-bold text-base">Reset your password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter your academic email address and we'll send you instructions to reset your password.
            </p>
            <form onSubmit={handleSendResetLink} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@university.edu"
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-hidden ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200 text-slate-900"
                    : "bg-[#080D1B] border-[#1F2942] text-white"
                }`}
              />
              <button
                type="submit"
                disabled={forgotSent}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors cursor-pointer"
              >
                {forgotSent ? "Sending reset email..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer
        className={`py-3.5 px-4 text-center text-[11px] border-t transition-colors ${
          theme === "light"
            ? "bg-white/50 border-slate-200 text-slate-400"
            : "bg-[#080D1B]/50 border-[#1F2942] text-slate-500"
        }`}
      >
        <span>Levi AI Academic Intelligence Platform · Document-Grounded Learning</span>
      </footer>
    </div>
  );
};
