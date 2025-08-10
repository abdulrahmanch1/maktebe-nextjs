import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateReadingStatus, validateMongoId } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

async function getUserAndReadingListItem(id, bookId) {
  const userIdErrors = validateMongoId(id);
  const bookIdErrors = validateMongoId(bookId);
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return { user: null, readingListItem: null, error: { message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } } };
  }

  // Fetch the user and their reading list
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('readingList') // Assuming 'readingList' is a JSONB column or similar
    .eq('id', id)
    .single();

  if (userError || !user) {
    return { user: null, readingListItem: null, error: { message: 'User not found' } };
  }

  const readingListItem = user.readingList.find(item => item.book === bookId); // Assuming bookId is directly stored
  if (!readingListItem) {
    return { user, readingListItem: null, error: { message: 'Book not found in reading list' } };
  }
  return { user, readingListItem, error: null };
}

export const PATCH = protect(async (request, { params }) => {
  const { id, bookId } = params;
  const { read } = await request.json();

  const validationErrors = validateReadingStatus({ read });
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors: validationErrors }, { status: 400 });
  }

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, bookId);
  if (error) {
    return NextResponse.json(error, { status: error.message.includes('not found') ? 404 : 400 });
  }

  try {
    // Update the read status in the readingList array
    const updatedReadingList = user.readingList.map(item =>
      item.book === bookId ? { ...item, read: read } : item
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({ readingList: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedReadingList);
  } catch (err) {
    console.error('Error updating reading status:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});

export const DELETE = protect(async (request, { params }) => {
  const { id, bookId } = params;

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, bookId);
  if (error) {
    return NextResponse.json(error, { status: error.message.includes('not found') ? 404 : 400 });
  }

  try {
    // Filter out the book from the readingList array
    const updatedReadingList = user.readingList.filter(item => item.book !== bookId);

    const { error: updateError } = await supabase
      .from('users')
      .update({ readingList: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement readCount in the books table
    const { data: book, error: bookFetchError } = await supabase
      .from('books')
      .select('readCount')
      .eq('id', bookId)
      .single();

    if (bookFetchError || !book) {
      console.warn(`Book with ID ${bookId} not found when decrementing readCount.`);
    }
    else {
      const { error: decrementError } = await supabase
        .from('books')
        .update({ readCount: book.readCount - 1 })
        .eq('id', bookId);

      if (decrementError) {
        console.error('Error decrementing readCount:', decrementError.message);
      }
    }

    return NextResponse.json(updatedReadingList);
  } catch (err) {
    console.error('Error deleting from reading list:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
