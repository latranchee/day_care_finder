import { chromium } from 'playwright';
import fs from 'fs';

// First 5 URLs for testing
const urls = [
  { name: "Dany Moisan", installationId: "a0UJQ00000WjMOf2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOf2AN" },
  { name: "CPE LA FOURMILLE", installationId: "a0UJQ00000WibXZ2AZ", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WibXZ2AZ" },
  { name: "G. MONTESSORI BEAUCE", installationId: "a0UJQ00000Wihm02AB", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wihm02AB" },
  { name: "Mme Sandra Lachance", installationId: "a0UJQ00000WjMBl2AN", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBl2AN" },
  { name: "Chez Monia", installationId: "a0UJQ00000WjHc92AF", url: "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHc92AF" },
];

const outputDir = 'portal-text';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Fetching pages...\n');

  for (const item of urls) {
    console.log(`Fetching: ${item.name}`);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('main', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const content = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? main.innerText : '';
      });

      fs.writeFileSync(`${outputDir}/${item.installationId}.txt`, content, 'utf8');
      console.log(`  Saved: ${item.installationId}.txt`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
