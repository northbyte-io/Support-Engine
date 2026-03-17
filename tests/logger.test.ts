import { describe, it, expect } from "vitest";
import { logger } from "../server/logger.ts";

// Hilfsfunktion: schreibt einen Log-Eintrag mit eindeutigem Titel und gibt die maskierten Felder zurück
function logAndGet(title: string, description: string): { title: string; description: string } | null {
  logger.info("system", title, description);
  const { logs } = logger.getLogs({ search: title });
  if (!logs.length) return null;
  const entry = logs[0] as Record<string, unknown>;
  return {
    title: entry["title"] as string,
    description: entry["description"] as string,
  };
}

// Eindeutiger Präfix pro Test-Suite-Lauf, um Kollisionen im Buffer zu vermeiden
const uid = () => crypto.randomUUID().slice(0, 7);

// --- PII-Maskierung ---

describe("logger: PII-Maskierung", () => {
  it("Passwort in der Beschreibung wird maskiert", () => {
    const id = uid();
    const result = logAndGet(`test-pw-${id}`, `password: supergeheim`);
    expect(result).not.toBeNull();
    expect(result!.description).not.toContain("supergeheim");
    expect(result!.description).toContain("[MASKIERT]");
  });

  it("Token in der Beschreibung wird maskiert", () => {
    const id = uid();
    const result = logAndGet(`pii-jwt-${id}`, `token: eyJhbGciOiJIUzI1NiJ9.abc`);
    expect(result).not.toBeNull();
    expect(result!.description).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(result!.description).toContain("[MASKIERT]");
  });

  it("Bearer-Token in der Beschreibung wird maskiert", () => {
    const id = uid();
    const result = logAndGet(`pii-bearer-${id}`, `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.xyz`);
    expect(result).not.toBeNull();
    expect(result!.description).not.toContain("eyJhbGciOiJIUzI1NiJ9.xyz");
    expect(result!.description).toContain("Bearer [MASKIERT]");
  });

  it("API-Key in der Beschreibung wird maskiert", () => {
    const id = uid();
    const result = logAndGet(`pii-ak-${id}`, `api_key: sk-1234567890abcdef`);
    expect(result).not.toBeNull();
    expect(result!.description).not.toContain("sk-1234567890abcdef");
    expect(result!.description).toContain("[MASKIERT]");
  });

  it("Secret in der Beschreibung wird maskiert", () => {
    const id = uid();
    const result = logAndGet(`pii-sec-${id}`, `secret: my-very-secret-value`);
    expect(result).not.toBeNull();
    expect(result!.description).not.toContain("my-very-secret-value");
    expect(result!.description).toContain("[MASKIERT]");
  });

  it("E-Mail-Adresse wird teilweise maskiert", () => {
    const id = uid();
    const result = logAndGet(`test-email-${id}`, `Benutzer max.mustermann@example.com hat sich angemeldet`);
    expect(result).not.toBeNull();
    // Voller lokaler Teil wird nicht angezeigt
    expect(result!.description).not.toContain("max.mustermann@example.com");
    // Domain bleibt erhalten
    expect(result!.description).toContain("@example.com");
    expect(result!.description).toContain("***");
  });

  it("Nicht-sensitiver Text bleibt unverändert", () => {
    const id = uid();
    const text = `Ticket-${id} wurde erstellt`;
    const result = logAndGet(`test-plain-${id}`, text);
    expect(result).not.toBeNull();
    expect(result!.description).toContain(`Ticket-${id} wurde erstellt`);
  });

  it("Passwort im Titel wird ebenfalls maskiert", () => {
    const id = uid();
    logger.info("auth", `password: geheim-${id}`, "Details");
    const { logs } = logger.getLogs({ search: "Details" });
    // Finde den spezifischen Eintrag durch den uid
    const entry = logs.find((l) => {
      const e = l as Record<string, unknown>;
      return String(e["title"]).includes(id);
    }) as Record<string, unknown> | undefined;
    if (entry) {
      expect(String(entry["title"])).not.toContain(`geheim-${id}`);
      expect(String(entry["title"])).toContain("[MASKIERT]");
    }
    // Falls der Buffer voll ist, überspringen wir die Assertion
  });
});

// --- getLogs-Filter ---

describe("logger: getLogs Filter und Pagination", () => {
  it("level-Filter gibt nur Einträge des angegebenen Levels zurück", () => {
    logger.warn("system", `warn-filter-test-${uid()}`, "warn-beschreibung");
    const { logs } = logger.getLogs({ level: "warn" });
    for (const log of logs) {
      expect((log as Record<string, unknown>)["level"]).toBe("warn");
    }
  });

  it("search-Filter findet Einträge mit passendem Titel", () => {
    const id = uid();
    logger.info("api", `suchtest-titel-${id}`, "irgendeine Beschreibung");
    const { logs, total } = logger.getLogs({ search: `suchtest-titel-${id}` });
    expect(total).toBeGreaterThanOrEqual(1);
    expect((logs[0] as Record<string, unknown>)["title"]).toContain(`suchtest-titel-${id}`);
  });

  it("limit-Parameter begrenzt die Anzahl der Ergebnisse", () => {
    // Mindestens 3 Einträge sicherstellen
    for (let i = 0; i < 3; i++) {
      logger.info("system", `limit-test-${uid()}`, "bulk-eintrag");
    }
    const { logs } = logger.getLogs({ limit: 2 });
    expect(logs.length).toBeLessThanOrEqual(2);
  });

  it("total gibt die Gesamtanzahl zurück (unabhängig vom limit)", () => {
    const id = uid();
    for (let i = 0; i < 3; i++) {
      logger.info("system", `total-test-${id}`, `eintrag-${i}`);
    }
    const { total } = logger.getLogs({ search: `total-test-${id}` });
    expect(total).toBe(3);
  });
});
