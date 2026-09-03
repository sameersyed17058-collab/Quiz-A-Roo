const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials missing in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  try {
    // Create users table
    console.log('📝 Checking users table...');
    const { data: usersCheck, error: usersCheckError } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (usersCheckError && usersCheckError.code === 'PGRST116') {
      console.log('⚠️  Users table does not exist - creating via SQL...');
      // Table doesn't exist, user will need to create it manually
    } else if (usersCheckError) {
      console.log('❌ Error:', usersCheckError.message);
    } else {
      console.log('✅ Users table exists');
    }

    // Create quiz_results table
    console.log('📝 Checking quiz_results table...');
    const { data: resultsCheck, error: resultsCheckError } = await supabase
      .from('quiz_results')
      .select('*')
      .limit(0);

    if (resultsCheckError && resultsCheckError.code === 'PGRST116') {
      console.log('⚠️  Quiz results table does not exist - creating via SQL...');
      // Table doesn't exist, user will need to create it manually
    } else if (resultsCheckError) {
      console.log('❌ Error:', resultsCheckError.message);
    } else {
      console.log('✅ Quiz results table exists');
    }

    // Test connection
    console.log('\n🔍 Testing database connection...');
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('⚠️  Tables need to be created. Please follow the manual setup...');
      } else {
        console.log('❌ Connection error:', testError.message);
      }
    } else {
      console.log('✅ Database connection successful!');
    }

    console.log('\n📋 MANUAL SETUP REQUIRED:');
    console.log('Go to your Supabase dashboard SQL editor and run:\n');

    const setupSQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  total_quizzes INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(player_name) REFERENCES users(name) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_player ON quiz_results(player_name);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created ON quiz_results(created_at DESC);
    `;

    console.log(setupSQL);

    console.log('\n✨ After running the SQL above:');
    console.log('   1. Your Supabase database will have persistent storage');
    console.log('   2. Restart the server to enable Supabase integration');
    console.log('   3. All quiz data will be saved permanently!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
