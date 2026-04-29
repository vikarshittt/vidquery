# Implementation Plan: UI/UX Enhancement

## Overview

Incrementally layer dark/light theme switching, glassmorphism visuals, Framer Motion animations, voice search, and scroll-triggered effects onto the existing VidQuery frontend. All existing business logic, API calls, and navigation flows remain untouched. New capabilities are introduced through a React Context provider, CSS variable overrides, and isolated component additions.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion (already installed).

## Tasks

- [x] 1. Set up CSS variables and theme tokens in `globals.css`
  - Replace the current empty `globals.css` (which only has `@import "tailwindcss"`) with the full token definitions from the design
  - Add `@theme` block to expose tokens to Tailwind v4 utilities
  - Define `:root` light-mode custom properties: `--color-surface`, `--color-surface-elevated`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-shadow`, `--color-glass-bg`, `--color-glass-border`
  - Define `[data-theme="dark"]` overrides for all the same properties
  - Add the global `*, *::before, *::after` transition rule for 300ms smooth theme switching
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 3.7_

- [x] 2. Implement `ThemeContext` and `useTheme` hook
  - [x] 2.1 Create `src/context/ThemeContext.tsx`
    - Define `Theme = 'light' | 'dark'` type and `ThemeContextValue` interface
    - Implement `ThemeProvider` component: read `localStorage.getItem('vidquery-theme')` on mount, fall back to `'light'` if missing or invalid, set `document.documentElement.setAttribute('data-theme', theme)` on every theme change, persist to `localStorage` on every toggle
    - Guard all `localStorage` and `document` access with `try/catch` and `typeof` checks for SSR safety
    - Export `useTheme()` hook that throws if used outside `ThemeProvider`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property test for theme persistence round-trip
    - **Property 1: Theme Persistence Round-Trip**
    - For any theme value in `{'light', 'dark'}`, after `ThemeProvider` sets that theme, `localStorage.getItem('vidquery-theme')` and `document.documentElement.getAttribute('data-theme')` should both equal that theme value
    - Use `fc.constantFrom('light', 'dark')` as the arbitrary
    - Tag: `// Feature: ui-ux-enhancement, Property 1: Theme persistence round-trip`
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 2.3 Write unit tests for `ThemeContext`
    - Test: defaults to `'light'` when `localStorage` is empty (Req 1.6)
    - Test: handles invalid `localStorage` value gracefully (e.g. `'purple'` → `'light'`)
    - Test: SSR guard — no `document` access during server render
    - _Requirements: 1.5, 1.6_

- [x] 3. Implement `ThemeToggle` component
  - [x] 3.1 Create `src/components/ThemeToggle.tsx`
    - Call `useTheme()` to get `{ theme, toggleTheme }`
    - Render a `<motion.button>` with `whileHover={{ scale: 1.1 }}` and `whileTap={{ scale: 0.9 }}`
    - Display `<Sun />` icon when `theme === 'dark'` and `<Moon />` icon when `theme === 'light'`
    - Set `aria-label` to `"Switch to dark mode"` or `"Switch to light mode"` based on current theme
    - _Requirements: 1.7, 1.8, 1.9_

  - [ ]* 3.2 Write property test for toggle icon reflecting current theme
    - **Property 2: Theme Toggle Icon Reflects Current Theme**
    - For any theme value in `{'light', 'dark'}`, `ThemeToggle` should render `Moon` when `theme === 'light'` and `Sun` when `theme === 'dark'`
    - Use `fc.constantFrom('light', 'dark')` as the arbitrary
    - Tag: `// Feature: ui-ux-enhancement, Property 2: Toggle icon reflects theme`
    - **Validates: Requirements 1.8**

