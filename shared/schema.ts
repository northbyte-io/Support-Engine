import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting", "resolved", "closed"]);
export const commentVisibilityEnum = pgEnum("comment_visibility", ["internal", "external"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "agent", "customer"]);

// Tenants table for multi-tenancy
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  email: text("email").notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("customer"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Types - configurable per tenant
export const ticketTypes = pgTable("ticket_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("ticket"),
  color: text("color").default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Fields for ticket types
export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketTypeId: varchar("ticket_type_id").references(() => ticketTypes.id),
  name: text("name").notNull(),
  label: text("label").notNull(),
  fieldType: text("field_type").notNull(), // text, number, select, multiselect, date, checkbox
  options: jsonb("options"), // For select/multiselect fields
  isRequired: boolean("is_required").default(false),
  requiredForStatus: text("required_for_status").array(), // Status where field becomes required
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  ticketNumber: text("ticket_number").notNull(),
  ticketTypeId: varchar("ticket_type_id").references(() => ticketTypes.id),
  title: text("title").notNull(),
  description: text("description"),
  status: ticketStatusEnum("status").default("open"),
  priority: ticketPriorityEnum("priority").default("medium"),
  createdById: varchar("created_by_id").references(() => users.id),
  customFieldValues: jsonb("custom_field_values"),
  dueDate: timestamp("due_date"),
  // SLA tracking fields
  slaDefinitionId: varchar("sla_definition_id").references(() => slaDefinitions.id),
  firstResponseAt: timestamp("first_response_at"),
  slaResponseDueAt: timestamp("sla_response_due_at"),
  slaResolutionDueAt: timestamp("sla_resolution_due_at"),
  slaBreached: boolean("sla_breached").default(false),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket Assignees (multiple parallel assignees)
export const ticketAssignees = pgTable("ticket_assignees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  userId: varchar("user_id").references(() => users.id),
  isPrimary: boolean("is_primary").default(false),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Ticket Watchers/Supporters
export const ticketWatchers = pgTable("ticket_watchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  userId: varchar("user_id").references(() => users.id),
  watcherType: text("watcher_type").default("watcher"), // watcher, supporter
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  authorId: varchar("author_id").references(() => users.id),
  content: text("content").notNull(),
  visibility: commentVisibilityEnum("visibility").default("external"),
  isNote: boolean("is_note").default(false), // true = note, false = comment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  commentId: varchar("comment_id").references(() => comments.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// SLA Definitions - response and resolution times per priority
export const slaDefinitions = pgTable("sla_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  // Response times in minutes per priority
  responseTimeLow: integer("response_time_low").default(480), // 8 hours
  responseTimeMedium: integer("response_time_medium").default(240), // 4 hours
  responseTimeHigh: integer("response_time_high").default(60), // 1 hour
  responseTimeUrgent: integer("response_time_urgent").default(15), // 15 min
  // Resolution times in minutes per priority
  resolutionTimeLow: integer("resolution_time_low").default(4320), // 3 days
  resolutionTimeMedium: integer("resolution_time_medium").default(1440), // 1 day
  resolutionTimeHigh: integer("resolution_time_high").default(480), // 8 hours
  resolutionTimeUrgent: integer("resolution_time_urgent").default(120), // 2 hours
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SLA Escalation levels
export const slaEscalations = pgTable("sla_escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slaDefinitionId: varchar("sla_definition_id").references(() => slaDefinitions.id),
  level: integer("level").notNull(), // 1, 2, 3...
  thresholdPercent: integer("threshold_percent").notNull(), // e.g., 80 = escalate at 80% of time
  notifyUserIds: text("notify_user_ids").array(), // Users to notify
  escalationType: text("escalation_type").default("response"), // response, resolution
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Categories
export const kbCategories = pgTable("kb_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"), // Self-reference for nested categories
  slug: text("slug").notNull(),
  order: integer("order").default(0),
  isPublic: boolean("is_public").default(true), // Visible to customers
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Articles
export const kbArticles = pgTable("kb_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  categoryId: varchar("category_id").references(() => kbCategories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  authorId: varchar("author_id").references(() => users.id),
  status: text("status").default("draft"), // draft, published, archived
  isPublic: boolean("is_public").default(true), // Visible to customers
  viewCount: integer("view_count").default(0),
  version: integer("version").default(1),
  tags: text("tags").array(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base Article Versions (for version history)
export const kbArticleVersions = pgTable("kb_article_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => kbArticles.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull(),
  changedById: varchar("changed_by_id").references(() => users.id),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket to Article links (suggested/attached knowledge base articles)
export const ticketKbLinks = pgTable("ticket_kb_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  articleId: varchar("article_id").references(() => kbArticles.id),
  linkedById: varchar("linked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time Entries for time tracking
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  userId: varchar("user_id").references(() => users.id),
  description: text("description"),
  minutes: integer("minutes").notNull(),
  date: timestamp("date").notNull(),
  isBillable: boolean("is_billable").default(false),
  hourlyRate: integer("hourly_rate"), // In cents for precision
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Areas/Departments for ticket assignment
export const areas = pgTable("areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6B7280"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Areas (for area-based assignment)
export const ticketAreas = pgTable("ticket_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  areaId: varchar("area_id").references(() => areas.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  tickets: many(tickets),
  ticketTypes: many(ticketTypes),
  areas: many(areas),
  slaDefinitions: many(slaDefinitions),
  kbCategories: many(kbCategories),
  kbArticles: many(kbArticles),
  timeEntries: many(timeEntries),
}));

export const kbCategoriesRelations = relations(kbCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [kbCategories.tenantId],
    references: [tenants.id],
  }),
  articles: many(kbArticles),
}));

export const kbArticlesRelations = relations(kbArticles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [kbArticles.tenantId],
    references: [tenants.id],
  }),
  category: one(kbCategories, {
    fields: [kbArticles.categoryId],
    references: [kbCategories.id],
  }),
  author: one(users, {
    fields: [kbArticles.authorId],
    references: [users.id],
  }),
  versions: many(kbArticleVersions),
  ticketLinks: many(ticketKbLinks),
}));

export const kbArticleVersionsRelations = relations(kbArticleVersions, ({ one }) => ({
  article: one(kbArticles, {
    fields: [kbArticleVersions.articleId],
    references: [kbArticles.id],
  }),
  changedBy: one(users, {
    fields: [kbArticleVersions.changedById],
    references: [users.id],
  }),
}));

export const ticketKbLinksRelations = relations(ticketKbLinks, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketKbLinks.ticketId],
    references: [tickets.id],
  }),
  article: one(kbArticles, {
    fields: [ticketKbLinks.articleId],
    references: [kbArticles.id],
  }),
  linkedBy: one(users, {
    fields: [ticketKbLinks.linkedById],
    references: [users.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [timeEntries.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [timeEntries.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const slaDefinitionsRelations = relations(slaDefinitions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [slaDefinitions.tenantId],
    references: [tenants.id],
  }),
  escalations: many(slaEscalations),
  tickets: many(tickets),
}));

export const slaEscalationsRelations = relations(slaEscalations, ({ one }) => ({
  slaDefinition: one(slaDefinitions, {
    fields: [slaEscalations.slaDefinitionId],
    references: [slaDefinitions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  createdTickets: many(tickets),
  assignedTickets: many(ticketAssignees),
  watchedTickets: many(ticketWatchers),
  comments: many(comments),
  attachments: many(attachments),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ticketTypes.tenantId],
    references: [tenants.id],
  }),
  tickets: many(tickets),
  customFields: many(customFields),
}));

export const customFieldsRelations = relations(customFields, ({ one }) => ({
  ticketType: one(ticketTypes, {
    fields: [customFields.ticketTypeId],
    references: [ticketTypes.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tickets.tenantId],
    references: [tenants.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id],
  }),
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
  }),
  assignees: many(ticketAssignees),
  watchers: many(ticketWatchers),
  comments: many(comments),
  attachments: many(attachments),
  areas: many(ticketAreas),
}));

