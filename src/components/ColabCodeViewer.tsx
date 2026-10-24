import React, { useState } from "react";
import { Code2, Copy, Check, Terminal, ExternalLink } from "lucide-react";
import type { RagSettings, KnowledgeBase } from "../types/rag";

interface ColabCodeViewerProps {
  settings: RagSettings;
  knowledgeBase: KnowledgeBase;
}

export const ColabCodeViewer: React.FC<ColabCodeViewerProps> = ({
  settings,
  knowledgeBase,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  const formattedPages = knowledgeBase.pages
    .map(
      (p) => `    """${p.text.replace(/"/g, '\\"').replace(/\n/g, "\n    ")}"""`
    )
    .join(",\n");

  const fullPythonCode = `# ==========================================
# STEP 0: Installation
# ==========================================
!pip install -q pypdf sentence-transformers "gradio>=6,<7" google-genai


# ==========================================
# STEP 1: Settings
# ==========================================
GEMMA_MODEL = "gemma-4-26b-a4b-it"   # Fast Mixture of Experts model
CHUNK_SIZE = ${settings.chunkSize}                # Number of words in each chunk
CHUNK_OVERLAP = ${settings.chunkOverlap}             # Number of words shared by neighbouring chunks
TOP_K = ${settings.topK}                     # Number of chunks given to the model for each question
TEMPERATURE = ${settings.temperature}             # Low value keeps answers consistent and close to doc
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

ANSWER_RULES = """${settings.systemInstruction}"""

print("Settings configured.")


# ==========================================
# STEP 2: Connect to Gemma and load embedding model
# ==========================================
import os
from google import genai
from google.genai import types, errors

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
DEMO_MODE = not GOOGLE_API_KEY

client = None if DEMO_MODE else genai.Client(api_key=GOOGLE_API_KEY)

def generate(user_text, system_text=None, temperature=TEMPERATURE, demo_reply="(Demonstration mode response)"):
    if DEMO_MODE:
        return demo_reply
    try:
        response = client.models.generate_content(
            model=GEMMA_MODEL,
            contents=user_text,
            config=types.GenerateContentConfig(
                system_instruction=system_text,
                temperature=temperature,
                thinking_config=types.ThinkingConfig(thinking_level="minimal"),
            ),
        )
        return (response.text or "").strip()
    except Exception as e:
        return f"Error: {e}"

from sentence_transformers import SentenceTransformer
embedder = SentenceTransformer(EMBED_MODEL_NAME)
print(f"Loaded embedding model: {EMBED_MODEL_NAME}")


# ==========================================
# STEP 3: Document Pages: ${knowledgeBase.name}
# ==========================================
SAMPLE_PAGES = [
${formattedPages}
]
print(f"Document contains {len(SAMPLE_PAGES)} pages.")


# ==========================================
# STEP 4: The RAG pipeline
# ==========================================
import numpy as np

knowledge_base = {"name": None, "chunks": [], "vectors": None}

def split_into_chunks(pages):
    chunks = []
    step = max(1, CHUNK_SIZE - CHUNK_OVERLAP)
    for page_number, text in enumerate(pages, start=1):
        words = text.split()
        for start in range(0, len(words), step):
            chunk_words = words[start:start + CHUNK_SIZE]
            if len(chunk_words) > 5:
                chunks.append({"page": page_number, "text": " ".join(chunk_words)})
            if start + CHUNK_SIZE >= len(words):
                break
    return chunks

def build_knowledge_base(pages, name):
    chunks = split_into_chunks(pages)
    if not chunks:
        raise ValueError("No text was found in document.")
    vectors = embedder.encode([c["text"] for c in chunks], normalize_embeddings=True)
    knowledge_base.update(name=name, chunks=chunks, vectors=vectors)
    return f"Loaded **{name}**: {len(pages)} pages, {len(chunks)} chunks."

def retrieve(question, top_k=TOP_K):
    question_vector = embedder.encode([question], normalize_embeddings=True)[0]
    similarities = knowledge_base["vectors"] @ question_vector
    best = np.argsort(similarities)[::-1][:top_k]
    return [{**knowledge_base["chunks"][i], "score": float(similarities[i])} for i in best]

def answer(question):
    found = retrieve(question)
    context = "\\n\\n".join(f"[Page {c['page']}] {c['text']}" for c in found)
    prompt = f"Context:\\n{context}\\n\\nQuestion: {question}"
    demo = (f"**Demonstration mode:** no API key set. Most relevant passage is on **Page {found[0]['page']}**:\\n\\n> {found[0]['text'][:300]}...")
    reply = generate(prompt, system_text=ANSWER_RULES, demo_reply=demo)
    return reply, found

# Initialize Knowledge Base
print(build_knowledge_base(SAMPLE_PAGES, "${knowledgeBase.name}"))

# Test query
test_question = "What happens if I submit a lab late?"
reply, found = answer(test_question)
print(f"\\nQuestion: {test_question}\\nAnswer: {reply}")
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            Python Colab Script Matcher
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            This live script dynamically syncs with your active settings (CHUNK_SIZE={settings.chunkSize}, OVERLAP={settings.chunkOverlap}, TOP_K={settings.topK}) and current document.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Copied to Clipboard!" : "Copy Python Code"}</span>
        </button>
      </div>

      {/* Code Display Box */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-slate-300 font-medium">rag_pipeline.py</span>
          </div>
          <span className="text-[11px] text-slate-500">Google Colab &amp; Python 3.10+</span>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[70vh]">
          <code>{fullPythonCode}</code>
        </pre>
      </div>
    </div>
  );
};
