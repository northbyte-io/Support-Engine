# Berichte & Analysen

Die Berichtsseite bietet umfangreiche Auswertungen zu Tickets, SLA-Performance und Zeiterfassung – jeweils mit flexiblen Zeitraumfiltern und vier Exportformaten.

## Navigation

**Pfad:** Seitenleiste → **Berichte** (BarChart-Icon, direkt unterhalb von Tickets)

Zugänglich für alle Benutzer mit der Rolle **Admin** oder **Agent**.

---

## Zeitraumfilter

Oben auf der Seite befindet sich eine Filterleiste zur Auswahl des Auswertungszeitraums:

| Option | Beschreibung |
|--------|--------------|
| **7 Tage** | Letzte 7 Tage ab heute |
| **30 Tage** | Letzte 30 Tage (Standard) |
| **90 Tage** | Letzte 90 Tage |
| **Benutzerdefiniert** | Freie Eingabe von Start- und Enddatum |

Der gewählte Zeitraum gilt für alle drei Report-Tabs gleichzeitig.

---

## Tab: Ticket-Analyse

Übersicht über alle Tickets im gewählten Zeitraum.

### Kennzahlen-Karten

| Karte | Bedeutung |
|-------|-----------|
| **Gesamt** | Anzahl aller erstellten Tickets |
| **Offen** | Tickets mit Status „Offen" |
| **In Bearbeitung** | Tickets mit Status „In Bearbeitung" |
| **Gelöst** | Tickets mit Status „Gelöst" |
| **Geschlossen** | Tickets mit Status „Geschlossen" |

### Diagramme

- **Tickets pro Tag** (Balkendiagramm): Zeigt täglich erstellte, offene und gelöste Tickets nebeneinander
- **Nach Status** (Tortendiagramm): Prozentualer Anteil jedes Ticket-Status
- **Nach Priorität** (Tortendiagramm): Prozentualer Anteil jeder Prioritätsstufe

### Agenten-Performance-Tabelle

Listet die Top-10-Agenten nach zugewiesenen Tickets mit:
- Anzahl zugewiesener Tickets
- Anzahl gelöster Tickets
- Lösungsrate in Prozent

---

## Tab: SLA-Performance

Auswertung der Einhaltung definierter Service-Level-Agreements.

### Kennzahlen-Karten

| Karte | Bedeutung |
|-------|-----------|
| **Gesamt-Tickets** | Alle Tickets im Zeitraum |
| **Compliance-Rate** | Prozentsatz der eingehaltenen SLAs (grün ≥ 90 %, gelb ≥ 70 %, rot < 70 %) |
| **SLA-Verletzungen** | Anzahl und Prozentsatz verletzter SLAs |
| **Ø Antwortzeit** | Durchschnittliche Zeit bis zur ersten Reaktion; darunter die Ø Lösungszeit |

### Diagramme

- **SLA-Verlauf** (Liniendiagramm): Gesamt-, eingehaltene und verletzte SLAs pro Tag
- **SLA-Compliance täglich** (Balkendiagramm): Compliance-Rate pro Tag in Farbe (grün/gelb/rot nach Schwellenwert)

---

## Tab: Zeiterfassung

Auswertung der gebuchten Arbeitszeiten im gewählten Zeitraum.

### Kennzahlen-Karten

| Karte | Bedeutung |
|-------|-----------|
| **Gesamtstunden** | Alle erfassten Minuten als Stunden/Minuten |
| **Abrechenbar** | Abrechenbare Zeit und ihr Anteil an der Gesamtzeit |
| **Nicht abrechenbar** | Nicht abrechenbare Zeit |
| **Gesamtbetrag** | Berechneter Betrag aus abrechenbaren Einträgen mit Stundensatz |

### Diagramme & Tabellen

- **Erfasste Zeit pro Tag** (Balkendiagramm): Gesamt- und abrechenbare Minuten je Tag
- **Zeit pro Agent** (Fortschrittsbalken): Visueller Vergleich aller Agenten mit abrechenbarer Quote
- **Detailtabelle**: Agent, Gesamtzeit, abrechenbare Zeit und Quote in Prozent

---

## Export

Jeder der drei Tabs kann über den Button **„Exportieren"** (oben rechts) in vier Formaten heruntergeladen werden:

| Format | Dateiendung | Besonderheiten |
|--------|-------------|----------------|
| **CSV** | `.csv` | Semikolongetrennt, UTF-8 mit BOM für Excel-Kompatibilität |
| **Excel** | `.xlsx` | Natives Excel-Format (SheetJS), direkt in Excel/LibreOffice öffenbar |
| **PDF** | `.pdf` | Professionelles Tabellenlayout mit Kopfzeile, Zeitraum und Exportdatum |
| **HTML** | `.html` | Druckfertiges, gestyltes HTML-Dokument; im Browser öffnen und drucken (Strg+P) |

Der Dateiname enthält automatisch den Berichtstyp und den Zeitraum, z. B.:
```
bericht-tickets-2026-01-01_2026-03-17.xlsx
```

---

## API-Endpunkte

Alle Berichtsdaten sind auch direkt per API abrufbar (Authentifizierung erforderlich):

```http
GET /api/reports/tickets?from=2026-01-01&to=2026-03-17
GET /api/reports/sla?from=2026-01-01&to=2026-03-17
GET /api/reports/time?from=2026-01-01&to=2026-03-17

GET /api/reports/export?type=tickets&format=csv&from=2026-01-01&to=2026-03-17
GET /api/reports/export?type=sla&format=xlsx&from=2026-01-01&to=2026-03-17
GET /api/reports/export?type=time&format=pdf&from=2026-01-01&to=2026-03-17
GET /api/reports/export?type=tickets&format=html&from=2026-01-01&to=2026-03-17
```

**Parameter für `/api/reports/export`:**

| Parameter | Werte | Beschreibung |
|-----------|-------|--------------|
| `type` | `tickets`, `sla`, `time`, `agents` | Berichtstyp |
| `format` | `csv`, `xlsx`, `pdf`, `html` | Exportformat |
| `from` | `YYYY-MM-DD` | Startdatum |
| `to` | `YYYY-MM-DD` | Enddatum |
