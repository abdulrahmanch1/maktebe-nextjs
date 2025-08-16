import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { validateFavorite } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const POST = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
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
      .from('profiles')
      .select('favorites') // Assuming 'favorites' is a JSONB column or similar
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Ensure favorites is an array, initialize if null
    const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];

    // Check if the book is already in favorites
    if (currentFavorites.includes(bookId)) {
      return NextResponse.json({ message: 'Book already in favorites' }, { status: 400 });
    }

    // Add the bookId to the favorites array
    const updatedFavorites = [...currentFavorites, bookId];

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment favoriteCount in the books table atomically
    const { error: incrementError } = await supabase.rpc('increment_favorite_count', { book_id_param: bookId });

    if (incrementError) {
      console.error('Error incrementing favoriteCount:', incrementError.message);
    }

    return NextResponse.json({ favorites: updatedFavorites });
  } catch (err) {
    console.error("Error adding favorite:", err);
    return NextResponse.json({ message: "خطأ في إضافة المفضلة" }, { status: 500 });
  }
});