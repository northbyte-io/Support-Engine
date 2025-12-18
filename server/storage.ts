import {
  users,
  tenants,
  tickets,
  ticketTypes,
  customFields,
  ticketAssignees,
  ticketWatchers,
  comments,
  attachments,
  areas,
  ticketAreas,
  slaDefinitions,
  slaEscalations,
  kbCategories,
  kbArticles,
  kbArticleVersions,
  ticketKbLinks,
  timeEntries,
  notifications,
  mentions,
  type User,
  type InsertUser,
  type Tenant,
  type InsertTenant,
  type Ticket,
  type InsertTicket,
  type TicketType,
  type InsertTicketType,
  type CustomField,
  type InsertCustomField,
  type TicketAssignee,
  type InsertTicketAssignee,
  type TicketWatcher,
  type InsertTicketWatcher,
  type Comment,
  type InsertComment,
  type Attachment,
  type InsertAttachment,
  type Area,
  type InsertArea,
  type TicketArea,
  type InsertTicketArea,
  type TicketWithRelations,
  type SlaDefinition,
  type InsertSlaDefinition,
  type SlaEscalation,
  type InsertSlaEscalation,
  type SlaDefinitionWithEscalations,
  type KbCategory,
  type InsertKbCategory,
  type KbArticle,
  type InsertKbArticle,
  type KbArticleVersion,
  type InsertKbArticleVersion,
  type TicketKbLink,
  type InsertTicketKbLink,
  type KbArticleWithRelations,
  type TimeEntry,
  type InsertTimeEntry,
  type TimeEntryWithRelations,
  type Notification,
  type InsertNotification,
  type NotificationWithRelations,
  type Mention,
  type InsertMention,
  type MentionWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike, or, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(tenantId?: string): Promise<User[]>;

  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Tickets
  getTicket(id: string): Promise<TicketWithRelations | undefined>;
  getTickets(params: { tenantId?: string; userId?: string; status?: string[]; priority?: string[]; limit?: number }): Promise<TicketWithRelations[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<InsertTicket>, tenantId?: string): Promise<Ticket | undefined>;
  deleteTicket(id: string, tenantId?: string): Promise<void>;
  getNextTicketNumber(tenantId: string): Promise<string>;

  // Ticket Types
  getTicketTypes(tenantId?: string): Promise<TicketType[]>;
  getTicketType(id: string): Promise<TicketType | undefined>;
  createTicketType(ticketType: InsertTicketType): Promise<TicketType>;
  updateTicketType(id: string, updates: Partial<InsertTicketType>): Promise<TicketType | undefined>;
  deleteTicketType(id: string): Promise<void>;

  // Custom Fields
  getCustomFields(ticketTypeId: string): Promise<CustomField[]>;
  createCustomField(field: InsertCustomField): Promise<CustomField>;

  // Ticket Assignees
  addTicketAssignee(assignee: InsertTicketAssignee): Promise<TicketAssignee>;
  removeTicketAssignee(ticketId: string, userId: string): Promise<void>;
  getTicketAssignees(ticketId: string): Promise<(TicketAssignee & { user?: User })[]>;

  // Ticket Watchers
  addTicketWatcher(watcher: InsertTicketWatcher): Promise<TicketWatcher>;
  removeTicketWatcher(ticketId: string, userId: string): Promise<void>;
  getTicketWatchers(ticketId: string): Promise<(TicketWatcher & { user?: User })[]>;

  // Comments
  getComments(ticketId: string): Promise<(Comment & { author?: User; attachments?: Attachment[] })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;

  // Attachments
  getAttachments(ticketId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;

  // Areas
  getAreas(tenantId?: string): Promise<Area[]>;
  getArea(id: string): Promise<Area | undefined>;
  createArea(area: InsertArea): Promise<Area>;
  updateArea(id: string, updates: Partial<InsertArea>): Promise<Area | undefined>;
  deleteArea(id: string): Promise<void>;

  // SLA Definitions
  getSlaDefinitions(tenantId?: string): Promise<SlaDefinitionWithEscalations[]>;
  getSlaDefinition(id: string): Promise<SlaDefinitionWithEscalations | undefined>;
  getDefaultSlaDefinition(tenantId: string): Promise<SlaDefinition | undefined>;
  createSlaDefinition(sla: InsertSlaDefinition): Promise<SlaDefinition>;
  updateSlaDefinition(id: string, updates: Partial<InsertSlaDefinition>): Promise<SlaDefinition | undefined>;
  deleteSlaDefinition(id: string): Promise<void>;

  // SLA Escalations
  getSlaEscalations(slaDefinitionId: string): Promise<SlaEscalation[]>;
  createSlaEscalation(escalation: InsertSlaEscalation): Promise<SlaEscalation>;
  deleteSlaEscalation(id: string): Promise<void>;

  // Dashboard Stats
  getDashboardStats(tenantId?: string): Promise<{
    openTickets: number;
    inProgressTickets: number;
    resolvedToday: number;
    avgResponseTime: string;
  }>;
  getAgentWorkload(tenantId?: string): Promise<{ user: User; ticketCount: number }[]>;

  // Knowledge Base Categories
  getKbCategories(tenantId: string): Promise<KbCategory[]>;
  getKbCategory(id: string): Promise<KbCategory | undefined>;
  createKbCategory(category: InsertKbCategory): Promise<KbCategory>;
  updateKbCategory(id: string, updates: Partial<InsertKbCategory>): Promise<KbCategory | undefined>;
  deleteKbCategory(id: string): Promise<void>;

  // Knowledge Base Articles
  getKbArticles(tenantId: string, params?: { categoryId?: string; status?: string; search?: string; isPublic?: boolean }): Promise<KbArticleWithRelations[]>;
  getKbArticle(id: string): Promise<KbArticleWithRelations | undefined>;
  getKbArticleBySlug(tenantId: string, slug: string): Promise<KbArticleWithRelations | undefined>;
  createKbArticle(article: InsertKbArticle): Promise<KbArticle>;
  updateKbArticle(id: string, updates: Partial<InsertKbArticle>): Promise<KbArticle | undefined>;
  deleteKbArticle(id: string): Promise<void>;
  incrementKbArticleViewCount(id: string): Promise<void>;

  // Knowledge Base Article Versions
  getKbArticleVersions(articleId: string): Promise<KbArticleVersion[]>;
  createKbArticleVersion(version: InsertKbArticleVersion): Promise<KbArticleVersion>;

  // Ticket KB Links
  getTicketKbLinks(ticketId: string): Promise<(TicketKbLink & { article?: KbArticle })[]>;
  createTicketKbLink(link: InsertTicketKbLink): Promise<TicketKbLink>;
  deleteTicketKbLink(id: string): Promise<void>;

  // Time Entries
  getTimeEntries(tenantId: string, params?: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<TimeEntryWithRelations[]>;
  getTimeEntry(id: string): Promise<TimeEntryWithRelations | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<void>;
  getTimeEntrySummary(tenantId: string, params?: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<{ totalMinutes: number; billableMinutes: number; totalAmount: number }>;

  // Notifications
  getNotifications(tenantId: string, userId: string, params?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationWithRelations[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(tenantId: string, userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadNotificationCount(tenantId: string, userId: string): Promise<number>;

  // Mentions
  createMention(mention: InsertMention): Promise<Mention>;
  getMentionsByComment(commentId: string): Promise<MentionWithRelations[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUsers(tenantId?: string): Promise<User[]> {
    if (tenantId) {
      return db.select().from(users).where(eq(users.tenantId, tenantId));
    }
    return db.select().from(users);
  }

  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  // Tickets
  async getTicket(id: string): Promise<TicketWithRelations | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return undefined;

    const [ticketType, createdByUser, assigneesList, watchersList, commentsList, attachmentsList, areasList] = await Promise.all([
      ticket.ticketTypeId ? db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId)).then(r => r[0]) : null,
      ticket.createdById ? db.select().from(users).where(eq(users.id, ticket.createdById)).then(r => r[0]) : null,
      this.getTicketAssignees(id),
      this.getTicketWatchers(id),
      this.getComments(id),
      this.getAttachments(id),
      db.select().from(ticketAreas).leftJoin(areas, eq(ticketAreas.areaId, areas.id)).where(eq(ticketAreas.ticketId, id)),
    ]);

    // Remove password from user object
    const createdBy = createdByUser ? { ...createdByUser, password: undefined } : null;

    return {
      ...ticket,
      ticketType,
      createdBy,
      assignees: assigneesList,
      watchers: watchersList,
      comments: commentsList,
      attachments: attachmentsList,
      areas: areasList.map(r => ({ ...r.ticket_areas, area: r.areas || undefined })),
    };
  }

  async getTickets(params: { tenantId?: string; userId?: string; status?: string[]; priority?: string[]; limit?: number }): Promise<TicketWithRelations[]> {
    let query = db.select().from(tickets).orderBy(desc(tickets.createdAt));
    
    const conditions = [];
    if (params.tenantId) {
      conditions.push(eq(tickets.tenantId, params.tenantId));
    }
    if (params.userId) {
      conditions.push(eq(tickets.createdById, params.userId));
    }

    const ticketList = conditions.length > 0
      ? await db.select().from(tickets).where(and(...conditions)).orderBy(desc(tickets.createdAt)).limit(params.limit || 100)
      : await db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(params.limit || 100);

    const ticketsWithRelations = await Promise.all(
      ticketList.map(async (ticket) => {
        const [ticketType, createdByUser, assigneesList] = await Promise.all([
          ticket.ticketTypeId ? db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId)).then(r => r[0]) : null,
          ticket.createdById ? db.select().from(users).where(eq(users.id, ticket.createdById)).then(r => r[0]) : null,
          this.getTicketAssignees(ticket.id),
        ]);

        // Remove password from user object
        const createdBy = createdByUser ? { ...createdByUser, password: undefined } : null;

        return {
          ...ticket,
          ticketType,
          createdBy,
          assignees: assigneesList,
        };
      })
    );

    return ticketsWithRelations;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const ticketNumber = await this.getNextTicketNumber(insertTicket.tenantId || "default");
    const [ticket] = await db.insert(tickets).values({ ...insertTicket, ticketNumber }).returning();
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>, tenantId?: string): Promise<Ticket | undefined> {
    const updateData: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    
    if (updates.status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    if (updates.status === "closed") {
      updateData.closedAt = new Date();
    }

    // Include tenantId in the where clause for safety
    const whereClause = tenantId 
      ? and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))
      : eq(tickets.id, id);

    const [ticket] = await db.update(tickets).set(updateData).where(whereClause).returning();
    return ticket || undefined;
  }

  async deleteTicket(id: string, tenantId?: string): Promise<void> {
    // Include tenantId in the where clause for safety
    const whereClause = tenantId 
      ? and(eq(tickets.id, id), eq(tickets.tenantId, tenantId))
      : eq(tickets.id, id);
    
    await db.delete(tickets).where(whereClause);
  }

  async getNextTicketNumber(tenantId: string): Promise<string> {
    const result = await db.select({ count: count() }).from(tickets).where(eq(tickets.tenantId, tenantId));
    const num = (result[0]?.count || 0) + 1;
    return `TKT-${String(num).padStart(5, "0")}`;
  }

  // Ticket Types
  async getTicketTypes(tenantId?: string): Promise<TicketType[]> {
    if (tenantId) {
      return db.select().from(ticketTypes).where(eq(ticketTypes.tenantId, tenantId));
    }
    return db.select().from(ticketTypes);
  }

  async getTicketType(id: string): Promise<TicketType | undefined> {
    const [ticketType] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id));
    return ticketType || undefined;
  }

  async createTicketType(insertTicketType: InsertTicketType): Promise<TicketType> {
    const [ticketType] = await db.insert(ticketTypes).values(insertTicketType).returning();
    return ticketType;
  }

  async updateTicketType(id: string, updates: Partial<InsertTicketType>): Promise<TicketType | undefined> {
    const [ticketType] = await db.update(ticketTypes).set(updates).where(eq(ticketTypes.id, id)).returning();
    return ticketType || undefined;
  }

  async deleteTicketType(id: string): Promise<void> {
    await db.delete(ticketTypes).where(eq(ticketTypes.id, id));
  }

  // Custom Fields
  async getCustomFields(ticketTypeId: string): Promise<CustomField[]> {
    return db.select().from(customFields).where(eq(customFields.ticketTypeId, ticketTypeId)).orderBy(asc(customFields.order));
  }

  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    const [customField] = await db.insert(customFields).values(field).returning();
    return customField;
  }

  // Ticket Assignees
  async addTicketAssignee(assignee: InsertTicketAssignee): Promise<TicketAssignee> {
    const [result] = await db.insert(ticketAssignees).values(assignee).returning();
    return result;
  }

  async removeTicketAssignee(ticketId: string, userId: string): Promise<void> {
    await db.delete(ticketAssignees).where(
      and(eq(ticketAssignees.ticketId, ticketId), eq(ticketAssignees.userId, userId))
    );
  }

  async getTicketAssignees(ticketId: string): Promise<(TicketAssignee & { user?: Omit<User, 'password'> })[]> {
    const result = await db.select().from(ticketAssignees)
      .leftJoin(users, eq(ticketAssignees.userId, users.id))
      .where(eq(ticketAssignees.ticketId, ticketId));
    
    return result.map(r => {
      const user = r.users ? { ...r.users, password: undefined } : undefined;
      return {
        ...r.ticket_assignees,
        user,
      };
    });
  }

  // Ticket Watchers
  async addTicketWatcher(watcher: InsertTicketWatcher): Promise<TicketWatcher> {
    const [result] = await db.insert(ticketWatchers).values(watcher).returning();
    return result;
  }

  async removeTicketWatcher(ticketId: string, userId: string): Promise<void> {
    await db.delete(ticketWatchers).where(
      and(eq(ticketWatchers.ticketId, ticketId), eq(ticketWatchers.userId, userId))
    );
  }

  async getTicketWatchers(ticketId: string): Promise<(TicketWatcher & { user?: Omit<User, 'password'> })[]> {
    const result = await db.select().from(ticketWatchers)
      .leftJoin(users, eq(ticketWatchers.userId, users.id))
      .where(eq(ticketWatchers.ticketId, ticketId));
    
    return result.map(r => {
      const user = r.users ? { ...r.users, password: undefined } : undefined;
      return {
        ...r.ticket_watchers,
        user,
      };
    });
  }

  // Comments
  async getComments(ticketId: string): Promise<(Comment & { author?: Omit<User, 'password'>; attachments?: Attachment[] })[]> {
    const result = await db.select().from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.ticketId, ticketId))
      .orderBy(asc(comments.createdAt));
    
    return result.map(r => {
      const author = r.users ? { ...r.users, password: undefined } : undefined;
      return {
        ...r.comments,
        author,
        attachments: [],
      };
    });
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [result] = await db.insert(comments).values(comment).returning();
    return result;
  }

  async updateComment(id: string, updates: Partial<InsertComment>): Promise<Comment | undefined> {
    const [result] = await db.update(comments).set({ ...updates, updatedAt: new Date() }).where(eq(comments.id, id)).returning();
    return result || undefined;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Attachments
  async getAttachments(ticketId: string): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.ticketId, ticketId));
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [result] = await db.insert(attachments).values(attachment).returning();
    return result;
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Areas
  async getAreas(tenantId?: string): Promise<Area[]> {
    if (tenantId) {
      return db.select().from(areas).where(eq(areas.tenantId, tenantId));
    }
    return db.select().from(areas);
  }

  async getArea(id: string): Promise<Area | undefined> {
    const [area] = await db.select().from(areas).where(eq(areas.id, id));
    return area || undefined;
  }

  async createArea(insertArea: InsertArea): Promise<Area> {
    const [area] = await db.insert(areas).values(insertArea).returning();
    return area;
  }

  async updateArea(id: string, updates: Partial<InsertArea>): Promise<Area | undefined> {
    const [area] = await db.update(areas).set(updates).where(eq(areas.id, id)).returning();
    return area || undefined;
  }

  async deleteArea(id: string): Promise<void> {
    await db.delete(areas).where(eq(areas.id, id));
  }

  // SLA Definitions
  async getSlaDefinitions(tenantId?: string): Promise<SlaDefinitionWithEscalations[]> {
    const defs = tenantId 
      ? await db.select().from(slaDefinitions).where(eq(slaDefinitions.tenantId, tenantId))
      : await db.select().from(slaDefinitions);
    
    return Promise.all(defs.map(async (def) => {
      const escalations = await db.select().from(slaEscalations).where(eq(slaEscalations.slaDefinitionId, def.id));
      return { ...def, escalations };
    }));
  }

  async getSlaDefinition(id: string): Promise<SlaDefinitionWithEscalations | undefined> {
    const [def] = await db.select().from(slaDefinitions).where(eq(slaDefinitions.id, id));
    if (!def) return undefined;
    
    const escalations = await db.select().from(slaEscalations).where(eq(slaEscalations.slaDefinitionId, id));
    return { ...def, escalations };
  }

  async getDefaultSlaDefinition(tenantId: string): Promise<SlaDefinition | undefined> {
    const [def] = await db.select().from(slaDefinitions)
      .where(and(eq(slaDefinitions.tenantId, tenantId), eq(slaDefinitions.isDefault, true)));
    return def || undefined;
  }

  async createSlaDefinition(sla: InsertSlaDefinition): Promise<SlaDefinition> {
    const [result] = await db.insert(slaDefinitions).values(sla).returning();
    return result;
  }

  async updateSlaDefinition(id: string, updates: Partial<InsertSlaDefinition>): Promise<SlaDefinition | undefined> {
    const [result] = await db.update(slaDefinitions).set(updates).where(eq(slaDefinitions.id, id)).returning();
    return result || undefined;
  }

  async deleteSlaDefinition(id: string): Promise<void> {
    await db.delete(slaEscalations).where(eq(slaEscalations.slaDefinitionId, id));
    await db.delete(slaDefinitions).where(eq(slaDefinitions.id, id));
  }

  // SLA Escalations
  async getSlaEscalations(slaDefinitionId: string): Promise<SlaEscalation[]> {
    return db.select().from(slaEscalations).where(eq(slaEscalations.slaDefinitionId, slaDefinitionId));
  }

  async createSlaEscalation(escalation: InsertSlaEscalation): Promise<SlaEscalation> {
    const [result] = await db.insert(slaEscalations).values(escalation).returning();
    return result;
  }

  async deleteSlaEscalation(id: string): Promise<void> {
    await db.delete(slaEscalations).where(eq(slaEscalations.id, id));
  }

  // Dashboard Stats
  async getDashboardStats(tenantId?: string): Promise<{
    openTickets: number;
    inProgressTickets: number;
    resolvedToday: number;
    avgResponseTime: string;
  }> {
    const conditions = tenantId ? [eq(tickets.tenantId, tenantId)] : [];
    
    const [openCount] = await db.select({ count: count() }).from(tickets)
      .where(and(...conditions, eq(tickets.status, "open")));
    
    const [inProgressCount] = await db.select({ count: count() }).from(tickets)
      .where(and(...conditions, eq(tickets.status, "in_progress")));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [resolvedTodayCount] = await db.select({ count: count() }).from(tickets)
      .where(and(...conditions, eq(tickets.status, "resolved")));

    return {
      openTickets: openCount?.count || 0,
      inProgressTickets: inProgressCount?.count || 0,
      resolvedToday: resolvedTodayCount?.count || 0,
      avgResponseTime: "2h 15m",
    };
  }

  async getAgentWorkload(tenantId?: string): Promise<{ user: User; ticketCount: number }[]> {
    const agents = await db.select().from(users)
      .where(or(eq(users.role, "agent"), eq(users.role, "admin")));
    
    const workload = await Promise.all(
      agents.map(async (agent) => {
        const [result] = await db.select({ count: count() }).from(ticketAssignees)
          .where(eq(ticketAssignees.userId, agent.id));
        return {
          user: agent,
          ticketCount: result?.count || 0,
        };
      })
    );

    return workload.sort((a, b) => b.ticketCount - a.ticketCount);
  }

  // Knowledge Base Categories
  async getKbCategories(tenantId: string): Promise<KbCategory[]> {
    return db.select().from(kbCategories)
      .where(eq(kbCategories.tenantId, tenantId))
      .orderBy(asc(kbCategories.order), asc(kbCategories.name));
  }

  async getKbCategory(id: string): Promise<KbCategory | undefined> {
    const [category] = await db.select().from(kbCategories).where(eq(kbCategories.id, id));
    return category || undefined;
  }

  async createKbCategory(category: InsertKbCategory): Promise<KbCategory> {
    const [result] = await db.insert(kbCategories).values(category).returning();
    return result;
  }

  async updateKbCategory(id: string, updates: Partial<InsertKbCategory>): Promise<KbCategory | undefined> {
    const [result] = await db.update(kbCategories).set(updates).where(eq(kbCategories.id, id)).returning();
    return result || undefined;
  }

  async deleteKbCategory(id: string): Promise<void> {
    await db.delete(kbCategories).where(eq(kbCategories.id, id));
  }

  // Knowledge Base Articles
  async getKbArticles(tenantId: string, params?: { categoryId?: string; status?: string; search?: string; isPublic?: boolean }): Promise<KbArticleWithRelations[]> {
    const conditions = [eq(kbArticles.tenantId, tenantId)];
    
    if (params?.categoryId) {
      conditions.push(eq(kbArticles.categoryId, params.categoryId));
    }
    if (params?.status) {
      conditions.push(eq(kbArticles.status, params.status));
    }
    if (params?.isPublic !== undefined) {
      conditions.push(eq(kbArticles.isPublic, params.isPublic));
    }
    if (params?.search) {
      conditions.push(
        or(
          ilike(kbArticles.title, `%${params.search}%`),
          ilike(kbArticles.content, `%${params.search}%`)
        )!
      );
    }

    const articles = await db.select().from(kbArticles)
      .where(and(...conditions))
      .orderBy(desc(kbArticles.updatedAt));

    return Promise.all(articles.map(async (article) => {
      const [category, author] = await Promise.all([
        article.categoryId ? db.select().from(kbCategories).where(eq(kbCategories.id, article.categoryId)).then(r => r[0]) : null,
        article.authorId ? db.select().from(users).where(eq(users.id, article.authorId)).then(r => r[0]) : null,
      ]);
      const authorWithoutPassword = author ? { ...author, password: undefined } : null;
      return { ...article, category: category || null, author: authorWithoutPassword };
    }));
  }

  async getKbArticle(id: string): Promise<KbArticleWithRelations | undefined> {
    const [article] = await db.select().from(kbArticles).where(eq(kbArticles.id, id));
    if (!article) return undefined;

    const [category, author, versions] = await Promise.all([
      article.categoryId ? db.select().from(kbCategories).where(eq(kbCategories.id, article.categoryId)).then(r => r[0]) : null,
      article.authorId ? db.select().from(users).where(eq(users.id, article.authorId)).then(r => r[0]) : null,
      db.select().from(kbArticleVersions).where(eq(kbArticleVersions.articleId, id)).orderBy(desc(kbArticleVersions.version)),
    ]);
    const authorWithoutPassword = author ? { ...author, password: undefined } : null;
    return { ...article, category: category || null, author: authorWithoutPassword, versions };
  }

  async getKbArticleBySlug(tenantId: string, slug: string): Promise<KbArticleWithRelations | undefined> {
    const [article] = await db.select().from(kbArticles)
      .where(and(eq(kbArticles.tenantId, tenantId), eq(kbArticles.slug, slug)));
    if (!article) return undefined;

    return this.getKbArticle(article.id);
  }

  async createKbArticle(article: InsertKbArticle): Promise<KbArticle> {
    const [result] = await db.insert(kbArticles).values(article).returning();
    return result;
  }

  async updateKbArticle(id: string, updates: Partial<InsertKbArticle>): Promise<KbArticle | undefined> {
    const updateData: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if (updates.status === "published") {
      const current = await this.getKbArticle(id);
      if (current && current.status !== "published") {
        updateData.publishedAt = new Date();
      }
    }
    const [result] = await db.update(kbArticles).set(updateData).where(eq(kbArticles.id, id)).returning();
    return result || undefined;
  }

  async deleteKbArticle(id: string): Promise<void> {
    await db.delete(kbArticleVersions).where(eq(kbArticleVersions.articleId, id));
    await db.delete(ticketKbLinks).where(eq(ticketKbLinks.articleId, id));
    await db.delete(kbArticles).where(eq(kbArticles.id, id));
  }

  async incrementKbArticleViewCount(id: string): Promise<void> {
    await db.update(kbArticles).set({
      viewCount: sql`${kbArticles.viewCount} + 1`
    }).where(eq(kbArticles.id, id));
  }

  // Knowledge Base Article Versions
  async getKbArticleVersions(articleId: string): Promise<KbArticleVersion[]> {
    return db.select().from(kbArticleVersions)
      .where(eq(kbArticleVersions.articleId, articleId))
      .orderBy(desc(kbArticleVersions.version));
  }

  async createKbArticleVersion(version: InsertKbArticleVersion): Promise<KbArticleVersion> {
    const [result] = await db.insert(kbArticleVersions).values(version).returning();
    return result;
  }

  // Ticket KB Links
  async getTicketKbLinks(ticketId: string): Promise<(TicketKbLink & { article?: KbArticle })[]> {
    const links = await db.select().from(ticketKbLinks).where(eq(ticketKbLinks.ticketId, ticketId));
    return Promise.all(links.map(async (link) => {
      const [article] = link.articleId 
        ? await db.select().from(kbArticles).where(eq(kbArticles.id, link.articleId))
        : [null];
      return { ...link, article: article || undefined };
    }));
  }

  async createTicketKbLink(link: InsertTicketKbLink): Promise<TicketKbLink> {
    const [result] = await db.insert(ticketKbLinks).values(link).returning();
    return result;
  }

  async deleteTicketKbLink(id: string): Promise<void> {
    await db.delete(ticketKbLinks).where(eq(ticketKbLinks.id, id));
  }

  // Time Entries
  async getTimeEntries(tenantId: string, params?: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<TimeEntryWithRelations[]> {
    const conditions = [eq(timeEntries.tenantId, tenantId)];
    
    if (params?.ticketId) {
      conditions.push(eq(timeEntries.ticketId, params.ticketId));
    }
    if (params?.userId) {
      conditions.push(eq(timeEntries.userId, params.userId));
    }
    if (params?.startDate) {
      conditions.push(sql`${timeEntries.date} >= ${params.startDate}`);
    }
    if (params?.endDate) {
      conditions.push(sql`${timeEntries.date} <= ${params.endDate}`);
    }
    
    const entries = await db.select().from(timeEntries)
      .where(and(...conditions))
      .orderBy(desc(timeEntries.date));
    
    return Promise.all(entries.map(async (entry) => {
      const [user, ticket] = await Promise.all([
        entry.userId ? db.select().from(users).where(eq(users.id, entry.userId)).then(r => r[0]) : null,
        entry.ticketId ? db.select().from(tickets).where(eq(tickets.id, entry.ticketId)).then(r => r[0]) : null,
      ]);
      const userWithoutPassword = user ? { ...user, password: undefined } : null;
      return { ...entry, user: userWithoutPassword, ticket: ticket || null };
    }));
  }

  async getTimeEntry(id: string): Promise<TimeEntryWithRelations | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    if (!entry) return undefined;

    const [user, ticket] = await Promise.all([
      entry.userId ? db.select().from(users).where(eq(users.id, entry.userId)).then(r => r[0]) : null,
      entry.ticketId ? db.select().from(tickets).where(eq(tickets.id, entry.ticketId)).then(r => r[0]) : null,
    ]);
    const userWithoutPassword = user ? { ...user, password: undefined } : null;
    return { ...entry, user: userWithoutPassword, ticket: ticket || null };
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [result] = await db.insert(timeEntries).values(entry).returning();
    return result;
  }

  async updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [result] = await db.update(timeEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return result || undefined;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async getTimeEntrySummary(tenantId: string, params?: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date }): Promise<{ totalMinutes: number; billableMinutes: number; totalAmount: number }> {
    const conditions = [eq(timeEntries.tenantId, tenantId)];
    
    if (params?.ticketId) {
      conditions.push(eq(timeEntries.ticketId, params.ticketId));
    }
    if (params?.userId) {
      conditions.push(eq(timeEntries.userId, params.userId));
    }
    if (params?.startDate) {
      conditions.push(sql`${timeEntries.date} >= ${params.startDate}`);
    }
    if (params?.endDate) {
      conditions.push(sql`${timeEntries.date} <= ${params.endDate}`);
    }

    const entries = await db.select().from(timeEntries).where(and(...conditions));
    
    let totalMinutes = 0;
    let billableMinutes = 0;
    let totalAmount = 0;

    for (const entry of entries) {
      totalMinutes += entry.minutes;
      if (entry.isBillable) {
        billableMinutes += entry.minutes;
        if (entry.hourlyRate) {
          totalAmount += Math.round((entry.minutes / 60) * entry.hourlyRate);
        }
      }
    }

    return { totalMinutes, billableMinutes, totalAmount };
  }

  // Notifications
  async getNotifications(tenantId: string, userId: string, params?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationWithRelations[]> {
    const conditions = [
      eq(notifications.tenantId, tenantId),
      eq(notifications.userId, userId),
    ];

    if (params?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const results = await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(params?.limit || 50);

    // Fetch related data
    const notificationsWithRelations: NotificationWithRelations[] = await Promise.all(
      results.map(async (notification) => {
        const [user, ticket, actor, comment] = await Promise.all([
          notification.userId ? db.select().from(users).where(eq(users.id, notification.userId)).then(r => r[0]) : null,
          notification.ticketId ? db.select().from(tickets).where(eq(tickets.id, notification.ticketId)).then(r => r[0]) : null,
          notification.actorId ? db.select().from(users).where(eq(users.id, notification.actorId)).then(r => r[0]) : null,
          notification.commentId ? db.select().from(comments).where(eq(comments.id, notification.commentId)).then(r => r[0]) : null,
        ]);

        return {
          ...notification,
          user: user ? { ...user, password: undefined } : null,
          ticket: ticket || null,
          actor: actor ? { ...actor, password: undefined } : null,
          comment: comment || null,
        } as NotificationWithRelations;
      })
    );

    return notificationsWithRelations;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [result] = await db.select().from(notifications).where(eq(notifications.id, id));
    return result || undefined;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [result] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return result || undefined;
  }

  async markAllNotificationsAsRead(tenantId: string, userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(tenantId: string, userId: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  // Mentions
  async createMention(mention: InsertMention): Promise<Mention> {
    const [result] = await db.insert(mentions).values(mention).returning();
    return result;
  }

  async getMentionsByComment(commentId: string): Promise<MentionWithRelations[]> {
    const results = await db.select()
      .from(mentions)
      .where(eq(mentions.commentId, commentId));

    const mentionsWithRelations: MentionWithRelations[] = await Promise.all(
      results.map(async (mention) => {
        const [comment, mentionedUser] = await Promise.all([
          mention.commentId ? db.select().from(comments).where(eq(comments.id, mention.commentId)).then(r => r[0]) : null,
          mention.mentionedUserId ? db.select().from(users).where(eq(users.id, mention.mentionedUserId)).then(r => r[0]) : null,
        ]);

        return {
          ...mention,
          comment: comment || null,
          mentionedUser: mentionedUser ? { ...mentionedUser, password: undefined } : null,
        } as MentionWithRelations;
      })
    );

    return mentionsWithRelations;
  }
}

export const storage = new DatabaseStorage();
