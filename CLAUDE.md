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