export const ticketAssigneesRelations = relations(ticketAssignees, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAssignees.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketAssignees.userId],
    references: [users.id],
  }),
}));

export const ticketWatchersRelations = relations(ticketWatchers, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketWatchers.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketWatchers.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
  comment: one(comments, {
    fields: [attachments.commentId],
    references: [comments.id],
  }),
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [areas.tenantId],
    references: [tenants.id],
  }),
  ticketAreas: many(ticketAreas),
}));

export const ticketAreasRelations = relations(ticketAreas, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAreas.ticketId],
    references: [tickets.id],
  }),
  area: one(areas, {
    fields: [ticketAreas.areaId],
    references: [areas.id],
  }),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLoginAt: true });
export const insertTicketTypeSchema = createInsertSchema(ticketTypes).omit({ id: true, createdAt: true });
export const insertCustomFieldSchema = createInsertSchema(customFields).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, ticketNumber: true, createdAt: true, updatedAt: true, resolvedAt: true, closedAt: true });
export const insertTicketAssigneeSchema = createInsertSchema(ticketAssignees).omit({ id: true, assignedAt: true });
export const insertTicketWatcherSchema = createInsertSchema(ticketWatchers).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertAreaSchema = createInsertSchema(areas).omit({ id: true, createdAt: true });
export const insertSlaDefinitionSchema = createInsertSchema(slaDefinitions).omit({ id: true, createdAt: true });
export const insertSlaEscalationSchema = createInsertSchema(slaEscalations).omit({ id: true, createdAt: true });
export const insertTicketAreaSchema = createInsertSchema(ticketAreas).omit({ id: true, createdAt: true });
export const insertKbCategorySchema = createInsertSchema(kbCategories).omit({ id: true, createdAt: true });
export const insertKbArticleSchema = createInsertSchema(kbArticles).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, version: true, publishedAt: true });
export const insertKbArticleVersionSchema = createInsertSchema(kbArticleVersions).omit({ id: true, createdAt: true });
export const insertTicketKbLinkSchema = createInsertSchema(ticketKbLinks).omit({ id: true, createdAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TicketType = typeof ticketTypes.$inferSelect;
export type InsertTicketType = z.infer<typeof insertTicketTypeSchema>;
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketAssignee = typeof ticketAssignees.$inferSelect;
export type InsertTicketAssignee = z.infer<typeof insertTicketAssigneeSchema>;
export type TicketWatcher = typeof ticketWatchers.$inferSelect;
export type InsertTicketWatcher = z.infer<typeof insertTicketWatcherSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Area = typeof areas.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type SlaDefinition = typeof slaDefinitions.$inferSelect;
export type InsertSlaDefinition = z.infer<typeof insertSlaDefinitionSchema>;
export type SlaEscalation = typeof slaEscalations.$inferSelect;
export type InsertSlaEscalation = z.infer<typeof insertSlaEscalationSchema>;
export type TicketArea = typeof ticketAreas.$inferSelect;
export type InsertTicketArea = z.infer<typeof insertTicketAreaSchema>;
export type KbCategory = typeof kbCategories.$inferSelect;
export type InsertKbCategory = z.infer<typeof insertKbCategorySchema>;
export type KbArticle = typeof kbArticles.$inferSelect;
export type InsertKbArticle = z.infer<typeof insertKbArticleSchema>;
export type KbArticleVersion = typeof kbArticleVersions.$inferSelect;
export type InsertKbArticleVersion = z.infer<typeof insertKbArticleVersionSchema>;
export type TicketKbLink = typeof ticketKbLinks.$inferSelect;
export type InsertTicketKbLink = z.infer<typeof insertTicketKbLinkSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// Extended types for API responses
export type TicketWithRelations = Ticket & {
  ticketType?: TicketType | null;
  createdBy?: User | null;
  slaDefinition?: SlaDefinition | null;
  assignees?: (TicketAssignee & { user?: User })[];
  watchers?: (TicketWatcher & { user?: User })[];
  comments?: (Comment & { author?: User; attachments?: Attachment[] })[];
  attachments?: Attachment[];
  areas?: (TicketArea & { area?: Area })[];
};

export type SlaDefinitionWithEscalations = SlaDefinition & {
  escalations?: SlaEscalation[];
};

export type KbCategoryWithArticles = KbCategory & {
  articles?: KbArticle[];
};

export type KbArticleWithRelations = KbArticle & {
  category?: KbCategory | null;
  author?: User | null;
  versions?: KbArticleVersion[];
};

export type TimeEntryWithRelations = TimeEntry & {
  user?: User | null;
  ticket?: Ticket | null;
};

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  tenantId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
