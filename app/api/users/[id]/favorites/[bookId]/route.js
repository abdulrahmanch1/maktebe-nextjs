import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const DELETE = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { id, bookId } = params;

  // const userIdErrors = validateMongoId(id); // Removed validateMongoId call
  // const bookIdErrors = validateMongoId(bookId); // Removed validateMongoId call
  // if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } }, { status: 400 });
  // }
  if (!id || !bookId) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  if (id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to modify these favorites' }, { status: 403 });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('favorites') // Assuming 'favorites' is a JSONB column or similar
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Ensure favorites is an array, initialize if null
    const currentFavorites = user.favorites || [];

    // Filter out the bookId from the favorites array
    const updatedFavorites = currentFavorites.filter(favId => favId !== bookId);

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement favoriteCount in the books table atomically
    const { error: decrementError } = await supabase.rpc('decrement_favorite_count', { book_id_param: bookId });

    if (decrementError) {
      console.error('Error decrementing favoriteCount:', decrementError.message);
    }

    return NextResponse.json({ favorites: updatedFavorites });
  } catch (err) {
    console.error("Error removing favorite:", err);
    return NextResponse.json({ message: "خطأ في إزالة المفضلة" }, { status: 500 });
  }
});