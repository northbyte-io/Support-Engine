/**
 * Design Tokens — Runtime Constants
 *
 * Use these in TypeScript/JavaScript contexts where CSS variables are not
 * accessible: canvas rendering (signature capture), Framer Motion animations,
 * programmatic layout calculations, and SVG/chart drawing.
 *
 * CSS variables (index.css) and Tailwind utilities (tailwind.config.ts) are
 * the source of truth for styling. These constants mirror the values defined
 * there — keep them in sync when changing the token system.
 */

/* ── Layout ────────────────────────────────────────────────────────────── */
export const LAYOUT = {
  SIDEBAR_WIDTH:     240,   /* expanded sidebar */
  SIDEBAR_COLLAPSED:  56,   /* icon-only sidebar */
  LIST_PANE:         280,   /* ticket list pane */
  META_PANEL:        300,   /* right meta panel */

  /* Responsive breakpoints (px) */
  BP_SM:   375,
  BP_MD:   768,
  BP_LG:  1024,
  BP_XL:  1280,
  BP_2XL: 1536,
} as const;

/* ── Z-index ────────────────────────────────────────────────────────────── */
export const Z = {
  BASE:     0,
  RAISED:  10,
  DROPDOWN: 100,
  STICKY:  200,
  SIDEBAR:  300,
  OVERLAY:  400,
  MODAL:    500,
  TOAST:    600,
  TOOLTIP:  700,
} as const;

/* ── Motion ─────────────────────────────────────────────────────────────── */
export const DURATION = {
  INSTANT:  50,
  FAST:    150,
  NORMAL:  200,
  SLOW:    350,
  SLOWER:  500,
} as const;

/** CSS cubic-bezier arrays for use with Framer Motion or the Web Animations API */
export const EASING = {
  DEFAULT: [0.4, 0, 0.2, 1] as const,
  IN:      [0.4, 0, 1,   1] as const,
  OUT:     [0,   0, 0.2, 1] as const,
  SPRING:  [0.34, 1.56, 0.64, 1] as const,
} as const;

/** Framer Motion transition presets */
export const TRANSITION = {
  fast:   { duration: DURATION.FAST   / 1000, ease: EASING.DEFAULT },
  normal: { duration: DURATION.NORMAL / 1000, ease: EASING.DEFAULT },
  slow:   { duration: DURATION.SLOW   / 1000, ease: EASING.DEFAULT },
  out:    { duration: DURATION.NORMAL / 1000, ease: EASING.OUT },
  spring: { duration: DURATION.SLOW   / 1000, ease: EASING.SPRING },
} as const;

/* ── Colors — dark theme (primary surface) ──────────────────────────────── */
/**
 * Hex values for contexts that cannot use CSS variables:
 * canvas drawImage, SVG fill attributes, charting libraries, signature canvas.
 *
 * These are the DARK mode values. The signature canvas always uses light
 * values regardless of theme — see SIGNATURE below.
 */
export const COLOR = {
  /* Backgrounds */
  BG_BASE:      "#0D0D0F",   /* page background */
  BG_ELEVATED:  "#141417",   /* panels, sidebar, cards */
  BG_OVERLAY:   "#1C1C20",   /* popovers, dropdowns */
  BG_HOVER:     "#212127",   /* hover states */
  BG_SELECTED:  "#1E1E3A",   /* selected rows (has indigo tint) */

  /* Borders */
  BORDER:       "#2A2A35",
  BORDER_FOCUS: "#6366F1",

  /* Text */
  TEXT_PRIMARY:   "#F4F4F6",
  TEXT_SECONDARY: "#9999AA",
  TEXT_MUTED:     "#55555F",

  /* Brand — Indigo */
  ACCENT:         "#6366F1",
  ACCENT_HOVER:   "#4F46E5",
  ACCENT_SUBTLE:  "#1E1E3A",

  /* Ticket status */
  STATUS_OPEN:    "#3B82F6",
  STATUS_ACTIVE:  "#8B5CF6",
  STATUS_WAITING: "#F59E0B",
  STATUS_DONE:    "#10B981",
  STATUS_CLOSED:  "#9999AA",

  /* SLA urgency */
  SLA_DANGER:  "#EF4444",
  SLA_WARNING: "#F59E0B",
  SLA_OK:      "#10B981",

  /* Semantic */
  SUCCESS:     "#10B981",
  WARNING:     "#F59E0B",
  ERROR:       "#EF4444",
  INFO:        "#3B82F6",
  BILLABLE:    "#10B981",
  DESTRUCTIVE: "#EF4444",

  /* Charts — lightened for dark backgrounds */
  CHART_1: "#7C7FF5",   /* indigo  */
  CHART_2: "#34D399",   /* emerald */
  CHART_3: "#60A5FA",   /* blue    */
  CHART_4: "#A78BFA",   /* violet  */
  CHART_5: "#F87171",   /* red     */
} as const;

/**
 * Signature capture canvas — always rendered in light/high-contrast mode,
 * even when the app is in dark mode. The technician hands the device to
 * the customer; maximum readability is required.
 */
export const SIGNATURE = {
  CANVAS_BG:   "#FFFFFF",
  INK_COLOR:   "#0D0D0F",
  BORDER:      "#D4D4DC",
  OVERLAY_BG:  "#FFFFFF",
  TEXT_PRIMARY:"#0D0D0F",
  TEXT_MUTED:  "#6B6B7A",
  BUTTON_BG:   "#6366F1",
  BUTTON_TEXT: "#FFFFFF",
} as const;

/* ── Spacing — 4px base, 8-point grid ────────────────────────────────────── */
export const SPACE = {
  PX:  1,
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,
} as const;

/* ── Component padding conventions (from design brief) ──────────────────── */
export const PAD = {
  LIST_ROW_Y:    SPACE[3],   /* 12px */
  LIST_ROW_X:    SPACE[4],   /* 16px */
  META_SECTION:  SPACE[4],   /* 16px */
  META_GAP:      SPACE[6],   /* 24px */
  COMMENT:       SPACE[4],   /* 16px */
  COMMENT_GAP:   SPACE[3],   /* 12px */
  MODAL:         SPACE[6],   /* 24px */
} as const;

/* ── Border radius ────────────────────────────────────────────────────────── */
export const RADIUS = {
  SM:   3,
  MD:   6,
  LG:   9,
  XL:   12,
  "2XL": 16,
  FULL: 9999,
} as const;

/* ── Type scale (px values for JS canvas/SVG text rendering) ─────────────── */
export const FONT_SIZE = {
  "2XS": 10,
  XS:    11,
  SM:    13,
  BASE:  15,
  LG:    18,
  XL:    22,
  "2XL": 28,
} as const;

export const LINE_HEIGHT = {
  "2XS": 1.4,
  XS:    1.4,
  SM:    1.5,
  BASE:  1.6,
  LG:    1.4,
  XL:    1.3,
  "2XL": 1.2,
} as const;

export const FONT_WEIGHT = {
  NORMAL:   400,
  MEDIUM:   500,
  SEMIBOLD: 600,
} as const;

export const FONT_FAMILY = {
  SANS: "'Inter', system-ui, -apple-system, sans-serif",
  MONO: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
} as const;

/* ── Utility: read a CSS custom property at runtime ─────────────────────── */
export function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/** Returns true when the dark theme is currently active */
export function isDarkMode(): boolean {
  if (typeof document === "undefined") return true; /* SSR: assume dark */
  return document.documentElement.classList.contains("dark");
}

/** Returns the appropriate value for the current theme */
export function themed<T>(dark: T, light: T): T {
  return isDarkMode() ? dark : light;
}
