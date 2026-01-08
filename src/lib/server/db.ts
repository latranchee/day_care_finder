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

	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT DEFAULT '',
		role TEXT DEFAULT 'user',
		home_address TEXT DEFAULT '',
		max_commute_minutes INTEGER DEFAULT 5,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_daycares_stage ON daycares(stage);
	CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
	CREATE INDEX IF NOT EXISTS idx_notes_daycare_id ON notes(daycare_id);
	CREATE INDEX IF NOT EXISTS idx_reviews_daycare_id ON reviews(daycare_id);
	CREATE INDEX IF NOT EXISTS idx_contacts_daycare_id ON contacts(daycare_id);

	CREATE TABLE IF NOT EXISTS children (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		date_of_birth TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS user_children (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		child_id INTEGER NOT NULL,
		role TEXT DEFAULT 'owner',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
		UNIQUE(user_id, child_id)
	);

	CREATE TABLE IF NOT EXISTS invitations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		child_id INTEGER NOT NULL,
		code TEXT UNIQUE NOT NULL,
		created_by_user_id INTEGER NOT NULL,
		expires_at DATETIME NOT NULL,
		used_by_user_id INTEGER,
		used_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
		FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
	);

	CREATE INDEX IF NOT EXISTS idx_user_children_user_id ON user_children(user_id);
	CREATE INDEX IF NOT EXISTS idx_user_children_child_id ON user_children(child_id);
	CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
	CREATE INDEX IF NOT EXISTS idx_invitations_child_id ON invitations(child_id);
