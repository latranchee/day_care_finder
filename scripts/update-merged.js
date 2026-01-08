import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('parsed-daycares.json', 'utf8'));
const merged = JSON.parse(fs.readFileSync('daycares-merged.json', 'utf8'));

let updated = 0;
let added = 0;

for (const [installationId, data] of Object.entries(parsed)) {
  // Find entry by installationId or by matching name
  let entry = Object.values(merged).find(m => m.installationId === installationId);

  if (!entry) {
    // Try to find by name (case insensitive, partial match)
    const parsedName = data.name?.toLowerCase() || '';
    entry = Object.values(merged).find(m => {
      const mergedName = (m.nom || '').toLowerCase();
      return mergedName.includes(parsedName) || parsedName.includes(mergedName);
    });
  }

  if (entry) {
    // Update existing entry
    if (data.phone) entry.telephone = data.phone;
    if (data.description) entry.description = data.description;
    if (data.horaires) entry.horaires = data.horaires;
    if (data.website && data.website !== entry.site_web) entry.site_web = data.website;
    if (data.email) entry.courriel = data.email;
    if (data.address) entry.adresse = data.address;
    if (data.tarif) entry.tarif = `${data.tarif}$/jour`;
    if (data.places_totales !== null && data.places_totales !== undefined) entry.places_totales = data.places_totales;
    if (data.places_poupons !== null && data.places_poupons !== undefined && typeof data.places_poupons === 'number') entry.places_poupons = data.places_poupons;
    if (data.places_18_mois_plus !== null && data.places_18_mois_plus !== undefined && typeof data.places_18_mois_plus === 'number') entry.places_18_mois_plus = data.places_18_mois_plus;
    if (data.accessible !== null) entry.accessible = data.accessible;
    entry.installationId = installationId;
    entry.portalUrl = `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`;
    updated++;
  } else {
    // Add new entry
    const name = data.name || `Unknown (${installationId})`;
    merged[name] = {
      nom: name,
      type: data.type || 'Unknown',
      subventionne: data.subventionne ?? false,
      adresse: data.address || '',
      tarif: data.tarif ? `${data.tarif}$/jour` : '',
      places_totales: data.places_totales || 0,
      places_poupons: typeof data.places_poupons === 'number' ? data.places_poupons : 0,
      places_18_mois_plus: typeof data.places_18_mois_plus === 'number' ? data.places_18_mois_plus : 0,
      telephone: data.phone || '',
      courriel: data.email || '',
      site_web: data.website || '',
      accessible: data.accessible ?? false,
      description: data.description || '',
      horaires: data.horaires || null,
      installationId: installationId,
      portalUrl: `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`,
      latitude: null,
      longitude: null
    };
    added++;
  }
}

fs.writeFileSync('daycares-merged.json', JSON.stringify(merged, null, 2));
console.log(`Updated ${updated} entries, added ${added} new entries`);
console.log(`Total entries: ${Object.keys(merged).length}`);
