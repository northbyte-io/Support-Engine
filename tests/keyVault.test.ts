import { describe, it, expect } from "vitest";
import {
  encryptSecret,
  decryptSecret,
  encryptSecretToJson,
  decryptSecretFromJson,
  isEncryptedJson,
  getOrDecrypt,
} from "../server/keyVault.ts";

// --- encryptSecret / decryptSecret ---

describe("encryptSecret / decryptSecret", () => {
  it("round-trip: verschlüsselt und entschlüsselt korrekt", () => {
    const plain = "geheimer-API-Schlüssel";
    const encrypted = encryptSecret(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("verschlüsselte Daten enthalten ciphertext, iv, authTag und version", () => {
    const result = encryptSecret("test");
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("iv");
    expect(result).toHaveProperty("authTag");
    expect(result).toHaveProperty("version", 1);
  });

  it("gleicher Klartext erzeugt unterschiedliche Chiffrate (zufälliger IV)", () => {
    const a = encryptSecret("gleicher-text");
    const b = encryptSecret("gleicher-text");
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("leerer String wird korrekt verschlüsselt und entschlüsselt", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("");
  });

  it("Unicode-Inhalt wird korrekt verarbeitet", () => {
    const unicode = "Passwort: äöü 🔐";
    expect(decryptSecret(encryptSecret(unicode))).toBe(unicode);
  });
});

// --- encryptSecretToJson / decryptSecretFromJson ---

describe("encryptSecretToJson / decryptSecretFromJson", () => {
  it("round-trip als JSON-String", () => {
    const plain = "exchange-passwort-123";
    const json = encryptSecretToJson(plain);
    expect(typeof json).toBe("string");
    expect(decryptSecretFromJson(json)).toBe(plain);
  });

  it("JSON-String ist valides JSON", () => {
    const json = encryptSecretToJson("test");
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// --- isEncryptedJson ---

describe("isEncryptedJson", () => {
  it("gibt true für gültigen verschlüsselten JSON zurück", () => {
    const json = encryptSecretToJson("test-wert");
    expect(isEncryptedJson(json)).toBe(true);
  });

  it("gibt false für Klartext-String zurück", () => {
    expect(isEncryptedJson("klartext-passwort")).toBe(false);
  });

  it("gibt false für ungültiges JSON zurück", () => {
    expect(isEncryptedJson("{ungültiges json")).toBe(false);
  });

  it("gibt false für JSON ohne ciphertext zurück", () => {
    expect(isEncryptedJson(JSON.stringify({ iv: "abc" }))).toBe(false);
  });

  it("gibt false für leeren String zurück", () => {
    expect(isEncryptedJson("")).toBe(false);
  });
});

// --- getOrDecrypt ---

describe("getOrDecrypt", () => {
  it("gibt null für null zurück", () => {
    expect(getOrDecrypt(null)).toBeNull();
  });

  it("gibt null für undefined zurück", () => {
    expect(getOrDecrypt(undefined)).toBeNull();
  });

  it("gibt null für leeren String zurück", () => {
    expect(getOrDecrypt("")).toBeNull();
  });

  it("entschlüsselt verschlüsselten JSON-Wert", () => {
    const plain = "mein-geheimes-passwort";
    const encrypted = encryptSecretToJson(plain);
    expect(getOrDecrypt(encrypted)).toBe(plain);
  });

  it("gibt Klartext unverändert zurück wenn nicht verschlüsselt", () => {
    expect(getOrDecrypt("normaler-wert")).toBe("normaler-wert");
  });
});
