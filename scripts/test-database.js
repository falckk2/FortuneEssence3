const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split(/\r?\n/).forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDatabase() {
  console.log('Testing database connection...\n');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Environment variables not set!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
    process.exit(1);
  }

  console.log('✓ Environment variables loaded');
  console.log('URL:', supabaseUrl);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Check if we can query the customers table
    console.log('Test 1: Querying customers table...');
    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: false });

    if (error) {
      console.error('❌ Failed to query customers table');
      console.error('Error message:', error.message || 'No error message');
      console.error('Error code:', error.code);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error hint:', error.hint);
      return;
    }

    console.log(`✓ Successfully connected to customers table`);
    console.log(`✓ Total customers in database: ${count}`);
    console.log('');

    // Test 2: Check table structure
    console.log('Test 2: Checking table structure...');
    const { data: sampleData, error: structureError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Failed to check table structure:', structureError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✓ Table columns:', Object.keys(sampleData[0]).join(', '));
      console.log('');
      console.log('Sample customer:', {
        id: sampleData[0].id,
        email: sampleData[0].email,
        name: `${sampleData[0].first_name} ${sampleData[0].last_name}`,
        created_at: sampleData[0].created_at,
      });
    } else {
      console.log('⚠ No customers in database yet (table is empty)');
    }

    console.log('\n✅ Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabase();
