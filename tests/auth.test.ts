import { describe, it, expect, vi } from "vitest";
import type { Response, NextFunction } from "express";
import {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  adminMiddleware,
  agentMiddleware,
  TOKEN_COOKIE_NAME,
  type AuthenticatedRequest,
} from "../server/auth.ts";
import type { User } from "@shared/schema";

// --- Hilfsfunktionen ---

const testUser: User = {
  id: "user-123",
  email: "test@example.com",
  role: "admin",
  tenantId: "tenant-456",
  password: "hashed",
  name: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
} as User;

function makeReq(cookie?: string): AuthenticatedRequest {
  return { headers: { cookie: cookie ?? "" } } as unknown as AuthenticatedRequest;
}

function makeRes() {
  const jsonFn = vi.fn();
  const statusFn = vi.fn(() => ({ json: jsonFn }));
  return {
    res: { status: statusFn, json: jsonFn } as unknown as Response,
    statusFn,
    jsonFn,
  };
}

// --- Token-Tests ---

describe("generateToken / verifyToken", () => {
  it("round-trip: erstelltes Token kann verifiziert werden", () => {
    const token = generateToken(testUser);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(testUser.id);
    expect(decoded!.email).toBe(testUser.email);
    expect(decoded!.role).toBe(testUser.role);
    expect(decoded!.tenantId).toBe(testUser.tenantId);
  });

  it("ungültiges Token gibt null zurück", () => {
    expect(verifyToken("ungueltig.token.wert")).toBeNull();
  });

  it("manipuliertes Token gibt null zurück", () => {
    const token = generateToken(testUser);
    const manipulated = token.slice(0, -4) + "xxxx";
    expect(verifyToken(manipulated)).toBeNull();
  });

  it("leerer String gibt null zurück", () => {
    expect(verifyToken("")).toBeNull();
  });
});

// --- Passwort-Tests ---

describe("hashPassword / comparePassword", () => {
  it("round-trip: korrektes Passwort wird akzeptiert", async () => {
    const hash = await hashPassword("geheimes-passwort");
    expect(await comparePassword("geheimes-passwort", hash)).toBe(true);
  });

  it("falsches Passwort wird abgelehnt", async () => {
    const hash = await hashPassword("korrektes-passwort");
    expect(await comparePassword("falsches-passwort", hash)).toBe(false);
  });

  it("gleiche Passwörter erzeugen unterschiedliche Hashes (Salt)", async () => {
    const hash1 = await hashPassword("gleiches-passwort");
    const hash2 = await hashPassword("gleiches-passwort");
    expect(hash1).not.toBe(hash2);
  });
});

// --- authMiddleware-Tests ---

describe("authMiddleware", () => {
  it("kein Cookie → 401", () => {
    const { res, statusFn, jsonFn } = makeRes();
    const next = vi.fn();
    authMiddleware(makeReq(), res, next as NextFunction);
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  it("ungültiger Token → 401", () => {
    const { res, statusFn } = makeRes();
    const next = vi.fn();
    authMiddleware(makeReq(`${TOKEN_COOKIE_NAME}=ungueltig`), res, next as NextFunction);
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("gültiger Token → req.user gesetzt und next() aufgerufen", () => {
    const token = generateToken(testUser);
    const req = makeReq(`${TOKEN_COOKIE_NAME}=${token}`);
    const { res } = makeRes();
    const next = vi.fn();
    authMiddleware(req, res, next as NextFunction);
    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe(testUser.id);
    expect(req.tenantId).toBe(testUser.tenantId);
  });
});

// --- adminMiddleware-Tests ---

describe("adminMiddleware", () => {
  it("Nicht-Admin → 403", () => {
    const req = { user: { role: "agent" } } as unknown as AuthenticatedRequest;
    const { res, statusFn } = makeRes();
    const next = vi.fn();
    adminMiddleware(req, res, next as NextFunction);
    expect(statusFn).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("Admin → next() aufgerufen", () => {
    const req = { user: { role: "admin" } } as unknown as AuthenticatedRequest;
    const { res } = makeRes();
    const next = vi.fn();
    adminMiddleware(req, res, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });
});

// --- agentMiddleware-Tests ---

describe("agentMiddleware", () => {
  it("Kunde → 403", () => {
    const req = { user: { role: "customer" } } as unknown as AuthenticatedRequest;
    const { res, statusFn } = makeRes();
    const next = vi.fn();
    agentMiddleware(req, res, next as NextFunction);
    expect(statusFn).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("Agent → next() aufgerufen", () => {
    const req = { user: { role: "agent" } } as unknown as AuthenticatedRequest;
    const { res } = makeRes();
    const next = vi.fn();
    agentMiddleware(req, res, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it("Admin → next() aufgerufen", () => {
    const req = { user: { role: "admin" } } as unknown as AuthenticatedRequest;
    const { res } = makeRes();
    const next = vi.fn();
    agentMiddleware(req, res, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });
});
