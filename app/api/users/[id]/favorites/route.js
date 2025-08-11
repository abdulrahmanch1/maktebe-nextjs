import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { validateFavorite } from '@/lib/validation';
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

  const bookIdErrors = validateFavorite({ bookId });
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  if (userId !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify these favorites' }, { status: 403 });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorites') // Assuming 'favorites' is a JSONB column or similar
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if the book is already in favorites
    if (user.favorites.includes(bookId)) {
      return NextResponse.json({ message: 'Book already in favorites' }, { status: 400 });
    }

    // Add the bookId to the favorites array
    const updatedFavorites = [...user.favorites, bookId];

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment favoriteCount in the books table
    const { data: book, error: bookFetchError } = await supabase
      .from('books')
      .select('favoriteCount')
      .eq('id', bookId)
      .single();

    if (bookFetchError || !book) {
      console.warn(`Book with ID ${bookId} not found when incrementing favoriteCount.`);
    } else {
      const { error: incrementError } = await supabase
        .from('books')
        .update({ favoriteCount: book.favoriteCount + 1 })
        .eq('id', bookId);

      if (incrementError) {
        console.error('Error incrementing favoriteCount:', incrementError.message);
      }
    }

    return NextResponse.json({ favorites: updatedFavorites });
  } catch (err) {
    console.error("Error adding favorite:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});