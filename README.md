# Abraham to Jesus

An interactive lineage from Abraham through the twelve tribes, the Davidic kings, the exile, and the post-exilic line to Jesus of Nazareth. Click a name to expand its descendants and read context on the figure: era, role, key events, and biblical references.

The tree intentionally surfaces both the **legal line through Joseph** (Matthew 1) and the **biological line through Mary** (Luke 3) where they diverge, and renders matriarchs as marriage links rather than descent links so the covenant family reads correctly.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind v4 (PostCSS) — minimal usage; most styling is inline with a shared token palette
- D3 v7 — used only for `d3.zoom` (pan/zoom behavior). Layout is a custom recursive algorithm.
- lucide-react — toolbar icons

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

Requires Node.js compatible with Next.js 16 (Node 20+).

## Using the visualization

- **Click** any node to expand its children and open the detail panel.
- **Scroll** to zoom, **drag** to pan.
- **Expand all** opens every branch; **Reset** collapses back to Abraham; the **fit-to-screen** button frames the currently expanded tree.
- Pivot figures (Abraham, Isaac, Jacob, Judah, David, Jesus, …) are drawn with a heavier border. Mothers appear as rounded pills connected via marriage links.

## Editing the genealogy

All data lives inline in `components/Genealogy.tsx` as a single `PersonNode` tree built with the `N(id, name, type, info, children)` helper. To add a person, edit that tree — there is no external data file or database. Each node carries `era`, `date`, `role`, `summary`, `significance`, `events`, and `refs` (biblical citations).

## Architecture

See [`CLAUDE.md`](./CLAUDE.md) for the file-by-file walkthrough, layout algorithm, design tokens, and conventions (pivot flag, mother-as-marriage rendering, the D3-zoom-only pattern).

## Sources

The narrative summaries draw on the Hebrew Bible (Genesis, Ruth, 1–2 Samuel, 1–2 Kings, 1–2 Chronicles, Ezra, Nehemiah), the Gospels (Matthew 1, Luke 3), and the Pauline reflection on Abraham (Romans 4, Galatians 3–4, Hebrews 11).
