import React, { useState, useRef } from "react";
import {
  X,
  BookOpen,
  Upload,
  FileText,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
  Sparkles,
} from "lucide-react";
import type { DocumentPage } from "../types/rag";
import { SAMPLE_DOCUMENTS } from "../data/sampleDocuments";
import { extractTextFromPdf, extractTextFromTxt, parseRawTextToPages } from "../utils/documentParser";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (name: string, pages: DocumentPage[], sampleQuestions: string[]) => void;
  currentDocumentName: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  currentDocumentName,
}) => {
  const [activeTab, setActiveTab] = useState<"preset" | "upload" | "custom">("preset");
  const [customName, setCustomName] = useState("");
  const [customRawText, setCustomRawText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (doc: (typeof SAMPLE_DOCUMENTS)[0]) => {
    onSelectDocument(doc.title, doc.pages, doc.sampleQuestions);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      let pages: DocumentPage[] = [];
      const fileName = file.name.replace(/\.[^/.]+$/, "");

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        pages = await extractTextFromPdf(file);
      } else {
        pages = await extractTextFromTxt(file);
      }

      if (pages.length === 0 || pages.every((p) => !p.text.trim())) {
        throw new Error("No text content could be extracted from this document.");
      }

      // Generate generic sample questions
      const genericQuestions = [
        `What is the main topic covered in ${fileName}?`,
        "Summarize the key requirements or procedures described.",
        "What are the specific rules or deadlines mentioned?",
      ];

      onSelectDocument(fileName, pages, genericQuestions);
      onClose();
    } catch (err: any) {
      console.error("File upload error:", err);
      setUploadError(err.message || "Failed to parse document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRawText.trim()) return;

    const name = customName.trim() || "Custom Document";
    const pages = parseRawTextToPages(customRawText);

    if (pages.length === 0) return;

    onSelectDocument(name, pages, [
      `What is the key takeaway from ${name}?`,
      "Summarize the important points on Page 1.",
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Document Knowledge Base</h3>
              <p className="text-xs text-slate-400">
                Choose a preloaded syllabus, upload your own PDF, or paste text
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("preset")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "preset"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated Documents
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "upload"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF / TXT
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "custom"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Custom Text
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "preset" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Select a document to index into the knowledge base:
              </p>
              {SAMPLE_DOCUMENTS.map((doc) => {
                const isSelected = currentDocumentName === doc.title;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectPreset(doc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{doc.title}</h4>
                          {doc.id === "cs101-syllabus" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                              From Colab Tutorial
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-indigo-400 font-medium mt-0.5">
                          {doc.subtitle}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {doc.description}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium flex-shrink-0">
                        {doc.pages.length} Pages
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.txt,.md"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-8 text-center bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer flex flex-col items-center justify-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Click to browse or drop your document
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Supports <strong>.PDF</strong>, <strong>.TXT</strong>, or <strong>.MD</strong> files.
                  PDFs will be parsed page-by-page and chunked automatically.
                </p>
              </div>

              {isUploading && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-indigo-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Extracting text and page boundaries from PDF...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Project Whitepaper / Team FAQ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Document Text &amp; Page Breaks
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Use <code className="text-indigo-400">--- Page 2 ---</code> for page breaks
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={customRawText}
                  onChange={(e) => setCustomRawText(e.target.value)}
                  placeholder={`Paste document text here...

--- Page 1 ---
Chapter 1: Overview of the architecture...

--- Page 2 ---
Chapter 2: Configuration and security rules...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!customRawText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Load into Knowledge Base
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
