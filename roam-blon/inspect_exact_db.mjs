import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skqisxbsygoytpnlbddi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcWlzeGJzeWdveXRwbmxiZGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTA1NDAsImV4cCI6MjA4Njk4NjU0MH0.K3EVWIRmcA6Flb2SPZjtXbzkntgWgtKkeTOnu69XtDw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTables() {
  const tables = [
    'admins',
    'chat_messages',
    'destinations',
    'dining_hubs',
    'emergency_hotlines',
    'reviews',
    'tour_guide_bookings',
    'tourists'
  ];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} columns:`, data && data[0] ? Object.keys(data[0]) : "Empty table (0 rows)");
    }
  }
}

inspectTables();
