---
name: Atelier Gallery
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#080808'
  on-primary: '#ffffff'
  primary-container: '#202020'
  on-primary-container: '#898787'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#080908'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f211f'
  on-tertiary-container: '#878886'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1c1c'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e3e3df'
  tertiary-fixed-dim: '#c6c7c4'
  on-tertiary-fixed: '#1a1c1a'
  on-tertiary-fixed-variant: '#464745'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display-hero:
    fontFamily: EB Garamond
    fontSize: 80px
    fontWeight: '500'
    lineHeight: 88px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: EB Garamond
    fontSize: 44px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-page:
    fontFamily: EB Garamond
    fontSize: 52px
    fontWeight: '500'
    lineHeight: 60px
    letterSpacing: -0.015em
  headline-page-mobile:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-section:
    fontFamily: EB Garamond
    fontSize: 34px
    fontWeight: '500'
    lineHeight: 42px
  headline-section-mobile:
    fontFamily: EB Garamond
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 32px
  brand-logo:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: 0.08em
  title-product:
    fontFamily: EB Garamond
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
  body-lead:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-default:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-mono-spec:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-navigation:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.06em
  label-price:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
  label-caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-overline:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.12em
spacing:
  gutter: 1.5rem
  gutter-desktop: 1.5rem
  gutter-mobile: 1rem
  margin: 4rem
  margin-mobile: 1.25rem
  margin-tablet: 2.5rem
  space-2xs: 0.5rem
  space-xs: 0.75rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2rem
  space-xl: 3rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

This design system embodies an editorial, high-end interior architecture and collectible furniture gallery aesthetic, drawing inspiration from Norm Architects' warm restraint and Kelly Wearstler’s material authority. It treats spatial digital interfaces as an extension of physical interior volume: calm, measured, tactile, and uncompromisingly disciplined.

The design movement relies on **Architectural Minimalism** blended with high-fashion print editorial cues:
- **Atmospheric Whitespace:** Generous margins and negative space that give furniture silhouettes room to breathe, treating product presentations as curated gallery exhibits rather than transactional commerce.
- **Architectural Discipline:** Structural hairline grids, alignment to sharp axis lines, and zero heavy drop shadows, skeuomorphic bevels, or bright saturated gradients.
- **Material Authenticity:** Surfaces honor organic warmth through chalky neutrals, deep charcoal typography, and museum-grade tactile restraint.
- **Target Audience:** Architects, interior designers, art collectors, and design-literate connoisseurs who value proportion, material provenance, and quiet luxury.

## Colors

The palette establishes quiet distinction through warm mineral whites and rich charcoal tones, rejecting pure synthetic `#000000` in favor of a softer, light-absorbing `#202020`.

### Color Roles & Surface Values
- **Canvas Base (`#F7F7F5`):** Soft, warm neutral chalk surface used for primary viewport backgrounds and wide editorial margins.
- **Elevated Canvas / Card (`#FFFFFF`):** Pure architectural white applied to interactive modules, form controls, product cards, and flyouts to create subtle planar distinction against the base canvas.
- **Secondary Surface (`#EEEEEC`):** Muted stone background for product canvas backdrops, swatch containers, and inset image placeholders.
- **Primary Text / Emphasis (`#202020`):** Dominant charcoal applied to editorial headlines, active nav links, and high-emphasis labels.
- **Secondary / Supporting Text (`#686868`):** Balanced mid-tone gray for metadata, specs, dimensions, material descriptions, and subtle pagination indicators.
- **Hairline Dividers / Borders (`#DADAD7`):** Strict 1px tectonic rules separating layout sections, column modules, and input borders.
- **Interactive State Transitions:** Primary buttons transition from `#202020` to `#383838` on hover. Selected states employ deep charcoal fills or razor-sharp hairline underscores.
- **Semantic Accents:** Understated terracotta/rust (`#8C3B2D`) for validation errors and soft olive (`#485238`) for verified inventory status, paired with monochrome icons to maintain gallery austerity.

## Typography

The typographic balance relies on a dual-type system pairing classical editorial serif discipline with crisp, unadorned modernist sans-serif utility.

- **Primary Editorial Serif (`EB Garamond`):** Evokes mid-century architectural publications and bespoke auction catalogues. Used strictly for display banners, editorial narratives, category headlines, product naming, and the brand mark. Titles maintain medium weight (500-600) with subtle negative tracking on large scales.
- **Secondary Modernist Sans-Serif (`Inter`):** Handles all transactional and structural communication: site navigation, form inputs, pricing, technical dimension callouts, material specification tables, and fine metadata. Set in 400 (regular body) and 500 (navigation and critical numerical pricing).
- **Overlines and Metadata:** Overline labels and navigation items use uppercase letterforms with widened tracking (`0.06em` to `0.12em`) to echo architectural plan labeling.

## Layout & Spacing

The layout model is governed by a **Strict 12-Column Architectural Grid** that locks all elements into deliberate proportions up to a fixed maximum container width of 1920px.

