import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skqisxbsygoytpnlbddi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcWlzeGJzeWdveXRwbmxiZGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTA1NDAsImV4cCI6MjA4Njk4NjU0MH0.K3EVWIRmcA6Flb2SPZjtXbzkntgWgtKkeTOnu69XtDw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Inserting dummy destination...");
  const { data, error } = await supabase.from('destinations').insert([
    {
      name: "Test Beach",
      location: "Test Location",
      description: "Test Description",
      category: "Beaches",
      image_url: "https://example.com/test.jpg"
    }
  ]).select();

  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success! Created:", data);
    
    // Clean up
    console.log("Cleaning up test destination...");
    const { error: delError } = await supabase.from('destinations').delete().eq('id', data[0].id);
    if (delError) console.error("Clean up error:", delError);
    else console.log("Clean up success!");
  }
}

test();
