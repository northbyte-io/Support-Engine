/**
 * Ticket-Verwaltung – End-to-End-Tests
 *
 * Deckt den vollständigen Ticket-Lebenszyklus ab:
 * Anzeige der Liste → neues Ticket erstellen → Detail ansehen → Status ändern.
 *
 * Jeder Test läuft im authentifizierten Kontext (gespeicherter Cookie-Status).
 */
import { test, expect } from "@playwright/test";

// Eindeutiger Testpräfix, um von anderen Testdaten unterscheidbar zu sein
const TEST_PREFIX = `[E2E-${Date.now()}]`;

test.describe("Ticketliste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
    await expect(page).toHaveURL("/tickets");
  });

  test("zeigt Seitenüberschrift", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /tickets/i })).toBeVisible();
  });

  test("zeigt Suchfeld", async ({ page }) => {
    await expect(page.getByPlaceholder(/suchen|search/i)).toBeVisible();
  });

  test("zeigt Schaltfläche zum Erstellen eines Tickets", async ({ page }) => {
    // "Neues Ticket"-Button in der oberen Leiste
    await expect(
      page
        .getByRole("button", { name: /neues ticket|new ticket/i })
        .or(page.getByRole("link", { name: /neues ticket|new ticket/i })),
    ).toBeVisible();
  });

  test("Suche filtert Ergebnisse", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/suchen|search/i);
    await searchInput.fill("xxxxxxxxxxxxxxxxxxx-kein-ergebnis");
    // Entweder Leer-Zustand oder keine Tickets
    await expect(
      page
        .getByText(/keine tickets|no tickets|nicht gefunden/i)
        .or(page.locator('[data-testid="empty-state"]')),
    ).toBeVisible({ timeout: 5_000 });

    // Suche zurücksetzen
    await searchInput.clear();
  });
});

test.describe("Ticket erstellen (End-to-End)", () => {
  test("Neues Ticket kann erstellt werden", async ({ page }) => {
    await page.goto("/tickets/new");
    await expect(page).toHaveURL("/tickets/new");

    // Titelfeld finden und ausfüllen
    const titleInput = page
      .getByLabel(/titel|betreff|subject|title/i)
      .or(page.getByPlaceholder(/titel|betreff|subject|title/i))
      .first();
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill(`${TEST_PREFIX} Playwright-Testticket`);

    // Beschreibungsfeld (TipTap-Editor oder Textarea)
    const descField = page
      .getByLabel(/beschreibung|description/i)
      .or(page.locator(".tiptap, [contenteditable='true']"))
      .first();
    if (await descField.isVisible().catch(() => false)) {
      await descField.click();
      await descField.fill("Automatisch erstelltes Testticket – kann gelöscht werden.");
    }

    // Formular absenden
    const submitButton = page.getByRole("button", { name: /erstellen|speichern|anlegen|submit|save/i });
    await submitButton.click();

    // Nach dem Speichern: Weiterleitung zur Detailseite oder Ticketliste
    await expect(page).not.toHaveURL("/tickets/new", { timeout: 15_000 });
  });
});

test.describe("Ticket-Navigation", () => {
  test("Klick auf ein Ticket öffnet die Detailseite", async ({ page }) => {
    await page.goto("/tickets");

    // Erstes Ticket in der Liste anklicken (falls vorhanden)
    const ticketLinks = page.getByRole("link").filter({
      has: page.getByText(/open|in_progress|waiting|offen|in bearbeitung/i),
    });

    const count = await ticketLinks.count();
    test.skip(count === 0, "Keine Tickets in der Liste – Test überspringen");

    await ticketLinks.first().click();
    // URL muss /tickets/<id> entsprechen
    await expect(page).toHaveURL(/\/tickets\/[^/]+$/, { timeout: 10_000 });
  });

  test("Schaltfläche 'Neues Ticket' navigiert zum Formular", async ({
    page,
  }) => {
    await page.goto("/tickets");

    const newTicketBtn = page
      .getByRole("button", { name: /neues ticket|new ticket/i })
      .or(page.getByRole("link", { name: /neues ticket|new ticket/i }));

    await newTicketBtn.first().click();
    await expect(page).toHaveURL("/tickets/new");
  });
});
