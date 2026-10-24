import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { ragRouter } from "./server/api.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use("/api/rag", ragRouter);

// Serve static assets from dist in production
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("RAG Studio backend is running. Frontend build in progress...");
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RAG Studio server running on http://0.0.0.0:${PORT}`);
});
