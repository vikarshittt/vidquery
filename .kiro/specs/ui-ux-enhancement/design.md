# Design Document: UI/UX Enhancement

## Overview

This document describes the technical design for enhancing the VidQuery frontend with dark/light theme switching, glassmorphism visuals, Framer Motion animations, voice search via the Web Speech API, and scroll-triggered effects. The implementation targets Next.js 16, React 19, TypeScript, and Tailwind CSS v4 — the stack already in use — and adds no new runtime dependencies beyond what is already installed (`framer-motion`, `lucide-react`).

The design is additive: all existing business logic, API calls, and navigation flows remain untouched. New capabilities are layered on top through a React Context provider, CSS variable overrides, and isolated component additions.

### Key Design Decisions

- **CSS variables over Tailwind dark-mode classes**: Tailwind v4's `@theme` block and CSS custom properties give us a single source of truth for every color token. Switching themes is a single `data-theme` attribute flip on `<html>`, which triggers CSS cascade — no JavaScript re-render of every component.
- **React Context for theme state**: A lightweight `ThemeContext` wraps the app in `layout.tsx`. Components that need the current theme (e.g., `ThemeToggle`) subscribe via `useTheme()`. Components that only need to look correct (cards, backgrounds) rely purely on CSS variables and need no JS coupling.
- **Framer Motion for all animations**: The library is already installed. We standardise on a shared `variants` object exported from `lib/animations.ts` so animation parameters are consistent and easy to tune.
- **Web Speech API with graceful degradation**: Feature-detected at runtime; the microphone button is hidden when the API is unavailable. No polyfill is added.

---

## Architecture

```
src/
├── app/
│   ├── globals.css          ← CSS variable definitions (light + dark tokens)
│   ├── layout.tsx           ← ThemeProvider wraps children; html[data-theme] set here
│   ├── page.tsx             ← Landing page (enhanced Navbar, scroll animations)
│   └── use/
│       └── page.tsx         ← Chat page (voice search, enhanced Navbar)
├── components/
│   ├── Navbar.tsx           ← Shared glassmorphism navbar with ThemeToggle
│   ├── ThemeToggle.tsx      ← Sun/Moon icon button
│   └── VoiceSearchButton.tsx← Microphone button with listening animation
├── context/
│   └── ThemeContext.tsx     ← ThemeProvider + useTheme hook
└── lib/
    └── animations.ts        ← Shared Framer Motion variants
```

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│  layout.tsx                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │  ThemeProvider                              │   │
│  │  - reads localStorage on mount             │   │
│  │  - sets html[data-theme]                   │   │
│  │  - exposes { theme, toggleTheme }          │   │
│  │                                             │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  Navbar (shared)                     │  │   │
│  │  │  - ThemeToggle calls toggleTheme()   │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │                                             │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  page.tsx / use/page.tsx             │  │   │
│  │  │  - reads CSS variables via Tailwind  │  │   │
│  │  │  - VoiceSearchButton (use page only) │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### ThemeContext (`context/ThemeContext.tsx`)

```typescript
type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

// Hook
function useTheme(): ThemeContextValue

// Provider — wraps children in layout.tsx
function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element
```

**Behaviour:**
1. On mount, reads `localStorage.getItem('vidquery-theme')`.
2. Falls back to `'light'` if nothing is stored.
3. Sets `document.documentElement.setAttribute('data-theme', theme)` whenever `theme` changes.
4. Persists to `localStorage` on every toggle.

---

### ThemeToggle (`components/ThemeToggle.tsx`)

```typescript
function ThemeToggle(): JSX.Element
```

- Calls `useTheme()` to get `{ theme, toggleTheme }`.
- Renders a `<motion.button>` with `whileHover={{ scale: 1.1 }}` and `whileTap={{ scale: 0.9 }}`.
- Displays `<Sun />` icon when `theme === 'dark'` (clicking will switch to light), `<Moon />` when `theme === 'light'`.
- Positioned in the Navbar's right-hand flex group.
- `aria-label` reflects the action: `"Switch to dark mode"` / `"Switch to light mode"`.

---

### Navbar (`components/Navbar.tsx`)

```typescript
interface NavbarProps {
  variant?: 'landing' | 'chat'  // controls which links are shown
}

function Navbar({ variant = 'landing' }: NavbarProps): JSX.Element
```

Replaces the inline `Navbar` functions in both pages. Applies:
- `sticky top-0 z-50`
- `bg-[var(--color-surface)]/80 backdrop-blur-md`
- `border-b border-[var(--color-border)]`
- `transition-colors duration-300` for theme transitions

---

### VoiceSearchButton (`components/VoiceSearchButton.tsx`)

```typescript
interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void
  onError: (message: string) => void
}

function VoiceSearchButton({ onResult, onError }: VoiceSearchButtonProps): JSX.Element | null
```

