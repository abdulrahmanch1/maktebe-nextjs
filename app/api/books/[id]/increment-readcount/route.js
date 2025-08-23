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
      .select('readcount') // Select only readcount to return
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error incrementing readcount:', error);
    return NextResponse.json({ message: 'Failed to increment readcount.' }, { status: 500 });
  }
};
