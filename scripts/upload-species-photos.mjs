/**
 * Upload species photos from Wikimedia Commons to Supabase Storage
 *
 * Usage: node scripts/upload-species-photos.mjs
 *
 * Searches Wikimedia Commons for each species by scientific name,
 * downloads the best image, uploads to Supabase species-photos bucket,
 * and updates the reef_species table with the public URL.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhypodcttwhonuvumwod.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_KEY environment variable');
  console.error('   export SUPABASE_SERVICE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = 'species-photos';
const BASE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

// Stats
let found = 0, skipped = 0, errors = 0;

/**
 * Search Wikimedia Commons for a species photo
 */
async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?` + new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} fish OR coral OR marine`,
    gsrnamespace: '6', // File namespace
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  if (!data.query?.pages) return null;

  // Filter for good images (not SVG, not too small, prefer JPG/PNG)
  const pages = Object.values(data.query.pages)
    .filter(p => {
      const info = p.imageinfo?.[0];
      if (!info) return false;
      const url = (info.url || '').toLowerCase();
      // Skip SVGs, icons, maps, diagrams
      if (url.endsWith('.svg') || url.endsWith('.gif')) return false;
      // Skip tiny images
      if (info.width < 400 || info.height < 300) return false;
      return true;
    })
    .sort((a, b) => {
      // Prefer larger images
      const aSize = a.imageinfo[0].width * a.imageinfo[0].height;
      const bSize = b.imageinfo[0].width * b.imageinfo[0].height;
      return bSize - aSize;
    });

  if (pages.length === 0) return null;

  const best = pages[0].imageinfo[0];
  return best.thumburl || best.url;
}

/**
 * Download image as buffer
 */
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate filename from scientific name
 * "Pomacanthus xanthometopon" → "pomacanthus-xanthometopon.jpg"
 * For "sp." names, use common name: "Bounce Mushroom" → "bounce-mushroom.jpg"
 */
function makeFileName(scientificName, commonName) {
  // For generic "sp." names, use common name to avoid collisions
  const name = scientificName.includes(' sp.')
    ? commonName
    : scientificName;

  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '.jpg';
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(fileName, imageData) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, imageData, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;
  return `${BASE_PUBLIC_URL}/${fileName}`;
}

/**
 * Process a single species
 */
async function processSpecies(species) {
  const { id, common_name, scientific_name } = species;
  const label = `${common_name} (${scientific_name})`;

  try {
    // Try scientific name first
    let imageUrl = await searchWikimedia(scientific_name);

    // If "sp." or no result, try common name
    if (!imageUrl && scientific_name.includes(' sp.')) {
      imageUrl = await searchWikimedia(`${common_name} marine aquarium`);
    }

    // Still no result, try just common name
    if (!imageUrl) {
      imageUrl = await searchWikimedia(common_name);
    }

    if (!imageUrl) {
      console.log(`  ⏭️  ${label} — no image found`);
      skipped++;
      return;
    }

    // Download
    const imageData = await downloadImage(imageUrl);
    if (imageData.length < 5000) {
      console.log(`  ⏭️  ${label} — image too small (${imageData.length}b)`);
      skipped++;
      return;
    }

    // Upload
    const fileName = makeFileName(scientific_name, common_name);
    const publicUrl = await uploadToStorage(fileName, imageData);

    // Update DB
    const { error } = await supabase
      .from('reef_species')
      .update({ photo_url: publicUrl })
      .eq('id', id);

    if (error) throw error;

    console.log(`  ✅ ${label} → ${fileName}`);
    found++;
  } catch (err) {
    console.log(`  ❌ ${label} — ${err.message}`);
    errors++;
  }

  // Rate limit: 2s between requests (Wikimedia 429 protection)
  await new Promise(r => setTimeout(r, 2000));
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Fetching species without photos...\n');

  const { data: species, error } = await supabase
    .from('reef_species')
    .select('id, common_name, scientific_name, category, subcategory')
    .or('photo_url.is.null,photo_url.eq.')
    .not('scientific_name', 'is', null)
    .order('category')
    .order('subcategory');

  if (error) {
    console.error('DB error:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${species.length} species needing photos\n`);

  let currentCategory = '';
  for (const sp of species) {
    if (sp.category !== currentCategory) {
      currentCategory = sp.category;
      console.log(`\n── ${currentCategory.toUpperCase()} ──`);
    }
    await processSpecies(sp);
  }

  console.log('\n════════════════════════════════');
  console.log(`✅ Uploaded: ${found}`);
  console.log(`⏭️  Skipped:  ${skipped}`);
  console.log(`❌ Errors:   ${errors}`);
  console.log(`📊 Total:    ${species.length}`);
  console.log('════════════════════════════════');
}

main();
