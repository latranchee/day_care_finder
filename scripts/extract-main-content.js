import fs from 'fs';
import path from 'path';

const htmlDir = 'portal-html';
const outputDir = 'portal-text';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
const urls = JSON.parse(fs.readFileSync('portal-urls.json', 'utf8'));

// Create a map from installationId to name
const idToName = {};
for (const item of urls) {
  idToName[item.installationId] = item.name;
}

console.log(`Extracting content from ${files.length} HTML files...\n`);

const allData = [];

for (const file of files) {
  const installationId = file.replace('.html', '');
  const name = idToName[installationId] || 'Unknown';
  let html = fs.readFileSync(path.join(htmlDir, file), 'utf8');

  // Remove everything before <body>
  const bodyStart = html.indexOf('<body');
  if (bodyStart > 0) {
    html = html.substring(bodyStart);
  }

  // Remove script tags
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove style tags
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove CSS variables and long style attributes
  html = html.replace(/style="[^"]*"/gi, '');

  // Remove HTML tags but keep text
  let content = html.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");

  // Clean up whitespace - collapse multiple spaces and newlines
  content = content
    .replace(/[\t ]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim();

  // Remove common boilerplate
  content = content
    .replace(/Portail d'inscription aux services de garde/g, '')
    .replace(/English/g, '')
    .replace(/Nous joindre/g, '')
    .replace(/Authentifiez-vous/g, '')
    .replace(/Carte des services de garde/g, '')
    .replace(/Conditions d'utilisation/g, '')
    .replace(/Protection des renseignements personnels/g, '')
    .replace(/© Gouvernement du Québec, \d+/g, '')
    .replace(/Aller à la navigation/g, '')
    .replace(/Aller au contenu principal/g, '');

  // Save text file
  const header = `Name: ${name}
Installation ID: ${installationId}
Portal URL: https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}

---

`;

  fs.writeFileSync(path.join(outputDir, `${installationId}.txt`), header + content);

  allData.push({
    installationId,
    name,
    contentLength: content.length
  });

  process.stdout.write('.');
}

console.log(`\n\nExtracted ${files.length} files to ${outputDir}/`);

// Check file sizes
const sizes = allData.map(d => d.contentLength);
console.log(`Content sizes: min=${Math.min(...sizes)}, max=${Math.max(...sizes)}, avg=${Math.round(sizes.reduce((a,b) => a+b, 0) / sizes.length)}`);

// Show sample
const sampleFile = path.join(outputDir, files[0].replace('.html', '.txt'));
const sample = fs.readFileSync(sampleFile, 'utf8');
console.log('\n--- Sample (first 1500 chars) ---');
console.log(sample.substring(0, 1500));
