import Database from 'better-sqlite3';
import path from 'path';
import type { Daycare, DaycareInput, Note, Stage } from '$lib/types';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
	CREATE TABLE IF NOT EXISTS daycares (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		address TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		website TEXT DEFAULT '',
		capacity INTEGER,
		price TEXT DEFAULT '',
		hours TEXT DEFAULT '',
		age_range TEXT DEFAULT '',
		rating REAL,
		stage TEXT DEFAULT 'to_research',
		position INTEGER DEFAULT 0,
		hidden INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		daycare_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (daycare_id) REFERENCES daycares(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_daycares_stage ON daycares(stage);
	CREATE INDEX IF NOT EXISTS idx_notes_daycare_id ON notes(daycare_id);
`);

// Migration: Add hidden column if it doesn't exist (for existing databases)
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN hidden INTEGER DEFAULT 0`);
} catch {
	// Column already exists, ignore error
}

// Migration: Add email column if it doesn't exist
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN email TEXT DEFAULT ''`);
} catch {
	// Column already exists, ignore error
}

// Daycare CRUD operations
export function getAllDaycares(): Daycare[] {
	return db.prepare('SELECT * FROM daycares ORDER BY stage, position').all() as Daycare[];
}

export function getDaycaresByStage(stage: Stage): Daycare[] {
	return db
		.prepare('SELECT * FROM daycares WHERE stage = ? ORDER BY position')
		.all(stage) as Daycare[];
}

export function getDaycareById(id: number): Daycare | undefined {
	return db.prepare('SELECT * FROM daycares WHERE id = ?').get(id) as Daycare | undefined;
}

export function createDaycare(input: DaycareInput): Daycare {
	const stage = input.stage || 'to_research';
	const maxPosition = db
		.prepare('SELECT COALESCE(MAX(position), -1) as max FROM daycares WHERE stage = ?')
		.get(stage) as { max: number };

	const result = db
		.prepare(
			`INSERT INTO daycares (name, address, phone, email, website, capacity, price, hours, age_range, rating, stage, position)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.name,
			input.address || '',
			input.phone || '',
			input.email || '',
			input.website || '',
			input.capacity ?? null,
			input.price || '',
			input.hours || '',
			input.age_range || '',
			input.rating ?? null,
			stage,
			maxPosition.max + 1
		);

	return getDaycareById(result.lastInsertRowid as number)!;
}

export function updateDaycare(id: number, input: Partial<DaycareInput>): Daycare | undefined {
	const existing = getDaycareById(id);
	if (!existing) return undefined;

	const updates: string[] = [];
	const values: (string | number | null)[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		values.push(input.name);
	}
	if (input.address !== undefined) {
		updates.push('address = ?');
		values.push(input.address);
	}
	if (input.phone !== undefined) {
		updates.push('phone = ?');
		values.push(input.phone);
	}
	if (input.website !== undefined) {
		updates.push('website = ?');
		values.push(input.website);
	}
	if (input.capacity !== undefined) {
		updates.push('capacity = ?');
		values.push(input.capacity);
	}
	if (input.price !== undefined) {
		updates.push('price = ?');
		values.push(input.price);
	}
	if (input.hours !== undefined) {
		updates.push('hours = ?');
		values.push(input.hours);
	}
	if (input.age_range !== undefined) {
		updates.push('age_range = ?');
		values.push(input.age_range);
	}
	if (input.rating !== undefined) {
		updates.push('rating = ?');
		values.push(input.rating);
	}
	if (input.hidden !== undefined) {
		updates.push('hidden = ?');
		values.push(input.hidden ? 1 : 0);
	}

	if (updates.length > 0) {
		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);
		db.prepare(`UPDATE daycares SET ${updates.join(', ')} WHERE id = ?`).run(...values);
	}

	return getDaycareById(id);
}

export function moveDaycare(id: number, newStage: Stage, newPosition: number): Daycare | undefined {
	const existing = getDaycareById(id);
	if (!existing) return undefined;

	const oldStage = existing.stage;
	const oldPosition = existing.position;

	db.transaction(() => {
		if (oldStage === newStage) {
			// Moving within the same stage
			if (newPosition > oldPosition) {
				// Moving down
				db.prepare(
					'UPDATE daycares SET position = position - 1 WHERE stage = ? AND position > ? AND position <= ?'
				).run(oldStage, oldPosition, newPosition);
			} else if (newPosition < oldPosition) {
				// Moving up
				db.prepare(
					'UPDATE daycares SET position = position + 1 WHERE stage = ? AND position >= ? AND position < ?'
				).run(oldStage, newPosition, oldPosition);
			}
		} else {
			// Moving to a different stage
			// Close gap in old stage
			db.prepare('UPDATE daycares SET position = position - 1 WHERE stage = ? AND position > ?').run(
				oldStage,
				oldPosition
			);
			// Make room in new stage
			db.prepare('UPDATE daycares SET position = position + 1 WHERE stage = ? AND position >= ?').run(
				newStage,
				newPosition
			);
		}

		// Update the daycare
		db.prepare(
			'UPDATE daycares SET stage = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
		).run(newStage, newPosition, id);
	})();

	return getDaycareById(id);
}

export function deleteDaycare(id: number): boolean {
	const existing = getDaycareById(id);
	if (!existing) return false;

	db.transaction(() => {
		// Close gap in stage
		db.prepare('UPDATE daycares SET position = position - 1 WHERE stage = ? AND position > ?').run(
			existing.stage,
			existing.position
		);
		// Delete the daycare
		db.prepare('DELETE FROM daycares WHERE id = ?').run(id);
	})();

	return true;
}

// Notes CRUD operations
export function getNotesByDaycareId(daycareId: number): Note[] {
	return db
		.prepare('SELECT * FROM notes WHERE daycare_id = ? ORDER BY created_at DESC')
		.all(daycareId) as Note[];
}

export function createNote(daycareId: number, content: string): Note {
	const result = db
		.prepare('INSERT INTO notes (daycare_id, content) VALUES (?, ?)')
		.run(daycareId, content);

	return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as Note;
}

export function deleteNote(id: number): boolean {
	const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
	return result.changes > 0;
}

// Bulk import for CSV
export function bulkCreateDaycares(daycares: DaycareInput[]): Daycare[] {
	const created: Daycare[] = [];

	db.transaction(() => {
		for (const input of daycares) {
			created.push(createDaycare(input));
		}
	})();

	return created;
}
