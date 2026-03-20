import { Router } from "express";
import { searchBusinesses, extractPageContent } from "../services/leadlogic-search.js";

export function leadlogicRoutes() {
  const router = Router();

  /**
   * POST /api/leadlogic/search
   * Body: { "query": "dokter gigi jakarta", "maxResults": 10 }
   */
  router.post("/search", async (req, res) => {
    try {
      const { query, maxResults = 10 } = req.body as {
        query: string;
        maxResults?: number;
      };

      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "Missing or invalid 'query' string." });
        return;
      }

      const results = await searchBusinesses(query, maxResults);
      res.json({ results, count: results.length });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Search failed";
      res.status(500).json({ error: message });
    }
  });

  /**
   * POST /api/leadlogic/extract
   * Body: { "url": "https://example.com" }
   */
  router.post("/extract", async (req, res) => {
    try {
      const { url } = req.body as { url: string };

      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "Missing or invalid 'url' string." });
        return;
      }

      const page = await extractPageContent(url);
      res.json(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      res.status(500).json({ error: message });
    }
  });

  return router;
}
