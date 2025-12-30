import acme from "acme-client";
import crypto from "crypto";
import { storage } from "./storage";
import { logger } from "./logger";
import { encryptSecretToJson, decryptSecretFromJson, isEncryptedJson, getOrDecrypt } from "./keyVault";

const LETS_ENCRYPT_STAGING = "https://acme-staging-v02.api.letsencrypt.org/directory";
const LETS_ENCRYPT_PRODUCTION = "https://acme-v02.api.letsencrypt.org/directory";

export async function getHttpChallenge(token: string): Promise<string | undefined> {
  const challenge = await storage.getTlsChallengeByToken(token);
  return challenge?.keyAuthorization;
}

export class TlsService {
  private client: acme.Client | null = null;
  private initialized = false;
  private useProduction = false;

  async initialize(useProduction: boolean = false): Promise<void> {
    if (this.initialized && this.useProduction === useProduction) {
      return;
    }

    this.useProduction = useProduction;
    const settings = await storage.getTlsSettings();
    let accountKeyPem: string;

    if (settings?.accountKeyPem) {
      accountKeyPem = getOrDecrypt(settings.accountKeyPem) || settings.accountKeyPem;
    } else {
      const keyPair = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      });
      const rawKey = keyPair.privateKey as string;
      const encryptedKey = encryptSecretToJson(rawKey);
      accountKeyPem = rawKey;
      
