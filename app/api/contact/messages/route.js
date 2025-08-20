import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server'; // Use the server-side client

export const GET = protect(admin(async (request) => {
  try {
    const supabase = await createClient();
    const { data: messages, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*, username, email, users(username, email)') // Select username and email directly from contact_messages, and also from linked user if available
      .order('created_at', { ascending: false }); // Assuming 'created_at' column exists

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));