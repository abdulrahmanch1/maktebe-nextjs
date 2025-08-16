import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateReadingStatus } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

async function getUserAndReadingListItem(id, bookId) {
  const supabase = createClient(); // Instantiate supabase client
  // Removed validateMongoId calls
  if (!id || !bookId) { // Simple ID validation for Supabase (assuming UUID or integer)
    return { user: null, readingListItem: null, error: { message: 'User ID and Book ID are required' } };
  }

  // Fetch the user and their reading list
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('readingList') // Assuming 'readingList' is a JSONB column or similar
    .eq('id', id)
    .single();

  if (userError || !user) {
    return { user: null, readingListItem: null, error: { message: 'User not found' } };
  }

  // Ensure readingList is an array, initialize if null
  const currentReadingList = Array.isArray(user.readingList) ? user.readingList : [];

  const readingListItem = currentReadingList.find(item => item.book === bookId); // Assuming bookId is directly stored
  if (!readingListItem) {
    return { user, readingListItem: null, error: { message: 'Book not found in reading list' } };
  }
  return { user, readingListItem, error: null };
}

export const PATCH = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id, bookId } = params;
  const { read } = await request.json();

  const validationErrors = validateReadingStatus({ read });
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors: validationErrors }, { status: 400 });
  }

  if (!id || !bookId) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, bookId);
  if (error) {
    return NextResponse.json(error, { status: error.message.includes('not found') ? 404 : 400 });
  }

  try {
    // Ensure readingList is an array, initialize if null
    const currentReadingList = Array.isArray(user.readingList) ? user.readingList : [];

    // Update the read status in the readingList array
    const updatedReadingList = currentReadingList.map(item =>
      item.book === bookId ? { ...item, read: read } : item
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readingList: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json(updatedReadingList);
  } catch (err) {
    console.error('Error updating reading status:', err);
    return NextResponse.json({ message: "خطأ في تحديث حالة القراءة" }, { status: 500 });
  }
});

export const DELETE = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id, bookId } = params;

  if (!id || !bookId) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, bookId);
  if (error) {
    return NextResponse.json(error, { status: error.message.includes('not found') ? 404 : 400 });
  }

  try {
    // Ensure readingList is an array, initialize if null
    const currentReadingList = Array.isArray(user.readingList) ? user.readingList : [];

    // Filter out the book from the readingList array
    const updatedReadingList = currentReadingList.filter(item => item.book !== bookId);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ readingList: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement readCount in the books table atomically
    const { error: decrementError } = await supabase.rpc('decrement_read_count', { book_id_param: bookId });

    if (decrementError) {
      console.error('Error decrementing readCount:', decrementError.message);
    }

    return NextResponse.json(updatedReadingList);
  } catch (err) {
    console.error('Error deleting from reading list:', err);
    return NextResponse.json({ message: "خطأ في الإزالة من قائمة القراءة" }, { status: 500 });
  }
});