import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side: uses service role key for full RLS bypass, falling back to anon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Upsert a tourist by email so every login/signup is recorded in the tourists table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, age, nationality, country, gender, avatar_url } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const nationalityValue =
      nationality === 'foreign' ? 'Foreign' : (nationality?.trim() === 'foreign' ? 'Foreign' : 'Local');

    const { data, error } = await supabaseAdmin
      .from('tourists')
      .upsert(
        {
          email: email.trim(),
          age: Number(age) || null,
          nationality: nationalityValue,
          country: country?.trim() || null,
          gender: gender?.trim() || null,
          avatar_url: avatar_url?.trim() || null,
        },
        { onConflict: 'email' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase tourist upsert error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error('API tourist route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}