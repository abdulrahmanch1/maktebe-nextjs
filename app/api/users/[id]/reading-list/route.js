import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateReadingList } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const POST = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id } = params; // Changed userId to id
  const { bookId } = await request.json();

  // const userIdErrors = validateMongoId(userId); // Removed validateMongoId call
  // if (Object.keys(userIdErrors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid User ID', errors: userIdErrors }, { status: 400 });
  // }
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const bookIdErrors = validateReadingList({ bookId });
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify this user\'s reading list' }, { status: 403 });
  }

  try {
    // Fetch the user
    console.log('ReadingList POST API: Attempting to fetch user with ID:', id); // Added log
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('readinglist') // Assuming 'readinglist' is a JSONB column or similar
      .eq('id', id)
      .single();

    console.log('ReadingList POST API: User fetch result - user:', user, 'userError:', userError); // Added log

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('ReadingList POST API: User data from DB:', user);
    console.log('ReadingList POST API: currentReadingList from DB:', user.readingList, 'Type:', typeof user.readingList, 'Is Array:', Array.isArray(user.readingList));

    // Ensure readingList is an array, initialize if null
    const currentReadingList = Array.isArray(user.readingList) ? user.readingList : [];

    // Check if the book is already in reading list
    const bookExists = currentReadingList.some(item => item.book === bookId);
    if (bookExists) {
      return NextResponse.json({ message: 'Book already in reading list' }, { status: 400 });
    }

    // Add the new book to the readingList array
    const updatedReadingList = [...currentReadingList, { book: bookId, read: false }];
    console.log('ReadingList POST API: updatedReadingList (before DB update):', updatedReadingList);

    // Update the user\'s readingList
    const { error: updateError } = await supabase
      .from('profiles') // Changed from 'users' to 'profiles'
      .update({ readinglist: updatedReadingList })
      .eq('id', id);

    if (updateError) {
      console.error('ReadingList POST API: Supabase update error:', updateError);
      throw new Error(updateError.message);
    }
    console.log('ReadingList POST API: DB update successful.');

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
