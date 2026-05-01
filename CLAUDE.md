# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Important: Next.js version

This project uses **Next.js 16.2.4 + React 19.2.4 + Tailwind v4**. Per `AGENTS.md`, do not assume your training data matches this version — consult `node_modules/next/dist/docs/01-app/` before changing routing, config, fonts, metadata, or build behavior.

## Commands

```bash
npm run dev      # next dev — start dev server at http://localhost:3000
npm run build    # next build — production build
npm run start    # next start — serve the production build
npm run lint     # eslint (flat config, eslint.config.mjs)
```

There is no test runner configured.

## Architecture

The entire app is a single page that renders one component:

- `app/page.tsx` → renders `<Genealogy />`
- `app/layout.tsx` → loads Inter via `next/font/google`, sets dark `#0f0d0a` body background
- `components/Genealogy.tsx` — **the whole app** (~1000 lines, `"use client"`). Everything below describes its internals.

### Genealogy.tsx internal structure (in file order)

1. **Types** (`PersonNode`, `LayoutPosition`, `Connection`) — `NodeType` is `"patriarch" | "king" | "son" | "mother"`.
2. **Data** — a hardcoded nested `PersonNode` tree built with the `N(id, name, type, info, children)` helper. The full Abraham→Jesus genealogy lives inline as one `const data` literal. To add or edit a person, edit this tree — there is no external data file.
3. **Flatten** — `allNodes` is a derived `Record<id, PersonNode>` walked once at module load for O(1) ID lookup.
4. **Layout** — custom recursive algorithm (`computeHeight` + `layoutTree`), **not** `d3.hierarchy`. Each expanded node's vertical span equals the sum of its expanded descendants' spans. `X_UNIT = 220`, `Y_UNIT = 70`. Connections are computed separately (`getConnections`); a connection is flagged `isMarriage` when the child node's type is `"mother"`, which triggers different rendering.
5. **Design tokens** — colors live in the `C` object; the font stack is in `FONT`. Use these instead of hardcoding values. Node sizes are computed by `getNodeSize` keyed on `node.type` and `node.pivot`.
6. **Rendering** — pure SVG (`<NodeShape />`, `<ConnectionPath />`). No HTML-in-foreignObject. Node click toggles expansion (`expandedIds: Set<string>`) and selection (`selectedId`).
7. **Detail panel** — `<DetailPanel />` is an HTML overlay (not SVG) that reads `node.summary / significance / events / refs`.
8. **Main component** — `Genealogy` owns all state. D3 is used **only** for zoom/pan behavior (`d3.zoom`) bound to the SVG via `useEffect`; the `<g>` transform is set imperatively in the zoom handler (it does not flow through React state) while `zoomLevel` mirrors the scale for the HUD readout.

### Conventions specific to this codebase

- Path alias: `@/*` → repo root (e.g. `@/components/Genealogy`).
- Inline `style={{ ... }}` is the norm in `Genealogy.tsx` — Tailwind is loaded but barely used inside the component. Prefer the existing inline-style + `C` token pattern when editing this file rather than introducing Tailwind classes mid-component.
- `"mother"` nodes are rendered as rounded pills and connected with a different stroke; treat them as marriage links, not descent links.
- `pivot: true` flags theologically-load-bearing nodes (Abraham, Isaac, Jacob, Judah, David, Jesus, …) and changes border color and node size — don't repurpose the flag.
- `lucide-react` is pinned at the very old `^1.14.0`. Only the icons already imported (`X, ZoomIn, ZoomOut, Maximize2, BookOpen, Calendar, Sparkles`) are known to exist at that version; verify before importing new ones.
