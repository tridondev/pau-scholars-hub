import type { Config } from "tailwindcss";

// PAU Scholars Hub design tokens
// Colors derived from the African Union emblem and Pan African University logo.
// Structure: each role has a full 50-900 ramp so light/dark mode and
// hover/active states never need one-off hex values in components.

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — from the AU emblem's deep green. Nav, primary actions,
        // brand presence. This is the color people should associate with
        // the platform at a glance.
        primary: {
          50: "#EAF3EE",
          100: "#C7E0D2",
          200: "#9BCAAF",
          300: "#5FA97D",
          400: "#2E8C58",
          500: "#1B7A3D",
          600: "#146030",
          700: "#0F4A25",
          800: "#0A331A",
          900: "#061F10",
        },
        // Secondary — the brighter PAU logo green. Links, active tabs,
        // interactive elements, secondary CTAs.
        secondary: {
          50: "#EEF7EF",
          100: "#CFEAD2",
          200: "#A8D9AE",
          300: "#7BC584",
          400: "#5AB763",
          500: "#4CAF50",
          600: "#3D8E41",
          700: "#2F6D32",
          800: "#204B22",
          900: "#122A13",
        },
        // Gold/heritage — from the AU emblem's tan and the PAU dots.
        // Reserved for prestige signals: published status, editorial
        // badges, DOI confirmation, awards. Do not use as a general
        // accent — overuse cheapens the "distinction" signal.
        gold: {
          50: "#FBF6EC",
          100: "#F3E5C4",
          200: "#EAD199",
          300: "#DFBA6C",
          400: "#CBA050",
          500: "#B08D4F",
          600: "#8F7140",
          700: "#6E5731",
          800: "#4C3C22",
          900: "#2B2213",
        },
        // Alert/urgency — from the PAU logo's red accent. Deadlines,
        // overdue reviews, validation errors only. Never decorative.
        alert: {
          50: "#FCEBEB",
          100: "#F7C1C1",
          200: "#F09595",
          300: "#E76B6B",
          400: "#DE4B4B",
          500: "#D32F2F",
          600: "#A32D2D",
          700: "#791F1F",
          800: "#501313",
          900: "#2C0A0A",
        },
        // Neutrals for surfaces and text — warm-tinted to sit comfortably
        // next to the green/gold palette instead of a cold gray.
        surface: {
          0: "#FAFAF7",
          1: "#F1EFE8",
          2: "#FFFFFF",
        },
        ink: {
          primary: "#211F1A",
          secondary: "#5F5E5A",
          muted: "#888780",
        },
        // Masthead — near-black green used for the nav/footer "cover"
        // treatment, distinct from the mid-tone primary greens.
        masthead: {
          DEFAULT: "#0E2116",
          light: "#16301F",
        },
      },
      fontFamily: {
        // Editorial serif for headlines — carries the "scholarly journal"
        // personality. Body stays a clean grotesque for legibility across
        // languages. Mono marks anything that is *data*: DOIs, dates,
        // institute codes, counts.
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      backgroundImage: {
        "masthead-gradient":
          "radial-gradient(ellipse at top left, rgba(176,141,79,0.18), transparent 55%), linear-gradient(180deg, #0E2116 0%, #0A1811 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
