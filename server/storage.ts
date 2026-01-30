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
  organizations,
  customers,
  customerLocations,
  contacts,
  ticketContacts,
  customerActivities,
  type Organization,
  type InsertOrganization,
  type OrganizationWithRelations,
  type Customer,
  type InsertCustomer,
  type CustomerWithRelations,
  type CustomerLocation,
  type InsertCustomerLocation,
  type Contact,
  type InsertContact,
  type ContactWithRelations,
  type TicketContact,
  type InsertTicketContact,
  type CustomerActivity,
  type InsertCustomerActivity,
  tlsSettings,
  tlsCertificates,
  tlsCertificateActions,
  tlsChallenges,
  type TlsSettings,
  type InsertTlsSettings,
  type UpdateTlsSettings,
  type TlsCertificate,
  type InsertTlsCertificate,
  type TlsCertificateAction,
  type InsertTlsCertificateAction,
  exchangeConfigurations,
  exchangeMailboxes,
  exchangeAssignmentRules,
  exchangeEmails,
  exchangeSyncLogs,
  emailProcessingRules,
  type ExchangeConfiguration,
  type InsertExchangeConfiguration,
  type UpdateExchangeConfiguration,
  type ExchangeMailbox,
  type InsertExchangeMailbox,
  type UpdateExchangeMailbox,
  type ExchangeAssignmentRule,
  type InsertExchangeAssignmentRule,
  type ExchangeEmail,
  type InsertExchangeEmail,
  type ExchangeSyncLog,
  type InsertExchangeSyncLog,
  type EmailProcessingRule,
  type InsertEmailProcessingRule,
  type UpdateEmailProcessingRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, ilike, or, count, gt, lt } from "drizzle-orm";

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
  getTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined>;
  updateTenantBranding(id: string, branding: Partial<InsertTenant>): Promise<Tenant | undefined>;

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

  // CRM - Organizations
  getOrganizations(tenantId: string, params?: { search?: string }): Promise<OrganizationWithRelations[]>;
  getOrganization(id: string, tenantId: string): Promise<OrganizationWithRelations | undefined>;
  createOrganization(org: InsertOrganization, tenantId: string): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>, tenantId: string): Promise<Organization | undefined>;
  deleteOrganization(id: string, tenantId: string): Promise<void>;

  // CRM - Customers
  getCustomers(tenantId: string, params?: { organizationId?: string; search?: string }): Promise<CustomerWithRelations[]>;
  getCustomer(id: string, tenantId: string): Promise<CustomerWithRelations | undefined>;
  createCustomer(customer: InsertCustomer, tenantId: string): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>, tenantId: string): Promise<Customer | undefined>;
  deleteCustomer(id: string, tenantId: string): Promise<void>;
  getNextCustomerNumber(tenantId: string): Promise<string>;

  // CRM - Customer Locations
  getCustomerLocations(customerId: string, tenantId: string): Promise<CustomerLocation[]>;
  createCustomerLocation(location: InsertCustomerLocation, tenantId: string): Promise<CustomerLocation>;
  updateCustomerLocation(id: string, updates: Partial<InsertCustomerLocation>, tenantId: string): Promise<CustomerLocation | undefined>;
  deleteCustomerLocation(id: string, tenantId: string): Promise<void>;

  // CRM - Contacts
  getContacts(tenantId: string, params?: { customerId?: string; organizationId?: string; search?: string }): Promise<ContactWithRelations[]>;
  getContact(id: string, tenantId: string): Promise<ContactWithRelations | undefined>;
  createContact(contact: InsertContact, tenantId: string): Promise<Contact>;
  updateContact(id: string, updates: Partial<InsertContact>, tenantId: string): Promise<Contact | undefined>;
  deleteContact(id: string, tenantId: string): Promise<void>;

  // CRM - Ticket Contacts
  getTicketContacts(ticketId: string, tenantId: string): Promise<(TicketContact & { contact?: Contact })[]>;
  addTicketContact(link: InsertTicketContact, tenantId: string): Promise<TicketContact>;
  removeTicketContact(id: string, tenantId: string): Promise<void>;

  // CRM - Customer Activities
  getCustomerActivities(tenantId: string, params?: { customerId?: string; contactId?: string; ticketId?: string; limit?: number }): Promise<(CustomerActivity & { createdBy?: User })[]>;
  createCustomerActivity(activity: InsertCustomerActivity, tenantId: string): Promise<CustomerActivity>;

  // TLS Certificate Management
  getTlsSettings(): Promise<TlsSettings | undefined>;
  createTlsSettings(settings: InsertTlsSettings): Promise<TlsSettings>;
  updateTlsSettings(updates: UpdateTlsSettings): Promise<TlsSettings | undefined>;
  getTlsCertificates(): Promise<TlsCertificate[]>;
  getTlsCertificate(id: string): Promise<TlsCertificate | undefined>;
  getActiveTlsCertificate(): Promise<TlsCertificate | undefined>;
  createTlsCertificate(cert: InsertTlsCertificate): Promise<TlsCertificate>;
  updateTlsCertificate(id: string, updates: Partial<InsertTlsCertificate>): Promise<TlsCertificate | undefined>;
  deleteTlsCertificate(id: string): Promise<void>;
  getTlsCertificateActions(certificateId?: string, limit?: number): Promise<(TlsCertificateAction & { performedBy?: User })[]>;
  createTlsCertificateAction(action: InsertTlsCertificateAction): Promise<TlsCertificateAction>;
  
  // TLS Challenges
  createTlsChallenge(challenge: { tenantId?: string | null; token: string; keyAuthorization: string; domain: string; expiresAt: Date }): Promise<any>;
  getTlsChallengeByToken(token: string): Promise<{ keyAuthorization: string } | undefined>;
  completeTlsChallenge(token: string): Promise<void>;
  cleanupExpiredChallenges(): Promise<number>;

  // Exchange Online Integration
  getExchangeConfiguration(tenantId: string): Promise<ExchangeConfiguration | undefined>;
  createExchangeConfiguration(config: InsertExchangeConfiguration): Promise<ExchangeConfiguration>;
  updateExchangeConfiguration(tenantId: string, updates: Partial<UpdateExchangeConfiguration>): Promise<ExchangeConfiguration | undefined>;
  deleteExchangeConfiguration(tenantId: string): Promise<void>;

  getExchangeMailboxes(tenantId: string): Promise<ExchangeMailbox[]>;
  getExchangeMailbox(id: string, tenantId: string): Promise<ExchangeMailbox | undefined>;
  createExchangeMailbox(mailbox: InsertExchangeMailbox): Promise<ExchangeMailbox>;
  updateExchangeMailbox(id: string, updates: Partial<UpdateExchangeMailbox>, tenantId: string): Promise<ExchangeMailbox | undefined>;
  deleteExchangeMailbox(id: string, tenantId: string): Promise<void>;

  getExchangeAssignmentRules(mailboxId: string, tenantId: string): Promise<ExchangeAssignmentRule[]>;
  createExchangeAssignmentRule(rule: InsertExchangeAssignmentRule): Promise<ExchangeAssignmentRule>;
  updateExchangeAssignmentRule(id: string, updates: Partial<InsertExchangeAssignmentRule>, tenantId: string): Promise<ExchangeAssignmentRule | undefined>;
  deleteExchangeAssignmentRule(id: string, tenantId: string): Promise<void>;

  getExchangeEmails(tenantId: string, params?: { mailboxId?: string; ticketId?: string; limit?: number }): Promise<ExchangeEmail[]>;
  getExchangeEmailByMessageId(tenantId: string, messageId: string): Promise<ExchangeEmail | undefined>;
  createExchangeEmail(email: InsertExchangeEmail): Promise<ExchangeEmail>;
  updateExchangeEmail(id: string, updates: Partial<InsertExchangeEmail>, tenantId: string): Promise<ExchangeEmail | undefined>;

  getExchangeSyncLogs(tenantId: string, params?: { mailboxId?: string; limit?: number }): Promise<ExchangeSyncLog[]>;
  createExchangeSyncLog(log: InsertExchangeSyncLog): Promise<ExchangeSyncLog>;

  // Email Processing Rules
  getEmailProcessingRules(tenantId: string, mailboxId?: string): Promise<EmailProcessingRule[]>;
  getEmailProcessingRule(id: string, tenantId: string): Promise<EmailProcessingRule | undefined>;
  createEmailProcessingRule(rule: InsertEmailProcessingRule): Promise<EmailProcessingRule>;
  updateEmailProcessingRule(id: string, updates: UpdateEmailProcessingRule, tenantId: string): Promise<EmailProcessingRule | undefined>;
  deleteEmailProcessingRule(id: string, tenantId: string): Promise<void>;
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

  async getTenants(): Promise<Tenant[]> {
    return db.select().from(tenants).orderBy(asc(tenants.name));
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant || undefined;
  }

  async updateTenantBranding(id: string, branding: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set({ ...branding, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant || undefined;
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

    // Fetch customer with contacts if ticket has customerId
    let customer = null;
    if (ticket.customerId && ticket.tenantId) {
      const [customerData] = await db.select().from(customers)
        .where(and(eq(customers.id, ticket.customerId), eq(customers.tenantId, ticket.tenantId)));
      if (customerData) {
        const customerContacts = await db.select().from(contacts)
          .where(and(eq(contacts.customerId, customerData.id), eq(contacts.tenantId, ticket.tenantId)));
        const org = customerData.organizationId 
          ? (await db.select().from(organizations).where(and(eq(organizations.id, customerData.organizationId), eq(organizations.tenantId, ticket.tenantId))))[0] 
          : null;
        customer = {
          ...customerData,
          contacts: customerContacts,
          organization: org || null,
        };
      }
    }

    return {
      ...ticket,
      ticketType,
      createdBy,
      assignees: assigneesList,
      watchers: watchersList,
      comments: commentsList,
      attachments: attachmentsList,
      areas: areasList.map(r => ({ ...r.ticket_areas, area: r.areas || undefined })),
      customer,
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

  // ============================================
  // CRM - Organizations
  // ============================================

  async getOrganizations(tenantId: string, params?: { search?: string }): Promise<OrganizationWithRelations[]> {
    let query = db.select().from(organizations).where(eq(organizations.tenantId, tenantId));
    
    const orgs = await query.orderBy(asc(organizations.name));
    
    const result: OrganizationWithRelations[] = [];
    for (const org of orgs) {
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        if (!org.name.toLowerCase().includes(searchLower)) continue;
      }
      
      const orgCustomers = await db.select().from(customers)
        .where(and(eq(customers.organizationId, org.id), eq(customers.tenantId, tenantId)));
      const orgContacts = await db.select().from(contacts)
        .where(and(eq(contacts.organizationId, org.id), eq(contacts.tenantId, tenantId)));
      const parentOrg = org.parentId 
        ? (await db.select().from(organizations).where(eq(organizations.id, org.parentId)))[0] 
        : null;
      
      result.push({
        ...org,
        customers: orgCustomers,
        contacts: orgContacts,
        parentOrganization: parentOrg || null,
      });
    }
    return result;
  }

  async getOrganization(id: string, tenantId: string): Promise<OrganizationWithRelations | undefined> {
    const [org] = await db.select().from(organizations)
      .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)));
    if (!org) return undefined;

    const orgCustomers = await db.select().from(customers)
      .where(and(eq(customers.organizationId, org.id), eq(customers.tenantId, tenantId)));
    const orgContacts = await db.select().from(contacts)
      .where(and(eq(contacts.organizationId, org.id), eq(contacts.tenantId, tenantId)));
    const parentOrg = org.parentId 
      ? (await db.select().from(organizations).where(eq(organizations.id, org.parentId)))[0] 
      : null;

    return {
      ...org,
      customers: orgCustomers,
      contacts: orgContacts,
      parentOrganization: parentOrg || null,
    };
  }

  async createOrganization(org: InsertOrganization, tenantId: string): Promise<Organization> {
    const [result] = await db.insert(organizations).values({ ...org, tenantId }).returning();
    return result;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>, tenantId: string): Promise<Organization | undefined> {
    const [existing] = await db.select().from(organizations)
      .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)));
    if (!existing) return undefined;

    const [result] = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return result;
  }

  async deleteOrganization(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(organizations)
      .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)));
    if (!existing) return;

    await db.delete(organizations).where(eq(organizations.id, id));
  }

  // ============================================
  // CRM - Customers
  // ============================================

  async getCustomers(tenantId: string, params?: { organizationId?: string; search?: string }): Promise<CustomerWithRelations[]> {
    let conditions = [eq(customers.tenantId, tenantId)];
    if (params?.organizationId) {
      conditions.push(eq(customers.organizationId, params.organizationId));
    }

    const customersList = await db.select().from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.name));

    const result: CustomerWithRelations[] = [];
    for (const customer of customersList) {
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        if (!customer.name.toLowerCase().includes(searchLower) && 
            !customer.customerNumber.toLowerCase().includes(searchLower)) continue;
      }

      const org = customer.organizationId 
        ? (await db.select().from(organizations).where(and(eq(organizations.id, customer.organizationId), eq(organizations.tenantId, tenantId))))[0] 
        : null;
      const manager = customer.accountManagerId 
        ? (await db.select().from(users).where(and(eq(users.id, customer.accountManagerId), eq(users.tenantId, tenantId))))[0] 
        : null;
      const sla = customer.slaDefinitionId 
        ? (await db.select().from(slaDefinitions).where(and(eq(slaDefinitions.id, customer.slaDefinitionId), eq(slaDefinitions.tenantId, tenantId))))[0] 
        : null;
      const locs = await db.select().from(customerLocations)
        .where(eq(customerLocations.customerId, customer.id));
      const customerContacts = await db.select().from(contacts)
        .where(and(eq(contacts.customerId, customer.id), eq(contacts.tenantId, tenantId)));

      result.push({
        ...customer,
        organization: org || null,
        accountManager: manager || null,
        slaDefinition: sla || null,
        locations: locs,
        contacts: customerContacts,
      });
    }
    return result;
  }

  async getCustomer(id: string, tenantId: string): Promise<CustomerWithRelations | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    if (!customer) return undefined;

    const org = customer.organizationId 
      ? (await db.select().from(organizations).where(and(eq(organizations.id, customer.organizationId), eq(organizations.tenantId, tenantId))))[0] 
      : null;
    const manager = customer.accountManagerId 
      ? (await db.select().from(users).where(and(eq(users.id, customer.accountManagerId), eq(users.tenantId, tenantId))))[0] 
      : null;
    const sla = customer.slaDefinitionId 
      ? (await db.select().from(slaDefinitions).where(and(eq(slaDefinitions.id, customer.slaDefinitionId), eq(slaDefinitions.tenantId, tenantId))))[0] 
      : null;
    const locs = await db.select().from(customerLocations)
      .where(eq(customerLocations.customerId, customer.id));
    const customerContacts = await db.select().from(contacts)
      .where(and(eq(contacts.customerId, customer.id), eq(contacts.tenantId, tenantId)));
    const customerTickets = await db.select().from(tickets)
      .where(and(eq(tickets.customerId, customer.id), eq(tickets.tenantId, tenantId)))
      .orderBy(desc(tickets.createdAt));
    const activities = await db.select().from(customerActivities)
      .where(and(eq(customerActivities.customerId, customer.id), eq(customerActivities.tenantId, tenantId)))
      .orderBy(desc(customerActivities.createdAt));

    return {
      ...customer,
      organization: org || null,
      accountManager: manager || null,
      slaDefinition: sla || null,
      locations: locs,
      contacts: customerContacts,
      tickets: customerTickets,
      activities: activities,
    };
  }

  async createCustomer(customer: InsertCustomer, tenantId: string): Promise<Customer> {
    const customerNumber = await this.getNextCustomerNumber(tenantId);
    const [result] = await db.insert(customers).values({ ...customer, tenantId, customerNumber }).returning();
    return result;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>, tenantId: string): Promise<Customer | undefined> {
    const [existing] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    if (!existing) return undefined;

    const [result] = await db.update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result;
  }

  async deleteCustomer(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    if (!existing) return;

    await db.delete(customers).where(eq(customers.id, id));
  }

  async getNextCustomerNumber(tenantId: string): Promise<string> {
    const [result] = await db.select({ count: count() }).from(customers)
      .where(eq(customers.tenantId, tenantId));
    const num = (result?.count || 0) + 1;
    return `KD-${num.toString().padStart(5, '0')}`;
  }

  // ============================================
  // CRM - Customer Locations
  // ============================================

  async getCustomerLocations(customerId: string, tenantId: string): Promise<CustomerLocation[]> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
    if (!customer) return [];

    return db.select().from(customerLocations)
      .where(eq(customerLocations.customerId, customerId))
      .orderBy(desc(customerLocations.isPrimary), asc(customerLocations.name));
  }

  async createCustomerLocation(location: InsertCustomerLocation, tenantId: string): Promise<CustomerLocation> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, location.customerId!), eq(customers.tenantId, tenantId)));
    if (!customer) {
      throw new Error("Kunde gehört nicht zum Mandanten");
    }

    const [result] = await db.insert(customerLocations).values(location).returning();
    return result;
  }

  async updateCustomerLocation(id: string, updates: Partial<InsertCustomerLocation>, tenantId: string): Promise<CustomerLocation | undefined> {
    const [existing] = await db.select().from(customerLocations)
      .where(eq(customerLocations.id, id));
    if (!existing) return undefined;

    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, existing.customerId!), eq(customers.tenantId, tenantId)));
    if (!customer) return undefined;

    const [result] = await db.update(customerLocations)
      .set(updates)
      .where(eq(customerLocations.id, id))
      .returning();
    return result;
  }

  async deleteCustomerLocation(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(customerLocations)
      .where(eq(customerLocations.id, id));
    if (!existing) return;

    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, existing.customerId!), eq(customers.tenantId, tenantId)));
    if (!customer) return;

    await db.delete(customerLocations).where(eq(customerLocations.id, id));
  }

  // ============================================
  // CRM - Contacts
  // ============================================

  async getContacts(tenantId: string, params?: { customerId?: string; organizationId?: string; search?: string }): Promise<ContactWithRelations[]> {
    let conditions = [eq(contacts.tenantId, tenantId)];
    if (params?.customerId) {
      conditions.push(eq(contacts.customerId, params.customerId));
    }
    if (params?.organizationId) {
      conditions.push(eq(contacts.organizationId, params.organizationId));
    }

    const contactsList = await db.select().from(contacts)
      .where(and(...conditions))
      .orderBy(asc(contacts.lastName), asc(contacts.firstName));

    const result: ContactWithRelations[] = [];
    for (const contact of contactsList) {
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        if (!fullName.includes(searchLower) && 
            !(contact.email?.toLowerCase().includes(searchLower))) continue;
      }

      const customer = contact.customerId 
        ? (await db.select().from(customers).where(and(eq(customers.id, contact.customerId), eq(customers.tenantId, tenantId))))[0] 
        : null;
      const org = contact.organizationId 
        ? (await db.select().from(organizations).where(and(eq(organizations.id, contact.organizationId), eq(organizations.tenantId, tenantId))))[0] 
        : null;
      const user = contact.userId 
        ? (await db.select().from(users).where(and(eq(users.id, contact.userId), eq(users.tenantId, tenantId))))[0] 
        : null;

      result.push({
        ...contact,
        customer: customer || null,
        organization: org || null,
        user: user || null,
      });
    }
    return result;
  }

  async getContact(id: string, tenantId: string): Promise<ContactWithRelations | undefined> {
    const [contact] = await db.select().from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    if (!contact) return undefined;

    const customer = contact.customerId 
      ? (await db.select().from(customers).where(and(eq(customers.id, contact.customerId), eq(customers.tenantId, tenantId))))[0] 
      : null;
    const org = contact.organizationId 
      ? (await db.select().from(organizations).where(and(eq(organizations.id, contact.organizationId), eq(organizations.tenantId, tenantId))))[0] 
      : null;
    const user = contact.userId 
      ? (await db.select().from(users).where(and(eq(users.id, contact.userId), eq(users.tenantId, tenantId))))[0] 
      : null;

    return {
      ...contact,
      customer: customer || null,
      organization: org || null,
      user: user || null,
    };
  }

  async createContact(contact: InsertContact, tenantId: string): Promise<Contact> {
    const [result] = await db.insert(contacts).values({ ...contact, tenantId }).returning();
    return result;
  }

  async updateContact(id: string, updates: Partial<InsertContact>, tenantId: string): Promise<Contact | undefined> {
    const [existing] = await db.select().from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    if (!existing) return undefined;

    const [result] = await db.update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return result;
  }

  async deleteContact(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    if (!existing) return;

    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // ============================================
  // CRM - Ticket Contacts
  // ============================================

  async getTicketContacts(ticketId: string, tenantId: string): Promise<(TicketContact & { contact?: Contact })[]> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.tenantId, tenantId)));
    if (!ticket) return [];

    const links = await db.select().from(ticketContacts).where(eq(ticketContacts.ticketId, ticketId));
    const result: (TicketContact & { contact?: Contact })[] = [];
    for (const link of links) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, link.contactId!));
      result.push({ ...link, contact: contact || undefined });
    }
    return result;
  }

  async addTicketContact(link: InsertTicketContact, tenantId: string): Promise<TicketContact> {
    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, link.ticketId!), eq(tickets.tenantId, tenantId)));
    if (!ticket) {
      throw new Error("Ticket gehört nicht zum Mandanten");
    }

    const [result] = await db.insert(ticketContacts).values(link).returning();
    return result;
  }

  async removeTicketContact(id: string, tenantId: string): Promise<void> {
    const [existing] = await db.select().from(ticketContacts).where(eq(ticketContacts.id, id));
    if (!existing) return;

    const [ticket] = await db.select().from(tickets)
      .where(and(eq(tickets.id, existing.ticketId!), eq(tickets.tenantId, tenantId)));
    if (!ticket) return;

    await db.delete(ticketContacts).where(eq(ticketContacts.id, id));
  }

  // ============================================
  // CRM - Customer Activities
  // ============================================

  async getCustomerActivities(tenantId: string, params?: { customerId?: string; contactId?: string; ticketId?: string; limit?: number }): Promise<(CustomerActivity & { createdBy?: User })[]> {
    let conditions = [eq(customerActivities.tenantId, tenantId)];
    if (params?.customerId) {
      conditions.push(eq(customerActivities.customerId, params.customerId));
    }
    if (params?.contactId) {
      conditions.push(eq(customerActivities.contactId, params.contactId));
    }
    if (params?.ticketId) {
      conditions.push(eq(customerActivities.ticketId, params.ticketId));
    }

    let query = db.select().from(customerActivities)
      .where(and(...conditions))
      .orderBy(desc(customerActivities.createdAt));

    const activities = params?.limit 
      ? await query.limit(params.limit) 
      : await query;

    const result: (CustomerActivity & { createdBy?: User })[] = [];
    for (const activity of activities) {
      const user = activity.createdById 
        ? (await db.select().from(users).where(eq(users.id, activity.createdById)))[0] 
        : null;
      result.push({ ...activity, createdBy: user || undefined });
    }
    return result;
  }

  async createCustomerActivity(activity: InsertCustomerActivity, tenantId: string): Promise<CustomerActivity> {
    const [result] = await db.insert(customerActivities).values({ ...activity, tenantId }).returning();
    return result;
  }

  // ============================================
  // TLS Certificate Management
  // ============================================

  async getTlsSettings(): Promise<TlsSettings | undefined> {
    const [settings] = await db.select().from(tlsSettings).limit(1);
    return settings;
  }

  async createTlsSettings(settings: InsertTlsSettings): Promise<TlsSettings> {
    const [result] = await db.insert(tlsSettings).values(settings).returning();
    return result;
  }

  async updateTlsSettings(updates: UpdateTlsSettings): Promise<TlsSettings | undefined> {
    let settings = await this.getTlsSettings();
    if (!settings) {
      settings = await this.createTlsSettings(updates as InsertTlsSettings);
      return settings;
    }
    const [result] = await db.update(tlsSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tlsSettings.id, settings.id))
      .returning();
    return result;
  }

  async getTlsCertificates(): Promise<TlsCertificate[]> {
    return db.select().from(tlsCertificates).orderBy(desc(tlsCertificates.createdAt));
  }

  async getTlsCertificate(id: string): Promise<TlsCertificate | undefined> {
    const [cert] = await db.select().from(tlsCertificates).where(eq(tlsCertificates.id, id));
    return cert;
  }

  async getActiveTlsCertificate(): Promise<TlsCertificate | undefined> {
    const [cert] = await db.select().from(tlsCertificates)
      .where(and(eq(tlsCertificates.isActive, true), eq(tlsCertificates.status, "active")))
      .limit(1);
    return cert;
  }

  async createTlsCertificate(cert: InsertTlsCertificate): Promise<TlsCertificate> {
    const [result] = await db.insert(tlsCertificates).values(cert).returning();
    return result;
  }

  async updateTlsCertificate(id: string, updates: Partial<InsertTlsCertificate>): Promise<TlsCertificate | undefined> {
    const [result] = await db.update(tlsCertificates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tlsCertificates.id, id))
      .returning();
    return result;
  }

  async deleteTlsCertificate(id: string): Promise<void> {
    await db.delete(tlsCertificateActions).where(eq(tlsCertificateActions.certificateId, id));
    await db.delete(tlsCertificates).where(eq(tlsCertificates.id, id));
  }

  async getTlsCertificateActions(certificateId?: string, limit?: number): Promise<(TlsCertificateAction & { performedBy?: User })[]> {
    let query = db.select().from(tlsCertificateActions);
    if (certificateId) {
      query = query.where(eq(tlsCertificateActions.certificateId, certificateId)) as typeof query;
    }
    query = query.orderBy(desc(tlsCertificateActions.createdAt)) as typeof query;
    const actions = limit ? await query.limit(limit) : await query;

    const result: (TlsCertificateAction & { performedBy?: User })[] = [];
    for (const action of actions) {
      const user = action.performedById 
        ? (await db.select().from(users).where(eq(users.id, action.performedById)))[0] 
        : null;
      result.push({ ...action, performedBy: user || undefined });
    }
    return result;
  }

  async createTlsCertificateAction(action: InsertTlsCertificateAction): Promise<TlsCertificateAction> {
    const [result] = await db.insert(tlsCertificateActions).values(action).returning();
    return result;
  }

  // TLS Challenges
  async createTlsChallenge(challenge: { tenantId?: string | null; token: string; keyAuthorization: string; domain: string; expiresAt: Date }): Promise<any> {
    const [result] = await db.insert(tlsChallenges).values(challenge).returning();
    return result;
  }

  async getTlsChallengeByToken(token: string): Promise<{ keyAuthorization: string } | undefined> {
    const [challenge] = await db.select().from(tlsChallenges)
      .where(and(
        eq(tlsChallenges.token, token),
        gt(tlsChallenges.expiresAt, new Date())
      ));
    return challenge ? { keyAuthorization: challenge.keyAuthorization } : undefined;
  }

  async completeTlsChallenge(token: string): Promise<void> {
    await db.update(tlsChallenges)
      .set({ completedAt: new Date() })
      .where(eq(tlsChallenges.token, token));
  }

  async cleanupExpiredChallenges(): Promise<number> {
    const result = await db.delete(tlsChallenges)
      .where(lt(tlsChallenges.expiresAt, new Date()))
      .returning();
    return result.length;
  }

  // Exchange Online Integration
  async getExchangeConfiguration(tenantId: string): Promise<ExchangeConfiguration | undefined> {
    const [config] = await db.select().from(exchangeConfigurations)
      .where(eq(exchangeConfigurations.tenantId, tenantId));
    return config || undefined;
  }

  async createExchangeConfiguration(config: InsertExchangeConfiguration): Promise<ExchangeConfiguration> {
    const [result] = await db.insert(exchangeConfigurations).values(config).returning();
    return result;
  }

  async updateExchangeConfiguration(tenantId: string, updates: Partial<UpdateExchangeConfiguration>): Promise<ExchangeConfiguration | undefined> {
    const [result] = await db.update(exchangeConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(exchangeConfigurations.tenantId, tenantId))
      .returning();
    return result || undefined;
  }

  async deleteExchangeConfiguration(tenantId: string): Promise<void> {
    await db.delete(exchangeConfigurations).where(eq(exchangeConfigurations.tenantId, tenantId));
  }

  async getExchangeMailboxes(tenantId: string): Promise<ExchangeMailbox[]> {
    return db.select().from(exchangeMailboxes)
      .where(eq(exchangeMailboxes.tenantId, tenantId))
      .orderBy(desc(exchangeMailboxes.createdAt));
  }

  async getExchangeMailbox(id: string, tenantId: string): Promise<ExchangeMailbox | undefined> {
    const [mailbox] = await db.select().from(exchangeMailboxes)
      .where(and(eq(exchangeMailboxes.id, id), eq(exchangeMailboxes.tenantId, tenantId)));
    return mailbox || undefined;
  }

  async createExchangeMailbox(mailbox: InsertExchangeMailbox): Promise<ExchangeMailbox> {
    const [result] = await db.insert(exchangeMailboxes).values(mailbox).returning();
    return result;
  }

  async updateExchangeMailbox(id: string, updates: Partial<UpdateExchangeMailbox>, tenantId: string): Promise<ExchangeMailbox | undefined> {
    const [result] = await db.update(exchangeMailboxes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(exchangeMailboxes.id, id), eq(exchangeMailboxes.tenantId, tenantId)))
      .returning();
    return result || undefined;
  }

  async deleteExchangeMailbox(id: string, tenantId: string): Promise<void> {
    await db.delete(exchangeMailboxes)
      .where(and(eq(exchangeMailboxes.id, id), eq(exchangeMailboxes.tenantId, tenantId)));
  }

  async getExchangeAssignmentRules(mailboxId: string, tenantId: string): Promise<ExchangeAssignmentRule[]> {
    return db.select().from(exchangeAssignmentRules)
      .where(and(eq(exchangeAssignmentRules.mailboxId, mailboxId), eq(exchangeAssignmentRules.tenantId, tenantId)))
      .orderBy(desc(exchangeAssignmentRules.priority));
  }

  async createExchangeAssignmentRule(rule: InsertExchangeAssignmentRule): Promise<ExchangeAssignmentRule> {
    const [result] = await db.insert(exchangeAssignmentRules).values(rule).returning();
    return result;
  }

  async updateExchangeAssignmentRule(id: string, updates: Partial<InsertExchangeAssignmentRule>, tenantId: string): Promise<ExchangeAssignmentRule | undefined> {
    const [result] = await db.update(exchangeAssignmentRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(exchangeAssignmentRules.id, id), eq(exchangeAssignmentRules.tenantId, tenantId)))
      .returning();
    return result || undefined;
  }

  async deleteExchangeAssignmentRule(id: string, tenantId: string): Promise<void> {
    await db.delete(exchangeAssignmentRules)
      .where(and(eq(exchangeAssignmentRules.id, id), eq(exchangeAssignmentRules.tenantId, tenantId)));
  }

  async getExchangeEmails(tenantId: string, params?: { mailboxId?: string; ticketId?: string; limit?: number }): Promise<ExchangeEmail[]> {
    let query = db.select().from(exchangeEmails)
      .where(eq(exchangeEmails.tenantId, tenantId))
      .$dynamic();
    
    if (params?.mailboxId) {
      query = query.where(eq(exchangeEmails.mailboxId, params.mailboxId)) as typeof query;
    }
    if (params?.ticketId) {
      query = query.where(eq(exchangeEmails.ticketId, params.ticketId)) as typeof query;
    }
    query = query.orderBy(desc(exchangeEmails.receivedAt)) as typeof query;
    if (params?.limit) {
      query = query.limit(params.limit) as typeof query;
    }
    return query;
  }

  async getExchangeEmailByMessageId(tenantId: string, messageId: string): Promise<ExchangeEmail | undefined> {
    const [result] = await db.select().from(exchangeEmails)
      .where(and(eq(exchangeEmails.tenantId, tenantId), eq(exchangeEmails.messageId, messageId)));
    return result || undefined;
  }

  async createExchangeEmail(email: InsertExchangeEmail): Promise<ExchangeEmail> {
    const [result] = await db.insert(exchangeEmails).values(email).returning();
    return result;
  }

  async updateExchangeEmail(id: string, updates: Partial<InsertExchangeEmail>, tenantId: string): Promise<ExchangeEmail | undefined> {
    const [result] = await db.update(exchangeEmails)
      .set(updates)
      .where(and(eq(exchangeEmails.id, id), eq(exchangeEmails.tenantId, tenantId)))
      .returning();
    return result || undefined;
  }

  async getExchangeSyncLogs(tenantId: string, params?: { mailboxId?: string; limit?: number }): Promise<ExchangeSyncLog[]> {
    let query = db.select().from(exchangeSyncLogs)
      .where(eq(exchangeSyncLogs.tenantId, tenantId))
      .$dynamic();
    
    if (params?.mailboxId) {
      query = query.where(eq(exchangeSyncLogs.mailboxId, params.mailboxId)) as typeof query;
    }
    query = query.orderBy(desc(exchangeSyncLogs.createdAt)) as typeof query;
    if (params?.limit) {
      query = query.limit(params.limit) as typeof query;
    }
    return query;
  }

  async createExchangeSyncLog(log: InsertExchangeSyncLog): Promise<ExchangeSyncLog> {
    const [result] = await db.insert(exchangeSyncLogs).values(log).returning();
    return result;
  }

  // Email Processing Rules
  async getEmailProcessingRules(tenantId: string, mailboxId?: string): Promise<EmailProcessingRule[]> {
    if (mailboxId) {
      return db.select().from(emailProcessingRules)
        .where(and(
          eq(emailProcessingRules.tenantId, tenantId),
          or(eq(emailProcessingRules.mailboxId, mailboxId), sql`${emailProcessingRules.mailboxId} IS NULL`)
        ))
        .orderBy(desc(emailProcessingRules.priority), asc(emailProcessingRules.createdAt));
    }
    return db.select().from(emailProcessingRules)
      .where(eq(emailProcessingRules.tenantId, tenantId))
      .orderBy(desc(emailProcessingRules.priority), asc(emailProcessingRules.createdAt));
  }

  async getEmailProcessingRule(id: string, tenantId: string): Promise<EmailProcessingRule | undefined> {
    const [result] = await db.select().from(emailProcessingRules)
      .where(and(eq(emailProcessingRules.id, id), eq(emailProcessingRules.tenantId, tenantId)));
    return result || undefined;
  }

  async createEmailProcessingRule(rule: InsertEmailProcessingRule): Promise<EmailProcessingRule> {
    const [result] = await db.insert(emailProcessingRules).values(rule).returning();
    return result;
  }

  async updateEmailProcessingRule(id: string, updates: UpdateEmailProcessingRule, tenantId: string): Promise<EmailProcessingRule | undefined> {
    const [result] = await db.update(emailProcessingRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(emailProcessingRules.id, id), eq(emailProcessingRules.tenantId, tenantId)))
      .returning();
    return result || undefined;
  }

  async deleteEmailProcessingRule(id: string, tenantId: string): Promise<void> {
    await db.delete(emailProcessingRules)
      .where(and(eq(emailProcessingRules.id, id), eq(emailProcessingRules.tenantId, tenantId)));
  }
}

export const storage = new DatabaseStorage();
