# UI Design Handbook

一套极简的 UI 设计规范，用于工具型产品与 SaaS。

---

## 1. Design Principles

1. **Background layers <= 2**: `bg` + `surface`/`surface2`
2. **One brand color only**: used for primary actions and focus feedback
3. **Borders over shadows**: shadows only for floating layers (Dialog/Popover)
4. **Restrained motion**: fade, translate <= 2px, scale 0.99; no snapping

## 2. Color Tokens

12 core variables. Everything else derives from these.

```css
:root {
  --primary: #10a37f;

  --bg: #ffffff;
  --surface: #ffffff;
  --surface2: #f7f7f8;

  --text: #343541;
  --muted: #8e8ea0;

  --border: #e5e5e5;
  --ring: #10a37f;

  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;

  --radius: 8px;
}

.dark {
  --bg: #343541;
  --surface: #444654;
  --surface2: #202123;
  --text: #ececf1;
  --border: #565869;
}
```

**Rules**:
- All colors must come from tokens (use `color-mix` for alpha, e.g. `--primary-a10`)
- No hardcoded hex values in components
- Dark mode only flips variables, never rewrites component styles

## 3. Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Tags, badges |
| `--radius-md` | 6px | Inputs, buttons |
| `--radius-lg` | 8px | Cards |
| `--radius-xl` | 12px | Dialogs, popovers |

**Nested containers**: `Inner Radius = Outer Radius - Padding`. If negative, use 0px.

## 4. Spacing Scale

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

## 5. Typography

```css
font-family: Inter, system-ui, sans-serif;
```

| Level | Size | Usage |
|-------|------|-------|
| Body | 14px | Default text |
| H3 | 14px bold | Card titles, section headers |
| H2 | 20px bold | Page titles |
| H1 | 24px bold | Feature landing (rare) |
| Caption | 12px | Metadata, labels |

**Mobile**: `input, textarea, select { font-size: 16px; }` (prevents iOS zoom)

## 6. Component Rules

### Button

| Variant | Style | Usage |
|---------|-------|-------|
| default | `bg-primary text-white` | Primary actions |
| secondary | `bg-surface2 border` | Secondary actions |
| ghost | transparent, hover `surface2` | Toolbars |
| outline | transparent + border | Alternative secondary |
| destructive | `bg-danger text-white` | Delete, clear |
| link | text + underline | Inline actions |

**Sizes**: sm (32px), default (36px), lg (40px), icon (36x36)

**Interaction**:
- Hover: `opacity` or brightness shift
- Active: `scale(0.99)`
- Focus: `outline: 3px solid var(--ring)`
- Disabled: `bg-muted text-muted-foreground` (not just opacity)
- Touch target: >= 44px

### Input / Textarea

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius);

&:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
```

No inner shadows, no gradients.

### Card

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-xl);
padding: var(--space-lg);
```

Default: no shadow. Shadows only when floating:
- `--shadow-subtle`: `0 1px 2px rgba(0,0,0,0.05)` — white bg depth
- `--shadow-float`: `0 10px 30px rgba(0,0,0,0.1)` — hover/float
- `--shadow-modal`: `0 20px 50px rgba(0,0,0,0.2)` — Dialog only

### Dialog / Popover

```css
background: var(--surface);
border: 1px solid var(--border);
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
border-radius: var(--radius);
```

### Table

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table th {
  background: var(--surface2);
  font-weight: 600;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
}

.table tr:last-child td { border-bottom: none; }
.table tr:hover { background: var(--surface2); }
```

### Badge / Tag

| Variant | Background | Text |
|---------|-----------|------|
| default | `var(--surface2)` | `var(--text)` |
| success | `var(--primary-a20)` | `var(--primary)` |
| warning | `var(--warning-a20)` | `var(--warning)` |
| error | `var(--danger-a20)` | `var(--danger)` |
| info | `var(--info-a20)` | `var(--info)` |

Sizes: sm (10px), default (12px), lg (14px)

### Toast

```css
position: fixed;
bottom: var(--space-lg);
right: var(--space-lg);
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-lg);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
min-width: 280px;
max-width: 400px;
```

| Property | Value |
|----------|-------|
| Duration | 3-5s (errors longer) |
| Animation | fade + slide up |
| Stacking | vertical, new at bottom |

Left border color indicates semantic: success (primary), warning, error, info.

### Sidebar List Item

```css
.sidebar-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease;
}

.sidebar-item:hover { background: var(--surface2); }

/* Active state - recommended */
.sidebar-item.active {
  background: var(--surface2);
  border-left: 3px solid var(--primary);
  padding-left: calc(var(--space-md) - 3px);
}
```

## 7. Motion

**Allowed**:
- `opacity: 0 -> 1`
- `translateY(+-2px)`
- `scale(0.99)`
- `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`

**Forbidden**:
- Infinite loop animations
- Complex path animations
- Decorative animations unrelated to business logic

**Reduced motion**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. Layout

- **Sidebar**: fixed 280px
- **Content**: max-width 900-1000px, centered
- **Breakpoints**: only one — `mobile: < 768px`, `desktop: >= 768px`
- **Mobile sidebar**: drawer, 85vw / max 320px

## 9. Icons

- Library: Lucide React
- Sizes: default 20px, small 16px, large 24px
- Color: inherit from parent text color (never set icon color directly)

## 10. Accessibility

- All interactive elements keyboard-accessible
- `:focus-visible` must be visible
- Dialog supports `Esc` to close
- Text contrast >= WCAG AA (4.5:1)
- Critical action buttons >= WCAG AAA (7:1)
- Disabled state text contrast >= 3:1

```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

## 11. Decision Checklist

Before adding any new design element:

1. Does it help users complete a task? No -> don't add
2. Can it be built with existing tokens? No -> reconsider
3. Does it follow the 4 core principles? No -> don't add

**Golden Rule**: If you can't define it with a token, you probably shouldn't build it.

---

> **Philosophy**: Less is more. Constraints are freedom.
