import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"), // 실명 필드 추가
  password: text("password").notNull(),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  verificationToken: text("verification_token"),
  tokenExpiry: timestamp("token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export const registerSchema = z.object({
  email: z.string()
    .email("유효한 이메일 주소를 입력해주세요"),
  fullName: z.string()
    .min(2, "이름은 최소 2자 이상이어야 합니다")
    .max(50, "이름이 너무 깁니다"),
  password: z.string()
    .min(6, "비밀번호는 최소 6자 이상이어야 합니다")
    .max(100, "비밀번호가 너무 깁니다"),
  confirmPassword: z.string()
    .min(1, "비밀번호 확인을 입력해주세요")
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSnippetSchema = createInsertSchema(snippets).pick({
  title: true,
  description: true,
  code: true,
  language: true,
  userId: true,
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  snippetId: integer("snippet_id").notNull().references(() => snippets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  snippetId: true,
  userId: true,
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippet_id").notNull().references(() => snippets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  snippetId: true,
  userId: true,
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippet_id").notNull().references(() => snippets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  snippetId: true,
  userId: true,
});

export type User = typeof users.$inferSelect;
export type Snippet = typeof snippets.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type SnippetWithUser = Snippet & { user: User };
export type CommentWithUser = Comment & { user: User };
