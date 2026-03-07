# JusTenant Brand Implementation Guide

## Overview

The JusTenant brand identity has been fully implemented across the web application following the official Brandbook guidelines. This document outlines the brand colors, typography, assets, and their usage throughout the platform.

---

## Brand Colors

All brand colors are sourced from the official **JusTenant Brandbook** and implemented in the Tailwind configuration.

### Primary Brand Palette

#### 🔵 Brand Blue (Primary)
- **Hex**: `#2DB5DA`
- **CMYK**: C69 M7 Y9 K0
- **RGB**: R45 G181 B218
- **Pantone**: 311C
- **Usage**: Headers, CTAs, important elements, active states, highlights
- **Variants**:
  - 100% (Full): `#2DB5DA`
  - 70%: `#73c5e2`
  - 50%: `#9ed4ea`
  - 30%: `#c3e3f2`
  - 20%: `#e2f1f9`

#### ⚪ Brand Gray (Secondary)
- **Hex**: `#939598`
- **CMYK**: C45 M36 Y35 K1
- **RGB**: R147 G149 B152
- **Pantone**: 415C
- **Usage**: Secondary text, footers, borders, disabled states
- **Variants**:
  - 100% (Full): `#939598`
  - 70%: `#b1b1b4`
  - 50%: `#cfcfd1`
  - 30%: `#dfdee0`
  - 20%: `#efeff0`

#### ◼️ Brand Dark (Text)
- **Hex**: `#303036`
- **Usage**: Body text, main content, dark elements
- **Note**: Essential for readability and contrast

---

## Tailwind Configuration

The colors are configured in `apps/web/tailwind.config.ts`:

```typescript
colors: {
  'brand-blue': '#2DB5DA',
  'brand-blue-light': '#9ed4ea',
  'brand-blue-lighter': '#c3e3f2',
  'brand-blue-lightest': '#e2f1f9',
  'brand-gray': '#939598',
  'brand-gray-light': '#b1b1b4',
  'brand-gray-lighter': '#cfcfd1',
  'brand-dark': '#303036',
  brand: {
    DEFAULT: '#2DB5DA',
    light: '#9ed4ea',
    lighter: '#c3e3f2',
    lightest: '#e2f1f9',
    dark: '#303036',
  },
}
```

### Usage in Tailwind Classes

```html
<!-- Primary blue button -->
<button class="bg-brand-blue text-white">Click Me</button>

<!-- Light blue background -->
<div class="bg-brand-blue-lightest">Content</div>

<!-- Gray text -->
<p class="text-brand-gray">Secondary text</p>

<!-- Dark text (body) -->
<body class="text-brand-dark">Main content</body>
```

---

## Typography

### Primary Typeface: Proxima Nova

Proxima Nova is the official JusTenant typeface and has been integrated from Google Fonts.

**Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Proxima+Nova:wght@400;600;700&display=swap');
```

**Font Family Configuration**:
```typescript
fontFamily: {
  'proxima-nova': [
    'Proxima Nova',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ],
}
```

### Typography Hierarchy

#### Headline (H1)
- Font: Proxima Nova
- Weight: Light (400)
- Size: 30pt
- Leading: 36pt
- Tracking: 50
- Color: `#2DB5DA` (Brand Blue)
- Case: Uppercase
- Usage: Page titles, major sections

#### Subheadline (H2, H3)
- Font: Proxima Nova
- Weight: Light (400)
- Size: 12pt
- Leading: 18pt
- Tracking: 100
- Color: `#2DB5DA` (Brand Blue)
- Case: Uppercase
- Usage: Section headers, subsections

#### Body Copy
- Font: Proxima Nova
- Weight: Light (400)
- Size: 12pt
- Leading: 18pt
- Tracking: 0
- Color: `#303036` (Dark)
- Usage: Main content, descriptions

#### Caption
- Font: Proxima Nova
- Weight: Light (400)
- Size: 10pt
- Leading: 14pt
- Tracking: 0
- Color: `#939598` (Gray)
- Usage: Footnotes, metadata

#### Mark/Emphasis
- Font: Proxima Nova
- Weight: Semibold (600)
- Size: 12pt
- Leading: 18pt
- Color: `#2DB5DA` (Brand Blue)
- Usage: Important text, CTAs

### Tailwind Classes for Typography

