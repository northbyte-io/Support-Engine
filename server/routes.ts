import type { Express, Response } from "express";
import type { Server } from "node:http";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { storage } from "./storage";
import { logger } from "./logger";
import {
  generateToken,
  generatePreAuthToken,
  verifyPreAuthToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  adminMiddleware,
  agentMiddleware,
  TOKEN_COOKIE_NAME,
  TOKEN_COOKIE_OPTIONS,
  PRE_AUTH_COOKIE_NAME,
  PRE_AUTH_COOKIE_OPTIONS,
  type AuthenticatedRequest
} from "./auth";
import { loginSchema, registerSchema, insertTicketSchema, insertCommentSchema, insertAreaSchema, insertUserSchema, insertSlaDefinitionSchema, insertSlaEscalationSchema, insertKbCategorySchema, insertKbArticleSchema, insertTicketKbLinkSchema, insertTimeEntrySchema, insertSurveySchema, insertSurveyQuestionSchema, insertSurveyResponseSchema, insertAssetCategorySchema, insertAssetSchema, insertAssetLicenseSchema, insertAssetContractSchema, insertTicketAssetSchema, insertProjectSchema, insertProjectMemberSchema, insertBoardColumnSchema, insertTicketProjectSchema, insertOrganizationSchema, insertCustomerSchema, insertCustomerLocationSchema, insertContactSchema, insertTicketContactSchema, insertCustomerActivitySchema, updateTenantBrandingSchema, insertApprovalWorkflowSchema, insertApprovalWorkflowStepSchema, insertApprovalRequestSchema, insertApprovalDecisionSchema, type InsertExchangeConfiguration, type InsertExchangeEmail, type ExchangeConfiguration, type ExchangeMailbox, type EmailProcessingRule } from "@shared/schema";
import crypto from "node:crypto";
import { generateTotpSecret, verifyTotp, generateTotpUri } from "./totp";
import { z } from "zod";
import type { GraphEmail } from "./exchange-service";

// Helper: Prüft eine einzelne Bedingung für das Rule-Matching
function checkSingleCondition(
  cond: { type: string; value: string; operator?: string },
  ctx: { senderEmail: string; senderName: string; subject: string; body: string; hasAttachments: boolean }
): boolean | null {
  const val = (cond.value || "").toLowerCase();
  switch (cond.type) {
    case "imported_emails": return true;
    case "sender_contains": return ctx.senderEmail.includes(val) || ctx.senderName.includes(val) ? null : false;
    case "subject_contains": return ctx.subject.includes(val) ? null : false;
    case "body_contains": return ctx.body.includes(val) ? null : false;
    case "has_attachment": return ctx.hasAttachments ? null : false;
    case "sender_domain": return ctx.senderEmail.endsWith(val) ? null : false;
    default: return true; // Unbekannte Typen matchen immer
  }
}

// Helper: Prüft ob eine Verarbeitungsregel auf eine E-Mail passt
function ruleMatchesEmail(rule: EmailProcessingRule, graphEmail: GraphEmail): boolean {
  let conditions: Array<{ type: string; value: string; operator?: string }> = [];
  if (rule.conditions) {
    try {
      conditions = JSON.parse(rule.conditions);
    } catch {
      conditions = [];
    }
  }
  if (conditions.length === 0 && rule.conditionType) {
    conditions = [{ type: rule.conditionType, value: rule.conditionValue || "" }];
  }
  if (conditions.length === 0) return true;

  const ctx = {
    senderEmail: graphEmail.from?.emailAddress?.address?.toLowerCase() || "",
    senderName: graphEmail.from?.emailAddress?.name?.toLowerCase() || "",
    subject: graphEmail.subject?.toLowerCase() || "",
    body: graphEmail.bodyPreview?.toLowerCase() || "",
    hasAttachments: graphEmail.hasAttachments ?? false,
  };

  for (const cond of conditions) {
    const result = checkSingleCondition(cond, ctx);
    if (result !== null) return result;
  }
  return true;
}

// ExchangeService-Interface für typsichere Übergabe
interface ExchangeServiceInterface {
  fetchEmails: (...args: unknown[]) => Promise<GraphEmail[]>;
  graphEmailToInsert: (...args: unknown[]) => unknown;
  getRawEmailContent: (...args: unknown[]) => Promise<Buffer | null>;
  markAsRead: (...args: unknown[]) => Promise<void>;
  moveEmail: (...args: unknown[]) => Promise<void>;
  deleteEmail: (...args: unknown[]) => Promise<void>;
  isConfigurationValid: (config: unknown) => boolean;
}

// Helper: Einzelne Regel-Aktion ausführen
async function applySingleRuleAction(
  ExchangeSvc: ExchangeServiceInterface,
  config: ExchangeConfiguration,
  mailboxEmail: string,
  graphEmailId: string,
  action: string,
  rule: EmailProcessingRule
): Promise<void> {
  if (action === "mark_as_read") {
    await ExchangeSvc.markAsRead(config, mailboxEmail, graphEmailId);
    logger.debug("exchange", "Als gelesen markiert", `E-Mail ${graphEmailId} als gelesen markiert (Regel: ${rule.name})`);
  } else if (action === "move_to_folder" && rule.actionFolderId) {
    await ExchangeSvc.moveEmail(config, mailboxEmail, graphEmailId, rule.actionFolderId);
    logger.debug("exchange", "E-Mail verschoben", `E-Mail ${graphEmailId} nach ${rule.actionFolderName || rule.actionFolderId} verschoben (Regel: ${rule.name})`);
  } else if (action === "archive") {
    await ExchangeSvc.moveEmail(config, mailboxEmail, graphEmailId, "archive");
    logger.debug("exchange", "E-Mail archiviert", `E-Mail ${graphEmailId} wurde archiviert (Regel: ${rule.name})`);
  } else if (action === "delete") {
    await ExchangeSvc.deleteEmail(config, mailboxEmail, graphEmailId);
    logger.debug("exchange", "E-Mail gelöscht", `E-Mail ${graphEmailId} gelöscht (Regel: ${rule.name})`);
  } else if (action === "keep_unchanged") {
    logger.debug("exchange", "Keine Aktion", `E-Mail ${graphEmailId} bleibt unverändert (Regel: ${rule.name})`);
  }
}

// Helper: Verarbeitungsregeln auf eine E-Mail anwenden
async function applyRulesToEmail(
  ExchangeSvc: ExchangeServiceInterface,
  config: ExchangeConfiguration,
  mailboxEmail: string,
  graphEmail: GraphEmail,
  activeRules: EmailProcessingRule[]
): Promise<void> {
  for (const rule of activeRules) {
    if (!ruleMatchesEmail(rule, graphEmail)) {
      logger.debug("exchange", "Regel übersprungen", `Regel "${rule.name}" passt nicht auf E-Mail ${graphEmail.id}`);
      continue;
    }

    let ruleActions: string[] = rule.actions || [];
    if (ruleActions.length === 0 && rule.actionType) {
      ruleActions = [rule.actionType];
    }

    logger.debug("exchange", "Regel angewendet", `Regel "${rule.name}" mit Aktionen: ${ruleActions.join(", ")} auf E-Mail ${graphEmail.id}`);

    for (const action of ruleActions) {
      try {
        await applySingleRuleAction(ExchangeSvc, config, mailboxEmail, graphEmail.id, action, rule);
      } catch (actionError) {
        logger.warn("exchange", "Post-Import-Aktion fehlgeschlagen", `Aktion ${action} für E-Mail ${graphEmail.id} fehlgeschlagen (Regel: ${rule.name}): ${actionError}`);
      }
    }
  }
}

// Helper: .eml-Datei als Anhang im Object Storage speichern
async function saveEmailAsEml(
  ExchangeSvc: ExchangeServiceInterface,
  config: ExchangeConfiguration,
  mailboxEmail: string,
  graphEmail: GraphEmail,
  ticket: { id: string; ticketNumber: string },
  tenantId: string
): Promise<void> {
  try {
    const rawEmailContent = await ExchangeSvc.getRawEmailContent(config, mailboxEmail, graphEmail.id);
    logger.debug("exchange", ".eml Inhalt abgerufen", `Größe: ${rawEmailContent?.length || 0} Bytes`);

    if (rawEmailContent && rawEmailContent.length > 0) {
      const objectStorage = new ObjectStorageClient();
      const displayFileName = `email_${ticket.ticketNumber}_${Date.now()}.eml`;
      const storagePath = `.private/emails/${tenantId}/${displayFileName}.b64`;
      const base64Content = rawEmailContent.toString("base64");
      await objectStorage.uploadFromText(storagePath, base64Content);
      await storage.createAttachment({
        ticketId: ticket.id,
        fileName: displayFileName,
        fileSize: rawEmailContent.length,
        mimeType: "message/rfc822",
        storagePath: storagePath,
        uploadedById: null,
      });
      logger.info("exchange", ".eml gespeichert", `E-Mail als ${displayFileName} (${rawEmailContent.length} Bytes) an Ticket ${ticket.ticketNumber} angehängt`);
    } else {
      logger.warn("exchange", ".eml leer", `Rohe E-Mail-Daten waren leer für Ticket ${ticket.ticketNumber}`);
    }
  } catch (emlError) {
    logger.warn("exchange", ".eml Speicherung fehlgeschlagen", `Konnte .eml nicht speichern: ${emlError}`);
  }
}

// Helper: Eine einzelne Graph-E-Mail verarbeiten (importieren, Ticket erstellen, Regeln anwenden)
async function processGraphEmail(
  ExchangeSvc: ExchangeServiceInterface,
  config: ExchangeConfiguration,
  mailbox: ExchangeMailbox,
  graphEmail: GraphEmail,
  tenantId: string,
  activeRules: EmailProcessingRule[]
): Promise<{ skipped: boolean; imported: boolean; ticketCreated: boolean; error?: string }> {
  try {
    const existingEmail = await storage.getExchangeEmailByMessageId(tenantId, graphEmail.id);
    if (existingEmail) {
      logger.debug("exchange", "E-Mail übersprungen", `E-Mail ${graphEmail.id} bereits importiert`);
      return { skipped: true, imported: false, ticketCreated: false };
    }

    const emailData = ExchangeSvc.graphEmailToInsert(graphEmail, mailbox.id, tenantId) as InsertExchangeEmail;
    const savedEmail = await storage.createExchangeEmail(emailData);

    const ticketTitle = graphEmail.subject || "E-Mail ohne Betreff";
    const ticketDescription = graphEmail.body?.content || graphEmail.bodyPreview || "";

    const ticket = await storage.createTicket({
      tenantId,
      title: ticketTitle,
      description: ticketDescription,
      status: "open",
      priority: mailbox.defaultPriority || "medium",
      ticketTypeId: mailbox.defaultTicketTypeId || null,
      createdById: null,
      customerId: null,
      customFieldValues: {
        emailSource: mailbox.emailAddress,
        fromAddress: graphEmail.from?.emailAddress?.address,
        fromName: graphEmail.from?.emailAddress?.name,
        originalMessageId: graphEmail.id
      }
    });

    await storage.updateExchangeEmail(savedEmail.id, { ticketId: ticket.id }, tenantId);
    await saveEmailAsEml(ExchangeSvc, config, mailbox.emailAddress, graphEmail, ticket, tenantId);

    logger.info("exchange", "Ticket erstellt", `Ticket ${ticket.ticketNumber} aus E-Mail von ${graphEmail.from?.emailAddress?.address} erstellt`);
    await applyRulesToEmail(ExchangeSvc, config, mailbox.emailAddress, graphEmail, activeRules);

    return { skipped: false, imported: true, ticketCreated: true };
  } catch (emailError) {
    logger.error("exchange", "E-Mail-Verarbeitung fehlgeschlagen", {
      description: `Fehler bei E-Mail ${graphEmail.id}`,
      cause: String(emailError),
      solution: "E-Mail-Daten prüfen und erneut versuchen"
    });
    return { skipped: false, imported: false, ticketCreated: false, error: `E-Mail ${graphEmail.subject}: ${emailError}` };
  }
}

// Helper: Ein Postfach synchronisieren (E-Mails abrufen, verarbeiten, Statistiken aktualisieren)
async function syncMailbox(
  ExchangeSvc: ExchangeServiceInterface,
  config: ExchangeConfiguration,
  mailbox: ExchangeMailbox,
  tenantId: string
): Promise<{ imported: number; tickets: number; skipped: number; errors: string[] }> {
  let mailboxImported = 0;
  let mailboxTickets = 0;
  let mailboxSkipped = 0;
  const mailboxErrors: string[] = [];
  const syncStartedAt = new Date();

  try {
    const emails = await ExchangeSvc.fetchEmails(config, mailbox);
    logger.info("exchange", "E-Mails gefunden", `${emails.length} E-Mails in ${mailbox.emailAddress} gefunden`);

    const processingRules = await storage.getEmailProcessingRules(tenantId, mailbox.id);
    const activeRules = processingRules.filter((r: EmailProcessingRule) => r.isActive);

    for (const graphEmail of emails) {
      const result = await processGraphEmail(ExchangeSvc, config, mailbox, graphEmail, tenantId, activeRules);
      if (result.skipped) {
        mailboxSkipped++;
      } else if (result.imported) {
        mailboxImported++;
        if (result.ticketCreated) mailboxTickets++;
      }
      if (result.error) mailboxErrors.push(result.error);
    }

    await storage.updateExchangeMailbox(mailbox.id, {
      lastFetchAt: new Date(),
      lastFetchEmailCount: emails.length,
      totalImportedEmails: (mailbox.totalImportedEmails || 0) + mailboxImported,
      totalCreatedTickets: (mailbox.totalCreatedTickets || 0) + mailboxTickets,
      lastFetchError: null
    }, tenantId);

    await storage.createExchangeSyncLog({
      tenantId,
      mailboxId: mailbox.id,
      syncType: "fetch",
      status: mailboxErrors.length > 0 ? "partial" : "success",
      startedAt: syncStartedAt,
      completedAt: new Date(),
      emailsFetched: mailboxImported + mailboxSkipped,
      ticketsCreated: mailboxTickets,
      errorsCount: mailboxErrors.length,
      errorMessage: mailboxErrors.length > 0 ? mailboxErrors.join("; ") : null
    });
  } catch (error) {
    const errorMsg = String(error);
    mailboxErrors.push(errorMsg);

    await storage.updateExchangeMailbox(mailbox.id, {
      lastFetchAt: new Date(),
      lastFetchError: errorMsg
    }, tenantId);

    await storage.createExchangeSyncLog({
      tenantId,
      mailboxId: mailbox.id,
      syncType: "fetch",
      status: "failed",
      startedAt: syncStartedAt,
      completedAt: new Date(),
      emailsFetched: 0,
      ticketsCreated: 0,
      errorsCount: 1,
      errorMessage: errorMsg
    });
  }

  return { imported: mailboxImported, tickets: mailboxTickets, skipped: mailboxSkipped, errors: mailboxErrors };
}

