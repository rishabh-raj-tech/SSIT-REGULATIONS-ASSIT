import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  HelpCircle,
  Info,
} from "lucide-react";
import type { ChatMessage, KnowledgeBase, RagSettings, RetrievalResult } from "../types/rag";

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isLoading: boolean;
  knowledgeBase: KnowledgeBase;
  settings: RagSettings;
  suggestedQuestions: string[];
  onSelectChunk?: (chunkId: string) => void;
  onOpenSettings: () => void;
  isApiConnected: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  knowledgeBase,
  settings,
  suggestedQuestions,
  onSelectChunk,
  onOpenSettings,
  isApiConnected,
}) => {
  const [input, setInput] = useState("");
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput("");
    await onSendMessage(query);
  };

  const toggleContext = (messageId: string) => {
    setExpandedContexts((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Parses text to make citations like "(Page 2)" interactive and highlighted
   */
  const renderFormattedAnswer = (content: string, retrievedChunks?: RetrievalResult[]) => {
    // Regex matches (Page X) or [Page X]
    const parts = content.split(/(\((?:Page\s*\d+)\)|\[(?:Page\s*\d+)\])/gi);

    return (
      <div className="leading-relaxed text-slate-200 text-sm whitespace-pre-wrap">
        {parts.map((part, index) => {
          const match = part.match(/(?:\(|\[)\s*Page\s*(\d+)\s*(?:\)|\])/i);
          if (match) {
            const pageNum = parseInt(match[1], 10);
            const matchingChunk = retrievedChunks?.find((c) => c.page === pageNum);

            return (
              <button
                key={index}
                onClick={() => {
                  if (matchingChunk && onSelectChunk) {
                    onSelectChunk(matchingChunk.id);
                  }
                }}
                className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 hover:text-white transition-all cursor-pointer group"
                title={`Click to inspect retrieved chunk from Page ${pageNum}`}
              >
                <FileText className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                Page {pageNum}
              </button>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 py-4 sm:px-6">
      {/* Top Banner for RAG Active Specs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-medium">Knowledge Store:</span>
          <span className="text-slate-100 font-semibold truncate">{knowledgeBase.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            {knowledgeBase.pages.length} Pages • {knowledgeBase.chunks.length} Chunks
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Top-K: <span className="text-slate-200 font-medium">{settings.topK}</span>
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Chunk: <span className="text-slate-200 font-medium">{settings.chunkSize}w</span>
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Temp: <span className="text-slate-200 font-medium">{settings.temperature}</span>
          </span>
          <button
            onClick={onOpenSettings}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            Adjust
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              RAG Retrieval &amp; Grounded QA
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
              Ask any question about{" "}
              <strong className="text-slate-200">{knowledgeBase.name}</strong>. The system will
              retrieve the top {settings.topK} most semantically relevant chunks and generate an
              answer strictly grounded in the document context with citations.
            </p>

            {/* Suggested Question Chips */}
            {suggestedQuestions.length > 0 && (
              <div className="w-full max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-left">
                  Sample Questions (from Colab Tutorial):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition flex items-start gap-2 group text-left cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            const isExpanded = expandedContexts[message.id] ?? true;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-2xl p-4 transition-all ${
                    isUser
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-900 border border-slate-800 shadow-sm"
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-800/60 text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      {isUser ? (
                        <>
                          <User className="w-3.5 h-3.5" /> You
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{message.modelUsed || settings.model}</span>
                          {message.isDemo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Demo Mode
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="hover:text-slate-300 transition"
                        title="Copy content"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Text */}
                  {isUser ? (
                    <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    renderFormattedAnswer(message.content, message.retrievedChunks)
                  )}

                  {/* Retrieved Context Chunks Accordion */}
                  {!isUser && message.retrievedChunks && message.retrievedChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => toggleContext(message.id)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-indigo-400" />
                          Retrieved Context Passages ({message.retrievedChunks.length} Chunks, Top-K)
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {message.retrievedChunks.map((chunk, cIdx) => {
                            const scorePercent = Math.round(chunk.score * 100);
                            return (
                              <div
                                key={chunk.id || cIdx}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs hover:border-slate-700 transition"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/30">
                                      #{chunk.rank}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                                      Page {chunk.page}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <span>Similarity:</span>
                                      <span
                                        className={`font-semibold ${
                                          scorePercent > 70
                                            ? "text-emerald-400"
                                            : scorePercent > 40
                                            ? "text-amber-400"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {scorePercent}%
                                      </span>
                                    </div>
                                    {onSelectChunk && (
                                      <button
                                        onClick={() => onSelectChunk(chunk.id)}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline ml-1 cursor-pointer"
                                      >
                                        Inspect
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed italic border-l-2 border-indigo-500/50 pl-2 mt-1">
                                  "{chunk.text}"
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1 shadow">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-md shadow-sm">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>RAG Pipeline in progress...</span>
              </div>
              <p className="text-xs text-slate-400">
                Vectorizing query $\to$ Cosine similarity ranking $\to$ Formatting top-
                {settings.topK} passages $\to$ Synthesizing grounded answer
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips above input */}
      {messages.length > 0 && suggestedQuestions.length > 0 && (
        <div className="py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          <span className="text-[11px] text-slate-500 whitespace-nowrap mr-1">Suggestions:</span>
          {suggestedQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mt-2 relative">
        <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question about ${knowledgeBase.name} (e.g. "What happens if I submit a lab late?")...`}
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="m-1.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition flex items-center justify-center cursor-pointer shadow"
            title="Send Question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
