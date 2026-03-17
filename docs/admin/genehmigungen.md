# Genehmigungsworkflows verwalten

Administratoren können Genehmigungsworkflow-Templates erstellen und verwalten. Diese Templates legen fest, welche Schritte (und in welcher Reihenfolge) bei einer Genehmigungsanfrage durchlaufen werden.

## Workflow-Templates

**Navigation:** Genehmigungen → Workflows verwalten (Sidebar-Link für Admins)

### Neues Template erstellen

1. Auf **Neuer Workflow** klicken.
2. **Name** und **Beschreibung** eingeben (z.B. „Software-Freigabe", „Budgetantrag").
3. Mit **Erstellen** bestätigen.

Das Template wird sofort als **Aktiv** angelegt und steht beim Anfordern von Genehmigungen zur Auswahl.

### Schritte hinzufügen

Jedes Template besteht aus einem oder mehreren Schritten, die sequenziell durchlaufen werden.

1. Auf **Schritt hinzufügen** beim gewünschten Template klicken.
2. Folgenden Felder ausfüllen:

| Feld | Beschreibung |
|------|-------------|
| **Name** | Bezeichnung des Schritts (z.B. „Teamleiter-Freigabe") |
| **Genehmigertyp** | `Benutzer` (konkrete Person) oder `Rolle` (alle Mitglieder dieser Rolle) |
| **Genehmiger** | Wählen Sie den Benutzer oder die Rolle aus |
| **Reihenfolge** | Wird automatisch vergeben (1, 2, 3 …) |

3. Mit **Hinzufügen** bestätigen.

### Genehmiger-Typen

| Typ | Verhalten |
|-----|----------|
| **Benutzer** | Nur der ausgewählte Benutzer kann diesen Schritt genehmigen |
| **Rolle** | Alle Benutzer mit dieser Rolle (Admin / Agent) können den Schritt genehmigen – die erste Entscheidung gilt |

### Schritte löschen

Einzelne Schritte können über das Papierkorb-Symbol neben dem jeweiligen Schritt entfernt werden. Die Reihenfolge der verbleibenden Schritte passt sich automatisch an.

### Template deaktivieren / löschen

- **Deaktivieren**: Schalten Sie den Status-Schalter auf einem Template-Card auf inaktiv. Das Template wird bei neuen Anfragen nicht mehr angezeigt, bestehende Anfragen laufen weiter.
- **Löschen**: Klicken Sie auf **Löschen**. Templates mit laufenden Anfragen können nicht gelöscht werden.

## Datenbankstruktur

| Tabelle | Beschreibung |
|---------|-------------|
| `approvalWorkflows` | Template-Definitionen (Name, Beschreibung, aktiv, tenantId) |
| `approvalWorkflowSteps` | Einzelne Schritte je Template (Reihenfolge, Genehmigertyp, Genehmiger-ID/Rolle) |
| `approvalRequests` | Laufende Genehmigungsanfragen (Ticket, Workflow, Status, Antragsteller, Notiz) |
| `approvalDecisions` | Einzelne Entscheidungen pro Schritt (Genehmiger, Entscheidung, Kommentar, Zeitstempel) |

## API-Endpunkte

| Methode | Endpunkt | Beschreibung | Berechtigung |
|---------|----------|-------------|-------------|
| `GET` | `/api/approval-workflows` | Alle Templates des Mandanten abrufen | Admin |
| `POST` | `/api/approval-workflows` | Neues Template erstellen | Admin |
| `PATCH` | `/api/approval-workflows/:id` | Template aktualisieren (Name, Beschreibung, aktiv) | Admin |
| `DELETE` | `/api/approval-workflows/:id` | Template löschen | Admin |
| `POST` | `/api/approval-workflows/:id/steps` | Schritt hinzufügen | Admin |
| `DELETE` | `/api/approval-workflows/:workflowId/steps/:stepId` | Schritt entfernen | Admin |
| `GET` | `/api/approvals` | Eigene Anfragen abrufen | Admin, Agent |
| `GET` | `/api/approvals/pending` | Ausstehende Entscheidungen abrufen | Admin, Agent |
| `GET` | `/api/approvals/pending/count` | Anzahl ausstehender Entscheidungen | Admin, Agent |
| `GET` | `/api/approvals/ticket/:ticketId` | Genehmigung eines Tickets abrufen | Admin, Agent |
| `POST` | `/api/approvals` | Neue Genehmigungsanfrage stellen | Admin, Agent |
| `POST` | `/api/approvals/:id/decide` | Entscheidung treffen (genehmigen/ablehnen) | Admin, Agent |
| `POST` | `/api/approvals/:id/cancel` | Anfrage abbrechen | Admin, Agent |

## Best Practices

- Halten Sie Workflows **kurz**: 2–3 Schritte genügen für die meisten Prozesse.
- Nutzen Sie **Rollen** statt konkreter Benutzer, wenn es mehr als einen möglichen Genehmiger gibt – so bleiben Templates wartbar, auch wenn sich Belegschaft ändert.
- Legen Sie **beschreibende Namen** an, die den Zweck klar kommunizieren (z.B. „IT-Änderungsantrag", „Urlaubsfreigabe").
- Überprüfen Sie regelmäßig, ob inaktive Templates noch benötigt werden, und löschen Sie nicht mehr verwendete Templates.