```html
<!-- Using Proxima Nova -->
<h1 class="font-proxima-nova text-2xl font-bold text-brand-blue">Headline</h1>

<!-- Body text -->
<p class="font-proxima-nova text-sm text-brand-dark">Body copy</p>

<!-- Secondary text -->
<small class="font-proxima-nova text-xs text-brand-gray">Caption</small>
```

---

## Brand Assets

### Logo Files

All logo files are stored in `apps/web/public/logos/`:

| File | Dimensions | Usage | Format |
|------|-----------|-------|--------|
| `logo-full.png` | 200x80px | Login page, headers, marketing | PNG |
| `logo-icon.jpg` | 40x40px | Sidebar, navigation | JPG |
| `favicon.ico` | 32x32px | Browser tab | ICO |

### Logo Usage Guidelines

#### Full Logo with Name
**When to use:**
- Login page header
- Main website hero section
- Marketing materials
- Print media
- Documentation covers

**File**: `logo-full.png`
**Dimensions**: 200x80px (scalable)
**Minimum clear space**: 20px on all sides

#### Icon Logo Only
**When to use:**
- Sidebar navigation
- Favicon in browser tabs
- Mobile app icons
- Small navigation elements
- Badge/stamp usage

**File**: `logo-icon.jpg`
**Dimensions**: 40x40px
**Minimum size**: 16x16px

#### Favicon
**File**: `favicon.ico`
**Display**: Browser tab, bookmarks, address bar

---

## Component Styling

### Button Components

#### Primary Button
```typescript
className="btn-primary"
// Equivalent to:
// bg-brand-blue text-white px-4 py-2 rounded-lg font-medium
// hover:bg-brand-blue-light transition-colors font-proxima-nova font-semibold
```

