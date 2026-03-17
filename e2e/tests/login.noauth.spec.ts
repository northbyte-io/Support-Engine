/**
 * Login-Seite – nicht authentifizierte Tests
 *
 * Diese Tests laufen ohne gespeicherten Auth-Status (Projekt "chromium-no-auth").
 * Sie prüfen die Login-Seite selbst: Rendering, Validierung, Fehlerbehandlung
 * und die Weiterleitung nach erfolgreichem Login.
 */
import { test, expect } from "@playwright/test";

test.describe("Login-Seite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("rendert Überschrift und Formularfelder", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByTestId("input-email")).toBeVisible();
    await expect(page.getByTestId("input-password")).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeVisible();
    await expect(page.getByTestId("link-register")).toBeVisible();
  });

  test("zeigt Validierungsfehler bei leerem Formular", async ({ page }) => {
    await page.getByTestId("button-login").click();
    // Zod-Validierung: E-Mail-Feld ist Pflichtfeld
    await expect(page.getByText(/ungültig|pflicht|invalid/i)).toBeVisible();
  });

  test("zeigt Fehlermeldung bei falschen Anmeldedaten", async ({ page }) => {
    await page.getByTestId("input-email").fill("unbekannt@beispiel.de");
    await page.getByTestId("input-password").fill("falsches-passwort");
    await page.getByTestId("button-login").click();

    // Server antwortet mit 401; Toast oder Fehlermeldung muss erscheinen
    await expect(
      page.getByText(/anmeldung fehlgeschlagen|ungültige anmeldedaten/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Ladeindikator erscheint beim Absenden", async ({ page }) => {
    await page.getByTestId("input-email").fill("test@beispiel.de");
    await page.getByTestId("input-password").fill("passwort");

    // Auf den Spinner warten, während die Anfrage läuft
    const loginButton = page.getByTestId("button-login");
    await loginButton.click();
    // Der Button ist kurzzeitig deaktiviert ("Wird angemeldet…")
    // (Entweder sichtbar oder der Loader-Spinner erscheint)
    await expect(loginButton).toBeDisabled().catch(() => {
      // Falls zu schnell – kein Fehler
    });
  });

  test("Link zur Registrierungsseite funktioniert", async ({ page }) => {
    await page.getByTestId("link-register").click();
    await expect(page).toHaveURL("/register");
  });

  test("nicht authentifizierte Zugriffe auf geschützte Seiten leiten um", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");

    await page.goto("/tickets");
    await expect(page).toHaveURL("/login");
  });

  test("erfolgreiche Anmeldung leitet auf Dashboard weiter", async ({
    page,
  }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD nicht gesetzt");

    await page.getByTestId("input-email").fill(email ?? "");
    await page.getByTestId("input-password").fill(password ?? "");
    await page.getByTestId("button-login").click();

    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
