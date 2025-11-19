import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { protect } from '@/lib/middleware';

export const PATCH = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase.rpc('increment_readcount', { book_id: id });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ message: `Failed to update readcount: ${error.message}` }, { status: 500 });
    }

    const { data: updatedBook, error: fetchError } = await supabase
      .from('books')
      .select('readcount')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch updated readcount:', fetchError);
      return NextResponse.json({ message: 'Read count incremented, but retrieving the latest value failed.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Read count incremented successfully.', readcount: updatedBook.readcount });
  } catch (error) {
    console.error('Error incrementing readcount:', error);
    return NextResponse.json({ message: 'Failed to increment readcount.' }, { status: 500 });
  }
});
