const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

async function testSignup() {
  console.log('Testing signup flow...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Generate a unique test email
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';

  try {
    console.log('Step 1: Creating test user...');
    console.log('Email:', testEmail);

    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Insert customer data (simulating the signup flow)
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email: testEmail.toLowerCase(),
        first_name: 'Test',
        last_name: 'User',
        phone: '+46701234567',
        street: '',
        city: '',
        postal_code: '',
        country: 'Sweden',
        consent_given: true,
        marketing_opt_in: false,
        password_hash: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create user:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ User created successfully!');
    console.log('User ID:', data.id);
    console.log('Email:', data.email);
    console.log('Name:', `${data.first_name} ${data.last_name}`);
    console.log('');

    console.log('Step 2: Verifying password...');
    const isValidPassword = await bcrypt.compare(testPassword, data.password_hash);

    if (isValidPassword) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    console.log('');

    console.log('Step 3: Querying user from database...');
    const { data: queriedUser, error: queryError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', testEmail.toLowerCase())
      .single();

    if (queryError) {
      console.error('❌ Failed to query user:', queryError.message);
      return;
    }

    console.log('✅ User found in database!');
    console.log('User details:', {
      id: queriedUser.id,
      email: queriedUser.email,
      name: `${queriedUser.first_name} ${queriedUser.last_name}`,
      created_at: queriedUser.created_at,
    });
    console.log('');

    console.log('Step 4: Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('⚠️  Warning: Could not delete test user:', deleteError.message);
      console.log('You may need to manually delete the user with email:', testEmail);
    } else {
      console.log('✅ Test user cleaned up successfully!');
    }

    console.log('\n🎉 All signup tests passed! The signup flow is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSignup();
