import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Read JSON file
const jsonPath = path.join(process.cwd(), 'daycare.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const daycares = data.services_de_garde;

// Get max position for to_research stage
const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) as max FROM daycares WHERE stage = 'to_research'").get();
let position = maxPos.max + 1;

const insert = db.prepare(`
  INSERT INTO daycares (name, address, phone, website, capacity, price, hours, age_range, rating, stage, position)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'to_research', ?)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    const info = item.informations_complementaires || {};

    // Build age range from places info
    let ageRange = '';
    if (item.places_poupons && item.places_18_mois_plus) {
      ageRange = `Poupons: ${item.places_poupons}, 18m+: ${item.places_18_mois_plus}`;
    }

    // Build hours info from type
    const hours = item.type || '';

    insert.run(
      item.nom,
      item.adresse || '',
      info.telephone || '',
      info.site_web || '',
      item.places_totales || null,
      item.tarif || '',
      hours,
      ageRange,
      null,
      position++
    );
  }
});

insertMany(daycares);

console.log(`Imported ${daycares.length} daycares`);
db.close();
