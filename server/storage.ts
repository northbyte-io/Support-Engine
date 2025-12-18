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

  // Dashboard Stats
  getDashboardStats(tenantId?: string): Promise<{
    openTickets: number;
    inProgressTickets: number;
    resolvedToday: number;
    avgResponseTime: string;
  }>;
  getAgentWorkload(tenantId?: string): Promise<{ user: User; ticketCount: number }[]>;
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
}

export const storage = new DatabaseStorage();
