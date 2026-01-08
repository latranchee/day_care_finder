const Database = require('better-sqlite3');
const db = new Database('./data/daycares.db');

// French word corrections (missing accented characters)
const fixes = [
  ['Sige social', 'Siège social'],
  ['scurisant', 'sécurisant'],
  ['Dveloppement', 'Développement'],
  ['dveloppement', 'développement'],
  ['exprience', 'expérience'],
  ['rseau', 'réseau'],
  ['gr par', 'géré par'],
  ['subventionnes', 'subventionnées'],
  ['Places subventionnes', 'Places subventionnées'],
  ['30+ ans dexprience', '30+ ans d\'expérience'],
  ['OBNL gr par parents', 'OBNL géré par parents'],
  ['panouissement', 'épanouissement'],
  ['Cgep', 'Cégep'],
  [' contribution rduite', 'à contribution réduite'],
  ['rduction', 'réduction'],
  ['opration', 'opération'],
];

const notes = db.prepare('SELECT id, content FROM notes').all();
let fixed = 0;

console.log('Checking ' + notes.length + ' notes...\n');

for (const note of notes) {
  let content = note.content;
  let original = content;

  for (const [from, to] of fixes) {
    if (content.includes(from)) {
      console.log('  Replacing: "' + from + '" -> "' + to + '"');
      content = content.split(from).join(to);
    }
  }

  if (content !== original) {
    console.log('Fixing note ' + note.id + '\n');
    db.prepare('UPDATE notes SET content = ? WHERE id = ?').run(content, note.id);
    fixed++;
  }
}

console.log('\n✓ Fixed ' + fixed + ' notes');
db.close();
