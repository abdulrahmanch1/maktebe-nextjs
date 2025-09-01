import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const PATCH = async (request, { params }) => {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // Fetch the current book to get its readcount
    const { data: currentBook, error: fetchError } = await supabase
      .from('books')
      .select('readcount')
      .eq('id', id)
      .single();

    if (fetchError || !currentBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    const newReadCount = (currentBook.readcount || 0) + 1;

    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({ readcount: newReadCount })
      .eq('id', id)
      .select('readcount'); // Removed .single()

    if (updateError) {
      console.error('Supabase update error:', updateError); // Add logging for debugging
      return NextResponse.json({ message: 'Failed to update readcount.' }, { status: 500 });
    }

    // Supabase update with .select() returns an array, even if it's a single row.
    // We expect only one row to be updated due to .eq('id', id).
    if (!updatedBook || updatedBook.length === 0) {
      return NextResponse.json({ message: 'Book not found or no rows updated.' }, { status: 404 });
    }

    return NextResponse.json(updatedBook[0]); // Return the first (and only expected) object
  } catch (error) {
    console.error('Error incrementing readcount:', error);
    return NextResponse.json({ message: 'Failed to increment readcount.' }, { status: 500 });
  }
};
