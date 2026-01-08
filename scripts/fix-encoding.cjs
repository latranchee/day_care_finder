// Script to fix UTF-8 encoding issues in notes
// The corruption pattern suggests Latin-1 bytes were stored instead of UTF-8

const Database = require('better-sqlite3');
const db = new Database('./data/daycares.db');

// Common French character replacements (mojibake patterns)
const replacements = [
  // UTF-8 interpreted as Latin-1, showing replacement character
  ['�', ''], // Remove replacement characters that can't be fixed

  // Common mojibake patterns (UTF-8 read as Windows-1252/Latin-1)
  ['Ã©', 'é'],
  ['Ã¨', 'è'],
  ['Ãª', 'ê'],
  ['Ã ', 'à'],
  ['Ã¢', 'â'],
  ['Ã®', 'î'],
  ['Ã¯', 'ï'],
  ['Ã´', 'ô'],
  ['Ã¹', 'ù'],
  ['Ã»', 'û'],
  ['Ã§', 'ç'],
  ['Ã‰', 'É'],
  ['Ã€', 'À'],
  ['Ãˆ', 'È'],
  ['Ã"', 'Ô'],
  ['Å"', 'œ'],
  ['â€™', "'"],
  ['â€"', '–'],
  ['â€œ', '"'],
  ['â€', '"'],
];

// Get all notes
const notes = db.prepare('SELECT id, content FROM notes').all();

console.log(`Found ${notes.length} notes to check\n`);

let fixedCount = 0;

for (const note of notes) {
  let content = note.content;
  let original = content;

  // Apply replacements
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  // Check if content changed
  if (content !== original) {
    console.log(`\nNote ${note.id}:`);
    console.log(`  Before: ${original.substring(0, 80)}...`);
    console.log(`  After:  ${content.substring(0, 80)}...`);

    // Update the database
    db.prepare('UPDATE notes SET content = ? WHERE id = ?').run(content, note.id);
    fixedCount++;
  }
}

console.log(`\n✓ Fixed ${fixedCount} notes`);

db.close();
