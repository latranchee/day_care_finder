import Database from 'better-sqlite3';
import path from 'path';
import type { Daycare, DaycareInput, Note, Review, ReviewInput, Contact, ContactInput, Stage } from '$lib/types';

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
		username TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (daycare_id) REFERENCES daycares(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS reviews (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		daycare_id INTEGER NOT NULL,
		text TEXT NOT NULL,
		source_url TEXT DEFAULT '',
		rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (daycare_id) REFERENCES daycares(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS contacts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		daycare_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		role TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		email TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		is_primary INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (daycare_id) REFERENCES daycares(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_daycares_stage ON daycares(stage);
	CREATE INDEX IF NOT EXISTS idx_notes_daycare_id ON notes(daycare_id);
	CREATE INDEX IF NOT EXISTS idx_reviews_daycare_id ON reviews(daycare_id);
	CREATE INDEX IF NOT EXISTS idx_contacts_daycare_id ON contacts(daycare_id);
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

// Migration: Add username column to notes if it doesn't exist
try {
	db.exec(`ALTER TABLE notes ADD COLUMN username TEXT`);
} catch {
	// Column already exists, ignore error
}

// Migration: Add facebook column to daycares if it doesn't exist
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN facebook TEXT DEFAULT ''`);
} catch {
	// Column already exists, ignore error
}

// Migration: Add commute time columns for tracking travel time from home
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN commute_minutes INTEGER`);
} catch {
	// Column already exists, ignore error
}
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN commute_origin TEXT DEFAULT ''`);
} catch {
	// Column already exists, ignore error
}
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN commute_destination TEXT DEFAULT ''`);
} catch {
	// Column already exists, ignore error
}
try {
	db.exec(`ALTER TABLE daycares ADD COLUMN commute_calculated_at DATETIME`);
} catch {
	// Column already exists, ignore error
}

// Migration: Migrate existing phone/email from daycares to contacts table
try {
	const daycaresWithContact = db
		.prepare("SELECT id, phone, email FROM daycares WHERE (phone != '' AND phone IS NOT NULL) OR (email != '' AND email IS NOT NULL)")
		.all() as { id: number; phone: string; email: string }[];

	for (const dc of daycaresWithContact) {
		// Check if contact already exists for this daycare
		const existing = db.prepare('SELECT id FROM contacts WHERE daycare_id = ?').get(dc.id);

		if (!existing && (dc.phone || dc.email)) {
			db.prepare(
				`INSERT INTO contacts (daycare_id, name, phone, email, is_primary) VALUES (?, 'Primary Contact', ?, ?, 1)`
			).run(dc.id, dc.phone || '', dc.email || '');
		}
	}
} catch {
	// Migration already ran or error
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
			`INSERT INTO daycares (name, address, phone, email, facebook, website, capacity, price, hours, age_range, rating, stage, position)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.name,
			input.address || '',
			input.phone || '',
			input.email || '',
			input.facebook || '',
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
	if (input.email !== undefined) {
		updates.push('email = ?');
		values.push(input.email);
	}
	if (input.facebook !== undefined) {
		updates.push('facebook = ?');
		values.push(input.facebook);
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

export function createNote(daycareId: number, content: string, username?: string): Note {
	const result = db
		.prepare('INSERT INTO notes (daycare_id, content, username) VALUES (?, ?, ?)')
		.run(daycareId, content, username || null);

	return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as Note;
}

export function deleteNote(id: number): boolean {
	const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
	return result.changes > 0;
}

// Reviews CRUD operations
export function getReviewsByDaycareId(daycareId: number): Review[] {
	return db
		.prepare('SELECT * FROM reviews WHERE daycare_id = ? ORDER BY created_at DESC')
		.all(daycareId) as Review[];
}

export function getFirstReviewByDaycareId(daycareId: number): Review | undefined {
	return db
		.prepare('SELECT * FROM reviews WHERE daycare_id = ? ORDER BY created_at DESC LIMIT 1')
		.get(daycareId) as Review | undefined;
}

export function createReview(daycareId: number, input: ReviewInput): Review {
	const result = db
		.prepare('INSERT INTO reviews (daycare_id, text, source_url, rating) VALUES (?, ?, ?, ?)')
		.run(daycareId, input.text, input.source_url || '', input.rating);

	return db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) as Review;
}

export function deleteReview(id: number): boolean {
	const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
	return result.changes > 0;
}

export function getReviewDaycareId(reviewId: number): number | undefined {
	const result = db
		.prepare('SELECT daycare_id FROM reviews WHERE id = ?')
		.get(reviewId) as { daycare_id: number } | undefined;
	return result?.daycare_id;
}

export function recalculateDaycareRating(daycareId: number): number | null {
	const result = db
		.prepare('SELECT AVG(rating) as avg_rating FROM reviews WHERE daycare_id = ?')
		.get(daycareId) as { avg_rating: number | null };

	const newRating = result.avg_rating ? Math.round(result.avg_rating * 10) / 10 : null;

	db.prepare('UPDATE daycares SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
		.run(newRating, daycareId);

	return newRating;
}

// Contacts CRUD operations
export function getContactsByDaycareId(daycareId: number): Contact[] {
	return db
		.prepare('SELECT * FROM contacts WHERE daycare_id = ? ORDER BY is_primary DESC, created_at ASC')
		.all(daycareId) as Contact[];
}

export function getPrimaryContactByDaycareId(daycareId: number): Contact | undefined {
	return db
		.prepare('SELECT * FROM contacts WHERE daycare_id = ? AND is_primary = 1 LIMIT 1')
		.get(daycareId) as Contact | undefined;
}

export function getContactById(id: number): Contact | undefined {
	return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined;
}

export function getContactCountByDaycareId(daycareId: number): number {
	const result = db
		.prepare('SELECT COUNT(*) as count FROM contacts WHERE daycare_id = ?')
		.get(daycareId) as { count: number };
	return result.count;
}

export function createContact(daycareId: number, input: ContactInput): Contact {
	// If this is marked as primary, unset any existing primary contact
	if (input.is_primary) {
		db.prepare('UPDATE contacts SET is_primary = 0 WHERE daycare_id = ?').run(daycareId);
	}

	const result = db
		.prepare(
			`INSERT INTO contacts (daycare_id, name, role, phone, email, notes, is_primary)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			daycareId,
			input.name,
			input.role || '',
			input.phone || '',
			input.email || '',
			input.notes || '',
			input.is_primary ? 1 : 0
		);

	return db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid) as Contact;
}

