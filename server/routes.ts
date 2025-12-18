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
import { loginSchema, registerSchema, insertTicketSchema, insertCommentSchema, insertAreaSchema, insertUserSchema, insertTicketTypeSchema } from "@shared/schema";
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
      const ticket = await storage.updateTicket(req.params.id, req.body);
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
      await storage.deleteTicket(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Ticket Comments
  app.post("/api/tickets/:id/comments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
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

  return httpServer;
}
