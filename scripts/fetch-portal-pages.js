import fs from 'fs';
import path from 'path';

// Read merged data
const merged = JSON.parse(fs.readFileSync('daycares-merged.json', 'utf8'));

// Filter entries with portal URLs
const withUrls = Object.entries(merged)
  .filter(([_, data]) => data.portalUrl)
  .map(([name, data]) => ({
    name,
    installationId: data.installationId,
    url: data.portalUrl
  }));

console.log(`Found ${withUrls.length} daycares with portal URLs\n`);

// Create output directory
const outputDir = 'portal-pages';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate bash script with curl commands
const curlCommands = withUrls.map(item => {
  const safeName = item.installationId;
  return `# ${item.name}
curl -s -o "${outputDir}/${safeName}.html" "${item.url}"
echo "Fetched: ${item.name}"
sleep 0.5`;
}).join('\n\n');

const bashScript = `#!/bin/bash
# Fetch all portal pages
# Generated: ${new Date().toISOString()}

mkdir -p ${outputDir}

${curlCommands}

echo ""
echo "Done! Fetched ${withUrls.length} pages to ${outputDir}/"
`;

fs.writeFileSync('fetch-portal-pages.sh', bashScript);
console.log('Created fetch-portal-pages.sh');

// Also create a Node.js version for Windows compatibility
const nodeScript = `import fs from 'fs';
import path from 'path';

const urls = ${JSON.stringify(withUrls, null, 2)};

const outputDir = 'portal-pages';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function fetchAll() {
  console.log(\`Fetching \${urls.length} pages...\\n\`);

  for (let i = 0; i < urls.length; i++) {
    const item = urls[i];
    try {
      const response = await fetch(item.url);
      const html = await response.text();
      const outPath = path.join(outputDir, \`\${item.installationId}.html\`);
      fs.writeFileSync(outPath, html);
      console.log(\`[\${i + 1}/\${urls.length}] \${item.name}\`);

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(\`Error fetching \${item.name}: \${err.message}\`);
    }
  }

  console.log('\\nDone!');
}

fetchAll();
`;

fs.writeFileSync('scripts/fetch-portal-node.js', nodeScript);
console.log('Created scripts/fetch-portal-node.js');

// Save URL list for reference
fs.writeFileSync('portal-urls.json', JSON.stringify(withUrls, null, 2));
console.log('Created portal-urls.json');

console.log(`\nTo fetch pages, run:`);
console.log(`  node scripts/fetch-portal-node.js`);
console.log(`\nNote: These are SPA pages - HTML will have minimal content.`);
console.log(`The real data comes from API calls the page makes.`);
