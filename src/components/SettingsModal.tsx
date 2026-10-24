import React, { useState } from "react";
import {
  X,
  Sliders,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Check,
  Shield,
  Info,
} from "lucide-react";
import type { RagSettings } from "../types/rag";
import { DEFAULT_ANSWER_RULES, DEFAULT_RAG_SETTINGS } from "../data/sampleDocuments";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RagSettings;
  onSave: (newSettings: RagSettings) => void;
  currentChunkCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  currentChunkCount,
}) => {
  const [form, setForm] = useState<RagSettings>({ ...settings });

  if (!isOpen) return null;

  const handleReset = () => {
    setForm({
      ...DEFAULT_RAG_SETTINGS,
    });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const stepSize = Math.max(1, form.chunkSize - form.chunkOverlap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">RAG Settings &amp; Hyperparameters</h3>
              <p className="text-xs text-slate-400">
                Configure chunking window, retrieval top-k, and Gemini grounding rules
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section: Chunking Window */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Stage 1: Chunk Size &amp; Overlap
              </label>
              <span className="text-[11px] text-slate-400">
                Sliding Step: <strong className="text-indigo-300 font-mono">{stepSize} words</strong>
              </span>
            </div>

            {/* Chunk Size */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-slate-200 text-xs">CHUNK_SIZE (words)</span>
                  <p className="text-[11px] text-slate-500">
                    Small (50w): more precise matches. Large (300w): broader context.
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {form.chunkSize} words
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={400}
                step={10}
                value={form.chunkSize}
                onChange={(e) => setForm({ ...form, chunkSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Chunk Overlap */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-slate-200 text-xs">CHUNK_OVERLAP (words)</span>
                  <p className="text-[11px] text-slate-500">
                    Words shared by neighboring chunks so sentences are not split.
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {form.chunkOverlap} words
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(100, Math.floor(form.chunkSize / 2))}
                step={5}
                value={form.chunkOverlap}
                onChange={(e) => setForm({ ...form, chunkOverlap: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Retrieval & Temperature */}
          <div className="space-y-4">
            <label className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              Stage 3 &amp; 4: Retrieval Top-K &amp; Model Temperature
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TOP_K */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200 text-xs">TOP_K Chunks</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {form.topK}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Number of most relevant passages sent to the model for each query.
                </p>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={form.topK}
                  onChange={(e) => setForm({ ...form, topK: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* TEMPERATURE */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200 text-xs">TEMPERATURE</span>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {form.temperature}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Low value (0.2) keeps answers strict and close to the document context.
                </p>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={form.temperature}
                  onChange={(e) =>
                    setForm({ ...form, temperature: parseFloat(Number(e.target.value).toFixed(2)) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Generation Model
              </span>
              <span className="text-[11px] text-slate-500">Server-Side Gemini</span>
            </div>
            <select
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended: ultra-fast, strict citation compliance)</option>
              <option value="gemini-4-argon">gemini-4-argon (Flagship reasoning model for complex documents)</option>
            </select>
          </div>

          {/* Strict Answer Rules */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-200 text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                ANSWER_RULES (System Instruction)
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, systemInstruction: DEFAULT_ANSWER_RULES })}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Reset Rules
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The rules the model follows to prevent hallucination and ensure exact citations.
            </p>
            <textarea
              rows={4}
              value={form.systemInstruction}
              onChange={(e) => setForm({ ...form, systemInstruction: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all to Colab defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
