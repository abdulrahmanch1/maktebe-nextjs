import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateReadingList } from '@/lib/validation'; // Removed validateMongoId
import { supabase } from '@/lib/supabase'; // Import supabase client

export const POST = protect(async (request, { params }) => {
  const { userId } = params;
  const { bookId } = await request.json();

  // const userIdErrors = validateMongoId(userId); // Removed validateMongoId call
  // if (Object.keys(userIdErrors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid User ID', errors: userIdErrors }, { status: 400 });
  // }
  if (!userId) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const bookIdErrors = validateReadingList({ bookId });
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  if (userId !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this user\'s reading list' }, { status: 403 });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('readingList') // Assuming 'readingList' is a JSONB column or similar
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if the book is already in reading list
    const bookExists = user.readingList.some(item => item.book === bookId);
    if (bookExists) {
      return NextResponse.json({ message: 'Book already in reading list' }, { status: 400 });
    }

    // Add the new book to the readingList array
    const updatedReadingList = [...user.readingList, { book: bookId, read: false }];

    // Update the user's readingList
    const { error: updateError } = await supabase
      .from('users')
      .update({ readingList: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment readCount in the books table atomically
    const { error: incrementError } = await supabase.rpc('increment_read_count', { book_id_param: bookId });

    if (incrementError) {
      console.error('Error incrementing readCount:', incrementError.message);
    }

    return NextResponse.json(updatedReadingList, { status: 201 });
  } catch (err) {
    console.error("Error adding to reading list:", err);
    return NextResponse.json({ message: "خطأ في الإضافة إلى قائمة القراءة" }, { status: 500 });
  }
});
