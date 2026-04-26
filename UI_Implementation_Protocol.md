# UI Implementation Protocol

This protocol is **mandatory** for every UI design task.
No file may be modified before completing these steps in order.

---

## Step 1 — Pre-Edit Scan (Required Before Any Changes)

Before touching any file, produce a comparison table for every element
in the current page/component:

| Element | In Design? | In Codebase? | Action |
|---|---|---|---|
| Support Button | ✅ | ❌ | Add as documented placeholder |
| Settings Menu | ❌ | ✅ | Keep as-is — never remove |
| KPI Cards | ✅ | ✅ | Apply new design |
| Server Action X | ❌ | ✅ | Do not touch |

> **Do not proceed to Step 2 without presenting this table
> and receiving explicit approval.**

---

## Step 2 — Decision Rules

### ✅ In Design + ✅ In Codebase
Apply the new design fully. Match colors, typography, spacing,
and structure to the reference exactly.

### ✅ In Design + ❌ In Codebase
Add the element as a **disabled UI placeholder** only.
- Apply `disabled` state: `opacity-60 cursor-not-allowed`
- Add a `tooltip` with the text "Coming Soon" / "قريباً"
- Do **not** create any Server Action, logic, or functionality
- Document it immediately in `DEVELOPMENT_LOG.md`
  under **"UI Placeholders — Pending Implementation"**

### ❌ Not in Design + ✅ In Codebase
Preserve the element exactly as it is.
- Only apply the new color tokens and typography
- Never remove, hide, or restructure it
- This rule overrides all visual preferences

### ❌ Not in Design + ❌ Not in Codebase
Take no action.

---

## Step 3 — Execution Order

1. **Show** the current file in full before editing it
2. **Edit** one file at a time — never batch multiple files
3. **Build** after every file: `npm run build`
4. **Do not proceed** to the next file before a clean build (exit code 0)

If the build fails, fix the error in the same file before moving on.
Do not accumulate errors across files.

---

## Step 4 — Placeholder Documentation

Every element added as a placeholder must be logged in
`DEVELOPMENT_LOG.md` under this entry:

### [DATE] — UI Placeholders — Pending Implementation

| Element | Location | Expected Functionality | Priority |
|---|---|---|---|
| Help Button (?) | Topbar | Help page or onboarding tooltip | Low |
| Support Button | Sidebar | WhatsApp link or contact modal | Medium |
| Draft Document | Quick Actions | Linked to a future documents feature | Low |

---

## Step 5 — Design Reference Priority

When working from Stitch-exported designs, apply this hierarchy:

1. **`DESIGN.md`** — Design system rules and decisions (highest authority)
2. **`screen.jpg`** — Visual reference for final appearance
3. **`code.html`** — Reference for specific colors and structure only

> The exported code from Stitch is **not** production code.
> Never copy it directly. Use it only to extract specific
> values (hex colors, spacing, icon names).

---

## Step 6 — RTL Compliance

This project is a **Right-to-Left (RTL) Arabic interface**.
Every CSS change must respect directionality:

| LTR Class | RTL Equivalent |
|---|---|
| `ml-*` | `ms-*` |
| `pl-*` | `ps-*` |
| `mr-*` | `me-*` |
| `pr-*` | `pe-*` |
| `border-l-*` | `border-s-*` |
| `border-r-*` | `border-e-*` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `text-left` | `text-start` |
| `rounded-l-*` | `rounded-s-*` |

Never use physical properties (`left`, `right`, `ml`, `mr`)
for layout spacing. Always use logical properties (`start`, `end`,
`ms`, `me`) to ensure correct RTL rendering.

---

## Violation Policy

If any of these steps are skipped or violated:

- Stop immediately
- Revert the change
- Restart from Step 1

The goal is zero regressions. A slower, methodical approach
is always preferred over a fast, incomplete one.