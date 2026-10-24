export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface Chunk {
  id: string;
  page: number;
  text: string;
  wordCount: number;
  chunkIndex: number;
  vector?: number[];
}

export interface KnowledgeBase {
  name: string;
  pages: DocumentPage[];
  chunks: Chunk[];
  totalWords: number;
  vectorProvider: "gemini-embedding-2-preview" | "local-minilm" | "unindexed";
  isEmbedding: boolean;
  lastUpdated: number;
}

export interface RetrievalResult {
  id: string;
  page: number;
  text: string;
  score: number;
  rank: number;
}

export interface RagSettings {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  temperature: number;
  model: string;
  systemInstruction: string;
  embedProvider: "gemini" | "local";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  retrievedChunks?: RetrievalResult[];
  isDemo?: boolean;
  modelUsed?: string;
  error?: boolean;
}
