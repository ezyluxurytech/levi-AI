import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { DocumentMode } from "./components/DocumentMode.tsx";
import { StudyMode } from "./components/StudyMode.tsx";
import { LanguageMode } from "./components/LanguageMode.tsx";
import { SettingsModal } from "./components/SettingsModal.tsx";
import { LoginScreen } from "./components/LoginScreen.tsx";
import {
  AppMode,
  AuthUser,
  DocumentMetadata,
  ProviderInfo,
  RecentActivityItem,
} from "./types/index.ts";
import { apiClient } from "./services/apiClient.ts";
import { LayoutDashboard, FileText, BookOpen, Languages } from "lucide-react";

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentMetadata[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [studyInitialTab, setStudyInitialTab] = useState<"summarize" | "explain" | "quiz">("summarize");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("levi_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("levi_theme", theme);
  }, [theme]);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("levi_ai_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const handleLogin = (user: AuthUser, remember: boolean) => {
    setCurrentUser(user);
    if (remember && typeof window !== "undefined") {
      localStorage.setItem("levi_ai_user", JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("levi_ai_user");
    }
    setCurrentUser(null);
    setCurrentMode("dashboard");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Fetch provider info on mount
  const refreshProviderInfo = () => {
    apiClient
      .getProviderInfo()
      .then((info) => setProviderInfo(info))
      .catch((err) => {
        console.error("Failed to load provider info:", err);
      });
  };

  useEffect(() => {
    refreshProviderInfo();
  }, []);

  const handleSelectMode = (mode: AppMode, tab?: "summarize" | "explain" | "quiz") => {
    if (mode === "study" && tab) {
      setStudyInitialTab(tab);
    }
    setCurrentMode(mode);
  };

  const logActivity = (title: string, details?: string) => {
    const newActivity: RecentActivityItem = {
      id: `act-${Date.now()}`,
      title,
      details,
      timestamp: new Date().toISOString(),
      mode: currentMode,
      type:
        currentMode === "document"
          ? "document_qa"
          : currentMode === "language"
          ? "translation"
          : "study_summary",
    };
    setRecentActivities((prev) => [newActivity, ...prev].slice(0, 15));
  };

  const handleFileUpload = async (file: File) => {
    // Frontend file validation
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Invalid file type. Please upload a PDF document (.pdf).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const docMeta = await apiClient.uploadDocument(file);
      setUploadedDocuments((prev) => [docMeta, ...prev.filter((d) => d.id !== docMeta.id)]);
      setActiveDocumentId(docMeta.id);
      setCurrentMode("document");
      logActivity(`Uploaded PDF: ${docMeta.filename}`, `${docMeta.pageCount} page(s) extracted`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and extract PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    // Filter to PDF files
    const pdfFiles = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setUploadError(
        `No PDF files found in folder (${files.length} non-PDF file(s) ignored). Please select a folder containing .pdf files.`
      );
      return;
    }

    // Check individual file size limit (10MB)
    const oversized = pdfFiles.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setUploadError(`File "${oversized.name}" exceeds the 10MB limit. Please remove it or use smaller PDFs.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await apiClient.uploadBatchDocuments(pdfFiles);
      if (res.documents && res.documents.length > 0) {
        setUploadedDocuments((prev) => {
          const newDocIds = new Set(res.documents.map((d) => d.id));
          return [...res.documents, ...prev.filter((d) => !newDocIds.has(d.id))];
        });
        setActiveDocumentId(res.documents[0].id);
        setCurrentMode("document");
        logActivity(
          `Uploaded Folder (${res.documents.length} PDF${res.documents.length > 1 ? "s" : ""})`,
          res.message
        );
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to process folder upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleDocument = async () => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const docMeta = await apiClient.loadSampleDocument();
      setUploadedDocuments((prev) => [docMeta, ...prev.filter((d) => d.id !== docMeta.id)]);
      setActiveDocumentId(docMeta.id);
      setCurrentMode("document");
      logActivity(`Loaded Sample PDF: ${docMeta.filename}`, `${docMeta.pageCount} page(s)`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to load sample document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Gate dashboard behind Student Email Login
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme === "light" ? "bg-[#F8FAFC] text-slate-900" : "bg-[#080D1B] text-slate-100"} flex flex-col md:flex-row antialiased selection:bg-[#48DDF7]/30 selection:text-white`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentMode={currentMode}
        onSelectMode={(mode) => handleSelectMode(mode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        providerInfo={providerInfo}
        uploadedCount={uploadedDocuments.length}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          currentMode={currentMode}
          onSelectMode={(mode) => handleSelectMode(mode)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          providerInfo={providerInfo}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentMode === "dashboard" && (
            <Dashboard
              onSelectMode={handleSelectMode}
              onFileUpload={handleFileUpload}
              onBatchUpload={handleBatchUpload}
              onLoadSampleDocument={handleLoadSampleDocument}
              isUploading={isUploading}
              uploadError={uploadError}
              uploadedDocuments={uploadedDocuments}
              recentActivities={recentActivities}
              providerInfo={providerInfo}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {currentMode === "document" && (
            <DocumentMode
              documents={uploadedDocuments}
              activeDocumentId={activeDocumentId}
              onSelectDocument={(id) => setActiveDocumentId(id)}
              onFileUpload={handleFileUpload}
              onBatchUpload={handleBatchUpload}
              onLoadSampleDocument={handleLoadSampleDocument}
              isUploading={isUploading}
              uploadError={uploadError}
              onLogActivity={logActivity}
            />
          )}

          {currentMode === "study" && (
            <StudyMode
              initialTab={studyInitialTab}
              providerInfo={providerInfo}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLogActivity={logActivity}
            />
          )}

          {currentMode === "language" && (
            <LanguageMode
              providerInfo={providerInfo}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLogActivity={logActivity}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (< md) */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#10182A]/95 backdrop-blur-md border-t border-[#1F2942] md:hidden flex items-center justify-around py-2 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
        >
          <button
            onClick={() => handleSelectMode("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "dashboard"
                ? "text-[#48DDF7] font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Deck</span>
          </button>

          <button
            onClick={() => handleSelectMode("document")}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
              currentMode === "document"
                ? "text-[#48DDF7] font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Doc Lab</span>
            {uploadedDocuments.length > 0 && (
              <span className="absolute top-0.5 right-6 w-2 h-2 rounded-full bg-[#48DDF7] shadow-[0_0_6px_#48DDF7]" />
            )}
          </button>

          <button
            onClick={() => handleSelectMode("study")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "study"
                ? "text-[#48DDF7] font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Study</span>
          </button>

          <button
            onClick={() => handleSelectMode("language")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "language"
                ? "text-[#48DDF7] font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Languages className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Language</span>
          </button>
        </nav>
      </div>

      {/* Settings & Architecture Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        providerInfo={providerInfo}
        onRefreshProvider={refreshProviderInfo}
      />
    </div>
  );
}

