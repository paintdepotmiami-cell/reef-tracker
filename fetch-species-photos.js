const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read credentials from frontend/.env.local
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in frontend/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPhotoFromINaturalist(scientificName, retries = 2) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);

    if (res.status === 429) {
      const waitTime = 3000 * (attempt + 1);
      console.log(`    Rate limited, waiting ${waitTime / 1000}s before retry...`);
      await delay(waitTime);
      continue;
    }

    if (!res.ok) throw new Error(`iNaturalist API returned ${res.status}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const taxon = data.results[0];
      if (taxon.default_photo && taxon.default_photo.medium_url) {
        return taxon.default_photo.medium_url;
      }
    }
    return null;
  }
  throw new Error('Rate limited after all retries');
}

async function main() {
  console.log('Fetching species from Supabase...');

  const { data: species, error } = await supabase
    .from('reef_species')
    .select('id, common_name, scientific_name, category, photo_url')
    .neq('category', 'pest');

  if (error) {
    console.error('Error fetching species:', error.message);
    process.exit(1);
  }

  console.log(`Found ${species.length} species (excluding pests)\n`);

  const needPhotos = species.filter(s => !s.photo_url);
  const alreadyHavePhotos = species.length - needPhotos.length;

  if (alreadyHavePhotos > 0) {
    console.log(`Skipping ${alreadyHavePhotos} species that already have photos`);
  }
  console.log(`Processing ${needPhotos.length} species that need photos...\n`);

  let found = 0;
  let notFound = 0;
  let errors = 0;
  const updates = [];

  for (let i = 0; i < needPhotos.length; i++) {
    const sp = needPhotos[i];
    const progress = `[${i + 1}/${needPhotos.length}]`;

    try {
      const photoUrl = await fetchPhotoFromINaturalist(sp.scientific_name);

      if (photoUrl) {
        updates.push({ id: sp.id, common_name: sp.common_name, photo_url: photoUrl });
        console.log(`${progress} ✓ ${sp.common_name} → ${photoUrl}`);
        found++;
      } else {
        console.log(`${progress} – ${sp.common_name} (${sp.scientific_name}) — no photo found`);
        notFound++;
      }
    } catch (err) {
      console.error(`${progress} ✗ ${sp.common_name} — ${err.message}`);
      errors++;
    }

    // Rate limit: 1.2s between iNaturalist calls
    if (i < needPhotos.length - 1) {
      await delay(1200);
    }
  }

  // Write SQL update file for batch application
  if (updates.length > 0) {
    const sqlLines = updates.map(u => {
      const escapedUrl = u.photo_url.replace(/'/g, "''");
      return `UPDATE reef_species SET photo_url = '${escapedUrl}' WHERE id = '${u.id}';`;
    });
    const sqlPath = path.join(__dirname, 'update-photos.sql');
    fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n');
    console.log(`\nSQL update file written to: ${sqlPath}`);

    const jsonPath = path.join(__dirname, 'photo-updates.json');
    fs.writeFileSync(jsonPath, JSON.stringify(updates, null, 2));
    console.log(`JSON updates file written to: ${jsonPath}`);
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`Total species (non-pest): ${species.length}`);
  console.log(`Already had photos:       ${alreadyHavePhotos}`);
  console.log(`Photos found:             ${found}`);
  console.log(`No photo available:       ${notFound}`);
  console.log(`Errors:                   ${errors}`);
  console.log('==============================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
