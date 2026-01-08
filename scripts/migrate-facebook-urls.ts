import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

interface Note {
	id: number;
	daycare_id: number;
	content: string;
}

interface Daycare {
	id: number;
	facebook: string;
}

// Regex to match Facebook URLs (handles facebook.com, fb.com, m.facebook.com)
const facebookUrlRegex = /https?:\/\/(?:www\.|m\.)?(?:facebook\.com|fb\.com)\/[^\s<>\[\]()'"]+/gi;

function migrateFacebookUrls() {
	const notes = db.prepare('SELECT id, daycare_id, content FROM notes').all() as Note[];

	let migratedCount = 0;
	let notesUpdatedCount = 0;
	let notesDeletedCount = 0;

	console.log(`Found ${notes.length} notes to scan for Facebook URLs...`);

	db.transaction(() => {
		for (const note of notes) {
			const matches = note.content.match(facebookUrlRegex);
			if (!matches || matches.length === 0) continue;

			// Get the first Facebook URL found
			const facebookUrl = matches[0];

			// Check if daycare already has a facebook URL
			const daycare = db.prepare('SELECT id, facebook FROM daycares WHERE id = ?').get(note.daycare_id) as Daycare | undefined;

			if (daycare && !daycare.facebook) {
				// Update the daycare with the Facebook URL
				db.prepare('UPDATE daycares SET facebook = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
					.run(facebookUrl, daycare.id);
				migratedCount++;
				console.log(`  Migrated Facebook URL to daycare ${daycare.id}: ${facebookUrl}`);
			}

			// Remove Facebook URLs from note content
			let newContent = note.content;
			for (const match of matches) {
				newContent = newContent.replace(match, '').trim();
			}

			// Clean up multiple spaces/newlines
			newContent = newContent.replace(/\n\s*\n/g, '\n').replace(/  +/g, ' ').trim();

			if (newContent !== note.content) {
				if (newContent === '') {
					// Delete empty note
					db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
					notesDeletedCount++;
					console.log(`  Deleted empty note ${note.id}`);
				} else {
					// Update note with cleaned content
					db.prepare('UPDATE notes SET content = ? WHERE id = ?').run(newContent, note.id);
					notesUpdatedCount++;
					console.log(`  Updated note ${note.id} (removed Facebook URL)`);
				}
			}
		}
	})();

	console.log('\nMigration complete:');
	console.log(`  - ${migratedCount} daycares updated with Facebook URLs`);
	console.log(`  - ${notesUpdatedCount} notes updated (URL removed)`);
	console.log(`  - ${notesDeletedCount} empty notes deleted`);
}

migrateFacebookUrls();
