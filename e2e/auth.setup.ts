/**
 * Auth-Setup-Schritt
 *
 * Meldet sich über die Login-Seite an und speichert den resultierenden
 * Browser-Zustand (inkl. httpOnly-Cookie) in e2e/.auth/admin.json.
 *
 * Alle authentifizierten Tests laden diesen Zustand, sodass jeder Test
 * bereits eingeloggt startet – ohne die Login-Seite jedes Mal zu besuchen.
 *
 * Voraussetzungen:
 *   E2E_ADMIN_EMAIL     – E-Mail eines aktiven Benutzers (admin oder agent)
 *   E2E_ADMIN_PASSWORD  – Passwort des Benutzers
 *
 * Ohne diese Variablen wird der Schritt übersprungen und alle
 * authentifizierten Tests schlagen fehl – dies ist das erwartete Verhalten.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join("e2e", ".auth", "admin.json");

setup("Testbenutzer authentifizieren", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  setup.skip(
    !email || !password,
    "E2E_ADMIN_EMAIL und E2E_ADMIN_PASSWORD sind nicht gesetzt. " +
      "Legen Sie einen Testbenutzer an und setzen Sie diese Variablen " +
      "(z. B. in einer .env.e2e-Datei).",
  );

  await page.goto("/login");
  await expect(page.getByTestId("input-email")).toBeVisible();

  await page.getByTestId("input-email").fill(email!);
  await page.getByTestId("input-password").fill(password!);
  await page.getByTestId("button-login").click();

  // Nach erfolgreichem Login wird auf das Dashboard weitergeleitet
  await page.waitForURL("/", { timeout: 15_000 });
  await expect(page).toHaveURL("/");

  // Browser-Zustand (Cookies inkl. httpOnly-Token) speichern
  await page.context().storageState({ path: AUTH_FILE });
});