`);

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Safely adds a column to a table, ignoring "duplicate column" errors but
 * logging and rethrowing any other errors.
 */
function safeAddColumn(tableName: string, columnDef: string): void {
	try {
		db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
	} catch (error: unknown) {
		// SQLite error messages for duplicate column include "duplicate column name"
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.toLowerCase().includes('duplicate column') ||
		    errorMessage.toLowerCase().includes('already exists')) {
			// Column already exists, this is expected during migrations
			return;
		}
		// Rethrow unexpected errors
		console.error(`Migration error adding column to ${tableName}: ${columnDef}`, error);
		throw error;
	}
}

/**
 * Safely creates an index, ignoring "already exists" errors.
 */
function safeCreateIndex(indexDef: string): void {
	try {
		db.exec(`CREATE INDEX ${indexDef}`);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.toLowerCase().includes('already exists')) {
			return;
		}
		console.error(`Migration error creating index: ${indexDef}`, error);
		throw error;
	}
}

/**
 * Safely executes a data migration, logging errors but not failing.
 */
function safeDataMigration(migrationName: string, migrationFn: () => void): void {
	try {
		migrationFn();
	} catch (error: unknown) {
		console.error(`Data migration '${migrationName}' failed:`, error);
		// Data migrations are non-critical, don't rethrow
	}
}

// ============================================================================
// Migrations
// ============================================================================

// Migration: Add hidden column (for existing databases)
safeAddColumn('daycares', 'hidden INTEGER DEFAULT 0');

// Migration: Add email column
safeAddColumn('daycares', "email TEXT DEFAULT ''");

// Migration: Add username column to notes
safeAddColumn('notes', 'username TEXT');

// Migration: Add facebook column to daycares
safeAddColumn('daycares', "facebook TEXT DEFAULT ''");

// Migration: Add commute time columns for tracking travel time from home
safeAddColumn('daycares', 'commute_minutes INTEGER');
safeAddColumn('daycares', "commute_origin TEXT DEFAULT ''");
safeAddColumn('daycares', "commute_destination TEXT DEFAULT ''");
safeAddColumn('daycares', 'commute_calculated_at DATETIME');
safeAddColumn('daycares', "commute_maps_url TEXT DEFAULT ''");

// Migration: Add owner_id column for daycare ownership
safeAddColumn('daycares', 'owner_id INTEGER REFERENCES users(id)');

// Migration: Add portal fields
safeAddColumn('daycares', "portal_url TEXT DEFAULT ''");
safeAddColumn('daycares', "installation_id TEXT DEFAULT ''");
safeAddColumn('daycares', "daycare_type TEXT DEFAULT ''");
safeAddColumn('daycares', 'subventionne INTEGER DEFAULT 0');
safeAddColumn('daycares', 'places_poupons INTEGER');
safeAddColumn('daycares', 'places_18_mois_plus INTEGER');
safeAddColumn('daycares', "description TEXT DEFAULT ''");
safeAddColumn('daycares', "horaires TEXT DEFAULT ''");

// Migration: Add child_id column for scoping daycares to children
safeAddColumn('daycares', 'child_id INTEGER REFERENCES children(id) ON DELETE CASCADE');
safeCreateIndex('IF NOT EXISTS idx_daycares_child_id ON daycares(child_id)');

// Migration: Migrate existing phone/email from daycares to contacts table
safeDataMigration('migrate_daycare_contacts', () => {
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
})

// ============================================================================
// Generic Update Query Builder
// ============================================================================

interface FieldMapping {
	/** The key in the input object */
	inputKey: string;
	/** The SQL column name (defaults to inputKey if not specified) */
	column?: string;
	/** Transform function to convert the input value for SQL (e.g., boolean to 0/1) */
	transform?: (value: unknown) => string | number | null;
}

/**
 * Builds and executes an UPDATE query dynamically based on provided fields.
 * Only includes fields that are present (not undefined) in the input.
 *
 * @returns true if the query was executed, false if no fields to update
 */
function buildAndExecuteUpdate<T extends Record<string, unknown>>(
	tableName: string,
	id: number,
	input: T,
	fieldMappings: FieldMapping[],
	includeTimestamp: boolean = true
): boolean {
	const updates: string[] = [];
	const values: (string | number | null)[] = [];

	for (const mapping of fieldMappings) {
		const value = input[mapping.inputKey];
		if (value !== undefined) {
			const column = mapping.column || mapping.inputKey;
			updates.push(`${column} = ?`);

			if (mapping.transform) {
				values.push(mapping.transform(value));
			} else {
				values.push(value as string | number | null);
			}
		}
	}

	if (updates.length === 0) {
		return false;
	}

	if (includeTimestamp) {
		updates.push('updated_at = CURRENT_TIMESTAMP');
	}

	values.push(id);
	db.prepare(`UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`).run(...values);
	return true;
}

// Boolean to integer transform for SQLite
const boolToInt = (value: unknown): number => (value ? 1 : 0);

// ============================================================================
// Daycare CRUD operations
// ============================================================================

export function getAllDaycares(): Daycare[] {
	return db.prepare('SELECT * FROM daycares ORDER BY stage, position').all() as Daycare[];
}

// Raw row type from the JOINed query
interface DaycareWithExtrasRow {
	// Daycare fields
	id: number;
	name: string;
	address: string;
	phone: string;
	email: string;
	facebook: string;
	website: string;
	portal_url: string;
	capacity: number | null;
	price: string;
	hours: string;
	age_range: string;
	rating: number | null;
	stage: Stage;
	position: number;
	hidden: number;
	commute_minutes: number | null;
	commute_origin: string;
	commute_destination: string;
	commute_maps_url: string;
	commute_calculated_at: string | null;
	created_at: string;
	updated_at: string;
	installation_id: string;
	daycare_type: string;
	subventionne: number;
	places_poupons: number | null;
	places_18_mois_plus: number | null;
	description: string;
	horaires: string;
	child_id: number | null;
	owner_id: number | null;
	// First review fields (from subquery)
	first_review_id: number | null;
	first_review_text: string | null;
	first_review_source_url: string | null;
	first_review_rating: number | null;
	first_review_created_at: string | null;
	// Primary contact fields (from subquery)
	primary_contact_id: number | null;
	primary_contact_name: string | null;
	primary_contact_role: string | null;
	primary_contact_phone: string | null;
	primary_contact_email: string | null;
	primary_contact_notes: string | null;
	primary_contact_is_primary: number | null;
	primary_contact_created_at: string | null;
	primary_contact_updated_at: string | null;
	// Contact count (from subquery)
	contact_count: number;
}

// Extended daycare type with related data for display
export interface DaycareWithExtras extends Daycare {
	firstReview?: Review;
	primaryContact?: Contact;
	contactCount: number;
}

/**
 * Fetches all daycares with their first review, primary contact, and contact count
 * in a single optimized query using JOINs and subqueries.
 * This replaces the N+1 query pattern where we would fetch daycares first,
 * then loop through each one to fetch reviews and contacts separately.
 *
 * Query count: 1 (instead of 3N+1)
 */
export function getAllDaycaresWithExtras(): DaycareWithExtras[] {
	const query = `
		SELECT
			d.*,
			-- First review (most recent)
			fr.id as first_review_id,
			fr.text as first_review_text,
			fr.source_url as first_review_source_url,
			fr.rating as first_review_rating,
			fr.created_at as first_review_created_at,
			-- Primary contact
			pc.id as primary_contact_id,
			pc.name as primary_contact_name,
			pc.role as primary_contact_role,
			pc.phone as primary_contact_phone,
			pc.email as primary_contact_email,
			pc.notes as primary_contact_notes,
			pc.is_primary as primary_contact_is_primary,
			pc.created_at as primary_contact_created_at,
			pc.updated_at as primary_contact_updated_at,
			-- Contact count
			COALESCE(cc.count, 0) as contact_count
		FROM daycares d
		-- Left join to get the first (most recent) review per daycare
		LEFT JOIN (
			SELECT r1.*
			FROM reviews r1
			INNER JOIN (
				SELECT daycare_id, MAX(created_at) as max_created_at
				FROM reviews
				GROUP BY daycare_id
			) r2 ON r1.daycare_id = r2.daycare_id AND r1.created_at = r2.max_created_at
		) fr ON d.id = fr.daycare_id
		-- Left join to get the primary contact per daycare
		LEFT JOIN contacts pc ON d.id = pc.daycare_id AND pc.is_primary = 1
		-- Left join to get contact count per daycare
		LEFT JOIN (
			SELECT daycare_id, COUNT(*) as count
			FROM contacts
			GROUP BY daycare_id
		) cc ON d.id = cc.daycare_id
		ORDER BY d.stage, d.position
	`;

	const rows = db.prepare(query).all() as DaycareWithExtrasRow[];

	return rows.map((row): DaycareWithExtras => {
		// Build the base daycare object
		const daycare: Daycare = {
			id: row.id,
			name: row.name,
			address: row.address,
			phone: row.phone,
			email: row.email,
			facebook: row.facebook,
			website: row.website,
			portal_url: row.portal_url,
			capacity: row.capacity,
			price: row.price,
			hours: row.hours,
			age_range: row.age_range,
			rating: row.rating,
			stage: row.stage,
			position: row.position,
			hidden: Boolean(row.hidden),
			commute_minutes: row.commute_minutes,
			commute_origin: row.commute_origin,
			commute_destination: row.commute_destination,
			commute_maps_url: row.commute_maps_url,
			commute_calculated_at: row.commute_calculated_at,
			created_at: row.created_at,
			updated_at: row.updated_at,
			installation_id: row.installation_id,
			daycare_type: row.daycare_type,
			subventionne: Boolean(row.subventionne),
			places_poupons: row.places_poupons,
			places_18_mois_plus: row.places_18_mois_plus,
			description: row.description,
			horaires: row.horaires,
			child_id: row.child_id
		};

		// Build the first review if present
		const firstReview: Review | undefined = row.first_review_id
			? {
					id: row.first_review_id,
					daycare_id: row.id,
					text: row.first_review_text!,
					source_url: row.first_review_source_url || '',
					rating: row.first_review_rating!,
					created_at: row.first_review_created_at!
				}
			: undefined;

		// Build the primary contact if present
		const primaryContact: Contact | undefined = row.primary_contact_id
			? {
					id: row.primary_contact_id,
					daycare_id: row.id,
					name: row.primary_contact_name!,
					role: row.primary_contact_role || '',
					phone: row.primary_contact_phone || '',
					email: row.primary_contact_email || '',
					notes: row.primary_contact_notes || '',
					is_primary: Boolean(row.primary_contact_is_primary),
					created_at: row.primary_contact_created_at!,
					updated_at: row.primary_contact_updated_at!
				}
			: undefined;

		return {
			...daycare,
			firstReview,
			primaryContact,
			contactCount: row.contact_count
		};
	});
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
			`INSERT INTO daycares (name, address, phone, email, facebook, website, portal_url, capacity, price, hours, age_range, rating, stage, position, installation_id, daycare_type, subventionne, places_poupons, places_18_mois_plus, description, horaires)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.name,
			input.address || '',
			input.phone || '',
			input.email || '',
			input.facebook || '',
			input.website || '',
			input.portal_url || '',
			input.capacity ?? null,
			input.price || '',
			input.hours || '',
			input.age_range || '',
			input.rating ?? null,
			stage,
			maxPosition.max + 1,
			input.installation_id || '',
			input.daycare_type || '',
			input.subventionne ? 1 : 0,
			input.places_poupons ?? null,
			input.places_18_mois_plus ?? null,
			input.description || '',
			input.horaires || ''
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
	if (input.portal_url !== undefined) {
		updates.push('portal_url = ?');
		values.push(input.portal_url);
	}
	if (input.installation_id !== undefined) {
		updates.push('installation_id = ?');
		values.push(input.installation_id);
	}
	if (input.daycare_type !== undefined) {
		updates.push('daycare_type = ?');
		values.push(input.daycare_type);
	}
	if (input.subventionne !== undefined) {
		updates.push('subventionne = ?');
		values.push(input.subventionne ? 1 : 0);
	}
	if (input.places_poupons !== undefined) {
		updates.push('places_poupons = ?');
		values.push(input.places_poupons);
	}
	if (input.places_18_mois_plus !== undefined) {
		updates.push('places_18_mois_plus = ?');
		values.push(input.places_18_mois_plus);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		values.push(input.description);
	}
	if (input.horaires !== undefined) {
		updates.push('horaires = ?');
		values.push(input.horaires);
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
		WHERE TRIM(address) IS NOT NULL AND TRIM(address) != ''
		AND address GLOB '*[0-9]*'
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
	commuteDestination: string,
	commuteMapsUrl: string
): void {
	db.prepare(`
		UPDATE daycares
		SET commute_minutes = ?,
			commute_origin = ?,
			commute_destination = ?,
			commute_maps_url = ?,
			commute_calculated_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(commuteMinutes, commuteOrigin, commuteDestination, commuteMapsUrl, id);
}

// User types
export interface User {
	id: number;
	email: string;
	password_hash: string;
	name: string;
	role: 'admin' | 'owner' | 'user';
	home_address: string;
	max_commute_minutes: number;
	created_at: string;
}

export interface Session {
	id: string;
	user_id: number;
	expires_at: string;
	created_at: string;
}

// User operations
export function createUser(email: string, passwordHash: string, name: string, homeAddress: string, maxCommuteMinutes: number = 5): User {
	const result = db.prepare(`
		INSERT INTO users (email, password_hash, name, home_address, max_commute_minutes)
		VALUES (?, ?, ?, ?, ?)
	`).run(email, passwordHash, name, homeAddress, maxCommuteMinutes);

	return getUserById(result.lastInsertRowid as number)!;
}

export function getUserById(id: number): User | null {
	return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
	return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | null;
}

export function updateUser(id: number, updates: Partial<Pick<User, 'name' | 'home_address' | 'max_commute_minutes' | 'role'>>): void {
	const fields: string[] = [];
	const values: (string | number)[] = [];

	if (updates.name !== undefined) {
		fields.push('name = ?');
		values.push(updates.name);
	}
	if (updates.home_address !== undefined) {
		fields.push('home_address = ?');
		values.push(updates.home_address);
	}
	if (updates.max_commute_minutes !== undefined) {
		fields.push('max_commute_minutes = ?');
		values.push(updates.max_commute_minutes);
	}
	if (updates.role !== undefined) {
		fields.push('role = ?');
		values.push(updates.role);
	}

	if (fields.length > 0) {
		values.push(id);
		db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	}
}

// Session operations
export function createSession(userId: number, sessionId: string, expiresAt: Date): Session {
	db.prepare(`
		INSERT INTO sessions (id, user_id, expires_at)
		VALUES (?, ?, ?)
	`).run(sessionId, userId, expiresAt.toISOString());

	return getSessionById(sessionId)!;
}

export function getSessionById(id: string): (Session & { user: User }) | null {
	const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | null;
	if (!session) return null;

	// Check if expired
	if (new Date(session.expires_at) < new Date()) {
		deleteSession(id);
		return null;
	}

	const user = getUserById(session.user_id);
	if (!user) {
		deleteSession(id);
		return null;
	}

	return { ...session, user };
}

export function deleteSession(id: string): void {
	db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function deleteExpiredSessions(): void {
	db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
}

// Daycare ownership
export function claimDaycare(daycareId: number, userId: number): void {
	db.prepare('UPDATE daycares SET owner_id = ? WHERE id = ?').run(userId, daycareId);
}

export function unclaimDaycare(daycareId: number): void {
	db.prepare('UPDATE daycares SET owner_id = NULL WHERE id = ?').run(daycareId);
}

export function getDaycaresByOwner(userId: number): Daycare[] {
	return db.prepare('SELECT * FROM daycares WHERE owner_id = ?').all(userId) as Daycare[];
}

// Child types
export interface Child {
	id: number;
	name: string;
	date_of_birth: string;
	created_at: string;
}

export interface ChildInput {
	name: string;
	date_of_birth: string;
}

export interface UserChild {
	id: number;
	user_id: number;
	child_id: number;
	role: 'owner' | 'collaborator';
	created_at: string;
}

export interface ChildWithDetails extends Child {
	is_owner: boolean;
	parents: { id: number; name: string; email: string; role: string }[];
}

export interface Invitation {
	id: number;
	child_id: number;
	code: string;
	created_by_user_id: number;
	expires_at: string;
	used_by_user_id: number | null;
	used_at: string | null;
	created_at: string;
}

// Child CRUD operations
export function createChild(input: ChildInput, userId: number): Child {
	const result = db.prepare(`
		INSERT INTO children (name, date_of_birth)
		VALUES (?, ?)
	`).run(input.name, input.date_of_birth);

	const childId = result.lastInsertRowid as number;

	// Add user as owner
	db.prepare(`
		INSERT INTO user_children (user_id, child_id, role)
		VALUES (?, ?, 'owner')
	`).run(userId, childId);

	return getChildById(childId)!;
}

export function getChildById(id: number): Child | null {
	return db.prepare('SELECT * FROM children WHERE id = ?').get(id) as Child | null;
}

export function updateChild(id: number, input: Partial<ChildInput>): Child | null {
	const existing = getChildById(id);
	if (!existing) return null;

	const updates: string[] = [];
	const values: string[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		values.push(input.name);
	}
	if (input.date_of_birth !== undefined) {
		updates.push('date_of_birth = ?');
		values.push(input.date_of_birth);
	}

	if (updates.length > 0) {
		values.push(String(id));
		db.prepare(`UPDATE children SET ${updates.join(', ')} WHERE id = ?`).run(...values);
	}

	return getChildById(id);
}

export function deleteChild(id: number): boolean {
	const result = db.prepare('DELETE FROM children WHERE id = ?').run(id);
	return result.changes > 0;
}

// User-Child relationship operations
export function getChildrenByUserId(userId: number): ChildWithDetails[] {
	const rows = db.prepare(`
		SELECT c.*, uc.role as user_role
		FROM children c
		JOIN user_children uc ON c.id = uc.child_id
		WHERE uc.user_id = ?
		ORDER BY c.created_at ASC
	`).all(userId) as (Child & { user_role: string })[];

	return rows.map(row => {
		const parents = getParentsByChildId(row.id);
		return {
			id: row.id,
			name: row.name,
			date_of_birth: row.date_of_birth,
			created_at: row.created_at,
			is_owner: row.user_role === 'owner',
			parents
		};
	});
}

export function getParentsByChildId(childId: number): { id: number; name: string; email: string; role: string }[] {
	return db.prepare(`
		SELECT u.id, u.name, u.email, uc.role
		FROM users u
		JOIN user_children uc ON u.id = uc.user_id
		WHERE uc.child_id = ?
		ORDER BY uc.role ASC, uc.created_at ASC
	`).all(childId) as { id: number; name: string; email: string; role: string }[];
}

export function addUserToChild(userId: number, childId: number, role: 'owner' | 'collaborator'): UserChild | null {
	try {
		const result = db.prepare(`
			INSERT INTO user_children (user_id, child_id, role)
			VALUES (?, ?, ?)
		`).run(userId, childId, role);

		return db.prepare('SELECT * FROM user_children WHERE id = ?').get(result.lastInsertRowid) as UserChild;
	} catch {
		// Unique constraint violation - user already linked to child
		return null;
	}
}

export function removeUserFromChild(userId: number, childId: number): boolean {
	const result = db.prepare('DELETE FROM user_children WHERE user_id = ? AND child_id = ?').run(userId, childId);
	return result.changes > 0;
}

export function canUserAccessChild(userId: number, childId: number): boolean {
	const result = db.prepare(`
		SELECT 1 FROM user_children WHERE user_id = ? AND child_id = ?
	`).get(userId, childId);
	return !!result;
}

export function getUserRoleForChild(userId: number, childId: number): 'owner' | 'collaborator' | null {
	const result = db.prepare(`
		SELECT role FROM user_children WHERE user_id = ? AND child_id = ?
	`).get(userId, childId) as { role: string } | undefined;
	return result?.role as 'owner' | 'collaborator' | null;
}

// Invitation operations
function generateInvitationCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O, 1/I/L for readability
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export function createInvitation(childId: number, userId: number): Invitation {
	// Revoke any existing active invitation for this child
	db.prepare(`
		DELETE FROM invitations
		WHERE child_id = ? AND used_by_user_id IS NULL
	`).run(childId);

	const code = generateInvitationCode();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

	const result = db.prepare(`
		INSERT INTO invitations (child_id, code, created_by_user_id, expires_at)
		VALUES (?, ?, ?, ?)
	`).run(childId, code, userId, expiresAt.toISOString());

	return db.prepare('SELECT * FROM invitations WHERE id = ?').get(result.lastInsertRowid) as Invitation;
}

export function getInvitationByCode(code: string): (Invitation & { child: Child }) | null {
	const invitation = db.prepare(`
		SELECT * FROM invitations WHERE code = ?
	`).get(code) as Invitation | undefined;

	if (!invitation) return null;

	const child = getChildById(invitation.child_id);
	if (!child) return null;

	return { ...invitation, child };
}

export function getActiveInvitationByChildId(childId: number): Invitation | null {
	return db.prepare(`
		SELECT * FROM invitations
		WHERE child_id = ? AND used_by_user_id IS NULL AND expires_at > datetime('now')
		ORDER BY created_at DESC
		LIMIT 1
	`).get(childId) as Invitation | null;
}

export function claimInvitation(code: string, userId: number): { success: boolean; error?: string; childId?: number } {
	const invitation = db.prepare(`
		SELECT * FROM invitations WHERE code = ?
	`).get(code) as Invitation | undefined;

	if (!invitation) {
		return { success: false, error: 'Invalid invitation code' };
	}

	if (invitation.used_by_user_id) {
		return { success: false, error: 'Invitation has already been used' };
	}

	if (new Date(invitation.expires_at) < new Date()) {
		return { success: false, error: 'Invitation has expired' };
	}

	// Check if user already has access to this child
	if (canUserAccessChild(userId, invitation.child_id)) {
		return { success: false, error: 'You already have access to this child profile' };
	}

	// Add user as collaborator
	db.transaction(() => {
		addUserToChild(userId, invitation.child_id, 'collaborator');
		db.prepare(`
			UPDATE invitations
			SET used_by_user_id = ?, used_at = datetime('now')
			WHERE id = ?
		`).run(userId, invitation.id);
	})();

	return { success: true, childId: invitation.child_id };
}

export function revokeInvitation(invitationId: number): boolean {
	const result = db.prepare('DELETE FROM invitations WHERE id = ?').run(invitationId);
	return result.changes > 0;
}

// Child-scoped daycare operations
export function getAllDaycaresByChildId(childId: number): Daycare[] {
	return db.prepare('SELECT * FROM daycares WHERE child_id = ? ORDER BY stage, position').all(childId) as Daycare[];
}

/**
 * Fetches all daycares for a specific child with their first review, primary contact,
 * and contact count in a single optimized query using JOINs and subqueries.
 * This is the child-scoped version of getAllDaycaresWithExtras().
 *
 * Query count: 1 (instead of 3N+1)
 */
export function getAllDaycaresByChildIdWithExtras(childId: number): DaycareWithExtras[] {
	const query = `
		SELECT
			d.*,
			-- First review (most recent)
			fr.id as first_review_id,
			fr.text as first_review_text,
			fr.source_url as first_review_source_url,
			fr.rating as first_review_rating,
			fr.created_at as first_review_created_at,
			-- Primary contact
			pc.id as primary_contact_id,
			pc.name as primary_contact_name,
			pc.role as primary_contact_role,
			pc.phone as primary_contact_phone,
			pc.email as primary_contact_email,
			pc.notes as primary_contact_notes,
			pc.is_primary as primary_contact_is_primary,
			pc.created_at as primary_contact_created_at,
			pc.updated_at as primary_contact_updated_at,
			-- Contact count
			COALESCE(cc.count, 0) as contact_count
		FROM daycares d
		-- Left join to get the first (most recent) review per daycare
		LEFT JOIN (
			SELECT r1.*
			FROM reviews r1
			INNER JOIN (
				SELECT daycare_id, MAX(created_at) as max_created_at
				FROM reviews
				GROUP BY daycare_id
			) r2 ON r1.daycare_id = r2.daycare_id AND r1.created_at = r2.max_created_at
		) fr ON d.id = fr.daycare_id
		-- Left join to get the primary contact per daycare
		LEFT JOIN contacts pc ON d.id = pc.daycare_id AND pc.is_primary = 1
		-- Left join to get contact count per daycare
		LEFT JOIN (
			SELECT daycare_id, COUNT(*) as count
			FROM contacts
			GROUP BY daycare_id
		) cc ON d.id = cc.daycare_id
		WHERE d.child_id = ?
		ORDER BY d.stage, d.position
	`;

	const rows = db.prepare(query).all(childId) as DaycareWithExtrasRow[];

	return rows.map((row): DaycareWithExtras => {
		// Build the base daycare object
		const daycare: Daycare = {
			id: row.id,
			name: row.name,
			address: row.address,
			phone: row.phone,
			email: row.email,
			facebook: row.facebook,
			website: row.website,
			portal_url: row.portal_url,
			capacity: row.capacity,
			price: row.price,
			hours: row.hours,
			age_range: row.age_range,
			rating: row.rating,
			stage: row.stage,
			position: row.position,
			hidden: Boolean(row.hidden),
			commute_minutes: row.commute_minutes,
			commute_origin: row.commute_origin,
			commute_destination: row.commute_destination,
			commute_maps_url: row.commute_maps_url,
			commute_calculated_at: row.commute_calculated_at,
			created_at: row.created_at,
			updated_at: row.updated_at,
			installation_id: row.installation_id,
			daycare_type: row.daycare_type,
			subventionne: Boolean(row.subventionne),
			places_poupons: row.places_poupons,
			places_18_mois_plus: row.places_18_mois_plus,
			description: row.description,
			horaires: row.horaires,
			child_id: row.child_id
		};

		// Build the first review if present
		const firstReview: Review | undefined = row.first_review_id
			? {
					id: row.first_review_id,
					daycare_id: row.id,
					text: row.first_review_text!,
					source_url: row.first_review_source_url || '',
					rating: row.first_review_rating!,
					created_at: row.first_review_created_at!
				}
			: undefined;

		// Build the primary contact if present
		const primaryContact: Contact | undefined = row.primary_contact_id
			? {
					id: row.primary_contact_id,
					daycare_id: row.id,
					name: row.primary_contact_name!,
					role: row.primary_contact_role || '',
					phone: row.primary_contact_phone || '',
					email: row.primary_contact_email || '',
					notes: row.primary_contact_notes || '',
					is_primary: Boolean(row.primary_contact_is_primary),
					created_at: row.primary_contact_created_at!,
					updated_at: row.primary_contact_updated_at!
				}
			: undefined;

		return {
			...daycare,
			firstReview,
			primaryContact,
			contactCount: row.contact_count
		};
	});
}

export function getDaycaresByStageAndChild(stage: Stage, childId: number): Daycare[] {
	return db.prepare(`
		SELECT * FROM daycares WHERE stage = ? AND child_id = ? ORDER BY position
	`).all(stage, childId) as Daycare[];
}

export function getUnassignedDaycareCount(): number {
	const result = db.prepare('SELECT COUNT(*) as count FROM daycares WHERE child_id IS NULL').get() as { count: number };
	return result.count;
}

export function assignDaycaresToChild(childId: number): number {
	const result = db.prepare('UPDATE daycares SET child_id = ? WHERE child_id IS NULL').run(childId);
	return result.changes;
}
