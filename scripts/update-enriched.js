import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

const updates = [
  // CPE AU PALAIS DES MERVEILLES - both installations
  {
    pattern: '%CPE AU PALAIS DES MERVEILLES%',
    email: 'reception@cpepalais.ca',
    hours: '7h-18h (lun-ven)',
    phone: '418-228-3021'
  },
  // G. MAISON D'ENSEIGNEMENT LET'S GO (original)
  {
    pattern: "G. MAISON D'ENSEIGNEMENT LET'S GO",
    exact: true,
    email: 'info@maisonletsgo.com',
    hours: '7h-17h30 (lun-ven)',
    phone: '418 222-6767',
    address: '8435, boulevard Lacroix G5Y 2B1, Saint-Georges'
  },
  // G. MAISON D'ENSEIGNEMENT LET'S GO 2
  {
    pattern: "G. MAISON D'ENSEIGNEMENT LET'S GO 2",
    exact: true,
    email: 'info@maisonletsgo.com',
    hours: '7h-17h30 (lun-ven)',
    phone: '418 222-6777',
    address: '588, boulevard Dionne G5Y 3T7, Saint-Georges'
  },
  // CPE LA FOURMILLE - both installations
  {
    pattern: '%CPE LA FOURMILLE%',
    email: 'direction@cpelafourmille.com',
    hours: '7h-17h20 (lun-ven)'
  },
  // CPE BEAUCE-SARTIGAN
  {
    pattern: '%CPE BEAUCE-SARTIGAN%',
    hours: '7h-18h (lun-ven)'
  },
  // G. LES PETITS COEURS
  {
    pattern: 'G. LES PETITS COEURS',
    exact: true,
    email: 'lespetitscoeurs@globetrotter.net',
    phone: '418-228-3358',
    age_range: 'Poupons: 10, 18m+: 70'
  },
  // G. LA MAISON DES PETITS AMIS
  {
    pattern: 'G. LA MAISON DES PETITS AMIS',
    exact: true,
    hours: '7h-18h (lun-ven)'
  },
  // Garderie l'Académie Montessori
  {
    pattern: "Garderie l'Académie Montessori",
    exact: true,
    hours: '7h-18h (lun-ven)'
  }
];

for (const u of updates) {
  const setClauses = [];
  const values = [];

  if (u.email) { setClauses.push('email = ?'); values.push(u.email); }
  if (u.hours) { setClauses.push('hours = ?'); values.push(u.hours); }
  if (u.phone) { setClauses.push('phone = ?'); values.push(u.phone); }
  if (u.address) { setClauses.push('address = ?'); values.push(u.address); }
  if (u.age_range) { setClauses.push('age_range = ?'); values.push(u.age_range); }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');

  const sql = u.exact
    ? `UPDATE daycares SET ${setClauses.join(', ')} WHERE name = ?`
    : `UPDATE daycares SET ${setClauses.join(', ')} WHERE name LIKE ?`;

  values.push(u.pattern);

  const result = db.prepare(sql).run(...values);
  console.log(`${u.pattern}: ${result.changes} updated`);
}

console.log('\n=== Updated Data ===\n');

const results = db.prepare(`
  SELECT name, email, phone, hours, website, rating
  FROM daycares
  WHERE name LIKE '%CPE%' OR name LIKE '%G.%' OR name LIKE '%Garderie%'
  ORDER BY name
`).all();

console.table(results);

db.close();
