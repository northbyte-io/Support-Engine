/**
 * Exchange Online Integration Service
 * 
 * Dieser Service verwaltet die Exchange-Online-Integration über Microsoft Graph API.
 * Die Verbindung wird erst nach UI-Konfiguration aufgebaut.
 * 
 * WICHTIG: Dieser Service ist standardmäßig deaktiviert und wird erst
 * aktiviert, wenn ein Administrator die Konfiguration über die UI vornimmt.
 */

import { logger, type LogSource } from "./logger";
import crypto from "crypto";
import type {
  ExchangeConfiguration,
  ExchangeMailbox,
  ExchangeEmail,
  ExchangeSyncLog,
  InsertExchangeEmail,
  InsertExchangeSyncLog
} from "@shared/schema";

// Graph API Endpoints
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
const GRAPH_AUTH_URL = "https://login.microsoftonline.com";

// Graph API Berechtigungen (minimal)
const REQUIRED_SCOPES = [
  "Mail.Read",
  "Mail.ReadWrite", 
  "Mail.Send"
];

// Fehler-Typen mit deutschen Beschreibungen
export const ExchangeErrors = {
  NOT_CONFIGURED: {
    code: "NOT_CONFIGURED",
    message: "Exchange-Integration ist nicht konfiguriert",
    solution: "Konfigurieren Sie die Azure-App-Daten in den Einstellungen"
  },
  NOT_ENABLED: {
    code: "NOT_ENABLED",
    message: "Exchange-Integration ist deaktiviert",
    solution: "Aktivieren Sie die Exchange-Integration in den Einstellungen"
  },
  AUTH_FAILED: {
    code: "AUTH_FAILED",
    message: "Authentifizierung bei Microsoft fehlgeschlagen",
    solution: "Überprüfen Sie Client-ID, Tenant-ID und Client-Secret"
  },
  TOKEN_EXPIRED: {
    code: "TOKEN_EXPIRED",
    message: "Zugriffstoken ist abgelaufen",
    solution: "Das Token wird automatisch erneuert"
  },
  MAILBOX_NOT_FOUND: {
    code: "MAILBOX_NOT_FOUND",
    message: "Postfach wurde nicht gefunden",
    solution: "Überprüfen Sie die E-Mail-Adresse des Postfachs"
  },
  FOLDER_NOT_FOUND: {
    code: "FOLDER_NOT_FOUND",
    message: "E-Mail-Ordner wurde nicht gefunden",
    solution: "Überprüfen Sie den Ordnernamen"
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    message: "Keine Berechtigung für diese Aktion",
    solution: "Überprüfen Sie die Graph-API-Berechtigungen in Azure"
  },
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    message: "Netzwerkfehler bei der Verbindung zu Microsoft",
    solution: "Überprüfen Sie die Internetverbindung"
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    message: "Zu viele Anfragen an Microsoft Graph API",
    solution: "Bitte warten Sie einige Minuten"
  }
};

export type ExchangeErrorCode = keyof typeof ExchangeErrors;

export class ExchangeError extends Error {
  code: ExchangeErrorCode;
  solution: string;

  constructor(code: ExchangeErrorCode, details?: string) {
    const errorInfo = ExchangeErrors[code];
    super(details ? `${errorInfo.message}: ${details}` : errorInfo.message);
    this.code = code;
    this.solution = errorInfo.solution;
    this.name = "ExchangeError";
  }
}

// Token Response von Azure
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

// Graph API E-Mail-Struktur
interface GraphEmail {
  id: string;
  internetMessageId?: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: {
    contentType: string;
    content: string;
  };
  from?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  toRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  hasAttachments?: boolean;
  receivedDateTime?: string;
  sentDateTime?: string;
  isRead?: boolean;
}

// Graph API Ordner-Struktur
interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount: number;
  totalItemCount: number;
  unreadItemCount: number;
}

/**
 * Exchange Online Service
 * Verarbeitet alle Interaktionen mit Microsoft Graph API
 */
export class ExchangeService {
  private static logSource: LogSource = "exchange";

  /**
   * Prüft ob eine Konfiguration vollständig und aktiviert ist
   */
  static isConfigurationValid(config: ExchangeConfiguration | null): boolean {
    if (!config) return false;
    if (!config.isEnabled) return false;
    if (!config.clientId || !config.tenantAzureId) return false;
    if (config.authType === "client_secret" && !config.clientSecretEncrypted) return false;
    if (config.authType === "certificate" && !config.certificatePemEncrypted) return false;
    return true;
  }

