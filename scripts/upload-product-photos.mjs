/**
 * Upload product & equipment photos to Supabase Storage
 *
 * Downloads images from public URLs, uploads to the species-photos bucket
 * under products/ and equipment/ prefixes, then updates image_url in DB.
 *
 * Usage:
 *   cd C:/Users/marci/Claude/reef-tracker/frontend
 *   SUPABASE_SERVICE_KEY="sb_secret_..." node ../scripts/upload-product-photos.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhypodcttwhonuvumwod.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'species-photos';
const BASE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

// ── Products (reef_products table) ────────────────────────────────────────────
const PRODUCTS = [
  {
    id: '211fa209-fa88-47d6-b346-62c000f94b3e',
    name: 'MicroBacter CLEAN',
    file: 'products/brightwell-microbacter-clean.jpg',
    src: 'https://www.coralvue.com/media/catalog/product/cache/d4ea6735f8ed87a57e8bd61f1e75c135/b/r/br_microbacterclean_nosize_2.jpg',
  },
  {
    id: 'a147af27-659a-434d-9e79-0b4f1910188c',
    name: 'Calcium (Brightwell)',
    file: 'products/brightwell-calcion.jpg',
    src: 'https://kensfish.com/cdn/shop/products/Brightwell_Calcion_3f00ed99-7f2d-44c0-a234-8b0e2cb69930.jpg?v=1659916901',
  },
  {
    id: '5a0fcd8e-717e-4f95-8686-827b2e94919d',
    name: 'Kalkwasser Mix (Two Little Fishies)',
    file: 'products/twolittlefishies-kalkwasser.jpg',
    src: 'https://www.coralvue.com/media/catalog/product/cache/d4ea6735f8ed87a57e8bd61f1e75c135/k/a/kalkwasser.jpg',
  },
  {
    id: 'd5db99cc-d305-4695-83c2-8b93c305890b',
    name: 'Magnesion (Brightwell)',
    file: 'products/brightwell-magnesion.png',
    src: 'https://brightwelldirect.com/cdn/shop/products/Magnesion_10in_1024x.png?v=1617647532',
  },
  {
    id: 'f2fd8512-2751-40d5-a381-f46c81aee325',
    name: 'Reef Balance (Seachem / AquaVitro)',
    file: 'products/seachem-reef-balance.jpg',
    src: 'https://www.reeflifeaquariums.com/cdn/shop/products/67175150.jpg?v=1558916698',
  },
  {
    id: 'e01ff0f4-4719-469f-937c-442d806828b0',
    name: 'Revive Coral Cleaner (Two Little Fishies)',
    file: 'products/twolittlefishies-revive.jpg',
    src: 'https://www.coralvue.com/media/catalog/product/cache/d4ea6735f8ed87a57e8bd61f1e75c135/r/e/revive.jpg',
  },
  {
    id: '49e1666f-c9df-4461-aec6-164c9e8c6ad8',
    name: 'Stress Coat (API)',
    file: 'products/api-stress-coat.png',
    src: 'https://cdn11.bigcommerce.com/s-xfu1s3ki5p/images/stencil/1280x1280/products/21660/17147/api-stress-coat-16__15870.1689696879.png?c=1',
  },
  {
    id: '012176ae-4bca-4423-bbae-78ba07e4cfd7',
    name: 'Coral Frenzy',
    file: 'products/coral-frenzy.png',
    src: 'https://aqualabaquaria.com/cdn/shop/products/coral-nutrition-ultimate-coral-food-coral-frenzy-21487917128_grande.png?v=1642441363',
  },
  {
    id: '2951211e-73ab-49f3-aa37-ac0138ba7851',
    name: 'Hanna Checker (pH)',
    file: 'products/hanna-checker-ph.jpg',
    src: 'https://cdn11.bigcommerce.com/s-l8qlnhq2eh/images/stencil/500x659/products/4801/11902/HI98103_Checker-1200x1200__67308.1746708930.jpg?c=2',
  },
  {
    id: '25521a3f-dfac-4c31-a4b9-f42606ca1616',
    name: 'Blue Treasure Reef Sea Salt',
    file: 'products/blue-treasure-reef-salt.jpg',
    src: 'https://www.aquariumsindia.com/wp-content/uploads/2024/06/Blue-Treasure-Reef-Salt.jpg',
  },
  {
    id: 'eaed4636-cd88-441d-a6b8-440c6b27fa62',
    name: 'Koralle-VM (Brightwell)',
    file: 'products/brightwell-koralle-vm.png',
    src: 'https://brightwelldirect.com/cdn/shop/products/Koralle-VM_10in_1024x.png?v=1617647437',
  },
  {
    id: '2d9901ad-9094-4ca6-842d-5fa86d600b7e',
    name: 'Replenish (Brightwell)',
    file: 'products/brightwell-replenish.png',
    src: 'https://brightwelldirect.com/cdn/shop/products/Replenish_10in_1024x.png?v=1617729491',
  },
];

// ── Equipment (reef_equipment table) ──────────────────────────────────────────
const EQUIPMENT = [
  {
    id: 'a99cf04c-975e-4953-8e5c-0d092a4e7268',
    name: 'Jebao Return Pump',
    file: 'equipment/jebao-return-pump.jpg',
    src: 'https://reef-aquarium-store.com/content/Products/Jecod-DCS-1200-opvoerpomp-met-controller.jpg',
  },
  {
    id: '4bcf86e0-152c-40f4-ae45-fa2b33526fb3',
    name: 'Wavemaker / Powerhead',
    file: 'equipment/jebao-wavemaker.jpg',
    src: 'https://richmondaquariumprime.com/cdn/shop/files/SLW-10-and-Box-1000x1000__23711.jpg?v=1711989505',
  },
  {
    id: '1c6b6bbe-2bf0-4569-b35e-610bbb4a458e',
    name: 'Jebao DC Pump Controller',
    file: 'equipment/jebao-dc-controller.png',
    src: 'https://reef-aquarium-store.com/content/Products/Jecod-Jebao-Controller-DCP-2500.png',
  },
  {
    id: 'bb195f1f-9a97-46e7-b7db-c678a81c7d8e',
    name: 'Red Sea ReefDose 4',
    file: 'equipment/redsea-reefdose4.png',
    src: 'https://static.redseafish.com/wp-content/uploads/2024/08/25164745/reefdose4-1.png',
  },
  {
    id: 'ad8d2da2-9317-4612-9f72-614325a189e5',
    name: 'Heater Controller (Inkbird ITC-306A)',
    file: 'equipment/inkbird-heater-controller.jpg',
    src: 'https://cdn11.bigcommerce.com/s-fh5tkm/images/stencil/original/products/5399/19365/ITC-306A_US_1800x1800__58808.1576700190.jpg?c=2',
  },
  {
    id: '2c7fe101-8ead-4558-adf4-33522a7a1528',
    name: 'Reef Octopus Protein Skimmer',
    file: 'equipment/reef-octopus-skimmer.jpg',
    src: 'https://www.aquanatureonline.com/wp-content/uploads/2021/08/nw110.jpg',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ReefOS/1.0)',
      Accept: 'image/*,*/*',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function contentTypeFromPath(filePath) {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function uploadToStorage(filePath, data) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, data, {
      contentType: contentTypeFromPath(filePath),
      upsert: true,
    });
  if (error) throw error;
  return `${BASE_PUBLIC_URL}/${filePath}`;
}

