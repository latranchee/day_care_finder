import fs from 'fs';

// Read the dump file
const data = JSON.parse(fs.readFileSync('dump1.json', 'utf8'));

// Extract installation IDs from the nested structure
const items = data.actions[0].returnValue.returnValue;

const urls = items.map(item => {
  const installationId = item.vitrineCourante?.Installation__c;
  const name = item.vitrineCourante?.Installation__r?.NomAffiche__c || item.vitrineCourante?.Installation__r?.Name;
  return {
    id: installationId,
    name: name,
    url: `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`
  };
}).filter(item => item.id);

console.log(`Found ${urls.length} daycares\n`);

// Output as JSON for further processing
fs.writeFileSync('extracted-urls.json', JSON.stringify(urls, null, 2));
console.log('Saved to extracted-urls.json');

// Also output curl commands
const curlScript = urls.map(item =>
  `# ${item.name}\ncurl -o "data/${item.id}.html" "${item.url}"`
).join('\n\n');

fs.writeFileSync('fetch-daycares.sh', curlScript);
console.log('Saved curl script to fetch-daycares.sh');
