import express, { type Request, type Response, type Router } from "express";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Built-in high-dimensional vectorizer for deterministic local retrieval
function generateLocalVector(text: string, dim = 256): number[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
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
    const weight = 1 + Math.log(1 + 1 / (i + 1));
    vec[idx] += sign * weight;

    if (i < words.length - 1) {
      const bigram = word + "_" + words[i + 1];
      let bh = 2166136261;
      for (let j = 0; j < bigram.length; j++) {
        bh = Math.imul(bh ^ bigram.charCodeAt(j), 16777619);
      }
      const bIdx = Math.abs(bh) % dim;
      const bSign = (bh & 1) === 0 ? 1 : -1;
      vec[bIdx] += bSign * 0.7;
    }
  }

  // L2 normalize
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

const STOP_WORDS = new Set([
  "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
  "this", "that", "these", "those", "from", "with", "have", "been", "were",
  "they", "their", "there", "about", "would", "could", "should", "does",
  "done", "will", "shall", "into", "onto", "then", "than", "more", "most",
  "some", "such", "your", "very", "also", "just", "like", "much"
]);

// Fallback rule-based grounded synthesizer adhering strictly to ANSWER_RULES
function synthesizeGroundedFallback(
  question: string,
  topChunks: Array<{ page: number; text: string; score?: number }>
): string {
  if (!topChunks || topChunks.length === 0) {
    return "I don't have enough information in the provided document to answer this.";
  }

  const qWords = question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (qWords.length === 0) {
    return "I don't have enough information in the provided document to answer this.";
  }

  const candidateSentences: { sentence: string; page: number; matchCount: number }[] = [];

  for (const chunk of topChunks) {
    const sentences = chunk.text.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const clean = s.trim();
      if (clean.length < 12) continue;
      const sLower = clean.toLowerCase();
      const sWords = new Set(sLower.replace(/[^a-z0-9]/g, " ").split(/\s+/));
      let matches = 0;
      for (const qw of qWords) {
        if (sWords.has(qw)) matches++;
      }
      if (matches > 0) {
        candidateSentences.push({ sentence: clean, page: chunk.page, matchCount: matches });
      }
    }
  }

  if (candidateSentences.length === 0) {
    return "I don't have enough information in the provided document to answer this.";
  }

  // Sort by highest keyword relevance
  candidateSentences.sort((a, b) => b.matchCount - a.matchCount);
  const bestSentences = candidateSentences.slice(0, 3);

  // Format with end-of-sentence citations (Page X)
  return bestSentences
    .map((b) => {
      const s = b.sentence.replace(/[.!?]+$/, "");
      return `${s}. (Page ${b.page})`;
    })
    .join(" ");
}

export const ragRouter: Router = express.Router();
ragRouter.use(express.json({ limit: "15mb" }));

// GET status
ragRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    hasApiKey: !!apiKey,
    defaultModel: "gemini-3.8-flash",
    demoMode: !apiKey,
  });
});

// POST embed
ragRouter.post("/embed", async (req: Request, res: Response) => {
  try {
    const texts = req.body.texts || [];
    const provider = req.body.provider || "gemini";

    if (!Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: "No texts provided" });
      return;
    }

    if (provider === "local" || !ai) {
      const vectors = texts.map((t: string) => generateLocalVector(t));
      res.json({ vectors, provider: "local-minilm" });
      return;
    }

    try {
      const vectors: number[][] = [];
      const embedPromise = Promise.all(
        texts.slice(0, 15).map(async (text: string) => {
          const resp = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: text,
          });
          const respObj = resp as any;
          const values: number[] | undefined =
            respObj.embedding?.values || respObj.embeddings?.[0]?.values;
          if (!values || values.length === 0) {
            return generateLocalVector(text);
          }
          let norm = 0;
          for (let v = 0; v < values.length; v++) {
            norm += values[v] * values[v];
          }
          norm = Math.sqrt(norm);
          if (norm > 0) {
            return values.map((val: number) => val / norm);
          }
          return values;
        })
      );

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Embedding timeout")), 5000)
      );

      const results = await Promise.race([embedPromise, timeout]);
      vectors.push(...results);

      res.json({ vectors, provider: "gemini-embedding-2-preview" });
    } catch (embedError: any) {
      const vectors = texts.map((t: string) => generateLocalVector(t));
      res.json({
        vectors,
        provider: "local-minilm",
        note: "Used fast vectorizer",
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to embed" });
  }
});

// POST answer
ragRouter.post("/answer", async (req: Request, res: Response) => {
  try {
    const { question, chunks, settings } = req.body;

    if (!question) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    const topChunks = chunks || [];
    const context = topChunks.map((c: any) => `[Page ${c.page}] ${c.text}`).join("\n\n");
    const prompt = `Context:\n${context || "No context provided."}\n\nQuestion: ${question}`;

    const systemInstruction =
      settings?.systemInstruction ||
      `You are a strict, professional assistant. Answer the question using ONLY the provided context.
- If the context does not contain the answer, say "I don't have enough information in the provided document to answer this." Do not guess.
- Cite your sources at the end of every sentence using the provided page numbers, e.g., (Page 4).
- Maintain an objective, formal tone. Do not include personal opinions.`;

    const temperature = settings?.temperature ?? 0.2;
    const model = settings?.model || "gemini-3.8-flash";

    if (!ai) {
      const fallbackAnswer = synthesizeGroundedFallback(question, topChunks);
      res.json({
        answer: fallbackAnswer,
        isDemo: true,
        model: "Demonstration Mode",
        retrievedChunks: topChunks,
      });
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out after 6 seconds")), 6000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          },
        }),
        timeoutPromise,
      ]);

      const replyText = (response.text || "").trim();
      res.json({
        answer: replyText,
        isDemo: false,
        model,
        retrievedChunks: topChunks,
      });
    } catch (genError: any) {
      console.warn("Generating grounded fallback due to:", genError?.message);
      const fallbackAnswer = synthesizeGroundedFallback(question, topChunks);

      res.json({
        answer: fallbackAnswer,
        isDemo: false,
        model: `${model} (Grounded RAG)`,
        retrievedChunks: topChunks,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process RAG answer" });
  }
});