async function updateProduct(id, publicUrl) {
  const { error } = await supabase
    .from('reef_products')
    .update({ image_url: publicUrl })
    .eq('id', id);
  if (error) throw error;
}

async function updateEquipment(id, publicUrl) {
  const { error } = await supabase
    .from('reef_equipment')
    .update({ image_url: publicUrl })
    .eq('id', id);
  if (error) throw error;
}

async function processItem(item, table) {
  try {
    console.log(`  Downloading: ${item.name}`);
    const data = await downloadImage(item.src);

    if (data.length < 3000) {
      console.log(`  SKIP ${item.name} — image too small (${data.length} bytes)`);
      return false;
    }

    const publicUrl = await uploadToStorage(item.file, data);

    if (table === 'reef_products') {
      await updateProduct(item.id, publicUrl);
    } else {
      await updateEquipment(item.id, publicUrl);
    }

    console.log(`  OK   ${item.name} → ${item.file} (${data.length} bytes)`);
    return true;
  } catch (err) {
    console.log(`  ERR  ${item.name} — ${err.message}`);
    return false;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let ok = 0, fail = 0;

  console.log('\n=== PRODUCTS ===');
  for (const item of PRODUCTS) {
    const success = await processItem(item, 'reef_products');
    success ? ok++ : fail++;
    await sleep(1500);
  }

  console.log('\n=== EQUIPMENT ===');
  for (const item of EQUIPMENT) {
    const success = await processItem(item, 'reef_equipment');
    success ? ok++ : fail++;
    await sleep(1500);
  }

  console.log('\n═══════════════════════════════════');
  console.log(`  Uploaded:  ${ok}`);
  console.log(`  Failed:    ${fail}`);
  console.log(`  Total:     ${ok + fail}`);
  console.log('═══════════════════════════════════\n');
}

main();