  /**
   * Verschlüsselt ein Client-Secret für die Speicherung
   * HINWEIS: In Produktion sollte ein sichererer Algorithmus verwendet werden
   */
  static encryptSecret(secret: string): string {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(process.env.SESSION_SECRET || "default-key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(secret, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  /**
   * Entschlüsselt ein gespeichertes Client-Secret
   */
  static decryptSecret(encryptedSecret: string): string {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(process.env.SESSION_SECRET || "default-key", "salt", 32);
    const parts = encryptedSecret.split(":");
    if (parts.length !== 3) {
      throw new ExchangeError("AUTH_FAILED", "Ungültiges verschlüsseltes Secret");
    }
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Holt ein Access-Token von Azure AD
   * Verwendet Client Credentials Flow (App-only)
   */
  static async getAccessToken(config: ExchangeConfiguration): Promise<string> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    // Prüfe ob existierendes Token noch gültig ist
    if (config.accessToken && config.accessTokenExpiresAt) {
      const expiresAt = new Date(config.accessTokenExpiresAt);
      const now = new Date();
      // Token 5 Minuten vor Ablauf erneuern
      if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        return config.accessToken;
      }
    }

    logger.info(this.logSource, "Token-Anforderung", "Fordere neues Access-Token von Azure AD an");

    try {
      const tokenUrl = `${GRAPH_AUTH_URL}/${config.tenantAzureId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams();
      params.append("client_id", config.clientId!);
      params.append("scope", "https://graph.microsoft.com/.default");
      params.append("grant_type", "client_credentials");

      if (config.authType === "client_secret" && config.clientSecretEncrypted) {
        const secret = this.decryptSecret(config.clientSecretEncrypted);
        params.append("client_secret", secret);
      } else if (config.authType === "certificate") {
        // Zertifikat-basierte Auth würde hier implementiert
        throw new ExchangeError("AUTH_FAILED", "Zertifikat-Authentifizierung noch nicht implementiert");
      }

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error(this.logSource, "Token-Fehler", {
          description: "Azure AD Token-Anfrage fehlgeschlagen",
          cause: error,
          solution: "Überprüfen Sie Client-ID, Tenant-ID und Client-Secret"
        });
        throw new ExchangeError("AUTH_FAILED", error);
      }

      const tokenData: TokenResponse = await response.json();
      
      logger.info(this.logSource, "Token erhalten", "Access-Token erfolgreich von Azure AD erhalten");
      
      return tokenData.access_token;
    } catch (error) {
      if (error instanceof ExchangeError) throw error;
      logger.error(this.logSource, "Token-Fehler", {
        description: "Unerwarteter Fehler bei Token-Anfrage",
        cause: String(error),
        solution: "Überprüfen Sie die Netzwerkverbindung"
      });
      throw new ExchangeError("NETWORK_ERROR", String(error));
    }
  }

  /**
   * Testet die Verbindung zu Microsoft Graph API
   * Verwendet den /users Endpunkt, der mit Mail.Read/Mail.ReadWrite funktioniert
   */
  static async testConnection(config: ExchangeConfiguration): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    logger.info(this.logSource, "Verbindungstest", "Starte Verbindungstest zu Microsoft Graph API");

    try {
      const token = await this.getAccessToken(config);
      
      // Wenn wir bis hierher kommen, ist die Authentifizierung erfolgreich!
      // Token wurde von Azure AD erhalten - das ist der wichtigste Test.
      logger.info(this.logSource, "Verbindungstest erfolgreich", "Access-Token erfolgreich von Azure AD erhalten");
      
      // Optional: Teste einen einfachen Graph API Aufruf
      // Wir verwenden $count auf /users mit ConsistencyLevel header
      // Dies funktioniert mit den meisten App-Berechtigungen
      try {
        const response = await fetch(`${GRAPH_API_BASE}/users?$top=1&$select=id`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ConsistencyLevel: "eventual"
          }
        });

        if (response.ok) {
          logger.info(this.logSource, "Graph API erreichbar", "Verbindung zur Microsoft Graph API verifiziert");
          return {
            success: true,
            message: "Verbindung erfolgreich hergestellt! Token erhalten und Graph API erreichbar.",
            details: {
              tokenObtained: true,
              graphApiAccessible: true
            }
          };
        } else {
          // Token funktioniert, aber /users Zugriff fehlt - das ist OK für Mail-Only
          const errorText = await response.text();
          logger.info(this.logSource, "Token gültig, API-Test optional", 
            "Access-Token funktioniert. Zusätzliche Berechtigungen können für /users erforderlich sein.");
          return {
            success: true,
            message: "Authentifizierung erfolgreich! Access-Token wurde von Azure AD erhalten. Sie können jetzt Postfächer konfigurieren.",
            details: {
              tokenObtained: true,
              graphApiAccessible: false,
              note: "Für Mail-Operationen benötigen Sie Mail.Read, Mail.ReadWrite und/oder Mail.Send Berechtigungen."
            }
          };
        }
      } catch (graphError) {
        // Netzwerkfehler beim Graph-Test, aber Token war OK
        return {
          success: true,
          message: "Authentifizierung erfolgreich! Access-Token wurde erhalten.",
          details: {
            tokenObtained: true,
            graphApiAccessible: false
          }
        };
      }
    } catch (error) {
      const message = error instanceof ExchangeError ? error.message : String(error);
      logger.error(this.logSource, "Verbindungstest-Fehler", {
        description: "Verbindungstest zu Microsoft Graph fehlgeschlagen",
        cause: message,
        solution: error instanceof ExchangeError ? error.solution : "Überprüfen Sie die Konfiguration"
      });
      return {
        success: false,
        message,
        details: error instanceof ExchangeError ? { code: error.code, solution: error.solution } : undefined
      };
    }
  }

  /**
   * Listet verfügbare E-Mail-Ordner eines Postfachs auf
   */
  static async listMailFolders(
    config: ExchangeConfiguration,
    mailboxEmail: string
  ): Promise<GraphFolder[]> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    const token = await this.getAccessToken(config);
    
    logger.info(this.logSource, "Ordner-Abruf", `Rufe E-Mail-Ordner für ${mailboxEmail} ab`);

    const response = await fetch(
      `${GRAPH_API_BASE}/users/${mailboxEmail}/mailFolders?$top=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new ExchangeError("MAILBOX_NOT_FOUND", mailboxEmail);
      }
      if (response.status === 403) {
        const errorText = await response.text();
        logger.warn(this.logSource, "Keine Berechtigung für Ordner-Abruf", errorText);
        throw new ExchangeError(
          "PERMISSION_DENIED", 
          "Fügen Sie in Azure 'Mail.Read' oder 'Mail.ReadBasic.All' als Application-Berechtigung hinzu und erteilen Sie Admin-Zustimmung"
        );
      }
      const error = await response.text();
      throw new ExchangeError("NETWORK_ERROR", error);
    }

    const data = await response.json();
    return data.value as GraphFolder[];
  }

