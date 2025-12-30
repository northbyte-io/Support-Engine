import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { logger } from "./logger";
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authMiddleware, 
  adminMiddleware, 
  agentMiddleware,
  type AuthenticatedRequest 
} from "./auth";
import { loginSchema, registerSchema, insertTicketSchema, insertCommentSchema, insertAreaSchema, insertUserSchema, insertTicketTypeSchema, insertSlaDefinitionSchema, insertSlaEscalationSchema, insertKbCategorySchema, insertKbArticleSchema, insertTicketKbLinkSchema, insertTimeEntrySchema, insertSurveySchema, insertSurveyQuestionSchema, insertSurveyInvitationSchema, insertSurveyResponseSchema, insertAssetCategorySchema, insertAssetSchema, insertAssetLicenseSchema, insertAssetContractSchema, insertTicketAssetSchema, insertAssetHistorySchema, insertProjectSchema, insertProjectMemberSchema, insertBoardColumnSchema, insertTicketProjectSchema, insertOrganizationSchema, insertCustomerSchema, insertCustomerLocationSchema, insertContactSchema, insertTicketContactSchema, insertCustomerActivitySchema, updateTenantBrandingSchema } from "@shared/schema";
import crypto from "crypto";
import { z } from "zod";

// Seed default data for demo
async function seedDefaultData() {
  logger.info("system", "System wird gestartet", "Der Server wird initialisiert und Standarddaten werden geladen");
  try {
    // Check if default tenant exists
    let defaultTenant = await storage.getTenantBySlug("default");
    if (!defaultTenant) {
      defaultTenant = await storage.createTenant({
        name: "Demo Unternehmen",
        slug: "default",
        primaryColor: "#3B82F6",
        isActive: true,
      });
    }

    // Check if admin user exists
    let adminUser = await storage.getUserByEmail("admin@demo.de");
    if (!adminUser) {
      const hashedPw = await hashPassword("admin123");
      adminUser = await storage.createUser({
        email: "admin@demo.de",
        password: hashedPw,
        firstName: "Admin",
        lastName: "Benutzer",
        role: "admin",
        tenantId: defaultTenant.id,
        isActive: true,
      });
    }

    // Create agent user
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

    // Create customer user
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

    // Create sample ticket types
    let ticketTypes = await storage.getTicketTypes(defaultTenant.id);
    if (ticketTypes.length === 0) {
      await storage.createTicketType({ name: "Fehler", description: "Technische Fehler melden", color: "#EF4444", tenantId: defaultTenant.id });
      await storage.createTicketType({ name: "Anfrage", description: "Allgemeine Anfragen", color: "#3B82F6", tenantId: defaultTenant.id });
      await storage.createTicketType({ name: "Verbesserung", description: "Verbesserungsvorschläge", color: "#10B981", tenantId: defaultTenant.id });
      ticketTypes = await storage.getTicketTypes(defaultTenant.id);
    }

    // Create sample areas
    let areasList = await storage.getAreas(defaultTenant.id);
    if (areasList.length === 0) {
      await storage.createArea({ name: "IT-Support", description: "Technischer Support", color: "#3B82F6", tenantId: defaultTenant.id });
      await storage.createArea({ name: "Buchhaltung", description: "Finanzabteilung", color: "#10B981", tenantId: defaultTenant.id });
      await storage.createArea({ name: "Personal", description: "HR-Abteilung", color: "#8B5CF6", tenantId: defaultTenant.id });
      areasList = await storage.getAreas(defaultTenant.id);
    }

    // Create default SLA definition
    let defaultSla = await storage.getDefaultSlaDefinition(defaultTenant.id);
    if (!defaultSla) {
      defaultSla = await storage.createSlaDefinition({
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

    // Create sample tickets
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
          createdById: customerUser!.id,
          typeId: ticketTypes[0].id,
          areaId: areasList[0].id,
        });

        // Add a comment to some tickets
        if (data.status !== "open") {
          await storage.createComment({
            ticketId: ticket.id,
            authorId: agentUser!.id,
            content: "Vielen Dank für Ihre Anfrage. Wir bearbeiten Ihr Ticket schnellstmöglich.",
            isInternal: false,
          });
        }
      }
    }

    console.log("Demo-Daten erfolgreich erstellt");
  } catch (error) {
    console.error("Fehler beim Erstellen der Demo-Daten:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed default data on startup
  await seedDefaultData();
  
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
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
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        logger.security("auth", "Fehlgeschlagener Anmeldeversuch", `Anmeldeversuch mit unbekannter E-Mail-Adresse`, {
          metadata: { email: data.email },
        });
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      const validPassword = await comparePassword(data.password, user.password);
      if (!validPassword) {
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

      await storage.updateUser(user.id, { lastLoginAt: new Date() } as any);

      logger.success("auth", "Erfolgreiche Anmeldung", `Benutzer ${user.firstName} ${user.lastName} hat sich erfolgreich angemeldet`, {
        entityType: "user",
        entityId: user.id,
        tenantId: user.tenantId || undefined,
        userId: user.id,
      });

      const token = generateToken(user);
      res.json({ user: { ...user, password: undefined }, token });
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
      console.error("Get me error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Dashboard Routes
  app.get("/api/dashboard/stats", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/dashboard/workload", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const workload = await storage.getAgentWorkload(req.tenantId);
      res.json(workload);
    } catch (error) {
      console.error("Workload error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket Routes
  app.get("/api/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tickets = await storage.getTickets({ 
        tenantId: req.tenantId,
        limit,
      });
      res.json(tickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      // Enforce tenant isolation
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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

      // Handle assignees
      if (req.body.assigneeIds && Array.isArray(req.body.assigneeIds)) {
        for (const userId of req.body.assigneeIds) {
          await storage.addTicketAssignee({ ticketId: ticket.id, userId, isPrimary: false });
        }
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
      const originalTicket = await storage.getTicket(req.params.id);
      if (!originalTicket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (originalTicket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const previousStatus = originalTicket.status;
      
      // Update with tenant isolation enforced at storage level
      const ticket = await storage.updateTicket(req.params.id, req.body, req.tenantId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }

      // Check if status changed to "closed" - trigger survey
      if (previousStatus !== "closed" && ticket.status === "closed") {
        try {
          const activeSurvey = await storage.getActiveSurvey(req.tenantId!);
          if (activeSurvey && originalTicket.createdById) {
            // Create survey invitation with unique token
            const token = crypto.randomBytes(32).toString("hex");
            await storage.createSurveyInvitation({
              tenantId: req.tenantId!,
              surveyId: activeSurvey.id,
              ticketId: ticket.id,
              userId: originalTicket.createdById,
              token,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });
            console.log(`Survey invitation created for ticket ${ticket.ticketNumber}`);
          }
        } catch (surveyError) {
          console.error("Error creating survey invitation:", surveyError);
          // Don't fail the ticket update if survey creation fails
        }
      }

      res.json(ticket);
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/tickets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Delete with tenant isolation enforced at storage level
      await storage.deleteTicket(req.params.id, req.tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket Comments
  app.post("/api/tickets/:id/comments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // First check tenant isolation
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      const data = insertCommentSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        authorId: req.user!.id,
      });

      const comment = await storage.createComment(data);

      // Parse @mentions from comment content
      const mentionPattern = /@(\S+@\S+\.\S+|\w+)/g;
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
            tenantId: req.tenantId!,
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket Types
  app.get("/api/ticket-types", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const types = await storage.getTicketTypes(req.tenantId);
      res.json(types);
    } catch (error) {
      console.error("Get ticket types error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (!tenant || !tenant.isActive) {
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
      console.error("Get public tenant error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Users
  app.get("/api/users", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getUsers(req.tenantId);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Areas
  app.get("/api/areas", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const areasList = await storage.getAreas(req.tenantId);
      res.json(areasList);
    } catch (error) {
      console.error("Get areas error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create area error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Update area error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/areas/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteArea(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete area error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // SLA Definition Routes
  app.get("/api/sla-definitions", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const slaDefinitions = await storage.getSlaDefinitions(req.tenantId);
      res.json(slaDefinitions);
    } catch (error) {
      console.error("Get SLA definitions error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/sla-definitions/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const sla = await storage.getSlaDefinition(req.params.id);
      if (!sla) {
        return res.status(404).json({ message: "SLA-Definition nicht gefunden" });
      }
      // Enforce tenant isolation
      if (sla.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      res.json(sla);
    } catch (error) {
      console.error("Get SLA definition error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create SLA definition error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/sla-definitions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check tenant ownership first
      const existing = await storage.getSlaDefinition(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "SLA-Definition nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      // Only allow safe fields to be updated (not tenantId)
      const { tenantId, id, ...safeUpdates } = req.body;
      const sla = await storage.updateSlaDefinition(req.params.id, safeUpdates);
      res.json(sla);
    } catch (error) {
      console.error("Update SLA definition error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/sla-definitions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check tenant ownership first
      const existing = await storage.getSlaDefinition(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "SLA-Definition nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteSlaDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete SLA definition error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // SLA Escalation Routes
  app.post("/api/sla-definitions/:id/escalations", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Check SLA definition tenant ownership first
      const slaDef = await storage.getSlaDefinition(req.params.id);
      if (!slaDef) {
        return res.status(404).json({ message: "SLA-Definition nicht gefunden" });
      }
      if (slaDef.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const data = insertSlaEscalationSchema.parse({
        ...req.body,
        slaDefinitionId: req.params.id,
      });

      const escalation = await storage.createSlaEscalation(data);
      res.status(201).json(escalation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create SLA escalation error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/sla-escalations/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteSlaEscalation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete SLA escalation error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Portal get tickets error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/portal/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      
      // Enforce tenant isolation
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
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
      console.error("Portal get ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Portal create ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Knowledge Base Category Routes
  app.get("/api/kb/categories", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await storage.getKbCategories(req.tenantId!);
      res.json(categories);
    } catch (error) {
      console.error("Get KB categories error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/kb/categories/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await storage.getKbCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      if (category.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      res.json(category);
    } catch (error) {
      console.error("Get KB category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create KB category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/kb/categories/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getKbCategory(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { tenantId, id, ...safeUpdates } = req.body;
      const category = await storage.updateKbCategory(req.params.id, safeUpdates);
      res.json(category);
    } catch (error) {
      console.error("Update KB category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/kb/categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getKbCategory(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteKbCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete KB category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Get KB articles error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/kb/articles/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getKbArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Artikel nicht gefunden" });
      }
      if (article.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      // Customers can only see public, published articles
      if (req.user?.role === "customer" && (article.status !== "published" || !article.isPublic)) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      // Increment view count
      await storage.incrementKbArticleViewCount(req.params.id);
      res.json(article);
    } catch (error) {
      console.error("Get KB article error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Helper function to generate slug
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[äÄ]/g, "ae")
      .replace(/[öÖ]/g, "oe")
      .replace(/[üÜ]/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create KB article error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/kb/articles/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getKbArticle(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Artikel nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
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
      
      const { tenantId, id, ...safeUpdates } = req.body;
      // Increment version if content changed
      if (req.body.content && req.body.content !== existing.content) {
        (safeUpdates as Record<string, unknown>).version = (existing.version || 1) + 1;
      }
      const article = await storage.updateKbArticle(req.params.id, safeUpdates);
      res.json(article);
    } catch (error) {
      console.error("Update KB article error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/kb/articles/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getKbArticle(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Artikel nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteKbArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete KB article error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // KB Article Versions
  app.get("/api/kb/articles/:id/versions", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getKbArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Artikel nicht gefunden" });
      }
      if (article.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const versions = await storage.getKbArticleVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error("Get KB article versions error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket KB Links
  app.get("/api/tickets/:ticketId/kb-links", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const links = await storage.getTicketKbLinks(req.params.ticketId);
      res.json(links);
    } catch (error) {
      console.error("Get ticket KB links error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/tickets/:ticketId/kb-links", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const data = insertTicketKbLinkSchema.parse({
        ticketId: req.params.ticketId,
        articleId: req.body.articleId,
        linkedById: req.user!.id,
      });
      const link = await storage.createTicketKbLink(data);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create ticket KB link error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/ticket-kb-links/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTicketKbLink(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete ticket KB link error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Portal get KB articles error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Get time entries error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Get time entry summary error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Zeiteintrag nicht gefunden" });
      }
      // Tenant isolation check
      if (entry.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Get time entry error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/time-entries", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTimeEntrySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
        userId: req.user!.id,
        date: new Date(req.body.date),
      });
      const entry = await storage.createTimeEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create time entry error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Zeiteintrag nicht gefunden" });
      }
      // Tenant isolation check
      if (entry.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const updates: Record<string, unknown> = { ...req.body };
      if (req.body.date) {
        updates.date = new Date(req.body.date);
      }
      delete updates.tenantId;
      delete updates.userId;
      delete updates.id;
      
      const updatedEntry = await storage.updateTimeEntry(req.params.id, updates);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Update time entry error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/time-entries/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Zeiteintrag nicht gefunden" });
      }
      // Tenant isolation check
      if (entry.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteTimeEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete time entry error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get time entries for a specific ticket
  app.get("/api/tickets/:ticketId/time-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      // Customers can only see time entries if they're the ticket creator
      if (req.user!.role === "customer" && ticket.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const entries = await storage.getTimeEntries(req.tenantId!, { ticketId: req.params.ticketId });
      res.json(entries);
    } catch (error) {
      console.error("Get ticket time entries error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Create time entry for a specific ticket
  app.post("/api/tickets/:ticketId/time-entries", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const data = insertTimeEntrySchema.parse({
        ...req.body,
        tenantId: req.tenantId,
        ticketId: req.params.ticketId,
        userId: req.user!.id,
        date: new Date(req.body.date),
      });
      const entry = await storage.createTimeEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create ticket time entry error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get time entry summary for a specific ticket
  app.get("/api/tickets/:ticketId/time-summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const summary = await storage.getTimeEntrySummary(req.tenantId!, { ticketId: req.params.ticketId });
      res.json(summary);
    } catch (error) {
      console.error("Get ticket time summary error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // ==================== NOTIFICATIONS ====================

  // Get notifications for current user
  app.get("/api/notifications", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const notificationsList = await storage.getNotifications(
        req.tenantId!,
        req.user!.id,
        { unreadOnly, limit }
      );
      res.json(notificationsList);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.tenantId!, req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.tenantId!, req.user!.id);
      res.json({ message: "Alle Benachrichtigungen als gelesen markiert" });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // ==================== SURVEYS (UMFRAGEN) ====================

  // Get all surveys for tenant
  app.get("/api/surveys", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const surveyList = await storage.getSurveys(req.tenantId!);
      res.json(surveyList);
    } catch (error) {
      console.error("Get surveys error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get single survey
  app.get("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (survey.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Get survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update survey
  app.patch("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getSurvey(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const { tenantId, id, ...safeUpdates } = req.body;
      const survey = await storage.updateSurvey(req.params.id, safeUpdates);
      res.json(survey);
    } catch (error) {
      console.error("Update survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Delete survey
  app.delete("/api/surveys/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await storage.getSurvey(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      await storage.deleteSurvey(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Survey Questions
  app.get("/api/surveys/:surveyId/questions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await storage.getSurvey(req.params.surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (survey.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const questions = await storage.getSurveyQuestions(req.params.surveyId);
      res.json(questions);
    } catch (error) {
      console.error("Get survey questions error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/surveys/:surveyId/questions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await storage.getSurvey(req.params.surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (survey.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      
      const data = insertSurveyQuestionSchema.parse({
        ...req.body,
        surveyId: req.params.surveyId,
      });
      const question = await storage.createSurveyQuestion(data);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create survey question error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/survey-questions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { surveyId, id, ...safeUpdates } = req.body;
      const question = await storage.updateSurveyQuestion(req.params.id, safeUpdates);
      if (!question) {
        return res.status(404).json({ message: "Frage nicht gefunden" });
      }
      res.json(question);
    } catch (error) {
      console.error("Update survey question error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/survey-questions/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteSurveyQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete survey question error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Survey Invitations
  app.get("/api/surveys/:surveyId/invitations", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await storage.getSurvey(req.params.surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (survey.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const invitations = await storage.getSurveyInvitations(req.tenantId!, req.params.surveyId);
      res.json(invitations);
    } catch (error) {
      console.error("Get survey invitations error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Survey Results Summary
  app.get("/api/surveys/:surveyId/results", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const survey = await storage.getSurvey(req.params.surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Umfrage nicht gefunden" });
      }
      if (survey.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const summary = await storage.getSurveyResultSummary(req.tenantId!, req.params.surveyId);
      res.json(summary);
    } catch (error) {
      console.error("Get survey results error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("Get public survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Submit survey error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      const categories = await storage.getAssetCategories(req.user!.tenantId!);
      res.json(categories);
    } catch (error) {
      console.error("Get asset categories error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/asset-categories", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAssetCategorySchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      const category = await storage.createAssetCategory(data, req.user!.tenantId!);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create asset category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/asset-categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await storage.getAssetCategory(req.params.id, req.user!.tenantId!);
      if (!category) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      const updated = await storage.updateAssetCategory(req.params.id, req.body, req.user!.tenantId!);
      res.json(updated);
    } catch (error) {
      console.error("Update asset category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/asset-categories/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const category = await storage.getAssetCategory(req.params.id, req.user!.tenantId!);
      if (!category) {
        return res.status(404).json({ message: "Kategorie nicht gefunden" });
      }
      await storage.deleteAssetCategory(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete asset category error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Assets
  app.get("/api/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { assetType, status, categoryId, assignedToId, search } = req.query;
      const assets = await storage.getAssets(req.user!.tenantId!, {
        assetType: assetType as string | undefined,
        status: status as string | undefined,
        categoryId: categoryId as string | undefined,
        assignedToId: assignedToId as string | undefined,
        search: search as string | undefined,
      });
      res.json(assets);
    } catch (error) {
      console.error("Get assets error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/assets/next-number", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const assetNumber = await storage.getNextAssetNumber(req.user!.tenantId!);
      res.json({ assetNumber });
    } catch (error) {
      console.error("Get next asset number error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user!.tenantId!);
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Get asset error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAssetSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      const asset = await storage.createAsset(data, req.user!.tenantId!);

      // Create history entry
      await storage.createAssetHistory({
        assetId: asset.id,
        userId: req.user!.id,
        action: "created",
        description: "Asset erstellt",
      }, req.user!.tenantId!);

      // If software/license type, create license entry
      if ((asset.assetType === "software" || asset.assetType === "license") && req.body.license) {
        const licenseData = insertAssetLicenseSchema.parse({
          ...req.body.license,
          assetId: asset.id,
        });
        await storage.createAssetLicense(licenseData, req.user!.tenantId!);
      }

      // If contract type, create contract entry
      if (asset.assetType === "contract" && req.body.contract) {
        const contractData = insertAssetContractSchema.parse({
          ...req.body.contract,
          assetId: asset.id,
        });
        await storage.createAssetContract(contractData, req.user!.tenantId!);
      }

      const fullAsset = await storage.getAsset(asset.id, req.user!.tenantId!);
      res.status(201).json(fullAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create asset error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user!.tenantId!);
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }

      const updated = await storage.updateAsset(req.params.id, req.body, req.user!.tenantId!);

      // Create history entry for update
      await storage.createAssetHistory({
        assetId: req.params.id,
        userId: req.user!.id,
        action: "updated",
        description: "Asset aktualisiert",
        previousValue: asset,
        newValue: updated,
      }, req.user!.tenantId!);

      // Update license if provided
      if (req.body.license) {
        const existingLicense = await storage.getAssetLicense(req.params.id, req.user!.tenantId!);
        if (existingLicense) {
          await storage.updateAssetLicense(existingLicense.id, req.body.license, req.user!.tenantId!);
        } else {
          await storage.createAssetLicense({ ...req.body.license, assetId: req.params.id }, req.user!.tenantId!);
        }
      }

      // Update contract if provided
      if (req.body.contract) {
        const existingContract = await storage.getAssetContract(req.params.id, req.user!.tenantId!);
        if (existingContract) {
          await storage.updateAssetContract(existingContract.id, req.body.contract, req.user!.tenantId!);
        } else {
          await storage.createAssetContract({ ...req.body.contract, assetId: req.params.id }, req.user!.tenantId!);
        }
      }

      const fullAsset = await storage.getAsset(req.params.id, req.user!.tenantId!);
      res.json(fullAsset);
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/assets/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await storage.getAsset(req.params.id, req.user!.tenantId!);
      if (!asset) {
        return res.status(404).json({ message: "Asset nicht gefunden" });
      }
      await storage.deleteAsset(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete asset error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket Assets (linking)
  app.get("/api/tickets/:ticketId/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketAssets = await storage.getTicketAssets(req.params.ticketId, req.user!.tenantId!);
      res.json(ticketAssets);
    } catch (error) {
      console.error("Get ticket assets error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/tickets/:ticketId/assets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketAssetSchema.parse({
        ticketId: req.params.ticketId,
        assetId: req.body.assetId,
      });
      const link = await storage.createTicketAsset(data, req.user!.tenantId!);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket oder Asset nicht gefunden" });
      }
      console.error("Create ticket asset link error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/ticket-assets/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTicketAsset(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete ticket asset link error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Asset tickets (get tickets linked to an asset)
  app.get("/api/assets/:assetId/tickets", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const assetTickets = await storage.getAssetTickets(req.params.assetId, req.user!.tenantId!);
      res.json(assetTickets);
    } catch (error) {
      console.error("Get asset tickets error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Asset history
  app.get("/api/assets/:assetId/history", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const history = await storage.getAssetHistory(req.params.assetId, req.user!.tenantId!);
      res.json(history);
    } catch (error) {
      console.error("Get asset history error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // =================== Projects API ===================

  // List all projects
  app.get("/api/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const projects = await storage.getProjects(req.user!.tenantId!);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get single project
  app.get("/api/projects/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user!.tenantId!);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      res.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Create project
  app.post("/api/projects", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data, req.user!.tenantId!);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user!.tenantId!);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      const updated = await storage.updateProject(req.params.id, req.body, req.user!.tenantId!);
      res.json(updated);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user!.tenantId!);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      await storage.deleteProject(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Project members
  app.get("/api/projects/:projectId/members", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId, req.user!.tenantId!);
      res.json(members);
    } catch (error) {
      console.error("Get project members error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/projects/:projectId/members", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertProjectMemberSchema.parse({
        projectId: req.params.projectId,
        userId: req.body.userId,
        role: req.body.role,
      });
      const member = await storage.addProjectMember(data, req.user!.tenantId!);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      console.error("Add project member error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeProjectMember(req.params.projectId, req.params.userId, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Remove project member error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Board columns
  app.get("/api/projects/:projectId/columns", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const columns = await storage.getBoardColumns(req.params.projectId, req.user!.tenantId!);
      res.json(columns);
    } catch (error) {
      console.error("Get board columns error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/projects/:projectId/columns", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertBoardColumnSchema.parse({
        projectId: req.params.projectId,
        ...req.body,
      });
      const column = await storage.createBoardColumn(data, req.user!.tenantId!);
      res.status(201).json(column);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create board column error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/board-columns/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const column = await storage.updateBoardColumn(req.params.id, req.body, req.user!.tenantId!);
      if (!column) {
        return res.status(404).json({ message: "Spalte nicht gefunden" });
      }
      res.json(column);
    } catch (error) {
      console.error("Update board column error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/board-columns/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteBoardColumn(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete board column error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/projects/:projectId/columns/reorder", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.reorderBoardColumns(req.params.projectId, req.body.columnIds, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Reorder board columns error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket-Project assignments
  app.get("/api/tickets/:ticketId/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketProjects = await storage.getTicketProjects(req.params.ticketId, req.user!.tenantId!);
      res.json(ticketProjects);
    } catch (error) {
      console.error("Get ticket projects error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/tickets/:ticketId/projects", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketProjectSchema.parse({
        ticketId: req.params.ticketId,
        projectId: req.body.projectId,
        boardOrder: req.body.boardOrder || 0,
      });
      const link = await storage.addTicketToProject(data, req.user!.tenantId!);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket oder Projekt nicht gefunden" });
      }
      console.error("Add ticket to project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/tickets/:ticketId/projects/:projectId", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeTicketFromProject(req.params.ticketId, req.params.projectId, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Remove ticket from project error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Project board view (tickets grouped by column)
  app.get("/api/projects/:projectId/board", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await storage.getProject(req.params.projectId, req.user!.tenantId!);
      if (!project) {
        return res.status(404).json({ message: "Projekt nicht gefunden" });
      }
      const board = await storage.getProjectTickets(req.params.projectId, req.user!.tenantId!);
      res.json({ project, board });
    } catch (error) {
      console.error("Get project board error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update ticket board order (for drag-drop)
  app.patch("/api/projects/:projectId/tickets/:ticketId/order", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.updateTicketBoardOrder(req.params.ticketId, req.params.projectId, req.body.boardOrder, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Update ticket board order error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // ============================================
  // CRM - Organizations
  // ============================================

  app.get("/api/organizations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const orgs = await storage.getOrganizations(req.user!.tenantId!, { search });
      res.json(orgs);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/organizations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const org = await storage.getOrganization(req.params.id, req.user!.tenantId!);
      if (!org) {
        return res.status(404).json({ message: "Organisation nicht gefunden" });
      }
      res.json(org);
    } catch (error) {
      console.error("Get organization error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/organizations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(data, req.user!.tenantId!);
      res.status(201).json(org);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create organization error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/organizations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const org = await storage.updateOrganization(req.params.id, req.body, req.user!.tenantId!);
      if (!org) {
        return res.status(404).json({ message: "Organisation nicht gefunden" });
      }
      res.json(org);
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/organizations/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteOrganization(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete organization error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // ============================================
  // CRM - Customers
  // ============================================

  app.get("/api/customers", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const organizationId = req.query.organizationId as string | undefined;
      const customers = await storage.getCustomers(req.user!.tenantId!, { search, organizationId });
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/customers/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id, req.user!.tenantId!);
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/customers", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Auto-generate customer number if not provided
      const existingCustomers = await storage.getCustomers(req.user!.tenantId!, {});
      const nextNumber = existingCustomers.length + 1;
      const customerNumber = `KD-${String(nextNumber).padStart(5, '0')}`;
      
      const dataWithNumber = { ...req.body, customerNumber };
      const data = insertCustomerSchema.parse(dataWithNumber);
      const customer = await storage.createCustomer(data, req.user!.tenantId!);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create customer error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/customers/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body, req.user!.tenantId!);
      if (!customer) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/customers/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteCustomer(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Customer locations
  app.get("/api/customers/:customerId/locations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const locations = await storage.getCustomerLocations(req.params.customerId, req.user!.tenantId!);
      res.json(locations);
    } catch (error) {
      console.error("Get customer locations error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/customers/:customerId/locations", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertCustomerLocationSchema.parse({
        customerId: req.params.customerId,
        ...req.body,
      });
      const location = await storage.createCustomerLocation(data, req.user!.tenantId!);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Kunde nicht gefunden" });
      }
      console.error("Create customer location error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/customer-locations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const location = await storage.updateCustomerLocation(req.params.id, req.body, req.user!.tenantId!);
      if (!location) {
        return res.status(404).json({ message: "Standort nicht gefunden" });
      }
      res.json(location);
    } catch (error) {
      console.error("Update customer location error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/customer-locations/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteCustomerLocation(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete customer location error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      const contacts = await storage.getContacts(req.user!.tenantId!, { search, customerId, organizationId });
      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await storage.getContact(req.params.id, req.user!.tenantId!);
      if (!contact) {
        return res.status(404).json({ message: "Kontakt nicht gefunden" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data, req.user!.tenantId!);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.body, req.user!.tenantId!);
      if (!contact) {
        return res.status(404).json({ message: "Kontakt nicht gefunden" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Update contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/contacts/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteContact(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // ============================================
  // CRM - Ticket Contacts
  // ============================================

  app.get("/api/tickets/:ticketId/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketContacts = await storage.getTicketContacts(req.params.ticketId, req.user!.tenantId!);
      res.json(ticketContacts);
    } catch (error) {
      console.error("Get ticket contacts error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/tickets/:ticketId/contacts", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketContactSchema.parse({
        ticketId: req.params.ticketId,
        contactId: req.body.contactId,
        role: req.body.role || "requester",
      });
      const link = await storage.addTicketContact(data, req.user!.tenantId!);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("gehört nicht zum Mandanten")) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      console.error("Add ticket contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.delete("/api/ticket-contacts/:id", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeTicketContact(req.params.id, req.user!.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error("Remove ticket contact error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getCustomerActivities(req.user!.tenantId!, { customerId, contactId, ticketId, limit });
      res.json(activities);
    } catch (error) {
      console.error("Get customer activities error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.post("/api/customer-activities", authMiddleware, agentMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertCustomerActivitySchema.parse({
        ...req.body,
        createdById: req.user!.id,
      });
      const activity = await storage.createCustomerActivity(data, req.user!.tenantId!);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create customer activity error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const result = logger.getLogs(filters as any);
      res.json(result);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.get("/api/logs/files", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { logger } = await import("./logger");
      const files = logger.getLogFiles();
      res.json({ files });
    } catch (error) {
      console.error("Get log files error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
        metadata: { testType: "security", ipAddress: "192.168.1.100", failedAttempts: 5 },
      });

      // Performance log
      logger.performance("api", "Performance-Test", 2500, {
        tenantId: req.tenantId || undefined,
        userId: req.user!.id,
        metadata: { testType: "performance", endpoint: "/api/tickets", method: "GET" },
      });

      res.json({ message: "Test-Logs wurden erfolgreich erstellt", count: 6 });
    } catch (error) {
      console.error("Test logs error:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Test-Logs" });
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
      const result = logger.getLogs(filters as any);
      
      if (format === "csv") {
        const headers = ["Zeitstempel", "Level", "Quelle", "Entitätstyp", "Titel", "Beschreibung", "Mandant", "Benutzer"];
        const rows = result.logs.map((log: any) => [
          log.timestampFormatted,
          log.level,
          log.source,
          log.entityType,
          `"${(log.title || "").replace(/"/g, '""')}"`,
          `"${(log.description || "").replace(/"/g, '""')}"`,
          log.tenantId || "",
          log.userId || "",
        ].join(";"));
        const csv = [headers.join(";"), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.csv`);
        res.send("\uFEFF" + csv); // BOM for Excel
      } else if (format === "txt") {
        const txt = result.logs.map((log: any) => 
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
      console.error("Export logs error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  return httpServer;
}