// Helper: Survey-Einladung für geschlossenes Ticket erstellen
async function triggerClosedTicketSurvey(
  tenantId: string | undefined,
  ticket: { id: string; ticketNumber: string },
  originalTicket: { createdById: string | null }
): Promise<void> {
  if (!tenantId) return;
  try {
    const activeSurvey = await storage.getActiveSurvey(tenantId);
    if (activeSurvey && originalTicket.createdById) {
      const token = crypto.randomBytes(32).toString("hex");
      await storage.createSurveyInvitation({
        tenantId,
        surveyId: activeSurvey.id,
        ticketId: ticket.id,
        userId: originalTicket.createdById,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      logger.debug("api", "Survey-Einladung erstellt", `Survey-Einladung für Ticket ${ticket.ticketNumber} erstellt`);
    }
  } catch (surveyError) {
    logger.error("api", "Error creating survey invitation", {
      description: surveyError instanceof Error ? surveyError.message : String(surveyError),
      cause: "Unbekannter Fehler",
      solution: "Fehlerursache prüfen"
    });
  }
}

// Seed-Hilfsfunktionen für Demo-Daten
async function seedDemoUsers(defaultTenant: { id: string }) {
  const adminUser = await storage.getUserByEmail("admin@demo.de");
  if (!adminUser) {
    const hashedPw = await hashPassword("admin123");
    await storage.createUser({
      email: "admin@demo.de",
      password: hashedPw,
      firstName: "Admin",
      lastName: "Benutzer",
      role: "admin",
      tenantId: defaultTenant.id,
      isActive: true,
    });
  }

  let agentUser = await storage.getUserByEmail("agent@demo.de");
  if (!agentUser) {
    const hashedPw = await hashPassword("agent123");
    agentUser = await storage.createUser({
      email: "agent@demo.de",
      password: hashedPw,
      firstName: "Max",
      lastName: "Mustermann",
      role: "agent",
      tenantId: defaultTenant.id,
      isActive: true,
    });
  }

  let customerUser = await storage.getUserByEmail("kunde@demo.de");
  if (!customerUser) {
    const hashedPw = await hashPassword("kunde123");
    customerUser = await storage.createUser({
      email: "kunde@demo.de",
      password: hashedPw,
      firstName: "Anna",
      lastName: "Schmidt",
      role: "customer",
      tenantId: defaultTenant.id,
      isActive: true,
    });
  }

  return { agentUser, customerUser };
}

async function seedDemoTicketTypesAndAreas(defaultTenant: { id: string }) {
  let ticketTypes = await storage.getTicketTypes(defaultTenant.id);
  if (ticketTypes.length === 0) {
    await storage.createTicketType({ name: "Fehler", description: "Technische Fehler melden", color: "#EF4444", tenantId: defaultTenant.id });
    await storage.createTicketType({ name: "Anfrage", description: "Allgemeine Anfragen", color: "#3B82F6", tenantId: defaultTenant.id });
    await storage.createTicketType({ name: "Verbesserung", description: "Verbesserungsvorschläge", color: "#10B981", tenantId: defaultTenant.id });
    ticketTypes = await storage.getTicketTypes(defaultTenant.id);
  }

  let areasList = await storage.getAreas(defaultTenant.id);
  if (areasList.length === 0) {
    await storage.createArea({ name: "IT-Support", description: "Technischer Support", color: "#3B82F6", tenantId: defaultTenant.id });
    await storage.createArea({ name: "Buchhaltung", description: "Finanzabteilung", color: "#10B981", tenantId: defaultTenant.id });
    await storage.createArea({ name: "Personal", description: "HR-Abteilung", color: "#8B5CF6", tenantId: defaultTenant.id });
    areasList = await storage.getAreas(defaultTenant.id);
  }

  const defaultSla = await storage.getDefaultSlaDefinition(defaultTenant.id);
  if (!defaultSla) {
    await storage.createSlaDefinition({
      tenantId: defaultTenant.id,
      name: "Standard-SLA",
      description: "Standard Service-Level-Vereinbarung",
      responseTimeLow: 480,
      responseTimeMedium: 240,
      responseTimeHigh: 60,
      responseTimeUrgent: 15,
      resolutionTimeLow: 4320,
      resolutionTimeMedium: 1440,
      resolutionTimeHigh: 480,
      resolutionTimeUrgent: 120,
      isDefault: true,
      isActive: true,
    });
  }

  return { ticketTypes, areasList };
}

async function seedDemoTickets(
  defaultTenant: { id: string },
  ticketTypes: Array<{ id: string }>,
  areasList: Array<{ id: string }>,
  agentUser: { id: string },
  customerUser: { id: string }
) {
  const existingTickets = await storage.getTickets({ tenantId: defaultTenant.id });
  if (existingTickets.length === 0 && ticketTypes.length > 0 && areasList.length > 0) {
    const ticketData = [
      { title: "Drucker funktioniert nicht", description: "Der Netzwerkdrucker im 2. Stock reagiert nicht auf Druckaufträge.", status: "open" as const, priority: "high" as const },
      { title: "E-Mail-Zugang gesperrt", description: "Nach Passwortänderung kann ich mich nicht mehr in Outlook anmelden.", status: "in_progress" as const, priority: "urgent" as const },
      { title: "Neue Software benötigt", description: "Für das Projekt benötige ich Zugang zu Adobe Creative Suite.", status: "open" as const, priority: "medium" as const },
      { title: "VPN-Verbindung instabil", description: "Die VPN-Verbindung bricht regelmäßig ab beim Homeoffice.", status: "resolved" as const, priority: "medium" as const },
      { title: "Laptop-Austausch", description: "Mein Laptop ist über 5 Jahre alt und sehr langsam.", status: "waiting" as const, priority: "low" as const },
    ];

    for (const data of ticketData) {
      const ticket = await storage.createTicket({
        ...data,
        tenantId: defaultTenant.id,
        createdById: customerUser.id,
        ticketTypeId: ticketTypes[0].id,
      });

      if (data.status !== "open") {
        await storage.createComment({
          ticketId: ticket.id,
          authorId: agentUser.id,
          content: "Vielen Dank für Ihre Anfrage. Wir bearbeiten Ihr Ticket schnellstmöglich.",
          visibility: "external",
        });
      }
    }
  }
}

async function seedDemoCustomers(defaultTenant: { id: string }) {
  const existingCustomers = await storage.getCustomers(defaultTenant.id);
  if (existingCustomers.length === 0) {
    const customerData = [
      { customerNumber: "KD-00001", name: "Mustermann GmbH", email: "kontakt@mustermann.de", phone: "+49 30 1234567", address: "Musterstraße 123", city: "Berlin", postalCode: "10115", country: "Deutschland", tenantId: defaultTenant.id },
      { customerNumber: "KD-00002", name: "Beispiel AG", email: "info@beispiel-ag.de", phone: "+49 89 9876543", address: "Beispielweg 45", city: "München", postalCode: "80331", country: "Deutschland", tenantId: defaultTenant.id },
      { customerNumber: "KD-00003", name: "Schmidt & Partner", email: "kontakt@schmidt-partner.de", phone: "+49 40 5555555", address: "Partnerplatz 7", city: "Hamburg", postalCode: "20095", country: "Deutschland", tenantId: defaultTenant.id },
    ];
    for (const data of customerData) {
      await storage.createCustomer(data, defaultTenant.id);
    }
  }
  return await storage.getCustomers(defaultTenant.id);
}

async function seedDemoContactsAndAssets(defaultTenant: { id: string }, customers: Array<{ id: string }>) {
  const existingContacts = await storage.getContacts(defaultTenant.id);
  if (existingContacts.length === 0 && customers.length > 0) {
    const contactData = [
      { firstName: "Hans", lastName: "Müller", email: "h.mueller@mustermann.de", phone: "+49 30 1234568", position: "IT-Leiter", department: "IT", customerId: customers[0].id, tenantId: defaultTenant.id },
      { firstName: "Petra", lastName: "Weber", email: "p.weber@mustermann.de", phone: "+49 30 1234569", position: "Assistenz", department: "Verwaltung", customerId: customers[0].id, tenantId: defaultTenant.id },
      { firstName: "Thomas", lastName: "Fischer", email: "t.fischer@beispiel-ag.de", phone: "+49 89 9876544", position: "Geschäftsführer", department: "Geschäftsleitung", customerId: customers[1].id, tenantId: defaultTenant.id },
    ];
    for (const data of contactData) {
      await storage.createContact(data, defaultTenant.id);
    }
  }

  let assetCategories = await storage.getAssetCategories(defaultTenant.id);
  if (assetCategories.length === 0) {
    await storage.createAssetCategory({ name: "Computer", description: "PCs und Laptops", assetType: "hardware" }, defaultTenant.id);
    await storage.createAssetCategory({ name: "Drucker", description: "Drucker und Scanner", assetType: "hardware" }, defaultTenant.id);
    await storage.createAssetCategory({ name: "Software", description: "Software-Lizenzen", assetType: "software" }, defaultTenant.id);
    assetCategories = await storage.getAssetCategories(defaultTenant.id);
  }

  const existingAssets = await storage.getAssets(defaultTenant.id);
  if (existingAssets.length === 0 && customers.length > 0 && assetCategories.length > 0) {
    const assetData = [
      { assetNumber: "AST-00001", name: "Dell Latitude 5540", assetType: "hardware" as const, assetStatus: "active" as const, serialNumber: "DELL-1234567890", categoryId: assetCategories[0].id, customerId: customers[0].id, tenantId: defaultTenant.id },
      { assetNumber: "AST-00002", name: "HP LaserJet Pro", assetType: "hardware" as const, assetStatus: "active" as const, serialNumber: "HP-9876543210", categoryId: assetCategories[1].id, customerId: customers[0].id, tenantId: defaultTenant.id },
      { assetNumber: "AST-00003", name: "Microsoft Office 365", assetType: "software" as const, assetStatus: "active" as const, categoryId: assetCategories[2].id, customerId: customers[1].id, tenantId: defaultTenant.id },
    ];
    for (const data of assetData) {
      await storage.createAsset(data, defaultTenant.id);
    }
  }
}

// Seed default data for demo
async function seedDefaultData() {
  if (process.env.NODE_ENV !== "development") return;
  logger.info("system", "System wird gestartet", "Der Server wird initialisiert und Standarddaten werden geladen");
  try {
    let defaultTenant = await storage.getTenantBySlug("default");
    defaultTenant ??= await storage.createTenant({
      name: "Demo Unternehmen",
      slug: "default",
      primaryColor: "#3B82F6",
      isActive: true,
    });

    const { agentUser, customerUser } = await seedDemoUsers(defaultTenant);
    const { ticketTypes, areasList } = await seedDemoTicketTypesAndAreas(defaultTenant);
    await seedDemoTickets(defaultTenant, ticketTypes, areasList, agentUser, customerUser);
    const customers = await seedDemoCustomers(defaultTenant);
    await seedDemoContactsAndAssets(defaultTenant, customers);

    logger.info("api", "Demo-Daten erfolgreich erstellt", "");
  } catch (error) {
    logger.error("api", "Fehler beim Erstellen der Demo-Daten", { description: error instanceof Error ? error.message : String(error), cause: "Unbekannter Fehler", solution: "Fehlerursache prüfen" });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[äÄ]/g, "ae")
    .replaceAll(/[öÖ]/g, "oe")
    .replaceAll(/[üÜ]/g, "ue")
    .replaceAll("ß", "ss")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
    .slice(0, 100);
}

// Prüft, ob eine Ressource zum Mandanten des anfragenden Nutzers gehört.
// Gibt false zurück und sendet 403, wenn der Zugriff verweigert wird.
function assertTenantAccess(
  resource: { tenantId?: string | null },
  req: AuthenticatedRequest,
  res: Response
): boolean {
  if (resource.tenantId !== req.tenantId) {
    res.status(403).json({ message: "Zugriff verweigert" });
    return false;
  }
  return true;
}

async function requireOwnedResource<T extends { tenantId?: string | null }>(
  fetcher: () => Promise<T | undefined>,
  req: AuthenticatedRequest,
  res: Response,
  notFoundMessage: string
): Promise<T | undefined> {
  const resource = await fetcher();
  if (!resource) {
    res.status(404).json({ message: notFoundMessage });
    return undefined;
  }
  if (!assertTenantAccess(resource, req, res)) return undefined;
  return resource;
}

// Helper: Einheitliche API-Fehlerbehandlung für alle Endpunkte
function handleApiError(res: Response, error: unknown, context: string): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
    return;
  }
  logger.error("api", `${context}`, {
    description: error instanceof Error ? error.message : String(error),
    cause: "Unbekannter Fehler",
    solution: "Fehlerursache prüfen"
  });
  res.status(500).json({ message: "Interner Serverfehler" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed default data on startup
  await seedDefaultData();
  
  // AGPL-3.0 License endpoints (required for network use)
  app.get("/api/license", async (_req, res) => {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const licensePath = path.join(process.cwd(), "LICENSE");
      const licenseText = fs.readFileSync(licensePath, "utf-8");
      res.type("text/plain").send(licenseText);
    } catch {
      res.status(500).json({ message: "Lizenz konnte nicht geladen werden" });
    }
  });

  app.get("/api/source", (_req, res) => {
    res.json({
      license: "AGPL-3.0",
      repository: "https://github.com/northbyte-io/Support-Engine",
      notice: "Dieses Programm ist freie Software unter der GNU Affero General Public License v3.0. Der Quellcode ist verfügbar unter der oben genannten URL.",
      endpoints: {
        license: "/api/license",
        source: "/api/source"
      }
    });
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    // BSI ORP.4.A3 — Registrierung nur wenn explizit aktiviert (ALLOW_REGISTRATION=true)
    if (process.env.ALLOW_REGISTRATION !== "true") {
      return res.status(403).json({ message: "Selbstregistrierung ist deaktiviert. Bitte einen Administrator kontaktieren." });
    }

    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits registriert" });
      }

      // Get default tenant for new registrations
      let tenantId = data.tenantId || null;
      if (!tenantId) {
        const defaultTenant = await storage.getTenantBySlug("default");
        tenantId = defaultTenant?.id || null;
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: tenantId,
        role: "customer",
        isActive: true,
      });

      const token = generateToken(user);
      res.cookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_OPTIONS);
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      handleApiError(res, error, "Register error");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        logger.security("auth", "Fehlgeschlagener Anmeldeversuch", `Anmeldeversuch mit unbekannter E-Mail-Adresse`, {});
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      // BSI ORP.4.A9 — Kontosperre nach wiederholten Fehlversuchen prüfen
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        logger.security("auth", "Anmeldeversuch auf gesperrtem Konto", `Konto ist bis ${user.lockedUntil.toISOString()} gesperrt`, {
          entityType: "user",
          entityId: user.id,
          tenantId: user.tenantId || undefined,
          userId: user.id,
        });
        return res.status(423).json({ message: "Konto vorübergehend gesperrt. Bitte später erneut versuchen." });
      }

      const validPassword = await comparePassword(data.password, user.password);
      if (!validPassword) {
        await storage.incrementFailedLoginAttempts(user.id);
        logger.security("auth", "Fehlgeschlagener Anmeldeversuch", `Falsches Passwort für Benutzer eingegeben`, {
          entityType: "user",
          entityId: user.id,
          tenantId: user.tenantId || undefined,
          userId: user.id,
        });
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      if (!user.isActive) {
        logger.security("auth", "Anmeldeversuch deaktiviertes Konto", `Benutzer versuchte sich anzumelden, aber das Konto ist deaktiviert`, {
          entityType: "user",
          entityId: user.id,
          tenantId: user.tenantId || undefined,
          userId: user.id,
        });
        return res.status(401).json({ message: "Konto ist deaktiviert" });
      }

      await storage.resetFailedLoginAttempts(user.id);

      // BSI ORP.4.A12 — TOTP-Zweifaktorauthentifizierung prüfen
      if (user.totpEnabled) {
        const preAuthToken = generatePreAuthToken(user.id);
        res.cookie(PRE_AUTH_COOKIE_NAME, preAuthToken, PRE_AUTH_COOKIE_OPTIONS);
        return res.json({ requiresTotp: true });
      }

      // lastLoginAt is excluded from InsertUser but valid in DB — cast required
      await storage.updateUser(user.id, { lastLoginAt: new Date() } as Parameters<typeof storage.updateUser>[1]);

      logger.success("auth", "Erfolgreiche Anmeldung", `Benutzer ${user.firstName} ${user.lastName} hat sich erfolgreich angemeldet`, {
        entityType: "user",
        entityId: user.id,
        tenantId: user.tenantId || undefined,
        userId: user.id,
      });

      const token = generateToken(user);
      res.cookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_OPTIONS);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      logger.error("auth", "Anmeldefehler", {
        description: "Ein unerwarteter Fehler ist bei der Anmeldung aufgetreten",
        cause: error instanceof Error ? error.message : "Unbekannter Fehler",
        solution: "Überprüfen Sie die Serverprotokolle und stellen Sie sicher, dass die Datenbank erreichbar ist",
      });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      handleApiError(res, error, "Get me error");
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(TOKEN_COOKIE_NAME, { path: TOKEN_COOKIE_OPTIONS.path });
    res.clearCookie(PRE_AUTH_COOKIE_NAME, { path: PRE_AUTH_COOKIE_OPTIONS.path });
    res.status(204).send();
  });

  // TOTP / Zweifaktorauthentifizierung (BSI ORP.4.A12)

  // Schritt 1 beim Login: TOTP-Code bestätigen und vollständiges JWT ausstellen
  app.post("/api/auth/totp/confirm", async (req, res) => {
    try {
      const preAuthToken = (req.headers.cookie ?? "")
        .split(";")
        .find(c => c.trim().startsWith(`${PRE_AUTH_COOKIE_NAME}=`))
        ?.split("=").slice(1).join("=");

      if (!preAuthToken) return res.status(401).json({ message: "Kein Pre-Auth-Token vorhanden" });

      const payload = verifyPreAuthToken(preAuthToken);
      if (!payload) return res.status(401).json({ message: "Pre-Auth-Token ungültig oder abgelaufen" });

      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ message: "TOTP-Code ist erforderlich" });

      const user = await storage.getUser(payload.userId);
      if (!user || !user.totpEnabled || !user.totpSecret) {
        return res.status(401).json({ message: "2FA nicht aktiviert" });
      }

      if (!verifyTotp(code, user.totpSecret)) {
        logger.security("auth", "Fehlgeschlagener TOTP-Versuch", `Ungültiger TOTP-Code eingegeben`, {
          entityType: "user", entityId: user.id, tenantId: user.tenantId || undefined, userId: user.id,
        });
        return res.status(401).json({ message: "Ungültiger TOTP-Code" });
      }

      res.clearCookie(PRE_AUTH_COOKIE_NAME, { path: PRE_AUTH_COOKIE_OPTIONS.path });
      await storage.updateUser(user.id, { lastLoginAt: new Date() } as Parameters<typeof storage.updateUser>[1]);

      logger.success("auth", "Erfolgreiche Anmeldung (2FA)", `Benutzer ${user.firstName} ${user.lastName} hat sich mit 2FA angemeldet`, {
        entityType: "user", entityId: user.id, tenantId: user.tenantId || undefined, userId: user.id,
      });

      const token = generateToken(user);
      res.cookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_OPTIONS);
      res.json({ user: { ...user, password: undefined, totpSecret: undefined } });
    } catch (error) {
      handleApiError(res, error, "TOTP confirm error");
    }
  });

  // 2FA einrichten: generiert ein neues Secret und gibt die otpauth-URI zurück
  app.post("/api/auth/totp/setup", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });

      const secret = generateTotpSecret();
      const otpauthUrl = generateTotpUri(secret, user.email);

      // Secret vorläufig speichern (noch nicht aktiviert, totpEnabled bleibt false)
      await storage.updateUser(user.id, { totpSecret: secret } as Parameters<typeof storage.updateUser>[1]);

      res.json({ secret, otpauthUrl });
    } catch (error) {
      handleApiError(res, error, "TOTP setup error");
    }
  });

  // 2FA aktivieren: TOTP-Code gegen das vorläufige Secret verifizieren
  app.post("/api/auth/totp/enable", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ message: "TOTP-Code ist erforderlich" });

      const user = await storage.getUser(req.user!.id);
      if (!user || !user.totpSecret) {
        return res.status(400).json({ message: "Bitte zuerst /api/auth/totp/setup aufrufen" });
      }

      if (!verifyTotp(code, user.totpSecret)) {
        return res.status(401).json({ message: "Ungültiger TOTP-Code — bitte erneut versuchen" });
      }

      await storage.updateUser(user.id, { totpEnabled: true } as Parameters<typeof storage.updateUser>[1]);
      res.json({ message: "Zwei-Faktor-Authentifizierung wurde aktiviert" });
    } catch (error) {
      handleApiError(res, error, "TOTP enable error");
    }
  });

  // 2FA deaktivieren: erfordert aktuellen TOTP-Code zur Bestätigung
  app.post("/api/auth/totp/disable", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ message: "TOTP-Code ist erforderlich" });

      const user = await storage.getUser(req.user!.id);
      if (!user || !user.totpEnabled || !user.totpSecret) {
        return res.status(400).json({ message: "2FA ist nicht aktiviert" });
      }

      if (!verifyTotp(code, user.totpSecret)) {
        return res.status(401).json({ message: "Ungültiger TOTP-Code" });
      }

      await storage.updateUser(user.id, { totpEnabled: false, totpSecret: null } as Parameters<typeof storage.updateUser>[1]);
      res.json({ message: "Zwei-Faktor-Authentifizierung wurde deaktiviert" });
    } catch (error) {
      handleApiError(res, error, "TOTP disable error");
    }
  });

  // Dashboard Routes
  app.get("/api/dashboard/stats", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenantId);
      res.json(stats);
    } catch (error) {
      handleApiError(res, error, "Dashboard stats error");
    }
  });

  app.get("/api/dashboard/workload", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const workload = await storage.getAgentWorkload(req.tenantId);
      res.json(workload);
    } catch (error) {
      handleApiError(res, error, "Workload error");
    }
  });

  // ─── Report Routes ────────────────────────────────────────────────────────
  function parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
    const now = new Date();
    const toDate = to ? new Date(to) : new Date(now);
    toDate.setHours(23, 59, 59, 999);
    const fromDate = from ? new Date(from) : new Date(now);
    if (!from) fromDate.setDate(fromDate.getDate() - 30);
    fromDate.setHours(0, 0, 0, 0);
    return { from: fromDate, to: toDate };
  }

  // Global Search
  app.get("/api/search", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q || q.length < 2) {
        return res.json({ tickets: [], articles: [], customers: [], organizations: [], contacts: [], total: 0 });
      }
      const results = await storage.globalSearch(req.tenantId!, q);
      res.json(results);
    } catch (error) {
      handleApiError(res, error, "Global search error");
    }
  });

  app.get("/api/reports/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = parseDateRange(req.query.from as string, req.query.to as string);
      const data = await storage.getTicketReport(req.tenantId!, from, to);
      res.json(data);
    } catch (error) { handleApiError(res, error, "Ticket report error"); }
  });

  app.get("/api/reports/sla", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = parseDateRange(req.query.from as string, req.query.to as string);
      const data = await storage.getSlaReport(req.tenantId!, from, to);
      res.json(data);
    } catch (error) { handleApiError(res, error, "SLA report error"); }
  });

  app.get("/api/reports/time", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { from, to } = parseDateRange(req.query.from as string, req.query.to as string);
      const data = await storage.getTimeReport(req.tenantId!, from, to);
      res.json(data);
    } catch (error) { handleApiError(res, error, "Time report error"); }
  });

  app.get("/api/reports/export", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const type = (req.query.type as string) || "tickets";
      const format = (req.query.format as string) || "csv";
      const { from, to } = parseDateRange(req.query.from as string, req.query.to as string);
      const dateLabel = `${from.toISOString().split("T")[0]}_${to.toISOString().split("T")[0]}`;
      const filename = `bericht-${type}-${dateLabel}`;

      type Row = Record<string, string | number | boolean | null>;
      let rows: Row[] = [];
      let sheetTitle = "";

      if (type === "tickets") {
        const data = await storage.getTicketReport(req.tenantId!, from, to);
        sheetTitle = "Ticket-Analyse";
        rows = data.byDay.map(r => ({
          "Datum": r.date,
          "Gesamt": r.total,
          "Offen": r.open,
          "Gelöst": r.resolved,
        }));
      } else if (type === "sla") {
        const data = await storage.getSlaReport(req.tenantId!, from, to);
        sheetTitle = "SLA-Performance";
        rows = data.byDay.map(r => ({
          "Datum": r.date,
          "Gesamt": r.total,
          "Eingehalten": r.compliant,
          "Verletzt": r.breached,
        }));
      } else if (type === "time") {
        const data = await storage.getTimeReport(req.tenantId!, from, to);
        sheetTitle = "Zeiterfassung";
        rows = data.byAgent.map(r => ({
          "Agent": r.agentName,
          "Gesamt (Min)": r.totalMinutes,
          "Abrechenbar (Min)": r.billableMinutes,
          "Gesamt (Std)": `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m`,
          "Abrechenbar (Std)": `${Math.floor(r.billableMinutes / 60)}h ${r.billableMinutes % 60}m`,
        }));
      } else if (type === "agents") {
        const data = await storage.getTicketReport(req.tenantId!, from, to);
        sheetTitle = "Agenten-Performance";
        rows = data.byAgent.map(r => ({
          "Agent": r.agentName,
          "Zugewiesen": r.assigned,
          "Gelöst": r.resolved,
          "Lösungsrate (%)": r.assigned > 0 ? Math.round((r.resolved / r.assigned) * 100) : 0,
        }));
      }

      if (format === "csv") {
        if (rows.length === 0) { res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.send("\uFEFF"); return; }
        const headers = Object.keys(rows[0]);
        const csvRows = rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";"));
        const csv = [headers.join(";"), ...csvRows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
        res.send("\uFEFF" + csv);

      } else if (format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
        res.send(buf);

      } else if (format === "pdf") {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const chunks: Buffer[] = [];
        doc.on("data", (c: Buffer) => chunks.push(c));
        doc.on("end", () => {
          const buf = Buffer.concat(chunks);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
          res.send(buf);
        });

        doc.fontSize(18).font("Helvetica-Bold").text("Support-Engine Bericht", { align: "left" });
        doc.fontSize(12).font("Helvetica").text(`${sheetTitle} · ${from.toLocaleDateString("de-DE")} – ${to.toLocaleDateString("de-DE")}`, { align: "left" });
        doc.moveDown();

        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          const colWidth = Math.floor((doc.page.width - 80) / headers.length);
          const rowH = 20;
          let y = doc.y;

          // Header row
          doc.font("Helvetica-Bold").fontSize(9);
          headers.forEach((h, i) => {
            doc.rect(40 + i * colWidth, y, colWidth, rowH).fillAndStroke("#1e2a4a", "#1e2a4a");
            doc.fillColor("white").text(h, 43 + i * colWidth, y + 5, { width: colWidth - 6, lineBreak: false });
          });
          doc.fillColor("black");
          y += rowH;

          // Data rows
          doc.font("Helvetica").fontSize(8);
          rows.forEach((row, ri) => {
            if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
            const bg = ri % 2 === 0 ? "#f8f9fb" : "white";
            headers.forEach((h, i) => {
              doc.rect(40 + i * colWidth, y, colWidth, rowH).fillAndStroke(bg, "#e2e8f0");
              doc.fillColor("black").text(String(row[h] ?? ""), 43 + i * colWidth, y + 5, { width: colWidth - 6, lineBreak: false });
            });
            y += rowH;
          });
        } else {
          doc.text("Keine Daten für den gewählten Zeitraum.");
        }
        doc.end();

      } else if (format === "html") {
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        const thHtml = headers.map(h => `<th>${h}</th>`).join("");
        const tdHtml = rows.map(row =>
          `<tr>${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`
        ).join("\n");
        const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${sheetTitle} – Support-Engine</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 32px; color: #0f172a; background: #fff; }
  h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
  p { color: #64748b; margin-bottom: 24px; font-size: .9rem; }
  table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  thead tr { background: #1e2a4a; color: white; }
  th, td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
  tbody tr:nth-child(even) { background: #f8f9fb; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Support-Engine Bericht – ${sheetTitle}</h1>
<p>Zeitraum: ${from.toLocaleDateString("de-DE")} – ${to.toLocaleDateString("de-DE")} · Exportiert: ${new Date().toLocaleString("de-DE")}</p>
<table>
  <thead><tr>${thHtml}</tr></thead>
  <tbody>${tdHtml}</tbody>
</table>
</body>
</html>`;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.html"`);
        res.send(html);
      } else {
        res.status(400).json({ error: "Ungültiges Format. Erlaubt: csv, xlsx, pdf, html" });
      }
    } catch (error) { handleApiError(res, error, "Report export error"); }
  });
  // ──────────────────────────────────────────────────────────────────────────

  // Ticket Routes
  app.get("/api/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rawLimit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      let limit: number | undefined;
      if (rawLimit !== undefined) {
        limit = Number.isNaN(rawLimit) ? 50 : Math.min(rawLimit, 1000);
      }
      const tickets = await storage.getTickets({
        tenantId: req.tenantId,
        limit,
      });
      res.json(tickets);
    } catch (error) {
      handleApiError(res, error, "Get tickets error");
    }
  });

  app.get("/api/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      res.json(ticket);
    } catch (error) {
      handleApiError(res, error, "Get ticket error");
    }
  });

  app.post("/api/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketSchema.parse({
        ...req.body,
        tenantId: req.tenantId || "default",
        createdById: req.user!.id,
      });

      const ticket = await storage.createTicket(data);

      // Handle assignees — single batch insert instead of one per assignee
      if (req.body.assigneeIds && Array.isArray(req.body.assigneeIds)) {
        const assigneeRows = (req.body.assigneeIds as string[]).map((userId) => ({
          ticketId: ticket.id,
          userId,
          isPrimary: false,
        }));
        await storage.addTicketAssignees(assigneeRows);
      }

      logger.success("ticket", "Ticket erstellt", `Neues Ticket "${data.title}" wurde erfolgreich erstellt`, {
        entityType: "ticket",
        entityId: ticket.id,
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { priority: data.priority, status: data.status },
      });

      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      logger.error("ticket", "Fehler beim Erstellen eines Tickets", {
        description: "Das Ticket konnte nicht erstellt werden",
        cause: error instanceof Error ? error.message : "Unbekannter Fehler",
        solution: "Überprüfen Sie die Eingabedaten und stellen Sie sicher, dass alle Pflichtfelder ausgefüllt sind",
      }, {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
      });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Get original ticket to check status change
      const originalTicket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!originalTicket) return;

      const previousStatus = originalTicket.status;
      
      // Update with tenant isolation enforced at storage level
      const ticket = await storage.updateTicket(req.params.id, req.body, req.tenantId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }

      // Wenn Ticket auf "closed" gesetzt wurde, Survey-Einladung erstellen
      if (previousStatus !== "closed" && ticket.status === "closed") {
        await triggerClosedTicketSurvey(req.tenantId, ticket, originalTicket);
      }

      res.json(ticket);
    } catch (error) {
      handleApiError(res, error, "Update ticket error");
    }
  });

  app.delete("/api/tickets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Soft-delete with tenant isolation enforced at storage level
      await storage.deleteTicket(req.params.id, req.tenantId);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete ticket error");
    }
  });

  // Admin-only hard delete — permanently removes ticket and all related data
  app.delete("/api/tickets/:id/hard", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      await storage.hardDeleteTicket(req.params.id, req.tenantId);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Hard delete ticket error");
    }
  });

  // Ticket Attachments - Liste abrufen
  app.get("/api/tickets/:id/attachments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      const ticketAttachments = await storage.getAttachments(req.params.id);
      res.json(ticketAttachments);
    } catch (error) {
      handleApiError(res, error, "Get attachments error");
    }
  });

  // Attachment herunterladen
  app.get("/api/attachments/:id/download", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const attachment = await storage.getAttachment(req.params.id);
      if (!attachment) {
        return res.status(404).json({ message: "Anhang nicht gefunden" });
      }
      
      // Prüfen ob der Benutzer Zugriff auf das Ticket hat
      if (attachment.ticketId) {
        const ticket = await storage.getTicket(attachment.ticketId);
        if (!ticket || ticket.tenantId !== req.tenantId) {
          return res.status(403).json({ message: "Zugriff verweigert" });
        }
      }
      
      // Datei aus Object Storage abrufen
      const objectStorage = new ObjectStorageClient();
      
      // Prüfen ob die Datei base64-kodiert ist (.b64 Endung)
      const isBase64Encoded = attachment.storagePath.endsWith(".b64");
      let buffer: Buffer;
      
      if (isBase64Encoded) {
        // Base64-kodierte Datei als Text laden und dekodieren
        const fileContent = await objectStorage.downloadAsText(attachment.storagePath);
        
        if (!fileContent.ok) {
          return res.status(404).json({ message: "Datei nicht gefunden" });
        }
        
        // Base64 dekodieren zu Buffer
        buffer = Buffer.from(fileContent.value, "base64");
      } else {
        // Normale Binärdatei laden
        const fileContent = await objectStorage.downloadAsBytes(attachment.storagePath);
        
        if (!fileContent.ok) {
          return res.status(404).json({ message: "Datei nicht gefunden" });
        }
        
        buffer = Buffer.from(fileContent.value as unknown as ArrayBuffer);
      }
      
      const safeName = attachment.fileName.replaceAll(/["\r\n]/g, "_");
      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      handleApiError(res, error, "Download attachment error");
    }
  });

  // Ticket Comments
  app.post("/api/tickets/:id/comments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // First check tenant isolation
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;

      const data = insertCommentSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        authorId: req.user!.id,
      });

      const comment = await storage.createComment(data);

      // Parse @mentions from comment content
      const mentionPattern = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\w+)/g;
      const mentionMatches = data.content.match(mentionPattern) || [];
      const tenantUsers = await storage.getUsers(req.tenantId);
      
      for (const mention of mentionMatches) {
        const mentionText = mention.substring(1); // Remove @ prefix
        
        // Find user by email or by first name
        const mentionedUser = tenantUsers.find(u => 
          u.email.toLowerCase() === mentionText.toLowerCase() ||
          u.firstName.toLowerCase() === mentionText.toLowerCase() ||
          `${u.firstName}${u.lastName}`.toLowerCase() === mentionText.toLowerCase()
        );
        
        if (mentionedUser && mentionedUser.id !== req.user!.id) {
          // Create mention record
          await storage.createMention({
            commentId: comment.id,
            mentionedUserId: mentionedUser.id,
          });
          
          // Create notification for mentioned user
          await storage.createNotification({
            tenantId: req.tenantId,
            userId: mentionedUser.id,
            type: "mention",
            title: "Sie wurden erwähnt",
            message: `${req.user!.firstName} ${req.user!.lastName} hat Sie in Ticket #${ticket.ticketNumber} erwähnt`,
            ticketId: ticket.id,
            commentId: comment.id,
            actorId: req.user!.id,
            isRead: false,
          });
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      handleApiError(res, error, "Create comment error");
    }
  });

  // Time Tracking - Active Timers
  app.get("/api/timers", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const timers = await storage.getActiveTimers(req.user!.id, req.tenantId!);
      res.json(timers);
    } catch (error) {
      handleApiError(res, error, "Get timers error");
    }
  });

  app.get("/api/tickets/:id/timer", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const timer = await storage.getActiveTimer(req.params.id, req.user!.id, req.tenantId!);
      res.json(timer || null);
    } catch (error) {
      handleApiError(res, error, "Get timer error");
    }
  });

  app.post("/api/tickets/:id/timer/start", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      const timer = await storage.startTimer(req.params.id, req.user!.id, req.tenantId ?? "");
      logger.info("ticket", "Timer gestartet", `Timer für Ticket ${ticket.ticketNumber} gestartet`, {
        metadata: { ticketId: req.params.id },
        userId: req.user!.id,
      });
      res.status(201).json(timer);
    } catch (error) {
      if (error instanceof Error && error.message.includes("läuft bereits")) {
        return res.status(400).json({ message: error.message });
      }
      handleApiError(res, error, "Start timer error");
    }
  });

  app.post("/api/tickets/:id/timer/pause", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const timer = await storage.pauseTimer(req.params.id, req.user!.id, req.tenantId!);
      if (!timer) {
        return res.status(404).json({ message: "Timer nicht gefunden" });
      }
      res.json(timer);
    } catch (error) {
      handleApiError(res, error, "Pause timer error");
    }
  });

  app.post("/api/tickets/:id/timer/resume", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const timer = await storage.resumeTimer(req.params.id, req.user!.id, req.tenantId!);
      if (!timer) {
        return res.status(404).json({ message: "Timer nicht gefunden" });
      }
      res.json(timer);
    } catch (error) {
      handleApiError(res, error, "Resume timer error");
    }
  });

  app.post("/api/tickets/:id/timer/stop", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await storage.stopTimer(req.params.id, req.user!.id, req.tenantId!);
      if (!result) {
        return res.status(404).json({ message: "Timer nicht gefunden" });
      }
      const ticket = await storage.getTicket(req.params.id);
      logger.info("ticket", "Timer gestoppt", `Timer für Ticket ${ticket?.ticketNumber || req.params.id} gestoppt`, {
        metadata: { ticketId: req.params.id, durationMs: result.durationMs },
        userId: req.user!.id,
      });
      const stoppedAt = new Date();
      res.json({
        timer: result.timer,
        durationMs: result.durationMs,
        durationMinutes: Math.round(result.durationMs / 60000),
        stoppedAt: stoppedAt.toISOString(),
      });
    } catch (error) {
      handleApiError(res, error, "Stop timer error");
    }
  });

  app.delete("/api/tickets/:id/timer", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTimer(req.params.id, req.user!.id, req.tenantId!);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete timer error");
    }
  });

  // Time Tracking - Work Entries
  app.get("/api/tickets/:id/work-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      const entries = await storage.getWorkEntries(req.params.id, req.tenantId ?? "");
      res.json(entries);
    } catch (error) {
      handleApiError(res, error, "Get work entries error");
    }
  });

  app.post("/api/tickets/:id/work-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      
      const { description, startTime, endTime, durationMinutes, pausedMinutes, isBillable } = req.body;
      
      const entry = await storage.createWorkEntry({
        ticketId: req.params.id,
        userId: req.user!.id,
        tenantId: req.tenantId ?? "",
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes,
        pausedMinutes: pausedMinutes || 0,
        isBillable: isBillable !== false,
      });
      
      logger.info("ticket", "Arbeitseintrag erstellt", `Arbeitseintrag für Ticket ${ticket.ticketNumber} erstellt (${durationMinutes} min)`, {
        metadata: { ticketId: req.params.id, durationMinutes },
        userId: req.user!.id,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      handleApiError(res, error, "Create work entry error");
    }
  });

  app.patch("/api/work-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { description, isBillable } = req.body;
      const entry = await storage.updateWorkEntry(req.params.id, { description, isBillable }, req.tenantId!);
      if (!entry) {
        return res.status(404).json({ message: "Arbeitseintrag nicht gefunden" });
      }
      res.json(entry);
    } catch (error) {
      handleApiError(res, error, "Update work entry error");
    }
  });

  app.delete("/api/work-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteWorkEntry(req.params.id, req.tenantId!);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete work entry error");
    }
  });

  // Ticket Types
  app.get("/api/ticket-types", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const types = await storage.getTicketTypes(req.tenantId);
      res.json(types);
    } catch (error) {
      handleApiError(res, error, "Get ticket types error");
    }
  });

  // Tenant Branding
  app.get("/api/tenant/branding", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ message: "Mandant nicht gefunden" });
      }
      const tenant = await storage.getTenant(req.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Mandant nicht gefunden" });
      }
      res.json(tenant);
    } catch (error) {
      logger.error("api", "Fehler beim Abrufen des Mandanten-Brandings", {
        description: "Das Mandanten-Branding konnte nicht abgerufen werden",
        cause: error instanceof Error ? error.message : "Unbekannter Fehler",
        solution: "Überprüfen Sie die Mandanten-ID",
      });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/tenant/branding", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ message: "Mandant nicht gefunden" });
      }
      
      const data = updateTenantBrandingSchema.parse(req.body);
      const updatedTenant = await storage.updateTenantBranding(req.tenantId, data);
      
      if (!updatedTenant) {
        return res.status(404).json({ message: "Mandant nicht gefunden" });
      }

      logger.info("system", "Mandanten-Branding aktualisiert", `Das Branding für Mandant wurde erfolgreich aktualisiert`, {
        tenantId: req.tenantId,
        userId: req.user!.id,
      });

      res.json(updatedTenant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      logger.error("system", "Fehler beim Aktualisieren des Mandanten-Brandings", {
        description: "Das Mandanten-Branding konnte nicht aktualisiert werden",
        cause: error instanceof Error ? error.message : "Unbekannter Fehler",
        solution: "Überprüfen Sie die Eingabedaten",
      });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get current tenant info (public, for branding on login page etc.)
  app.get("/api/tenant/public/:slug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.slug);
      if (!tenant?.isActive) {
        return res.status(404).json({ message: "Mandant nicht gefunden" });
      }
      // Return only public branding info
      res.json({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        logoLight: tenant.logoLight,
        logoDark: tenant.logoDark,
        favicon: tenant.favicon,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        accentColor: tenant.accentColor,
        fontFamily: tenant.fontFamily,
        companyWebsite: tenant.companyWebsite,
        supportEmail: tenant.supportEmail,
        supportPhone: tenant.supportPhone,
      });
    } catch (error) {
      handleApiError(res, error, "Get public tenant error");
    }
  });

  // Users
  app.get("/api/users", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? Number.parseInt(req.query.offset as string, 10) : undefined;
      const users = await storage.getUsers(req.tenantId, { limit, offset });
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      handleApiError(res, error, "Get users error");
    }
  });

  app.post("/api/users", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        tenantId: req.tenantId || null,
      });

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits registriert" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      handleApiError(res, error, "Create user error");
    }
  });

  app.delete("/api/users/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const target = await storage.getUser(id);
      if (!target || target.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Eigenes Konto darf nicht gelöscht werden
      if (target.id === req.user?.id) {
        return res.status(400).json({ message: "Das eigene Konto kann nicht gelöscht werden" });
      }

      const anonymized = await storage.anonymizeUser(id);
      if (!anonymized) {
        return res.status(500).json({ message: "Anonymisierung fehlgeschlagen" });
      }

      res.json({ message: "Benutzer wurde anonymisiert und deaktiviert", id });
    } catch (error) {
      handleApiError(res, error, "Delete user error");
    }
  });

  // DSGVO Art. 20 — Datenportabilität
  app.get("/api/users/:id/export", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Nur Admins oder der Nutzer selbst darf eigene Daten exportieren
      if (req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }

      const target = await storage.getUser(id);
      if (!target || target.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      const exportData = await storage.getUserExportData(id, req.tenantId!);
      res
        .setHeader("Content-Disposition", `attachment; filename="daten-export-${id}.json"`)
        .json(exportData);
    } catch (error) {
      handleApiError(res, error, "User export error");
    }
  });

  // Areas
  app.get("/api/areas", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const areasList = await storage.getAreas(req.tenantId);
      res.json(areasList);
    } catch (error) {
      handleApiError(res, error, "Get areas error");
    }
  });

  app.post("/api/areas", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAreaSchema.parse({
        ...req.body,
        tenantId: req.tenantId || null,
      });

      const area = await storage.createArea(data);
      res.status(201).json(area);
    } catch (error) {
      handleApiError(res, error, "Create area error");
    }
  });

  app.patch("/api/areas/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const area = await storage.updateArea(req.params.id, req.body);
      if (!area) {
        return res.status(404).json({ message: "Bereich nicht gefunden" });
      }
      res.json(area);
    } catch (error) {
      handleApiError(res, error, "Update area error");
    }
  });

  app.delete("/api/areas/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteArea(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete area error");
    }
  });

  // SLA Definition Routes
  app.get("/api/sla-definitions", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const slaDefinitions = await storage.getSlaDefinitions(req.tenantId);
      res.json(slaDefinitions);
    } catch (error) {
      handleApiError(res, error, "Get SLA definitions error");
    }
  });

  app.get("/api/sla-definitions/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const sla = await requireOwnedResource(
        () => storage.getSlaDefinition(req.params.id),
        req, res, "SLA-Definition nicht gefunden"
      );
      if (!sla) return;
      res.json(sla);
    } catch (error) {
      handleApiError(res, error, "Get SLA definition error");
    }
  });

  app.post("/api/sla-definitions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertSlaDefinitionSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      const sla = await storage.createSlaDefinition(data);
      res.status(201).json(sla);
    } catch (error) {
      handleApiError(res, error, "Create SLA definition error");
    }
  });

  app.patch("/api/sla-definitions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check tenant ownership first
      const existing = await requireOwnedResource(
        () => storage.getSlaDefinition(req.params.id),
        req, res, "SLA-Definition nicht gefunden"
      );
      if (!existing) return;
      // Only allow safe fields to be updated (not tenantId)
      const { tenantId: _tenantId, id: _id, ...safeUpdates } = req.body;
      const sla = await storage.updateSlaDefinition(req.params.id, safeUpdates);
      res.json(sla);
    } catch (error) {
      handleApiError(res, error, "Update SLA definition error");
    }
  });

  app.delete("/api/sla-definitions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check tenant ownership first
      const existing = await requireOwnedResource(
        () => storage.getSlaDefinition(req.params.id),
        req, res, "SLA-Definition nicht gefunden"
      );
      if (!existing) return;
      await storage.deleteSlaDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete SLA definition error");
    }
  });

  // SLA Escalation Routes
  app.post("/api/sla-definitions/:id/escalations", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check SLA definition tenant ownership first
      const slaDef = await requireOwnedResource(
        () => storage.getSlaDefinition(req.params.id),
        req, res, "SLA-Definition nicht gefunden"
      );
      if (!slaDef) return;
      
      const data = insertSlaEscalationSchema.parse({
        ...req.body,
        slaDefinitionId: req.params.id,
      });

      const escalation = await storage.createSlaEscalation(data);
      res.status(201).json(escalation);
    } catch (error) {
      handleApiError(res, error, "Create SLA escalation error");
    }
  });

  app.delete("/api/sla-escalations/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteSlaEscalation(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete SLA escalation error");
    }
  });

  // Customer Portal Routes
  app.get("/api/portal/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tickets = await storage.getTickets({ 
        tenantId: req.tenantId,
        userId: req.user!.id,
      });
      res.json(tickets);
    } catch (error) {
      handleApiError(res, error, "Portal get tickets error");
    }
  });

  app.get("/api/portal/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.id),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;

      // Only allow access to own tickets for customers
      if (req.user?.role === "customer" && ticket.createdById !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }

      // Filter out internal comments for customers
      if (req.user?.role === "customer" && ticket.comments) {
        ticket.comments = ticket.comments.filter(c => c.visibility === "external");
      }

      res.json(ticket);
    } catch (error) {
      handleApiError(res, error, "Portal get ticket error");
    }
  });

  app.post("/api/portal/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketSchema.parse({
        ...req.body,
        tenantId: req.tenantId || "default",
        createdById: req.user!.id,
        status: "open",
      });

      const ticket = await storage.createTicket(data);
      res.status(201).json(ticket);
    } catch (error) {
      handleApiError(res, error, "Portal create ticket error");
    }
  });

  // Knowledge Base Category Routes
  app.get("/api/kb/categories", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? Number.parseInt(req.query.offset as string, 10) : undefined;
      const categories = await storage.getKbCategories(req.tenantId!, { limit, offset });
      res.json(categories);
    } catch (error) {
      handleApiError(res, error, "Get KB categories error");
    }
  });

  app.get("/api/kb/categories/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await requireOwnedResource(
        () => storage.getKbCategory(req.params.id),
        req, res, "Kategorie nicht gefunden"
      );
      if (!category) return;
      res.json(category);
    } catch (error) {
      handleApiError(res, error, "Get KB category error");
    }
  });

  app.post("/api/kb/categories", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertKbCategorySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });
      const category = await storage.createKbCategory(data);
      res.status(201).json(category);
    } catch (error) {
      handleApiError(res, error, "Create KB category error");
    }
  });

  app.patch("/api/kb/categories/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getKbCategory(req.params.id),
        req, res, "Kategorie nicht gefunden"
      );
      if (!existing) return;
      const { tenantId: _tenantId, id: _id, ...safeUpdates } = req.body;
      const category = await storage.updateKbCategory(req.params.id, safeUpdates);
      res.json(category);
    } catch (error) {
      handleApiError(res, error, "Update KB category error");
    }
  });

  app.delete("/api/kb/categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getKbCategory(req.params.id),
        req, res, "Kategorie nicht gefunden"
      );
      if (!existing) return;
      await storage.deleteKbCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete KB category error");
    }
  });

  // Knowledge Base Article Routes
  app.get("/api/kb/articles", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, status, search, isPublic } = req.query;
      const params: { categoryId?: string; status?: string; search?: string; isPublic?: boolean } = {};
      if (categoryId) params.categoryId = categoryId as string;
      if (status) params.status = status as string;
      if (search) params.search = search as string;
      if (isPublic !== undefined) params.isPublic = isPublic === "true";
      
      // Customers can only see public, published articles
      if (req.user?.role === "customer") {
        params.status = "published";
        params.isPublic = true;
      }
      
      const articles = await storage.getKbArticles(req.tenantId!, params);
      res.json(articles);
    } catch (error) {
      handleApiError(res, error, "Get KB articles error");
    }
  });

  app.get("/api/kb/articles/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await requireOwnedResource(
        () => storage.getKbArticle(req.params.id),
        req, res, "Artikel nicht gefunden"
      );
      if (!article) return;
      // Customers can only see public, published articles
      if (req.user?.role === "customer" && (article.status !== "published" || !article.isPublic)) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      // Increment view count
      await storage.incrementKbArticleViewCount(req.params.id);
      res.json(article);
    } catch (error) {
      handleApiError(res, error, "Get KB article error");
    }
  });

  app.post("/api/kb/articles", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const slug = req.body.slug || generateSlug(req.body.title);
      const data = insertKbArticleSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
        authorId: req.user!.id,
        slug,
      });
      const article = await storage.createKbArticle(data);
      res.status(201).json(article);
    } catch (error) {
      handleApiError(res, error, "Create KB article error");
    }
  });

  app.patch("/api/kb/articles/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getKbArticle(req.params.id),
        req, res, "Artikel nicht gefunden"
      );
      if (!existing) return;
      
      // Save version before updating
      if (req.body.content && req.body.content !== existing.content) {
        await storage.createKbArticleVersion({
          articleId: existing.id,
          title: existing.title,
          content: existing.content,
          version: existing.version || 1,
          changedById: req.user!.id,
          changeNote: req.body.changeNote,
        });
      }
      
      const { tenantId: _tenantId, id: _id, ...safeUpdates } = req.body;
      // Increment version if content changed
      if (req.body.content && req.body.content !== existing.content) {
        (safeUpdates as Record<string, unknown>).version = (existing.version || 1) + 1;
      }
      const article = await storage.updateKbArticle(req.params.id, safeUpdates);
      res.json(article);
    } catch (error) {
      handleApiError(res, error, "Update KB article error");
    }
  });

  app.delete("/api/kb/articles/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getKbArticle(req.params.id),
        req, res, "Artikel nicht gefunden"
      );
      if (!existing) return;
      // Soft-delete: preserves audit trail
      await storage.deleteKbArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete KB article error");
    }
  });

  // Admin-only hard delete — permanently removes KB article and all related data
  app.delete("/api/kb/articles/:id/hard", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getKbArticle(req.params.id),
        req, res, "Artikel nicht gefunden"
      );
      if (!existing) return;
      await storage.hardDeleteKbArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Hard delete KB article error");
    }
  });

  // KB Article Versions
  app.get("/api/kb/articles/:id/versions", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await requireOwnedResource(
        () => storage.getKbArticle(req.params.id),
        req, res, "Artikel nicht gefunden"
      );
      if (!article) return;
      const versions = await storage.getKbArticleVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      handleApiError(res, error, "Get KB article versions error");
    }
  });

  // Ticket KB Links
  app.get("/api/tickets/:ticketId/kb-links", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.ticketId),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      const links = await storage.getTicketKbLinks(req.params.ticketId);
      res.json(links);
    } catch (error) {
      handleApiError(res, error, "Get ticket KB links error");
    }
  });

  app.post("/api/tickets/:ticketId/kb-links", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.ticketId),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      
      const data = insertTicketKbLinkSchema.parse({
        ticketId: req.params.ticketId,
        articleId: req.body.articleId,
        linkedById: req.user!.id,
      });
      const link = await storage.createTicketKbLink(data);
      res.status(201).json(link);
    } catch (error) {
      handleApiError(res, error, "Create ticket KB link error");
    }
  });

  app.delete("/api/ticket-kb-links/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTicketKbLink(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete ticket KB link error");
    }
  });

  // Public Knowledge Base for Portal (customers)
  app.get("/api/portal/kb/articles", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, search } = req.query;
      const params: { categoryId?: string; search?: string; status: string; isPublic: boolean } = {
        status: "published",
        isPublic: true,
      };
      if (categoryId) params.categoryId = categoryId as string;
      if (search) params.search = search as string;
      
      const articles = await storage.getKbArticles(req.tenantId!, params);
      res.json(articles);
    } catch (error) {
      handleApiError(res, error, "Portal get KB articles error");
    }
  });

  // Time Entry Routes
  app.get("/api/time-entries", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ticketId, userId, startDate, endDate } = req.query;
      const params: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date } = {};
      
      if (ticketId) params.ticketId = ticketId as string;
      if (userId) params.userId = userId as string;
      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);
      
      const entries = await storage.getTimeEntries(req.tenantId!, params);
      res.json(entries);
    } catch (error) {
      handleApiError(res, error, "Get time entries error");
    }
  });

  app.get("/api/time-entries/summary", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ticketId, userId, startDate, endDate } = req.query;
      const params: { ticketId?: string; userId?: string; startDate?: Date; endDate?: Date } = {};
      
      if (ticketId) params.ticketId = ticketId as string;
      if (userId) params.userId = userId as string;
      if (startDate) params.startDate = new Date(startDate as string);
      if (endDate) params.endDate = new Date(endDate as string);
      
      const summary = await storage.getTimeEntrySummary(req.tenantId!, params);
      res.json(summary);
    } catch (error) {
      handleApiError(res, error, "Get time entry summary error");
    }
  });

  app.get("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await requireOwnedResource(
        () => storage.getTimeEntry(req.params.id),
        req, res, "Zeiteintrag nicht gefunden"
      );
      if (!entry) return;
      res.json(entry);
    } catch (error) {
      handleApiError(res, error, "Get time entry error");
    }
  });

  app.post("/api/time-entries", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const parsedDate = z.coerce.date().parse(req.body.date);
      const data = insertTimeEntrySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
        userId: req.user!.id,
        date: parsedDate,
      });
      const entry = await storage.createTimeEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      handleApiError(res, error, "Create time entry error");
    }
  });

  app.patch("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await requireOwnedResource(
        () => storage.getTimeEntry(req.params.id),
        req, res, "Zeiteintrag nicht gefunden"
      );
      if (!entry) return;
      
      const updates: Record<string, unknown> = { ...req.body };
      if (req.body.date) {
        updates.date = z.coerce.date().parse(req.body.date);
      }
      delete updates.tenantId;
      delete updates.userId;
      delete updates.id;
      
      const updatedEntry = await storage.updateTimeEntry(req.params.id, updates);
      res.json(updatedEntry);
    } catch (error) {
      handleApiError(res, error, "Update time entry error");
    }
  });

  app.delete("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await requireOwnedResource(
        () => storage.getTimeEntry(req.params.id),
        req, res, "Zeiteintrag nicht gefunden"
      );
      if (!entry) return;
      await storage.deleteTimeEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete time entry error");
    }
  });

  // Get time entries for a specific ticket
  app.get("/api/tickets/:ticketId/time-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.ticketId),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      
      // Customers can only see time entries if they're the ticket creator
      if (req.user!.role === "customer" && ticket.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const entries = await storage.getTimeEntries(req.tenantId ?? "", { ticketId: req.params.ticketId });
      res.json(entries);
    } catch (error) {
      handleApiError(res, error, "Get ticket time entries error");
    }
  });

  // Create time entry for a specific ticket
  app.post("/api/tickets/:ticketId/time-entries", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.ticketId),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      
      const parsedDate = z.coerce.date().parse(req.body.date);
      const data = insertTimeEntrySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
        ticketId: req.params.ticketId,
        userId: req.user!.id,
        date: parsedDate,
      });
      const entry = await storage.createTimeEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      handleApiError(res, error, "Create ticket time entry error");
    }
  });

  // Get time entry summary for a specific ticket
  app.get("/api/tickets/:ticketId/time-summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await requireOwnedResource(
        () => storage.getTicket(req.params.ticketId),
        req, res, "Ticket nicht gefunden"
      );
      if (!ticket) return;
      
      const summary = await storage.getTimeEntrySummary(req.tenantId ?? "", { ticketId: req.params.ticketId });
      res.json(summary);
    } catch (error) {
      handleApiError(res, error, "Get ticket time summary error");
    }
  });

  // ==================== NOTIFICATIONS ====================

  // Get notifications for current user
  app.get("/api/notifications", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const rawLimit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      let limit: number | undefined;
      if (rawLimit !== undefined) {
        limit = Number.isNaN(rawLimit) ? 50 : Math.min(rawLimit, 1000);
      }
      
      const notificationsList = await storage.getNotifications(
        req.tenantId!,
        req.user!.id,
        { unreadOnly, limit }
      );
      res.json(notificationsList);
    } catch (error) {
      handleApiError(res, error, "Get notifications error");
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.tenantId!, req.user!.id);
      res.json({ count });
    } catch (error) {
      handleApiError(res, error, "Get unread count error");
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Benachrichtigung nicht gefunden" });
      }
      if (notification.tenantId !== req.tenantId || notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const updated = await storage.markNotificationAsRead(req.params.id);
      res.json(updated);
    } catch (error) {
      handleApiError(res, error, "Mark notification read error");
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.tenantId!, req.user!.id);
      res.json({ message: "Alle Benachrichtigungen als gelesen markiert" });
    } catch (error) {
      handleApiError(res, error, "Mark all read error");
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Benachrichtigung nicht gefunden" });
      }
      if (notification.tenantId !== req.tenantId || notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete notification error");
    }
  });

  // ==================== SURVEYS (UMFRAGEN) ====================

  // Get all surveys for tenant
  app.get("/api/surveys", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const surveyList = await storage.getSurveys(req.tenantId!);
      res.json(surveyList);
    } catch (error) {
      handleApiError(res, error, "Get surveys error");
    }
  });

  // Get single survey
  app.get("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await requireOwnedResource(
        () => storage.getSurvey(req.params.id),
        req, res, "Umfrage nicht gefunden"
      );
      if (!survey) return;
      res.json(survey);
    } catch (error) {
      handleApiError(res, error, "Get survey error");
    }
  });

  // Create survey
  app.post("/api/surveys", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertSurveySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });
      const survey = await storage.createSurvey(data);
      res.status(201).json(survey);
    } catch (error) {
      handleApiError(res, error, "Create survey error");
    }
  });

  // Update survey
  app.patch("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getSurvey(req.params.id),
        req, res, "Umfrage nicht gefunden"
      );
      if (!existing) return;
      const { tenantId: _tenantId, id: _id, ...safeUpdates } = req.body;
      const survey = await storage.updateSurvey(req.params.id, safeUpdates);
      res.json(survey);
    } catch (error) {
      handleApiError(res, error, "Update survey error");
    }
  });

  // Delete survey
  app.delete("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await requireOwnedResource(
        () => storage.getSurvey(req.params.id),
        req, res, "Umfrage nicht gefunden"
      );
      if (!existing) return;
      await storage.deleteSurvey(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete survey error");
    }
  });

  // Survey Questions
  app.get("/api/surveys/:surveyId/questions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await requireOwnedResource(
        () => storage.getSurvey(req.params.surveyId),
        req, res, "Umfrage nicht gefunden"
      );
      if (!survey) return;
      const questions = await storage.getSurveyQuestions(req.params.surveyId);
      res.json(questions);
    } catch (error) {
      handleApiError(res, error, "Get survey questions error");
    }
  });

  app.post("/api/surveys/:surveyId/questions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await requireOwnedResource(
        () => storage.getSurvey(req.params.surveyId),
        req, res, "Umfrage nicht gefunden"
      );
      if (!survey) return;
      
      const data = insertSurveyQuestionSchema.parse({
        ...req.body,
        surveyId: req.params.surveyId,
      });
      const question = await storage.createSurveyQuestion(data);
      res.status(201).json(question);
    } catch (error) {
      handleApiError(res, error, "Create survey question error");
    }
  });

  app.patch("/api/survey-questions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { surveyId: _surveyId, id: _id, ...safeUpdates } = req.body;
      const question = await storage.updateSurveyQuestion(req.params.id, safeUpdates);
      if (!question) {
        return res.status(404).json({ message: "Frage nicht gefunden" });
      }
      res.json(question);
    } catch (error) {
      handleApiError(res, error, "Update survey question error");
    }
  });

  app.delete("/api/survey-questions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteSurveyQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete survey question error");
    }
  });

  // Survey Invitations
  app.get("/api/surveys/:surveyId/invitations", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await requireOwnedResource(
        () => storage.getSurvey(req.params.surveyId),
        req, res, "Umfrage nicht gefunden"
      );
      if (!survey) return;
      const invitations = await storage.getSurveyInvitations(req.tenantId ?? "", req.params.surveyId);
      res.json(invitations);
    } catch (error) {
      handleApiError(res, error, "Get survey invitations error");
    }
  });

  // Survey Results Summary
  app.get("/api/surveys/:surveyId/results", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await requireOwnedResource(
        () => storage.getSurvey(req.params.surveyId),
        req, res, "Umfrage nicht gefunden"
      );
      if (!survey) return;
      const summary = await storage.getSurveyResultSummary(req.tenantId ?? "", req.params.surveyId);
      res.json(summary);
    } catch (error) {
      handleApiError(res, error, "Get survey results error");
    }
  });

  // Public survey submission route (no auth required, uses token)
  app.get("/api/public/survey/:token", async (req, res) => {
    try {
      const invitation = await storage.getSurveyInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ message: "Umfrage nicht gefunden oder abgelaufen" });
      }
      if (invitation.completedAt) {
        return res.status(400).json({ message: "Umfrage wurde bereits ausgefüllt" });
      }
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Umfrage ist abgelaufen" });
      }
      res.json(invitation);
    } catch (error) {
      handleApiError(res, error, "Get public survey error");
    }
  });

  app.post("/api/public/survey/:token/submit", async (req, res) => {
    try {
      const invitation = await storage.getSurveyInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ message: "Umfrage nicht gefunden oder abgelaufen" });
      }
      if (invitation.completedAt) {
        return res.status(400).json({ message: "Umfrage wurde bereits ausgefüllt" });
      }
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Umfrage ist abgelaufen" });
      }

      const responses = req.body.responses as Array<{
        questionId: string;
        ratingValue?: number;
        textValue?: string;
        choiceValue?: string;
      }>;

      // Create responses for each question
      for (const response of responses) {
        const data = insertSurveyResponseSchema.parse({
          invitationId: invitation.id,
          questionId: response.questionId,
          ratingValue: response.ratingValue,
          textValue: response.textValue,
          choiceValue: response.choiceValue,
        });
        await storage.createSurveyResponse(data);
      }

      // Mark invitation as completed
      await storage.completeSurveyInvitation(invitation.id);

      res.json({ message: "Vielen Dank für Ihr Feedback!" });
    } catch (error) {
      handleApiError(res, error, "Submit survey error");
    }
  });

  // ==================== AUTO-SURVEY ON TICKET CLOSE ====================
  // This logic is now in the ticket update endpoint
  // When a ticket status changes to "closed", we check for an active survey
  // and create an invitation if one exists

  // ==================== ASSET MANAGEMENT ====================
  
  // Asset Categories
  app.get("/api/asset-categories", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await storage.getAssetCategories(req.user?.tenantId ?? "");
      res.json(categories);
    } catch (error) {
      handleApiError(res, error, "Get asset categories error");
    }
  });

  app.post("/api/asset-categories", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAssetCategorySchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      const category = await storage.createAssetCategory(data, req.user?.tenantId ?? "");
      res.status(201).json(category);
    } catch (error) {
      handleApiError(res, error, "Create asset category error");
    }
  });

  app.patch("/api/asset-categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await storage.getAssetCategory(req.params.id, req.user?.tenantId ?? "");
      if (!category) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      const updated = await storage.updateAssetCategory(req.params.id, req.body, req.user?.tenantId ?? "");
      res.json(updated);
    } catch (error) {
      handleApiError(res, error, "Update asset category error");
    }
  });

  app.delete("/api/asset-categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await storage.getAssetCategory(req.params.id, req.user?.tenantId ?? "");
      if (!category) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      await storage.deleteAssetCategory(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete asset category error");
    }
  });

  // Assets
  app.get("/api/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { assetType, status, categoryId, assignedToId, customerId, search } = req.query;
      const assets = await storage.getAssets(req.user?.tenantId ?? "", {
        assetType: assetType as string | undefined,
        status: status as string | undefined,
        categoryId: categoryId as string | undefined,
        assignedToId: assignedToId as string | undefined,
        customerId: customerId as string | undefined,
        search: search as string | undefined,
      });
      res.json(assets);
    } catch (error) {
      handleApiError(res, error, "Get assets error");
    }
  });

  app.get("/api/assets/next-number", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const assetNumber = await storage.getNextAssetNumber(req.user?.tenantId ?? "");
      res.json({ assetNumber });
    } catch (error) {
      handleApiError(res, error, "Get next asset number error");
    }
  });

  app.get("/api/assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user?.tenantId ?? "");
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }
      res.json(asset);
    } catch (error) {
      handleApiError(res, error, "Get asset error");
    }
  });

  app.post("/api/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAssetSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      const asset = await storage.createAsset(data, req.user?.tenantId ?? "");

      // Create history entry
      await storage.createAssetHistory({
        assetId: asset.id,
        userId: req.user!.id,
        action: "created",
        description: "Asset erstellt",
      }, req.user?.tenantId ?? "");

      // If software/license type, create license entry
      if ((asset.assetType === "software" || asset.assetType === "license") && req.body.license) {
        const licenseData = insertAssetLicenseSchema.parse({
          ...req.body.license,
          assetId: asset.id,
        });
        await storage.createAssetLicense(licenseData, req.user?.tenantId ?? "");
      }

      // If contract type, create contract entry
      if (asset.assetType === "contract" && req.body.contract) {
        const contractData = insertAssetContractSchema.parse({
          ...req.body.contract,
          assetId: asset.id,
        });
        await storage.createAssetContract(contractData, req.user?.tenantId ?? "");
      }

      const fullAsset = await storage.getAsset(asset.id, req.user?.tenantId ?? "");
      res.status(201).json(fullAsset);
    } catch (error) {
      handleApiError(res, error, "Create asset error");
    }
  });

  app.patch("/api/assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user?.tenantId ?? "");
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }

      const updated = await storage.updateAsset(req.params.id, req.body, req.user?.tenantId ?? "");

      // Create history entry for update
      await storage.createAssetHistory({
        assetId: req.params.id,
        userId: req.user!.id,
        action: "updated",
        description: "Asset aktualisiert",
        previousValue: asset,
        newValue: updated,
      }, req.user?.tenantId ?? "");

      // Update license if provided
      if (req.body.license) {
        const existingLicense = await storage.getAssetLicense(req.params.id, req.user?.tenantId ?? "");
        if (existingLicense) {
          await storage.updateAssetLicense(existingLicense.id, req.body.license, req.user?.tenantId ?? "");
        } else {
          await storage.createAssetLicense({ ...req.body.license, assetId: req.params.id }, req.user?.tenantId ?? "");
        }
      }

      // Update contract if provided
      if (req.body.contract) {
        const existingContract = await storage.getAssetContract(req.params.id, req.user?.tenantId ?? "");
        if (existingContract) {
          await storage.updateAssetContract(existingContract.id, req.body.contract, req.user?.tenantId ?? "");
        } else {
          await storage.createAssetContract({ ...req.body.contract, assetId: req.params.id }, req.user?.tenantId ?? "");
        }
      }

      const fullAsset = await storage.getAsset(req.params.id, req.user?.tenantId ?? "");
      res.json(fullAsset);
    } catch (error) {
      handleApiError(res, error, "Update asset error");
    }
  });

  app.delete("/api/assets/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user?.tenantId ?? "");
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }
      await storage.deleteAsset(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete asset error");
    }
  });

  // Ticket Assets (linking)
  app.get("/api/tickets/:ticketId/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketAssets = await storage.getTicketAssets(req.params.ticketId, req.user?.tenantId ?? "");
      res.json(ticketAssets);
    } catch (error) {
      handleApiError(res, error, "Get ticket assets error");
    }
  });

  app.post("/api/tickets/:ticketId/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketAssetSchema.parse({
        ticketId: req.params.ticketId,
        assetId: req.body.assetId,
      });
      const link = await storage.createTicketAsset(data, req.user?.tenantId ?? "");
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket oder Asset nicht gefunden" });
      }
      handleApiError(res, error, "Create ticket asset link error");
    }
  });

  app.delete("/api/ticket-assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTicketAsset(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete ticket asset link error");
    }
  });

  // Asset tickets (get tickets linked to an asset)
  app.get("/api/assets/:assetId/tickets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const assetTickets = await storage.getAssetTickets(req.params.assetId, req.user?.tenantId ?? "");
      res.json(assetTickets);
    } catch (error) {
      handleApiError(res, error, "Get asset tickets error");
    }
  });

  // Asset history
  app.get("/api/assets/:assetId/history", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const history = await storage.getAssetHistory(req.params.assetId, req.user?.tenantId ?? "");
      res.json(history);
    } catch (error) {
      handleApiError(res, error, "Get asset history error");
    }
  });

  // =================== Projects API ===================

  // List all projects
  app.get("/api/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const projects = await storage.getProjects(req.user?.tenantId ?? "");
      res.json(projects);
    } catch (error) {
      handleApiError(res, error, "Get projects error");
    }
  });

  // Get single project
  app.get("/api/projects/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user?.tenantId ?? "");
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      res.json(project);
    } catch (error) {
      handleApiError(res, error, "Get project error");
    }
  });

  // Create project
  app.post("/api/projects", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data, req.user?.tenantId ?? "");
      res.status(201).json(project);
    } catch (error) {
      handleApiError(res, error, "Create project error");
    }
  });

  // Update project
  app.patch("/api/projects/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user?.tenantId ?? "");
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      const updated = await storage.updateProject(req.params.id, req.body, req.user?.tenantId ?? "");
      res.json(updated);
    } catch (error) {
      handleApiError(res, error, "Update project error");
    }
  });

  // Delete project
  app.delete("/api/projects/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user?.tenantId ?? "");
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      await storage.deleteProject(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete project error");
    }
  });

  // Project members
  app.get("/api/projects/:projectId/members", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId, req.user?.tenantId ?? "");
      res.json(members);
    } catch (error) {
      handleApiError(res, error, "Get project members error");
    }
  });

  app.post("/api/projects/:projectId/members", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertProjectMemberSchema.parse({
        projectId: req.params.projectId,
        userId: req.body.userId,
        role: req.body.role,
      });
      const member = await storage.addProjectMember(data, req.user?.tenantId ?? "");
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      handleApiError(res, error, "Add project member error");
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeProjectMember(req.params.projectId, req.params.userId, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Remove project member error");
    }
  });

  // Board columns
  app.get("/api/projects/:projectId/columns", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const columns = await storage.getBoardColumns(req.params.projectId, req.user?.tenantId ?? "");
      res.json(columns);
    } catch (error) {
      handleApiError(res, error, "Get board columns error");
    }
  });

  app.post("/api/projects/:projectId/columns", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertBoardColumnSchema.parse({
        projectId: req.params.projectId,
        ...req.body,
      });
      const column = await storage.createBoardColumn(data, req.user?.tenantId ?? "");
      res.status(201).json(column);
    } catch (error) {
      handleApiError(res, error, "Create board column error");
    }
  });

  app.patch("/api/board-columns/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const column = await storage.updateBoardColumn(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!column) {
        return res.status(404).json({ message: "Spalte nicht gefunden" });
      }
      res.json(column);
    } catch (error) {
      handleApiError(res, error, "Update board column error");
    }
  });

  app.delete("/api/board-columns/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteBoardColumn(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete board column error");
    }
  });

  app.post("/api/projects/:projectId/columns/reorder", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.reorderBoardColumns(req.params.projectId, req.body.columnIds, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Reorder board columns error");
    }
  });

  // Ticket-Project assignments
  app.get("/api/tickets/:ticketId/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketProjects = await storage.getTicketProjects(req.params.ticketId, req.user?.tenantId ?? "");
      res.json(ticketProjects);
    } catch (error) {
      handleApiError(res, error, "Get ticket projects error");
    }
  });

  app.post("/api/tickets/:ticketId/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketProjectSchema.parse({
        ticketId: req.params.ticketId,
        projectId: req.body.projectId,
        boardOrder: req.body.boardOrder || 0,
      });
      const link = await storage.addTicketToProject(data, req.user?.tenantId ?? "");
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket oder Projekt nicht gefunden" });
      }
      handleApiError(res, error, "Add ticket to project error");
    }
  });

  app.delete("/api/tickets/:ticketId/projects/:projectId", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeTicketFromProject(req.params.ticketId, req.params.projectId, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Remove ticket from project error");
    }
  });

  // Project board view (tickets grouped by column)
  app.get("/api/projects/:projectId/board", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.projectId, req.user?.tenantId ?? "");
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      const board = await storage.getProjectTickets(req.params.projectId, req.user?.tenantId ?? "");
      res.json({ project, board });
    } catch (error) {
      handleApiError(res, error, "Get project board error");
    }
  });

  // Update ticket board order (for drag-drop)
  app.patch("/api/projects/:projectId/tickets/:ticketId/order", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.updateTicketBoardOrder(req.params.ticketId, req.params.projectId, req.body.boardOrder, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Update ticket board order error");
    }
  });

  // ============================================
  // CRM - Organizations
  // ============================================

  app.get("/api/organizations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? Number.parseInt(req.query.offset as string, 10) : undefined;
      const orgs = await storage.getOrganizations(req.user?.tenantId ?? "", { search, limit, offset });
      res.json(orgs);
    } catch (error) {
      handleApiError(res, error, "Get organizations error");
    }
  });

  app.get("/api/organizations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const org = await storage.getOrganization(req.params.id, req.user?.tenantId ?? "");
      if (!org) {
        return res.status(404).json({ message: "Organisation nicht gefunden" });
      }
      res.json(org);
    } catch (error) {
      handleApiError(res, error, "Get organization error");
    }
  });

  app.post("/api/organizations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(data, req.user?.tenantId ?? "");
      res.status(201).json(org);
    } catch (error) {
      handleApiError(res, error, "Create organization error");
    }
  });

  app.patch("/api/organizations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const org = await storage.updateOrganization(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!org) {
        return res.status(404).json({ message: "Organisation nicht gefunden" });
      }
      res.json(org);
    } catch (error) {
      handleApiError(res, error, "Update organization error");
    }
  });

  app.delete("/api/organizations/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteOrganization(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete organization error");
    }
  });

  // ============================================
  // CRM - Customers
  // ============================================

  app.get("/api/customers", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const organizationId = req.query.organizationId as string | undefined;
      const customers = await storage.getCustomers(req.user?.tenantId ?? "", { search, organizationId });
      res.json(customers);
    } catch (error) {
      handleApiError(res, error, "Get customers error");
    }
  });

  app.get("/api/customers/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id, req.user?.tenantId ?? "");
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      handleApiError(res, error, "Get customer error");
    }
  });

  app.post("/api/customers", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Auto-generate customer number if not provided
      const existingCustomers = await storage.getCustomers(req.user?.tenantId ?? "", {});
      const nextNumber = existingCustomers.length + 1;
      const customerNumber = `KD-${String(nextNumber).padStart(5, '0')}`;
      
      const dataWithNumber = { ...req.body, customerNumber };
      const data = insertCustomerSchema.parse(dataWithNumber);
      const customer = await storage.createCustomer(data, req.user?.tenantId ?? "");
      res.status(201).json(customer);
    } catch (error) {
      handleApiError(res, error, "Create customer error");
    }
  });

  app.patch("/api/customers/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      handleApiError(res, error, "Update customer error");
    }
  });

  app.delete("/api/customers/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteCustomer(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete customer error");
    }
  });

  // Customer locations
  app.get("/api/customers/:customerId/locations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const locations = await storage.getCustomerLocations(req.params.customerId, req.user?.tenantId ?? "");
      res.json(locations);
    } catch (error) {
      handleApiError(res, error, "Get customer locations error");
    }
  });

  app.post("/api/customers/:customerId/locations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertCustomerLocationSchema.parse({
        customerId: req.params.customerId,
        ...req.body,
      });
      const location = await storage.createCustomerLocation(data, req.user?.tenantId ?? "");
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      handleApiError(res, error, "Create customer location error");
    }
  });

  app.patch("/api/customer-locations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const location = await storage.updateCustomerLocation(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!location) {
        return res.status(404).json({ message: "Standort nicht gefunden" });
      }
      res.json(location);
    } catch (error) {
      handleApiError(res, error, "Update customer location error");
    }
  });

  app.delete("/api/customer-locations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteCustomerLocation(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete customer location error");
    }
  });

  // ============================================
  // CRM - Contacts
  // ============================================

  app.get("/api/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      const organizationId = req.query.organizationId as string | undefined;
      const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? Number.parseInt(req.query.offset as string, 10) : undefined;
      const contacts = await storage.getContacts(req.user?.tenantId ?? "", { search, customerId, organizationId, limit, offset });
      res.json(contacts);
    } catch (error) {
      handleApiError(res, error, "Get contacts error");
    }
  });

  app.get("/api/contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await storage.getContact(req.params.id, req.user?.tenantId ?? "");
      if (!contact) {
        return res.status(404).json({ message: "Kontakt nicht gefunden" });
      }
      res.json(contact);
    } catch (error) {
      handleApiError(res, error, "Get contact error");
    }
  });

  app.post("/api/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data, req.user?.tenantId ?? "");
      res.status(201).json(contact);
    } catch (error) {
      handleApiError(res, error, "Create contact error");
    }
  });

  app.patch("/api/contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!contact) {
        return res.status(404).json({ message: "Kontakt nicht gefunden" });
      }
      res.json(contact);
    } catch (error) {
      handleApiError(res, error, "Update contact error");
    }
  });

  app.delete("/api/contacts/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteContact(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Delete contact error");
    }
  });

  // ============================================
  // CRM - Ticket Contacts
  // ============================================

  app.get("/api/tickets/:ticketId/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketContacts = await storage.getTicketContacts(req.params.ticketId, req.user?.tenantId ?? "");
      res.json(ticketContacts);
    } catch (error) {
      handleApiError(res, error, "Get ticket contacts error");
    }
  });

  app.post("/api/tickets/:ticketId/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketContactSchema.parse({
        ticketId: req.params.ticketId,
        contactId: req.body.contactId,
        role: req.body.role || "requester",
      });
      const link = await storage.addTicketContact(data, req.user?.tenantId ?? "");
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      handleApiError(res, error, "Add ticket contact error");
    }
  });

  app.delete("/api/ticket-contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeTicketContact(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Remove ticket contact error");
    }
  });

  // ============================================
  // CRM - Customer Activities
  // ============================================

  app.get("/api/customer-activities", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const contactId = req.query.contactId as string | undefined;
      const ticketId = req.query.ticketId as string | undefined;
      const rawLimit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
      let limit: number | undefined;
      if (rawLimit !== undefined) {
        limit = Number.isNaN(rawLimit) ? 50 : Math.min(rawLimit, 1000);
      }
      const activities = await storage.getCustomerActivities(req.user?.tenantId ?? "", { customerId, contactId, ticketId, limit });
      res.json(activities);
    } catch (error) {
      handleApiError(res, error, "Get customer activities error");
    }
  });

  app.post("/api/customer-activities", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertCustomerActivitySchema.parse({
        ...req.body,
        createdById: req.user!.id,
      });
      const activity = await storage.createCustomerActivity(data, req.user?.tenantId ?? "");
      res.status(201).json(activity);
    } catch (error) {
      handleApiError(res, error, "Create customer activity error");
    }
  });

  // ============================================
  // System Logs (Admin only)
  // ============================================

  app.get("/api/logs", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { logger } = await import("./logger");
      const filters = {
        level: req.query.level as string | undefined,
        source: req.query.source as string | undefined,
        tenantId: req.query.tenantId as string | undefined,
        userId: req.query.userId as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        search: req.query.search as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? Math.min(Number.parseInt(req.query.limit as string, 10) || 100, 1000) : 100,
        offset: req.query.offset ? Math.max(Number.parseInt(req.query.offset as string, 10) || 0, 0) : 0,
      };
      const result = logger.getLogs(filters as Parameters<typeof logger.getLogs>[0]);
      res.json(result);
    } catch (error) {
      handleApiError(res, error, "Get logs error");
    }
  });

  app.get("/api/logs/files", authMiddleware, adminMiddleware, async (_req: AuthenticatedRequest, res) => {
    try {
      const { logger } = await import("./logger");
      const files = logger.getLogFiles();
      res.json({ files });
    } catch (error) {
      handleApiError(res, error, "Get log files error");
    }
  });

  // Test endpoint to generate sample logs for all levels
  app.post("/api/logs/test", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { logger } = await import("./logger");
      
      // Debug log
      logger.debug("system", "Debug-Test", "Dies ist eine Test-Debug-Nachricht zur Überprüfung des Logging-Systems", {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "debug", timestamp: new Date().toISOString() },
      });

      // Info log
      logger.info("api", "Info-Test", "Dies ist eine Test-Info-Nachricht - System läuft normal", {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "info", component: "API-Gateway" },
      });

      // Warning log
      logger.warn("database", "Warnung-Test", "Dies ist eine Test-Warnung - Hohe Datenbankauslastung erkannt", {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "warning", cpuUsage: "85%", memoryUsage: "78%" },
      });

      // Error log
      logger.error("ticket", "Fehler-Test", {
        description: "Dies ist ein Test-Fehler zur Demonstration",
        cause: "Simulierter Datenbankverbindungsfehler beim Ticket-Abruf",
        solution: "Überprüfen Sie die Datenbankverbindung und starten Sie den Dienst neu",
      }, {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: "test-123",
      });

      // Security log
      logger.security("auth", "Sicherheit-Test", "Verdächtige Anmeldeaktivität erkannt - Mehrere fehlgeschlagene Versuche von derselben IP", {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "security", ipAddress: req.ip, failedAttempts: 5 },
      });

      // Performance log
      logger.performance("api", "Performance-Test", "2500ms simulierte Verarbeitungszeit", {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "performance", endpoint: "/api/tickets", method: "GET" },
      });

      res.json({ message: "Test-Logs wurden erfolgreich erstellt", count: 6 });
    } catch (error) {
      handleApiError(res, error, "Test logs error");
    }
  });

  app.get("/api/logs/export", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { logger } = await import("./logger");
      const format = (req.query.format as string) || "json";
      const filters = {
        level: req.query.level as string | undefined,
        source: req.query.source as string | undefined,
        tenantId: req.query.tenantId as string | undefined,
        search: req.query.search as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: 10000,
        offset: 0,
      };
      const result = logger.getLogs(filters as Parameters<typeof logger.getLogs>[0]);

      type FormattedLog = { timestampFormatted: string; level: string; source: string; entityType?: string; title: string; description: string; tenantId?: string; userId?: string; error?: { description: string; cause: string; solution: string } };
      if (format === "csv") {
        const headers = ["Zeitstempel", "Level", "Quelle", "Entitätstyp", "Titel", "Beschreibung", "Mandant", "Benutzer"];
        const rows = (result.logs as FormattedLog[]).map((log) => [
          log.timestampFormatted,
          log.level,
          log.source,
          log.entityType,
          `"${(log.title || "").replaceAll('"', '""')}"`,
          `"${(log.description || "").replaceAll('"', '""')}"`,
          log.tenantId || "",
          log.userId || "",
        ].join(";"));
        const csv = [headers.join(";"), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.csv`);
        res.send("\uFEFF" + csv); // BOM for Excel
      } else if (format === "txt") {
        const txt = (result.logs as FormattedLog[]).map((log) =>
          `[${log.timestampFormatted}] [${log.level.toUpperCase()}] [${log.source}]\n` +
          `   Titel: ${log.title}\n` +
          `   Beschreibung: ${log.description}\n` +
          (log.error ? `   Fehler: ${log.error.description}\n   Ursache: ${log.error.cause}\n   Lösung: ${log.error.solution}\n` : "") +
          `---\n`
        ).join("\n");
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.txt`);
        res.send(txt);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.json`);
        res.json(result.logs);
      }
    } catch (error) {
      handleApiError(res, error, "Export logs error");
    }
  });

  // ============================================
  // TLS Certificate Management (Admin only)
  // ============================================

  // Get TLS settings
  app.get("/api/tls/settings", authMiddleware, adminMiddleware, async (_req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const settings = await tlsService.getSettings();
      res.json(settings || { 
        httpsEnabled: false, 
        autoRenewEnabled: true, 
        renewDaysBeforeExpiry: 30,
        caType: "staging"
      });
    } catch (error) {
      handleApiError(res, error, "TLS settings error");
    }
  });

  // Update TLS settings
  app.patch("/api/tls/settings", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.updateTlsSettings(req.body);
      res.json(settings);
    } catch (error) {
      handleApiError(res, error, "TLS settings update error");
    }
  });

  // Get all certificates
  app.get("/api/tls/certificates", authMiddleware, adminMiddleware, async (_req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const certificates = await tlsService.getCertificates();
      // Don't expose private keys
      const safeCertificates = certificates.map(cert => ({
        ...cert,
        privateKeyPem: undefined,
      }));
      res.json(safeCertificates);
    } catch (error) {
      handleApiError(res, error, "TLS certificates error");
    }
  });

  // Get single certificate
  app.get("/api/tls/certificates/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const certificate = await tlsService.getCertificate(req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: "Zertifikat nicht gefunden" });
      }
      // Don't expose private key
      const safeCertificate = { ...certificate, privateKeyPem: undefined };
      res.json(safeCertificate);
    } catch (error) {
      handleApiError(res, error, "TLS certificate error");
    }
  });

  // Request new certificate
  const requestCertSchema = z.object({
    domain: z.string().min(1, "Domain ist erforderlich"),
    email: z.string().email("Gültige E-Mail erforderlich"),
    useProduction: z.boolean().optional().default(false),
  });

  app.post("/api/tls/certificates", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = requestCertSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0].message });
      }
      const { domain, email, useProduction } = parseResult.data;
      
      const { tlsService } = await import("./tls-service");
      const result = await tlsService.requestCertificate(
        domain,
        email,
        req.user!.id,
        useProduction,
        req.user!.tenantId
      );
      
      if (result.success) {
        res.json({ 
          message: "Zertifikat erfolgreich angefordert", 
          certificateId: result.certificateId 
        });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      handleApiError(res, error, "TLS certificate request error");
    }
  });

  // Renew certificate
  const renewCertSchema = z.object({
    email: z.string().email("Gültige E-Mail erforderlich"),
  });

  app.post("/api/tls/certificates/:id/renew", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const parseResult = renewCertSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0].message });
      }
      const { email } = parseResult.data;
      
      const { tlsService } = await import("./tls-service");
      const result = await tlsService.renewCertificate(
        req.params.id,
        email,
        req.user!.id,
        req.user!.tenantId
      );
      
      if (result.success) {
        res.json({ message: "Zertifikat erfolgreich erneuert" });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      handleApiError(res, error, "TLS certificate renew error");
    }
  });

  // Revoke certificate
  app.post("/api/tls/certificates/:id/revoke", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const result = await tlsService.revokeCertificate(
        req.params.id,
        req.user!.id
      );
      
      if (result.success) {
        res.json({ message: "Zertifikat erfolgreich widerrufen" });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      handleApiError(res, error, "TLS certificate revoke error");
    }
  });

  // Activate certificate
  app.post("/api/tls/certificates/:id/activate", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Deactivate all other certificates first
      const allCerts = await storage.getTlsCertificates();
      for (const cert of allCerts) {
        if (cert.isActive) {
          await storage.updateTlsCertificate(cert.id, { isActive: false });
        }
      }
      
      // Activate the selected certificate
      const updated = await storage.updateTlsCertificate(req.params.id, { isActive: true });
      if (!updated) {
        return res.status(404).json({ message: "Zertifikat nicht gefunden" });
      }
      
      await storage.createTlsCertificateAction({
        certificateId: req.params.id,
        action: "activated",
        status: "success",
        performedById: req.user!.id,
        details: { domain: updated.domain }
      });
      
      res.json({ message: "Zertifikat aktiviert" });
    } catch (error) {
      handleApiError(res, error, "TLS certificate activate error");
    }
  });

  // Delete certificate
  app.delete("/api/tls/certificates/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTlsCertificate(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "TLS certificate delete error");
    }
  });

  // Get certificate actions/history
  app.get("/api/tls/actions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const certificateId = req.query.certificateId as string | undefined;
      const limit = req.query.limit ? Math.min(Number.parseInt(req.query.limit as string, 10) || 100, 1000) : 100;
      const actions = await tlsService.getActions(certificateId, limit);
      res.json(actions);
    } catch (error) {
      handleApiError(res, error, "TLS actions error");
    }
  });

  // Check and renew expiring certificates
  app.post("/api/tls/check-renewal", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getTlsSettings();
      const email = settings?.acmeEmail || req.body.email;
      if (!email) {
        return res.status(400).json({ message: "E-Mail für Erneuerung ist erforderlich" });
      }
      
      const { tlsService } = await import("./tls-service");
      const daysBeforeExpiry = settings?.renewDaysBeforeExpiry || 30;
      const result = await tlsService.checkAndRenewExpiring(
        email,
        req.user!.id,
        undefined,
        daysBeforeExpiry
      );
      
      res.json({
        message: `${result.renewed} Zertifikat(e) erneuert`,
        renewed: result.renewed,
        errors: result.errors
      });
    } catch (error) {
      handleApiError(res, error, "TLS renewal check error");
    }
  });

  // HTTP-01 Challenge endpoint for Let's Encrypt validation
  app.get("/.well-known/acme-challenge/:token", async (req, res) => {
    const { getHttpChallenge } = await import("./tls-service");
    const keyAuth = await getHttpChallenge(req.params.token);
    if (keyAuth) {
      res.type("text/plain").send(keyAuth);
    } else {
      res.status(404).send("Challenge not found");
    }
  });

  // ==================== Exchange Online Integration ====================
  
  // Get Exchange configuration
  app.get("/api/exchange/configuration", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const config = await storage.getExchangeConfiguration(req.user?.tenantId ?? "");
      if (!config) {
        return res.json({ configured: false });
      }
      // Do not return encrypted secrets to frontend
      const { clientSecretEncrypted, certificatePemEncrypted, ...safeConfig } = config;
      res.json({ 
        configured: true, 
        ...safeConfig,
        hasClientSecret: !!clientSecretEncrypted,
        hasCertificate: !!certificatePemEncrypted
      });
    } catch (error) {
      logger.error("exchange", "Fehler beim Abrufen der Konfiguration", { description: String(error), cause: "Datenbankfehler", solution: "Überprüfen Sie die Datenbankverbindung" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Save/Update Exchange configuration
  app.post("/api/exchange/configuration", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user?.tenantId ?? "";
      const { clientId, tenantAzureId, authType, clientSecret, certificatePem, certificateThumbprint, isEnabled } = req.body;
      
      const existingConfig = await storage.getExchangeConfiguration(tenantId);
      
      const configData: InsertExchangeConfiguration = {
        tenantId,
        clientId,
        tenantAzureId,
        authType: authType || "client_secret",
        isEnabled: isEnabled ?? false,
        configuredById: req.user!.id,
      };
      
      // Encrypt secrets before storing
      if (clientSecret) {
        configData.clientSecretEncrypted = ExchangeService.encryptSecret(clientSecret);
      }
      if (certificatePem) {
        configData.certificatePemEncrypted = ExchangeService.encryptSecret(certificatePem);
        configData.certificateThumbprint = certificateThumbprint;
      }
      
      let result;
      if (existingConfig) {
        result = await storage.updateExchangeConfiguration(tenantId, configData);
        logger.info("exchange", "Konfiguration aktualisiert", "Exchange-Konfiguration wurde aktualisiert", { userId: req.user!.id });
      } else {
        result = await storage.createExchangeConfiguration(configData);
        logger.info("exchange", "Konfiguration erstellt", "Exchange-Konfiguration wurde erstellt", { userId: req.user!.id });
      }
      
      res.json({ message: "Konfiguration gespeichert", id: result?.id });
    } catch (error) {
      logger.error("exchange", "Fehler beim Speichern der Konfiguration", { description: String(error), cause: "Speicherfehler", solution: "Überprüfen Sie die Eingabedaten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Test Exchange connection
  app.post("/api/exchange/test-connection", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user?.tenantId ?? "";
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config) {
        return res.status(400).json({ 
          success: false, 
          message: "Exchange-Integration ist noch nicht konfiguriert. Bitte hinterlegen Sie zuerst die Azure-App-Daten." 
        });
      }
      
      if (!ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ 
          success: false, 
          message: "Konfiguration ist unvollständig. Bitte überprüfen Sie alle erforderlichen Felder." 
        });
      }
      
      const result = await ExchangeService.testConnection(config);
      
      // Update connection status
      await storage.updateExchangeConfiguration(tenantId, {
        connectionStatus: result.success ? "connected" : "error",
        lastConnectionTest: new Date(),
        lastConnectionError: result.success ? null : result.message
      });
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.name === "ExchangeError") {
        const exchangeError = error as Error & { solution?: string };
        res.status(400).json({
          success: false,
          message: exchangeError.message,
          solution: exchangeError.solution
        });
      } else {
        logger.error("exchange", "Fehler beim Verbindungstest", { description: String(error), cause: "Verbindungsfehler", solution: "Überprüfen Sie die Azure-Konfiguration" });
        res.status(500).json({ success: false, message: "Interner Serverfehler" });
      }
    }
  });

  // Get Exchange mailboxes
  app.get("/api/exchange/mailboxes", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const mailboxes = await storage.getExchangeMailboxes(req.user?.tenantId ?? "");
      res.json(mailboxes);
    } catch (error) {
      logger.error("exchange", "Fehler beim Abrufen der Postfächer", { description: String(error), cause: "Datenbankfehler", solution: "Überprüfen Sie die Datenbankverbindung" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Create Exchange mailbox
  app.post("/api/exchange/mailboxes", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert" });
      }
      
      const mailbox = await storage.createExchangeMailbox({
        ...req.body,
        configurationId: config.id,
        tenantId
      });
      
      logger.info("exchange", "Postfach hinzugefügt", `Postfach ${mailbox.emailAddress} wurde hinzugefügt`, { userId: req.user!.id });
      res.status(201).json(mailbox);
    } catch (error) {
      logger.error("exchange", "Fehler beim Erstellen des Postfachs", { description: String(error), cause: "Erstellungsfehler", solution: "Überprüfen Sie die Postfach-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update Exchange mailbox
  app.patch("/api/exchange/mailboxes/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const mailbox = await storage.updateExchangeMailbox(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!mailbox) {
        return res.status(404).json({ message: "Postfach nicht gefunden" });
      }
      res.json(mailbox);
    } catch (error) {
      logger.error("exchange", "Fehler beim Aktualisieren des Postfachs", { description: String(error), cause: "Aktualisierungsfehler", solution: "Überprüfen Sie die Postfach-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Delete Exchange mailbox
  app.delete("/api/exchange/mailboxes/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteExchangeMailbox(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      logger.error("exchange", "Fehler beim Löschen des Postfachs", { description: String(error), cause: "Löschfehler", solution: "Überprüfen Sie die Postfach-ID" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get assignment rules for a mailbox
  app.get("/api/exchange/mailboxes/:mailboxId/rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rules = await storage.getExchangeAssignmentRules(req.params.mailboxId, req.user?.tenantId ?? "");
      res.json(rules);
    } catch (error) {
      logger.error("exchange", "Fehler beim Abrufen der Regeln", { description: String(error), cause: "Datenbankfehler", solution: "Überprüfen Sie die Datenbankverbindung" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Create assignment rule
  app.post("/api/exchange/mailboxes/:mailboxId/rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rule = await storage.createExchangeAssignmentRule({
        ...req.body,
        mailboxId: req.params.mailboxId,
        tenantId: req.user?.tenantId ?? ""
      });
      res.status(201).json(rule);
    } catch (error) {
      logger.error("exchange", "Fehler beim Erstellen der Regel", { description: String(error), cause: "Erstellungsfehler", solution: "Überprüfen Sie die Regel-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update assignment rule
  app.patch("/api/exchange/rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rule = await storage.updateExchangeAssignmentRule(req.params.id, req.body, req.user?.tenantId ?? "");
      if (!rule) {
        return res.status(404).json({ message: "Regel nicht gefunden" });
      }
      res.json(rule);
    } catch (error) {
      logger.error("exchange", "Fehler beim Aktualisieren der Regel", { description: String(error), cause: "Aktualisierungsfehler", solution: "Überprüfen Sie die Regel-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Delete assignment rule
  app.delete("/api/exchange/rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteExchangeAssignmentRule(req.params.id, req.user?.tenantId ?? "");
      res.status(204).send();
    } catch (error) {
      logger.error("exchange", "Fehler beim Löschen der Regel", { description: String(error), cause: "Löschfehler", solution: "Überprüfen Sie die Regel-ID" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get mail folders for a specific email address
  app.get("/api/exchange/folders/:emailAddress", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user?.tenantId ?? "";
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config || !ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert oder nicht aktiviert" });
      }
      
      const emailAddress = decodeURIComponent(req.params.emailAddress);
      const folders = await ExchangeService.listMailFolders(config, emailAddress);
      
      res.json(folders);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Abrufen der Ordner", {
        description: errMsg,
        cause: "API-Fehler",
        solution: "Überprüfen Sie die Berechtigungen"
      });
      res.status(500).json({ message: errMsg || "Fehler beim Abrufen der Ordner" });
    }
  });

  // Get sync logs
  app.get("/api/exchange/sync-logs", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? Math.min(Number.parseInt(req.query.limit as string, 10) || 50, 1000) : 50;
      const mailboxId = req.query.mailboxId as string | undefined;
      const logs = await storage.getExchangeSyncLogs(req.user?.tenantId ?? "", { mailboxId, limit });
      res.json(logs);
    } catch (error) {
      logger.error("exchange", "Fehler beim Abrufen der Sync-Logs", { description: String(error), cause: "Datenbankfehler", solution: "Überprüfen Sie die Datenbankverbindung" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Manual sync trigger
  app.post("/api/exchange/sync", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user?.tenantId ?? "";
      const { mailboxEmail } = req.body;
      const config = await storage.getExchangeConfiguration(tenantId);

      if (!config || !ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert oder nicht aktiviert" });
      }

      const mailboxes = await storage.getExchangeMailboxes(tenantId);
      let incomingMailboxes = mailboxes.filter((m: ExchangeMailbox) =>
        (m.mailboxType === "incoming" || m.mailboxType === "shared" || m.mailboxType === "user") && m.isActive
      );

      if (mailboxEmail) {
        incomingMailboxes = incomingMailboxes.filter((m: ExchangeMailbox) => m.emailAddress === mailboxEmail);
      }

      if (incomingMailboxes.length === 0) {
        return res.status(400).json({ message: "Keine aktiven Postfächer für den E-Mail-Abruf konfiguriert (Typ: Eingehend oder Gemeinsam)" });
      }

      let totalEmails = 0;
      let totalTickets = 0;
      let totalSkipped = 0;
      const errors: string[] = [];

      for (const mailbox of incomingMailboxes) {
        const result = await syncMailbox(ExchangeService as unknown as ExchangeServiceInterface, config, mailbox, tenantId);
        totalEmails += result.imported;
        totalTickets += result.tickets;
        totalSkipped += result.skipped;
        errors.push(...result.errors);
      }

      logger.info("exchange", "Manuelle Synchronisation", `${totalEmails} E-Mails importiert, ${totalTickets} Tickets erstellt, ${totalSkipped} übersprungen`, { userId: req.user!.id });

      res.json({
        message: "Synchronisation abgeschlossen",
        emailsProcessed: totalEmails,
        emailsSkipped: totalSkipped,
        ticketsCreated: totalTickets,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      logger.error("exchange", "Fehler bei der Synchronisation", { description: String(error), cause: "Synchronisationsfehler", solution: "Überprüfen Sie die Exchange-Konfiguration" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Test-E-Mail senden
  app.post("/api/exchange/send-test", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user?.tenantId ?? "";
      const { mailboxEmail, recipientEmail } = req.body;
      
      if (!mailboxEmail) {
        return res.status(400).json({ message: "E-Mail-Adresse des Postfachs ist erforderlich" });
      }
      
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config || !ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert oder nicht aktiviert" });
      }
      
      const mailboxes = await storage.getExchangeMailboxes(tenantId);
      const mailbox = mailboxes.find(m => m.emailAddress === mailboxEmail);
      
      if (!mailbox) {
        return res.status(404).json({ message: "Postfach nicht gefunden" });
      }
      
      if (!mailbox.isActive) {
        return res.status(400).json({ message: "Das Postfach ist deaktiviert. Aktivieren Sie es zuerst." });
      }
      
      // Legacy "user" Typ kann auch senden (wie "shared")
      if (mailbox.mailboxType !== "outgoing" && mailbox.mailboxType !== "shared" && mailbox.mailboxType !== "user") {
        return res.status(400).json({ message: "Dieses Postfach kann keine E-Mails senden (Typ muss Ausgehend oder Gemeinsam sein)" });
      }
      
      const targetRecipient = recipientEmail || mailboxEmail;
      await ExchangeService.sendTestEmail(config, mailboxEmail, targetRecipient);
      
      logger.info("exchange", "Test-Mail gesendet", `Von ${mailboxEmail} an ${targetRecipient}`, { userId: req.user!.id });
      
      res.json({ 
        message: `Test-E-Mail wurde erfolgreich an ${targetRecipient} gesendet`
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Test-Mailversand", {
        description: errMsg,
        cause: "Senden fehlgeschlagen",
        solution: "Überprüfen Sie die Mail.Send-Berechtigung in Azure AD"
      });
      res.status(500).json({ message: errMsg || "Fehler beim Senden der Test-E-Mail" });
    }
  });

  // ==========================================
  // E-Mail Verarbeitungsregeln
  // ==========================================

  // Alle Regeln abrufen
  app.get("/api/exchange/processing-rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const mailboxId = req.query.mailboxId as string | undefined;
      const rules = await storage.getEmailProcessingRules(tenantId, mailboxId);
      res.json(rules);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Laden der Verarbeitungsregeln", { description: errMsg, cause: "Datenbankfehler", solution: "Fehlerursache prüfen" });
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Regeln" });
    }
  });

  // Einzelne Regel abrufen
  app.get("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const rule = await storage.getEmailProcessingRule(req.params.id, tenantId);
      if (!rule) {
        return res.status(404).json({ message: "Regel nicht gefunden" });
      }
      res.json(rule);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Laden der Regel", { description: errMsg, cause: "Datenbankfehler", solution: "Fehlerursache prüfen" });
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Regel" });
    }
  });

  // Neue Regel erstellen
  app.post("/api/exchange/processing-rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const rule = await storage.createEmailProcessingRule({
        ...req.body,
        tenantId
      });
      logger.info("exchange", "Verarbeitungsregel erstellt", rule.name, { userId: req.user!.id });
      res.status(201).json(rule);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Erstellen der Regel", { description: errMsg, cause: "Erstellungsfehler", solution: "Fehlerursache prüfen" });
      res.status(500).json({ message: errMsg || "Fehler beim Erstellen der Regel" });
    }
  });

  // Regel aktualisieren
  app.patch("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const rule = await storage.updateEmailProcessingRule(req.params.id, req.body, tenantId);
      if (!rule) {
        return res.status(404).json({ message: "Regel nicht gefunden" });
      }
      logger.info("exchange", "Verarbeitungsregel aktualisiert", rule.name, { userId: req.user!.id });
      res.json(rule);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Aktualisieren der Regel", { description: errMsg, cause: "Aktualisierungsfehler", solution: "Fehlerursache prüfen" });
      res.status(500).json({ message: errMsg || "Fehler beim Aktualisieren der Regel" });
    }
  });

  // Regel löschen
  app.delete("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      await storage.deleteEmailProcessingRule(req.params.id, tenantId);
      logger.info("exchange", "Verarbeitungsregel gelöscht", req.params.id, { userId: req.user!.id });
      res.status(204).send();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("exchange", "Fehler beim Löschen der Regel", { description: errMsg, cause: "Löschfehler", solution: "Fehlerursache prüfen" });
      res.status(500).json({ message: errMsg || "Fehler beim Löschen der Regel" });
    }
  });

  // ==========================================
  // Approval Workflows – API
  // ==========================================

  // Alle Workflow-Templates abrufen (Admin)
  app.get("/api/approval-workflows", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const workflows = await storage.getApprovalWorkflows(tenantId);
      res.json(workflows);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Workflows" });
    }
  });

  // Einzelnen Workflow-Template abrufen
  app.get("/api/approval-workflows/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const workflow = await storage.getApprovalWorkflow(req.params.id, tenantId);
      if (!workflow) return res.status(404).json({ message: "Workflow nicht gefunden" });
      res.json(workflow);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden des Workflows" });
    }
  });

  // Workflow-Template erstellen (Admin)
  app.post("/api/approval-workflows", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const parsed = insertApprovalWorkflowSchema.safeParse({ ...req.body, tenantId });
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.issues });
      const workflow = await storage.createApprovalWorkflow(parsed.data);
      logger.info("ticket", "Genehmigungsworkflow erstellt", workflow.name, { userId: req.user!.id });
      res.status(201).json(workflow);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Erstellen des Workflows" });
    }
  });

  // Workflow-Template aktualisieren (Admin)
  app.patch("/api/approval-workflows/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const workflow = await storage.updateApprovalWorkflow(req.params.id, req.body, tenantId);
      if (!workflow) return res.status(404).json({ message: "Workflow nicht gefunden" });
      logger.info("ticket", "Genehmigungsworkflow aktualisiert", workflow.name, { userId: req.user!.id });
      res.json(workflow);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Aktualisieren des Workflows" });
    }
  });

  // Workflow-Template löschen (Admin)
  app.delete("/api/approval-workflows/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      await storage.deleteApprovalWorkflow(req.params.id, tenantId);
      logger.info("ticket", "Genehmigungsworkflow gelöscht", req.params.id, { userId: req.user!.id });
      res.status(204).send();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Löschen des Workflows" });
    }
  });

  // Schritt zu Workflow hinzufügen
  app.post("/api/approval-workflows/:id/steps", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = insertApprovalWorkflowStepSchema.safeParse({ ...req.body, workflowId: req.params.id });
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.issues });
      const step = await storage.createApprovalWorkflowStep(parsed.data);
      res.status(201).json(step);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Erstellen des Schritts" });
    }
  });

  // Schritt aktualisieren
  app.patch("/api/approval-workflows/:id/steps/:stepId", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const step = await storage.updateApprovalWorkflowStep(req.params.stepId, req.body);
      if (!step) return res.status(404).json({ message: "Schritt nicht gefunden" });
      res.json(step);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Aktualisieren des Schritts" });
    }
  });

  // Schritt löschen
  app.delete("/api/approval-workflows/:id/steps/:stepId", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteApprovalWorkflowStep(req.params.stepId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Löschen des Schritts" });
    }
  });

  // Alle Genehmigungsanfragen abrufen (mit Filter)
  app.get("/api/approvals", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const { ticketId, status, mine } = req.query as { ticketId?: string; status?: string; mine?: string };
      const params: { ticketId?: string; status?: string; requestedById?: string } = {};
      if (ticketId) params.ticketId = ticketId;
      if (status) params.status = status;
      if (mine === "true") params.requestedById = req.user!.id;
      const requests = await storage.getApprovalRequests(tenantId, params);
      res.json(requests);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Genehmigungen" });
    }
  });

  // Offene Genehmigungen für den angemeldeten Benutzer (für Badge)
  app.get("/api/approvals/pending/count", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const pending = await storage.getPendingApprovalsForUser(req.user!.id, tenantId);
      res.json({ count: pending.length });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Genehmigungen" });
    }
  });

  // Meine offenen Genehmigungen (wo ich Approver bin)
  app.get("/api/approvals/pending", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const pending = await storage.getPendingApprovalsForUser(req.user!.id, tenantId);
      res.json(pending);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Genehmigungen" });
    }
  });

  // Einzelne Genehmigungsanfrage abrufen
  app.get("/api/approvals/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const request = await storage.getApprovalRequest(req.params.id, tenantId);
      if (!request) return res.status(404).json({ message: "Genehmigungsanfrage nicht gefunden" });
      res.json(request);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Laden der Genehmigung" });
    }
  });

  // Genehmigungsanfrage für ein Ticket erstellen
  app.post("/api/approvals", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const parsed = insertApprovalRequestSchema.safeParse({ ...req.body, tenantId, requestedById: req.user!.id });
      if (!parsed.success) return res.status(400).json({ message: "Ungültige Daten", errors: parsed.error.issues });

      // Prüfen ob bereits eine aktive Anfrage existiert
      const existing = await storage.getTicketApprovalRequest(parsed.data.ticketId!, tenantId);
      if (existing && existing.status === "pending") {
        return res.status(409).json({ message: "Für dieses Ticket existiert bereits eine aktive Genehmigungsanfrage" });
      }

      const request = await storage.createApprovalRequest(parsed.data);

      // Workflow laden und erste Schritte initialisieren
      const workflow = await storage.getApprovalWorkflow(request.workflowId!, tenantId);
      if (workflow && workflow.steps.length > 0) {
        // Ersten Schritt auf currentStepOrder=1 setzen (bereits Standard)
        logger.info("ticket", "Genehmigungsanfrage erstellt", `Ticket ${parsed.data.ticketId} – Workflow ${request.workflowId}`, { userId: req.user!.id });
      }

      const detailed = await storage.getApprovalRequest(request.id, tenantId);
      res.status(201).json(detailed);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Erstellen der Genehmigungsanfrage" });
    }
  });

  // Genehmigungsanfrage abbrechen
  app.post("/api/approvals/:id/cancel", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const request = await storage.getApprovalRequest(req.params.id, tenantId);
      if (!request) return res.status(404).json({ message: "Genehmigungsanfrage nicht gefunden" });
      if (request.status !== "pending") return res.status(400).json({ message: "Nur ausstehende Anfragen können abgebrochen werden" });

      const updated = await storage.updateApprovalRequest(req.params.id, { status: "cancelled" } as any, tenantId);
      logger.info("ticket", "Genehmigungsanfrage abgebrochen", req.params.id, { userId: req.user!.id });
      res.json(updated);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler beim Abbrechen" });
    }
  });

  // Genehmigungsentscheidung treffen (genehmigen / ablehnen)
  app.post("/api/approvals/:id/decide", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user?.tenantId ?? "";
      const { decision, comment } = req.body as { decision: "approved" | "rejected"; comment?: string };

      if (!["approved", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "Entscheidung muss 'approved' oder 'rejected' sein" });
      }

      const request = await storage.getApprovalRequest(req.params.id, tenantId);
      if (!request) return res.status(404).json({ message: "Genehmigungsanfrage nicht gefunden" });
      if (request.status !== "pending") return res.status(400).json({ message: "Anfrage ist nicht mehr ausstehend" });

      const currentStep = request.currentStep;
      if (!currentStep) return res.status(400).json({ message: "Kein aktueller Schritt gefunden" });

      // Berechtigungsprüfung: Benutzer muss Approver für diesen Schritt sein
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const isApprover =
        (currentStep.approverType === "user" && currentStep.approverId === userId) ||
        (currentStep.approverType === "role" && currentStep.approverRole === userRole);

      if (!isApprover) {
        return res.status(403).json({ message: "Sie sind nicht berechtigt, diesen Schritt zu genehmigen" });
      }

      // Entscheidung speichern
      await storage.createApprovalDecision({
        requestId: request.id,
        stepId: currentStep.id,
        stepOrder: currentStep.order,
        approverId: userId,
        decision,
        comment: comment || null,
        decidedAt: new Date(),
      } as any);

      if (decision === "rejected") {
        // Abgelehnt – gesamte Anfrage als rejected markieren
        await storage.updateApprovalRequest(req.params.id, { status: "rejected" } as any, tenantId);
        logger.info("ticket", "Genehmigung abgelehnt", req.params.id, { userId });
      } else {
        // Genehmigt – nächsten Schritt prüfen
        const nextStep = request.workflow?.steps.find(s => s.order === currentStep.order + 1);
        if (nextStep) {
          await storage.updateApprovalRequest(req.params.id, { currentStepOrder: nextStep.order } as any, tenantId);
          logger.info("ticket", `Schritt ${currentStep.order} genehmigt, weiter zu Schritt ${nextStep.order}`, req.params.id, { userId });
        } else {
          // Letzter Schritt – vollständig genehmigt
          await storage.updateApprovalRequest(req.params.id, { status: "approved" } as any, tenantId);
          logger.info("ticket", "Genehmigung vollständig abgeschlossen", req.params.id, { userId });
        }
      }

      const updated = await storage.getApprovalRequest(req.params.id, tenantId);
      res.json(updated);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: errMsg || "Fehler bei der Genehmigungsentscheidung" });
    }
  });

  return httpServer;
}
