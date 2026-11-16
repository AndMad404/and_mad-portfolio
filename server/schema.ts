import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
// SQL migrations define the reviewed triggers, constraints and partial indexes.
export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  slug: text("slug").notNull(),
  head: text("head"),
});
export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull(),
  parentId: text("parent_id"),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const releases = sqliteTable("releases", {
  id: text("id").primaryKey(),
  snapshot: text("snapshot").notNull(),
  sourceRevision: text("source_revision").notNull(),
  state: text("state").notNull(),
  attemptId: text("attempt_id"),
  createdAt: integer("created_at").notNull(),
  deployedAt: integer("deployed_at"),
});
