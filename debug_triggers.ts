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
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
    console.log('Checking mood_logs table structure...');

    // Try to select the 'triggers' column. 
    // If column doesn't exist, this should throw an error.
    // If RLS blocks it, it returns empty data but no error.
    const { data, error } = await supabase
        .from('mood_logs')
        .select('triggers')
        .limit(1);

    if (error) {
        console.error('Error fetching triggers column:', error.message);
        return;
    }

    console.log('Success: triggers column exists (even if data is empty due to RLS).');
}

checkTriggers();
