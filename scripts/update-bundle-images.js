const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBundleImages() {
  console.log('Updating bundle images...\n');

  // Update Duo Pack
  const { data: duo, error: duoError } = await supabase
    .from('products')
    .update({ images: ['/images/bundles/duo-pack.svg'] })
    .eq('sku', 'BUNDLE-2PACK')
    .select();

  if (duoError) {
    console.error('Error updating Duo Pack:', duoError.message);
  } else {
    console.log('✓ Updated Duo Pack image');
  }

  // Update Trio Pack
  const { data: trio, error: trioError } = await supabase
    .from('products')
    .update({ images: ['/images/bundles/trio-pack.svg'] })
    .eq('sku', 'BUNDLE-3PACK')
    .select();

  if (trioError) {
    console.error('Error updating Trio Pack:', trioError.message);
  } else {
    console.log('✓ Updated Trio Pack image');
  }

  // Update Mini Kit
  const { data: kit, error: kitError } = await supabase
    .from('products')
    .update({ images: ['/images/bundles/mini-kit.svg'] })
    .eq('sku', 'BUNDLE-4PACK')
    .select();

  if (kitError) {
    console.error('Error updating Mini Kit:', kitError.message);
  } else {
    console.log('✓ Updated Mini Kit image');
  }

  // Verify updates
  console.log('\nVerifying updates...');
  const { data: bundles, error: verifyError } = await supabase
    .from('products')
    .select('name, sku, images')
    .eq('category', 'bundles')
    .order('price');

  if (verifyError) {
    console.error('Error verifying:', verifyError.message);
  } else {
    console.log('\nBundle images updated successfully:');
    bundles.forEach((bundle) => {
      console.log(`  ${bundle.name} (${bundle.sku}): ${bundle.images[0]}`);
    });
  }
}

updateBundleImages()
  .then(() => {
    console.log('\n✓ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
