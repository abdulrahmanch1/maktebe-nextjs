import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const DELETE = protect(async (request, { params }) => {
  const { id, bookId } = params;

  const userIdErrors = validateMongoId(id);
  const bookIdErrors = validateMongoId(bookId);
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } }, { status: 400 });
  }

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify these favorites' }, { status: 403 });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorites') // Assuming 'favorites' is a JSONB column or similar
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Filter out the bookId from the favorites array
    const updatedFavorites = user.favorites.filter(favId => favId !== bookId);

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement favoriteCount in the books table
    // This might require a Supabase function or a separate query
    const { data: book, error: bookFetchError } = await supabase
      .from('books')
      .select('favoriteCount')
      .eq('id', bookId)
      .single();

    if (bookFetchError || !book) {
      console.warn(`Book with ID ${bookId} not found when decrementing favoriteCount.`);
    } else {
      const { error: decrementError } = await supabase
        .from('books')
        .update({ favoriteCount: book.favoriteCount - 1 })
        .eq('id', bookId);

      if (decrementError) {
        console.error('Error decrementing favoriteCount:', decrementError.message);
      }
    }

    return NextResponse.json({ favorites: updatedFavorites });
  } catch (err) {
    console.error("Error removing favorite:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