- Returns `null` when `typeof window !== 'undefined' && !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)`.
- Manages internal `isListening: boolean` state.
- On click: creates a `SpeechRecognition` instance, sets `continuous = false`, `interimResults = false`, calls `.start()`.
- `onresult` handler: extracts `event.results[0][0].transcript`, calls `onResult(transcript)`, sets `isListening = false`.
- `onerror` handler: calls `onError(event.error)`, sets `isListening = false`.
- While listening: renders a pulsing red `<Mic />` icon via Framer Motion `animate={{ scale: [1, 1.2, 1] }}` with `repeat: Infinity`.
- While idle: renders a static `<Mic />` icon.

---

### Shared Animation Variants (`lib/animations.ts`)

```typescript
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
}

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -10, scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2, ease: 'easeOut' } },
  tap: { scale: 0.95 },
}
```

---

## Data Models

### Theme Token Map

Defined in `globals.css`. All color values are CSS custom properties consumed by Tailwind v4's `@theme` block and directly in component class names via `var(--token)`.

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* Expose tokens to Tailwind utilities */
  --color-surface: var(--color-surface);
  --color-surface-elevated: var(--color-surface-elevated);
  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-border: var(--color-border);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
}

/* Light mode (default) */
:root {
  --color-surface: #ffffff;
  --color-surface-elevated: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: #dc2626;       /* red-600 */
  --color-accent-hover: #b91c1c; /* red-700 */
  --color-shadow: rgba(0, 0, 0, 0.08);
  --color-glass-bg: rgba(255, 255, 255, 0.8);
  --color-glass-border: rgba(255, 255, 255, 0.3);
}

/* Dark mode */
[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-surface-elevated: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
  --color-accent: #ef4444;       /* red-500 (slightly brighter on dark) */
  --color-accent-hover: #dc2626;
  --color-shadow: rgba(0, 0, 0, 0.4);
  --color-glass-bg: rgba(15, 23, 42, 0.8);
  --color-glass-border: rgba(255, 255, 255, 0.08);
}

