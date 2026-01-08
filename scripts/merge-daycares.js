import fs from 'fs';

// Read both files
const existingData = JSON.parse(fs.readFileSync('daycare.json', 'utf8'));
const portalData = JSON.parse(fs.readFileSync('dump1.json', 'utf8'));

// Extract portal items
const portalItems = portalData.actions[0].returnValue.returnValue;

// Create a map from portal data keyed by name
const portalByName = {};
for (const item of portalItems) {
  const inst = item.vitrineCourante?.Installation__r;
  if (!inst) continue;

  const name = inst.NomAffiche__c || inst.Name;
  const installationId = item.vitrineCourante.Installation__c;

  portalByName[name] = {
    installationId,
    portalUrl: `https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=${installationId}`,
    type_portal: inst.Entreprise__r?.Type,
    latitude: parseFloat(inst.Address__r?.Latitude) || null,
    longitude: parseFloat(inst.Address__r?.Longitude) || null,
    heureOuverture: item.heureOuvertureMinimumDebutSemaine,
    accessible: item.vitrineCourante.Accessibilite__c === 'Oui'
  };
}

// Build merged object keyed by name
const merged = {};

// First, add all existing daycares from daycare.json
for (const service of existingData.services_de_garde) {
  const name = service.nom;
  const portalInfo = portalByName[name] || {};

  merged[name] = {
    nom: name,
    type: service.type,
    subventionne: service.subventionne,
    adresse: service.adresse,
    tarif: service.tarif,
    places_totales: service.places_totales,
    places_poupons: service.places_poupons || 0,
    places_18_mois_plus: service.places_18_mois_plus || 0,
    telephone: service.informations_complementaires?.telephone || '',
    courriel: service.informations_complementaires?.courriel || '',
    site_web: service.informations_complementaires?.site_web || '',
    accessible: service.informations_complementaires?.accessible_mobilite_reduite || portalInfo.accessible || false,
    bureau_coordonnateur: service.informations_complementaires?.bureau_coordonnateur || '',
    // Portal data
    installationId: portalInfo.installationId || null,
    portalUrl: portalInfo.portalUrl || null,
    latitude: portalInfo.latitude || null,
    longitude: portalInfo.longitude || null,
    heureOuverture: portalInfo.heureOuverture || null
  };

  // Remove from portalByName if found
  delete portalByName[name];
}

// Add remaining portal daycares not in existing data
for (const [name, portalInfo] of Object.entries(portalByName)) {
  merged[name] = {
    nom: name,
    type: portalInfo.type_portal,
    subventionne: true,
    adresse: '',
    tarif: '9.65$/jour',
    places_totales: 0,
    places_poupons: 0,
    places_18_mois_plus: 0,
    telephone: '',
    courriel: '',
    site_web: '',
    accessible: portalInfo.accessible,
    bureau_coordonnateur: '',
    installationId: portalInfo.installationId,
    portalUrl: portalInfo.portalUrl,
    latitude: portalInfo.latitude,
    longitude: portalInfo.longitude,
    heureOuverture: portalInfo.heureOuverture
  };
}

// Stats
const existingCount = existingData.services_de_garde.length;
const portalCount = portalItems.length;
const mergedCount = Object.keys(merged).length;
const withPortalUrl = Object.values(merged).filter(d => d.portalUrl).length;
const newFromPortal = Object.keys(portalByName).length;

console.log(`Existing daycares (daycare.json): ${existingCount}`);
console.log(`Portal daycares (dump1.json): ${portalCount}`);
console.log(`Merged total: ${mergedCount}`);
console.log(`With portal URL: ${withPortalUrl}`);
console.log(`New from portal (not in existing): ${mergedCount - existingCount}`);

// Save merged data
fs.writeFileSync('daycares-merged.json', JSON.stringify(merged, null, 2));
console.log('\nSaved to daycares-merged.json');

// Show some that matched
console.log('\nSample matched entries:');
let count = 0;
for (const [name, data] of Object.entries(merged)) {
  if (data.portalUrl && data.telephone) {
    console.log(`  - ${name}`);
    console.log(`    Portal: ${data.portalUrl}`);
    if (++count >= 3) break;
  }
}

// Show some that didn't match
console.log('\nSample unmatched (in existing but not portal):');
count = 0;
for (const [name, data] of Object.entries(merged)) {
  if (!data.portalUrl && data.telephone) {
    console.log(`  - ${name}`);
    if (++count >= 3) break;
  }
}
