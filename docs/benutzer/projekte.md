# Projekte & Kanban-Board

Projekte ermöglichen die Organisation von Tickets in einem visuellen Kanban-Board. Ideal für strukturierte Aufgabenpakete, Entwicklungssprint und interne Projekte.

## Projekt erstellen

**Navigation:** Ressourcen → Projekte → Neues Projekt (nur Admin)

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| Name | ✓ | Projektname |
| Kürzel | ✓ | 2–10 Zeichen, wird groß geschrieben (z.B. `WEB`, `IT`) |
| Beschreibung | – | Kurze Projektbeschreibung |
| Farbe | – | Projektfarbe (Standard: Amber #F59E0B) |

Das Kürzel wird automatisch in Großbuchstaben umgewandelt und ist unveränderlich nach der Erstellung.

## Projektübersicht

**Navigation:** Ressourcen → Projekte

Die Übersicht zeigt alle Projekte als Karten mit:
- Projektfarbe und Kürzel
- Anzahl der Tickets
- Anzahl der Mitglieder
- Projektstatus

### Projektstatus

| Status | Bedeutung |
|--------|----------|
| `aktiv` | In Bearbeitung |
| `pausiert` | Vorübergehend gestoppt |
| `abgeschlossen` | Fertiggestellt |
| `archiviert` | Abgeschlossen und archiviert |

## Kanban-Board

Klick auf ein Projekt öffnet das Kanban-Board.

Das Board zeigt Tickets als Karten in konfigurierbaren Spalten. Spalten repräsentieren Phasen des Arbeitsablaufs.

### Spalten konfigurieren

**Navigation:** Projekt → Board → Spalten verwalten (Admin)

Standard-Spalten: Offen → In Bearbeitung → Review → Fertig

Admins können:
- Neue Spalten anlegen
- Spalten umbenennen
- Reihenfolge per Drag-and-Drop ändern
- Spalten löschen (Tickets bleiben erhalten)

### Tickets im Board

Tickets werden per **Drag-and-Drop** zwischen Spalten verschoben. Die Position wird automatisch gespeichert.

Eine Ticket-Karte zeigt:
- Ticket-Betreff
- Priorität (farbkodiert)
- Zugewiesener Agent (Avatar)
- SLA-Status (falls konfiguriert)

## Tickets einem Projekt zuweisen

Im Ticket-Formular oder Ticket-Detail → **Projekte** → Projekt auswählen.

Ein Ticket kann mehreren Projekten zugewiesen sein.

## Projektmitglieder

**Navigation:** Projekt → Mitglieder (Admin)

Projektmitglieder sind Agenten, die Zugriff auf das Projekt haben. Hinzufügen oder Entfernen von Mitgliedern über die Mitgliederverwaltung.

## Projekt löschen

Projekte können nur von Admins gelöscht werden. Verknüpfte Tickets bleiben erhalten, die Projektzuordnung wird entfernt.
