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
  surveys,
  surveyQuestions,
  surveyInvitations,
  surveyResponses,
  assetCategories,
  assets,
  assetLicenses,
  assetContracts,
  ticketAssets,
  assetHistory,
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
  type Survey,
  type InsertSurvey,
  type SurveyQuestion,
  type InsertSurveyQuestion,
  type SurveyInvitation,
  type InsertSurveyInvitation,
  type SurveyResponse,
  type InsertSurveyResponse,
  type SurveyWithRelations,
  type SurveyInvitationWithRelations,
  type SurveyResultSummary,
  type AssetCategory,
  type InsertAssetCategory,
  type Asset,
  type InsertAsset,
  type AssetLicense,
  type InsertAssetLicense,
  type AssetContract,
  type InsertAssetContract,
  type TicketAsset,
  type InsertTicketAsset,
  type AssetHistory,
  type InsertAssetHistory,
  type AssetWithRelations,
  projects,
  projectMembers,
  boardColumns,
  ticketProjects,
  type Project,
  type InsertProject,
  type ProjectMember,
  type InsertProjectMember,
  type BoardColumn,
  type InsertBoardColumn,
  type TicketProject,
  type InsertTicketProject,
  type ProjectWithRelations,
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

  // Surveys
  getSurveys(tenantId: string): Promise<SurveyWithRelations[]>;
  getSurvey(id: string): Promise<SurveyWithRelations | undefined>;
  getActiveSurvey(tenantId: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, updates: Partial<InsertSurvey>): Promise<Survey | undefined>;
  deleteSurvey(id: string): Promise<void>;

  // Survey Questions
  getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]>;
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  updateSurveyQuestion(id: string, updates: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined>;
  deleteSurveyQuestion(id: string): Promise<void>;

  // Survey Invitations
  getSurveyInvitations(tenantId: string, surveyId?: string): Promise<SurveyInvitationWithRelations[]>;
  getSurveyInvitation(id: string): Promise<SurveyInvitationWithRelations | undefined>;
  getSurveyInvitationByToken(token: string): Promise<SurveyInvitationWithRelations | undefined>;
  createSurveyInvitation(invitation: InsertSurveyInvitation): Promise<SurveyInvitation>;
  completeSurveyInvitation(id: string): Promise<SurveyInvitation | undefined>;

  // Survey Responses
  getSurveyResponses(invitationId: string): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResultSummary(tenantId: string, surveyId: string): Promise<SurveyResultSummary | undefined>;

  // Asset Categories
  getAssetCategories(tenantId: string): Promise<AssetCategory[]>;
  getAssetCategory(id: string, tenantId: string): Promise<AssetCategory | undefined>;
  createAssetCategory(category: InsertAssetCategory, tenantId: string): Promise<AssetCategory>;
  updateAssetCategory(id: string, updates: Partial<InsertAssetCategory>, tenantId: string): Promise<AssetCategory | undefined>;
  deleteAssetCategory(id: string, tenantId: string): Promise<void>;

  // Assets
  getAssets(tenantId: string, params?: { assetType?: string; status?: string; categoryId?: string; assignedToId?: string; search?: string }): Promise<AssetWithRelations[]>;
  getAsset(id: string, tenantId: string): Promise<AssetWithRelations | undefined>;
  createAsset(asset: InsertAsset, tenantId: string): Promise<Asset>;
  updateAsset(id: string, updates: Partial<InsertAsset>, tenantId: string): Promise<Asset | undefined>;
  deleteAsset(id: string, tenantId: string): Promise<void>;
  getNextAssetNumber(tenantId: string): Promise<string>;

  // Asset Licenses
  getAssetLicense(assetId: string, tenantId: string): Promise<AssetLicense | undefined>;
  createAssetLicense(license: InsertAssetLicense, tenantId: string): Promise<AssetLicense>;
  updateAssetLicense(id: string, updates: Partial<InsertAssetLicense>, tenantId: string): Promise<AssetLicense | undefined>;
  deleteAssetLicense(id: string, tenantId: string): Promise<void>;

  // Asset Contracts
  getAssetContract(assetId: string, tenantId: string): Promise<AssetContract | undefined>;
  createAssetContract(contract: InsertAssetContract, tenantId: string): Promise<AssetContract>;
  updateAssetContract(id: string, updates: Partial<InsertAssetContract>, tenantId: string): Promise<AssetContract | undefined>;
  deleteAssetContract(id: string, tenantId: string): Promise<void>;

  // Ticket Assets
  getTicketAssets(ticketId: string, tenantId: string): Promise<(TicketAsset & { asset?: Asset })[]>;
  getAssetTickets(assetId: string, tenantId: string): Promise<(TicketAsset & { ticket?: Ticket })[]>;
  createTicketAsset(link: InsertTicketAsset, tenantId: string): Promise<TicketAsset>;
  deleteTicketAsset(id: string, tenantId: string): Promise<void>;

  // Asset History
  getAssetHistory(assetId: string, tenantId: string): Promise<(AssetHistory & { user?: User })[]>;
  createAssetHistory(entry: InsertAssetHistory, tenantId: string): Promise<AssetHistory>;

  // Projects
  getProjects(tenantId: string): Promise<ProjectWithRelations[]>;
  getProject(id: string, tenantId: string): Promise<ProjectWithRelations | undefined>;
  createProject(project: InsertProject, tenantId: string): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>, tenantId: string): Promise<Project | undefined>;
  deleteProject(id: string, tenantId: string): Promise<void>;

  // Project Members
  getProjectMembers(projectId: string, tenantId: string): Promise<(ProjectMember & { user?: User })[]>;
  addProjectMember(member: InsertProjectMember, tenantId: string): Promise<ProjectMember>;
  removeProjectMember(projectId: string, userId: string, tenantId: string): Promise<void>;

  // Board Columns
  getBoardColumns(projectId: string, tenantId: string): Promise<BoardColumn[]>;
  createBoardColumn(column: InsertBoardColumn, tenantId: string): Promise<BoardColumn>;
  updateBoardColumn(id: string, updates: Partial<InsertBoardColumn>, tenantId: string): Promise<BoardColumn | undefined>;
  deleteBoardColumn(id: string, tenantId: string): Promise<void>;
  reorderBoardColumns(projectId: string, columnIds: string[], tenantId: string): Promise<void>;

  // Ticket Projects
  getTicketProjects(ticketId: string, tenantId: string): Promise<(TicketProject & { project?: Project })[]>;
  addTicketToProject(ticketProject: InsertTicketProject, tenantId: string): Promise<TicketProject>;
  removeTicketFromProject(ticketId: string, projectId: string, tenantId: string): Promise<void>;
  getProjectTickets(projectId: string, tenantId: string): Promise<{ column: BoardColumn; tickets: TicketProject[] }[]>;
  updateTicketBoardOrder(ticketId: string, projectId: string, boardOrder: number, tenantId: string): Promise<void>;
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

  // Surveys
  async getSurveys(tenantId: string): Promise<SurveyWithRelations[]> {
    const surveyResults = await db.select()
      .from(surveys)
      .where(eq(surveys.tenantId, tenantId))
      .orderBy(desc(surveys.createdAt));

    const surveysWithRelations: SurveyWithRelations[] = await Promise.all(
      surveyResults.map(async (survey) => {
        const questions = await db.select()
          .from(surveyQuestions)
          .where(eq(surveyQuestions.surveyId, survey.id))
          .orderBy(asc(surveyQuestions.order));

        return {
          ...survey,
          questions,
        };
      })
    );

    return surveysWithRelations;
  }

  async getSurvey(id: string): Promise<SurveyWithRelations | undefined> {
    const [survey] = await db.select()
      .from(surveys)
      .where(eq(surveys.id, id));

    if (!survey) return undefined;

    const questions = await db.select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id))
      .orderBy(asc(surveyQuestions.order));

    return {
      ...survey,
      questions,
    };
  }

  async getActiveSurvey(tenantId: string): Promise<Survey | undefined> {
    const [survey] = await db.select()
      .from(surveys)
      .where(and(
        eq(surveys.tenantId, tenantId),
        eq(surveys.isActive, true),
        eq(surveys.triggerOnClose, true)
      ))
      .limit(1);

    return survey || undefined;
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [result] = await db.insert(surveys).values(survey).returning();
    return result;
  }

  async updateSurvey(id: string, updates: Partial<InsertSurvey>): Promise<Survey | undefined> {
    const [result] = await db.update(surveys)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return result || undefined;
  }

  async deleteSurvey(id: string): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  // Survey Questions
  async getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]> {
    return db.select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(asc(surveyQuestions.order));
  }

  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const [result] = await db.insert(surveyQuestions).values(question).returning();
    return result;
  }

  async updateSurveyQuestion(id: string, updates: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const [result] = await db.update(surveyQuestions)
      .set(updates)
      .where(eq(surveyQuestions.id, id))
      .returning();
    return result || undefined;
  }

  async deleteSurveyQuestion(id: string): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
  }

  // Survey Invitations
  async getSurveyInvitations(tenantId: string, surveyId?: string): Promise<SurveyInvitationWithRelations[]> {
    let query = db.select()
      .from(surveyInvitations)
      .where(eq(surveyInvitations.tenantId, tenantId))
      .orderBy(desc(surveyInvitations.sentAt));

    if (surveyId) {
      query = db.select()
        .from(surveyInvitations)
        .where(and(
          eq(surveyInvitations.tenantId, tenantId),
          eq(surveyInvitations.surveyId, surveyId)
        ))
        .orderBy(desc(surveyInvitations.sentAt));
    }

    const results = await query;

    const invitationsWithRelations: SurveyInvitationWithRelations[] = await Promise.all(
      results.map(async (invitation) => {
        const [survey, ticket, user, responses] = await Promise.all([
          invitation.surveyId ? db.select().from(surveys).where(eq(surveys.id, invitation.surveyId)).then(r => r[0]) : null,
          invitation.ticketId ? db.select().from(tickets).where(eq(tickets.id, invitation.ticketId)).then(r => r[0]) : null,
          invitation.userId ? db.select().from(users).where(eq(users.id, invitation.userId)).then(r => r[0]) : null,
          db.select().from(surveyResponses).where(eq(surveyResponses.invitationId, invitation.id)),
        ]);

        return {
          ...invitation,
          survey: survey || null,
          ticket: ticket || null,
          user: user ? { ...user, password: undefined } : null,
          responses,
        } as SurveyInvitationWithRelations;
      })
    );

    return invitationsWithRelations;
  }

  async getSurveyInvitation(id: string): Promise<SurveyInvitationWithRelations | undefined> {
    const [invitation] = await db.select()
      .from(surveyInvitations)
      .where(eq(surveyInvitations.id, id));

    if (!invitation) return undefined;

    const [survey, ticket, user, responses] = await Promise.all([
      invitation.surveyId ? db.select().from(surveys).where(eq(surveys.id, invitation.surveyId)).then(r => r[0]) : null,
      invitation.ticketId ? db.select().from(tickets).where(eq(tickets.id, invitation.ticketId)).then(r => r[0]) : null,
      invitation.userId ? db.select().from(users).where(eq(users.id, invitation.userId)).then(r => r[0]) : null,
      db.select().from(surveyResponses).where(eq(surveyResponses.invitationId, invitation.id)),
    ]);

    return {
      ...invitation,
      survey: survey || null,
      ticket: ticket || null,
      user: user ? { ...user, password: undefined } : null,
      responses,
    } as SurveyInvitationWithRelations;
  }

  async getSurveyInvitationByToken(token: string): Promise<SurveyInvitationWithRelations | undefined> {
    const [invitation] = await db.select()
      .from(surveyInvitations)
      .where(eq(surveyInvitations.token, token));

    if (!invitation) return undefined;

    const [survey, ticket, user, responses] = await Promise.all([
      invitation.surveyId ? db.select().from(surveys).where(eq(surveys.id, invitation.surveyId)).then(r => r[0]) : null,
      invitation.ticketId ? db.select().from(tickets).where(eq(tickets.id, invitation.ticketId)).then(r => r[0]) : null,
      invitation.userId ? db.select().from(users).where(eq(users.id, invitation.userId)).then(r => r[0]) : null,
      db.select().from(surveyResponses).where(eq(surveyResponses.invitationId, invitation.id)),
    ]);

    // Also get questions for the survey
    const questions = survey ? await db.select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, survey.id))
      .orderBy(asc(surveyQuestions.order)) : [];

    return {
      ...invitation,
      survey: survey ? { ...survey, questions } : null,
      ticket: ticket || null,
      user: user ? { ...user, password: undefined } : null,
      responses,
    } as SurveyInvitationWithRelations;
  }

  async createSurveyInvitation(invitation: InsertSurveyInvitation): Promise<SurveyInvitation> {
    const [result] = await db.insert(surveyInvitations).values(invitation).returning();
    return result;
  }

  async completeSurveyInvitation(id: string): Promise<SurveyInvitation | undefined> {
    const [result] = await db.update(surveyInvitations)
      .set({ completedAt: new Date() })
      .where(eq(surveyInvitations.id, id))
      .returning();
    return result || undefined;
  }

  // Survey Responses
  async getSurveyResponses(invitationId: string): Promise<SurveyResponse[]> {
    return db.select()
      .from(surveyResponses)
      .where(eq(surveyResponses.invitationId, invitationId));
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [result] = await db.insert(surveyResponses).values(response).returning();
    return result;
  }

  async getSurveyResultSummary(tenantId: string, surveyId: string): Promise<SurveyResultSummary | undefined> {
    const survey = await this.getSurvey(surveyId);
    if (!survey) return undefined;

    // Get all invitations for this survey
    const invitations = await db.select()
      .from(surveyInvitations)
      .where(and(
        eq(surveyInvitations.tenantId, tenantId),
        eq(surveyInvitations.surveyId, surveyId)
      ));

    const totalInvitations = invitations.length;
    const completedInvitations = invitations.filter(i => i.completedAt);
    const completedCount = completedInvitations.length;
    const responseRate = totalInvitations > 0 ? (completedCount / totalInvitations) * 100 : 0;

    // Get all responses for completed invitations
    const completedInvitationIds = completedInvitations.map(i => i.id);
    let allResponses: SurveyResponse[] = [];
    if (completedInvitationIds.length > 0) {
      for (const invId of completedInvitationIds) {
        const responses = await db.select()
          .from(surveyResponses)
          .where(eq(surveyResponses.invitationId, invId));
        allResponses = [...allResponses, ...responses];
      }
    }

    // Calculate question stats
    const questions = survey.questions || [];
    const questionStats = questions.map(question => {
      const questionResponses = allResponses.filter(r => r.questionId === question.id);
      const responseCount = questionResponses.length;

      let avgRating: number | null = null;
      let choiceDistribution: Record<string, number> | undefined;

      if (question.questionType === "rating" || question.questionType === "nps") {
        const ratingValues = questionResponses
          .filter(r => r.ratingValue !== null)
          .map(r => r.ratingValue as number);
        if (ratingValues.length > 0) {
          avgRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
        }
      }

      if (question.questionType === "choice") {
        choiceDistribution = {};
        questionResponses.forEach(r => {
          if (r.choiceValue) {
            choiceDistribution![r.choiceValue] = (choiceDistribution![r.choiceValue] || 0) + 1;
          }
        });
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType || "rating",
        avgRating,
        responseCount,
        choiceDistribution,
      };
    });

    // Calculate overall average rating (from rating questions)
    const ratingQuestions = questionStats.filter(q => q.questionType === "rating" && q.avgRating !== null);
    const avgRating = ratingQuestions.length > 0
      ? ratingQuestions.reduce((sum, q) => sum + (q.avgRating || 0), 0) / ratingQuestions.length
      : null;

    // Calculate NPS score (from NPS questions)
    const npsQuestions = questionStats.filter(q => q.questionType === "nps");
    let npsScore: number | null = null;
    if (npsQuestions.length > 0) {
      const npsResponses = allResponses.filter(r => {
        const q = questions.find(q => q.id === r.questionId);
        return q?.questionType === "nps" && r.ratingValue !== null;
      });
      if (npsResponses.length > 0) {
        const promoters = npsResponses.filter(r => r.ratingValue! >= 9).length;
        const detractors = npsResponses.filter(r => r.ratingValue! <= 6).length;
        npsScore = ((promoters - detractors) / npsResponses.length) * 100;
      }
    }

    return {
      surveyId,
      surveyName: survey.name,
      totalInvitations,
      completedCount,
      responseRate,
      avgRating,
      npsScore,
      questionStats,
    };
  }

  // Asset Categories
  async getAssetCategories(tenantId: string): Promise<AssetCategory[]> {
    return db.select().from(assetCategories).where(eq(assetCategories.tenantId, tenantId)).orderBy(asc(assetCategories.name));
  }

  async getAssetCategory(id: string, tenantId: string): Promise<AssetCategory | undefined> {
    const [category] = await db.select().from(assetCategories).where(
      and(eq(assetCategories.id, id), eq(assetCategories.tenantId, tenantId))
    );
    return category || undefined;
  }

  async createAssetCategory(category: InsertAssetCategory, tenantId: string): Promise<AssetCategory> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) throw new Error("Ungültiger Mandant");
    const { tenantId: _, ...rest } = category as any;
    const [result] = await db.insert(assetCategories).values({ ...rest, tenantId }).returning();
    return result;
  }

  async updateAssetCategory(id: string, updates: Partial<InsertAssetCategory>, tenantId: string): Promise<AssetCategory | undefined> {
    const { tenantId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(assetCategories).set(safeUpdates).where(
      and(eq(assetCategories.id, id), eq(assetCategories.tenantId, tenantId))
    ).returning();
    return result || undefined;
  }

  async deleteAssetCategory(id: string, tenantId: string): Promise<void> {
    await db.delete(assetCategories).where(
      and(eq(assetCategories.id, id), eq(assetCategories.tenantId, tenantId))
    );
  }

  // Assets
  async getAssets(tenantId: string, params?: { assetType?: string; status?: string; categoryId?: string; assignedToId?: string; search?: string }): Promise<AssetWithRelations[]> {
    let baseQuery = db.select().from(assets).where(eq(assets.tenantId, tenantId));

    const conditions: any[] = [eq(assets.tenantId, tenantId)];

    if (params?.assetType) {
      conditions.push(eq(assets.assetType, params.assetType as any));
    }
    if (params?.status) {
      conditions.push(eq(assets.status, params.status as any));
    }
    if (params?.categoryId) {
      conditions.push(eq(assets.categoryId, params.categoryId));
    }
    if (params?.assignedToId) {
      conditions.push(eq(assets.assignedToId, params.assignedToId));
    }
    if (params?.search) {
      conditions.push(
        or(
          ilike(assets.name, `%${params.search}%`),
          ilike(assets.assetNumber, `%${params.search}%`),
          ilike(assets.serialNumber, `%${params.search}%`)
        )
      );
    }

    const assetList = await db.select().from(assets).where(and(...conditions)).orderBy(desc(assets.createdAt));

    const result: AssetWithRelations[] = [];
    for (const asset of assetList) {
      const category = asset.categoryId ? await this.getAssetCategory(asset.categoryId, tenantId) : null;
      const assignedTo = asset.assignedToId ? await this.getUser(asset.assignedToId) : null;
      const license = asset.assetType === "software" || asset.assetType === "license" ? await this.getAssetLicense(asset.id, tenantId) : null;
      const contract = asset.assetType === "contract" ? await this.getAssetContract(asset.id, tenantId) : null;
      result.push({ ...asset, category, assignedTo, license, contract });
    }

    return result;
  }

  async getAsset(id: string, tenantId: string): Promise<AssetWithRelations | undefined> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, id), eq(assets.tenantId, tenantId))
    );
    if (!asset) return undefined;

    const category = asset.categoryId ? await this.getAssetCategory(asset.categoryId, tenantId) : null;
    const assignedTo = asset.assignedToId ? await this.getUser(asset.assignedToId) : null;
    const license = asset.assetType === "software" || asset.assetType === "license" ? await this.getAssetLicense(asset.id, tenantId) : null;
    const contract = asset.assetType === "contract" ? await this.getAssetContract(asset.id, tenantId) : null;
    const history = await this.getAssetHistory(asset.id, tenantId);

    return { ...asset, category, assignedTo, license, contract, history };
  }

  async createAsset(asset: InsertAsset, tenantId: string): Promise<Asset> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) throw new Error("Ungültiger Mandant");
    const { tenantId: _, ...rest } = asset as any;
    const [result] = await db.insert(assets).values({ ...rest, tenantId }).returning();
    return result;
  }

  async updateAsset(id: string, updates: Partial<InsertAsset>, tenantId: string): Promise<Asset | undefined> {
    const { tenantId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(assets).set({ ...safeUpdates, updatedAt: new Date() }).where(
      and(eq(assets.id, id), eq(assets.tenantId, tenantId))
    ).returning();
    return result || undefined;
  }

  async deleteAsset(id: string, tenantId: string): Promise<void> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, id), eq(assets.tenantId, tenantId))
    );
    if (!asset) return;
    await db.delete(assetLicenses).where(eq(assetLicenses.assetId, id));
    await db.delete(assetContracts).where(eq(assetContracts.assetId, id));
    await db.delete(ticketAssets).where(eq(ticketAssets.assetId, id));
    await db.delete(assetHistory).where(eq(assetHistory.assetId, id));
    await db.delete(assets).where(
      and(eq(assets.id, id), eq(assets.tenantId, tenantId))
    );
  }

  async getNextAssetNumber(tenantId: string): Promise<string> {
    const [result] = await db.select({ count: count() }).from(assets).where(eq(assets.tenantId, tenantId));
    const num = (result?.count || 0) + 1;
    return `ASSET-${String(num).padStart(5, "0")}`;
  }

  // Asset Licenses
  async getAssetLicense(assetId: string, tenantId: string): Promise<AssetLicense | undefined> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    );
    if (!asset) return undefined;
    const [license] = await db.select().from(assetLicenses).where(eq(assetLicenses.assetId, assetId));
    return license || undefined;
  }

  async createAssetLicense(license: InsertAssetLicense, tenantId: string): Promise<AssetLicense> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, license.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) {
      throw new Error("Asset gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(assetLicenses).values(license).returning();
    return result;
  }

  async updateAssetLicense(id: string, updates: Partial<InsertAssetLicense>, tenantId: string): Promise<AssetLicense | undefined> {
    const [existingLicense] = await db.select().from(assetLicenses).where(eq(assetLicenses.id, id));
    if (!existingLicense) return undefined;
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, existingLicense.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) return undefined;
    const { assetId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(assetLicenses).set(safeUpdates).where(eq(assetLicenses.id, id)).returning();
    return result || undefined;
  }

  async deleteAssetLicense(id: string, tenantId: string): Promise<void> {
    const [existingLicense] = await db.select().from(assetLicenses).where(eq(assetLicenses.id, id));
    if (!existingLicense) return;
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, existingLicense.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) return;
    await db.delete(assetLicenses).where(eq(assetLicenses.id, id));
  }

  // Asset Contracts
  async getAssetContract(assetId: string, tenantId: string): Promise<AssetContract | undefined> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    );
    if (!asset) return undefined;
    const [contract] = await db.select().from(assetContracts).where(eq(assetContracts.assetId, assetId));
    return contract || undefined;
  }

  async createAssetContract(contract: InsertAssetContract, tenantId: string): Promise<AssetContract> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, contract.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) {
      throw new Error("Asset gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(assetContracts).values(contract).returning();
    return result;
  }

  async updateAssetContract(id: string, updates: Partial<InsertAssetContract>, tenantId: string): Promise<AssetContract | undefined> {
    const [existingContract] = await db.select().from(assetContracts).where(eq(assetContracts.id, id));
    if (!existingContract) return undefined;
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, existingContract.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) return undefined;
    const { assetId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(assetContracts).set(safeUpdates).where(eq(assetContracts.id, id)).returning();
    return result || undefined;
  }

  async deleteAssetContract(id: string, tenantId: string): Promise<void> {
    const [existingContract] = await db.select().from(assetContracts).where(eq(assetContracts.id, id));
    if (!existingContract) return;
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, existingContract.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) return;
    await db.delete(assetContracts).where(eq(assetContracts.id, id));
  }

  // Ticket Assets
  async getTicketAssets(ticketId: string, tenantId: string): Promise<(TicketAsset & { asset?: Asset })[]> {
    const [ticket] = await db.select().from(tickets).where(
      and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId))
    );
    if (!ticket) return [];
    
    const links = await db.select().from(ticketAssets).where(eq(ticketAssets.ticketId, ticketId));
    const result: (TicketAsset & { asset?: Asset })[] = [];
    for (const link of links) {
      const [asset] = await db.select().from(assets).where(
        and(eq(assets.id, link.assetId!), eq(assets.tenantId, tenantId))
      );
      result.push({ ...link, asset: asset || undefined });
    }
    return result;
  }

  async getAssetTickets(assetId: string, tenantId: string): Promise<(TicketAsset & { ticket?: Ticket })[]> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    );
    if (!asset) return [];
    
    const links = await db.select().from(ticketAssets).where(eq(ticketAssets.assetId, assetId));
    const result: (TicketAsset & { ticket?: Ticket })[] = [];
    for (const link of links) {
      const [ticket] = await db.select().from(tickets).where(
        and(eq(tickets.id, link.ticketId!), eq(tickets.tenantId, tenantId))
      );
      result.push({ ...link, ticket: ticket || undefined });
    }
    return result;
  }

  async createTicketAsset(link: InsertTicketAsset, tenantId: string): Promise<TicketAsset> {
    const [ticket] = await db.select().from(tickets).where(
      and(eq(tickets.id, link.ticketId!), eq(tickets.tenantId, tenantId))
    );
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, link.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!ticket || !asset) {
      throw new Error("Ticket oder Asset gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(ticketAssets).values(link).returning();
    return result;
  }

  async deleteTicketAsset(id: string, tenantId: string): Promise<void> {
    const [link] = await db.select().from(ticketAssets).where(eq(ticketAssets.id, id));
    if (!link) return;
    
    const [ticket] = await db.select().from(tickets).where(
      and(eq(tickets.id, link.ticketId!), eq(tickets.tenantId, tenantId))
    );
    if (!ticket) return;
    
    await db.delete(ticketAssets).where(eq(ticketAssets.id, id));
  }

  // Asset History
  async getAssetHistory(assetId: string, tenantId: string): Promise<(AssetHistory & { user?: User })[]> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    );
    if (!asset) return [];
    
    const entries = await db.select().from(assetHistory).where(eq(assetHistory.assetId, assetId)).orderBy(desc(assetHistory.createdAt));
    const result: (AssetHistory & { user?: User })[] = [];
    for (const entry of entries) {
      const user = entry.userId ? await this.getUser(entry.userId) : undefined;
      result.push({ ...entry, user });
    }
    return result;
  }

  async createAssetHistory(entry: InsertAssetHistory, tenantId: string): Promise<AssetHistory> {
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, entry.assetId!), eq(assets.tenantId, tenantId))
    );
    if (!asset) {
      throw new Error("Asset gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(assetHistory).values(entry).returning();
    return result;
  }

  // Projects
  async getProjects(tenantId: string): Promise<ProjectWithRelations[]> {
    const projectList = await db.select().from(projects)
      .where(eq(projects.tenantId, tenantId))
      .orderBy(desc(projects.createdAt));
    
    const result: ProjectWithRelations[] = [];
    for (const project of projectList) {
      const lead = project.leadId ? await this.getUser(project.leadId) : undefined;
      const members = await this.getProjectMembers(project.id, tenantId);
      const columns = await db.select().from(boardColumns)
        .where(eq(boardColumns.projectId, project.id))
        .orderBy(asc(boardColumns.order));
      const [ticketCountResult] = await db.select({ count: count() }).from(ticketProjects)
        .where(eq(ticketProjects.projectId, project.id));
      result.push({
        ...project,
        lead: lead || undefined,
        members,
        columns,
        ticketCount: ticketCountResult?.count || 0
      });
    }
    return result;
  }

  async getProject(id: string, tenantId: string): Promise<ProjectWithRelations | undefined> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    if (!project) return undefined;

    const lead = project.leadId ? await this.getUser(project.leadId) : undefined;
    const members = await this.getProjectMembers(project.id, tenantId);
    const columns = await db.select().from(boardColumns)
      .where(eq(boardColumns.projectId, project.id))
      .orderBy(asc(boardColumns.order));
    const [ticketCountResult] = await db.select({ count: count() }).from(ticketProjects)
      .where(eq(ticketProjects.projectId, project.id));

    return {
      ...project,
      lead: lead || undefined,
      members,
      columns,
      ticketCount: ticketCountResult?.count || 0
    };
  }

  async createProject(project: InsertProject, tenantId: string): Promise<Project> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) {
      throw new Error("Mandant nicht gefunden");
    }
    const { tenantId: _, id: __, ...safeProject } = project as any;
    const [result] = await db.insert(projects).values({ ...safeProject, tenantId }).returning();
    
    const defaultColumns = [
      { name: "Offen", status: "open" as const, color: "#3B82F6", order: 0 },
      { name: "In Bearbeitung", status: "in_progress" as const, color: "#F59E0B", order: 1 },
      { name: "Wartend", status: "waiting" as const, color: "#8B5CF6", order: 2 },
      { name: "Gelöst", status: "resolved" as const, color: "#10B981", order: 3 },
      { name: "Geschlossen", status: "closed" as const, color: "#6B7280", order: 4 },
    ];
    for (const col of defaultColumns) {
      await db.insert(boardColumns).values({ ...col, projectId: result.id });
    }
    
    return result;
  }

  async updateProject(id: string, updates: Partial<InsertProject>, tenantId: string): Promise<Project | undefined> {
    const [existing] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    if (!existing) return undefined;
    
    const { tenantId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(projects)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async deleteProject(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    if (!existing) return;
    
    await db.delete(ticketProjects).where(eq(ticketProjects.projectId, id));
    await db.delete(boardColumns).where(eq(boardColumns.projectId, id));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Members
  async getProjectMembers(projectId: string, tenantId: string): Promise<(ProjectMember & { user?: User })[]> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));
    if (!project) return [];

    const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    const result: (ProjectMember & { user?: User })[] = [];
    for (const member of members) {
      const user = member.userId ? await this.getUser(member.userId) : undefined;
      result.push({ ...member, user });
    }
    return result;
  }

  async addProjectMember(member: InsertProjectMember, tenantId: string): Promise<ProjectMember> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, member.projectId!), eq(projects.tenantId, tenantId)));
    if (!project) {
      throw new Error("Projekt gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(projectMembers).values(member).returning();
    return result;
  }

  async removeProjectMember(projectId: string, userId: string, tenantId: string): Promise<void> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));
    if (!project) return;

    await db.delete(projectMembers).where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
    );
  }

  // Board Columns
  async getBoardColumns(projectId: string, tenantId: string): Promise<BoardColumn[]> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));
    if (!project) return [];

    return db.select().from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(asc(boardColumns.order));
  }

  async createBoardColumn(column: InsertBoardColumn, tenantId: string): Promise<BoardColumn> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, column.projectId!), eq(projects.tenantId, tenantId)));
    if (!project) {
      throw new Error("Projekt gehört nicht zum Mandanten");
    }
    const [result] = await db.insert(boardColumns).values(column).returning();
    return result;
  }

  async updateBoardColumn(id: string, updates: Partial<InsertBoardColumn>, tenantId: string): Promise<BoardColumn | undefined> {
    const [existing] = await db.select().from(boardColumns).where(eq(boardColumns.id, id));
    if (!existing) return undefined;

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, existing.projectId!), eq(projects.tenantId, tenantId)));
    if (!project) return undefined;

    const { projectId: _, id: __, ...safeUpdates } = updates as any;
    const [result] = await db.update(boardColumns).set(safeUpdates).where(eq(boardColumns.id, id)).returning();
    return result;
  }

  async deleteBoardColumn(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(boardColumns).where(eq(boardColumns.id, id));
    if (!existing) return;

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, existing.projectId!), eq(projects.tenantId, tenantId)));
    if (!project) return;

    await db.delete(boardColumns).where(eq(boardColumns.id, id));
  }

  async reorderBoardColumns(projectId: string, columnIds: string[], tenantId: string): Promise<void> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));
    if (!project) return;

    for (let i = 0; i < columnIds.length; i++) {
      await db.update(boardColumns).set({ order: i }).where(eq(boardColumns.id, columnIds[i]));
    }
  }

  // Ticket Projects
  async getTicketProjects(ticketId: string, tenantId: string): Promise<(TicketProject & { project?: Project })[]> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)));
    if (!ticket) return [];

    const links = await db.select().from(ticketProjects).where(eq(ticketProjects.ticketId, ticketId));
    const result: (TicketProject & { project?: Project })[] = [];
    for (const link of links) {
      const [project] = await db.select().from(projects)
        .where(and(eq(projects.id, link.projectId!), eq(projects.tenantId, tenantId)));
      result.push({ ...link, project: project || undefined });
    }
    return result;
  }

  async addTicketToProject(ticketProject: InsertTicketProject, tenantId: string): Promise<TicketProject> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, ticketProject.ticketId!), eq(tickets.tenantId, tenantId)));
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, ticketProject.projectId!), eq(projects.tenantId, tenantId)));
    
    if (!ticket || !project) {
      throw new Error("Ticket oder Projekt gehört nicht zum Mandanten");
    }
    
    const [result] = await db.insert(ticketProjects).values(ticketProject).returning();
    return result;
  }

  async removeTicketFromProject(ticketId: string, projectId: string, tenantId: string): Promise<void> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)));
    if (!ticket) return;

    await db.delete(ticketProjects).where(
      and(eq(ticketProjects.ticketId, ticketId), eq(ticketProjects.projectId, projectId))
    );
  }

  async getProjectTickets(projectId: string, tenantId: string): Promise<{ column: BoardColumn; tickets: TicketProject[] }[]> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));
    if (!project) return [];

    const columns = await db.select().from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(asc(boardColumns.order));
    
    const ticketProjectsList = await db.select().from(ticketProjects)
      .where(eq(ticketProjects.projectId, projectId))
      .orderBy(asc(ticketProjects.boardOrder));

    const result: { column: BoardColumn; tickets: TicketProject[] }[] = [];
    for (const column of columns) {
      const columnTickets: TicketProject[] = [];
      for (const tp of ticketProjectsList) {
        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, tp.ticketId!));
        if (ticket && ticket.status === column.status) {
          columnTickets.push(tp);
        }
      }
      result.push({ column, tickets: columnTickets });
    }
    return result;
  }

  async updateTicketBoardOrder(ticketId: string, projectId: string, boardOrder: number, tenantId: string): Promise<void> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)));
    if (!ticket) return;

    await db.update(ticketProjects)
      .set({ boardOrder })
      .where(and(eq(ticketProjects.ticketId, ticketId), eq(ticketProjects.projectId, projectId)));
  }
}

export const storage = new DatabaseStorage();
