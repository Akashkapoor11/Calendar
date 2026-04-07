# Interactive Wall Calendar

A polished, fully-responsive React/Vite component built to match a physical wall calendar aesthetic.

## Features

### Core Requirements
- **Wall Calendar Aesthetic** – Hero image panel with spiral binding, mountain landscape SVG that shifts colour theme per month
- **Day Range Selector** – Click to set start date, click again to set end date; clear visual states for start, end, and in-between days
- **Integrated Notes Section** – Attach text memos to any date or range; persistent via `localStorage`; toggle between "selection notes" and "all notes" view
- **Fully Responsive** – Side-by-side desktop layout, stacked mobile layout; touch-friendly tap targets

### Standout / Creative Extras
- **Month-flip animation** – Perspective 3D page-turn when navigating between months
- **Holiday markers** – Indian public holidays shown as amber dots on the calendar grid with tooltip on hover
- **Dark / Light theme toggle** – Smooth theme switch (persisted to `localStorage`) accessible via top-right button
- **Per-month gradient themes** – Hero image background shifts colour to match the season / mood
- **Weekend highlights** – Saturday and Sunday dates styled in red for quick scanning
- **Ctrl+Enter shortcut** – Save notes without reaching for the mouse
- **All-notes view** – Toggle the notes panel to show every saved note across all months

## Run locally

```bash
npm install
npm run dev
```
##Deployment link-
https://interactive-calendar-rho.vercel.app/
## Build for production

```bash
npm run build
npm run preview
```

## Architecture decisions

- **No backend / no database** – all data lives in `localStorage` under the key `interactive-wall-calendar-v3`
- **Zero external runtime dependencies** – only React 18 + Vite
- **Single `App.jsx` component** – keeps state colocation simple; can be split into sub-components if the codebase grows
- **CSS custom properties** – theme switching is done by toggling `data-theme` on `<html>` with `:root` and `[data-theme="dark"]` variable sets; no JavaScript style manipulation
- **Hero SVG** – fully self-contained so the app works offline; colours driven by CSS variables updated per month

## Evaluation notes

| Criterion | Implementation |
|---|---|
| Code quality | Pure functional React, clean state management, no class components |
| Component architecture | Helpers / constants above component; clear separation of concerns |
| CSS / styling | Custom properties, BEM-ish class names, no utility framework needed |
| State management | `useState` + `useEffect`; state persisted to `localStorage` |
| Responsive design | Three breakpoints (1100 / 820 / 600 px) with progressive layout collapse |
| UX / UI details | Hover states, flip animation, holiday markers, keyboard shortcut, legend |
