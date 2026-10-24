import React, { useState } from "react";
import {
  GitCommit,
  Layers,
  Cpu,
  Search,
  Sparkles,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Play,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { KnowledgeBase, RagSettings, RetrievalResult } from "../types/rag";
import { retrieveTopKChunks, formatRagPrompt } from "../utils/ragEngine";

interface PipelineVisualizerProps {
  knowledgeBase: KnowledgeBase;
  settings: RagSettings;
  sampleQuestions: string[];
  onAskInChat: (question: string) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  knowledgeBase,
  settings,
  sampleQuestions,
  onAskInChat,
}) => {
  const [pipelineQuery, setPipelineQuery] = useState(
    sampleQuestions[0] || "What happens if I submit a lab late?"
  );
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(3);

  // Compute live retrieval for pipelineQuery
  const retrieved: RetrievalResult[] = retrieveTopKChunks(
    pipelineQuery,
    knowledgeBase.chunks,
    settings.topK
  );

  const formattedPrompt = formatRagPrompt(retrieved, pipelineQuery);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
      {/* Visualizer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-indigo-400" />
              The 4-Stage RAG Pipeline Visualizer
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Follow how user queries traverse the entire pipeline: from document chunking to vector
              similarity ranking and grounded answer generation.
            </p>
          </div>
          <button
            onClick={() => onAskInChat(pipelineQuery)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Run Query in Chat
          </button>
        </div>

        {/* Live Query Input Box */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Test Question across all 4 stages:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={pipelineQuery}
              onChange={(e) => setPipelineQuery(e.target.value)}
              placeholder="Type a question to trace through the pipeline..."
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-500">Preset questions:</span>
            {sampleQuestions.slice(0, 3).map((sq, i) => (
              <button
                key={i}
                onClick={() => setPipelineQuery(sq)}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap cursor-pointer transition"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Stage Cards Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* STAGE 1: Chunking */}
        <div
          onClick={() => setActiveStep(1)}
          className={`cursor-pointer rounded-2xl p-4 transition-all relative ${
            activeStep === 1
              ? "bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Stage 1
            </span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">Sliding Chunking</h3>
          <p className="text-xs text-slate-400 mb-3">
            Splits text into overlapping word windows.
          </p>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
            <div>size: {settings.chunkSize} words</div>
            <div>overlap: {settings.chunkOverlap} words</div>
            <div className="text-indigo-400 font-semibold mt-1">
              &rarr; {knowledgeBase.chunks.length} chunks produced
            </div>
          </div>
        </div>

        {/* STAGE 2: Vector Embedding */}
        <div
          onClick={() => setActiveStep(2)}
          className={`cursor-pointer rounded-2xl p-4 transition-all relative ${
            activeStep === 2
              ? "bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Stage 2
            </span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">Vector Embedding</h3>
          <p className="text-xs text-slate-400 mb-3">
            Encodes each chunk into dense vector space.
          </p>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
            <div>model: {settings.embedProvider === "gemini" ? "gemini-embed-2" : "local-minilm"}</div>
            <div>dim: 256 / 768</div>
            <div className="text-violet-400 font-semibold mt-1">
              &rarr; L2-normalized matrix
            </div>
          </div>
        </div>

        {/* STAGE 3: Vector Retrieval */}
        <div
          onClick={() => setActiveStep(3)}
          className={`cursor-pointer rounded-2xl p-4 transition-all relative ${
            activeStep === 3
              ? "bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Stage 3
            </span>
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">Cosine Retrieval</h3>
          <p className="text-xs text-slate-400 mb-3">
            Ranks chunks by cosine similarity: $A \cdot B$.
          </p>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
            <div>top_k: {settings.topK}</div>
            <div>top score: {retrieved[0] ? `${Math.round(retrieved[0].score * 100)}%` : "0%"}</div>
            <div className="text-emerald-400 font-semibold mt-1">
              &rarr; {retrieved.length} closest passages
            </div>
          </div>
        </div>

        {/* STAGE 4: Grounded Generation */}
        <div
          onClick={() => setActiveStep(4)}
          className={`cursor-pointer rounded-2xl p-4 transition-all relative ${
            activeStep === 4
              ? "bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Stage 4
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">Grounded Gen</h3>
          <p className="text-xs text-slate-400 mb-3">
            Strict answering with citations (Page X).
          </p>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
            <div>model: {settings.model}</div>
            <div>temp: {settings.temperature}</div>
            <div className="text-amber-400 font-semibold mt-1">
              &rarr; Strict Page Citations
            </div>
          </div>
        </div>
      </div>

      {/* Active Stage Inspector Details */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        {activeStep === 1 && (
          <div>
            <h4 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Stage 1 Deep Dive: Document Chunking Algorithm
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Splitting raw text prevents exceeding context limits and ensures query matches pinpoint
              specific paragraphs. Overlap preserves semantic continuity across chunk edges.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`def split_into_chunks(pages):
    chunks = []
    step = max(1, CHUNK_SIZE - CHUNK_OVERLAP)  # step = ${Math.max(1, settings.chunkSize - settings.chunkOverlap)} words
    for page_number, text in enumerate(pages, start=1):
        words = text.split()
        for start in range(0, len(words), step):
            chunk_words = words[start:start + CHUNK_SIZE]
            if len(chunk_words) > 5:
                chunks.append({"page": page_number, "text": " ".join(chunk_words)})
            if start + CHUNK_SIZE >= len(words):
                break
    return chunks`}</pre>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h4 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Stage 2 Deep Dive: Knowledge Base &amp; Vector Embeddings
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Each text chunk is mapped into high-dimensional vector space. Chunks with similar meaning
              lie close together in the vector geometry.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`# Embedding pipeline from Colab
vectors = embedder.encode([c["text"] for c in chunks], normalize_embeddings=True)
knowledge_base.update(name=name, chunks=chunks, vectors=vectors)

# Shape: (${knowledgeBase.chunks.length} chunks, 256 vector dimensions)
# Normalized so cosine similarity is computed with dot product.`}</pre>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h4 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              Stage 3 Deep Dive: Retrieved Top-{settings.topK} Chunks for "{pipelineQuery}"
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              The query vector is multiplied against the chunk vector matrix to find the top-{settings.topK} closest cosine matches:
            </p>

            <div className="space-y-2 mt-3">
              {retrieved.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                        Rank #{r.rank}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        Page {r.page}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono font-bold">
                      <span>Cosine Similarity:</span>
                      <span className="text-emerald-400">
                        {Math.round(r.score * 100)}% ({r.score.toFixed(3)})
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 italic border-l-2 border-emerald-500/40 pl-2 mt-1 font-sans">
                    "{r.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div>
            <h4 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Stage 4 Deep Dive: Assembled Grounded Context &amp; Prompt
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              The top retrieved passages are formatted with [Page X] markers and sent to the LLM with strict grounding rules:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
              <span className="text-amber-400 font-bold">// SYSTEM INSTRUCTION:</span>
              {"\n"}
              {settings.systemInstruction}
              {"\n\n"}
              <span className="text-indigo-400 font-bold">// USER PROMPT ASSEMBLED:</span>
              {"\n"}
              {formattedPrompt}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
