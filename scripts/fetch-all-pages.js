import { chromium } from 'playwright';
import fs from 'fs';

// All URLs from fetch-portal-node.js
const urls = [
  { name: "G. MAISON D'ENSEIGNEMENT LET'S GO", installationId: "a0UJQ00000WikJG2AZ" },
  { name: "Mme Sandra Lachance", installationId: "a0UJQ00000WjMBl2AN" },
  { name: "CPE LA FOURMILLE - INST. LA FOURMILLE", installationId: "a0UJQ00000WibXZ2AZ" },
  { name: "pénélope loignon", installationId: "a0UJQ00000Xtvh22AB" },
  { name: "Mme Dany Poulin", installationId: "a0UJQ00000WjDqL2AV" },
  { name: "G. MAISON D'ENSEIGNEMENT LET'S GO 2", installationId: "a0UJQ00000WikWI2AZ" },
  { name: "Mme Nathalie Fortier", installationId: "a0UJQ00000WjMQH2A3" },
  { name: "Chez Monia", installationId: "a0UJQ00000WjHc92AF" },
  { name: "Coco-frimousse", installationId: "a0UJQ00000WilnJ2AR" },
  { name: "Mélanie Bolduc", installationId: "a0UJQ00000WjAVf2AN" },
  { name: "Mme Bianca Tawel", installationId: "a0UJQ00000WjDqH2AV" },
  { name: "Mme Joannie Gilbert", installationId: "a0UJQ00000WjKGM2A3" },
  { name: "CPE BEAUCE-SARTIGAN - INST. LA MAISON DES PAPILLONS", installationId: "a0UJQ00000WihoQ2AR" },
  { name: "Mamy Ghislaine", installationId: "a0UJQ00000WilnK2AR" },
  { name: "Mme Lynda Nadeau", installationId: "a0UJQ00000WjAVc2AN" },
  { name: "Claudia Labbé", installationId: "a0UJQ00000WjAVl2AN" },
  { name: "G. LES PETITS COEURS", installationId: "a0UJQ00000Wih5G2AR" },
  { name: "Mme Johannie Nadeau", installationId: "a0UJQ00000WjMBe2AN" },
  { name: "G. MONTESSORI BEAUCE", installationId: "a0UJQ00000Wihm02AB" },
  { name: "CPE PANTA-MOUSSE - INST. LES PETITS ÉLANS", installationId: "a0UJQ00000WihoY2AR" },
  { name: "CPE BOUTONS D'OR - INST. PARCELLES D'OR", installationId: "a0UJQ00000Wiij22AB" },
  { name: "CPE AU PALAIS DES MERV. - INST. LES TRÉSORS DU PALAIS", installationId: "a0UJQ00000WijF82AJ" },
  { name: "CPE AU PALAIS DES MERV. -INST. LE MINI-PALAIS DES MERV.", installationId: "a0UJQ00000WijF92AJ" },
  { name: "CPE AU PALAIS DES MERV. - INST. AUX MILLE MERVEILLES", installationId: "a0UJQ00000WijFA2AZ" },
  { name: "G. LA PETITE ÉCOLE VISION BEAUCE", installationId: "a0UJQ00000WijKJ2AZ" },
  { name: "CPE LA FOURMILLE - INST. LES PETITES BESTIOLES", installationId: "a0UJQ00000WibXa2AJ" },
  { name: "G. LES PETITS CHERCHEURS", installationId: "a0UJQ00000WikOd2AJ" },
  { name: "Le coin des copains", installationId: "a0UJQ00000WilnI2AR" },
  { name: "Melissa lafontaine", installationId: "a0UJQ00000WjFBu2AN" },
  { name: "Allo les amis", installationId: "a0UJQ00000WjFBw2AN" },
  { name: "Sonia Breton", installationId: "a0UJQ00000WjFBx2AN" },
  { name: "Dominique Levesque", installationId: "a0UJQ00000WjFC02AN" },
  { name: "Melany Paquet", installationId: "a0UJQ00000WjLsR2AV" },
  { name: "Annie poulin", installationId: "a0UJQ00000WjLsS2AV" },
  { name: "Mme Claudia Provencher", installationId: "a0UJQ00000WjLsT2AV" },
  { name: "Mme Karine Vachon", installationId: "a0UJQ00000WjLsU2AV" },
  { name: "Les P'tits Mousses", installationId: "a0UJQ00000WjLsV2AV" },
  { name: "Nathalie Perron", installationId: "a0UJQ00000WjDqF2AV" },
  { name: "Chez Luce et ses Lucioles", installationId: "a0UJQ00000WjDqG2AV" },
  { name: "milieu familial chez Mamie", installationId: "a0UJQ00000WjDqI2AV" },
  { name: "Kathia mathieu", installationId: "a0UJQ00000WjDqJ2AV" },
  { name: "Sonia Rancourt", installationId: "a0UJQ00000WjDqM2AV" },
  { name: "Mme Nancy Beaudoin", installationId: "a0UJQ00000WjHc82AF" },
  { name: "Lynda", installationId: "a0UJQ00000WjHcC2AV" },
  { name: "Nicole", installationId: "a0UJQ00000WjHcD2AV" },
  { name: "Service de garde chez Bibi", installationId: "a0UJQ00000WjHcE2AV" },
  { name: "Mme Jeannine Lemieux", installationId: "a0UJQ00000WjHcF2AV" },
  { name: "Mme Andrée-Anne Levesque", installationId: "a0UJQ00000WjAVd2AN" },
  { name: "Mme Stéphanie Bérubé", installationId: "a0UJQ00000WjAVe2AN" },
  { name: "Suzanne Dumas", installationId: "a0UJQ00000WjAVg2AN" },
  { name: "Mme Annie Lessard", installationId: "a0UJQ00000WjAVi2AN" },
  { name: "Mme Caroline Marquis", installationId: "a0UJQ00000WjAVj2AN" },
  { name: "Les Poussinots a Karo", installationId: "a0UJQ00000WjAVm2AN" },
  { name: "Isabelle Nadeau", installationId: "a0UJQ00000WjAVn2AN" },
  { name: "GARDERIE MANON GENDRON", installationId: "a0UJQ00000WjAVo2AN" },
  { name: "Mme Stécy Paquet-Roy", installationId: "a0UJQ00000WjAVp2AN" },
  { name: "Mme Annie Audet", installationId: "a0UJQ00000WjAVr2AN" },
  { name: "Garderie chez klodya", installationId: "a0UJQ00000WjAVt2AN" },
  { name: "Karine Ouellet", installationId: "a0UJQ00000WjAVu2AN" },
  { name: "louise ferland", installationId: "a0UJQ00000WjKGJ2A3" },
  { name: "Josée Dulac", installationId: "a0UJQ00000WjKGK2A3" },
  { name: "Johanne Drouin", installationId: "a0UJQ00000WjKGL2A3" },
  { name: "Mme Nathalie Talbot", installationId: "a0UJQ00000WjKGR2A3" },
  { name: "Cassandra Poulin", installationId: "a0UJQ00000WjMBd2AN" },
  { name: "souris", installationId: "a0UJQ00000WjMBh2AN" },
  { name: "Leslie Pomerleau", installationId: "a0UJQ00000WjMOb2AN" },
  { name: "Brenda Champagne", installationId: "a0UJQ00000WjMOe2AN" },
  { name: "Dany Moisan", installationId: "a0UJQ00000WjMOf2AN" },
  { name: "Amélie Giguère", installationId: "a0UJQ00000WjMQF2A3" },
  { name: "Garderie les rayons de soleil", installationId: "a0UJQ00000WjMQG2A3" },
  { name: "Garderie Tamayü", installationId: "a0UJQ00000WjMQI2A3" },
  { name: "Mme Sandra Méthot", installationId: "a0UJQ00000WjMTN2A3" },
  { name: "Mme Cathy Rainville", installationId: "a0UJQ00000WjMTO2A3" }
];

