import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import chalk from "chalk";
import path from "node:path";
import fs from "node:fs";

// Log levels with German descriptions
export type LogLevel = "debug" | "info" | "warn" | "error" | "security" | "performance";

// Log sources
export type LogSource = 
  | "api"
  | "auth"
  | "authorization"
  | "ticket"
  | "sla"
  | "crm"
  | "email"
  | "exchange"
  | "integration"
  | "database"
  | "background"
  | "system";

// Entity types
export type EntityType = 
  | "ticket"
  | "user"
  | "customer"
  | "contact"
  | "organization"
  | "project"
  | "asset"
  | "comment"
  | "sla"
  | "survey"
  | "kb_article"
  | "time_entry"
  | "tenant"
  | "none";

// Log entry structure
export interface LogEntry {
  level: LogLevel;
  source: LogSource;
  entityType?: EntityType;
  entityId?: string;
  tenantId?: string;
  userId?: string;
  title: string;
  description: string;
  error?: {
    description: string;
    cause: string;
    solution: string;
  };
  metadata?: Record<string, unknown>;
}

// Color configuration for terminal and console
const levelColors: Record<LogLevel, (text: string) => string> = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  security: chalk.magenta,
  performance: chalk.hex("#FFA500"), // Orange
};

const sourceColors: Record<LogSource, (text: string) => string> = {
  api: chalk.cyan,
  auth: chalk.magenta,
  authorization: chalk.magenta,
  ticket: chalk.green,
  sla: chalk.hex("#FFA500"),
  crm: chalk.blue,
  email: chalk.cyan,
  exchange: chalk.hex("#0078D4"), // Microsoft Blue
  integration: chalk.cyan,
  database: chalk.gray,
  background: chalk.gray,
  system: chalk.white,
};

// Level priorities for winston
const levelPriorities: Record<string, number> = {
  error: 0,
  security: 1,
  performance: 2,
  warn: 3,
  info: 4,
  debug: 5,
};

// Format timestamp in German format
function formatTimestamp(date: Date): string {
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Format log entry for console (colored)
function formatConsoleLog(entry: LogEntry, timestamp: Date): string {
  const ts = chalk.gray(`[${formatTimestamp(timestamp)}]`);
  const level = levelColors[entry.level](`[${entry.level.toUpperCase().padEnd(11)}]`);
  const source = sourceColors[entry.source](`[${entry.source.padEnd(13)}]`);
  
  let entityInfo = "";
  if (entry.entityType && entry.entityType !== "none") {
    const entitySuffix = entry.entityId ? `:${entry.entityId.slice(0, 8)}` : "";
    entityInfo = chalk.gray(` [${entry.entityType}${entitySuffix}]`);
  }
  
  let tenantUser = "";
  if (entry.tenantId || entry.userId) {
    const parts = [];
    if (entry.tenantId) parts.push(`M:${entry.tenantId.slice(0, 8)}`);
    if (entry.userId) parts.push(`U:${entry.userId.slice(0, 8)}`);
    tenantUser = chalk.gray(` [${parts.join(" ")}]`);
  }
  
  let output = `${ts} ${level} ${source}${entityInfo}${tenantUser}\n`;
  output += `   ${chalk.bold(entry.title)}\n`;
  output += `   ${entry.description}\n`;
  
  if (entry.error) {
    output += chalk.red(`   Fehlerbeschreibung: ${entry.error.description}\n`);
    output += chalk.yellow(`   Ursache: ${entry.error.cause}\n`);
    output += chalk.green(`   Lösungsvorschlag: ${entry.error.solution}\n`);
  }
  
  return output;
}

// Format log entry for file (no colors)
function formatFileLog(entry: LogEntry, timestamp: Date): string {
  const ts = `[${formatTimestamp(timestamp)}]`;
  const level = `[${entry.level.toUpperCase().padEnd(11)}]`;
  const source = `[${entry.source.padEnd(13)}]`;
  
  let entityInfo = "";
  if (entry.entityType && entry.entityType !== "none") {
    const entitySuffix = entry.entityId ? `:${entry.entityId}` : "";
    entityInfo = ` [${entry.entityType}${entitySuffix}]`;
  }
  
  let tenantUser = "";
  if (entry.tenantId || entry.userId) {
    const parts = [];
    if (entry.tenantId) parts.push(`Mandant:${entry.tenantId}`);
    if (entry.userId) parts.push(`Benutzer:${entry.userId}`);
    tenantUser = ` [${parts.join(" | ")}]`;
  }
  
  let output = `${ts} ${level} ${source}${entityInfo}${tenantUser}\n`;
  output += `   Titel: ${entry.title}\n`;
  output += `   Beschreibung: ${entry.description}\n`;
  
  if (entry.error) {
    output += `   --- Fehlerdetails ---\n`;
    output += `   Fehlerbeschreibung: ${entry.error.description}\n`;
    output += `   Ursache: ${entry.error.cause}\n`;
    output += `   Lösungsvorschlag: ${entry.error.solution}\n`;
    output += `   ---------------------\n`;
  }
  
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    output += `   Zusatzdaten: ${JSON.stringify(entry.metadata)}\n`;
  }
  
  output += `---\n`;
  
  return output;
}

