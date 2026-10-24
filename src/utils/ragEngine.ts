import type { Chunk, DocumentPage, RetrievalResult } from "../types/rag";

/**
 * STAGE 1: Split each page into overlapping chunks of about chunkSize words.
 * Directly mirrors the Python Colab implementation:
 *
 * def split_into_chunks(pages):
 *     chunks = []
 *     step = max(1, CHUNK_SIZE - CHUNK_OVERLAP)
 *     for page_number, text in enumerate(pages, start=1):
 *         words = text.split()
 *         for start in range(0, len(words), step):
 *             chunk_words = words[start:start + CHUNK_SIZE]
 *             if len(chunk_words) > 5:
 *                 chunks.append({"page": page_number, "text": " ".join(chunk_words)})
 *             if start + CHUNK_SIZE >= len(words):
 *                 break
 *     return chunks
 */
export function splitIntoChunks(
  pages: DocumentPage[],
  chunkSize: number,
  chunkOverlap: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const step = Math.max(1, chunkSize - chunkOverlap);
  let chunkCount = 0;

  for (const page of pages) {
    const rawText = page.text || "";
    // Clean and split words
    const words = rawText
      .trim()
      .split(/\s+/)
      .filter((w) => Boolean(w && w.trim()));

    if (words.length === 0) continue;

    for (let start = 0; start < words.length; start += step) {
      const chunkWords = words.slice(start, start + chunkSize);
      if (chunkWords.length > 5) {
        chunkCount++;
        chunks.push({
          id: `chunk-p${page.pageNumber}-${chunkCount}`,
          page: page.pageNumber,
          text: chunkWords.join(" "),
          wordCount: chunkWords.length,
          chunkIndex: chunkCount,
        });
      }
      if (start + chunkSize >= words.length) {
        break;
      }
    }
  }

  return chunks;
}

/**
 * Fast deterministic dense vectorizer for local / offline semantic similarity.
 * Produces L2-normalized 256-dimensional vectors.
 */
export function generateLocalVector(text: string, dim = 256): number[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const vec = new Array(dim).fill(0);
  if (words.length === 0) return vec;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let h = 2166136261;
    for (let j = 0; j < word.length; j++) {
      h = Math.imul(h ^ word.charCodeAt(j), 16777619);
    }
    const idx = Math.abs(h) % dim;
    const sign = (h & 1) === 0 ? 1 : -1;
    const posWeight = 1.0 + Math.log(1 + 1 / (i + 1));
    vec[idx] += sign * posWeight;

    // Bi-gram hashing for contextual phrase matching
    if (i < words.length - 1) {
      const bigram = `${word}_${words[i + 1]}`;
      let bh = 2166136261;
      for (let j = 0; j < bigram.length; j++) {
        bh = Math.imul(bh ^ bigram.charCodeAt(j), 16777619);
      }
      const bIdx = Math.abs(bh) % dim;
      const bSign = (bh & 1) === 0 ? 1 : -1;
      vec[bIdx] += bSign * 0.85;
    }
  }

  // L2 normalization so dot product = cosine similarity
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

/**
 * Computes cosine similarity between two normalized vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, dot));
}

/**
 * STAGE 3: Retrieve top-K chunks closest to the question in vector space.
 * Matches:
 *
 * similarities = knowledge_base["vectors"] @ question_vector
 * best = np.argsort(similarities)[::-1][:top_k]
 */
export function retrieveTopKChunks(
  question: string,
  chunks: Chunk[],
  topK = 3,
  queryVector?: number[]
): RetrievalResult[] {
  if (chunks.length === 0) return [];

  const qVec = queryVector && queryVector.length > 0 ? queryVector : generateLocalVector(question);

  // Compute similarities
  const scored = chunks.map((chunk) => {
    const cVec = chunk.vector && chunk.vector.length === qVec.length ? chunk.vector : generateLocalVector(chunk.text);
    const score = cosineSimilarity(qVec, cVec);
    return {
      id: chunk.id,
      page: chunk.page,
      text: chunk.text,
      score: Math.max(0, score), // non-negative for display
      rank: 0,
    };
  });

  // Sort descending by similarity score
  scored.sort((a, b) => b.score - a.score);

  // Take top-k and assign ranks
  const top = scored.slice(0, Math.min(topK, scored.length));
  return top.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Format retrieved chunks into context string for generation prompt
 */
export function formatRagPrompt(chunks: RetrievalResult[], question: string): string {
  const context = chunks.map((c) => `[Page ${c.page}] ${c.text}`).join("\n\n");
  return `Context:\n${context}\n\nQuestion: ${question}`;
}

/**
 * Extracts cited page numbers from text, e.g. "(Page 2)" or "[Page 4]"
 */
export function extractCitations(text: string): number[] {
  const regex = /(?:\(|\[)\s*Page\s*(\d+)\s*(?:\)|\])/gi;
  const pages = new Set<number>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) {
      pages.add(num);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}
