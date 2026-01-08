import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const urls = JSON.parse(fs.readFileSync('portal-urls.json', 'utf8'));

const outputDir = 'portal-html';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

console.log(`Dumping HTML for ${urls.length} pages to ${outputDir}/\n`);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (let i = 0; i < urls.length; i++) {
    const { name, installationId, url } = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${name.substring(0, 45).padEnd(45)} `);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for SPA content

      const html = await page.content();
      const outPath = path.join(outputDir, `${installationId}.html`);
      fs.writeFileSync(outPath, html);
      console.log('OK');
    } catch (err) {
      console.log(`ERR: ${err.message.substring(0, 30)}`);
    }
  }

  await browser.close();
  console.log(`\nDone! HTML files saved to ${outputDir}/`);
}

main().catch(console.error);