// JSON format for API and database storage
export function formatJsonLog(entry: LogEntry, timestamp: Date): object {
  return {
    timestamp: timestamp.toISOString(),
    timestampFormatted: formatTimestamp(timestamp),
    level: entry.level,
    source: entry.source,
    entityType: entry.entityType || "none",
    entityId: entry.entityId || null,
    tenantId: entry.tenantId || null,
    userId: entry.userId || null,
    title: entry.title,
    description: entry.description,
    error: entry.error || null,
    metadata: entry.metadata || null,
  };
}

// Logs directory
const logsDir = path.join(process.cwd(), "logs");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom winston format for console
const consoleFormat = winston.format.printf(({ message }) => String(message));

// Custom winston format for file
const fileFormat = winston.format.printf(({ message }) => String(message));

// Daily rotate file transport - 2GB max, 7 days retention
const fileTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "support-engine-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "2g", // 2GB max per file
  maxFiles: "7d", // Keep logs for 7 days
  zippedArchive: true,
  format: fileFormat,
});

// Security log transport (separate file)
const securityTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "security-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "500m",
  maxFiles: "7d",
  zippedArchive: true,
  format: fileFormat,
  level: "security",
});

// Performance log transport (separate file)
const performanceTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: "performance-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "500m",
  maxFiles: "7d",
  zippedArchive: true,
  format: fileFormat,
  level: "performance",
});

// Create winston logger
const winstonLogger = winston.createLogger({
  levels: levelPriorities,
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    fileTransport,
  ],
});

// In-memory log buffer for UI (last 1000 entries)
const logBuffer: Array<{ entry: LogEntry; timestamp: Date; formatted: object }> = [];
const MAX_BUFFER_SIZE = 1000;

