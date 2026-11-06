# Scannova design system

**Status:** proposed on 2026-11-06. The tokens will live in `src/theme`, and screens must not hardcode colours or spacing.

**Principle:** the document is the content, and the interface stays out of its way. One blue accent marks the main action. Everything else is neutral.

## Colour

Light values come from the product spec. Dark values are proposed to match the same structure.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `primary` | `#2563EB` | `#2563EB` | Filled main action |
| `primaryPressed` | `#1D4ED8` | `#1D4ED8` | Pressed state |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `accent` | `#2563EB` | `#60A5FA` | Links, active tab, icons on the background |
| `background` | `#FFFFFF` | `#0F172A` | Screen |
| `backgroundSecondary` | `#F8FAFC` | `#1E293B` | Grouped areas, thumbnail backing |
| `surface` | `#FFFFFF` | `#1E293B` | Cards, sheets |
| `textPrimary` | `#0F172A` | `#F8FAFC` | Titles, body |
| `textSecondary` | `#64748B` | `#94A3B8` | Dates, captions |
| `border` | `#E2E8F0` | `#334155` | Card and row borders |
| `success` | `#16A34A` | `#22C55E` | Confirmation icons only, never text |
| `error` | `#DC2626` | `#F87171` | Errors, destructive actions |

**Contrast:** measured with the WCAG formula. AA needs 4.5:1 for text and 3:1 for icons.

| Pair | Ratio |
| --- | --- |
| `onPrimary` on `primary` | 5.17 |
| Light `textSecondary` on `background` | 4.76 |
| Light `textSecondary` on `backgroundSecondary` | 4.55 |
| Dark `textSecondary` on `background` | 6.96 |
| Dark `textSecondary` on `surface` | 5.71 |
| Light `error` on `background` | 4.83 |
| Dark `error` on `surface` | 5.29 |
| Light `success` on `background` | 3.30, so it is limited to icons |

The dark `primary` matches the light one because white text on the first proposed value, `#3B82F6`, measured only 3.68:1. The remaining dark pairs, including `accent`, are measured in step 1.1.

Colour never carries meaning alone: a favourite uses a filled icon as well as a colour, and an error includes text.

## Type

Inter, falling back to the system font, with font scaling always on.

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 28 / 36 | 600 | Onboarding title |
| `title` | 22 / 28 | 600 | Screen title |
| `heading` | 17 / 24 | 600 | Section heading, document name |
| `body` | 15 / 22 | 400 | Body text |
| `caption` | 13 / 18 | 400 | Date, page count |
| `button` | 15 / 20 | 600 | Button label |

## Spacing, shape and touch

- **Spacing:** multiples of 8, with 4 for tight icon and label pairs. The screen gutter is 16.
- **Radius:** 8 for thumbnails and inputs, 12 for cards and buttons, 16 for the top of bottom sheets, and full for the central scan button.
- **Depth:** 1 px borders instead of shadows. Only the central scan button and bottom sheets may use a soft native elevation.
- **Touch targets:** at least 48 by 48, even when the icon is 24.
- **Icons:** one line icon family at 24, or 20 inside rows.

## Motion

Only motion that explains a change is used: native screen transitions, sheets rising, and pages moving during reorder. Durations stay under 250 ms, and the system's reduce motion setting is respected.

## Components

| Component | Notes |
| --- | --- |
| `Button` | Primary, secondary and destructive. Loading and disabled states |
| `IconButton` | Always has an accessibility label |
| `Card` | Border, radius 12, no shadow |
| `ListRow` | Leading item, title, caption, trailing action |
| `DocumentRow` | Real thumbnail, name, date, page count, more menu |
| `FolderRow` | Icon, name, document count |
| `BottomSheet` | Action menus and pickers |
| `ConfirmDialog` | Destructive confirmations only |
| `TextField` | Label, error text |
| `SearchBar` | Clear button |
| `EmptyState` | Line icon, one sentence, one action |
| `ErrorState` | What happened, and how to retry |
| `Skeleton` | Static loading rows |
| `Toast` | Short confirmations, announced to screen readers |

## Screen behaviour

Every screen with data has designed loading, empty and error states. Layout uses `start` and `end` rather than `left` and `right`, so Arabic and RTL can be added later without rewriting screens. Safe areas and large text are handled from the first screen.