  /**
   * Ruft E-Mails aus einem Postfach ab
   * HINWEIS: Diese Funktion ist vorbereitet aber nur aktiv wenn konfiguriert
   */
  static async fetchEmails(
    config: ExchangeConfiguration,
    mailbox: ExchangeMailbox,
    limit: number = 50
  ): Promise<GraphEmail[]> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    if (!mailbox.isActive) {
      logger.debug(this.logSource, "Postfach inaktiv", `Postfach ${mailbox.emailAddress} ist deaktiviert`);
      return [];
    }

    const token = await this.getAccessToken(config);
    
    logger.info(this.logSource, "E-Mail-Abruf", `Rufe E-Mails aus ${mailbox.emailAddress} ab`);

    let url = `${GRAPH_API_BASE}/users/${mailbox.emailAddress}/mailFolders/${mailbox.sourceFolderId || "inbox"}/messages`;
    const maxEmails = Number(mailbox.maxEmailsPerFetch) || 50;
    url += `?$top=${Math.min(limit, maxEmails)}`;
    url += "&$orderby=receivedDateTime desc";
    url += "&$select=id,internetMessageId,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,hasAttachments,receivedDateTime,sentDateTime,isRead";
    
    if (mailbox.fetchUnreadOnly) {
      url += "&$filter=isRead eq false";
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'outlook.body-content-type="html"'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ExchangeError("FOLDER_NOT_FOUND", mailbox.sourceFolderName || "inbox");
      }
      if (response.status === 403) {
        throw new ExchangeError("PERMISSION_DENIED");
      }
      if (response.status === 429) {
        throw new ExchangeError("RATE_LIMITED");
      }
      const error = await response.text();
      throw new ExchangeError("NETWORK_ERROR", error);
    }

    const data = await response.json();
    logger.info(this.logSource, "E-Mails abgerufen", `${data.value.length} E-Mails aus ${mailbox.emailAddress} abgerufen`);
    
    return data.value as GraphEmail[];
  }

  /**
   * Sendet eine E-Mail über Graph API
   */
  static async sendEmail(
    config: ExchangeConfiguration,
    mailbox: ExchangeMailbox,
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    replyToMessageId?: string
  ): Promise<boolean> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    const token = await this.getAccessToken(config);

    logger.info(this.logSource, "E-Mail-Versand", `Sende E-Mail von ${mailbox.emailAddress} an ${to.join(", ")}`);

    const emailMessage = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body
        },
        toRecipients: to.map(email => ({
          emailAddress: { address: email }
        })),
        ccRecipients: cc?.map(email => ({
          emailAddress: { address: email }
        }))
      },
      saveToSentItems: true
    };

    const url = `${GRAPH_API_BASE}/users/${mailbox.emailAddress}/sendMail`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailMessage)
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new ExchangeError("PERMISSION_DENIED");
      }
      const error = await response.text();
      logger.error(this.logSource, "Versand-Fehler", {
        description: "E-Mail-Versand fehlgeschlagen",
        cause: error,
        solution: "Überprüfen Sie die Mail.Send-Berechtigung"
      });
      throw new ExchangeError("NETWORK_ERROR", error);
    }

    logger.info(this.logSource, "E-Mail gesendet", `E-Mail erfolgreich an ${to.join(", ")} gesendet`);
    return true;
  }

  /**
   * Markiert eine E-Mail als gelesen
   */
  static async markAsRead(
    config: ExchangeConfiguration,
    mailboxEmail: string,
    messageId: string
  ): Promise<boolean> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    const token = await this.getAccessToken(config);

    const response = await fetch(
      `${GRAPH_API_BASE}/users/${mailboxEmail}/messages/${messageId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isRead: true })
      }
    );

    return response.ok;
  }

  /**
   * Verschiebt eine E-Mail in einen anderen Ordner
   */
  static async moveEmail(
    config: ExchangeConfiguration,
    mailboxEmail: string,
    messageId: string,
    destinationFolderId: string
  ): Promise<boolean> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    const token = await this.getAccessToken(config);

    const response = await fetch(
      `${GRAPH_API_BASE}/users/${mailboxEmail}/messages/${messageId}/move`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ destinationId: destinationFolderId })
      }
    );

    return response.ok;
  }

  /**
   * Löscht eine E-Mail
   */
  static async deleteEmail(
    config: ExchangeConfiguration,
    mailboxEmail: string,
    messageId: string
  ): Promise<boolean> {
    if (!this.isConfigurationValid(config)) {
      throw new ExchangeError("NOT_CONFIGURED");
    }

    const token = await this.getAccessToken(config);

    const response = await fetch(
      `${GRAPH_API_BASE}/users/${mailboxEmail}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.ok;
  }

  /**
   * Konvertiert eine Graph-E-Mail in das interne Format
   */
  static graphEmailToInsert(
    email: GraphEmail,
    mailboxId: string,
    tenantId: string
  ): InsertExchangeEmail {
    return {
      mailboxId,
      tenantId,
      messageId: email.id,
      internetMessageId: email.internetMessageId || null,
      conversationId: email.conversationId || null,
      fromAddress: email.from?.emailAddress?.address || "unknown",
      fromName: email.from?.emailAddress?.name || null,
      toAddresses: email.toRecipients?.map(r => r.emailAddress.address) || [],
      ccAddresses: email.ccRecipients?.map(r => r.emailAddress.address) || [],
      subject: email.subject || null,
      bodyPreview: email.bodyPreview || null,
      bodyContent: email.body?.content || null,
      bodyContentType: email.body?.contentType?.toLowerCase() || "html",
      hasAttachments: email.hasAttachments || false,
      attachmentCount: 0, // Würde bei Bedarf separat abgerufen
      receivedAt: email.receivedDateTime ? new Date(email.receivedDateTime) : null,
      sentAt: email.sentDateTime ? new Date(email.sentDateTime) : null,
      isProcessed: false,
      direction: "inbound"
    };
  }

  /**
   * Führt Post-Import-Aktionen für eine E-Mail aus
   */
  static async executePostImportActions(
    config: ExchangeConfiguration,
    mailbox: ExchangeMailbox,
    messageId: string
  ): Promise<void> {
    const actions = mailbox.postImportActions || ["mark_as_read"];
    
    for (const action of actions) {
      try {
        switch (action) {
          case "mark_as_read":
            await this.markAsRead(config, mailbox.emailAddress, messageId);
            break;
          case "move_to_folder":
            if (mailbox.targetFolderId) {
              await this.moveEmail(config, mailbox.emailAddress, messageId, mailbox.targetFolderId);
            }
            break;
          case "delete":
            await this.deleteEmail(config, mailbox.emailAddress, messageId);
            break;
          case "archive":
            await this.moveEmail(config, mailbox.emailAddress, messageId, "archive");
            break;
          case "keep_unchanged":
            // Nichts tun
            break;
        }
        logger.debug(this.logSource, "Post-Import-Aktion", `Aktion '${action}' für Nachricht ${messageId} ausgeführt`);
      } catch (error) {
        logger.warn(this.logSource, "Post-Import-Fehler", `Aktion '${action}' fehlgeschlagen: ${error}`);
      }
    }
  }
}

// Export für Logger-Quelle
export const EXCHANGE_LOG_SOURCE = "exchange";
