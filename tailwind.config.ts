import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindTypography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      /* ── Border radius ─────────────────────────────────────────────────── */
      borderRadius: {
        sm:   "var(--radius-sm)",   /* 3px  */
        md:   "var(--radius-md)",   /* 6px  */
        DEFAULT: "var(--radius)",   /* 6px  */
        lg:   "var(--radius-lg)",   /* 9px  */
        xl:   "var(--radius-xl)",   /* 12px */
        "2xl":"var(--radius-2xl)",  /* 16px */
        full: "var(--radius-full)", /* pill */
      },

      /* ── Font families ─────────────────────────────────────────────────── */
      fontFamily: {
        sans:    ["var(--font-sans)"],
        display: ["var(--font-display)"],  /* alias → Inter, no separate display */
        serif:   ["var(--font-serif)"],
        mono:    ["var(--font-mono)"],
      },

      /* ── Type scale — dense UI, px-anchored via CSS vars ───────────────── */
      fontSize: {
        /* Named for the design system — use these in new components */
        "2xs":    ["var(--text-2xs)",  { lineHeight: "var(--leading-2xs)" }],  /* 10px */
        "ui-xs":  ["var(--text-xs)",   { lineHeight: "var(--leading-xs)" }],   /* 11px */
        "ui-sm":  ["var(--text-sm)",   { lineHeight: "var(--leading-sm)" }],   /* 13px */
        "ui-base":["var(--text-base)", { lineHeight: "var(--leading-base)" }], /* 15px */
        "ui-lg":  ["var(--text-lg)",   { lineHeight: "var(--leading-lg)" }],   /* 18px */
        "ui-xl":  ["var(--text-xl)",   { lineHeight: "var(--leading-xl)" }],   /* 22px */
        "ui-2xl": ["var(--text-2xl)",  { lineHeight: "var(--leading-2xl)" }],  /* 28px */
      },

      /* ── Font weights ──────────────────────────────────────────────────── */
      fontWeight: {
        normal:   "var(--weight-normal)",
        medium:   "var(--weight-medium)",
        semibold: "var(--weight-semibold)",
        /* 700 intentionally excluded — too heavy for Precision Dark aesthetic */
      },

      /* ── Letter spacing ────────────────────────────────────────────────── */
      letterSpacing: {
        tighter: "var(--tracking-tighter)",
        tight:   "var(--tracking-tight)",
        normal:  "var(--tracking-normal)",
        wide:    "var(--tracking-wide)",
        wider:   "var(--tracking-wider)",
      },

      /* ── Colors — all reference CSS custom properties ──────────────────── */
      colors: {
        /* ── shadcn/ui core tokens (backward-compatible) ─────────────────── */
        background: "hsl(var(--background) / <alpha-value>)",
        foreground:  "hsl(var(--foreground) / <alpha-value>)",
        border:      "hsl(var(--border) / <alpha-value>)",
        input:       "hsl(var(--input) / <alpha-value>)",
        ring:        "hsl(var(--ring) / <alpha-value>)",

        card: {
          DEFAULT:    "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border:     "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border:     "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border:     "var(--primary-border)",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border:     "var(--secondary-border)",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border:     "var(--muted-border)",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border:     "var(--accent-border)",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border:     "var(--destructive-border)",
        },

        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },

        sidebar: {
          DEFAULT:    "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border:     "hsl(var(--sidebar-border) / <alpha-value>)",
          ring:       "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT:    "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border:     "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT:    "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border:     "var(--sidebar-accent-border)",
        },

        /* ── Indigo accent variants ────────────────────────────────────────── */
        indigo: {
          DEFAULT: "hsl(var(--accent-primary) / <alpha-value>)",
          hover:   "hsl(var(--accent-hover) / <alpha-value>)",
          subtle:  "hsl(var(--accent-subtle) / <alpha-value>)",
        },

        /* ── SLA urgency states ────────────────────────────────────────────── */
        sla: {
          danger:  "hsl(var(--sla-danger) / <alpha-value>)",
          warning: "hsl(var(--sla-warning) / <alpha-value>)",
          ok:      "hsl(var(--sla-ok) / <alpha-value>)",
        },

        /* ── Ticket status colors ──────────────────────────────────────────── */
        status: {
          open:    "hsl(var(--status-open) / <alpha-value>)",
          active:  "hsl(var(--status-active) / <alpha-value>)",
          waiting: "hsl(var(--status-waiting) / <alpha-value>)",
          done:    "hsl(var(--status-done) / <alpha-value>)",
          closed:  "hsl(var(--status-closed) / <alpha-value>)",
          /* Online presence (sidebar user indicator) */
          online:  "hsl(160 84% 39% / <alpha-value>)",
          away:    "hsl(38 92% 50% / <alpha-value>)",
          busy:    "hsl(0 84% 60% / <alpha-value>)",
          offline: "hsl(240 8% 63% / <alpha-value>)",
        },

        /* ── Semantic aliases ─────────────────────────────────────────────── */
        success:  "hsl(var(--success) / <alpha-value>)",
        warning:  "hsl(var(--warning) / <alpha-value>)",
        error:    "hsl(var(--error) / <alpha-value>)",
        info:     "hsl(var(--info) / <alpha-value>)",
        billable: "hsl(var(--billable) / <alpha-value>)",
      },

      /* ── Layout widths — three-pane workspace ──────────────────────────── */
      width: {
        "sidebar":           "var(--layout-sidebar-width)",      /* 240px */
        "sidebar-collapsed": "var(--layout-sidebar-collapsed)",  /* 56px  */
        "list-pane":         "var(--layout-list-pane)",          /* 280px */
        "meta-panel":        "var(--layout-meta-panel)",         /* 300px */
      },
      minWidth: {
        "sidebar":           "var(--layout-sidebar-width)",
        "sidebar-collapsed": "var(--layout-sidebar-collapsed)",
        "list-pane":         "var(--layout-list-pane)",
        "meta-panel":        "var(--layout-meta-panel)",
      },
      maxWidth: {
        "content": "var(--layout-content-max)",   /* 65ch — reading width */
        "page":    "var(--layout-page-max)",       /* 1440px */
      },

      /* ── Z-index scale ─────────────────────────────────────────────────── */
      zIndex: {
        base:     "0",
        raised:   "10",
        dropdown: "100",
        sticky:   "200",
        sidebar:  "300",
        overlay:  "400",
        modal:    "500",
        toast:    "600",
        tooltip:  "700",
      },

      /* ── Spacing additions ─────────────────────────────────────────────── */
      spacing: {
        "0.5": "0.125rem",   /* 2px  */
        "1.5": "0.375rem",   /* 6px  */
        "2.5": "0.625rem",   /* 10px */
        "3.5": "0.875rem",   /* 14px */
        "4.5": "1.125rem",   /* 18px */
        "13":  "3.25rem",    /* 52px */
        "15":  "3.75rem",    /* 60px */
        "17":  "4.25rem",    /* 68px — sidebar collapsed width + overflow */
        "18":  "4.5rem",     /* 72px */
        "70":  "17.5rem",    /* 280px — list pane */
        "75":  "18.75rem",   /* 300px — meta panel */
        "60":  "15rem",      /* 240px — sidebar */
        "14":  "3.5rem",     /* 56px — sidebar collapsed */
      },

      /* ── Transition durations ─────────────────────────────────────────── */
      transitionDuration: {
        instant: "50ms",
        fast:    "150ms",
        normal:  "200ms",
        slow:    "350ms",
        slower:  "500ms",
      },

      /* ── Transition timing functions ──────────────────────────────────── */
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-in":     "cubic-bezier(0.4, 0, 1, 1)",
        "ease-out":    "cubic-bezier(0, 0, 0.2, 1)",
        "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      /* ── Keyframe animations ──────────────────────────────────────────── */
      keyframes: {
        /* shadcn accordion — keep intact */
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        /* Three-pane panel transitions */
        "slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        "slide-out-left": {
          from: { transform: "translateX(0)",     opacity: "1" },
          to:   { transform: "translateX(-100%)", opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)",    opacity: "1" },
          to:   { transform: "translateX(100%)", opacity: "0" },
        },
        /* Detail pane content fade on ticket selection */
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        /* SLA countdown pulse */
        "pulse-danger": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        /* Skeleton shimmer */
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "slide-in-left":   "slide-in-left 200ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-out-left":  "slide-out-left 150ms cubic-bezier(0.4, 0, 1, 1)",
        "slide-in-right":  "slide-in-right 200ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-out-right": "slide-out-right 150ms cubic-bezier(0.4, 0, 1, 1)",
        "fade-in":         "fade-in 150ms cubic-bezier(0, 0, 0.2, 1)",
        "pulse-danger":    "pulse-danger 1.5s ease-in-out infinite",
        "shimmer":         "shimmer 1.5s linear infinite",
      },

      /* ── Box shadows (references CSS vars — respects dark mode) ────────── */
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs:    "var(--shadow-xs)",
        sm:    "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md:    "var(--shadow-md)",
        lg:    "var(--shadow-lg)",
        xl:    "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        focus: "var(--focus-ring)",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindTypography],
} satisfies Config;
