import fs from 'fs';
import path from 'path';

const urls = [
  {
    "name": "G. MAISON D'ENSEIGNEMENT LET'S GO",
    "installationId": "a0UJQ00000WikJG2AZ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikJG2AZ"
  },
  {
    "name": "Mme Sandra Lachance",
    "installationId": "a0UJQ00000WjMBl2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBl2AN"
  },
  {
    "name": "CPE LA FOURMILLE - INST. LA FOURMILLE",
    "installationId": "a0UJQ00000WibXZ2AZ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WibXZ2AZ"
  },
  {
    "name": "pénélope loignon",
    "installationId": "a0UJQ00000Xtvh22AB",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Xtvh22AB"
  },
  {
    "name": "Mme Dany Poulin",
    "installationId": "a0UJQ00000WjDqL2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqL2AV"
  },
  {
    "name": "G. MAISON D'ENSEIGNEMENT LET'S GO 2",
    "installationId": "a0UJQ00000WikWI2AZ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikWI2AZ"
  },
  {
    "name": "Mme Nathalie Fortier",
    "installationId": "a0UJQ00000WjMQH2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQH2A3"
  },
  {
    "name": "Chez Monia",
    "installationId": "a0UJQ00000WjHc92AF",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHc92AF"
  },
  {
    "name": "Coco-frimousse",
    "installationId": "a0UJQ00000WilnJ2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnJ2AR"
  },
  {
    "name": "Mélanie Bolduc",
    "installationId": "a0UJQ00000WjAVf2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVf2AN"
  },
  {
    "name": "Mme Bianca Tawel",
    "installationId": "a0UJQ00000WjDqH2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqH2AV"
  },
  {
    "name": "Mme Joannie Gilbert",
    "installationId": "a0UJQ00000WjKGM2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGM2A3"
  },
  {
    "name": "CPE BEAUCE-SARTIGAN - INST. LA MAISON DES PAPILLONS",
    "installationId": "a0UJQ00000WihoQ2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WihoQ2AR"
  },
  {
    "name": "Mamy Ghislaine",
    "installationId": "a0UJQ00000WilnK2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnK2AR"
  },
  {
    "name": "Mme Lynda Nadeau",
    "installationId": "a0UJQ00000WjAVc2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVc2AN"
  },
  {
    "name": "Claudia Labbé",
    "installationId": "a0UJQ00000WjAVl2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVl2AN"
  },
  {
    "name": "G. LES PETITS COEURS",
    "installationId": "a0UJQ00000Wih5G2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wih5G2AR"
  },
  {
    "name": "Mme Johannie Nadeau",
    "installationId": "a0UJQ00000WjMBe2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBe2AN"
  },
  {
    "name": "G. MONTESSORI BEAUCE",
    "installationId": "a0UJQ00000Wihm02AB",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wihm02AB"
  },
  {
    "name": "CPE PANTA-MOUSSE - INST. LES PETITS ÉLANS",
    "installationId": "a0UJQ00000WihoY2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WihoY2AR"
  },
  {
    "name": "CPE BOUTONS D'OR - INST. PARCELLES D'OR",
    "installationId": "a0UJQ00000Wiij22AB",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000Wiij22AB"
  },
  {
    "name": "CPE AU PALAIS DES MERV. - INST. LES TRÉSORS DU PALAIS",
    "installationId": "a0UJQ00000WijF82AJ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijF82AJ"
  },
  {
    "name": "CPE AU PALAIS DES MERV. -INST. LE MINI-PALAIS DES MERV.",
    "installationId": "a0UJQ00000WijF92AJ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijF92AJ"
  },
  {
    "name": "CPE AU PALAIS DES MERV. - INST. AUX MILLE MERVEILLES",
    "installationId": "a0UJQ00000WijFA2AZ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijFA2AZ"
  },
  {
    "name": "G. LA PETITE ÉCOLE VISION BEAUCE",
    "installationId": "a0UJQ00000WijKJ2AZ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WijKJ2AZ"
  },
  {
    "name": "CPE LA FOURMILLE - INST. LES PETITES BESTIOLES",
    "installationId": "a0UJQ00000WibXa2AJ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WibXa2AJ"
  },
  {
    "name": "G. LES PETITS CHERCHEURS",
    "installationId": "a0UJQ00000WikOd2AJ",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WikOd2AJ"
  },
  {
    "name": "Le coin des copains",
    "installationId": "a0UJQ00000WilnI2AR",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WilnI2AR"
  },
  {
    "name": "Melissa lafontaine",
    "installationId": "a0UJQ00000WjFBu2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBu2AN"
  },
  {
    "name": "Allo les amis",
    "installationId": "a0UJQ00000WjFBw2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBw2AN"
  },
  {
    "name": "Sonia Breton",
    "installationId": "a0UJQ00000WjFBx2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFBx2AN"
  },
  {
    "name": "Dominique Levesque",
    "installationId": "a0UJQ00000WjFC02AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjFC02AN"
  },
  {
    "name": "Melany Paquet",
    "installationId": "a0UJQ00000WjLsR2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsR2AV"
  },
  {
    "name": "Annie poulin",
    "installationId": "a0UJQ00000WjLsS2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsS2AV"
  },
  {
    "name": "Mme Claudia Provencher",
    "installationId": "a0UJQ00000WjLsT2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsT2AV"
  },
  {
    "name": "Mme Karine Vachon",
    "installationId": "a0UJQ00000WjLsU2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsU2AV"
  },
  {
    "name": "Les P'tits Mousses",
    "installationId": "a0UJQ00000WjLsV2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjLsV2AV"
  },
  {
    "name": "Nathalie Perron",
    "installationId": "a0UJQ00000WjDqF2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqF2AV"
  },
  {
    "name": "Chez Luce et ses Lucioles",
    "installationId": "a0UJQ00000WjDqG2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqG2AV"
  },
  {
    "name": "milieu familial chez Mamie",
    "installationId": "a0UJQ00000WjDqI2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqI2AV"
  },
  {
    "name": "Kathia mathieu",
    "installationId": "a0UJQ00000WjDqJ2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqJ2AV"
  },
  {
    "name": "Sonia Rancourt",
    "installationId": "a0UJQ00000WjDqM2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjDqM2AV"
  },
  {
    "name": "Mme Nancy Beaudoin",
    "installationId": "a0UJQ00000WjHc82AF",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHc82AF"
  },
  {
    "name": "Lynda",
    "installationId": "a0UJQ00000WjHcC2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcC2AV"
  },
  {
    "name": "Nicole",
    "installationId": "a0UJQ00000WjHcD2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcD2AV"
  },
  {
    "name": "Service de garde chez Bibi",
    "installationId": "a0UJQ00000WjHcE2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcE2AV"
  },
  {
    "name": "Mme Jeannine Lemieux",
    "installationId": "a0UJQ00000WjHcF2AV",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjHcF2AV"
  },
  {
    "name": "Mme Andrée-Anne Levesque",
    "installationId": "a0UJQ00000WjAVd2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVd2AN"
  },
  {
    "name": "Mme Stéphanie Bérubé",
    "installationId": "a0UJQ00000WjAVe2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVe2AN"
  },
  {
    "name": "Suzanne Dumas",
    "installationId": "a0UJQ00000WjAVg2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVg2AN"
  },
  {
    "name": "Mme Annie Lessard",
    "installationId": "a0UJQ00000WjAVi2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVi2AN"
  },
  {
    "name": "Mme Caroline Marquis",
    "installationId": "a0UJQ00000WjAVj2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVj2AN"
  },
  {
    "name": "Les Poussinots a Karo",
    "installationId": "a0UJQ00000WjAVm2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVm2AN"
  },
  {
    "name": "Isabelle Nadeau",
    "installationId": "a0UJQ00000WjAVn2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVn2AN"
  },
  {
    "name": "GARDERIE MANON GENDRON",
    "installationId": "a0UJQ00000WjAVo2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVo2AN"
  },
  {
    "name": "Mme Stécy Paquet-Roy",
    "installationId": "a0UJQ00000WjAVp2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVp2AN"
  },
  {
    "name": "Mme Annie Audet",
    "installationId": "a0UJQ00000WjAVr2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVr2AN"
  },
  {
    "name": "Garderie chez klodya",
    "installationId": "a0UJQ00000WjAVt2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVt2AN"
  },
  {
    "name": "Karine Ouellet",
    "installationId": "a0UJQ00000WjAVu2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjAVu2AN"
  },
  {
    "name": "louise ferland",
    "installationId": "a0UJQ00000WjKGJ2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGJ2A3"
  },
  {
    "name": "Josée Dulac",
    "installationId": "a0UJQ00000WjKGK2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGK2A3"
  },
  {
    "name": "Johanne Drouin",
    "installationId": "a0UJQ00000WjKGL2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGL2A3"
  },
  {
    "name": "Mme Nathalie Talbot",
    "installationId": "a0UJQ00000WjKGR2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjKGR2A3"
  },
  {
    "name": "Cassandra Poulin",
    "installationId": "a0UJQ00000WjMBd2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBd2AN"
  },
  {
    "name": "souris",
    "installationId": "a0UJQ00000WjMBh2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMBh2AN"
  },
  {
    "name": "Leslie Pomerleau",
    "installationId": "a0UJQ00000WjMOb2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOb2AN"
  },
  {
    "name": "Brenda Champagne",
    "installationId": "a0UJQ00000WjMOe2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOe2AN"
  },
  {
    "name": "Dany Moisan",
    "installationId": "a0UJQ00000WjMOf2AN",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMOf2AN"
  },
  {
    "name": "Amélie Giguère",
    "installationId": "a0UJQ00000WjMQF2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQF2A3"
  },
  {
    "name": "Garderie les rayons de soleil",
    "installationId": "a0UJQ00000WjMQG2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQG2A3"
  },
  {
    "name": "Garderie Tamayü",
    "installationId": "a0UJQ00000WjMQI2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMQI2A3"
  },
  {
    "name": "Mme Sandra Méthot",
    "installationId": "a0UJQ00000WjMTN2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMTN2A3"
  },
  {
    "name": "Mme Cathy Rainville",
    "installationId": "a0UJQ00000WjMTO2A3",
    "url": "https://www.portail-servicesgarde.gouv.qc.ca/parent/s/vitrine?installationId=a0UJQ00000WjMTO2A3"
  }
];

const outputDir = 'portal-pages';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function fetchAll() {
  console.log(`Fetching ${urls.length} pages...\n`);

  for (let i = 0; i < urls.length; i++) {
    const item = urls[i];
    try {
      const response = await fetch(item.url);
      const html = await response.text();
      const outPath = path.join(outputDir, `${item.installationId}.html`);
      fs.writeFileSync(outPath, html);
      console.log(`[${i + 1}/${urls.length}] ${item.name}`);

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`Error fetching ${item.name}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

fetchAll();
