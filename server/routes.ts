import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authMiddleware, 
  adminMiddleware, 
  agentMiddleware,
  type AuthenticatedRequest 
} from "./auth";
import { loginSchema, registerSchema, insertTicketSchema, insertCommentSchema, insertAreaSchema, insertUserSchema, insertTicketTypeSchema, insertSlaDefinitionSchema, insertSlaEscalationSchema, insertKbCategorySchema, insertKbArticleSchema, insertTicketKbLinkSchema, insertTimeEntrySchema } from "@shared/schema";
import { z } from "zod";

// Seed default data for demo
async function seedDefaultData() {
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
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      const validPassword = await comparePassword(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Konto ist deaktiviert" });
      }

      await storage.updateUser(user.id, { lastLoginAt: new Date() } as any);

      const token = generateToken(user);
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Login error:", error);
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

      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Eingabedaten", errors: error.errors });
      }
      console.error("Create ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  app.patch("/api/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // Update with tenant isolation enforced at storage level
      const ticket = await storage.updateTicket(req.params.id, req.body, req.tenantId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket nicht gefunden" });
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

  return httpServer;
}
