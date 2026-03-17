# 🎨 v0.1.3 - Big Redesign

Diese Version bringt ein vollständig überarbeitetes visuelles Design der gesamten Anwendung — neues Farbsystem, neue Typografie, neue Navigationsstruktur und ein modernisiertes Layout für alle 26 Seiten.

---

## 📋 Übersicht

Support-Engine v0.1.3 führt ein kohärentes Design-System auf Basis von Amber als Primärfarbe ein. Das dunkle Theme wechselt zu einem tiefen Navy-Blau, das helle Theme zu einem warmen Off-White. Die Typografie wird durch drei dedizierte Schriftfamilien (Syne, DM Sans, JetBrains Mono) strukturiert. Die gesamte Anwendung — von der Login-Seite bis zum Admin-Bereich — wurde visuell vereinheitlicht.

---

## ✨ Neue Funktionen

### 🎨 Design-System
- Neues Farbschema: Amber als globale Primärfarbe, tiefes Navy (`#080C16`) als Dunkel-Hintergrund, warmes Off-White für den Hell-Modus
- Vollständiges CSS-Custom-Properties-System für beide Themes (Dark & Light) über Tailwind-CSS-Variablen
- Drei Schriftfamilien: **Syne** (Display/Überschriften), **DM Sans** (Fließtext), **JetBrains Mono** (Code, Nummern, IDs)
- Tailwind-Konfiguration um `fontFamily.display` erweitert

### 🖼️ Neue AuthPageShell
- Split-Panel-Layout: linkes Markenpanel (versteckt auf Mobilgeräten) + rechtes Formular-Panel
- Linkes Panel mit Rasterstruktur-Hintergrund, Amber-Glow-Effekt, Feature-Liste und Navigationslinks
- Kompakte Mobile-Navigation mit Logo im Header

### 🗂️ Überarbeitete Seitenleiste
- Drei Navigationsgruppen: **Übersicht** (Dashboard, Tickets, Zeiterfassung, Wissensdatenbank), **Ressourcen** (Kunden, Kontakte, Organisationen, Assets, Projekte, Bereiche), **Administration** (nur für Admins: Benutzer, Umfragen, Exchange, TLS-Zertifikate, Logs, Einstellungen)
- AGPL-3.0-Lizenzhinweis in den Sidebar-Footer integriert (anstatt gesonderte Fußzeile)
- Avatar-Initialen in Amber-Primärfarbe

### 🏷️ Neue Badge-Komponenten
- `StatusBadge`: Eigene `<span>`-Komponente mit semantischen Farbklassen (sky=offen, amber=in Bearbeitung, violet=wartend, emerald=gelöst, slate=geschlossen)
- `PriorityBadge` + `PriorityDot`: Eigene Komponenten (slate=niedrig, sky=mittel, orange=hoch, rot=dringend) — shadcn `<Badge>` nicht mehr verwendet

---

## 🔧 Verbesserungen

### 🎨 Visuelle Vereinheitlichung
- Alle 26 Seiten: Hardcodierte `bg-blue-*`/`text-blue-*`/`bg-gray-*`/`text-gray-*`-Klassen durch semantische Design-Tokens ersetzt (`bg-primary/10`, `text-primary`, `bg-muted`, `text-muted-foreground`)
- Statistik-Werte auf dem Dashboard verwenden `font-mono tabular-nums`
- Alle Seitenüberschriften (`<h1>`, `<h2>`) verwenden `font-display` (Syne)
- Standard-Projektfarbe von Blau (`#3B82F6`) auf Amber (`#F59E0B`) geändert

### 🏗️ Layout
- `MainLayout`: Sticky Topbar mit `backdrop-blur`, separate AGPL-Fußzeile entfernt
- Kundenportal: `font-display` auf Willkommensüberschrift
- 404-Seite: Semantische Farbklassen statt `bg-gray-50`/`text-gray-900`

### 🔒 Branding-Vereinfachung
- `BrandingProvider`: Dynamische CSS-Farb-Overrides (`--primary`, `--secondary`, `--accent`, `--font-family`) entfernt — Amber ist die globale Primärfarbe ohne Mandanten-Override
- Branding steuert weiterhin: Favicon, Custom CSS, Logo und Mandantenname

---

## 🛠️ Technische Änderungen

| Bereich | Änderung |
|---------|----------|
| Design-System | Neues CSS-Custom-Properties-System für Farben und Schriften |
| Typografie | Syne (Display), DM Sans (Sans), JetBrains Mono (Mono) |
| Tailwind | `fontFamily.display` hinzugefügt |
| Google Fonts | Bereinigt: nur Syne, DM Sans, JetBrains Mono, Inter geladen |
| Branding | Farb-Overrides aus `BrandingProvider` entfernt |
| Komponenten | `StatusBadge`, `PriorityBadge`, `PriorityDot` neu implementiert |
| Sicherheit | Backend Rate-Limiter: Proxy-Trust-Konfiguration korrigiert |

---

## 📝 Änderungsprotokoll

### ➕ Hinzugefügt
- Neues Design-System (Amber/Navy/Off-White) mit CSS-Custom-Properties
- Drei Schriftfamilien via Google Fonts (Syne, DM Sans, JetBrains Mono)
- `font-display`-Konfiguration in Tailwind
- Neue `AuthPageShell`-Split-Panel-Komponente
- Neue `StatusBadge`- und `PriorityBadge`/`PriorityDot`-Komponenten

### 🔧 Verbessert
- Alle 26 Seiten auf semantische Design-Tokens migriert
- Seitenleiste mit drei Navigationsgruppen und integriertem AGPL-Footer
- Sticky-Topbar mit Blur-Effekt in `MainLayout`
- Statistik-Zahlen mit `font-mono tabular-nums`

### 🐛 Behoben
- Hardcodierte Blau-Klassen in Dashboard, Logs, Benutzer, Kunden, Kontakte, Exchange-Integration
- Standard-Projektfarbe von Blau auf Amber korrigiert
- Rate-Limiter-Warnung durch korrekte Proxy-Trust-Konfiguration behoben

---

## 📦 Upgrade-Anleitung

Von v0.1.2 auf v0.1.3:

1. Repository aktualisieren:
   ```bash
   git pull origin main
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Anwendung neu starten:
   ```bash
   npm run dev
   ```

> **Hinweis**: Mandanten, die bisher über `customColors` im Branding dynamische Primärfarben gesetzt haben, werden ab v0.1.3 mit der globalen Amber-Primärfarbe dargestellt. Individuelle Anpassungen sind weiterhin über `customCss` möglich.

---

🔗 **Repository**: https://github.com/northbyte-io/Support-Engine
🏷️ **Version**: 0.1.3
📅 **Veröffentlichungsdatum**: März 2026
