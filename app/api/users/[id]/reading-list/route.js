import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateReadingList } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { revalidatePath } from 'next/cache';

// GET handler to fetch a user's reading list
export const GET = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  // Authorization check: ensure the logged-in user can only access their own reading list.
  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to view this reading list' }, { status: 403 });
  }

  try {
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('readinglist')
      .eq('id', id)
      .single();

    if (error || !userProfile) {
      console.error('Error fetching reading list:', error);
      return NextResponse.json({ message: 'Reading list not found or user profile error' }, { status: 404 });
    }

    // Ensure readinglist is an array, return empty array if null/undefined
    const readingList = Array.isArray(userProfile.readinglist) ? userProfile.readinglist : [];

    return NextResponse.json(readingList);
  } catch (err) {
    console.error("Error in GET reading list API:", err);
    return NextResponse.json({ message: "خطأ في جلب قائمة القراءة" }, { status: 500 });
  }
});

export const POST = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id } = params;
  const { bookId } = await request.json();

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const bookIdErrors = validateReadingList({ bookId });
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: "Not authorized to modify this user's reading list" }, { status: 403 });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('readinglist')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentReadingList = Array.isArray(user.readinglist) ? user.readinglist : [];

    const bookExists = currentReadingList.some(item => item.book === bookId);
    if (bookExists) {
      return NextResponse.json({ message: 'Book already in reading list' }, { status: 400 });
    }

    const updatedReadingList = [...currentReadingList, { book: bookId, read: false }];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readinglist: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment readCount in the books table atomically
    const { error: incrementError } = await supabase.rpc('increment_read_count', { book_id_param: bookId });

    if (incrementError) {
      console.error('Error incrementing readCount, rolling back:', incrementError.message);
      // Attempt to roll back the change
      await supabase
        .from('profiles')
        .update({ readinglist: currentReadingList }) // use the original reading list
        .eq('id', id);
      return NextResponse.json({ message: 'فشل في تحديث عداد القراءة، تم التراجع عن الإضافة' }, { status: 500 });
    }

    revalidatePath(`/book/${bookId}`, 'page');

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
    }, { status: 201 });
  } catch (err) {
    console.error("Error adding to reading list:", err);
    return NextResponse.json({ message: "خطأ في الإضافة إلى قائمة القراءة" }, { status: 500 });
  }
});