function addToBuffer(entry: LogEntry, timestamp: Date) {
  const formatted = formatJsonLog(entry, timestamp);
  logBuffer.push({ entry, timestamp, formatted });
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

// Base keys present in all convenience method signatures
type LogEntryBaseKeys = "level" | "source" | "title" | "description";

// Main logger class
class Logger {
  private maskSensitiveData(text: string): string {
    // Handle undefined/null gracefully
    if (!text) return text ?? '';
    // Mask passwords (including common aliases)
    let masked = text.replaceAll(/(?:password|passwd|pwd|pass)['":\s]*['"]?[^'"}\s,]+['"]?/gi, 'password: [MASKIERT]');
    // Mask API keys
    masked = masked.replaceAll(/api[_-]?key['":\s]*['"]?[^'"}\s,]+['"]?/gi, 'api_key: [MASKIERT]');
    // Mask tokens and Bearer values
    masked = masked.replaceAll(/token['":\s]*['"]?[^'"}\s,]+['"]?/gi, 'token: [MASKIERT]');
    masked = masked.replaceAll(/Bearer\s+[-A-Za-z0-9._~+/]+=*/g, 'Bearer [MASKIERT]');
    // Mask secrets and credentials
    masked = masked.replaceAll(/(?:secret|credential|private[_-]?key|privateKey)['":\s]*['"]?[^'"}\s,]+['"]?/gi, 'secret: [MASKIERT]');
    // Mask email addresses partially — split on @ to avoid unanchored quantifiers (S5852)
    masked = masked.split('@').reduce((acc: string, part: string, i: number) => {
      if (i === 0) return part;
      const localMatch = acc.match(/[a-z0-9._-]+$/i);
      const local = localMatch?.[0] ?? '';
      const prefix = local ? acc.slice(0, -local.length) : acc;
      const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : (local ? '***' : '');
      const domainMatch = part.match(/^[a-z0-9._-]+/i);
      const domain = domainMatch?.[0] ?? '';
      const suffix = part.slice(domain.length);
      return `${prefix}${maskedLocal}@${domain}${suffix}`;
    }, '');
    return masked;
  }

  private log(entry: LogEntry) {
    const timestamp = new Date();
    
    // Mask sensitive data
    entry.title = this.maskSensitiveData(entry.title);
    entry.description = this.maskSensitiveData(entry.description);
    if (entry.error) {
      entry.error.description = this.maskSensitiveData(entry.error.description);
      entry.error.cause = this.maskSensitiveData(entry.error.cause);
      entry.error.solution = this.maskSensitiveData(entry.error.solution);
    }
    
    // Add to buffer for UI
    addToBuffer(entry, timestamp);
    
    // Console output (colored)
    const consoleOutput = formatConsoleLog(entry, timestamp);
    
    // File output (plain text)
    const fileOutput = formatFileLog(entry, timestamp);
    
    // Log to winston
    winstonLogger.log(entry.level, consoleOutput);
    
    // Write to file separately for proper formatting
    fileTransport.log?.({ level: entry.level, message: fileOutput }, () => {});
    
    // Write security logs to separate file
    if (entry.level === "security") {
      securityTransport.log?.({ level: entry.level, message: fileOutput }, () => {});
    }
    
    // Write performance logs to separate file
    if (entry.level === "performance") {
      performanceTransport.log?.({ level: entry.level, message: fileOutput }, () => {});
    }
  }

  // Convenience methods
  debug(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "debug", source, title, description, ...options });
  }

  info(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "info", source, title, description, ...options });
  }

  warn(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "warn", source, title, description, ...options });
  }

  error(source: LogSource, title: string, errorInfo: { description: string; cause: string; solution: string }, options?: Partial<Omit<LogEntry, LogEntryBaseKeys | "error">>) {
    this.log({ 
      level: "error", 
      source, 
      title, 
      description: errorInfo.description,
      error: errorInfo,
      ...options 
    });
  }

  security(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "security", source, title, description, ...options });
  }

  performance(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "performance", source, title, description, ...options });
  }

  // Success helper (info level with green styling in description)
  success(source: LogSource, title: string, description: string, options?: Partial<Omit<LogEntry, LogEntryBaseKeys>>) {
    this.log({ level: "info", source, title, description: `✓ ${description}`, ...options });
  }

  private applyFilters(
    entries: typeof logBuffer,
    filters: NonNullable<Parameters<Logger["getLogs"]>[0]>
  ): typeof logBuffer {
    let result = entries;
    if (filters.level) result = result.filter(l => l.entry.level === filters.level);
    if (filters.source) result = result.filter(l => l.entry.source === filters.source);
    if (filters.tenantId) result = result.filter(l => l.entry.tenantId === filters.tenantId);
    if (filters.userId) result = result.filter(l => l.entry.userId === filters.userId);
    if (filters.entityType) result = result.filter(l => l.entry.entityType === filters.entityType);
    if (filters.entityId) result = result.filter(l => l.entry.entityId === filters.entityId);
    if (filters.startDate) {
      const { startDate } = filters;
      result = result.filter(l => l.timestamp >= startDate);
    }
    if (filters.endDate) {
      const { endDate } = filters;
      result = result.filter(l => l.timestamp <= endDate);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(l =>
        l.entry.title.toLowerCase().includes(searchLower) ||
        l.entry.description.toLowerCase().includes(searchLower) ||
        l.entry.error?.description.toLowerCase().includes(searchLower) ||
        l.entry.error?.cause.toLowerCase().includes(searchLower) ||
        l.entry.error?.solution.toLowerCase().includes(searchLower)
      );
    }
    return result;
  }

  // Get logs from buffer for UI
  getLogs(filters?: {
    level?: LogLevel;
    source?: LogSource;
    tenantId?: string;
    userId?: string;
    entityType?: EntityType;
    entityId?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): { logs: object[]; total: number } {
    let filtered = filters ? this.applyFilters([...logBuffer], filters) : [...logBuffer];

    const total = filtered.length;

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;
    filtered = filtered.slice(offset, offset + limit);

    return {
      logs: filtered.map(l => l.formatted),
      total,
    };
  }

  // Get available log files for export
  getLogFiles(): string[] {
    try {
      return fs.readdirSync(logsDir).filter(f => f.endsWith(".log") || f.endsWith(".log.gz"));
    } catch {
      return [];
    }
  }

  // Read log file content
  readLogFile(filename: string): string | null {
    try {
      const filepath = path.join(logsDir, filename);
      if (!fs.existsSync(filepath)) return null;
      return fs.readFileSync(filepath, "utf-8");
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { Logger };
