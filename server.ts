import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { searchYouTube, parseYouTubePlaylist, parseSingleYouTubeVideo } from "./server-youtube";

// Load environment variables before starting
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Route: YouTube Video Search
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === "") {
        res.status(400).json({ error: "Search query 'q' parameter is required" });
        return;
      }
      console.log(`[API] Searching YouTube for: "${query}"`);
      const results = await searchYouTube(query);
      res.json({ results });
    } catch (err: any) {
      console.error("Search error:", err);
      res.status(500).json({ error: err.message || "Failed to search YouTube" });
    }
  });

  // API Route: Import YouTube Playlist
  app.get("/api/youtube/playlist", async (req, res) => {
    try {
      const playlistUrlOrId = req.query.url as string;
      if (!playlistUrlOrId || playlistUrlOrId.trim() === "") {
        res.status(400).json({ error: "Playlist 'url' (or ID) parameter is required" });
        return;
      }
      console.log(`[API] Importing YouTube playlist: "${playlistUrlOrId}"`);
      const songs = await parseYouTubePlaylist(playlistUrlOrId);
      res.json({ songs });
    } catch (err: any) {
      console.error("Playlist import error:", err);
      res.status(500).json({ error: err.message || "Failed to import playlist" });
    }
  });

  // API Route: Parse Single YouTube Video
  app.get("/api/youtube/video", async (req, res) => {
    try {
      const videoUrlOrId = req.query.url as string;
      if (!videoUrlOrId || videoUrlOrId.trim() === "") {
        res.status(400).json({ error: "Video ID or URL 'url' parameter is required" });
        return;
      }
      console.log(`[API] Fetching video details for: "${videoUrlOrId}"`);
      const song = await parseSingleYouTubeVideo(videoUrlOrId);
      if (!song) {
        res.status(404).json({ error: "Invalid YouTube video ID or URL" });
        return;
      }
      res.json({ song });
    } catch (err: any) {
      console.error("Video parse error:", err);
      res.status(500).json({ error: err.message || "Failed to resolve single video" });
    }
  });

  // Front-end SPA Assets delivery with HMR fallback
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files distribution...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the build output directory
    app.use(express.static(distPath));
    
    // SPA Fallback: hand all other request urls to index.html
    const expressVersion = (express as any).version || "";
    const wildcardRoute = expressVersion.startsWith("5") ? "*all" : "*";
    
    app.get(wildcardRoute, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Start the full stack server instance
startServer().catch(err => {
  console.error("FATAL: Failed to launch application server:", err);
});
