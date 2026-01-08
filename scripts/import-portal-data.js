import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Read parsed data
const parsedData = JSON.parse(fs.readFileSync('.trash/parsed-daycares.json', 'utf8'));

// Bureau coordonnateur name for Milieu familial
const BC_CPE_AU_PALAIS = 'BC CPE AU PALAIS DES MERVEILLES';

console.log(`Importing ${Object.keys(parsedData).length} daycares...\n`);

let created = 0;
let updated = 0;
let skipped = 0;

for (const [installationId, data] of Object.entries(parsedData)) {
  // Add bureau_coord_name for Milieu familial
  const bureauCoordName = data.type === 'Milieu familial' ? BC_CPE_AU_PALAIS : '';

  // Check if daycare exists by installation_id
  const existing = db.prepare('SELECT id FROM daycares WHERE installation_id = ?').get(installationId);

  // Prepare horaires as JSON string
  const horairesStr = data.horaires ? JSON.stringify(data.horaires) : '';

  // Map type to daycare_type field value
  const daycareType = data.type || '';

  if (existing) {
    // Update existing record
    db.prepare(`
      UPDATE daycares SET
        name = ?,
        address = ?,
        phone = ?,
        email = ?,
        website = ?,
        daycare_type = ?,
        subventionne = ?,
        capacity = ?,
        places_poupons = ?,
        places_18_mois_plus = ?,
        description = ?,
        horaires = ?,
        bureau_coord_name = ?,
        accessible = ?,
        portal_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name || '',
      data.address || '',
      data.phone || '',
      data.email || '',
      data.website || '',
      daycareType,
      data.subventionne ? 1 : 0,
      data.places_totales || null,
      typeof data.places_poupons === 'number' ? data.places_poupons : null,
      typeof data.places_18_mois_plus === 'number' ? data.places_18_mois_plus : null,
      data.description || '',
      horairesStr,
      bureauCoordName,
      data.accessible ? 1 : 0,
      `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`,
      existing.id
    );
    updated++;
    console.log(`  Updated: ${data.name}`);
  } else {
    // Create new record
    db.prepare(`
      INSERT INTO daycares (
        name, address, phone, email, website,
        installation_id, portal_url, daycare_type, subventionne,
        capacity, places_poupons, places_18_mois_plus,
        description, horaires, bureau_coord_name, accessible,
        stage, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'to_research', 0)
    `).run(
      data.name || '',
      data.address || '',
      data.phone || '',
      data.email || '',
      data.website || '',
      installationId,
      `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`,
      daycareType,
      data.subventionne ? 1 : 0,
      data.places_totales || null,
      typeof data.places_poupons === 'number' ? data.places_poupons : null,
      typeof data.places_18_mois_plus === 'number' ? data.places_18_mois_plus : null,
      data.description || '',
      horairesStr,
      bureauCoordName,
      data.accessible ? 1 : 0
    );
    created++;
    console.log(`  Created: ${data.name}`);
  }
}

// Print summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Import complete!`);
console.log(`  Created: ${created}`);
console.log(`  Updated: ${updated}`);
console.log(`  Total:   ${created + updated}`);

// Print type breakdown
const types = {};
for (const data of Object.values(parsedData)) {
  const t = data.type || 'Unknown';
  types[t] = (types[t] || 0) + 1;
}
console.log(`\nBy type:`);
for (const [type, count] of Object.entries(types)) {
  console.log(`  ${type}: ${count}`);
}

db.close();