- [x] 4. Create shared animation variants in `lib/animations.ts`
  - [x] 4.1 Create `src/lib/animations.ts`
    - Export `fadeInUp` variant: `hidden: { opacity: 0, y: 30 }`, `visible(i)`: `{ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }`
    - Export `fadeIn` variant: `hidden: { opacity: 0 }`, `visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } }`
    - Export `scaleIn` variant: `hidden: { opacity: 0, scale: 0.8 }`, `visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } }`
    - Export `hoverLift` variant: `rest: { y: 0, scale: 1 }`, `hover: { y: -10, scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } }`
    - Export `buttonHover` variant: `rest: { scale: 1 }`, `hover: { scale: 1.05, transition: { duration: 0.2, ease: 'easeOut' } }`, `tap: { scale: 0.95 }`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.9_

  - [ ]* 4.2 Write property tests for animation variants
    - **Property 3: Feature Card Stagger Delay** — for any card index `i >= 0`, `fadeInUp.visible(i).transition.delay` should equal `i * 0.1`; use `fc.integer({ min: 0, max: 20 })` as the arbitrary; tag: `// Feature: ui-ux-enhancement, Property 3: Feature card stagger delay`; **Validates: Requirements 3.2**
    - **Property 4: Interactive Element Transition Duration** — for each interactive variant (`hoverLift.hover`, `buttonHover.hover`, `fadeIn.visible`, `scaleIn.visible`, `fadeInUp.visible(0)`), its `transition.duration` should be `>= 0.2` and `<= 0.5`; use `fc.constantFrom(...interactiveElements)` as the arbitrary; tag: `// Feature: ui-ux-enhancement, Property 4: Interactive element transition duration`; **Validates: Requirements 3.6**
    - **Property 5: Scroll Animation Entry** — for any element configured with `whileInView` using `fadeInUp`, its `initial` state should have `opacity: 0` and non-zero `y`, and its `whileInView` state should have `opacity: 1` and `y: 0`; use `fc.constantFrom(...scrollElements)` as the arbitrary; tag: `// Feature: ui-ux-enhancement, Property 5: Scroll animation entry`; **Validates: Requirements 3.8, 6.2**

- [x] 5. Implement shared `Navbar` component
  - [x] 5.1 Create `src/components/Navbar.tsx`
    - Accept `variant?: 'landing' | 'chat'` prop (default `'landing'`)
    - Apply `sticky top-0 z-50`, `bg-[var(--color-glass-bg)] backdrop-blur-md`, `border-b border-[var(--color-border)]`, `transition-colors duration-300`
    - Render the VidQuery logo (Youtube icon + styled text) with `motion.div whileHover={{ scale: 1.05 }}`
    - When `variant === 'landing'`: render Features, How It Works anchor links and the Get Started CTA button
    - When `variant === 'chat'`: render the New Chat link
    - Include `<ThemeToggle />` in the right-side flex group for both variants
    - _Requirements: 1.7, 2.1, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 5.2 Write unit test for Navbar rendering ThemeToggle
    - Test: `Navbar` renders `ThemeToggle` inside the right-side container for both `variant='landing'` and `variant='chat'`
    - _Requirements: 1.7, 5.6_

- [ ] 6. Implement `VoiceSearchButton` component
  - [x] 6.1 Create `src/components/VoiceSearchButton.tsx`
    - Accept `onResult: (transcript: string) => void` and `onError: (message: string) => void` props
    - On mount, detect `SpeechRecognition` / `webkitSpeechRecognition` availability; return `null` if unsupported (hides button entirely)
    - Manage `isListening: boolean` state
    - On click: create `SpeechRecognition` instance with `continuous = false`, `interimResults = false`, call `.start()`, set `isListening = true`
    - `onresult` handler: extract `event.results[0][0].transcript`, call `onResult(transcript)`, set `isListening = false`
    - `onerror` handler: map error types to user-friendly messages (`'not-allowed'` → permission denied, `'no-speech'` → no speech detected, `'network'` → network error, others → generic), call `onError(message)`, set `isListening = false`
    - Add `useEffect` cleanup that calls `recognition.abort()` on unmount while listening
    - While listening: render pulsing red `<Mic />` via `animate={{ scale: [1, 1.2, 1] }}` with `repeat: Infinity`
    - While idle: render static `<Mic />` icon
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [ ]* 6.2 Write property tests for `VoiceSearchButton`
    - **Property 6: Voice Search Transcript Population** — for any non-empty transcript string from `SpeechRecognition` `onresult`, the `onResult` callback should be called with exactly that string; use `fc.string({ minLength: 1 })` as the arbitrary; tag: `// Feature: ui-ux-enhancement, Property 6: Voice search transcript population`; **Validates: Requirements 4.6, 4.7**
    - **Property 7: Voice Search Error Display** — for any error event type (`'not-allowed'`, `'no-speech'`, `'network'`, `'audio-capture'`, `'aborted'`), `onError` should be called with a non-empty string; use `fc.constantFrom('not-allowed', 'no-speech', 'network', 'audio-capture', 'aborted')` as the arbitrary; tag: `// Feature: ui-ux-enhancement, Property 7: Voice search error display`; **Validates: Requirements 4.9**

  - [ ]* 6.3 Write unit tests for `VoiceSearchButton`
    - Test: returns `null` when `SpeechRecognition` is unavailable (Req 4.11)
    - Test: shows pulsing animation while `isListening = true` (Req 4.5)
    - Test: stops animation after `onresult` fires (Req 4.8)
    - _Requirements: 4.5, 4.8, 4.11_

