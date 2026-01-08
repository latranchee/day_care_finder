# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run dev -- --open    # Start dev server and open browser

# Build & Preview
npm run build            # Production build
npm run preview          # Preview production build

# Type Checking
npm run check            # Run svelte-check (type checking)
npm run check:watch      # Run svelte-check in watch mode
```

## Architecture

This is a **SvelteKit 2 + Svelte 5** application for tracking daycare options through a Kanban-style workflow. It uses **better-sqlite3** for local persistence and **Tailwind CSS v4** for styling.

### Data Flow

- **Database**: SQLite file at `data/daycares.db` (created automatically)
- **Server**: `src/lib/server/db.ts` contains all database operations (CRUD for daycares and notes)
- **API Routes**: REST endpoints at `src/routes/api/` handle client requests
- **Page Load**: `+page.server.ts` loads daycares grouped by stage for SSR

### Key Concepts

**Kanban Stages**: Daycares flow through stages defined in `src/lib/types.ts`:
`to_research` → `to_contact` → `contacted` → `visited` → `waitlisted` → `decision_made`

**Drag-and-Drop**: Uses `svelte-dnd-action` for reordering cards within and across columns. Position updates are optimistic (UI updates immediately, API call follows).

**Types**: Core interfaces (`Daycare`, `Note`, `Stage`, `DaycareInput`) are in `src/lib/types.ts`

### Component Structure

- `+page.svelte` - Main Kanban board with columns and modals
- `KanbanColumn.svelte` - Individual stage column with drag-drop zone
- `DaycareCard.svelte` - Card representing a single daycare
- `DaycareModal.svelte` - Detail view/edit modal for a daycare
- `AddDaycare.svelte` - Form modal for creating new entries
- `ImportCSV.svelte` - CSV bulk import functionality

### API Endpoints

- `GET/POST /api/daycares` - List all / Create new
- `GET/PUT/DELETE /api/daycares/[id]` - Single daycare operations (PUT also handles stage/position moves)
- `POST/DELETE /api/daycares/[id]/notes` - Notes for a daycare
- `DELETE /api/notes/[id]` - Delete a note
- `POST /api/import` - Bulk CSV import

## Important: UTF-8 Encoding

This app contains French Canadian text with accented characters (é, è, ê, à, ç, etc.). **Always ensure proper UTF-8 handling:**

### When web scraping/crawling:
- Ensure responses are decoded as UTF-8
- Check the page's `Content-Type` header or `<meta charset>` tag
- If using fetch, the response should be read with proper encoding

### When importing data:
- CSV files should be UTF-8 encoded
- Verify accented characters display correctly before saving to database

### When adding notes or content:
- Never store text with `�` (replacement characters) - this indicates encoding corruption
- If you see mojibake (e.g., `Ã©` instead of `é`), fix the encoding at the source

### Testing:
- Verify French text like "Siège social", "Développement", "sécurisant" displays correctly

## Mandatory: Localization (i18n)

This app uses **Paraglide.js** for internationalization (English and French). **All user-facing text MUST be localized.**

### Translation Files
- `messages/en.json` - English translations
- `messages/fr.json` - French translations

### How to Use

1. **Import messages** in your Svelte component:
   ```ts
   import * as m from '$lib/paraglide/messages.js';
   ```

2. **Use translation functions** instead of hardcoded strings:
   ```svelte
   <!-- WRONG -->
   <button>Save Changes</button>
   <span title="Open settings">...</span>

   <!-- CORRECT -->
   <button>{m.btn_save()}</button>
   <span title={m.settings_title()}>...</span>
   ```

3. **For dynamic content with variables**, use parameterized messages:
   ```json
   // In messages/en.json
   "commute_progress": "Calculating {current} of {total}: {name}"
   ```
   ```svelte
   {m.commute_progress({ current: 5, total: 10, name: "Garderie ABC" })}
   ```

### Rules

- **NEVER hardcode user-facing text** in `.svelte` files
- This includes: button labels, headings, placeholders, title attributes, error messages, status messages
- When adding new features, add translation keys to BOTH `en.json` AND `fr.json`
- Keep translation keys descriptive: `btn_save`, `label_address`, `error_save_failed`
- Run `npm run check` to ensure Paraglide generates the message functions correctly
