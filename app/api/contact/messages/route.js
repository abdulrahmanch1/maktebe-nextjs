import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = protect(admin(async (request) => {
  try {
    // Fetch all contact messages from the 'contact_messages' table
    // and populate user details (assuming 'users' table for user info)
    const { data: messages, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*, users(username, email)') // Assuming 'user' column in contact_messages links to 'users' table
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