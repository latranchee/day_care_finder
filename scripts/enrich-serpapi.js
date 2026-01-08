import Database from 'better-sqlite3';
import path from 'path';

const SERPAPI_KEY = process.argv[2];
if (!SERPAPI_KEY) {
  console.error('Usage: node scripts/enrich-serpapi.js <SERPAPI_KEY>');
  process.exit(1);
}

const dbPath = path.join(process.cwd(), 'data', 'daycares.db');
const db = new Database(dbPath);

// Get CPEs that need enrichment (missing website or other data)
const cpes = db.prepare(`
  SELECT id, name, address, website, phone, rating
  FROM daycares
  WHERE name LIKE '%CPE%'
`).all();

console.log(`Found ${cpes.length} CPEs to enrich\n`);

async function searchSerpApi(query) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: 'google',
    q: query,
    location: 'Quebec, Canada',
    gl: 'ca',
    hl: 'fr'
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) {
    throw new Error(`SERPAPI error: ${res.status}`);
  }
  return res.json();
}

async function searchGoogleMaps(query) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: 'google_maps',
    q: query,
    ll: '@46.117778,-70.671389,14z', // Saint-Georges coordinates
    type: 'search'
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) {
    throw new Error(`SERPAPI Maps error: ${res.status}`);
  }
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

async function enrichCpe(cpe) {
  console.log(`\n--- Searching: ${cpe.name} ---`);

  try {
    // Try Google Maps first for business info
    const mapsQuery = `${cpe.name} Saint-Georges Quebec`;
    const mapsResults = await searchGoogleMaps(mapsQuery);

    let website = cpe.website || '';
    let rating = cpe.rating;
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

      // Fallback to regular search
      const webResults = await searchSerpApi(mapsQuery);

      if (webResults.organic_results && webResults.organic_results.length > 0) {
        const firstResult = webResults.organic_results[0];
        console.log(`  Web result: ${firstResult.title}`);

        // Only use website if it looks relevant
        if (firstResult.link && !website &&
            (firstResult.link.includes('cpe') || firstResult.title.toLowerCase().includes('cpe'))) {
          website = firstResult.link;
          console.log(`  Website: ${website}`);
        }
      }

      // Check knowledge graph
      if (webResults.knowledge_graph) {
        const kg = webResults.knowledge_graph;
        if (kg.website && !website) {
          website = kg.website;
          console.log(`  Website (KG): ${website}`);
        }
        if (kg.rating) {
          rating = kg.rating;
          console.log(`  Rating (KG): ${rating}`);
        }
      }
    }

    // Update database
    if (website !== cpe.website || rating !== cpe.rating || hours) {
      updateStmt.run(website, rating, hours, cpe.id);
      console.log(`  ✓ Updated database`);
    } else {
      console.log(`  No new data to update`);
    }

  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }

  // Rate limit - wait between requests
  await new Promise(r => setTimeout(r, 1000));
}

async function main() {
  for (const cpe of cpes) {
    await enrichCpe(cpe);
  }

  console.log('\n=== Done! ===');

  // Show updated data
  const updated = db.prepare(`
    SELECT name, website, rating, hours
    FROM daycares
    WHERE name LIKE '%CPE%'
  `).all();

  console.log('\nUpdated CPE data:');
  console.table(updated);

  db.close();
}

main().catch(console.error);
