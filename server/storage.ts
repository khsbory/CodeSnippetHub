import {
  users,
  type User,
  type InsertUser,
  snippets,
  type Snippet,
  type InsertSnippet,
  comments,
  type Comment,
  type InsertComment,
  likes,
  type Like,
  type InsertLike,
  bookmarks,
  type Bookmark,
  type InsertBookmark,
  type SnippetWithUser,
  type CommentWithUser
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Snippet methods
  getSnippets(limit?: number, filter?: string, language?: string): Promise<SnippetWithUser[]>;
  getSnippetById(id: number): Promise<SnippetWithUser | undefined>;
  getSnippetsByUserId(userId: number): Promise<SnippetWithUser[]>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: number): Promise<boolean>;
  incrementSnippetViews(id: number): Promise<boolean>;
  searchSnippets(query: string): Promise<SnippetWithUser[]>;
  
  // Comment methods
  getCommentsBySnippetId(snippetId: number): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Like methods
  getLikesBySnippetId(snippetId: number): Promise<Like[]>;
  getLikeByUserAndSnippet(userId: number, snippetId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<boolean>;
  
  // Bookmark methods
  getBookmarksByUserId(userId: number): Promise<SnippetWithUser[]>;
  getBookmarkByUserAndSnippet(userId: number, snippetId: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private snippets: Map<number, Snippet>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private bookmarks: Map<number, Bookmark>;
  
  sessionStore: session.SessionStore;
  
  userCurrentId: number;
  snippetCurrentId: number;
  commentCurrentId: number;
  likeCurrentId: number;
  bookmarkCurrentId: number;

  constructor() {
    this.users = new Map();
    this.snippets = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.bookmarks = new Map();
    
    const MemoryStore = createMemoryStore(session);
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.userCurrentId = 1;
    this.snippetCurrentId = 1;
    this.commentCurrentId = 1;
    this.likeCurrentId = 1;
    this.bookmarkCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(insertUser.username)}&background=random`;
    const user: User = { ...insertUser, id, createdAt, avatar };
    this.users.set(id, user);
    return user;
  }
  
  // Snippet methods
  async getSnippets(limit: number = 20, filter: string = 'latest', language: string = 'all'): Promise<SnippetWithUser[]> {
    let snippets = Array.from(this.snippets.values());
    
    // Apply language filter if not 'all'
    if (language !== 'all') {
      snippets = snippets.filter(snippet => snippet.language === language);
    }
    
    // Apply sorting based on filter
    switch (filter) {
      case 'popular':
        snippets = snippets.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'trending':
        // This is a simplified trending algorithm based on recent views
        snippets = snippets.sort((a, b) => {
          const aCreatedAtTime = a.createdAt?.getTime() || 0;
          const bCreatedAtTime = b.createdAt?.getTime() || 0;
          const aScore = (a.views || 0) * (Date.now() - aCreatedAtTime);
          const bScore = (b.views || 0) * (Date.now() - bCreatedAtTime);
          return bScore - aScore;
        });
        break;
      case 'latest':
      default:
        snippets = snippets.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return bTime - aTime;
        });
        break;
    }
    
    // Limit the number of results
    snippets = snippets.slice(0, limit);
    
    // Combine with user data
    const snippetsWithUser = await Promise.all(
      snippets.map(async (snippet) => {
        const user = await this.getUser(snippet.userId);
        return { ...snippet, user: user! };
      })
    );
    
    return snippetsWithUser;
  }
  
  async getSnippetById(id: number): Promise<SnippetWithUser | undefined> {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;
    
    const user = await this.getUser(snippet.userId);
    if (!user) return undefined;
    
    return { ...snippet, user };
  }
  
  async getSnippetsByUserId(userId: number): Promise<SnippetWithUser[]> {
    const userSnippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
    
    const user = await this.getUser(userId);
    if (!user) return [];
    
    return userSnippets.map(snippet => ({ ...snippet, user }));
  }
  
  async createSnippet(insertSnippet: InsertSnippet): Promise<Snippet> {
    const id = this.snippetCurrentId++;
    const views = 0;
    const createdAt = new Date();
    const snippet: Snippet = { ...insertSnippet, id, views, createdAt };
    this.snippets.set(id, snippet);
    return snippet;
  }
  
  async updateSnippet(id: number, updates: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;
    
    const updatedSnippet = { ...snippet, ...updates };
    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }
  
  async deleteSnippet(id: number): Promise<boolean> {
    // Also delete associated comments, likes, and bookmarks
    Array.from(this.comments.values())
      .filter(comment => comment.snippetId === id)
      .forEach(comment => this.comments.delete(comment.id));
      
    Array.from(this.likes.values())
      .filter(like => like.snippetId === id)
      .forEach(like => this.likes.delete(like.id));
      
    Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.snippetId === id)
      .forEach(bookmark => this.bookmarks.delete(bookmark.id));
    
    return this.snippets.delete(id);
  }
  
  async incrementSnippetViews(id: number): Promise<boolean> {
    const snippet = this.snippets.get(id);
    if (!snippet) return false;
    
    const updatedSnippet = { ...snippet, views: (snippet.views || 0) + 1 };
    this.snippets.set(id, updatedSnippet);
    return true;
  }
  
  async searchSnippets(query: string): Promise<SnippetWithUser[]> {
    const lowerQuery = query.toLowerCase();
    
    const matchingSnippets = Array.from(this.snippets.values())
      .filter(snippet => 
        snippet.title.toLowerCase().includes(lowerQuery) ||
        (snippet.description || '').toLowerCase().includes(lowerQuery) ||
        snippet.language.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
    
    // Combine with user data
    const snippetsWithUser = await Promise.all(
      matchingSnippets.map(async (snippet) => {
        const user = await this.getUser(snippet.userId);
        return { ...snippet, user: user! };
      })
    );
    
    return snippetsWithUser;
  }
  
  // Comment methods
  async getCommentsBySnippetId(snippetId: number): Promise<CommentWithUser[]> {
    const snippetComments = Array.from(this.comments.values())
      .filter(comment => comment.snippetId === snippetId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return aTime - bTime;
      });
    
    // Combine with user data
    const commentsWithUser = await Promise.all(
      snippetComments.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        return { ...comment, user: user! };
      })
    );
    
    return commentsWithUser;
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const createdAt = new Date();
    const comment: Comment = { ...insertComment, id, createdAt };
    this.comments.set(id, comment);
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Like methods
  async getLikesBySnippetId(snippetId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.snippetId === snippetId);
  }
  
  async getLikeByUserAndSnippet(userId: number, snippetId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values())
      .find(like => like.userId === userId && like.snippetId === snippetId);
  }
  
  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.likeCurrentId++;
    const createdAt = new Date();
    const like: Like = { ...insertLike, id, createdAt };
    this.likes.set(id, like);
    return like;
  }
  
  async deleteLike(id: number): Promise<boolean> {
    return this.likes.delete(id);
  }
  
  // Bookmark methods
  async getBookmarksByUserId(userId: number): Promise<SnippetWithUser[]> {
    const userBookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId);
    
    const snippetsPromises = userBookmarks.map(async bookmark => {
      const snippet = await this.getSnippetById(bookmark.snippetId);
      return snippet;
    });
    
    const snippets = await Promise.all(snippetsPromises);
    return snippets.filter((s): s is SnippetWithUser => s !== undefined);
  }
  
  async getBookmarkByUserAndSnippet(userId: number, snippetId: number): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values())
      .find(bookmark => bookmark.userId === userId && bookmark.snippetId === snippetId);
  }
  
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkCurrentId++;
    const createdAt = new Date();
    const bookmark: Bookmark = { ...insertBookmark, id, createdAt };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  
  async deleteBookmark(id: number): Promise<boolean> {
    return this.bookmarks.delete(id);
  }
}

export const storage = new MemStorage();
