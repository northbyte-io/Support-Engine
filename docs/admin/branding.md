# Branding & Erscheinungsbild

Support-Engine unterstützt mandantenspezifisches Branding. Admins können Logo, Farben und Custom CSS anpassen, ohne den Quellcode zu ändern.

## Konfiguration

**Navigation:** Administration → Einstellungen → Erscheinungsbild

Die folgenden Felder sind konfigurierbar:

| Feld | Beschreibung |
|------|-------------|
| Name | Anzeigename des Mandanten (erscheint in Seitenleiste) |
| Logo-URL | Link zum Mandantenlogo (PNG, SVG empfohlen) |
| Favicon-URL | Browser-Tab-Icon |
| Custom CSS | Eigene CSS-Stile (werden in `<style>`-Tag eingebunden) |

## Logo einbinden

Das Logo erscheint in der Seitenleiste und auf der Login-Seite. Empfohlene Spezifikationen:

- Format: SVG oder PNG mit transparentem Hintergrund
- Breite: 160px (wird skaliert)
- Empfohlen: Dark-Mode-taugliches Logo (helles Logo auf dunklem Hintergrund)

Beispiel:
```
Logo-URL: https://cdn.firma.de/logo-hell.svg
```

## Custom CSS

Mit Custom CSS können alle visuellen Aspekte der Anwendung überschrieben werden. Das CSS wird nach den Standard-Stilen eingebunden.

**Beispiel: Primärfarbe anpassen**

```css
:root {
  --primary: 221 83% 53%;  /* HSL-Format für Tailwind-Kompatibilität */
  --primary-foreground: 0 0% 100%;
}
```

**Beispiel: Schriftart ändern**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

:::{warning}
Custom CSS wird ungefiltert eingebunden. Stellen Sie sicher, dass nur vertrauenswürdige Admins Zugriff auf diese Einstellung haben.
:::

## Design-System

Support-Engine verwendet ab v0.1.3 Amber als globale Primärfarbe. Das vollständige Design-System basiert auf CSS Custom Properties:

| Variable | Standardwert | Bedeutung |
|----------|-------------|-----------|
| `--primary` | Amber (#F59E0B) | Primärfarbe (Buttons, Links, Highlights) |
| `--background` | Navy (#080C16, dark) | Seitenhintergrund |
| `--foreground` | Off-White (light) | Textfarbe |
| `--muted` | Gedämpfter Hintergrund | Sekundäre Flächen |
| `--card` | Kartenfarbe | Karten-Hintergrund |

## Öffentliche Branding-API

Die Branding-Einstellungen werden auch auf der Login-Seite verwendet, bevor ein Benutzer angemeldet ist. Sie sind über einen öffentlichen Endpunkt abrufbar:

```text
GET /api/tenant/public/:slug
```

Der Slug des Mandanten wird bei der Registrierung festgelegt.
