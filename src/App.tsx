/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ChatView } from "./components/ChatView";
import { ChunksExplorer } from "./components/ChunksExplorer";
import { PipelineVisualizer } from "./components/PipelineVisualizer";
import { ColabCodeViewer } from "./components/ColabCodeViewer";
import { SettingsModal } from "./components/SettingsModal";
import { DocumentModal } from "./components/DocumentModal";
import type {
  ChatMessage,
  DocumentPage,
  KnowledgeBase,
  RagSettings,
  RetrievalResult,
} from "./types/rag";
import { DEFAULT_RAG_SETTINGS, SAMPLE_DOCUMENTS } from "./data/sampleDocuments";
import { splitIntoChunks, generateLocalVector, retrieveTopKChunks } from "./utils/ragEngine";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "chunks" | "pipeline" | "settings" | "code">("chat");
  const [settings, setSettings] = useState<RagSettings>(DEFAULT_RAG_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedChunkId, setSelectedChunkId] = useState<string | undefined>(undefined);
  const [isApiConnected, setIsApiConnected] = useState(false);

  // Active Document
  const [currentDocName, setCurrentDocName] = useState(SAMPLE_DOCUMENTS[0].title);
  const [currentPages, setCurrentPages] = useState<DocumentPage[]>(SAMPLE_DOCUMENTS[0].pages);
  const [sampleQuestions, setSampleQuestions] = useState<string[]>(
    SAMPLE_DOCUMENTS[0].sampleQuestions
  );

  // Knowledge base state
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(() => {
    const initialChunks = splitIntoChunks(
      SAMPLE_DOCUMENTS[0].pages,
      DEFAULT_RAG_SETTINGS.chunkSize,
      DEFAULT_RAG_SETTINGS.chunkOverlap
    );
    // Attach initial local vectors for immediate responsiveness
    const chunksWithVectors = initialChunks.map((c) => ({
      ...c,
      vector: generateLocalVector(c.text),
    }));

    return {
      name: SAMPLE_DOCUMENTS[0].title,
      pages: SAMPLE_DOCUMENTS[0].pages,
      chunks: chunksWithVectors,
      totalWords: SAMPLE_DOCUMENTS[0].pages.reduce(
        (sum, p) => sum + p.text.split(/\s+/).length,
        0
      ),
      vectorProvider: "local-minilm",
      isEmbedding: false,
      lastUpdated: Date.now(),
    };
  });

  // Conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check server status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/rag/status");
        if (res.ok) {
          const data = await res.json();
          setIsApiConnected(data.hasApiKey);
        }
      } catch (e) {
        console.log("Status check skipped or offline mode active.");
      }
    }
    checkStatus();
  }, []);

  // Re-build knowledge base chunks when pages or chunking parameters change
  const rebuildKnowledgeBase = useCallback(
    async (
      pages: DocumentPage[],
      name: string,
      chunkSize: number,
      chunkOverlap: number,
      embedProvider: "gemini" | "local"
    ) => {
      const chunks = splitIntoChunks(pages, chunkSize, chunkOverlap);
      const totalWords = pages.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);

      // Pre-compute local vectors so retrieval is immediately available
      let chunksWithVectors = chunks.map((c) => ({
        ...c,
        vector: generateLocalVector(c.text),
      }));

      setKnowledgeBase({
        name,
        pages,
        chunks: chunksWithVectors,
        totalWords,
        vectorProvider: embedProvider === "gemini" ? "gemini-embedding-2-preview" : "local-minilm",
        isEmbedding: embedProvider === "gemini",
        lastUpdated: Date.now(),
      });

      // If user selected Gemini cloud embeddings and server is available, attempt cloud vectorization
      if (embedProvider === "gemini") {
        try {
          const res = await fetch("/api/rag/embed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: chunks.map((c) => c.text),
              provider: "gemini",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.vectors && data.vectors.length === chunks.length) {
              chunksWithVectors = chunks.map((c, i) => ({
                ...c,
                vector: data.vectors[i],
              }));
              setKnowledgeBase((prev) => ({
                ...prev,
                chunks: chunksWithVectors,
                vectorProvider: data.provider || "gemini-embedding-2-preview",
                isEmbedding: false,
              }));
            }
          }
        } catch (err) {
          console.warn("Cloud embedding failed, kept local vectorizer", err);
          setKnowledgeBase((prev) => ({
            ...prev,
            vectorProvider: "local-minilm",
            isEmbedding: false,
          }));
        }
      }
    },
    []
  );

  // Handle document switch or upload
  const handleSelectDocument = (name: string, pages: DocumentPage[], questions: string[]) => {
    setCurrentDocName(name);
    setCurrentPages(pages);
    setSampleQuestions(questions);
    setMessages([]); // clear previous document chat

    rebuildKnowledgeBase(
      pages,
      name,
      settings.chunkSize,
      settings.chunkOverlap,
      settings.embedProvider
    );
  };

  // Handle settings update
  const handleSaveSettings = (newSettings: RagSettings) => {
    const chunkingChanged =
      newSettings.chunkSize !== settings.chunkSize ||
      newSettings.chunkOverlap !== settings.chunkOverlap ||
      newSettings.embedProvider !== settings.embedProvider;

    setSettings(newSettings);

    if (chunkingChanged) {
      rebuildKnowledgeBase(
        currentPages,
        currentDocName,
        newSettings.chunkSize,
        newSettings.chunkOverlap,
        newSettings.embedProvider
      );
    }
  };

  // Main RAG Chat query execution
  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // STAGE 3: Retrieve top-K chunks using cosine similarity
      const retrieved = retrieveTopKChunks(question, knowledgeBase.chunks, settings.topK);

      // STAGE 4: Call server API to generate grounded answer
      const res = await fetch("/api/rag/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chunks: retrieved,
          settings: {
            model: settings.model,
            temperature: settings.temperature,
            systemInstruction: settings.systemInstruction,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.answer || "No response received.",
          timestamp: Date.now(),
          retrievedChunks: retrieved,
          isDemo: data.isDemo,
          modelUsed: data.model || settings.model,
          error: data.error,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error("RAG Query Error:", err);
      // Fallback demo response if server failed
      const retrieved = retrieveTopKChunks(question, knowledgeBase.chunks, settings.topK);
      const topChunk = retrieved[0];

      const demoContent = topChunk
        ? `**Demonstration mode:** Retrieval completed successfully. The most relevant passage was found on **Page ${topChunk.page}** (similarity: ${Math.round(topChunk.score * 100)}%):\n\n> "${topChunk.text}"`
        : "I don't have enough information in the provided document to answer this.";

      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: demoContent,
        timestamp: Date.now(),
        retrievedChunks: retrieved,
        isDemo: true,
        modelUsed: "Demonstration Mode",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChunk = (chunkId: string) => {
    setSelectedChunkId(chunkId);
    setActiveTab("chunks");
  };

  const handleAskInChatFromPipeline = (question: string) => {
    setActiveTab("chat");
    handleSendMessage(question);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation & App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        knowledgeBase={knowledgeBase}
        onOpenDocModal={() => setIsDocModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        isApiConnected={isApiConnected}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === "chat" && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            knowledgeBase={knowledgeBase}
            settings={settings}
            suggestedQuestions={sampleQuestions}
            onSelectChunk={handleSelectChunk}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isApiConnected={isApiConnected}
          />
        )}

        {activeTab === "chunks" && (
          <ChunksExplorer
            knowledgeBase={knowledgeBase}
            settings={settings}
            selectedChunkId={selectedChunkId}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === "pipeline" && (
          <PipelineVisualizer
            knowledgeBase={knowledgeBase}
            settings={settings}
            sampleQuestions={sampleQuestions}
            onAskInChat={handleAskInChatFromPipeline}
          />
        )}

        {activeTab === "code" && (
          <ColabCodeViewer settings={settings} knowledgeBase={knowledgeBase} />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        currentChunkCount={knowledgeBase.chunks.length}
      />

      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSelectDocument={handleSelectDocument}
        currentDocumentName={currentDocName}
      />
    </div>
  );
}
