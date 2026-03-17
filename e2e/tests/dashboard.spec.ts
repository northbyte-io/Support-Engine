/**
 * Dashboard – authentifizierte Tests
 *
 * Laden den gespeicherten Auth-Status (httpOnly-Cookie). Jeder Test startet
 * bereits eingeloggt – kein manuelles Login erforderlich.
 *
 * Voraussetzung: E2E_ADMIN_EMAIL und E2E_ADMIN_PASSWORD müssen gesetzt sein,
 * damit das auth.setup.ts den Zustand speichern kann.
 */
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Sicherstellen, dass das Dashboard geladen ist (nicht Login-Redirect)
    await expect(page).toHaveURL("/");
  });

  test("zeigt Dashboard-Überschrift", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("zeigt Statistik-Kacheln", async ({ page }) => {
    // Dashboard lädt Statistiken via /api/dashboard/stats
    // Kacheln erscheinen nach dem Laden (Skeleton → Inhalt)
    await expect(page.getByText(/offene tickets/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/in bearbeitung/i)).toBeVisible();
  });

  test("zeigt Abschnitt für aktuelle Tickets", async ({ page }) => {
    await expect(
      page.getByText(/aktuelle tickets|letzte tickets|recent/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Navigation: Tickets-Link führt zur Ticketliste", async ({ page }) => {
    // Sidebar-Navigation anklicken
    await page.getByRole("link", { name: /tickets/i }).first().click();
    await expect(page).toHaveURL("/tickets");
  });

  test("Navigation: Wissensbank-Link ist vorhanden", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /wissensbank|knowledge/i }),
    ).toBeVisible();
  });

  test("Abmelden leitet auf Login-Seite weiter", async ({ page }) => {
    // Benutzermenü oder Abmelde-Button
    const logoutTrigger = page
      .getByRole("button", { name: /abmelden|logout|abmeldung/i })
      .or(page.getByLabel(/abmelden|logout/i));

    // Falls ein Dropdown geöffnet werden muss (Avatar-Menü)
    const avatarButton = page.getByRole("button", { name: /konto|profil|account|user/i });
    if (await avatarButton.isVisible().catch(() => false)) {
      await avatarButton.click();
    }

    await logoutTrigger.first().click();
    await expect(page).toHaveURL("/login", { timeout: 10_000 });
  });
});
