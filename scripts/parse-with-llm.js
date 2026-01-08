import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const textDir = 'portal-text';
const outputFile = 'parsed-daycares.json';

const client = new Anthropic();

const PROMPT = `Extract structured data from this daycare information as JSON with these fields:
- name (string)
- address (string)
- phone (string or null)
- type (string: "CPE", "Garderie", or "Milieu familial")
- subventionne (boolean)
- tarif (number, price per day)
- places_totales (number)
- places_poupons (number)
- places_18_mois_plus (number)
- description (string, the presentation text)
- horaires (object with lundi/mardi/mercredi/jeudi/vendredi/samedi/dimanche as keys)
- accessible (boolean, mobility accessible)
- website (string or null)
- email (string or null)

Output ONLY valid JSON, no markdown, no explanation.

Content:
`;

async function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const installationId = path.basename(filePath, '.txt');

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: PROMPT + content
    }]
  });

  const text = response.content[0].text;

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  if (text.includes('```')) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];
  }

  try {
    const data = JSON.parse(jsonStr.trim());
    return { installationId, ...data };
  } catch (e) {
    console.error(`Parse error for ${installationId}: ${e.message}`);
    return { installationId, error: e.message, raw: text };
  }
}

async function main() {
  const files = fs.readdirSync(textDir).filter(f => f.endsWith('.txt'));
  console.log(`Processing ${files.length} files with Claude Haiku...\n`);

  const results = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);

    process.stdout.write(`Batch ${batchNum}/${totalBatches}: `);

    const promises = batch.map(f => parseFile(path.join(textDir, f)));
    const batchResults = await Promise.all(promises);

    results.push(...batchResults);
    console.log(`${batch.length} done`);

    // Small delay between batches
    if (i + BATCH_SIZE < files.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Save results
  const parsed = {};
  for (const r of results) {
    parsed[r.installationId] = r;
  }

  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
  console.log(`\nSaved ${results.length} entries to ${outputFile}`);

  // Update merged file
  const merged = JSON.parse(fs.readFileSync('daycares-merged.json', 'utf8'));
  let updated = 0;

  for (const [id, data] of Object.entries(parsed)) {
    if (data.error) continue;

    // Find entry by installationId
    const entry = Object.values(merged).find(m => m.installationId === id);
    if (entry) {
      Object.assign(entry, {
        telephone: data.phone || entry.telephone,
        description: data.description || entry.description,
        horaires: data.horaires || entry.horaires,
        site_web: data.website || entry.site_web,
        courriel: data.email || entry.courriel,
        adresse: data.address || entry.adresse,
        tarif: data.tarif ? `${data.tarif}$/jour` : entry.tarif,
        places_totales: data.places_totales ?? entry.places_totales,
        places_poupons: data.places_poupons ?? entry.places_poupons,
        places_18_mois_plus: data.places_18_mois_plus ?? entry.places_18_mois_plus,
        accessible: data.accessible ?? entry.accessible
      });
      updated++;
    }
  }

  fs.writeFileSync('daycares-merged.json', JSON.stringify(merged, null, 2));
  console.log(`Updated ${updated} entries in daycares-merged.json`);
}

main().catch(console.error);
