import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E-Testkonfiguration
 *
 * Umgebungsvariablen:
 *   E2E_BASE_URL        – App-URL (Standard: http://localhost:5000)
 *   E2E_ADMIN_EMAIL     – E-Mail-Adresse des Testbenutzers (Admin oder Agent)
 *   E2E_ADMIN_PASSWORD  – Passwort des Testbenutzers
 *
 * Befehle:
 *   npm run e2e           – Tests headless ausführen
 *   npm run e2e:ui        – Interaktiver Playwright-UI-Modus
 *   npm run e2e:debug     – Tests mit Inspektor debuggen
 *   npm run e2e:report    – Letzten HTML-Report öffnen
 */
export default defineConfig({
  testDir: "./e2e",

  // Maximale Laufzeit pro Test (30 s lokal, 60 s in CI)
  timeout: process.env.CI ? 60_000 : 30_000,

  // Vollständig parallel lokal; in CI mit einem Worker für stabile DB-Zustände
  fullyParallel: !process.env.CI,
  workers: process.env.CI ? 1 : undefined,

  // Schutz vor versehentlichem test.only in CI
  forbidOnly: !!process.env.CI,

  // Wiederholungsversuche bei Fehlern
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5000",
    // Trace bei erstem Fehlversuch aufzeichnen (Debugging)
    trace: "on-first-retry",
    // Screenshot nur bei Fehlern
    screenshot: "only-on-failure",
  },

  projects: [
    // ── 1. Setup-Projekt: meldet sich an und speichert den Auth-Cookie ──────
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // ── 2. Chromium (authentifiziert) ────────────────────────────────────────
    // Lädt den gespeicherten Cookie-Status. Abhängig vom Setup-Schritt.
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      // Keine Setup-Datei und keine Nicht-Auth-Tests ausführen
      testIgnore: [/auth\.setup\.ts/, /\.noauth\.spec\.ts/],
    },

    // ── 3. Chromium (nicht authentifiziert) ──────────────────────────────────
    // Für Tests, die kein Login benötigen (z. B. Login-Seite selbst)
    {
      name: "chromium-no-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.noauth\.spec\.ts/,
    },
  ],

  // Entwicklungsserver automatisch starten; vorhandenen Server in CI wiederverwenden
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
