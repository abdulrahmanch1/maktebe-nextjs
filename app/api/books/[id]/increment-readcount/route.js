import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const PATCH = async (request, { params }) => {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // Call the RPC function to increment the read count.
    const { error } = await supabase.rpc('increment_readcount', { book_id: id });

    if (error) {
      console.error('Supabase RPC error:', error);
      // Provide a more specific error message if possible
      return NextResponse.json({ message: `Failed to update readcount: ${error.message}` }, { status: 500 });
    }

    // The client-side doesn't strictly need the new count immediately,
    // as the count on the page will be stale until the next refresh anyway.
    // We can just return a success message.
    return NextResponse.json({ message: 'Read count incremented successfully.' });

  } catch (error) {
    console.error('Error incrementing readcount:', error);
    return NextResponse.json({ message: 'Failed to increment readcount.' }, { status: 500 });
  }
};
