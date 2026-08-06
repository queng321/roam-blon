import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skqisxbsygoytpnlbddi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcWlzeGJzeWdveXRwbmxiZGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTA1NDAsImV4cCI6MjA4Njk4NjU0MH0.K3EVWIRmcA6Flb2SPZjtXbzkntgWgtKkeTOnu69XtDw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data, error } = await supabase
  .from('dining_hubs')
  .select('*')
  .or('name.ilike.%yurich%,name.ilike.%caffeinate%');
console.log(JSON.stringify(data, null, 2));
console.log('error:', error?.message || 'none');
