/**
 * TOTP-Implementierung nach RFC 6238 / HOTP RFC 4226
 * Verwendet ausschließlich Node.js Built-in-Crypto — keine externen Abhängigkeiten.
 * BSI ORP.4.A12 — Zwei-Faktor-Authentifizierung für privilegierte Konten
 */
import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD = 30; // Sekunden
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // ±1 Zeitschritt Toleranz (~60 Sekunden)

function base32Decode(input: string): Buffer {
  const str = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of str) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

/** Generiert ein neues zufälliges TOTP-Secret (Base32, 20 Bytes = 160 Bit). */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/** Verifiziert einen TOTP-Code gegen ein Secret mit ±1 Zeitschritt Toleranz. */
export function verifyTotp(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    if (hotp(secret, counter + i) === token) return true;
  }
  return false;
}

/** Erstellt die otpauth:// URI für QR-Code-Scanner (Google Authenticator, Aegis, etc.). */
export function generateTotpUri(secret: string, email: string, issuer = "Support-Engine"): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}
