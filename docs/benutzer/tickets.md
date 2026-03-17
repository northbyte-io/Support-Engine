# Tickets

Tickets sind das Kernstück von Support-Engine. Jede Supportanfrage, Aufgabe oder Störung wird als Ticket erfasst und verfolgt.

## Ticket erstellen

**Navigation:** Tickets → Neues Ticket (oben rechts)

### Pflichtfelder

| Feld | Beschreibung |
|------|-------------|
| Betreff | Kurze Zusammenfassung des Problems |
| Beschreibung | Detaillierte Beschreibung (Rich-Text mit TipTap-Editor) |
| Priorität | `niedrig`, `mittel`, `hoch`, `kritisch` |

### Optionale Felder

| Feld | Beschreibung |
|------|-------------|
| Typ | Tickettyp (z.B. Anfrage, Störung, Aufgabe) |
| Bearbeiter | Zuständiger Agent |
| Kunde | Verknüpfter Kunde aus dem CRM |
| Kontakt | Ansprechpartner des Kunden |
| Asset | Betroffenes Gerät/Asset |
| Projekt | Zugehöriges Projekt / Kanban-Board |
| Bereich | Abteilung / Organisationseinheit |

## Ticket-Status

| Status | Bedeutung |
|--------|----------|
| `offen` | Neu eingegangen, noch nicht bearbeitet |
| `in Bearbeitung` | Bearbeiter wurde zugewiesen |
| `wartend` | Wartet auf externe Rückmeldung |
| `gelöst` | Lösung wurde gefunden |
| `geschlossen` | Abgeschlossen und archiviert |

## Ticket-Ansicht

### Kommentare

Kommentare können intern (nur für Agenten sichtbar) oder öffentlich (für Kunden sichtbar) sein. Der Rich-Text-Editor unterstützt:

- Textformatierung (Fett, Kursiv, Listen)
- Links
- Bilder
- @-Erwähnungen anderer Agenten

Erwähnte Benutzer erhalten eine Benachrichtigung.

### Anhänge

Dateien können per Drag-and-Drop oder über den Dateiauswahl-Dialog hochgeladen werden. Alle gängigen Dateiformate werden unterstützt.

### Zeiterfassung

Direkt im Ticket kann Zeit erfasst werden:

- **Timer starten**: Automatische Zeitmessung
- **Manueller Eintrag**: Zeit direkt eingeben
- Alle Einträge erscheinen in der Zeiterfassungs-Übersicht

## Ticket-Liste

**Navigation:** Tickets

Die Ticketliste bietet umfangreiche Filter- und Sortiermöglichkeiten:

| Filter | Optionen |
|--------|---------|
| Status | Alle, offen, in Bearbeitung, wartend, gelöst, geschlossen |
| Priorität | Alle, kritisch, hoch, mittel, niedrig |
| Bearbeiter | Alle, nicht zugewiesen, bestimmter Agent |
| Kunde | Nach Kunde filtern |
| Projekt | Nach Projekt filtern |
| Suche | Volltext in Betreff und Beschreibung |

## Ticket löschen

Tickets werden standardmäßig **soft-gelöscht** (DSGVO-konform): Sie bleiben in der Datenbank, sind aber nicht mehr sichtbar. Nur Admins können einen Hard-Delete durchführen.

## SLA-Anzeige

Wenn eine SLA-Definition für die Ticket-Priorität konfiguriert ist, zeigt das Ticket:

- Verbleibende Zeit bis zur Reaktionsfrist
- Verbleibende Zeit bis zur Lösungsfrist
- Farblicher Status: grün (OK), gelb (Warnung), rot (überschritten)

## Genehmigung anfordern

Tickets können einen Genehmigungsprozess durchlaufen, bevor eine Anfrage umgesetzt wird. Der Tab **Genehmigung** in der Ticket-Detailansicht zeigt den aktuellen Status und die Schritt-Timeline.

- **Genehmigung anfordern**: Workflow-Template auswählen und optional eine Notiz hinterlegen.
- **Entscheidung treffen**: Wenn Sie als Genehmiger zuständig sind, erscheint die Schaltfläche „Entscheiden". Sie können die Anfrage genehmigen oder ablehnen und einen Kommentar hinzufügen.
- **Anfrage abbrechen**: Admins und Agenten können eine laufende Anfrage jederzeit abbrechen.

Eine vollständige Beschreibung des Genehmigungsworkflows finden Sie im Abschnitt [Genehmigungsworkflows](genehmigungen.md).

## Optimistische Updates

Status- und Prioritätsänderungen werden optimistisch aktualisiert: Die Oberfläche reagiert sofort, ohne auf die Server-Bestätigung zu warten. Bei einem Fehler wird die vorherige Ansicht wiederhergestellt.