const outputDir = 'portal-snapshots';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function fetchPage(page, installationId, name) {
  const url = `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?language=fr&installationId=${installationId}`;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for main content to load
    await page.waitForSelector('main h3', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Extract structured data directly from the page
    const data = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return null;

      const getText = (selector) => {
        const el = main.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      const fullText = main.innerText || '';

      // Name - first h3
      const name = main.querySelector('h3')?.textContent?.trim();

      // Address - text after location icon
      const addressEl = [...main.querySelectorAll('h3')][0]?.parentElement;
      const addressText = addressEl?.textContent?.replace(name, '').trim();

      // Type, Subsidized, Price from badges
      let daycareType = null;
      let subventionne = false;
      let price = null;

      const badges = main.querySelectorAll('[class*="badge"], [class*="chip"]');
      const allText = main.innerText;

      if (allText.includes('CPE')) daycareType = 'CPE';
      else if (allText.includes('Garderie')) daycareType = 'Garderie';
      else if (allText.includes('Milieu familial')) daycareType = 'Milieu familial';

      subventionne = allText.includes('Subventionné') && !allText.includes('Non subventionné');

      const priceMatch = fullText.match(/(\d+[,.]?\d*)\s*\$\s*[\/\s]*jour/i);
      if (priceMatch) price = priceMatch[0].trim();

      // Presentation/Description
      let description = null;
      const presentationHeading = [...main.querySelectorAll('h3')].find(h =>
        h.textContent.includes('Présentation')
      );
      if (presentationHeading) {
        const container = presentationHeading.closest('[class]')?.parentElement;
        const descEl = container?.querySelector('div:not(:has(h3))');
        if (descEl) description = descEl.textContent.trim();
      }

      // Hours
      const horaires = {};
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      for (const day of days) {
        const regex = new RegExp(`${day}[\\s\\n]+([\\d\\s:h-]+|Fermé)`, 'i');
        const match = fullText.match(regex);
        if (match) horaires[day.toLowerCase()] = match[1].trim();
      }

      // Places
      const placesMatch = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*totales/i);
      const pouponsMatch = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*poupons/i);
      const plus18Match = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*18\s*mois/i);

      // Contact info
      const phoneMatch = fullText.match(/(\d{3}\s+\d{3}[-\s]\d{4})/);
      const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);

      // Bureau Coordonnateur
      let bureauCoord = null;
      if (fullText.includes('Bureau coordonnateur')) {
        const bcMatch = fullText.match(/Bureau coordonnateur[\s\S]*?(BC [^\n]+)/);
        if (bcMatch) bureauCoord = bcMatch[1].trim();
      }

      // Accessibility
      const accessible = fullText.includes('Accessible aux personnes à mobilité réduite');

      // Inspection report
      const inspectionLink = main.querySelector('a[href*="infocomplsg"]')?.href;

      // Website from description
      const websiteMatch = description?.match(/https?:\/\/[^\s]+/);

      return {
        name,
        address: addressText,
        phone: phoneMatch?.[1] || null,
        email: emailMatch?.[0] || null,
        website: websiteMatch?.[0] || null,
        daycare_type: daycareType,
        subventionne,
        price,
        capacity: placesMatch ? parseInt(placesMatch[1]) : null,
        places_poupons: pouponsMatch ? parseInt(pouponsMatch[1]) : null,
        places_18_mois_plus: plus18Match ? parseInt(plus18Match[1]) : null,
        description,
        horaires: Object.keys(horaires).length > 0 ? horaires : null,
        bureau_coord_name: bureauCoord,
        accessible,
        inspection_url: inspectionLink || null
      };
    });

    return data;
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`Fetching ${urls.length} daycare pages...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const { name, installationId } = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${name.substring(0, 45).padEnd(45)} `);

    const data = await fetchPage(page, installationId, name);

    if (data && data.name) {
      results.push({ installationId, ...data });
      console.log('OK');
    } else {
      results.push({ installationId, name, error: 'Failed to extract' });
      console.log('FAILED');
    }

    // Small delay to be polite
    await page.waitForTimeout(500);
  }

  await browser.close();

  // Save results
  fs.writeFileSync('scraped-daycares.json', JSON.stringify(results, null, 2));

  const successCount = results.filter(r => !r.error).length;
  console.log(`\nDone! ${successCount}/${urls.length} successfully scraped.`);
  console.log('Saved to scraped-daycares.json');

  // Print field summary
  console.log('\nField coverage:');
  const fields = ['name', 'address', 'phone', 'email', 'website', 'daycare_type', 'subventionne',
                  'price', 'capacity', 'places_poupons', 'places_18_mois_plus', 'description',
                  'horaires', 'bureau_coord_name', 'accessible', 'inspection_url'];

  for (const field of fields) {
    const count = results.filter(r => r[field] && r[field] !== '').length;
    console.log(`  ${field.padEnd(20)} ${count}/${results.length}`);
  }
}

main().catch(console.error);
