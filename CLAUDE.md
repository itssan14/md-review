# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install          # Install dependencies
bun run dev          # Vite dev server (frontend only, no CLI)
bun run build        # Build dist/index.html (required before running as CLI)
```

After building, run the CLI directly:

```sh
bun src/cli/index.ts <file.md>          # Run without global install
md-review <file.md>                     # After `bun link`
```

Global install workflow:

```sh
bun run build && bun link               # Build + link globally
bun unlink md-review                    # Uninstall
```

There are no tests.

## Architecture

This is a two-part project: a **Bun CLI/server** and a **SolidJS single-page app**, linked together at runtime via HTML injection.

### Build artifact dependency

`vite-plugin-singlefile` bundles the entire SolidJS app into a single `dist/index.html`. The CLI **requires this file to exist at runtime** — if it's missing, the server exits with an error. The HTML contains the placeholder string `__MD_REVIEW_DATA__` which the server replaces with JSON `{rawMarkdown, filename}` before serving.

### CLI (`src/cli/`)

- `index.ts` — Entry point; handles `install-skill` subcommand or reads the `.md` file and calls `startServer`
- `server.ts` — Bun HTTP server on port 3849+ (auto-increments to find a free port); injects markdown data into `dist/index.html`; exposes two POST endpoints:
  - `/done` — copies feedback to clipboard via `pbcopy`, server stays alive
  - `/post` — copies to clipboard, prints feedback to stdout (for agent piping), then exits after 300ms
- `install-skill.ts` — Copies `src/skills/claude-skill.md` to `~/.claude/skills/md-review.md`

### Frontend (`src/app/`)

SolidJS app with Tailwind CSS v4. Data flows from the injected JSON → `App.tsx` → components.

**Core data flow:**

1. `lib/line-map.ts` — Parses raw markdown source into `LineMapEntry[]` (block type + line number range). `matchBlockToMap()` then walks rendered DOM elements and matches each to its source line entry (first-match, marks `_used` to avoid duplicates).

2. `ContentArea.tsx` — Renders markdown via `marked` + `highlight.js`, assigns each block element a `data-line-start`/`data-line-end` attribute using the line map. Handles text selection → triggers a `CommentRequest` with the selected block element + line range.

3. `stores/comments.ts` — SolidJS store (module-level singleton) for the `Comment[]` array. `addComment`, `editComment`, `deleteComment` are the only mutation points.

4. `MarginCommentList.tsx` — Positions margin comment forms/cards in the right gutter, vertically aligned to their annotated block using `getBoundingClientRect()` relative offsets.

5. `lib/feedback.ts` — `buildFeedback()` serializes `Comment[]` + optional general text into the output format: `L5 [context...]: comment text`.

**Component breakdown:**
- `ContentArea` — markdown render + selection handling
- `MarginCommentList` — manages layout of all margin comments
- `MarginComment` — individual comment card (view/edit/delete)
- `CommentForm` — new comment input form (appears in margin at selection position)
- `GeneralComment` — unanchored textarea at bottom of content column
- `Toolbar` — fixed bottom bar with "Done & Copy" and "Post" buttons + filename display
- `Toast` — ephemeral notification overlay

**Hooks:**
- `useSystemTheme` — `prefers-color-scheme` media query → `"light" | "dark"` signal
- `useSelection` — text selection detection; fires callback when user finishes selecting within the content area

**Lib:**
- `lib/markdown.ts` — `marked` configuration with `highlight.js` integration
- `lib/mermaid.ts` — dynamic mermaid import + `reinitMermaid()` for theme changes
- `lib/selection.ts` — DOM utility for finding the nearest annotatable block ancestor

### Skills (`src/skills/`)

`claude-skill.md` is the Claude Code skill definition installed by `md-review install-skill`. It instructs Claude to invoke `md-review <file>` when asked to review markdown documents.
