# Genehmigungsworkflows

Genehmigungsworkflows ermöglichen es, für Tickets strukturierte, mehrstufige Freigabeprozesse abzubilden. Typische Anwendungsfälle sind Softwareanfragen, Budgetfreigaben oder Änderungsanträge, die von einer oder mehreren Personen genehmigt werden müssen, bevor sie umgesetzt werden.

## Grundkonzept

```
┌─────────────────────────────────────────────────────────────────┐
│                     Genehmigungsprozess                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │  Ticket  │ → │ Genehmigung  │ → │  Schritt 1   │            │
│  │ erstellt │   │ anfordern    │   │  Teamleiter  │            │
│  └──────────┘   └──────────────┘   └──────┬───────┘            │
│                                           │                     │
│                                    ┌──────▼───────┐            │
│                                    │  Schritt 2   │            │
│                                    │  Abteilungs- │            │
│                                    │   leiter     │            │
│                                    └──────┬───────┘            │
│                                           │                     │
│                               ┌───────────▼────────────┐       │
│                               │  Genehmigt / Abgelehnt │       │
│                               └────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Ein **Genehmigungsworkflow-Template** definiert die Schritte, die beim Anfordern einer Genehmigung durchlaufen werden. Jeder Schritt wird einer Person oder einer Rolle zugewiesen.

## Genehmigung anfordern

**Navigation:** Tickets → Ticket öffnen → Tab „Genehmigung"

1. Ticket aufrufen und den Tab **Genehmigung** anklicken.
2. Auf **Genehmigung anfordern** klicken.
3. Das gewünschte **Workflow-Template** auswählen (z.B. „Software-Freigabe").
4. Optional: Eine **Notiz** für die Genehmiger eingeben.
5. Mit **Anfordern** bestätigen.

Nach dem Absenden ist die Genehmigungsanfrage aktiv. Der erste Schritt des Workflows ist jetzt offen.

## Genehmigungsstatus

| Status | Bedeutung |
|--------|----------|
| `Ausstehend` | Genehmigung läuft – wartet auf Entscheidung in einem Schritt |
| `Genehmigt` | Alle Schritte wurden positiv entschieden |
| `Abgelehnt` | Mindestens ein Schritt wurde abgelehnt |
| `Abgebrochen` | Die Anfrage wurde manuell abgebrochen |

## Entscheidung treffen

Wenn Sie als Genehmiger für einen Schritt zuständig sind, erscheint in der Ticket-Detailansicht (Tab „Genehmigung") die Schaltfläche **Entscheiden**.

1. **Entscheiden** klicken.
2. **Genehmigen** oder **Ablehnen** wählen.
3. Optional einen **Kommentar** eingeben.
4. Mit der entsprechenden Schaltfläche bestätigen.

Bei einer Genehmigung rückt der Workflow automatisch in den nächsten Schritt vor. Sind alle Schritte genehmigt, wechselt der Gesamtstatus auf **Genehmigt**. Bei einer Ablehnung wird der Prozess sofort beendet.

## Genehmigungsübersicht

**Navigation:** Genehmigungen (Sidebar)

Die Genehmigungsseite bietet zwei Tabs:

### Warten auf mich

Alle offenen Genehmigungsanfragen, bei denen Sie als Genehmiger für den aktuellen Schritt zuständig sind. Hier können Sie direkt eine Entscheidung treffen.

### Meine Anfragen

Alle Genehmigungsanfragen, die Sie selbst gestellt haben. Sie sehen den aktuellen Status und die Timeline der bisherigen Entscheidungen.

## Schritt-Timeline

In der Ticket-Detailansicht zeigt die Timeline alle Schritte des Workflows:

- **Amber-Badge „Aktuell"**: Der Schritt wartet auf eine Entscheidung.
- **Grüner Haken**: Schritt wurde genehmigt (mit Datum und Kommentar).
- **Roter Pfeil**: Schritt wurde abgelehnt (mit Datum und Kommentar).
- **Grauer Kreis**: Schritt steht noch aus (wird erst nach dem vorherigen Schritt aktiv).

## Hinweise

- Es kann pro Ticket nur **eine aktive Genehmigungsanfrage** gleichzeitig geben.
- Eine laufende Anfrage kann von Admins und Agenten **abgebrochen** werden.
- Genehmiger einer Rolle können alle Mitglieder dieser Rolle abstimmen – die erste Entscheidung gilt für den Schritt.
- Die Sidebar zeigt ein **Amber-Badge** mit der Anzahl der ausstehenden Entscheidungen.
