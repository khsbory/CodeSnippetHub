import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertSnippetSchema, insertCommentSchema } from "@shared/schema";

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Snippet routes
  app.get("/api/snippets", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const filter = (req.query.filter as string) || 'latest';
      const language = (req.query.language as string) || 'all';
      
      const snippets = await storage.getSnippets(limit, filter, language);
      res.json(snippets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching snippets" });
    }
  });
  
  app.get("/api/snippets/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const snippets = await storage.searchSnippets(query);
      res.json(snippets);
    } catch (error) {
      res.status(500).json({ message: "Error searching snippets" });
    }
  });

  app.get("/api/snippets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const snippet = await storage.getSnippetById(id);
      
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Increment view count
      await storage.incrementSnippetViews(id);
      
      res.json(snippet);
    } catch (error) {
      res.status(500).json({ message: "Error fetching snippet" });
    }
  });

  app.post("/api/snippets", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSnippetSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const snippet = await storage.createSnippet(validatedData);
      res.status(201).json(snippet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid snippet data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating snippet" });
    }
  });

  app.put("/api/snippets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const snippet = await storage.getSnippetById(id);
      
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Check ownership
      if (snippet.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updates = insertSnippetSchema.partial().parse(req.body);
      const updatedSnippet = await storage.updateSnippet(id, updates);
      
      res.json(updatedSnippet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid snippet data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating snippet" });
    }
  });

  app.delete("/api/snippets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const snippet = await storage.getSnippetById(id);
      
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Check ownership
      if (snippet.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteSnippet(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting snippet" });
    }
  });

  // User snippet routes
  app.get("/api/users/:userId/snippets", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const snippets = await storage.getSnippetsByUserId(userId);
      res.json(snippets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user snippets" });
    }
  });

  // Comment routes
  app.get("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const comment = await storage.createComment(validatedData);
      
      // Get user info to return with comment
      const user = await storage.getUser(req.user!.id);
      const commentWithUser = { ...comment, user: user! };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the comment
      const comment = Array.from(storage['comments'].values())
        .find(c => c.id === id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check ownership
      if (comment.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteComment(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // Like routes
  app.post("/api/snippets/:snippetId/like", isAuthenticated, async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      const userId = req.user!.id;
      
      // Check if user already liked this snippet
      const existingLike = await storage.getLikeByUserAndSnippet(userId, snippetId);
      
      if (existingLike) {
        await storage.deleteLike(existingLike.id);
        return res.json({ liked: false });
      }
      
      await storage.createLike({ snippetId, userId });
      res.json({ liked: true });
    } catch (error) {
      res.status(500).json({ message: "Error toggling like" });
    }
  });

  app.get("/api/snippets/:snippetId/likes", async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      const likes = await storage.getLikesBySnippetId(snippetId);
      
      // Check if current user liked this snippet
      let userLiked = false;
      if (req.isAuthenticated()) {
        userLiked = !!await storage.getLikeByUserAndSnippet(req.user!.id, snippetId);
      }
      
      res.json({ 
        count: likes.length,
        userLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching likes" });
    }
  });

  // Bookmark routes
  app.post("/api/snippets/:snippetId/bookmark", isAuthenticated, async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      const userId = req.user!.id;
      
      // Check if user already bookmarked this snippet
      const existingBookmark = await storage.getBookmarkByUserAndSnippet(userId, snippetId);
      
      if (existingBookmark) {
        await storage.deleteBookmark(existingBookmark.id);
        return res.json({ bookmarked: false });
      }
      
      await storage.createBookmark({ snippetId, userId });
      res.json({ bookmarked: true });
    } catch (error) {
      res.status(500).json({ message: "Error toggling bookmark" });
    }
  });

  app.get("/api/snippets/:snippetId/bookmark", isAuthenticated, async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      const userId = req.user!.id;
      
      const bookmark = await storage.getBookmarkByUserAndSnippet(userId, snippetId);
      res.json({ bookmarked: !!bookmark });
    } catch (error) {
      res.status(500).json({ message: "Error checking bookmark status" });
    }
  });

  app.get("/api/bookmarks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const bookmarkedSnippets = await storage.getBookmarksByUserId(userId);
      res.json(bookmarkedSnippets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookmarks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