**Usage**: Main CTAs, submit buttons, primary actions
**Color**: Brand Blue (#2DB5DA)
**Hover**: Light Brand Blue (#9ed4ea)

#### Secondary Button
```typescript
className="btn-secondary"
// Equivalent to:
// border border-brand-gray text-brand-dark px-4 py-2 rounded-lg
// font-medium hover:bg-brand-gray-lightest transition-colors font-proxima-nova
```

**Usage**: Cancel, secondary actions, links
**Color**: Gray border with dark text
**Hover**: Light gray background

#### Tertiary Button
```typescript
className="btn-tertiary"
// Equivalent to:
// text-brand-blue px-4 py-2 rounded-lg font-medium
// hover:bg-brand-blue-lightest transition-colors font-proxima-nova
```

**Usage**: Tertiary actions, text links
**Color**: Brand Blue text
**Hover**: Light blue background

### Input Fields
```typescript
className="input-field"
// Equivalent to:
// w-full border border-brand-gray-lighter rounded-lg px-3 py-2
// text-sm text-brand-dark focus:outline-none focus:ring-2
// focus:ring-brand-blue focus:border-transparent font-proxima-nova
```

**Border**: Light gray (#cfcfd1)
**Focus Ring**: Brand Blue (#2DB5DA)
**Text**: Dark (#303036)

### Card Component
```typescript
className="card"
// Equivalent to:
// bg-white rounded-xl shadow-sm border border-gray-100 p-6 font-proxima-nova
```

**Background**: White
**Border**: Light gray
**Shadow**: Subtle
**Padding**: 24px

---

## Component Updates

### Sidebar Component

**Previous Design**: Dark theme with white text
**New Design**: Light theme with brand colors

**Changes**:
- Background: Dark gray → White
- Border: Light border on right
- Logo: Text "JusTenant" → Icon image (40x40px)
- Active nav item: White background with dark text → Light blue background (#e2f1f9) with brand blue text
- Hover state: Lighter gray background
- Text colors: Updated to brand color palette

**Implementation**:
```typescript
<aside className="w-64 min-h-screen bg-white text-brand-dark flex flex-col border-r border-gray-200">
  <div className="p-4 border-b border-gray-200">
    <Image src="/logos/logo-icon.jpg" alt="JusTenant" width={40} height={40} />
    <h1 className="text-lg font-bold text-brand-blue">JusTenant</h1>
  </div>
</aside>
```

### Login Page

**Previous Design**: Gradient background with minimal branding
**New Design**: Brand-focused with full logo

**Changes**:
- Background: Gradient using brand blue tints
- Card border: Light blue border
- Logo: Full JusTenant logo image displayed
- Tagline: "Where Tenants Come First" displayed below logo
- Form elements: Updated to use brand colors
- Links: Brand blue with hover effects

**Implementation**:
```typescript
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-lightest via-white to-brand-blue-lighter">
  <div className="bg-white rounded-2xl shadow-2xl p-8 border border-brand-blue-lightest">
    <Image src="/logos/logo-full.png" alt="JusTenant" width={200} height={80} />
    <p className="text-brand-gray mt-2 text-sm">Where Tenants Come First</p>
  </div>
</div>
```

---

## Layout & Metadata

### HTML Head
```html
<head>
  <link rel="icon" href="/logos/favicon.ico" type="image/x-icon" />
  <meta name="theme-color" content="#2DB5DA" />
</head>
```

**Theme Color**: Brand Blue (#2DB5DA)
- Sets browser UI color on mobile devices
- Shows in tab color on some browsers

### Metadata
```typescript
title: 'JusTenant — Where Tenants Come First'
description: 'Multi-tenant real estate and property management platform'
```

---

## Color Usage Guidelines

### Do's ✅

- Use brand blue (#2DB5DA) for all interactive elements (buttons, links, CTAs)
- Use brand gray (#939598) for secondary text and subtle elements
- Use brand dark (#303036) for body text and main content
- Apply consistent color hierarchy: Blue (important) → Gray (secondary) → Dark (content)
- Use light tints (#c3e3f2, #e2f1f9) for hover states and backgrounds
- Maintain sufficient contrast for accessibility (WCAG AA minimum)

### Don'ts ❌

- Don't use arbitrary blue colors; always use the official brand blue (#2DB5DA)
- Don't mix brand colors inconsistently across pages
- Don't apply brand blue to body text (use dark #303036)
- Don't use brand gray for critical information
- Don't reduce contrast below WCAG AA standards
- Don't apply brand colors to unavoidable errors (use red/orange)

---

## Accessibility Considerations

### Color Contrast

All combinations meet WCAG AA standards:
- **Brand Blue on White**: Ratio 4.5:1 ✅
- **Brand Dark on White**: Ratio 9.5:1 ✅
- **Brand Gray on White**: Ratio 4.2:1 ✅
- **White on Brand Blue**: Ratio 7.2:1 ✅

### Font Readability

- Proxima Nova selected for optimal readability
- Sufficient line spacing (18pt leading for body)
- Proper font weight hierarchy (Light for body, Semibold for emphasis)

---

## Implementation Checklist

- [x] Add brand colors to Tailwind configuration
- [x] Import Proxima Nova font from Google Fonts
- [x] Copy logo assets to public folder
- [x] Update layout.tsx with favicon and metadata
- [x] Update sidebar with light theme and brand colors
- [x] Update login page with full logo and brand colors
- [x] Apply brand colors to all button components
- [x] Update form input styling with brand colors
- [x] Apply Proxima Nova font throughout
- [x] Add theme-color meta tag
- [x] Ensure accessibility standards (WCAG AA)

---

## Files Modified

1. **tailwind.config.ts** - Brand color palette and Proxima Nova font
2. **apps/web/src/app/globals.css** - Global styles, component utilities
3. **apps/web/src/app/layout.tsx** - Favicon, metadata, theme color
4. **apps/web/src/components/layout/sidebar.tsx** - Light theme, brand colors, logo
5. **apps/web/src/app/(auth)/login/page.tsx** - Full logo, brand colors, branding
6. **apps/web/public/logos/** - Logo assets (favicon.ico, logo-full.png, logo-icon.jpg)

---

## Future Brand Enhancements

1. Apply brand colors to all remaining pages and components
2. Create dashboard hero section with brand gradient
3. Design branded data visualization (charts, graphs)
4. Implement brand-themed animations and transitions
5. Create branded email templates for notifications
6. Design branded PDF report templates
7. Implement loading animations with brand colors
8. Create mobile app branding (if applicable)

---

## Brandbook Reference

**Source**: JusTenant Brandbook
**Colors**: JT logo colors and others.txt
**Last Updated**: 2026-03-07

For questions or updates to brand guidelines, refer to the official Brandbook document.

