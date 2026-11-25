# Applyra — independent sidebar icon set

- **26 separately authored, transparent SVG icons** in `svg/`.
- Crisp at 16, 18, 20, 24, 32 px and beyond. No raster upscaling required.
- Each uses a `24 × 24` viewBox, 1.8 stroke, rounded caps/joins, and `currentColor`.
- PNG fallbacks in `png-24/`, `png-48/`, `png-96/`.
- `applyra-icons-preview-4k.png` is a contact sheet only; sidebar files are separate.
- SVGs do not have the large glossy squares from the previous image concepts.

## Use
Inline the SVG markup in your sidebar component to inherit CSS color:

```html
<span class="sidebar-icon" aria-hidden="true">
  <!-- paste body of svg/dashboard.svg here -->
</span>
```

```css
.sidebar-icon svg { width: 20px; height: 20px; color: #40516b; }
.sidebar-link[aria-current="page"] .sidebar-icon svg { color: #2860ed; }
```

For `<img src="...">`, `currentColor` does not inherit from the surrounding page CSS; use the PNG fallback or replace `currentColor` with a fixed hex color in a generated SVG. Do not claim a feature works just because an icon exists. These are graphic assets, not implemented features.

## Originality / rights
Created specifically as source-authored SVG paths for Applyra, not copied from an icon library. Symbols such as a clock, magnifying glass, and briefcase are conventional UI metaphors; originality alone cannot guarantee trademark clearance or exclusive rights.
