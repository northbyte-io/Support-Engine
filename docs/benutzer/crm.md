# CRM - Kundenverwaltung

Das CRM-Modul verwaltet Kunden, Kontakte, Organisationen und Assets.

## Organisationen

Organisationen repräsentieren Unternehmen oder Abteilungen.

### Organisation anlegen

1. Navigieren Sie zu **CRM > Organisationen**
2. Klicken Sie auf **"Neue Organisation"**
3. Füllen Sie die Felder aus:
   - **Name**: Firmenname
   - **Adresse**: Standort
   - **Branche**: Branchenzuordnung
   - **Notizen**: Zusätzliche Informationen

## Kunden

Kunden sind die Hauptkontakte einer Organisation.

### Kunde anlegen

1. Gehen Sie zu **CRM > Kunden**
2. Klicken Sie auf **"Neuer Kunde"**
3. Pflichtfelder:
   - **Vor- und Nachname**
   - **E-Mail-Adresse**
   - **Organisation** (optional)

## Kontakte

Kontakte sind zusätzliche Ansprechpartner.

| Feld | Beschreibung |
|------|--------------|
| **Name** | Vor- und Nachname |
| **E-Mail** | Kontakt-E-Mail |
| **Telefon** | Telefonnummer |
| **Position** | Rolle im Unternehmen |
| **Organisation** | Zugehöriges Unternehmen |

## Assets

Assets sind Geräte, Software oder Verträge.

### Asset-Typen

| Typ | Beispiele |
|-----|-----------|
| **Hardware** | Computer, Drucker, Server |
| **Software** | Lizenzen, Anwendungen |
| **Lizenzen** | Softwarelizenzen |
| **Verträge** | Wartungsverträge, SLAs |

### Asset anlegen

1. Navigieren Sie zu **CRM > Assets**
2. Klicken Sie auf **"Neues Asset"**
3. Geben Sie die Details ein:
   - **Name**: Bezeichnung
   - **Typ**: Hardware/Software/etc.
   - **Seriennummer**: Bei Hardware
   - **Kunde**: Zuordnung

## Verknüpfungen

### Ticket-Verknüpfung

Beim Erstellen eines Tickets können Sie:

- **Kunde** zuordnen
- **Kontakt** hinzufügen
- **Asset** verknüpfen

Diese Verknüpfungen ermöglichen:

- Schnellen Zugriff auf Kundenhistorie
- Übersicht betroffener Geräte
- Reporting pro Kunde/Asset
