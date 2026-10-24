import React from "react";
import {
  FileText,
  Sliders,
  Sparkles,
  GitCommit,
  Code2,
  Upload,
  BookOpen,
  Zap,
} from "lucide-react";
import type { KnowledgeBase } from "../types/rag";

interface HeaderProps {
  activeTab: "chat" | "chunks" | "pipeline" | "settings" | "code";
  setActiveTab: (tab: "chat" | "chunks" | "pipeline" | "settings" | "code") => void;
  knowledgeBase: KnowledgeBase;
  onOpenDocModal: () => void;
  onOpenSettingsModal: () => void;
  isApiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  knowledgeBase,
  onOpenDocModal,
  onOpenSettingsModal,
  isApiConnected,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Document info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2 truncate">
                  RAG Studio
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-medium">
                    v1.0
                  </span>
                </h1>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {isApiConnected ? "Gemini Live" : "Demo Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                <span className="truncate text-slate-300 font-medium">{knowledgeBase.name}</span>
                <span className="text-slate-600">•</span>
                <span>{knowledgeBase.pages.length} Pages</span>
                <span className="text-slate-600">•</span>
                <span>{knowledgeBase.chunks.length} Chunks</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              RAG Q&A
            </button>
            <button
              onClick={() => setActiveTab("chunks")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "chunks"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Chunks ({knowledgeBase.chunks.length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "pipeline"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              4-Stage Pipeline
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python Colab
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDocModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Change document, upload PDF or write custom pages"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Docs / PDF</span>
            </button>

            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="RAG Parameters: Chunk size, overlap, Top-K, model"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === "chat" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400"
            }`}
          >
            RAG Q&A
          </button>
          <button
            onClick={() => setActiveTab("chunks")}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === "chunks" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400"
            }`}
          >
            Chunks
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === "pipeline" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400"
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === "code" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400"
            }`}
          >
            Python
          </button>
        </div>
      </div>
    </header>
  );
};