### Screen Adaptations & Breakpoints
- **Desktop (1440px - 1920px):** 12 columns, `4rem` (64px) outer page margins, `1.5rem` (24px) gutters. Section breaks follow an expansive vertical progression using `space-2xl` (64px) and `space-3xl` (96px).
- **Tablet (768px - 1439px):** 8 columns, `2.5rem` (40px) outer margins, `1.5rem` (24px) gutters. Asymmetrical editorial spreads collapse into balanced 4-column groupings.
- **Mobile (&lt; 767px):** 4 columns, `1.25rem` (20px) outer margins, `1rem` (16px) gutters. Product grids transition to single-column hero views or fluid 2-column alternating layouts with vertical spacing clamped to `space-lg` (32px).

### Architectural Spacing Rules
Vertical rhythm follows strict mathematical multiples of 8px and 12px. Editorial narratives utilize intentional negative voids—whitespace is not passive gap-filling, but an active architectural envelope surrounding objects of craft.

## Elevation & Depth

This design system avoids simulated multi-layered drop shadows, blur washes, and saturated gradients. Depth is established purely through **Planar Stratification** and **Hairline Cartography**:

1. **Planar Contrast:** Deep spatial layers transition from the primary canvas (`#F7F7F5`) to active interactive surfaces (`#FFFFFF`) and inset material canvases (`#EEEEEC`).
2. **Hairline Outlines:** Exact 1px solid dividers (`#DADAD7`) replace elevation thresholds. Surfaces do not lift off the screen; they exist as adjoining stone or plaster panels aligned flush along razor-thin junctions.
3. **Contextual Overlays:** Cart flyouts, filter drawers, and modal dialogs maintain crisp white backgrounds with an immediate full-canvas `#202020` backdrop overlay at 24% opacity—no blur, producing the effect of shaded studio lighting.
4. **Interactive Planes:** Product cards and interactive modules show active engagement through color inversion, 1px perimeter border transitions, or subtle scale movements (e.g., imagery slowly expanding by 1.015x within an unyielding geometric frame), rather than simulated Z-index floating.

## Shapes

The geometric identity is defined by **Sharp Architectural Precision (`roundedness: 0`)**. All structural components—product cards, input fields, dropdown menus, button hulls, and layout dividers—feature 0px radius corners, reminiscent of hand-chiseled stone, milled aluminum, and orthogonal drafting boards.

A deliberate, singular exception is made for micro-scale navigational indicators and interactive Hotspots:
- **Interactive Hotspot Dots:** Formed as pure circles (50% radius) to contrast decisively against orthogonal architectural photography.
- **Micro Status Pills:** Retain either sharp 0px structural tags or clean 2px softened boundaries to demarcate textile batches, collection vintages, or dimensional details without diluting the overall grid geometry.

## Components

### Buttons
- **Primary:** Solid `#202020` fill, pure `#FFFFFF` typography, 0px border radius, 48px height. Padding is horizontal `24px`. Hover state transitions seamlessly to `#383838`. Focus state presents a clean 1px offset ring.
- **Secondary:** Transparent fill with a 1px solid `#202020` outline and `#202020` text. Hover shifts to full `#202020` background with `#FFFFFF` text.
- **Editorial Text Button:** Understated 13px uppercase Inter with a 1px solid underline spaced 4px below the baseline; transitions to 50% opacity on press.

### Form Inputs & Selectors
- **Text Inputs:** Pure `#FFFFFF` field, 48px height, framed by a 1px border in `#DADAD7`. Typography is 15px `Inter` in `#202020`. Focus activates a 1px solid `#202020` perimeter border with zero glow or fuzzy outer rings. Placeholder text rests in `#686868`.
- **Checkboxes & Radios:** Minimalist 16x16px boxes with crisp 1px borders. Radios utilize an unadorned center dot; checkboxes use an ultra-thin architectural crosshair or solid `#202020` fill block when selected.

### Product Cards
- **Structure:** Framed on clean `#FFFFFF` with optional `#EEEEEC` inset canvas for isolated cutouts. Edge boundaries are marked by `#DADAD7` hairline borders or borderless juxtaposition against `#F7F7F5`.
- **Media Presentation:** Contained, uncluttered photography with consistent horizon lines and natural warm lighting. Image containers feature 0px sharp corners with subtle 1.015x image zoom on hover over 400ms.
- **Typography Stack:** Category/Provenance label in 11px uppercase `Inter` overline, followed by Product Name in 20px `EB Garamond`, terminated by clean price display in 15px `Inter` (`#202020`).

### Interactive Spatial Hotspots
- **Anatomy:** Used in lifestyle interior environments to isolate discoverable furniture pieces.
- **Dot Core:** An 8px solid `#202020` or `#FFFFFF` circular anchor.
- **Pulsing Aura:** A 24px concentric circular ring with a 1px hairline border carrying an ethereal pulse animation between 30% and 80% opacity.
- **Popover Card:** On click/hover, reveals a sharp 0px `#FFFFFF` thumbnail card displaying thumbnail art, piece title, designer name, price, and direct gallery link.

### Chips & Badges
- **Specification Chips:** Framed in a 1px `#DADAD7` border with `#202020` text on `#FFFFFF`, height 28px, 0px corner radius. Used for material selections (e.g., *Travertine*, *Smoked Oak*, *Bouclé*).
- **Inventory/Editorial Badges:** Subtle typographic text flags with 0px sharp backgrounds or subtle hairline brackets without loud badge fills.