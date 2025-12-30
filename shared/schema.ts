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
  // Branding - Logo & Favicon
  logo: text("logo"),
  logoLight: text("logo_light"), // Logo für Light Mode
  logoDark: text("logo_dark"), // Logo für Dark Mode
  favicon: text("favicon"),
  // Branding - Farben
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#6366F1"),
  accentColor: text("accent_color").default("#10B981"),
  // Branding - Typografie
  fontFamily: text("font_family").default("Inter"),
  // Branding - E-Mail Templates
  emailHeaderHtml: text("email_header_html"),
  emailFooterHtml: text("email_footer_html"),
  emailFromName: text("email_from_name"),
  emailFromAddress: text("email_from_address"),
  // Branding - Benutzerdefiniertes CSS
  customCss: text("custom_css"),
  // Branding - Allgemein
  companyWebsite: text("company_website"),
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  // CRM fields - customer reference (FK handled in storage layer)
  customerId: varchar("customer_id"),
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

// Notifications for users
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // mention, assignment, comment, status_change, sla_warning
  title: text("title").notNull(),
  message: text("message").notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  commentId: varchar("comment_id").references(() => comments.id),
  actorId: varchar("actor_id").references(() => users.id), // User who triggered the notification
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mentions in comments (tracks @mentions)
export const mentions = pgTable("mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => comments.id),
  mentionedUserId: varchar("mentioned_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey question type enum
export const surveyQuestionTypeEnum = pgEnum("survey_question_type", ["rating", "text", "choice", "nps"]);

// Surveys - define survey templates
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  triggerOnClose: boolean("trigger_on_close").default(true), // Auto-send when ticket is closed
  delayMinutes: integer("delay_minutes").default(0), // Delay before sending after ticket close
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Survey Questions
export const surveyQuestions = pgTable("survey_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").references(() => surveys.id),
  questionText: text("question_text").notNull(),
  questionType: surveyQuestionTypeEnum("question_type").default("rating"),
  options: jsonb("options"), // For choice type questions - array of strings
  isRequired: boolean("is_required").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey Invitations - tracks which surveys were sent to whom
export const surveyInvitations = pgTable("survey_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  surveyId: varchar("survey_id").references(() => surveys.id),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  userId: varchar("user_id").references(() => users.id), // Customer who receives the survey
  token: varchar("token").notNull().unique(), // Unique token for survey access
  sentAt: timestamp("sent_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

// Survey Responses - individual answers to questions
export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invitationId: varchar("invitation_id").references(() => surveyInvitations.id),
  questionId: varchar("question_id").references(() => surveyQuestions.id),
  ratingValue: integer("rating_value"), // For rating/NPS questions (1-5 or 0-10)
  textValue: text("text_value"), // For text questions
  choiceValue: text("choice_value"), // For choice questions
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [notifications.ticketId],
    references: [tickets.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
}));

export const mentionsRelations = relations(mentions, ({ one }) => ({
  comment: one(comments, {
    fields: [mentions.commentId],
    references: [comments.id],
  }),
  mentionedUser: one(users, {
    fields: [mentions.mentionedUserId],
    references: [users.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [surveys.tenantId],
    references: [tenants.id],
  }),
  questions: many(surveyQuestions),
  invitations: many(surveyInvitations),
}));

export const surveyQuestionsRelations = relations(surveyQuestions, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [surveyQuestions.surveyId],
    references: [surveys.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyInvitationsRelations = relations(surveyInvitations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [surveyInvitations.tenantId],
    references: [tenants.id],
  }),
  survey: one(surveys, {
    fields: [surveyInvitations.surveyId],
    references: [surveys.id],
  }),
  ticket: one(tickets, {
    fields: [surveyInvitations.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [surveyInvitations.userId],
    references: [users.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  invitation: one(surveyInvitations, {
    fields: [surveyResponses.invitationId],
    references: [surveyInvitations.id],
  }),
  question: one(surveyQuestions, {
    fields: [surveyResponses.questionId],
    references: [surveyQuestions.id],
  }),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const updateTenantBrandingSchema = createInsertSchema(tenants).omit({ id: true, name: true, slug: true, createdAt: true, updatedAt: true, isActive: true }).partial();
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
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, readAt: true });
export const insertMentionSchema = createInsertSchema(mentions).omit({ id: true, createdAt: true });
export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({ id: true, createdAt: true });
export const insertSurveyInvitationSchema = createInsertSchema(surveyInvitations).omit({ id: true, sentAt: true, completedAt: true });
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, createdAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type UpdateTenantBranding = z.infer<typeof updateTenantBrandingSchema>;
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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Mention = typeof mentions.$inferSelect;
export type InsertMention = z.infer<typeof insertMentionSchema>;
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;
export type SurveyInvitation = typeof surveyInvitations.$inferSelect;
export type InsertSurveyInvitation = z.infer<typeof insertSurveyInvitationSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

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
  customer?: (Customer & { contacts?: Contact[]; organization?: Organization | null }) | null;
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

export type NotificationWithRelations = Notification & {
  user?: User | null;
  ticket?: Ticket | null;
  actor?: User | null;
  comment?: Comment | null;
};

export type MentionWithRelations = Mention & {
  comment?: Comment | null;
  mentionedUser?: User | null;
};

export type SurveyWithRelations = Survey & {
  questions?: SurveyQuestion[];
  invitations?: SurveyInvitation[];
};

export type SurveyInvitationWithRelations = SurveyInvitation & {
  survey?: Survey | null;
  ticket?: Ticket | null;
  user?: User | null;
  responses?: SurveyResponse[];
};

export type SurveyResultSummary = {
  surveyId: string;
  surveyName: string;
  totalInvitations: number;
  completedCount: number;
  responseRate: number;
  avgRating: number | null;
  npsScore: number | null;
  questionStats: {
    questionId: string;
    questionText: string;
    questionType: string;
    avgRating: number | null;
    responseCount: number;
    choiceDistribution?: Record<string, number>;
  }[];
};

// Asset type enum
export const assetTypeEnum = pgEnum("asset_type", ["hardware", "software", "license", "contract"]);
export const assetStatusEnum = pgEnum("asset_status", ["active", "inactive", "maintenance", "disposed", "expired"]);

// Asset Categories
export const assetCategories = pgTable("asset_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  assetType: assetTypeEnum("asset_type").notNull(),
  icon: text("icon").default("box"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assets
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  categoryId: varchar("category_id").references(() => assetCategories.id),
  assetNumber: text("asset_number").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  assetType: assetTypeEnum("asset_type").notNull(),
  status: assetStatusEnum("asset_status").default("active"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: integer("purchase_price"),
  warrantyExpiry: timestamp("warranty_expiry"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  location: text("location"),
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// License details for software assets
export const assetLicenses = pgTable("asset_licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => assets.id),
  licenseKey: text("license_key"),
  licensedSeats: integer("licensed_seats"),
  usedSeats: integer("used_seats").default(0),
  licenseType: text("license_type"),
  startDate: timestamp("start_date"),
  expiryDate: timestamp("expiry_date"),
  renewalCost: integer("renewal_cost"),
  vendor: text("vendor"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract details for contract assets
export const assetContracts = pgTable("asset_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => assets.id),
  contractNumber: text("contract_number"),
  contractType: text("contract_type"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  autoRenew: boolean("auto_renew").default(false),
  monthlyCost: integer("monthly_cost"),
  annualCost: integer("annual_cost"),
  vendor: text("vendor"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Asset-Ticket linking
export const ticketAssets = pgTable("ticket_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  assetId: varchar("asset_id").references(() => assets.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Asset maintenance/history log
export const assetHistory = pgTable("asset_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => assets.id),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  description: text("description"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssetCategorySchema = createInsertSchema(assetCategories).omit({ id: true, createdAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetLicenseSchema = createInsertSchema(assetLicenses).omit({ id: true, createdAt: true });
export const insertAssetContractSchema = createInsertSchema(assetContracts).omit({ id: true, createdAt: true });
export const insertTicketAssetSchema = createInsertSchema(ticketAssets).omit({ id: true, createdAt: true });
export const insertAssetHistorySchema = createInsertSchema(assetHistory).omit({ id: true, createdAt: true });

export type AssetCategory = typeof assetCategories.$inferSelect;
export type InsertAssetCategory = z.infer<typeof insertAssetCategorySchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type AssetLicense = typeof assetLicenses.$inferSelect;
export type InsertAssetLicense = z.infer<typeof insertAssetLicenseSchema>;
export type AssetContract = typeof assetContracts.$inferSelect;
export type InsertAssetContract = z.infer<typeof insertAssetContractSchema>;
export type TicketAsset = typeof ticketAssets.$inferSelect;
export type InsertTicketAsset = z.infer<typeof insertTicketAssetSchema>;
export type AssetHistory = typeof assetHistory.$inferSelect;
export type InsertAssetHistory = z.infer<typeof insertAssetHistorySchema>;

export type AssetWithRelations = Asset & {
  category?: AssetCategory | null;
  assignedTo?: User | null;
  license?: AssetLicense | null;
  contract?: AssetContract | null;
  history?: AssetHistory[];
};

// Projects for Kanban board organization
export const projectStatusEnum = pgEnum("project_status", ["active", "on_hold", "completed", "archived"]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  key: text("key").notNull(), // Short key like "PROJ" for ticket prefixes
  status: projectStatusEnum("project_status").default("active"),
  color: text("color").default("#3B82F6"),
  icon: text("icon").default("folder"),
  leadId: varchar("lead_id").references(() => users.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project members with roles
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => users.id),
  role: text("role").default("member"), // lead, member, viewer
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Board columns for Kanban view (customizable per project)
export const boardColumns = pgTable("board_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  status: ticketStatusEnum("status"), // Maps to ticket status
  color: text("color").default("#6B7280"),
  order: integer("order").default(0),
  wipLimit: integer("wip_limit"), // Work-in-progress limit
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket-Project assignment
export const ticketProjects = pgTable("ticket_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  projectId: varchar("project_id").references(() => projects.id),
  boardOrder: integer("board_order").default(0), // Position in board column
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({ id: true, joinedAt: true });
export const insertBoardColumnSchema = createInsertSchema(boardColumns).omit({ id: true, createdAt: true });
export const insertTicketProjectSchema = createInsertSchema(ticketProjects).omit({ id: true, createdAt: true });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type BoardColumn = typeof boardColumns.$inferSelect;
export type InsertBoardColumn = z.infer<typeof insertBoardColumnSchema>;
export type TicketProject = typeof ticketProjects.$inferSelect;
export type InsertTicketProject = z.infer<typeof insertTicketProjectSchema>;

export type ProjectWithRelations = Project & {
  lead?: User | null;
  members?: (ProjectMember & { user?: User })[];
  columns?: BoardColumn[];
  ticketCount?: number;
};

// ============================================
// CRM ENTITIES - Customer & Contact Management
// ============================================

// Organizations (Companies)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  taxId: text("tax_id"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Deutschland"),
  parentId: varchar("parent_id"), // Hierarchical org structure
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers (can be linked to organization or standalone)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  customerNumber: text("customer_number").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Deutschland"),
  accountManagerId: varchar("account_manager_id").references(() => users.id),
  slaDefinitionId: varchar("sla_definition_id").references(() => slaDefinitions.id),
  priority: ticketPriorityEnum("priority").default("medium"),
  notes: text("notes"),
  customFields: jsonb("custom_fields"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Locations (multiple sites per customer)
export const customerLocations = pgTable("customer_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Deutschland"),
  phone: text("phone"),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contacts (people at customer/organization)
export const contactRoleEnum = pgEnum("contact_role", ["primary", "secondary", "technical", "billing", "decision_maker"]);

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  customerId: varchar("customer_id").references(() => customers.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id), // Link to user account if exists
  salutation: text("salutation"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  title: text("title"), // Job title
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  role: contactRoleEnum("role").default("secondary"),
  communicationPreference: text("communication_preference").default("email"),
  emailConsent: boolean("email_consent").default(false),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket-Contact relationship (who is involved in ticket)
export const ticketContacts = pgTable("ticket_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  contactId: varchar("contact_id").references(() => contacts.id),
  role: text("role").default("requester"), // requester, cc, technical
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Activity Log (timeline)
export const customerActivityTypeEnum = pgEnum("customer_activity_type", [
  "ticket_created", "ticket_resolved", "ticket_closed",
  "comment_added", "email_sent", "email_received",
  "call_logged", "meeting_scheduled", "note_added",
  "contract_signed", "invoice_sent"
]);

export const customerActivities = pgTable("customer_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  customerId: varchar("customer_id").references(() => customers.id),
  contactId: varchar("contact_id").references(() => contacts.id),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  activityType: customerActivityTypeEnum("activity_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerLocationSchema = createInsertSchema(customerLocations).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketContactSchema = createInsertSchema(ticketContacts).omit({ id: true, createdAt: true });
export const insertCustomerActivitySchema = createInsertSchema(customerActivities).omit({ id: true, createdAt: true });

// CRM Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerLocation = typeof customerLocations.$inferSelect;
export type InsertCustomerLocation = z.infer<typeof insertCustomerLocationSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type TicketContact = typeof ticketContacts.$inferSelect;
export type InsertTicketContact = z.infer<typeof insertTicketContactSchema>;
export type CustomerActivity = typeof customerActivities.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;

// CRM Relation Types
export type OrganizationWithRelations = Organization & {
  customers?: Customer[];
  contacts?: Contact[];
  parentOrganization?: Organization | null;
};

export type CustomerWithRelations = Customer & {
  organization?: Organization | null;
  accountManager?: User | null;
  slaDefinition?: SlaDefinition | null;
  locations?: CustomerLocation[];
  contacts?: Contact[];
  tickets?: Ticket[];
  activities?: CustomerActivity[];
};

export type ContactWithRelations = Contact & {
  customer?: Customer | null;
  organization?: Organization | null;
  user?: User | null;
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
