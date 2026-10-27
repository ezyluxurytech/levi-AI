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

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
