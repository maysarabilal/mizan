# Design System Documentation

## 1. Overview & Creative North Star
### The Digital Atelier
The creative vision for this design system is **"The Digital Atelier."** In the legal world, prestige is not shouted; it is felt through the weight of a heavy door, the texture of fine stationery, and the clarity of a well-drafted brief. We are moving away from the "cluttered dashboard" trope of legacy legal software. 

Instead, we treat the UI as a high-end editorial experience. We achieve authority through **Intentional Asymmetry** and **Generous Air**. By breaking the rigid grid with overlapping elements and dramatic typographic scale, we create a sense of bespoke craftsmanship. The interface should feel like a private office—quiet, expensive, and hyper-organized.

---

## 2. Colors & Tonal Architecture
The palette is anchored in the authority of **Dark Navy (#1a2744)** and the prestige of **Gold (#c9a84c)**. However, high-end design is found in the "in-between" shades—the surfaces and containers that define the space.

### The "No-Line" Rule
To achieve a signature look, designers are **prohibited from using 1px solid borders** for primary sectioning. Structure must be defined through background color shifts. A sidebar is not "separated" by a line; it is a `surface-container-low` region sitting adjacent to a `surface` main stage. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use tonal transitions to indicate depth:
*   **Surface:** The base layer (Canvas).
*   **Surface-Container-Low:** Subtle nesting for secondary utility panels.
*   **Surface-Container-Highest:** The "Hero" container or active focus area.

### The Glass & Gradient Rule
To prevent the navy from feeling "flat," use subtle gradients for main CTAs or primary navigation backgrounds (e.g., transitioning from `primary` to `primary_container`). For floating elements like modals or command palettes, apply **Glassmorphism**: use semi-transparent surface colors with a `24px` backdrop blur to allow the brand colors to bleed through softly.

---

## 3. Typography
We use a dual-font approach to balance editorial elegance with functional precision.

*   **Display & Headlines (Manrope):** This is our "Editorial" voice. Manrope provides a geometric yet warm authority. Use `display-lg` and `headline-md` with tight letter spacing (-0.02em) to create a sense of modern prestige.
*   **Body & Utility (Inter):** For the "Workhorse" elements—data tables, case files, and correspondence—Inter provides unmatched legibility. 
*   **Hierarchy as Identity:** Use high-contrast scaling. A `display-sm` header paired with a `label-md` uppercase caption creates a sophisticated, "magazine-style" layout that feels more premium than standard SaaS templates.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. The shift in tone creates a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** If a shadow is required for a floating state (like a dropdown), it must be **Ambient**. Use a large blur (32px+) with a very low opacity (4%-6%). The shadow color should be tinted with `on_surface` (Navy) to ensure it looks like a natural reflection of light.
*   **The "Ghost Border" Fallback:** Where containment is strictly necessary for accessibility, use a **Ghost Border**: the `outline_variant` token at 15% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** Use `surface_container_lowest` at 80% opacity with a `blur(12px)` for headers that stay fixed while content scrolls beneath.

---

## 5. Components

### Buttons
*   **Primary:** A deep gradient of `primary` to `primary_container`. Text is `on_primary`. Roundedness: `md` (0.375rem).
*   **Secondary:** Ghost-style. No background. `primary` text with a `Ghost Border` that only appears on hover.
*   **Tertiary (The "Accent"):** Reserved for final "Commit" actions. `secondary` (Gold) text with no background.

### Data Tables
Data is the lifeblood of Mizan. 
*   **Style:** Forbid horizontal and vertical divider lines. 
*   **Separation:** Use alternating `surface_container_low` row backgrounds or simply `8px` of vertical whitespace between rows.
*   **Header:** `label-sm` in uppercase with `on_surface_variant` color to provide an "archival" feel.

### Input Fields
*   **Resting:** A flat `surface_container_high` background. No border.
*   **Active:** A subtle 1px `secondary` (Gold) bottom-border only. This mimics high-end stationery.
*   **Error:** `error_container` background with `error` text.

### Chips & Tags
*   **Execution:** Use `primary_fixed_dim` for background with `on_primary_fixed` text. 
*   **Shape:** Full pill (`full`) to contrast against the more architectural `md` corners of cards and buttons.

### Case Timelines (Context Specific)
A bespoke component for Mizan. Use a single vertical line in `outline_variant` (20% opacity) with `secondary` (Gold) nodes to represent milestones in a legal case.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., a wider left margin on text blocks) to create an editorial feel.
*   **Do** use `surface_tint` sparingly to highlight active navigation states.
*   **Do** prioritize "Optical Balance" over strict grid alignment for icons and labels.

### Don't
*   **Don't** use pure black (#000) for text. Always use `on_surface` (the Dark Navy tint).
*   **Don't** use standard "Box Shadows." If it looks like a 2015 Material Design card, it's wrong.
*   **Don't** use dividers to separate sections. If the content isn't separated enough by whitespace or tonal shifts, re-evaluate the layout.
*   **Don't** crowd the interface. If a lawyer is reviewing a contract, the UI should "recede" to let the text breathe.