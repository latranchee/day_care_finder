import Database from 'better-sqlite3';
import path from 'path';

const SERPAPI_KEY = process.argv[2];
if (!SERPAPI_KEY) {
  console.error('Usage: node scripts/enrich-garderies.js <SERPAPI_KEY>');
  process.exit(1);
}

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Get Garderies
const garderies = db.prepare(`
  SELECT id, name, address, website, phone, rating
  FROM daycares
  WHERE name LIKE '%G.%' OR name LIKE '%Garderie%'
`).all();

console.log(`Found ${garderies.length} Garderies to enrich\n`);

async function searchGoogleMaps(query) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: 'google_maps',
    q: query,
    ll: '@46.117778,-70.671389,14z',
    type: 'search'
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) throw new Error(`SERPAPI Maps error: ${res.status}`);
  return res.json();
}

async function searchWeb(query) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: 'google',
    q: query,
    location: 'Quebec, Canada',
    gl: 'ca',
    hl: 'fr'
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) throw new Error(`SERPAPI error: ${res.status}`);
  return res.json();
}

const updateStmt = db.prepare(`
  UPDATE daycares
  SET website = COALESCE(NULLIF(?, ''), website),
      rating = COALESCE(?, rating),
      hours = COALESCE(NULLIF(?, ''), hours),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

async function enrichGarderie(g) {
  // Clean up name for search (remove "G." prefix)
  const searchName = g.name.replace(/^G\.\s*/, 'Garderie ');
  console.log(`\n--- Searching: ${searchName} ---`);

  try {
    const mapsQuery = `${searchName} Saint-Georges Quebec`;
    const mapsResults = await searchGoogleMaps(mapsQuery);

    let website = g.website || '';
    let rating = g.rating;
    let hours = '';

    if (mapsResults.local_results && mapsResults.local_results.length > 0) {
      const place = mapsResults.local_results[0];
      console.log(`  Found on Maps: ${place.title}`);

      if (place.website && !website) {
        website = place.website;
        console.log(`  Website: ${website}`);
      }
      if (place.rating) {
        rating = place.rating;
        console.log(`  Rating: ${rating}/5 (${place.reviews || 0} reviews)`);
      }
      if (place.hours) {
        hours = place.hours;
        console.log(`  Hours: ${hours}`);
      }
      if (place.phone) {
        console.log(`  Phone: ${place.phone}`);
      }
    } else {
      console.log('  No Maps results, trying web search...');
      const webResults = await searchWeb(mapsQuery);

      if (webResults.organic_results && webResults.organic_results.length > 0) {
        const first = webResults.organic_results[0];
        console.log(`  Web result: ${first.title}`);
        if (first.link && !website &&
            (first.link.includes('garderie') || first.title.toLowerCase().includes('garderie'))) {
          website = first.link;
          console.log(`  Website: ${website}`);
        }
      }
      if (webResults.knowledge_graph) {
        const kg = webResults.knowledge_graph;
        if (kg.website && !website) website = kg.website;
        if (kg.rating) {
          rating = kg.rating;
          console.log(`  Rating (KG): ${rating}`);
        }
      }
    }

    if (website !== g.website || rating !== g.rating || hours) {
      updateStmt.run(website, rating, hours, g.id);
      console.log(`  ✓ Updated database`);
    } else {
      console.log(`  No new data to update`);
    }

  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));
}

async function main() {
  for (const g of garderies) {
    await enrichGarderie(g);
  }

  console.log('\n=== Done! ===');

  const updated = db.prepare(`
    SELECT name, website, rating, hours
    FROM daycares
    WHERE name LIKE '%G.%' OR name LIKE '%Garderie%'
  `).all();

  console.log('\nUpdated Garderie data:');
  console.table(updated);

  db.close();
}

main().catch(console.error);
