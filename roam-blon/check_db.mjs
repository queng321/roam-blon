import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skqisxbsygoytpnlbddi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcWlzeGJzeWdveXRwbmxiZGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTA1NDAsImV4cCI6MjA4Njk4NjU0MH0.K3EVWIRmcA6Flb2SPZjtXbzkntgWgtKkeTOnu69XtDw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const tables = ['destinations', 'dining_hubs', 'tourists', 'reviews', 'emergency_hotlines', 'souvenirs'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} columns:`, data && data[0] ? Object.keys(data[0]) : "Empty table, zero rows");
    }
  }
}
run();
