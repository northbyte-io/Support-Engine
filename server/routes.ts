import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client as ObjectStorageClient } from "@replit/object-storage";
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

    // Create sample customers
    const existingCustomers = await storage.getCustomers(defaultTenant.id);
    if (existingCustomers.length === 0) {
      const customerData = [
        { 
          customerNumber: "KD-00001", 
          name: "Mustermann GmbH", 
          email: "kontakt@mustermann.de",
          phone: "+49 30 1234567",
          address: "Musterstraße 123",
          city: "Berlin",
          postalCode: "10115",
          country: "Deutschland",
          tenantId: defaultTenant.id
        },
        { 
          customerNumber: "KD-00002", 
          name: "Beispiel AG", 
          email: "info@beispiel-ag.de",
          phone: "+49 89 9876543",
          address: "Beispielweg 45",
          city: "München",
          postalCode: "80331",
          country: "Deutschland",
          tenantId: defaultTenant.id
        },
        { 
          customerNumber: "KD-00003", 
          name: "Schmidt & Partner", 
          email: "kontakt@schmidt-partner.de",
          phone: "+49 40 5555555",
          address: "Partnerplatz 7",
          city: "Hamburg",
          postalCode: "20095",
          country: "Deutschland",
          tenantId: defaultTenant.id
        }
      ];

      for (const data of customerData) {
        await storage.createCustomer(data, defaultTenant.id);
      }
    }

    // Create sample contacts for customers
    const customers = await storage.getCustomers(defaultTenant.id);
    const existingContacts = await storage.getContacts(defaultTenant.id);
    if (existingContacts.length === 0 && customers.length > 0) {
      const contactData = [
        { 
          firstName: "Hans", 
          lastName: "Müller",
          email: "h.mueller@mustermann.de",
          phone: "+49 30 1234568",
          position: "IT-Leiter",
          department: "IT",
          customerId: customers[0].id,
          tenantId: defaultTenant.id
        },
        { 
          firstName: "Petra", 
          lastName: "Weber",
          email: "p.weber@mustermann.de",
          phone: "+49 30 1234569",
          position: "Assistenz",
          department: "Verwaltung",
          customerId: customers[0].id,
          tenantId: defaultTenant.id
        },
        { 
          firstName: "Thomas", 
          lastName: "Fischer",
          email: "t.fischer@beispiel-ag.de",
          phone: "+49 89 9876544",
          position: "Geschäftsführer",
          department: "Geschäftsleitung",
          customerId: customers[1].id,
          tenantId: defaultTenant.id
        }
      ];

      for (const data of contactData) {
        await storage.createContact(data, defaultTenant.id);
      }
    }

    // Create sample asset categories
    let assetCategories = await storage.getAssetCategories(defaultTenant.id);
    if (assetCategories.length === 0) {
      await storage.createAssetCategory({ name: "Computer", description: "PCs und Laptops", assetType: "hardware", tenantId: defaultTenant.id });
      await storage.createAssetCategory({ name: "Drucker", description: "Drucker und Scanner", assetType: "hardware", tenantId: defaultTenant.id });
      await storage.createAssetCategory({ name: "Software", description: "Software-Lizenzen", assetType: "software", tenantId: defaultTenant.id });
      assetCategories = await storage.getAssetCategories(defaultTenant.id);
    }

    // Create sample assets for customers
    const existingAssets = await storage.getAssets(defaultTenant.id);
    if (existingAssets.length === 0 && customers.length > 0 && assetCategories.length > 0) {
      const assetData = [
        {
          assetNumber: "AST-00001",
          name: "Dell Latitude 5540",
          assetType: "hardware" as const,
          assetStatus: "active" as const,
          serialNumber: "DELL-1234567890",
          categoryId: assetCategories[0].id,
          customerId: customers[0].id,
          tenantId: defaultTenant.id
        },
        {
          assetNumber: "AST-00002",
          name: "HP LaserJet Pro",
          assetType: "hardware" as const,
          assetStatus: "active" as const,
          serialNumber: "HP-9876543210",
          categoryId: assetCategories[1].id,
          customerId: customers[0].id,
          tenantId: defaultTenant.id
        },
        {
          assetNumber: "AST-00003",
          name: "Microsoft Office 365",
          assetType: "software" as const,
          assetStatus: "active" as const,
          categoryId: assetCategories[2].id,
          customerId: customers[1].id,
          tenantId: defaultTenant.id
        }
      ];

      for (const data of assetData) {
        await storage.createAsset(data, defaultTenant.id);
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
  
  // AGPL-3.0 License endpoints (required for network use)
  app.get("/api/license", async (_req, res) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const licensePath = path.join(process.cwd(), "LICENSE");
      const licenseText = fs.readFileSync(licensePath, "utf-8");
      res.type("text/plain").send(licenseText);
    } catch (error) {
      res.status(500).json({ message: "Lizenz konnte nicht geladen werden" });
    }
  });

  app.get("/api/source", (_req, res) => {
    res.json({
      license: "AGPL-3.0",
      repository: "https://github.com/german-ticket-system/helpdesk",
      notice: "Dieses Programm ist freie Software unter der GNU Affero General Public License v3.0. Der Quellcode ist verfügbar unter der oben genannten URL.",
      endpoints: {
        license: "/api/license",
        source: "/api/source"
      }
    });
  });

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

  // Ticket Attachments - Liste abrufen
  app.get("/api/tickets/:id/attachments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
      }
      if (ticket.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }
      const ticketAttachments = await storage.getAttachments(req.params.id);
      res.json(ticketAttachments);
    } catch (error) {
      console.error("Get attachments error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
        
        buffer = Buffer.from(fileContent.value);
      }
      
      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Download attachment error:", error);
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
      const { assetType, status, categoryId, assignedToId, customerId, search } = req.query;
      const assets = await storage.getAssets(req.user!.tenantId!, {
        assetType: assetType as string | undefined,
        status: status as string | undefined,
        categoryId: categoryId as string | undefined,
        assignedToId: assignedToId as string | undefined,
        customerId: customerId as string | undefined,
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

  // ============================================
  // TLS Certificate Management (Admin only)
  // ============================================

  // Get TLS settings
  app.get("/api/tls/settings", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
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
      console.error("TLS settings error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update TLS settings
  app.patch("/api/tls/settings", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.updateTlsSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("TLS settings update error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get all certificates
  app.get("/api/tls/certificates", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
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
      console.error("TLS certificates error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("TLS certificate error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("TLS certificate request error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("TLS certificate renew error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("TLS certificate revoke error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      console.error("TLS certificate activate error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Delete certificate
  app.delete("/api/tls/certificates/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteTlsCertificate(req.params.id);
      res.json({ message: "Zertifikat gelöscht" });
    } catch (error) {
      console.error("TLS certificate delete error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get certificate actions/history
  app.get("/api/tls/actions", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { tlsService } = await import("./tls-service");
      const certificateId = req.query.certificateId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const actions = await tlsService.getActions(certificateId, limit);
      res.json(actions);
    } catch (error) {
      console.error("TLS actions error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
        daysBeforeExpiry,
        email,
        req.user!.id
      );
      
      res.json({
        message: `${result.renewed} Zertifikat(e) erneuert`,
        renewed: result.renewed,
        errors: result.errors
      });
    } catch (error) {
      console.error("TLS renewal check error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
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
      const config = await storage.getExchangeConfiguration(req.user!.tenantId);
      if (!config) {
        return res.json({ configured: false });
      }
      // Do not return encrypted secrets to frontend
      const { clientSecretEncrypted, certificatePemEncrypted, accessToken, refreshToken, ...safeConfig } = config;
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
      const tenantId = req.user!.tenantId;
      const { clientId, tenantAzureId, authType, clientSecret, certificatePem, certificateThumbprint, isEnabled } = req.body;
      
      let existingConfig = await storage.getExchangeConfiguration(tenantId);
      
      const configData: any = {
        tenantId,
        clientId,
        tenantAzureId,
        authType: authType || "client_secret",
        isEnabled: isEnabled ?? false,
        configuredById: req.user!.id
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
      const { ExchangeService, ExchangeError } = await import("./exchange-service");
      const tenantId = req.user!.tenantId;
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
        const exchangeError = error as any;
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
      const mailboxes = await storage.getExchangeMailboxes(req.user!.tenantId);
      res.json(mailboxes);
    } catch (error) {
      logger.error("exchange", "Fehler beim Abrufen der Postfächer", { description: String(error), cause: "Datenbankfehler", solution: "Überprüfen Sie die Datenbankverbindung" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Create Exchange mailbox
  app.post("/api/exchange/mailboxes", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
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
      res.json(mailbox);
    } catch (error) {
      logger.error("exchange", "Fehler beim Erstellen des Postfachs", { description: String(error), cause: "Erstellungsfehler", solution: "Überprüfen Sie die Postfach-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update Exchange mailbox
  app.patch("/api/exchange/mailboxes/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const mailbox = await storage.updateExchangeMailbox(req.params.id, req.body, req.user!.tenantId);
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
      await storage.deleteExchangeMailbox(req.params.id, req.user!.tenantId);
      res.json({ message: "Postfach gelöscht" });
    } catch (error) {
      logger.error("exchange", "Fehler beim Löschen des Postfachs", { description: String(error), cause: "Löschfehler", solution: "Überprüfen Sie die Postfach-ID" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get assignment rules for a mailbox
  app.get("/api/exchange/mailboxes/:mailboxId/rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rules = await storage.getExchangeAssignmentRules(req.params.mailboxId, req.user!.tenantId);
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
        tenantId: req.user!.tenantId
      });
      res.json(rule);
    } catch (error) {
      logger.error("exchange", "Fehler beim Erstellen der Regel", { description: String(error), cause: "Erstellungsfehler", solution: "Überprüfen Sie die Regel-Daten" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Update assignment rule
  app.patch("/api/exchange/rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const rule = await storage.updateExchangeAssignmentRule(req.params.id, req.body, req.user!.tenantId);
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
      await storage.deleteExchangeAssignmentRule(req.params.id, req.user!.tenantId);
      res.json({ message: "Regel gelöscht" });
    } catch (error) {
      logger.error("exchange", "Fehler beim Löschen der Regel", { description: String(error), cause: "Löschfehler", solution: "Überprüfen Sie die Regel-ID" });
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Get mail folders for a specific email address
  app.get("/api/exchange/folders/:emailAddress", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { ExchangeService } = await import("./exchange-service");
      const tenantId = req.user!.tenantId;
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config || !ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert oder nicht aktiviert" });
      }
      
      const emailAddress = decodeURIComponent(req.params.emailAddress);
      const folders = await ExchangeService.listMailFolders(config, emailAddress);
      
      res.json(folders);
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Abrufen der Ordner", { 
        description: error.message || String(error), 
        cause: "API-Fehler", 
        solution: "Überprüfen Sie die Berechtigungen" 
      });
      res.status(500).json({ message: error.message || "Fehler beim Abrufen der Ordner" });
    }
  });

  // Get sync logs
  app.get("/api/exchange/sync-logs", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const mailboxId = req.query.mailboxId as string | undefined;
      const logs = await storage.getExchangeSyncLogs(req.user!.tenantId, { mailboxId, limit });
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
      const tenantId = req.user!.tenantId;
      const { mailboxEmail } = req.body;
      const config = await storage.getExchangeConfiguration(tenantId);
      
      if (!config || !ExchangeService.isConfigurationValid(config)) {
        return res.status(400).json({ message: "Exchange ist nicht konfiguriert oder nicht aktiviert" });
      }
      
      const mailboxes = await storage.getExchangeMailboxes(tenantId);
      // Hole alle aktiven Postfächer, die E-Mails empfangen können (incoming, shared oder user für Legacy)
      let incomingMailboxes = mailboxes.filter(m => 
        (m.mailboxType === "incoming" || m.mailboxType === "shared" || m.mailboxType === "user") && m.isActive
      );
      
      // Falls eine spezifische E-Mail-Adresse angegeben wurde, nur dieses Postfach synchronisieren
      if (mailboxEmail) {
        incomingMailboxes = incomingMailboxes.filter(m => m.emailAddress === mailboxEmail);
      }
      
      if (incomingMailboxes.length === 0) {
        return res.status(400).json({ message: "Keine aktiven Postfächer für den E-Mail-Abruf konfiguriert (Typ: Eingehend oder Gemeinsam)" });
      }
      
      let totalEmails = 0;
      let totalTickets = 0;
      let totalSkipped = 0;
      const errors: string[] = [];
      
      for (const mailbox of incomingMailboxes) {
        // Per-Mailbox Zähler
        let mailboxImported = 0;
        let mailboxTickets = 0;
        let mailboxSkipped = 0;
        const mailboxErrors: string[] = [];
        const syncStartedAt = new Date();
        
        try {
          const emails = await ExchangeService.fetchEmails(config, mailbox);
          logger.info("exchange", "E-Mails gefunden", `${emails.length} E-Mails in ${mailbox.emailAddress} gefunden`);
          
          for (const graphEmail of emails) {
            try {
              // Prüfen ob E-Mail bereits importiert wurde (über Graph Message ID)
              const existingEmail = await storage.getExchangeEmailByMessageId(tenantId, graphEmail.id);
              if (existingEmail) {
                logger.debug("exchange", "E-Mail übersprungen", `E-Mail ${graphEmail.id} bereits importiert`);
                mailboxSkipped++;
                continue;
              }
              
              // E-Mail in Datenbank speichern
              const emailData = ExchangeService.graphEmailToInsert(graphEmail, mailbox.id, tenantId);
              const savedEmail = await storage.createExchangeEmail(emailData);
              mailboxImported++;
              
              // Ticket erstellen - HTML-Inhalt für volle Formatierung verwenden
              const ticketTitle = graphEmail.subject || "E-Mail ohne Betreff";
              const ticketDescription = graphEmail.body?.content || graphEmail.bodyPreview || "";
              
              const ticket = await storage.createTicket({
                tenantId,
                title: ticketTitle,
                description: ticketDescription,
                status: "open",
                priority: mailbox.defaultPriority || "medium",
                ticketTypeId: mailbox.defaultTicketTypeId || null,
                createdById: null, // System-generiert
                customerId: null,
                customFieldValues: {
                  emailSource: mailbox.emailAddress,
                  fromAddress: graphEmail.from?.emailAddress?.address,
                  fromName: graphEmail.from?.emailAddress?.name,
                  originalMessageId: graphEmail.id
                }
              });
              
              // E-Mail mit Ticket verknüpfen
              await storage.updateExchangeEmail(savedEmail.id, { ticketId: ticket.id }, tenantId);
              mailboxTickets++;
              
              // .eml Datei als Anhang speichern
              try {
                const rawEmailContent = await ExchangeService.getRawEmailContent(config, mailbox.emailAddress, graphEmail.id);
                logger.debug("exchange", ".eml Inhalt abgerufen", `Größe: ${rawEmailContent?.length || 0} Bytes`);
                
                if (rawEmailContent && rawEmailContent.length > 0) {
                  const objectStorage = new ObjectStorageClient();
                  const displayFileName = `email_${ticket.ticketNumber}_${Date.now()}.eml`;
                  const storagePath = `.private/emails/${tenantId}/${displayFileName}.b64`;
                  
                  // Base64-Kodierung für zuverlässige Speicherung im Object Storage
                  const base64Content = rawEmailContent.toString("base64");
                  
                  // In Object Storage als Text speichern (base64-kodiert)
                  await objectStorage.uploadFromText(storagePath, base64Content);
                  
                  // Attachment-Record erstellen (displayFileName ohne .b64)
                  await storage.createAttachment({
                    ticketId: ticket.id,
                    fileName: displayFileName,
                    fileSize: rawEmailContent.length,
                    mimeType: "message/rfc822",
                    storagePath: storagePath,
                    uploadedById: null, // System-generiert
                  });
                  
                  logger.info("exchange", ".eml gespeichert", `E-Mail als ${displayFileName} (${rawEmailContent.length} Bytes) an Ticket ${ticket.ticketNumber} angehängt`);
                } else {
                  logger.warn("exchange", ".eml leer", `Rohe E-Mail-Daten waren leer für Ticket ${ticket.ticketNumber}`);
                }
              } catch (emlError) {
                logger.warn("exchange", ".eml Speicherung fehlgeschlagen", `Konnte .eml nicht speichern: ${emlError}`);
              }
              
              logger.info("exchange", "Ticket erstellt", `Ticket ${ticket.ticketNumber} aus E-Mail von ${graphEmail.from?.emailAddress?.address} erstellt`);
              
              // Post-Import-Aktionen aus Verarbeitungsregeln ausführen
              const processingRules = await storage.getEmailProcessingRules(tenantId, mailbox.id);
              const activeRules = processingRules.filter(r => r.isActive);
              
              // Helper: Prüft ob eine Regel auf die E-Mail passt
              const ruleMatchesEmail = (rule: typeof activeRules[0]): boolean => {
                // Parse conditions JSON
                let conditions: Array<{type: string, value: string, operator?: string}> = [];
                if (rule.conditions) {
                  try {
                    conditions = JSON.parse(rule.conditions);
                  } catch { conditions = []; }
                }
                
                // Wenn keine Conditions, prüfe Legacy conditionType
                if (conditions.length === 0 && rule.conditionType) {
                  conditions = [{ type: rule.conditionType, value: rule.conditionValue || "" }];
                }
                
                // Wenn immer noch keine Conditions -> immer matchen
                if (conditions.length === 0) return true;
                
                const senderEmail = graphEmail.from?.emailAddress?.address?.toLowerCase() || "";
                const senderName = graphEmail.from?.emailAddress?.name?.toLowerCase() || "";
                const subject = graphEmail.subject?.toLowerCase() || "";
                const body = graphEmail.bodyPreview?.toLowerCase() || "";
                
                for (const cond of conditions) {
                  const val = (cond.value || "").toLowerCase();
                  switch (cond.type) {
                    case "imported_emails":
                      return true; // Alle importierten E-Mails
                    case "sender_contains":
                      if (!senderEmail.includes(val) && !senderName.includes(val)) return false;
                      break;
                    case "subject_contains":
                      if (!subject.includes(val)) return false;
                      break;
                    case "body_contains":
                      if (!body.includes(val)) return false;
                      break;
                    case "has_attachment":
                      if (!graphEmail.hasAttachments) return false;
                      break;
                    case "sender_domain":
                      if (!senderEmail.endsWith(val)) return false;
                      break;
                    default:
                      return true; // Unbekannte Typen matchen
                  }
                }
                return true;
              };
              
              for (const rule of activeRules) {
                // Prüfe ob die Regel auf die E-Mail passt
                if (!ruleMatchesEmail(rule)) {
                  logger.debug("exchange", "Regel übersprungen", `Regel "${rule.name}" passt nicht auf E-Mail ${graphEmail.id}`);
                  continue;
                }
                
                // Aktionen aus rule.actions oder Legacy actionType
                let ruleActions: string[] = rule.actions || [];
                if (ruleActions.length === 0 && rule.actionType) {
                  ruleActions = [rule.actionType];
                }
                
                logger.debug("exchange", "Regel angewendet", `Regel "${rule.name}" mit Aktionen: ${ruleActions.join(", ")} auf E-Mail ${graphEmail.id}`);
                
                for (const action of ruleActions) {
                  try {
                    if (action === "mark_as_read") {
                      await ExchangeService.markAsRead(config, mailbox.emailAddress, graphEmail.id);
                      logger.debug("exchange", "Als gelesen markiert", `E-Mail ${graphEmail.id} als gelesen markiert (Regel: ${rule.name})`);
                    } else if (action === "move_to_folder" && rule.actionFolderId) {
                      await ExchangeService.moveEmail(config, mailbox.emailAddress, graphEmail.id, rule.actionFolderId);
                      logger.debug("exchange", "E-Mail verschoben", `E-Mail ${graphEmail.id} nach ${rule.actionFolderName || rule.actionFolderId} verschoben (Regel: ${rule.name})`);
                    } else if (action === "archive") {
                      await ExchangeService.moveEmail(config, mailbox.emailAddress, graphEmail.id, "archive");
                      logger.debug("exchange", "E-Mail archiviert", `E-Mail ${graphEmail.id} wurde archiviert (Regel: ${rule.name})`);
                    } else if (action === "delete") {
                      await ExchangeService.deleteEmail(config, mailbox.emailAddress, graphEmail.id);
                      logger.debug("exchange", "E-Mail gelöscht", `E-Mail ${graphEmail.id} gelöscht (Regel: ${rule.name})`);
                    } else if (action === "keep_unchanged") {
                      logger.debug("exchange", "Keine Aktion", `E-Mail ${graphEmail.id} bleibt unverändert (Regel: ${rule.name})`);
                    }
                  } catch (actionError) {
                    logger.warn("exchange", "Post-Import-Aktion fehlgeschlagen", `Aktion ${action} für E-Mail ${graphEmail.id} fehlgeschlagen (Regel: ${rule.name}): ${actionError}`);
                  }
                }
              }
              
            } catch (emailError) {
              logger.error("exchange", "E-Mail-Verarbeitung fehlgeschlagen", { 
                description: `Fehler bei E-Mail ${graphEmail.id}`, 
                cause: String(emailError) 
              });
              mailboxErrors.push(`E-Mail ${graphEmail.subject}: ${emailError}`);
            }
          }
          
          // Mailbox-Statistiken aktualisieren (mit per-mailbox Zählern)
          await storage.updateExchangeMailbox(mailbox.id, {
            lastFetchAt: new Date(),
            lastFetchEmailCount: emails.length,
            totalImportedEmails: (mailbox.totalImportedEmails || 0) + mailboxImported,
            totalCreatedTickets: (mailbox.totalCreatedTickets || 0) + mailboxTickets,
            lastFetchError: null
          }, tenantId);
          
          // Sync-Log pro Mailbox erstellen
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
          
          // Fehler im Postfach speichern
          await storage.updateExchangeMailbox(mailbox.id, {
            lastFetchAt: new Date(),
            lastFetchError: errorMsg
          }, tenantId);
          
          // Sync-Log mit Fehler erstellen
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
        
        // Zu Gesamtzählern addieren
        totalEmails += mailboxImported;
        totalTickets += mailboxTickets;
        totalSkipped += mailboxSkipped;
        errors.push(...mailboxErrors);
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
      const tenantId = req.user!.tenantId;
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
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Test-Mailversand", { 
        description: String(error), 
        cause: "Senden fehlgeschlagen",
        solution: "Überprüfen Sie die Mail.Send-Berechtigung in Azure AD"
      });
      res.status(500).json({ message: error.message || "Fehler beim Senden der Test-E-Mail" });
    }
  });

  // ==========================================
  // E-Mail Verarbeitungsregeln
  // ==========================================

  // Alle Regeln abrufen
  app.get("/api/exchange/processing-rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const mailboxId = req.query.mailboxId as string | undefined;
      const rules = await storage.getEmailProcessingRules(tenantId, mailboxId);
      res.json(rules);
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Laden der Verarbeitungsregeln", { description: String(error) });
      res.status(500).json({ message: error.message || "Fehler beim Laden der Regeln" });
    }
  });

  // Einzelne Regel abrufen
  app.get("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const rule = await storage.getEmailProcessingRule(req.params.id, tenantId);
      if (!rule) {
        return res.status(404).json({ message: "Regel nicht gefunden" });
      }
      res.json(rule);
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Laden der Regel", { description: String(error) });
      res.status(500).json({ message: error.message || "Fehler beim Laden der Regel" });
    }
  });

  // Neue Regel erstellen
  app.post("/api/exchange/processing-rules", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const rule = await storage.createEmailProcessingRule({
        ...req.body,
        tenantId
      });
      logger.info("exchange", "Verarbeitungsregel erstellt", rule.name, { userId: req.user!.id });
      res.status(201).json(rule);
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Erstellen der Regel", { description: String(error) });
      res.status(500).json({ message: error.message || "Fehler beim Erstellen der Regel" });
    }
  });

  // Regel aktualisieren
  app.patch("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const rule = await storage.updateEmailProcessingRule(req.params.id, req.body, tenantId);
      if (!rule) {
        return res.status(404).json({ message: "Regel nicht gefunden" });
      }
      logger.info("exchange", "Verarbeitungsregel aktualisiert", rule.name, { userId: req.user!.id });
      res.json(rule);
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Aktualisieren der Regel", { description: String(error) });
      res.status(500).json({ message: error.message || "Fehler beim Aktualisieren der Regel" });
    }
  });

  // Regel löschen
  app.delete("/api/exchange/processing-rules/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      await storage.deleteEmailProcessingRule(req.params.id, tenantId);
      logger.info("exchange", "Verarbeitungsregel gelöscht", req.params.id, { userId: req.user!.id });
      res.json({ message: "Regel gelöscht" });
    } catch (error: any) {
      logger.error("exchange", "Fehler beim Löschen der Regel", { description: String(error) });
      res.status(500).json({ message: error.message || "Fehler beim Löschen der Regel" });
    }
  });

  return httpServer;
}
