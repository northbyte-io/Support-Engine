import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getMasterKey(): Buffer {
  const masterKeyEnv = process.env.TLS_MASTER_KEY || process.env.SESSION_SECRET;
  if (!masterKeyEnv) {
    throw new Error("TLS_MASTER_KEY oder SESSION_SECRET muss gesetzt sein");
  }
  const salt = crypto.createHash("sha256").update("tls-key-vault-salt").digest();
  return crypto.pbkdf2Sync(masterKeyEnv, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
}

export function encryptSecret(plaintext: string): EncryptedData {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    version: 1,
  };
}

export function decryptSecret(encrypted: EncryptedData): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(encrypted.iv, "base64");
  const authTag = Buffer.from(encrypted.authTag, "base64");
  const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);
  
  return plaintext.toString("utf8");
}

export function encryptSecretToJson(plaintext: string): string {
  return JSON.stringify(encryptSecret(plaintext));
}

export function decryptSecretFromJson(jsonString: string): string {
  const encrypted = JSON.parse(jsonString) as EncryptedData;
  return decryptSecret(encrypted);
}

export function isEncryptedJson(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed.ciphertext === "string" && typeof parsed.iv === "string";
  } catch {
    return false;
  }
}

export function getOrDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isEncryptedJson(value)) {
    return decryptSecretFromJson(value);
  }
  return value;
}