/* Smooth theme transition on all elements */
*, *::before, *::after {
  transition: background-color 300ms ease, color 300ms ease,
              border-color 300ms ease, box-shadow 300ms ease;
}
```

### Theme State (in-memory, React Context)

```typescript
interface ThemeState {
  theme: 'light' | 'dark'   // current active theme
}
```

Persisted to `localStorage` under key `'vidquery-theme'` as a plain string (`'light'` or `'dark'`).

### Voice Search State (component-local)

```typescript
interface VoiceSearchState {
  isListening: boolean          // microphone is active
  isSupported: boolean          // Web Speech API available
}
```

No persistence — resets on component unmount.

### Message Model (existing, unchanged)

```typescript
type Message = {
  role: 'user' | 'bot'
  content: string
  isError?: boolean
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Before writing the final properties, reviewing for redundancy:

- **1.4 (localStorage persist) and 1.5 (localStorage restore)** are two halves of the same round-trip: write then read. They can be combined into a single "theme persistence round-trip" property.
- **1.8 (icon reflects theme)** is independent — it tests the rendering logic, not storage.
- **3.2 (stagger delay) and 3.6 (transition duration range)** test different aspects of the animation system and are not redundant.
- **3.8 (scroll fade-in) and 6.2 (scroll translate)** both test scroll animation behavior but cover different axes (opacity vs position). They can be combined into one "scroll animation entry" property.
- **4.6-4.7 (transcript populates field)** is a single round-trip property.
- **4.9 (error displayed for any error type)** is independent.
- **7.5 (message fade-in)** is independent.
- **3.9 (easing values)** is independent.

After reflection: 7 distinct properties remain.

---

### Property 1: Theme Persistence Round-Trip

*For any* theme value in `{'light', 'dark'}`, after the `ThemeProvider` sets that theme (via toggle or initial load), `localStorage.getItem('vidquery-theme')` should equal that theme value, and `document.documentElement.getAttribute('data-theme')` should also equal that theme value.

**Validates: Requirements 1.4, 1.5**

---

### Property 2: Theme Toggle Icon Reflects Current Theme

*For any* theme value in `{'light', 'dark'}`, the `ThemeToggle` component should render the `Moon` icon when `theme === 'light'` and the `Sun` icon when `theme === 'dark'`.

**Validates: Requirements 1.8**

---

### Property 3: Feature Card Stagger Delay

*For any* feature card at index `i` (where `i >= 0`), the animation delay applied to that card should equal `i * 0.1` seconds.

**Validates: Requirements 3.2**

---

### Property 4: Interactive Element Transition Duration

*For any* interactive element (button, card, link) that defines a Framer Motion transition, its duration should be greater than or equal to 0.2 seconds and less than or equal to 0.5 seconds.

**Validates: Requirements 3.6**

---

### Property 5: Scroll Animation Entry

*For any* element configured with `whileInView` scroll animation, its `initial` state should have `opacity: 0` and a non-zero `y` offset, and its `whileInView` state should have `opacity: 1` and `y: 0`.

**Validates: Requirements 3.8, 6.2**

---

### Property 6: Voice Search Transcript Population

*For any* non-empty transcript string returned by the `SpeechRecognition` `onresult` event, the query input field value should be set to exactly that transcript string.

**Validates: Requirements 4.6, 4.7**

---

### Property 7: Voice Search Error Display

*For any* error event fired by `SpeechRecognition` (regardless of error type), the `VoiceSearchButton` should call the `onError` callback with a non-empty error message string.

**Validates: Requirements 4.9**

---

## Error Handling

### Theme System

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | Wrap reads/writes in `try/catch`; fall back to in-memory state only |
| Invalid value in `localStorage` (e.g. `'purple'`) | Treat as missing; default to `'light'` |
| `document` not available (SSR) | Guard with `typeof document !== 'undefined'` before setting `data-theme` |

### Voice Search

| Scenario | Handling |
|---|---|
| `SpeechRecognition` not in `window` | Return `null` from component (button hidden) |
| `onerror: 'not-allowed'` | Call `onError('Microphone permission denied. Please allow access and try again.')` |
| `onerror: 'no-speech'` | Call `onError('No speech detected. Please try again.')` |
| `onerror: 'network'` | Call `onError('Network error during speech recognition. Please check your connection.')` |
| `onerror: other` | Call `onError('Speech recognition error. Please try again.')` |
| Component unmounts while listening | Call `recognition.abort()` in `useEffect` cleanup |

### Animation System

| Scenario | Handling |
|---|---|
| `prefers-reduced-motion` media query | Wrap animation variants with a `useReducedMotion()` hook from Framer Motion; return instant transitions when true |
| Framer Motion not loaded | Animations are progressive enhancement; layout remains functional without them |

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and error conditions. Property-based tests verify universal properties across all valid inputs. Both are necessary for comprehensive coverage.

### Property-Based Testing

**Library**: [`fast-check`](https://github.com/dubzzz/fast-check) — the standard PBT library for TypeScript/JavaScript.

**Configuration**: Each property test runs a minimum of 100 iterations (`numRuns: 100`).

**Tag format**: Each test is tagged with a comment:
```
// Feature: ui-ux-enhancement, Property N: <property_text>
```

**Properties to implement**:

| Property | Test File | Arbitraries |
|---|---|---|
| 1: Theme persistence round-trip | `ThemeContext.test.tsx` | `fc.constantFrom('light', 'dark')` |
| 2: Toggle icon reflects theme | `ThemeToggle.test.tsx` | `fc.constantFrom('light', 'dark')` |
| 3: Feature card stagger delay | `animations.test.ts` | `fc.integer({ min: 0, max: 20 })` |
| 4: Interactive element transition duration | `animations.test.ts` | `fc.constantFrom(...interactiveElements)` |
| 5: Scroll animation entry | `animations.test.ts` | `fc.constantFrom(...scrollElements)` |
| 6: Voice transcript population | `VoiceSearchButton.test.tsx` | `fc.string({ minLength: 1 })` |
| 7: Voice error display | `VoiceSearchButton.test.tsx` | `fc.constantFrom('not-allowed', 'no-speech', 'network', 'audio-capture', 'aborted')` |

### Unit Tests

Focus on specific examples and edge cases not covered by properties:

- `ThemeContext`: default to `'light'` when localStorage is empty (Req 1.6)
- `ThemeContext`: handle invalid localStorage value gracefully
- `ThemeContext`: SSR guard (no `document` access during server render)
- `VoiceSearchButton`: returns `null` when `SpeechRecognition` is unavailable (Req 4.11)
- `VoiceSearchButton`: shows pulsing animation while `isListening = true` (Req 4.5)
- `VoiceSearchButton`: stops animation after `onresult` fires (Req 4.8)
- `TypingIndicator`: renders exactly 3 dots (Req 7.2)
- `TypingIndicator`: has `repeat: Infinity` on dot animation (Req 7.3)
- `TypingIndicator`: exit transition duration is 0.1s (Req 7.4)
- `Navbar`: renders `ThemeToggle` in right-side container (Req 1.7, 5.6)

### Integration Tests

Verify existing flows remain intact after enhancement (Req 8.1–8.9):

- Landing page renders without errors with `ThemeProvider` wrapping
- Chat page form submission still calls the backend API correctly
- Navigation from landing page to `/use` works
- Build completes without TypeScript or ESLint errors (`npm run build`)

### Test Runner

**Vitest** (compatible with Next.js 16 + React 19, no additional config needed beyond `vitest.config.ts`). Run with `vitest --run` for single-pass CI execution.

### Manual / Visual Testing

- Theme toggle: verify smooth 300ms color transition in Chrome, Firefox, Safari, Edge
- Glassmorphism: verify backdrop-blur renders correctly across browsers
- Voice search: test with Chrome (full support), Firefox (no support — button hidden), Safari (webkit prefix)
- Responsive layout: test at 320px, 768px, 1280px, 1920px breakpoints
- Reduced motion: verify animations are suppressed when `prefers-reduced-motion: reduce` is set