      await storage.updateTlsSettings({
        accountKeyPem: encryptedKey,
        caType: useProduction ? "production" : "staging",
        autoRenewEnabled: true
      });
    }

    const directoryUrl = useProduction ? LETS_ENCRYPT_PRODUCTION : LETS_ENCRYPT_STAGING;
    
    this.client = new acme.Client({
      directoryUrl,
      accountKey: accountKeyPem
    });

    this.initialized = true;
    logger.info("system", "TLS-Dienst initialisiert", `Umgebung: ${useProduction ? "Produktion" : "Staging"}`);
  }

  private async ensureAccount(email: string): Promise<void> {
    const settings = await storage.getTlsSettings();
    
    if (settings?.acmeAgreedToTos) {
      return;
    }

    await this.client!.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${email}`]
    });

    await storage.updateTlsSettings({
      acmeEmail: email,
      acmeAgreedToTos: true
    });
  }

  async requestCertificate(
    domain: string,
    email: string,
    userId: string,
    useProduction: boolean = false,
    tenantId?: string | null
  ): Promise<{ success: boolean; certificateId?: string; error?: string }> {
    try {
      await this.initialize(useProduction);
      await this.ensureAccount(email);

      const keyPair = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      });

      const rawPrivateKey = keyPair.privateKey as string;
      const encryptedPrivateKey = encryptSecretToJson(rawPrivateKey);

      const [, csr] = await acme.crypto.createCsr({
        commonName: domain
      }, rawPrivateKey);

      const cert = await storage.createTlsCertificate({
        domain,
        status: "pending",
        caType: useProduction ? "production" : "staging",
        isActive: false,
        privateKeyPem: encryptedPrivateKey
      });

      await storage.createTlsCertificateAction({
        certificateId: cert.id,
        action: "requested",
        status: "pending",
        performedById: userId,
        details: { domain, challengeType: "http-01" }
      });

      logger.info("system", "Zertifikatsanforderung gestartet", `Domain: ${domain}, ID: ${cert.id}`);

      const order = await this.client!.createOrder({
        identifiers: [{ type: "dns", value: domain }]
      });

      const authorizations = await this.client!.getAuthorizations(order);

      for (const auth of authorizations) {
        const httpChallenge = auth.challenges.find(c => c.type === "http-01");
        if (!httpChallenge) {
          throw new Error("HTTP-01 Challenge nicht verfügbar");
        }

        const keyAuthorization = await this.client!.getChallengeKeyAuthorization(httpChallenge);
        
        await storage.createTlsChallenge({
          tenantId: tenantId || null,
          token: httpChallenge.token,
          keyAuthorization,
          domain,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        await this.client!.verifyChallenge(auth, httpChallenge);
        await this.client!.completeChallenge(httpChallenge);
        await this.client!.waitForValidStatus(httpChallenge);
        
        await storage.completeTlsChallenge(httpChallenge.token);
      }

      await this.client!.finalizeOrder(order, csr);
      const certificatePem = await this.client!.getCertificate(order);

      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await storage.updateTlsCertificate(cert.id, {
        status: "active",
        certificatePem,
        expiresAt,
        issuedAt: new Date(),
        isActive: true
      });

      await storage.createTlsCertificateAction({
        certificateId: cert.id,
        action: "issued",
        status: "success",
        performedById: userId,
        details: { domain, expiresAt: expiresAt.toISOString() }
      });

      logger.info("system", "Zertifikat erfolgreich ausgestellt", `Domain: ${domain}, ID: ${cert.id}`);

      return { success: true, certificateId: cert.id };
    } catch (error: any) {
      logger.error("system", "Fehler bei Zertifikatsanforderung", {
        description: error.message,
        cause: `Anforderung für Domain ${domain} fehlgeschlagen`,
        solution: "Prüfen Sie die Domain-Einstellungen und DNS-Konfiguration"
      });

      return { success: false, error: error.message };
    }
  }

  async renewCertificate(
    certificateId: string,
    email: string,
    userId: string,
    tenantId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cert = await storage.getTlsCertificate(certificateId);
      if (!cert) {
        throw new Error("Zertifikat nicht gefunden");
      }

      await this.initialize(cert.caType === "production");
      await this.ensureAccount(email);

      const privateKeyPem = getOrDecrypt(cert.privateKeyPem || "") || cert.privateKeyPem || "";

      const [, csr] = await acme.crypto.createCsr({
        commonName: cert.domain!
      }, privateKeyPem);

      await storage.updateTlsCertificate(cert.id, { 
        status: "pending",
        renewalAttempts: (cert.renewalAttempts || 0) + 1
      });

      await storage.createTlsCertificateAction({
        certificateId: cert.id,
        action: "renewed",
        status: "pending",
        performedById: userId,
        details: { domain: cert.domain }
      });

      const order = await this.client!.createOrder({
        identifiers: [{ type: "dns", value: cert.domain! }]
      });

      const authorizations = await this.client!.getAuthorizations(order);

      for (const auth of authorizations) {
        const httpChallenge = auth.challenges.find(c => c.type === "http-01");
        if (!httpChallenge) {
          throw new Error("HTTP-01 Challenge nicht verfügbar");
        }

        const keyAuthorization = await this.client!.getChallengeKeyAuthorization(httpChallenge);
        
        await storage.createTlsChallenge({
          tenantId: tenantId || null,
          token: httpChallenge.token,
          keyAuthorization,
          domain: cert.domain!,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        await this.client!.verifyChallenge(auth, httpChallenge);
        await this.client!.completeChallenge(httpChallenge);
        await this.client!.waitForValidStatus(httpChallenge);
        
        await storage.completeTlsChallenge(httpChallenge.token);
      }

      await this.client!.finalizeOrder(order, csr);
      const certificatePem = await this.client!.getCertificate(order);

      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await storage.updateTlsCertificate(cert.id, {
        status: "active",
        certificatePem,
        expiresAt,
        issuedAt: new Date(),
        lastRenewalAt: new Date()
      });

      await storage.createTlsCertificateAction({
        certificateId: cert.id,
        action: "renewed",
        status: "success",
        performedById: userId,
        details: { domain: cert.domain, expiresAt: expiresAt.toISOString() }
      });

      logger.info("system", "Zertifikat erfolgreich erneuert", `Domain: ${cert.domain}, ID: ${cert.id}`);

      return { success: true };
    } catch (error: any) {
      logger.error("system", "Fehler bei Zertifikatserneuerung", {
        description: error.message,
        cause: `Erneuerung für Zertifikat ${certificateId} fehlgeschlagen`,
        solution: "Prüfen Sie die Domain-Einstellungen und DNS-Konfiguration"
      });

      await storage.updateTlsCertificate(certificateId, { status: "failed" });

      await storage.createTlsCertificateAction({
        certificateId,
        action: "renewed",
        status: "failed",
        performedById: userId,
        message: error.message,
        details: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }

  async revokeCertificate(
    certificateId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cert = await storage.getTlsCertificate(certificateId);
      if (!cert || !cert.certificatePem) {
        throw new Error("Zertifikat nicht gefunden oder keine Zertifikatsdaten vorhanden");
      }

      await this.initialize(cert.caType === "production");

      try {
        await this.client!.revokeCertificate(cert.certificatePem);
      } catch (revokeError: any) {
        if (!revokeError.message?.includes("already revoked")) {
          throw revokeError;
        }
      }

      await storage.updateTlsCertificate(cert.id, {
        status: "revoked",
        isActive: false
      });

      await storage.createTlsCertificateAction({
        certificateId: cert.id,
        action: "revoked",
        status: "success",
        performedById: userId,
        details: { domain: cert.domain }
      });

      logger.info("system", "Zertifikat widerrufen", `Domain: ${cert.domain}, ID: ${cert.id}`);

      return { success: true };
    } catch (error: any) {
      logger.error("system", "Fehler beim Widerrufen des Zertifikats", {
        description: error.message,
        cause: `Widerruf für Zertifikat ${certificateId} fehlgeschlagen`,
        solution: "Prüfen Sie, ob das Zertifikat noch gültig ist"
      });

      await storage.createTlsCertificateAction({
        certificateId,
        action: "revoked",
        status: "failed",
        performedById: userId,
        message: error.message,
        details: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }

  async checkAndRenewExpiring(
    daysBeforeExpiry: number = 30,
    email: string,
    userId: string,
    tenantId?: string | null
  ): Promise<{ renewed: number; errors: string[] }> {
    const certificates = await storage.getTlsCertificates();
    const now = new Date();
    const renewalThreshold = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

    let renewed = 0;
    const errors: string[] = [];

    for (const cert of certificates) {
      if (cert.status !== "active" || !cert.expiresAt || !cert.isActive) {
        continue;
      }

      if (cert.expiresAt <= renewalThreshold) {
        logger.info("system", "Automatische Zertifikatserneuerung gestartet", `Domain: ${cert.domain}, Ablauf: ${cert.expiresAt}`);

        const result = await this.renewCertificate(cert.id, email, userId, tenantId);
        if (result.success) {
          renewed++;
        } else {
          errors.push(`${cert.domain}: ${result.error}`);
        }
      }
    }

    await storage.cleanupExpiredChallenges();

    return { renewed, errors };
  }

  getSettings(): Promise<any> {
    return storage.getTlsSettings();
  }

  getCertificates(): Promise<any[]> {
    return storage.getTlsCertificates();
  }

  getCertificate(id: string): Promise<any> {
    return storage.getTlsCertificate(id);
  }

  getActions(certificateId?: string, limit?: number): Promise<any[]> {
    return storage.getTlsCertificateActions(certificateId, limit);
  }
}

export const tlsService = new TlsService();
