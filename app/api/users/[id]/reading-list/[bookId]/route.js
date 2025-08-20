import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const DELETE = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id, bookId } = await params;

  if (!id || !bookId) {
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  try {
    // Fetch the user's current reading list
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('readinglist')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentReadingList = Array.isArray(user.readingList) ? user.readingList : [];

    // Filter out the bookId from the reading list
    const updatedReadingList = currentReadingList.filter(item => item.book !== bookId);

    // Update the user's reading list
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readinglist: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement readcount in the books table atomically
    const { error: decrementError } = await supabase.rpc('decrement_read_count', { book_id_param: bookId });

    if (decrementError) {
      console.error('Error decrementing readcount:', decrementError.message);
    }

    // Fetch the updated readcount for the book
    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('readcount')
      .eq('id', bookId)
      .single();

    if (fetchBookError) {
      console.error('Error fetching updated readcount for book:', fetchBookError.message);
    }

    return NextResponse.json({
      readingList: updatedReadingList,
      readCount: updatedBook ? updatedBook.readcount : undefined
    });

  } catch (err) {
    console.error("Error removing from reading list:", err);
    return NextResponse.json({ message: "خطأ في إزالة الكتاب من قائمة القراءة" }, { status: 500 });
  }
});
