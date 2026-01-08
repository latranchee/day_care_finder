import { chromium } from 'playwright';
import fs from 'fs';

// Read merged data and URLs
const merged = JSON.parse(fs.readFileSync('daycares-merged.json', 'utf8'));
const urls = JSON.parse(fs.readFileSync('portal-urls.json', 'utf8'));

console.log(`Scraping ${urls.length} daycare pages...\n`);

async function scrapePage(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for main content
  await page.waitForSelector('main h3', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000); // Extra wait for dynamic content

  const data = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return null;

    const fullText = main.innerText || '';

    // Name - first h3
    const name = main.querySelector('h3')?.textContent?.trim();

    // Address - look for postal code pattern
    const addressMatch = fullText.match(/(\d+[^,\n]*,\s*[^,\n]*[A-Z]\d[A-Z]\s*\d[A-Z]\d[^,\n]*,\s*[\w-]+)/);

    // Phone - pattern 418 xxx-xxxx
    const phoneMatch = fullText.match(/(\d{3}\s+\d{3}[-\s]\d{4})/);

    // Description - long text block after "Présentation"
    let description = null;
    const presentationHeading = [...main.querySelectorAll('h3')].find(h => h.textContent.includes('Présentation'));
    if (presentationHeading) {
      const nextEl = presentationHeading.parentElement?.querySelector('div:not(:has(h3))');
      if (nextEl && nextEl.textContent.length > 50) {
        description = nextEl.textContent.trim();
      }
    }
    // Fallback - find long text without child divs
    if (!description) {
      const allDivs = main.querySelectorAll('div');
      for (const div of allDivs) {
        const text = div.innerText?.trim() || '';
        if (text.length > 150 && text.length < 3000 &&
            div.children.length === 0 &&
            !text.includes('Lundi') && !text.includes('places totales') &&
            !text.includes('Consultez le')) {
          description = text;
          break;
        }
      }
    }

    // Hours - extract schedule
    const hours = {};
    const daysPattern = [
      { fr: 'Lundi', en: 'lundi' },
      { fr: 'Mardi', en: 'mardi' },
      { fr: 'Mercredi', en: 'mercredi' },
      { fr: 'Jeudi', en: 'jeudi' },
      { fr: 'Vendredi', en: 'vendredi' },
      { fr: 'Samedi', en: 'samedi' },
      { fr: 'Dimanche', en: 'dimanche' }
    ];
    for (const day of daysPattern) {
      const regex = new RegExp(`${day.fr}[\\s\\n]+(\\d{2}\\s*h\\s*\\d{2}\\s*-\\s*\\d{2}\\s*h\\s*\\d{2}|Fermé)`, 'i');
      const match = fullText.match(regex);
      if (match) hours[day.en] = match[1].trim();
    }

    // Places
    const totalMatch = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*totales/i);
    const pouponsMatch = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*poupons/i);
    const plus18Match = fullText.match(/"?(\d+)"?\s*\n?\s*places?\s*18\s*mois/i);

    // Price
    const priceMatch = fullText.match(/(\d+[,.]?\d*)\s*\$\s*\n?\s*par\s*jour/i);

    // Inspection report link
    const inspectionLink = main.querySelector('a[href*="infocomplsg"]')?.href;

    // Email
    const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);

    // Type (CPE, MF, Garderie)
    const typeMatch = fullText.match(/(CPE|Garderie|Milieu familial)/i);

    // Subventionné
    const isSubventionné = fullText.includes('Subventionné') && !fullText.includes('Non subventionné');

    // Accessible
    const isAccessible = fullText.includes('Accessible aux personnes à mobilité réduite');

    return {
      name,
      address: addressMatch?.[1]?.trim() || null,
      phone: phoneMatch?.[1]?.trim() || null,
      description,
      hours: Object.keys(hours).length > 0 ? hours : null,
      places_totales: totalMatch ? parseInt(totalMatch[1]) : null,
      places_poupons: pouponsMatch ? parseInt(pouponsMatch[1]) : null,
      places_18_mois_plus: plus18Match ? parseInt(plus18Match[1]) : null,
      tarif: priceMatch ? `${priceMatch[1].replace(',', '.')}$/jour` : null,
      inspectionReportUrl: inspectionLink || null,
      email: emailMatch?.[0] || null,
      type: typeMatch?.[1] || null,
      subventionne: isSubventionné,
      accessible: isAccessible
    };
  });

  return data;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {};
  const errors = [];
  let successCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const { name, installationId, url } = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${name.substring(0, 50).padEnd(50)} `);

    try {
      const data = await scrapePage(page, url);
      if (data && data.name) {
        results[installationId] = data;
        successCount++;
        console.log('OK');

        // Update merged data - find by installationId or name
        const mergedEntry = Object.values(merged).find(m => m.installationId === installationId) ||
                           merged[name];
        if (mergedEntry) {
          if (data.phone) mergedEntry.telephone = data.phone;
          if (data.description) mergedEntry.description = data.description;
          if (data.hours) mergedEntry.horaires = data.hours;
          if (data.inspectionReportUrl) mergedEntry.inspectionReportUrl = data.inspectionReportUrl;
          if (data.email) mergedEntry.courriel = data.email;
          if (data.address) mergedEntry.adresse = data.address;
          if (data.tarif) mergedEntry.tarif = data.tarif;
          if (data.places_totales !== null) mergedEntry.places_totales = data.places_totales;
          if (data.places_poupons !== null) mergedEntry.places_poupons = data.places_poupons;
          if (data.places_18_mois_plus !== null) mergedEntry.places_18_mois_plus = data.places_18_mois_plus;
          mergedEntry.accessible = data.accessible;
        }
      } else {
        console.log('NO DATA');
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errors.push({ name, url, error: err.message });
    }

    await page.waitForTimeout(300);
  }

  await browser.close();

  // Save results
  fs.writeFileSync('scraped-data.json', JSON.stringify(results, null, 2));
  console.log(`\nSaved raw scraped data to scraped-data.json`);

  fs.writeFileSync('daycares-merged.json', JSON.stringify(merged, null, 2));
  console.log(`Updated daycares-merged.json with scraped data`);

  if (errors.length > 0) {
    fs.writeFileSync('scrape-errors.json', JSON.stringify(errors, null, 2));
    console.log(`${errors.length} errors saved to scrape-errors.json`);
  }

  console.log(`\nDone! Successfully scraped ${successCount}/${urls.length} pages.`);
}

main().catch(console.error);
