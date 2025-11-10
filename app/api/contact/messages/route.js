import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server'; // Use the server-side client

export const GET = protect(admin(async (request) => {
  try {
    const supabase = await createClient();
    // Select all columns from contact_messages directly. Assumes username and email are stored in the table.
    const { data: messages, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*') 
      .order('created_at', { ascending: false });

    if (fetchError) {
      // Throw an error with a more specific message if the fetch fails
      throw new Error(`Could not fetch contact messages: ${fetchError.message}`);
    }

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));