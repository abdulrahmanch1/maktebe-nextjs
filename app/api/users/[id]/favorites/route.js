import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { validateFavorite } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { revalidatePath } from 'next/cache';

export const POST = protect(async (request, { params }) => {
  
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params; // Changed userId to id
  const { bookId } = await request.json();
  console.log('Received bookId in API:', bookId);
  const bookIdErrors = validateFavorite({ bookId });
  console.log('Validation errors for bookId:', bookIdErrors);

  // const userIdErrors = validateMongoId(id); // Removed validateMongoId call
  // if (Object.keys(userIdErrors).length > 0) { // Removed this block
  //   return NextResponse.json({ message: 'Invalid User ID', errors: userIdErrors }, { status: 400 });
  // }
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
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

    // Check if the book is already in favorites
    if (currentFavorites.includes(bookId)) {
      return NextResponse.json({ message: 'Book already in favorites', favorites: currentFavorites, favoriteCount: user.favoritecount }, { status: 200 });
    }

    // Add the bookId to the favorites array
    const updatedFavorites = [...currentFavorites, bookId];

    // Update the user's favorites
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorites: updatedFavorites })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Increment favoriteCount in the books table atomically
    const { error: incrementError } = await supabase.rpc('increment_favorite_count', { book_id_param: bookId });

    if (incrementError) {
      console.error('Error incrementing favoriteCount:', incrementError.message);
    }

    revalidatePath(`/book/${bookId}`, 'page'); // Revalidate the book details page

    // Fetch the updated favoritecount for the book
    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('favoritecount')
      .eq('id', bookId)
      .single();

    console.log('POST API: updatedBook:', updatedBook, 'fetchBookError:', fetchBookError); // Debugging line

    if (fetchBookError) {
      console.error('Error fetching updated favoriteCount for book:', fetchBookError.message);
      // Decide how to handle this error - perhaps return without favoritecount or with a default
    }

    return NextResponse.json({
      favorites: updatedFavorites,
      favoriteCount: updatedBook?.favoritecount || 0 // Use optional chaining and default to 0
    });
  } catch (err) {
    console.error("Error adding favorite:", err);
    return NextResponse.json({ message: "خطأ في إضافة المفضلة" }, { status: 500 });
  }
});