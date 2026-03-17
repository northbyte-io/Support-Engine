# CRM — Kundenverwaltung

Das CRM-Modul (Customer Relationship Management) verwaltet Organisationen, Kunden und Kontakte. CRM-Einträge können mit Tickets verknüpft werden, um den vollständigen Kontext einer Anfrage zu erfassen.

## Struktur

```
Organisation (z.B. Firma GmbH)
    └── Kunde (z.B. Max Mustermann)
            └── Kontakt (z.B. Ansprechpartner Technik)
            └── Standort (z.B. Hauptsitz München)
```

## Organisationen

**Navigation:** Ressourcen → Organisationen

Eine Organisation repräsentiert ein Unternehmen oder eine Institution.

| Feld | Beschreibung |
|------|-------------|
| Name | Firmenname |
| Branche | Industriesektor |
| Website | URL |
| Telefon | Haupttelefonnummer |
| Adresse | Firmenadresse |
| Notizen | Interne Anmerkungen |

## Kunden

**Navigation:** Ressourcen → Kunden

Kunden sind individuelle Personen oder Accounts, die einer Organisation angehören können.

| Feld | Beschreibung |
|------|-------------|
| Name | Anzeigename des Kunden |
| E-Mail | Eindeutige Kontaktadresse |
| Telefon | Telefonnummer |
| Organisation | Zugehörige Organisation (optional) |
| Typ | Privatperson / Unternehmen |
| Status | Aktiv / Inaktiv |

### Kunden-Detail

Die Detailseite eines Kunden zeigt:
- Alle verknüpften Tickets
- Aktivitätsprotokoll
- Kontakte und Standorte
- Zeiterfassung für diesen Kunden

## Kontakte

**Navigation:** Ressourcen → Kontakte

Kontakte sind Ansprechpartner innerhalb einer Organisation oder bei einem Kunden.

| Feld | Beschreibung |
|------|-------------|
| Name | Vor- und Nachname |
| E-Mail | Geschäftliche E-Mail |
| Telefon | Direkte Durchwahl |
| Position | Jobbezeichnung |
| Abteilung | Zugehörige Abteilung |
| Kunde / Organisation | Zuordnung |

## Tickets verknüpfen

Im Ticket-Formular können Kunde und Kontakt direkt zugewiesen werden. Die Verknüpfung ermöglicht:

- Tickets eines Kunden auf einen Blick
- Automatische Benachrichtigung des Kontakts bei Statusänderungen (sofern konfiguriert)
- Vollständiger Kontext im Ticket

## Aktivitätsprotokoll

Jeder Kundenkontakt kann protokolliert werden:
- Anruf, E-Mail, Meeting
- Datum und Dauer
- Notizen zum Gespräch

Das Protokoll ist im Kunden-Detail unter **Aktivitäten** einsehbar.

## Standorte

Kunden können mehrere Standorte haben (z.B. Haupt- und Zweigstellen):

- Adresse (Straße, PLZ, Ort, Land)
- Standortbezeichnung (z.B. „Hauptsitz", „Filiale Nord")

Standorte können bei der Ticket-Erstellung als Kontext angegeben werden.
