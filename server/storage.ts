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
import { eq, and, or, desc, asc, like, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  verifyUser(userId: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: number): Promise<boolean>;
  
  // Snippet methods
  getSnippets(limit?: number, filter?: string, language?: string, category?: string, page?: number): Promise<SnippetWithUser[]>;
  getSnippetById(id: number): Promise<SnippetWithUser | undefined>;
  getSnippetsByUserId(userId: number): Promise<SnippetWithUser[]>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: number): Promise<boolean>;
  incrementSnippetViews(id: number): Promise<boolean>;
  searchSnippets(query: string, category?: string): Promise<SnippetWithUser[]>;
  
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
  sessionStore: any; // Using any to avoid type issues with SessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private snippets: Map<number, Snippet>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private bookmarks: Map<number, Bookmark>;
  
  sessionStore: any; // Using any to match interface
  
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token && user.isVerified === false,
    );
  }
  
  async verifyUser(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = {
      ...user,
      isVerified: true,
      verificationToken: null,
      tokenExpiry: null
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.id - b.id);
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    // 사용자를 삭제하기 전에 관련된 모든 데이터 삭제
    
    // 사용자의 모든 스니펫 찾기
    const userSnippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.userId === userId);
      
    // 각 스니펫 삭제 (관련 댓글, 좋아요, 북마크도 함께 삭제됨)
    for (const snippet of userSnippets) {
      await this.deleteSnippet(snippet.id);
    }
    
    // 사용자가 작성한 댓글 삭제
    Array.from(this.comments.values())
      .filter(comment => comment.userId === userId)
      .forEach(comment => this.comments.delete(comment.id));
      
    // 사용자의 좋아요 삭제
    Array.from(this.likes.values())
      .filter(like => like.userId === userId)
      .forEach(like => this.likes.delete(like.id));
      
    // 사용자의 북마크 삭제
    Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .forEach(bookmark => this.bookmarks.delete(bookmark.id));
    
    // 마지막으로 사용자 삭제
    return this.users.delete(userId);
  }

  async createUser(insertUser: Partial<User>): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    let avatarName = insertUser.username || '';
    
    // 만약 fullName이 있다면 아바타 생성 시 fullName 사용
    if (insertUser.fullName) {
      avatarName = insertUser.fullName;
    }
    
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random`;
    
    const user: User = {
      id,
      username: insertUser.username || '',
      email: insertUser.email || '',
      password: insertUser.password || '',
      fullName: insertUser.fullName || null,
      avatar,
      isVerified: insertUser.isVerified || false,
      isAdmin: insertUser.isAdmin || false,
      verificationToken: insertUser.verificationToken || null,
      tokenExpiry: insertUser.tokenExpiry || null,
      createdAt
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // Snippet methods
  async getSnippets(limit: number = 20, filter: string = 'latest', language: string = 'all', category: string = 'all', page: number = 1): Promise<SnippetWithUser[]> {
    let snippets = Array.from(this.snippets.values());
    
    // Apply language filter if not 'all'
    if (language !== 'all') {
      snippets = snippets.filter(snippet => snippet.language === language);
    }
    
    // Apply category filter if not 'all'
    if (category !== 'all') {
      snippets = snippets.filter(snippet => snippet.category === category);
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
    
    // Calculate pagination (page is 1-based)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Apply pagination
    snippets = snippets.slice(startIndex, endIndex);
    
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
    const snippet: Snippet = { 
      ...insertSnippet, 
      id, 
      views, 
      createdAt,
      description: insertSnippet.description || null,
      category: insertSnippet.category || 'web' // Default to 'web' category
    };
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
  
  async searchSnippets(query: string, category: string = 'all'): Promise<SnippetWithUser[]> {
    const lowerQuery = query.toLowerCase();
    
    let matchingSnippets = Array.from(this.snippets.values())
      .filter(snippet => 
        snippet.title.toLowerCase().includes(lowerQuery) ||
        (snippet.description || '').toLowerCase().includes(lowerQuery) ||
        snippet.language.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery)
      );
      
    // Apply category filter if not 'all'
    if (category !== 'all') {
      matchingSnippets = matchingSnippets.filter(snippet => snippet.category === category);
    }
    
    // Sort by creation date (newest first)
    matchingSnippets = matchingSnippets.sort((a, b) => {
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

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any temporarily to fix type error
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          eq(users.isVerified, false)
        )
      );
    return user;
  }
  
  async verifyUser(userId: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null
      })
      .where(eq(users.id, userId));
    
    return !!result;
  }
  
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(users.id);
    
    return allUsers;
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    try {
      // 사용자가 작성한 댓글 삭제
      await db
        .delete(comments)
        .where(eq(comments.userId, userId));

      // 사용자의 좋아요 삭제
      await db
        .delete(likes)
        .where(eq(likes.userId, userId));

      // 사용자의 북마크 삭제
      await db
        .delete(bookmarks)
        .where(eq(bookmarks.userId, userId));
      
      // 사용자가 작성한 스니펫 찾기
      const userSnippets = await db
        .select()
        .from(snippets)
        .where(eq(snippets.userId, userId));
      
      // 각 스니펫에 대해 관련 데이터 삭제
      for (const snippet of userSnippets) {
        // 해당 스니펫에 대한 모든 댓글 삭제
        await db
          .delete(comments)
          .where(eq(comments.snippetId, snippet.id));
        
        // 해당 스니펫에 대한 모든 좋아요 삭제
        await db
          .delete(likes)
          .where(eq(likes.snippetId, snippet.id));
        
        // 해당 스니펫에 대한 모든 북마크 삭제
        await db
          .delete(bookmarks)
          .where(eq(bookmarks.snippetId, snippet.id));
        
        // 스니펫 삭제
        await db
          .delete(snippets)
          .where(eq(snippets.id, snippet.id));
      }
      
      // 마지막으로 사용자 삭제
      await db
        .delete(users)
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      return false;
    }
  }
  
  async createUser(insertUser: Partial<User>): Promise<User> {
    let avatarName = insertUser.username || '';
    
    // 만약 fullName이 있다면 아바타 생성 시 fullName 사용
    if (insertUser.fullName) {
      avatarName = insertUser.fullName;
    }
    
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random`;
    
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username || '',
        email: insertUser.email || '',
        fullName: insertUser.fullName || null,
        password: insertUser.password || '',
        avatar,
        isVerified: insertUser.isVerified ?? false,
        isAdmin: insertUser.isAdmin ?? false,
        verificationToken: insertUser.verificationToken,
        tokenExpiry: insertUser.tokenExpiry,
        createdAt: new Date()
      })
      .returning();
      
    return user;
  }
  
  // Snippet methods
  async getSnippets(limit: number = 20, filter: string = 'latest', language: string = 'all', category: string = 'all', page: number = 1): Promise<SnippetWithUser[]> {
    let query = db.select({
      snippet: snippets,
      user: users
    })
    .from(snippets)
    .innerJoin(users, eq(snippets.userId, users.id));
    
    // Apply filters
    let conditions = [];
    
    // Filter by language if specified
    if (language !== 'all') {
      conditions.push(eq(snippets.language, language));
    }
    
    // Filter by category if specified
    if (category !== 'all') {
      conditions.push(eq(snippets.category, category));
    }
    
    // Apply WHERE clause if any conditions exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting based on filter
    if (filter === 'popular') {
      query = query.orderBy(desc(snippets.views));
    } else if (filter === 'trending') {
      // This is simplified for now
      query = query.orderBy(desc(snippets.views), desc(snippets.createdAt));
    } else {
      // Default to 'latest'
      query = query.orderBy(desc(snippets.createdAt));
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Apply pagination using offset and limit
    query = query.offset(offset).limit(limit);
    
    const results = await query;
    
    // Transform results to SnippetWithUser format
    return results.map((result: any) => ({
      ...result.snippet,
      user: result.user
    }));
  }
  
  async getSnippetById(id: number): Promise<SnippetWithUser | undefined> {
    const [result] = await db.select({
      snippet: snippets,
      user: users
    })
    .from(snippets)
    .innerJoin(users, eq(snippets.userId, users.id))
    .where(eq(snippets.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.snippet,
      user: result.user
    };
  }
  
  async getSnippetsByUserId(userId: number): Promise<SnippetWithUser[]> {
    const results = await db.select({
      snippet: snippets,
      user: users
    })
    .from(snippets)
    .innerJoin(users, eq(snippets.userId, users.id))
    .where(eq(snippets.userId, userId))
    .orderBy(desc(snippets.createdAt));
    
    return results.map((result: any) => ({
      ...result.snippet,
      user: result.user
    }));
  }
  
  async createSnippet(insertSnippet: InsertSnippet): Promise<Snippet> {
    const [snippet] = await db
      .insert(snippets)
      .values({ 
        ...insertSnippet, 
        createdAt: new Date(),
        views: 0,
        description: insertSnippet.description || null, // Ensure description is not undefined
        category: insertSnippet.category || 'web' // Default to 'web' category
      })
      .returning();
    
    return snippet;
  }
  
  async updateSnippet(id: number, updates: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    // Ensure description is not undefined if it's in the update
    const updatesWithNullDesc = updates.description === undefined 
      ? updates 
      : { ...updates, description: updates.description || null };
      
    const [updatedSnippet] = await db
      .update(snippets)
      .set(updatesWithNullDesc)
      .where(eq(snippets.id, id))
      .returning();
    
    return updatedSnippet;
  }
  
  async deleteSnippet(id: number): Promise<boolean> {
    // Delete associated records first
    await db.delete(comments).where(eq(comments.snippetId, id));
    await db.delete(likes).where(eq(likes.snippetId, id));
    await db.delete(bookmarks).where(eq(bookmarks.snippetId, id));
    
    const [deleted] = await db
      .delete(snippets)
      .where(eq(snippets.id, id))
      .returning();
    
    return !!deleted;
  }
  
  async incrementSnippetViews(id: number): Promise<boolean> {
    const [updated] = await db
      .update(snippets)
      .set({ 
        views: sql`${snippets.views} + 1` 
      })
      .where(eq(snippets.id, id))
      .returning();
    
    return !!updated;
  }
  
  async searchSnippets(query: string, category: string = 'all'): Promise<SnippetWithUser[]> {
    const searchPattern = `%${query}%`;
    
    // Build search conditions
    const searchConditions = or(
      like(snippets.title, searchPattern),
      like(snippets.description, searchPattern),
      like(snippets.code, searchPattern),
      like(snippets.language, searchPattern)
    );
    
    // Add category filter if specified
    let whereCondition = searchConditions;
    if (category !== 'all') {
      whereCondition = and(searchConditions, eq(snippets.category, category));
    }
    
    const results = await db.select({
      snippet: snippets,
      user: users
    })
    .from(snippets)
    .innerJoin(users, eq(snippets.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(snippets.createdAt));
    
    return results.map((result: any) => ({
      ...result.snippet,
      user: result.user
    }));
  }
  
  // Comment methods
  async getCommentsBySnippetId(snippetId: number): Promise<CommentWithUser[]> {
    const results = await db.select({
      comment: comments,
      user: users
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.snippetId, snippetId))
    .orderBy(asc(comments.createdAt));
    
    return results.map((result: any) => ({
      ...result.comment,
      user: result.user
    }));
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...insertComment,
        createdAt: new Date()
      })
      .returning();
    
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();
    
    return !!deleted;
  }
  
  // Like methods
  async getLikesBySnippetId(snippetId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.snippetId, snippetId));
  }
  
  async getLikeByUserAndSnippet(userId: number, snippetId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.snippetId, snippetId)
        )
      );
    
    return like;
  }
  
  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({
        ...insertLike,
        createdAt: new Date()
      })
      .returning();
    
    return like;
  }
  
  async deleteLike(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(likes)
      .where(eq(likes.id, id))
      .returning();
    
    return !!deleted;
  }
  
  // Bookmark methods
  async getBookmarksByUserId(userId: number): Promise<SnippetWithUser[]> {
    const results = await db.select({
      snippet: snippets,
      user: users,
      bookmark: bookmarks
    })
    .from(bookmarks)
    .innerJoin(snippets, eq(bookmarks.snippetId, snippets.id))
    .innerJoin(users, eq(snippets.userId, users.id))
    .where(eq(bookmarks.userId, userId));
    
    return results.map((result: any) => ({
      ...result.snippet,
      user: result.user
    }));
  }
  
  async getBookmarkByUserAndSnippet(userId: number, snippetId: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.snippetId, snippetId)
        )
      );
    
    return bookmark;
  }
  
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        ...insertBookmark,
        createdAt: new Date()
      })
      .returning();
    
    return bookmark;
  }
  
  async deleteBookmark(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, id))
      .returning();
    
    return !!deleted;
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