- [x] 7. Checkpoint — wire up `ThemeProvider` in `layout.tsx`
  - Wrap `{children}` in `layout.tsx` with `<ThemeProvider>` imported from `context/ThemeContext`
  - Set `suppressHydrationWarning` on the `<html>` element to prevent React hydration mismatch from the `data-theme` attribute set by the provider
  - Ensure all existing font variables and metadata remain unchanged
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 1.5, 8.1, 8.2_

- [x] 8. Enhance landing page (`app/page.tsx`) with animations and scroll effects
  - [x] 8.1 Replace the inline `Navbar` function with the shared `<Navbar variant="landing" />`
    - Remove the old inline `Navbar` function entirely
    - Import and render `<Navbar variant="landing" />` at the top of `LandingPage`
    - _Requirements: 2.1, 5.1–5.7_

  - [x] 8.2 Apply `fadeInUp` and `scaleIn` variants to hero section
    - Replace inline `initial/animate` props on the hero text `motion.div` with `variants={fadeInUp}` and `initial="hidden" animate="visible"`
    - Replace inline `initial/animate` props on the hero animation `motion.div` with `variants={scaleIn}` and `initial="hidden" animate="visible"`
    - Import variants from `lib/animations`
    - _Requirements: 3.1, 3.9_

  - [x] 8.3 Apply `fadeInUp` with stagger and `hoverLift` to feature cards
    - Wrap the features grid in a `motion.div` with `initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}`
    - Replace inline `initial/whileInView/whileHover` props on each feature card `motion.div` with `variants={fadeInUp}` (passing `custom={i}` for stagger) and `whileHover` using `hoverLift`
    - _Requirements: 3.2, 3.4, 3.5, 6.1, 6.3, 6.4, 6.5_

  - [x] 8.4 Apply `fadeInUp` scroll animations to "How It Works" steps
    - Replace inline `initial/whileInView` props on each step `motion.div` with `variants={fadeInUp}` and `initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}`
    - _Requirements: 3.8, 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 8.5 Apply `buttonHover` variant to CTA buttons
    - Replace inline `whileHover/whileTap` props on the hero CTA `motion.a` and the CTA section `motion.a` with `variants={buttonHover}` and `initial="rest" whileHover="hover" whileTap="tap"`
    - _Requirements: 3.3, 3.6_

  - [x] 8.6 Update background and card colors to use CSS variables
    - Replace hardcoded `bg-white`, `bg-gray-100`, `text-gray-900`, `text-gray-600`, `border-gray-200` etc. with `bg-[var(--color-surface)]`, `text-[var(--color-text-primary)]`, `text-[var(--color-text-secondary)]`, `border-[var(--color-border)]` equivalents throughout the landing page
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.9, 2.11_

