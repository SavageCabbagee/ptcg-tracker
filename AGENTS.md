# AGENTS.md

This file gives Codex and other AI agents the working context for this repo. Read it before making changes.

## Project Overview

`ptcg-tracker` is a Vite + React + TypeScript app for tracking Pokemon TCG collection cards. It uses:

- React 18 with functional components
- TypeScript project references
- Zustand for client-side collection state
- Tailwind CSS for styling
- `lucide-react` for icons
- Static seed data from `public/data/collection.json`

There is no backend in this repo. The app loads bundled JSON data in the browser, can load/save collection data through the GitHub REST API using a user-provided PAT, and manages edits in client state.

The app is intended to remain a GitHub Pages-hosted static frontend. GitHub storage is client-side only: users provide a fine-grained PAT with repository Contents read/write access, and the browser talks directly to GitHub.

## Common Commands

Run these from the repo root:

```bash
npm run dev
npm run build
npm run preview
```

`npm run build` is the main verification command. It runs `tsc -b` and then `vite build`.

There is currently no test script or lint script defined in `package.json`.

## Important Paths

- `src/App.tsx`: top-level app state wiring and page composition.
- `src/types.ts`: shared collection, card, and sort types.
- `src/collectionStore.ts`: Zustand store, normalization, card CRUD, and collection sorting.
- `src/collectionIO.ts`: loading, parsing, and normalizing collection JSON.
- `src/githubStorage.ts`: GitHub API load/save behavior for split collection files.
- `src/cardUtils.ts`: card sorting, labels, and search matching.
- `src/constants.ts`: default draft values and constants.
- `src/components/`: reusable UI components.
- `src/components/GitHubStoragePanel.tsx`: GitHub storage settings and explicit load/save controls.
- `src/styles.css`: Tailwind layers and shared component classes.
- `public/data/collection.json`: bundled collection manifest loaded by the app.
- `public/data/collections/*.json`: per-theme card arrays referenced by the manifest.
- `public/data/dex.txt` and `dex/*.txt`: Pokemon dex data files.
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow.

## Architecture Notes

- Keep card data shaped around `CollectionCard`, `CardDraft`, `CardList`, `CardSubgroup`, `CollectionFile`, and related types in `src/types.ts`.
- Keep input cleanup and defensive data normalization close to `collectionIO.ts` and `collectionStore.ts`.
- `collectionIO.ts` handles unknown external JSON. Prefer explicit validation and normalization there.
- `collectionIO.ts` also owns serialization for the split GitHub storage layout. Preserve manifest file paths when round-tripping.
- `collectionStore.ts` owns in-memory collection behavior. Preserve existing sorting and normalization behavior unless the task is specifically to change it.
- `githubStorage.ts` owns GitHub REST API calls. Keep token handling out of persisted collection data, URLs, and status messages.
- UI state currently lives in `App.tsx`; reusable visual pieces live under `src/components/`.
- Search and sort helpers belong in `src/cardUtils.ts` when they are not tied to rendering.
- The primary UX is a dark, mobile-first card grid. Cards open the edit modal when tapped/clicked.
- Lists are switched from the desktop sidebar or the collapsible mobile header. Cards move between lists through the edit modal list selector.
- Sub-groups are optional groups within a list/collection, not top-level tabs. A card can have one optional `subgroupId`, scoped to its `listId`.
- Sub-group filtering lives in the active collection view. Keep the top-level sidebar/mobile list navigation focused on collections.
- The floating add button opens the same card form modal used for edits.

## Styling Guidelines

- Prefer Tailwind utility classes and existing shared classes from `src/styles.css`.
- Keep the current dark zinc/emerald visual language unless asked to redesign.
- Use `lucide-react` icons for icon buttons and controls when an icon exists.
- Match existing component patterns: compact controls, responsive layouts, and accessible focus states.
- Avoid broad visual rewrites when making a targeted behavior change.

## Data Guidelines

- Treat `public/data/collection.json` as user data. Do not reformat, regenerate, or overwrite it unless the task explicitly asks for that.
- Preserve unknown user edits in data files. Check `git status --short` before changing data.
- Bundled JSON remains the seed/fallback data. GitHub storage is an optional runtime source of truth after the user configures it.
- When parsing bundled data, accept legacy shapes where the current code already does so.
- Counts should remain non-negative integers, card language values are normalized to uppercase, and missing optional strings normalize to empty strings.
- A card with `count: 0` is treated as wishlisted. Wishlist is a computed view, not a persisted list ID.
- `CardList.subgroups` contains optional per-collection sub-group metadata. `CollectionCard.subgroupId` should be preserved only when it matches a sub-group on that card's collection.
- Sub-groups are stored in the collection manifest, while card `subgroupId` values are stored on individual cards. Do not split sub-groups into separate files unless explicitly requested.
- Default card language is `JP`; keep defaults centralized in `src/constants.ts`.
- `CollectionCard` / `CollectionFile` are enough for the current controlled JSON shape. Do not add schema docs unless explicitly requested.

## GitHub Storage Notes

- GitHub storage uses explicit Load and Save controls, plus auto-load on refresh when a valid stored token and repo config are present.
- The PAT and GitHub config are stored in `localStorage`; Disconnect clears both.
- The GitHub storage default data root is the repository root. A blank Data root means the app expects `collection.json` and `collections/*.json` at repo root.
- The split storage layout is:
  - `collection.json`: manifest with `collections[]` entries containing `id`, `name`, relative `file`, and optional `subgroups`.
  - `collections/*.json`: per-list card arrays referenced by the manifest. Cards may include optional `subgroupId`.
- Save uses GitHub git tree/commit/ref APIs to commit all changed split files together.
- Save conflict handling compares the loaded/saved branch commit SHA with the current branch head and blocks stale saves.
- Preserve each manifest entry's `file` path and `subgroups` on load/save. New lists fall back to `collections/<list-id>.json`.

## Deployment Notes

- GitHub Pages should use `Source: GitHub Actions` in repo settings.
- The deploy workflow builds with `npm ci` and `npm run build`, then uploads `dist`.
- Vite currently uses relative asset paths via `base: './'` for Pages compatibility.

## Coding Conventions

- Use TypeScript types from `src/types.ts` instead of duplicating shapes.
- Prefer small, focused functions and components over new broad abstractions.
- Keep imports relative and consistent with existing files.
- Use single quotes and semicolons, matching the current source.
- Keep files ASCII unless an existing file or user-facing data requires Unicode.
- Add comments only where they clarify non-obvious behavior.

## Verification

Before finishing a code change, run:

```bash
npm run build
```

If the change affects browser behavior, also run the dev server and inspect the app:

```bash
npm run dev
```

When reporting back, mention any verification that could not be run.

## Git And Workspace Safety

- The worktree may contain user changes. Do not revert or overwrite changes you did not make.
- Do not run destructive git commands such as `git reset --hard` or `git checkout --` unless the user explicitly asks.
- Keep changes scoped to the requested work.
- If user data files are already modified, avoid touching them unless needed for the request.
