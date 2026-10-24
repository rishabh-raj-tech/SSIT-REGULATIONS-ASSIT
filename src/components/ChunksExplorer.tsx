import React, { useState } from "react";
import {
  FileText,
  Search,
  Hash,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Copy,
  Check,
} from "lucide-react";
import type { Chunk, KnowledgeBase, RagSettings } from "../types/rag";
import { generateLocalVector, cosineSimilarity } from "../utils/ragEngine";

interface ChunksExplorerProps {
  knowledgeBase: KnowledgeBase;
  settings: RagSettings;
  selectedChunkId?: string;
  onOpenSettings: () => void;
}

export const ChunksExplorer: React.FC<ChunksExplorerProps> = ({
  knowledgeBase,
  settings,
  selectedChunkId,
  onOpenSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<number | "all">("all");
  const [testQuery, setTestQuery] = useState("");
  const [testScores, setTestScores] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pages = Array.from(new Set(knowledgeBase.chunks.map((c) => c.page))).sort((a, b) => a - b);

  const handleTestQuery = (query: string) => {
    setTestQuery(query);
    if (!query.trim()) {
      setTestScores({});
      return;
    }
    const qVec = generateLocalVector(query);
    const scores: Record<string, number> = {};
    for (const chunk of knowledgeBase.chunks) {
      const cVec = chunk.vector && chunk.vector.length === qVec.length ? chunk.vector : generateLocalVector(chunk.text);
      scores[chunk.id] = Math.max(0, cosineSimilarity(qVec, cVec));
    }
    setTestScores(scores);
  };

  const filteredChunks = knowledgeBase.chunks.filter((chunk) => {
    const matchesSearch =
      searchTerm === "" ||
      chunk.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPage = selectedPage === "all" || chunk.page === selectedPage;
    return matchesSearch && matchesPage;
  });

  // Sort by test score if query is active
  if (testQuery.trim()) {
    filteredChunks.sort((a, b) => (testScores[b.id] ?? 0) - (testScores[a.id] ?? 0));
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Stage 1 &amp; 2 Chunks &amp; Vector Store Explorer
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Document partitioned into sliding windows of{" "}
              <strong className="text-slate-200">{settings.chunkSize} words</strong> with an
              overlap of <strong className="text-slate-200">{settings.chunkOverlap} words</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Adjust Chunk Size / Overlap
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Chunks
            </span>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{knowledgeBase.chunks.length}</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Document Pages
            </span>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{knowledgeBase.pages.length}</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Overlap Step
            </span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">
              {Math.max(1, settings.chunkSize - settings.chunkOverlap)}w
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Vector Space
            </span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">256-D</p>
          </div>
        </div>

        {/* Test query simulator */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={testQuery}
                onChange={(e) => handleTestQuery(e.target.value)}
                placeholder="Test query similarity ranking (e.g. 'late submission penalty' or 'final exam')..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {testQuery && (
              <button
                onClick={() => handleTestQuery("")}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Clear Test
              </button>
            )}
          </div>
          {testQuery && (
            <p className="text-[11px] text-indigo-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Ranking chunks by real-time cosine similarity to: "{testQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter chunk text..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Page filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-500 mr-1">Filter Page:</span>
          <button
            onClick={() => setSelectedPage("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedPage === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPage(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedPage === p
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              Page {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chunks Grid */}
      <div className="space-y-3">
        {filteredChunks.map((chunk, index) => {
          const isSelected = selectedChunkId === chunk.id;
          const score = testScores[chunk.id];
          const scorePercent = score !== undefined ? Math.round(score * 100) : null;

          return (
            <div
              key={chunk.id}
              id={chunk.id}
              className={`rounded-2xl p-4 transition-all ${
                isSelected
                  ? "bg-indigo-950/40 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-900 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Chunk Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
                    Chunk #{chunk.chunkIndex}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                    Source: Page {chunk.page}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{chunk.wordCount} words</span>
                </div>

                <div className="flex items-center gap-3">
                  {scorePercent !== null && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      <span className="text-slate-400">Match:</span>
                      <span
                        className={`font-mono font-bold ${
                          scorePercent > 65
                            ? "text-emerald-400"
                            : scorePercent > 35
                            ? "text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        {scorePercent}%
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleCopy(chunk.text, chunk.id)}
                    className="text-slate-400 hover:text-slate-200 transition"
                    title="Copy chunk text"
                  >
                    {copiedId === chunk.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chunk Text */}
              <p className="text-slate-200 text-xs leading-relaxed font-sans">{chunk.text}</p>

              {/* Overlap notice */}
              {settings.chunkOverlap > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Layers className="w-3 h-3 text-amber-400" />
                    Sliding window: step={Math.max(1, settings.chunkSize - settings.chunkOverlap)}w,
                    overlap={settings.chunkOverlap}w
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">ID: {chunk.id}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredChunks.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">No chunks matched your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