- [x] 9. Enhance chat page (`app/use/page.tsx`) with voice search and loading effects
  - [x] 9.1 Replace the inline `nav` element with the shared `<Navbar variant="chat" />`
    - Remove the old inline `nav` block
    - Import and render `<Navbar variant="chat" />` at the top of `ChatPage`
    - _Requirements: 2.4, 5.1–5.7_

  - [x] 9.2 Integrate `VoiceSearchButton` into the query input row
    - Import `VoiceSearchButton` from `components/VoiceSearchButton`
    - Add `<VoiceSearchButton onResult={(t) => setQuery(t)} onError={(msg) => setMessages(prev => [...prev, { role: 'bot', content: msg, isError: true }])} />` inside the query input `div`, positioned between the input and the send button
    - Ensure manual text input in the query field continues to work unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 8.3_

  - [x] 9.3 Verify `TypingIndicator` meets spec requirements
    - Confirm the existing `TypingIndicator` renders exactly 3 dots (Req 7.2)
    - Confirm each dot has `repeat: Infinity` on its animation (Req 7.3)
    - Confirm the `exit` transition duration is `0.1` seconds (Req 7.4)
    - Confirm new messages fade in over 300ms via `ChatMessage` `initial/animate` (Req 7.5)
    - Make any corrections needed to align with the design spec
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.4 Update background and card colors to use CSS variables
    - Replace hardcoded `bg-gray-100`, `bg-white`, `text-gray-900`, `border-gray-200` etc. with CSS variable equivalents throughout the chat page
    - _Requirements: 2.4, 2.5, 2.6, 2.8, 2.10, 2.12_

- [ ] 10. Set up Vitest and install `fast-check`
  - Install `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` as dev dependencies
  - Create `vitest.config.ts` at the Frontend root with jsdom environment and React plugin
  - Add `"test": "vitest --run"` script to `package.json`
  - Create `src/test/setup.ts` that imports `@testing-library/jest-dom`
  - _Requirements: 8.8_

- [ ] 11. Implement property-based and unit tests
  - [ ] 11.1 Create `src/__tests__/ThemeContext.test.tsx`
    - Implement Property 1 test (theme persistence round-trip) using `fc.constantFrom('light', 'dark')` with `numRuns: 100`
    - Implement unit tests: default to `'light'` when localStorage empty, handle invalid value, SSR guard
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ] 11.2 Create `src/__tests__/ThemeToggle.test.tsx`
    - Implement Property 2 test (toggle icon reflects theme) using `fc.constantFrom('light', 'dark')` with `numRuns: 100`
    - _Requirements: 1.8_

  - [ ] 11.3 Create `src/__tests__/animations.test.ts`
    - Implement Property 3 test (feature card stagger delay) using `fc.integer({ min: 0, max: 20 })` with `numRuns: 100`
    - Implement Property 4 test (interactive element transition duration) using `fc.constantFrom` over all interactive variants with `numRuns: 100`
    - Implement Property 5 test (scroll animation entry) using `fc.constantFrom` over scroll-configured elements with `numRuns: 100`
    - _Requirements: 3.2, 3.6, 3.8, 6.2_

  - [ ] 11.4 Create `src/__tests__/VoiceSearchButton.test.tsx`
    - Implement Property 6 test (voice transcript population) using `fc.string({ minLength: 1 })` with `numRuns: 100`
    - Implement Property 7 test (voice error display) using `fc.constantFrom('not-allowed', 'no-speech', 'network', 'audio-capture', 'aborted')` with `numRuns: 100`
    - Implement unit tests: returns `null` when API unavailable, pulsing animation while listening, stops animation after result
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 4.11_

- [x] 12. Final checkpoint — build verification and integration check
  - Run `npm run build` (or `next build --webpack`) from the Frontend directory and confirm it exits with code 0
  - Run `npm run test` (`vitest --run`) and confirm all tests pass
  - Verify no new TypeScript errors with `tsc --noEmit`
  - Confirm the browser console shows no new errors related to the enhancements when the app runs
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.8, 8.9_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 7 and 12) ensure incremental validation
- Property tests validate universal correctness properties across all valid inputs
- Unit tests validate specific examples and edge cases
- The `fast-check` library must be installed before running property tests (task 10)
- All animation variants are centralised in `lib/animations.ts` — tune durations there to affect the whole app
- The `suppressHydrationWarning` on `<html>` in `layout.tsx` is required to prevent React 19 hydration warnings from the server/client `data-theme` mismatch
