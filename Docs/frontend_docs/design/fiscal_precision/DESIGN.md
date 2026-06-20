---
name: Fiscal Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style
The design system is engineered for high-stakes financial environments where clarity and reliability are paramount. It targets finance professionals, accountants, and operations managers who require a tool that prioritizes data integrity over decorative flair.

The aesthetic follows a **Corporate / Modern** direction with a focus on **Information Density**. It utilizes a systematic approach to whitespace and structural alignment to ensure that complex billing cycles and balance sheets remain legible. The emotional response should be one of "controlled efficiency"—a workspace that feels both authoritative and transparent.

## Colors
The palette is rooted in a professional "Deep Navy" (`#0F172A`) for primary branding and headers, providing a strong sense of stability. A "Slate Blue" (`#334155`) serves as the secondary color for icons and sub-navigation.

Financial indicators use a semantic logic:
- **Positive (Revenue/Profit):** Emerald Green (`#10B981`).
- **Caution (Pending/Due):** Amber (`#F59E0B`).
- **Critical (Overdue/Unpaid):** Rose (`#E11D48`).

The background uses a subtle off-white Neutral (`#F8FAFC`) to reduce eye strain during long working sessions, while pure white is reserved for content cards to create clear separation.

## Typography
**Inter** is the core typeface, selected for its exceptional legibility in data-heavy interfaces. 

A critical requirement for this design system is the use of **Tabular Figures** (`tnum`) for all numerical data, ensuring that decimals and digits align vertically in tables for easy comparison. 

- **Headlines:** Use Semi-Bold weights with slight negative letter-spacing for a modern, compact look.
- **Labels:** Small labels use uppercase with increased letter-spacing to distinguish them from interactive text.
- **Mobile Scaling:** Headlines above 32px should scale down by 20% on mobile devices to maintain layout integrity.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. The spacing rhythm is built on a **4px baseline**, allowing for high-density layouts without sacrificing touch-targets.

- **Desktop:** 24px margins, 24px gutters. Content is centered with a max-width of 1440px.
- **Density:** For data tables and forms, use `sm` (8px) and `md` (16px) padding to maximize the "above the fold" information.
- **Sidebar:** A fixed 280px sidebar navigation is standard for desktop views to provide persistent access to core modules.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**. Avoid heavy, dramatic shadows to keep the interface feeling precise.

- **Level 0 (Background):** Neutral light gray (`#F8FAFC`).
- **Level 1 (Cards/Surface):** Pure White (`#FFFFFF`) with a 1px border (`#E2E8F0`).
- **Level 2 (Dropdowns/Modals):** Pure White with a subtle, diffused shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.08)`.
- **Interactive States:** Use a soft inner-shadow or 2px border for focused input fields to indicate active data entry.

## Shapes
The design system employs a **Soft** shape language to balance the "sharpness" of the data. 

- **Standard Components:** 4px (0.25rem) radius for buttons, input fields, and small cards.
- **Status Badges:** Pill-shaped (fully rounded) to differentiate "status" information from "action" buttons.
- **Container Level:** Large dashboard cards may use up to 8px (0.5rem) radius to soften the overall layout.

## Components
Consistent component behavior ensures predictability in high-volume tasks:

- **Data Tables:** High-density with 12px vertical cell padding. Headers use `label-md` style. Rows include a subtle hover state (`#F1F5F9`) to help track data horizontally.
- **Buttons:** 
  - *Primary:* Solid Deep Navy with white text.
  - *Secondary:* White background with Slate Blue border and text.
  - *Success/Danger:* Used only for final confirmations (e.g., "Approve Payment" or "Delete Invoice").
- **Status Badges:** Small, pill-shaped markers. Use a "subtle" background (10% opacity of the semantic color) with high-contrast text for accessibility.
- **Form Fields:** Labels are always top-aligned. Required fields are marked with a subtle dot rather than an asterisk. Placeholder text uses a light slate to distinguish it from entered data.
- **Sidebar Navigation:** Icon-led with 20px icons. Active states use a 4px vertical "accent bar" in the primary color on the left edge.
- **Financial Summary Cards:** Use `headline-lg` for the primary monetary value, ensuring it is the most prominent element in the view.