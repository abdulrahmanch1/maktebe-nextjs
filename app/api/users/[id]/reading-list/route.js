import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateMongoId, validateReadingList } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const POST = protect(async (request, { params }) => {
  const { userId } = params;
  const { bookId } = await request.json();

  const userIdErrors = validateMongoId(userId);
  const bookIdErrors = validateReadingList({ bookId });
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } }, { status: 400 });
  }

  if (userId !== request.user._id.toString()) {
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
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment readCount in the books table
    const { data: book, error: bookFetchError } = await supabase
      .from('books')
      .select('readCount')
      .eq('id', bookId)
      .single();

    if (bookFetchError || !book) {
      console.warn(`Book with ID ${bookId} not found when incrementing readCount.`);
    } else {
      const { error: incrementError } = await supabase
        .from('books')
        .update({ readCount: book.readCount + 1 })
        .eq('id', bookId);

      if (incrementError) {
        console.error('Error incrementing readCount:', incrementError.message);
      }
    }

    return NextResponse.json(updatedReadingList, { status: 201 });
  } catch (err) {
    console.error("Error adding to reading list:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});