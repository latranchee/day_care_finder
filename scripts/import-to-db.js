import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Run migrations first (same as in db.ts)
const migrations = [
  `ALTER TABLE daycares ADD COLUMN portal_url TEXT DEFAULT ''`,
  `ALTER TABLE daycares ADD COLUMN installation_id TEXT DEFAULT ''`,
  `ALTER TABLE daycares ADD COLUMN daycare_type TEXT DEFAULT ''`,
  `ALTER TABLE daycares ADD COLUMN subventionne INTEGER DEFAULT 0`,
  `ALTER TABLE daycares ADD COLUMN places_poupons INTEGER`,
  `ALTER TABLE daycares ADD COLUMN places_18_mois_plus INTEGER`,
  `ALTER TABLE daycares ADD COLUMN description TEXT DEFAULT ''`,
  `ALTER TABLE daycares ADD COLUMN horaires TEXT DEFAULT ''`
];

for (const migration of migrations) {
  try {
    db.exec(migration);
    console.log('Migration applied:', migration.substring(0, 60) + '...');
  } catch {
    // Column already exists
  }
}

// Load merged data
const merged = JSON.parse(fs.readFileSync('daycares-merged.json', 'utf8'));
console.log(`\nLoaded ${Object.keys(merged).length} entries from daycares-merged.json\n`);

// Prepare statements
const findByName = db.prepare('SELECT id FROM daycares WHERE name = ?');
const findByInstallationId = db.prepare('SELECT id FROM daycares WHERE installation_id = ?');
const getMaxPosition = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM daycares WHERE stage = ?');

const insertDaycare = db.prepare(`
  INSERT INTO daycares (
    name, address, phone, email, website, portal_url, capacity, price, hours,
    stage, position, installation_id, daycare_type, subventionne,
    places_poupons, places_18_mois_plus, description, horaires
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateDaycare = db.prepare(`
  UPDATE daycares SET
    address = COALESCE(NULLIF(?, ''), address),
    phone = COALESCE(NULLIF(?, ''), phone),
    email = COALESCE(NULLIF(?, ''), email),
    website = COALESCE(NULLIF(?, ''), website),
    portal_url = COALESCE(NULLIF(?, ''), portal_url),
    capacity = COALESCE(?, capacity),
    price = COALESCE(NULLIF(?, ''), price),
    hours = COALESCE(NULLIF(?, ''), hours),
    installation_id = COALESCE(NULLIF(?, ''), installation_id),
    daycare_type = COALESCE(NULLIF(?, ''), daycare_type),
    subventionne = ?,
    places_poupons = COALESCE(?, places_poupons),
    places_18_mois_plus = COALESCE(?, places_18_mois_plus),
    description = COALESCE(NULLIF(?, ''), description),
    horaires = COALESCE(NULLIF(?, ''), horaires),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

let inserted = 0;
let updated = 0;
let skipped = 0;

const defaultStage = 'to_research';

for (const [name, data] of Object.entries(merged)) {
  const portalUrl = data.portalUrl || (data.installationId ?
    `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${data.installationId}` : '');

  const horairesStr = data.horaires ? JSON.stringify(data.horaires) : '';

  // Check if already exists by installation_id or name
  let existing = null;
  if (data.installationId) {
    existing = findByInstallationId.get(data.installationId);
  }
  if (!existing) {
    existing = findByName.get(name);
  }

  if (existing) {
    // Update existing
    updateDaycare.run(
      data.adresse || '',
      data.telephone || '',
      data.courriel || '',
      data.site_web || '',
      portalUrl,
      data.places_totales || null,
      data.tarif || '',
      '', // hours - not in merged data
      data.installationId || '',
      data.type || '',
      data.subventionne ? 1 : 0,
      typeof data.places_poupons === 'number' ? data.places_poupons : null,
      typeof data.places_18_mois_plus === 'number' ? data.places_18_mois_plus : null,
      data.description || '',
      horairesStr,
      existing.id
    );
    updated++;
  } else {
    // Insert new
    const maxPos = getMaxPosition.get(defaultStage);
    insertDaycare.run(
      name,
      data.adresse || '',
      data.telephone || '',
      data.courriel || '',
      data.site_web || '',
      portalUrl,
      data.places_totales || null,
      data.tarif || '',
      '', // hours
      defaultStage,
      maxPos.max + 1,
      data.installationId || '',
      data.type || '',
      data.subventionne ? 1 : 0,
      typeof data.places_poupons === 'number' ? data.places_poupons : null,
      typeof data.places_18_mois_plus === 'number' ? data.places_18_mois_plus : null,
      data.description || '',
      horairesStr
    );
    inserted++;
  }
}

console.log(`\nImport complete!`);
console.log(`  Inserted: ${inserted}`);
console.log(`  Updated: ${updated}`);
console.log(`  Total in database: ${db.prepare('SELECT COUNT(*) as count FROM daycares').get().count}`);

db.close();
