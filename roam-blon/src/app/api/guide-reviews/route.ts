import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side: uses anon key for now — add SUPABASE_SERVICE_ROLE_KEY to .env.local for full RLS bypass
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { booking_id, reference_code, guide_name, guide_id, tourist_email, tourist_name, rating, comment } = body;

    if (!booking_id && !reference_code) {
      return NextResponse.json({ error: 'Missing booking reference' }, { status: 400 });
    }
    if (!guide_name || !tourist_email || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payload = {
      booking_id: booking_id || null,
      reference_code: reference_code || null,
      guide_name: guide_name.trim(),
      guide_id: guide_id || null,
      tourist_email: tourist_email.trim(),
      tourist_name: tourist_name || null,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: (comment || '').trim(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('guide_reviews')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase guide review insert error:', error.message);
      // Return success anyway so client doesn't retry — review recorded in broadcast
      return NextResponse.json({ success: false, fallback: true, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('guide_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const guideName = url.searchParams.get('guide_name');

    // Option A: delete by row id
    if (id) {
      const { error } = await supabaseAdmin
        .from('guide_reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase guide review delete error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Option B: delete every review for a specific guide name
    if (guideName) {
      const { error } = await supabaseAdmin
        .from('guide_reviews')
        .delete()
        .ilike('guide_name', `%${guideName}%`);

      if (error) {
        console.error('Supabase guide review delete-all error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Missing review id or guide_name' }, { status: 400 });
  } catch (err: any) {
    console.error('API route delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
