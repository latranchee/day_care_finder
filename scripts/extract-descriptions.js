import fs from 'fs';
import path from 'path';

const sourceDir = '.trash/portal-text';
const parsedFile = '.trash/parsed-daycares.json';

// Read existing parsed data
const parsedData = JSON.parse(fs.readFileSync(parsedFile, 'utf8'));

// Get all text files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.txt'));

console.log(`Processing ${files.length} files...\n`);

let updated = 0;
let noDescription = 0;

for (const file of files) {
  const installationId = path.basename(file, '.txt');
  const content = fs.readFileSync(path.join(sourceDir, file), 'utf8');

  // Extract description between "Présentation 1" and the next section
  // The pattern is: Présentation 1 <description text> Heures d'ouverture
  // OR: Présentation 1 <description text> Accueil adapté
  let description = null;

  // Try to find the presentation section
  const presentationMatch = content.match(/Présentation\s*1\s+([\s\S]*?)(?:Heures d'ouverture|Accueil adapté aux enfants)/i);

  if (presentationMatch) {
    description = presentationMatch[1].trim();
    // Clean up any extra whitespace
    description = description.replace(/\s+/g, ' ').trim();
  }

  if (parsedData[installationId]) {
    const oldDesc = parsedData[installationId].description;

    if (description) {
      parsedData[installationId].description = description;

      if (oldDesc !== description) {
        updated++;
        console.log(`Updated: ${parsedData[installationId].name}`);
        if (installationId === 'a0UJQ00000WjMOf2AN') {
          console.log(`  OLD: ${oldDesc}`);
          console.log(`  NEW: ${description}`);
        }
      }
    } else {
      noDescription++;
      console.log(`No description found: ${parsedData[installationId].name}`);
    }
  }
}

// Save updated data
fs.writeFileSync(parsedFile, JSON.stringify(parsedData, null, 2));

console.log(`\n${'='.repeat(50)}`);
console.log(`Done!`);
console.log(`  Updated: ${updated}`);
console.log(`  No description: ${noDescription}`);
console.log(`  Total processed: ${files.length}`);
