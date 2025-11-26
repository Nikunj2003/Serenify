import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

console.log(`Checking connection to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
    try {
        // Try to access the profiles table (should exist if migration ran)
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection failed:', error.message);
            if (error.code === 'PGRST204') {
                console.error('   Hint: The "profiles" table does not exist. Did you run the migration?');
            }
            process.exit(1);
        }

        console.log('✅ Supabase connection successful!');
        console.log('✅ "profiles" table found.');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

verifyConnection();
