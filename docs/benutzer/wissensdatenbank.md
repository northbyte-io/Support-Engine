# Wissensdatenbank

Die Wissensdatenbank (KB) dient als zentrale Sammlung von Lösungen, Anleitungen und häufig gestellten Fragen. Artikel können direkt mit Tickets verknüpft werden.

## Kategorien

Artikel sind in Kategorien organisiert. Kategorien können hierarchisch aufgebaut werden (Unterkategorien).

**Kategorie erstellen:**
- Navigation: Wissensdatenbank → Neue Kategorie
- Felder: Name, Beschreibung, übergeordnete Kategorie (optional)
- Berechtigung: Agent und höher

## Artikel erstellen

**Navigation:** Wissensdatenbank → Neuer Artikel

| Feld | Pflicht | Beschreibung |
|------|---------|-------------|
| Titel | ✓ | Artikelüberschrift |
| Inhalt | ✓ | Vollständiger Text (TipTap Rich-Text-Editor) |
| Kategorie | ✓ | Zugehörige Kategorie |
| Tags | – | Schlagworte für bessere Auffindbarkeit |
| Status | ✓ | Entwurf oder Veröffentlicht |

### Rich-Text-Editor

Der TipTap-Editor unterstützt:
- Überschriften, Absätze, Listen
- Code-Blöcke (mit Syntax-Highlighting)
- Bilder (mit XSS-Schutz durch DOMPurify)
- Links und Tabellen

## Veröffentlichung

Artikel mit Status **Entwurf** sind nur für Agenten sichtbar. Artikel mit Status **Veröffentlicht** sind auch für Kunden im Portal zugänglich.

## Versionshistorie

Jede Bearbeitung eines Artikels erzeugt einen neuen Versionseintrag. Die Versionshistorie zeigt:
- Datum und Uhrzeit der Änderung
- Bearbeitender Benutzer
- Vorherigen Inhalt (für Vergleiche)

## Artikel mit Tickets verknüpfen

Im Ticket-Detail können passende KB-Artikel gesucht und verknüpft werden:

1. Im Ticket: **Wissensdatenbank** → Artikel suchen
2. Artikel aus der Suche auswählen
3. Verknüpfung wird im Ticket angezeigt

Kunden im Portal sehen verknüpfte Artikel als Selbsthilfe-Ressourcen.

## Suche

Die globale Suche (`/api/search`) durchsucht auch KB-Artikel nach Titel, Inhalt und Tags.

## Artikel löschen

Soft-Delete: Artikel bleiben in der Datenbank, werden aber aus der Ansicht entfernt. Hard-Delete nur durch Admins.
