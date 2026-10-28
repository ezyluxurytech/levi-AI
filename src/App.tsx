import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { DocumentMode } from "./components/DocumentMode.tsx";
import { StudyMode } from "./components/StudyMode.tsx";
import { LanguageMode } from "./components/LanguageMode.tsx";
import { SettingsModal } from "./components/SettingsModal.tsx";
import {
  AppMode,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        providerInfo={providerInfo}
        uploadedCount={uploadedDocuments.length}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          currentMode={currentMode}
          onSelectMode={(mode) => setCurrentMode(mode)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          providerInfo={providerInfo}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentMode === "dashboard" && (
            <Dashboard
              onSelectMode={(mode) => setCurrentMode(mode)}
              onFileUpload={handleFileUpload}
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
              onLoadSampleDocument={handleLoadSampleDocument}
              isUploading={isUploading}
              uploadError={uploadError}
              onLogActivity={logActivity}
            />
          )}

          {currentMode === "study" && (
            <StudyMode
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
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden flex items-center justify-around py-2 px-1 shadow-lg"
        >
          <button
            onClick={() => setCurrentMode("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "dashboard"
                ? "text-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Overview</span>
          </button>

          <button
            onClick={() => setCurrentMode("document")}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
              currentMode === "document"
                ? "text-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Documents</span>
            {uploadedDocuments.length > 0 && (
              <span className="absolute top-0.5 right-6 w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => setCurrentMode("study")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "study"
                ? "text-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Study</span>
          </button>

          <button
            onClick={() => setCurrentMode("language")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentMode === "language"
                ? "text-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Languages className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Translate</span>
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
