/**
 * Script to download product images from source URLs and upload to Supabase Storage.
 * Run: node scripts/upload-product-images.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lhypodcttwhonuvumwod.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function downloadImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  } catch (e) {
    console.error(`  Failed to download: ${url}`, e.message);
    return null;
  }
}

async function main() {
  // Get all products with image URLs
  const { data: products, error } = await supabase
    .from('reef_products')
    .select('id, name, brand, image_url')
    .not('image_url', 'is', null);

  if (error) { console.error(error); return; }
  console.log(`Found ${products.length} products with images\n`);

  let success = 0, failed = 0;

  for (const p of products) {
    const slug = `${p.brand}-${p.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 60);
    const path = `${slug}.jpg`;

    process.stdout.write(`[${success + failed + 1}/${products.length}] ${p.brand} ${p.name}... `);

    const img = await downloadImage(p.image_url);
    if (!img) {
      console.log('SKIP (download failed)');
      failed++;
      continue;
    }

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, img.buffer, {
        contentType: img.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.log(`SKIP (upload: ${uploadError.message})`);
      failed++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;

    // Update product record
    await supabase.from('reef_products').update({ image_url: publicUrl }).eq('id', p.id);

    console.log('OK');
    success++;
  }

  console.log(`\nDone: ${success} uploaded, ${failed} failed`);
}

main();