export function updateContact(id: number, input: Partial<ContactInput>): Contact | undefined {
	const existing = getContactById(id);
	if (!existing) return undefined;

	// If setting as primary, unset any existing primary contact for this daycare
	if (input.is_primary) {
		db.prepare('UPDATE contacts SET is_primary = 0 WHERE daycare_id = ?').run(existing.daycare_id);
	}

	const updates: string[] = [];
	const values: (string | number | null)[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		values.push(input.name);
	}
	if (input.role !== undefined) {
		updates.push('role = ?');
		values.push(input.role);
	}
	if (input.phone !== undefined) {
		updates.push('phone = ?');
		values.push(input.phone);
	}
	if (input.email !== undefined) {
		updates.push('email = ?');
		values.push(input.email);
	}
	if (input.notes !== undefined) {
		updates.push('notes = ?');
		values.push(input.notes);
	}
	if (input.is_primary !== undefined) {
		updates.push('is_primary = ?');
		values.push(input.is_primary ? 1 : 0);
	}

	if (updates.length > 0) {
		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);
		db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
	}

	return getContactById(id);
}

export function deleteContact(id: number): boolean {
	const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
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

// Settings operations
export function getSetting(key: string): string | undefined {
	const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
	return result?.value;
}

export function setSetting(key: string, value: string): void {
	db.prepare(
		`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
	).run(key, value);
}

export function getAllSettings(): Record<string, string> {
	const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
	const settings: Record<string, string> = {};
	for (const row of rows) {
		settings[row.key] = row.value;
	}
	return settings;
}

// Commute time operations
export function getDaycaresNeedingCommute(homeAddress: string): Daycare[] {
	return db.prepare(`
		SELECT * FROM daycares
		WHERE address IS NOT NULL AND address != ''
		AND (
			commute_origin IS NULL OR commute_origin = '' OR commute_origin != ?
			OR commute_destination IS NULL OR commute_destination = '' OR commute_destination != address
			OR commute_minutes IS NULL
		)
	`).all(homeAddress) as Daycare[];
}

export function updateDaycareCommute(
	id: number,
	commuteMinutes: number,
	commuteOrigin: string,
	commuteDestination: string
): void {
	db.prepare(`
		UPDATE daycares
		SET commute_minutes = ?,
			commute_origin = ?,
			commute_destination = ?,
			commute_calculated_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(commuteMinutes, commuteOrigin, commuteDestination, id);
}
