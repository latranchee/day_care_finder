import { chromium } from 'playwright';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

// URLs from fetch-portal-node.js
const urls = [
  { name: "G. MAISON D'ENSEIGNEMENT LET'S GO", installationId: "a0UJQ00000WikJG2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikJG2AZ" },
  { name: "Mme Sandra Lachance", installationId: "a0UJQ00000WjMBl2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBl2AN" },
  { name: "CPE LA FOURMILLE - INST. LA FOURMILLE", installationId: "a0UJQ00000WibXZ2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WibXZ2AZ" },
  { name: "pénélope loignon", installationId: "a0UJQ00000Xtvh22AB", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Xtvh22AB" },
  { name: "Mme Dany Poulin", installationId: "a0UJQ00000WjDqL2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqL2AV" },
  { name: "G. MAISON D'ENSEIGNEMENT LET'S GO 2", installationId: "a0UJQ00000WikWI2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikWI2AZ" },
  { name: "Mme Nathalie Fortier", installationId: "a0UJQ00000WjMQH2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQH2A3" },
  { name: "Chez Monia", installationId: "a0UJQ00000WjHc92AF", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHc92AF" },
  { name: "Coco-frimousse", installationId: "a0UJQ00000WilnJ2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnJ2AR" },
  { name: "Mélanie Bolduc", installationId: "a0UJQ00000WjAVf2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVf2AN" },
  { name: "Mme Bianca Tawel", installationId: "a0UJQ00000WjDqH2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqH2AV" },
  { name: "Mme Joannie Gilbert", installationId: "a0UJQ00000WjKGM2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGM2A3" },
  { name: "CPE BEAUCE-SARTIGAN - INST. LA MAISON DES PAPILLONS", installationId: "a0UJQ00000WihoQ2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WihoQ2AR" },
  { name: "Mamy Ghislaine", installationId: "a0UJQ00000WilnK2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnK2AR" },
  { name: "Mme Lynda Nadeau", installationId: "a0UJQ00000WjAVc2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVc2AN" },
  { name: "Claudia Labbé", installationId: "a0UJQ00000WjAVl2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVl2AN" },
  { name: "G. LES PETITS COEURS", installationId: "a0UJQ00000Wih5G2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wih5G2AR" },
  { name: "Mme Johannie Nadeau", installationId: "a0UJQ00000WjMBe2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBe2AN" },
  { name: "G. MONTESSORI BEAUCE", installationId: "a0UJQ00000Wihm02AB", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wihm02AB" },
  { name: "CPE PANTA-MOUSSE - INST. LES PETITS ÉLANS", installationId: "a0UJQ00000WihoY2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WihoY2AR" },
  { name: "CPE BOUTONS D'OR - INST. PARCELLES D'OR", installationId: "a0UJQ00000Wiij22AB", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wiij22AB" },
  { name: "CPE AU PALAIS DES MERV. - INST. LES TRÉSORS DU PALAIS", installationId: "a0UJQ00000WijF82AJ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijF82AJ" },
  { name: "CPE AU PALAIS DES MERV. -INST. LE MINI-PALAIS DES MERV.", installationId: "a0UJQ00000WijF92AJ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijF92AJ" },
  { name: "CPE AU PALAIS DES MERV. - INST. AUX MILLE MERVEILLES", installationId: "a0UJQ00000WijFA2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijFA2AZ" },
  { name: "G. LA PETITE ÉCOLE VISION BEAUCE", installationId: "a0UJQ00000WijKJ2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijKJ2AZ" },
  { name: "CPE LA FOURMILLE - INST. LES PETITES BESTIOLES", installationId: "a0UJQ00000WibXa2AJ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WibXa2AJ" },
  { name: "G. LES PETITS CHERCHEURS", installationId: "a0UJQ00000WikOd2AJ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikOd2AJ" },
  { name: "Le coin des copains", installationId: "a0UJQ00000WilnI2AR", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnI2AR" },
  { name: "Melissa lafontaine", installationId: "a0UJQ00000WjFBu2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBu2AN" },
  { name: "Allo les amis", installationId: "a0UJQ00000WjFBw2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBw2AN" },
  { name: "Sonia Breton", installationId: "a0UJQ00000WjFBx2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBx2AN" },
  { name: "Dominique Levesque", installationId: "a0UJQ00000WjFC02AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFC02AN" },
  { name: "Melany Paquet", installationId: "a0UJQ00000WjLsR2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsR2AV" },
  { name: "Annie poulin", installationId: "a0UJQ00000WjLsS2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsS2AV" },
  { name: "Mme Claudia Provencher", installationId: "a0UJQ00000WjLsT2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsT2AV" },
  { name: "Mme Karine Vachon", installationId: "a0UJQ00000WjLsU2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsU2AV" },
  { name: "Les P'tits Mousses", installationId: "a0UJQ00000WjLsV2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsV2AV" },
  { name: "Nathalie Perron", installationId: "a0UJQ00000WjDqF2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqF2AV" },
  { name: "Chez Luce et ses Lucioles", installationId: "a0UJQ00000WjDqG2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqG2AV" },
  { name: "milieu familial chez Mamie", installationId: "a0UJQ00000WjDqI2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqI2AV" },
  { name: "Kathia mathieu", installationId: "a0UJQ00000WjDqJ2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqJ2AV" },
  { name: "Sonia Rancourt", installationId: "a0UJQ00000WjDqM2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqM2AV" },
  { name: "Mme Nancy Beaudoin", installationId: "a0UJQ00000WjHc82AF", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHc82AF" },
  { name: "Lynda", installationId: "a0UJQ00000WjHcC2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcC2AV" },
  { name: "Nicole", installationId: "a0UJQ00000WjHcD2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcD2AV" },
  { name: "Service de garde chez Bibi", installationId: "a0UJQ00000WjHcE2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcE2AV" },
  { name: "Mme Jeannine Lemieux", installationId: "a0UJQ00000WjHcF2AV", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcF2AV" },
  { name: "Mme Andrée-Anne Levesque", installationId: "a0UJQ00000WjAVd2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVd2AN" },
  { name: "Mme Stéphanie Bérubé", installationId: "a0UJQ00000WjAVe2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVe2AN" },
  { name: "Suzanne Dumas", installationId: "a0UJQ00000WjAVg2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVg2AN" },
  { name: "Mme Annie Lessard", installationId: "a0UJQ00000WjAVi2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVi2AN" },
  { name: "Mme Caroline Marquis", installationId: "a0UJQ00000WjAVj2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVj2AN" },
  { name: "Les Poussinots a Karo", installationId: "a0UJQ00000WjAVm2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVm2AN" },
  { name: "Isabelle Nadeau", installationId: "a0UJQ00000WjAVn2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVn2AN" },
  { name: "GARDERIE MANON GENDRON", installationId: "a0UJQ00000WjAVo2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVo2AN" },
  { name: "Mme Stécy Paquet-Roy", installationId: "a0UJQ00000WjAVp2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVp2AN" },
  { name: "Mme Annie Audet", installationId: "a0UJQ00000WjAVr2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVr2AN" },
  { name: "Garderie chez klodya", installationId: "a0UJQ00000WjAVt2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVt2AN" },
  { name: "Karine Ouellet", installationId: "a0UJQ00000WjAVu2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVu2AN" },
  { name: "louise ferland", installationId: "a0UJQ00000WjKGJ2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGJ2A3" },
  { name: "Josée Dulac", installationId: "a0UJQ00000WjKGK2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGK2A3" },
  { name: "Johanne Drouin", installationId: "a0UJQ00000WjKGL2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGL2A3" },
  { name: "Mme Nathalie Talbot", installationId: "a0UJQ00000WjKGR2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGR2A3" },
  { name: "Cassandra Poulin", installationId: "a0UJQ00000WjMBd2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBd2AN" },
  { name: "souris", installationId: "a0UJQ00000WjMBh2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBh2AN" },
  { name: "Leslie Pomerleau", installationId: "a0UJQ00000WjMOb2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOb2AN" },
  { name: "Brenda Champagne", installationId: "a0UJQ00000WjMOe2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOe2AN" },
  { name: "Dany Moisan", installationId: "a0UJQ00000WjMOf2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOf2AN" },
  { name: "Amélie Giguère", installationId: "a0UJQ00000WjMQF2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQF2A3" },
  { name: "Garderie les rayons de soleil", installationId: "a0UJQ00000WjMQG2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQG2A3" },
  { name: "Garderie Tamayü", installationId: "a0UJQ00000WjMQI2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQI2A3" },
  { name: "Mme Sandra Méthot", installationId: "a0UJQ00000WjMTN2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMTN2A3" },
  { name: "Mme Cathy Rainville", installationId: "a0UJQ00000WjMTO2A3", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMTO2A3" }
];

const client = new Anthropic();

const PROMPT = `Extract ALL information from this Quebec daycare page. Output ONLY valid JSON with these fields:

{
  "name": "string - official daycare name",
  "address": "string - full address with postal code",
  "phone": "string or null - phone number (format: XXX XXX-XXXX)",
  "email": "string or null - email address",
  "website": "string or null - website URL",
  "facebook": "string or null - Facebook page URL",
  "daycare_type": "string - one of: CPE, Garderie, Milieu familial",
  "subventionne": "boolean - true if subventionné/subsidized",
  "price": "string - daily rate (e.g., '9.10$/jour' or '45$/jour')",
  "capacity": "number - total places",
  "places_poupons": "number or null - infant spots (0-18 months)",
  "places_18_mois_plus": "number or null - toddler spots (18+ months)",
  "age_range": "string - age range accepted (e.g., '0-5 ans')",
  "description": "string - the presentation/description text (Présentation section)",
  "horaires": {
    "lundi": "string - e.g., '07h00-18h00' or 'Fermé'",
    "mardi": "string",
    "mercredi": "string",
    "jeudi": "string",
    "vendredi": "string",
    "samedi": "string or 'Fermé'",
    "dimanche": "string or 'Fermé'"
  },
  "accessible": "boolean - mobility accessible (fauteuil roulant)",
  "inspection_url": "string or null - link to inspection report",
  "bureau_coord": "string or null - bureau coordinateur name"
}

IMPORTANT:
- Extract the FULL presentation/description text, not truncated
- For horaires, use format "HHhMM-HHhMM" or "Fermé"
- subventionne is true if page says "Subventionné" (not "Non subventionné")
- Output ONLY the JSON object, no markdown code blocks, no explanation

Page content:
`;

const BATCH_SIZE = 5;
const VERIFY_AFTER_BATCH = 1; // Stop for verification after this batch

async function fetchPageContent(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000); // Wait for dynamic content

    const content = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.innerText : document.body.innerText;
    });

    return content;
  } catch (err) {
    console.error(`  Error fetching: ${err.message}`);
    return null;
  }
}

async function parseWithLLM(content, installationId) {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: PROMPT + content
      }]
    });

    const text = response.content[0].text;

    // Extract JSON (handle potential markdown code blocks)
    let jsonStr = text;
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
    }

    const data = JSON.parse(jsonStr.trim());
    return { installationId, ...data, _success: true };
  } catch (e) {
    console.error(`  Parse error: ${e.message}`);
    return { installationId, _error: e.message, _success: false };
  }
}

function printFieldSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('EXTRACTED FIELDS SUMMARY');
  console.log('='.repeat(60));

  const allFields = new Set();
  const fieldCounts = {};
  const fieldExamples = {};

  for (const r of results) {
    if (!r._success) continue;
    for (const [key, value] of Object.entries(r)) {
      if (key.startsWith('_')) continue;
      allFields.add(key);
      fieldCounts[key] = (fieldCounts[key] || 0) + (value !== null && value !== '' ? 1 : 0);
      if (!fieldExamples[key] && value !== null && value !== '') {
        fieldExamples[key] = typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 50);
      }
    }
  }

  console.log('\nFields found:');
  for (const field of [...allFields].sort()) {
    const count = fieldCounts[field] || 0;
    const example = fieldExamples[field] || '(none)';
    console.log(`  ${field.padEnd(25)} ${count}/${results.filter(r => r._success).length} - Example: ${example}`);
  }

  console.log('\n' + '='.repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  const continueAll = args.includes('--continue');

  console.log('Portal Scraper with LLM Extraction');
  console.log('='.repeat(60));
  console.log(`Total URLs: ${urls.length}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Mode: ${verifyOnly ? 'VERIFY ONLY (1 batch)' : continueAll ? 'FULL RUN' : 'VERIFY FIRST BATCH'}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const start = batchNum * BATCH_SIZE;
    const batch = urls.slice(start, start + BATCH_SIZE);

    console.log(`\nBatch ${batchNum + 1}/${totalBatches} (${batch.length} items)`);
    console.log('-'.repeat(40));

    // Fetch all pages in batch
    const pageContents = [];
    for (const item of batch) {
      process.stdout.write(`  Fetching: ${item.name.substring(0, 40).padEnd(40)} `);
      const content = await fetchPageContent(page, item.url);
      if (content) {
        pageContents.push({ ...item, content });
        console.log('OK');
      } else {
        console.log('FAILED');
      }
      await page.waitForTimeout(300);
    }

    // Parse with LLM in parallel
    console.log(`  Parsing ${pageContents.length} pages with Haiku...`);
    const parsePromises = pageContents.map(item =>
      parseWithLLM(item.content, item.installationId)
    );
    const batchResults = await Promise.all(parsePromises);
    results.push(...batchResults);

    const successCount = batchResults.filter(r => r._success).length;
    console.log(`  Batch complete: ${successCount}/${batch.length} successful`);

    // Check if we should stop for verification
    if (!continueAll && batchNum + 1 === VERIFY_AFTER_BATCH) {
      await browser.close();

      // Save intermediate results
      fs.writeFileSync('scraped-batch1.json', JSON.stringify(results, null, 2));
      console.log('\nSaved batch results to scraped-batch1.json');

      // Print field summary
      printFieldSummary(results);

      // Print sample output
      console.log('\nSAMPLE OUTPUT (first successful result):');
      console.log('='.repeat(60));
      const sample = results.find(r => r._success);
      if (sample) {
        console.log(JSON.stringify(sample, null, 2));
      }

      console.log('\n' + '='.repeat(60));
      console.log('VERIFICATION COMPLETE');
      console.log('='.repeat(60));
      console.log('\nTo continue with all batches, run:');
      console.log('  node scripts/scrape-portal-llm.js --continue');
      console.log('\nTo re-run verification only:');
      console.log('  node scripts/scrape-portal-llm.js --verify-only');

      return;
    }

    // Small delay between batches
    if (batchNum + 1 < totalBatches) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  await browser.close();

  // Save all results
  fs.writeFileSync('scraped-all.json', JSON.stringify(results, null, 2));
  console.log(`\nSaved all results to scraped-all.json`);

  printFieldSummary(results);

  const successCount = results.filter(r => r._success).length;
  console.log(`\nFinal: ${successCount}/${urls.length} successfully parsed`);
}

main().catch(console.error);
