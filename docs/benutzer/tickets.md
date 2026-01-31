# Ticket-Management

Das Ticket-System ist das Herzstück von Support-Engine. Hier erfahren Sie, wie Sie Tickets effektiv erstellen und verwalten.

## Ticket erstellen

### Über die Oberfläche

1. Klicken Sie auf **"Neues Ticket"** in der Seitenleiste
2. Füllen Sie die Pflichtfelder aus:
   - **Titel**: Kurze, prägnante Beschreibung
   - **Beschreibung**: Detaillierte Problembeschreibung
   - **Priorität**: Niedrig, Mittel, Hoch oder Dringend
   - **Tickettyp**: Auswahl des passenden Typs

3. Optionale Felder:
   - **Kunde**: Verknüpfung mit CRM-Kontakt
   - **Asset**: Betroffenes Gerät/Software
   - **Anhänge**: Dateien hochladen

4. Klicken Sie auf **"Erstellen"**

### Ticket-Status

Tickets durchlaufen einen definierten Workflow:

```
📥 Offen → 🔄 In Bearbeitung → ⏳ Wartend → ✅ Gelöst → 🔒 Geschlossen
```

| Status | Bedeutung |
|--------|-----------|
| **Offen** | Neues Ticket, noch nicht zugewiesen |
| **In Bearbeitung** | Agent arbeitet aktiv am Ticket |
| **Wartend** | Wartet auf Kundenrückmeldung |
| **Gelöst** | Problem wurde behoben |
| **Geschlossen** | Ticket ist abgeschlossen |

## Ticket-Details

Auf der Ticket-Detailseite finden Sie:

- **Übersicht**: Alle Ticket-Informationen
- **Kommentare**: Kommunikationsverlauf
- **Anhänge**: Hochgeladene Dateien
- **Zeiterfassung**: Gebuchte Arbeitszeit
- **Aktivitäten**: Änderungshistorie

### Kommentare

Es gibt zwei Arten von Kommentaren:

| Typ | Sichtbarkeit |
|-----|--------------|
| **Öffentlich** | Für Kunden sichtbar |
| **Intern** | Nur für Agents sichtbar |

## Ticketsuche und Filter

### Schnellsuche

Nutzen Sie die Suchleiste für:
- Ticketnummer (z.B. "TKT-12345")
- Schlüsselwörter im Titel
- Kundennamen

### Filter

Filtern Sie Tickets nach:
- Status
- Priorität
- Zugewiesener Agent
- Ersteller
- Zeitraum

## Prioritätsstufen

| Priorität | SLA-Reaktionszeit | Beschreibung |
|-----------|-------------------|--------------|
| **Niedrig** | 24 Stunden | Geringe Auswirkung |
| **Mittel** | 8 Stunden | Normale Anfragen |
| **Hoch** | 4 Stunden | Wichtige Probleme |
| **Dringend** | 1 Stunde | Kritische Ausfälle |
