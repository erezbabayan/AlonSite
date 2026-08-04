# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static Hebrew-language (RTL) memorial site for a fallen soldier (סגן אלון אברהם-חי בביאן ז״ל). No build step, no bundler, no framework — plain HTML/CSS/JS served by a tiny dependency-free Node server, styled with the Tailwind CDN (`https://cdn.tailwindcss.com`) plus a shared JS config object.

## Commands

Run the dev server (Node, no dependencies to install):

```bash
node server.js
```

Serves at `http://localhost:8420` (or `$PORT`). Always use the `mcp__Claude_Browser__preview_start` tool with the `static-site` config in `.claude/launch.json` rather than launching this manually — the site has no other way to preview.

Regenerate the photo gallery after adding/removing images in `media/images/<category>/`:

```bash
node scripts/generate-thumbs.js && node scripts/generate-gallery-data.js
```

`generate-thumbs.js` requires macOS `sips` (it's shell-only, not portable). It creates 900px-max JPEG thumbnails and skips ones that already exist, so re-running is safe. `generate-gallery-data.js` then rewrites `js/gallery-data.js` (auto-generated — do not hand-edit) by scanning `media/images/` directories and pairing each full image with its thumb.

There is no test suite, linter, or build/typecheck command in this repo.

## Architecture

**Pages** (all server-rendered HTML, no client routing): [index.html](index.html) at the root, plus [pages/gallery.html](pages/gallery.html), [pages/letters.html](pages/letters.html), [pages/sections.html](pages/sections.html) (letters/videos/audio hub), and [pages/disaster.html](pages/disaster.html) (the helicopter disaster memorial page). Each page is a standalone HTML file with its own `<head>`/SEO block and pulls in `shared.css` plus a page-specific stylesheet (e.g. `css/gallery.css`).

**Shared JS config, loaded on every page**: [js/tailwind-config.js](js/tailwind-config.js) defines the Tailwind color/radius/font tokens (Material Design–style token names like `surface-container-low`, `on-surface-variant`) as a single source of truth across pages.

**Shared behavior**: [js/site.js](js/site.js) is included on every page and owns cross-page concerns: the candle-lighting modal/list (backed by `/api/candles`), mobile nav toggle, the `--nav-h` CSS var (nav wraps to 2 lines on narrow screens, so real height is measured live rather than assumed), the ambient background song widget (autoplays muted, unmutes on first interaction, resumes position across page navigations via `sessionStorage`), the share button, scroll-to-top, scroll-reveal animations, and Hebrew-calendar yahrzeit date calculations (`Intl.DateTimeFormat` with `en-US-u-ca-hebrew`).

**Page-specific JS**: [js/gallery.js](js/gallery.js) (category filters + lightbox, reads `window.GALLERY_DATA`) and [js/letters.js](js/letters.js) (category filters + full-letter reader modal, reads `window.LETTERS_DATA`). Both follow the same pattern: render pills from category data, filter a flat list, open a modal/lightbox with prev/next + swipe + keyboard nav.

**Data files**: [js/gallery-data.js](js/gallery-data.js) is auto-generated (see Commands above) — never hand-edit. [js/letters-data.js](js/letters-data.js) is currently mock/placeholder content, hand-maintained, meant to be replaced with real letters later.

**Backend** ([server.js](server.js)): a single dependency-free Node HTTP server. Serves static files with path-traversal protection, and exposes `GET/POST /api/candles` backed by `data/candles.json` (gitignored — runtime data, shared across all visitors, replacing what used to be a localStorage-only per-browser candle list). No database, no auth.

**Visit notifications** ([notify-visit.php](notify-visit.php)): a 1×1 tracking-pixel beacon embedded near the top of every page's `<body>`, emails the site owner on every single page load (by design — no dedup/bot-filtering). Requires real PHP hosting with a working `mail()` transport; `server.js` cannot execute PHP, so this is inert in local dev and only fires once deployed.

**Design system**: [DESIGN.md](DESIGN.md) is the authoritative style spec ("Editorial Remembrance" / "Digital Sanctuary"). Key rules worth knowing before touching markup or CSS:
- No 1px solid borders for sectioning — use background-color shifts between surface tiers instead.
- No pure black; use `primary` (#1A2E44-ish navy) for high-contrast text.
- No drop shadows on static cards — use tonal layering (`surface-container-lowest` card on `surface-container-low` background) instead; shadows are reserved for floating/interactive elements, tinted from `on-surface` not black.
- No dividers/`<hr>` — negative space ends a thought.
- Glassmorphism (70% opacity + 12px backdrop-blur) for floating nav/FAB elements.
- Transitions are 300–600ms ease-out, never bouncy — the site should feel dignified, not app-like.
- All content is Hebrew RTL (`dir="rtl"`); maintain generous `line-height` (~1.6) for body text.

## Repo-specific conventions

- All source is under `css/`, `js/`, `pages/`; media under `media/` (images, videos, audio, icons, letters, ppts — many with Hebrew filenames/directory names, URL-encoded in generated data).
- Commit/push directly to `main` — this project doesn't use feature branches or PRs.
- Only one dev-server preview should run at a time; stop an existing one before starting another.
- When touching any page, make sure its SEO block (title, meta description, OG/Twitter tags, canonical URL) is present and accurate — see the `<head>` of [index.html](index.html) or [pages/gallery.html](pages/gallery.html) for the pattern to copy.
