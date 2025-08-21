import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { revalidatePath } from 'next/cache';

export const DELETE = protect(async (request, { params }) => {
  const supabase = await createClient(); // Instantiate supabase client
  const { id, bookId } = await params;

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
    const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];

    // Filter out the bookId from the favorites array
    const updatedFavorites = currentFavorites.filter(favId => favId !== bookId);

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorites: updatedFavorites })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Decrement favoriteCount in the books table atomically
    const { error: decrementError } = await supabase.rpc('decrement_favorite_count', { book_id_param: bookId });

    if (decrementError) {
      console.error('Error decrementing favoriteCount:', decrementError.message);
      // Unlike the POST, a rollback is more complex.
      // We'll return an error to signal that the operation was not fully successful.
      return NextResponse.json({ message: 'تمت إزالة الكتاب من المفضلة، لكن فشل تحديث العداد الإجمالي' }, { status: 500 });
    }

    revalidatePath(`/book/${bookId}`, 'page'); // Revalidate the book details page

    // Fetch the updated favoritecount for the book
    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('favoritecount')
      .eq('id', bookId)
      .single();

    return NextResponse.json({ message: 'Book removed from favorites' });
  } catch (error) {