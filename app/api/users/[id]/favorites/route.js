import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { validateFavorite } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { revalidatePath } from 'next/cache';

export const POST = protect(async (request, { params }) => {
  
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params; // Changed userId to id
  const bookId = request.nextUrl.searchParams.get('bookId');
  const bookIdErrors = validateFavorite({ bookId });

  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
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
      const { data: existingBook } = await supabase
        .from('books')
        .select('favoritecount')
        .eq('id', bookId)
        .single();
      return NextResponse.json({
        message: 'Book already in favorites',
        favorites: currentFavorites,
        favoriteCount: existingBook?.favoritecount,
      }, { status: 200 });
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
      console.error('Error incrementing favoriteCount, rolling back:', incrementError.message);
      // Attempt to roll back the change by restoring the original favorites list
      await supabase
        .from('profiles')
        .update({ favorites: currentFavorites })
        .eq('id', id);
      return NextResponse.json({ message: 'فشل في تحديث عداد المفضلة، تم التراجع عن الإضافة' }, { status: 500 });
    }

    revalidatePath(`/book/${bookId}`, 'page'); // Revalidate the book details page

    // Fetch the updated favoritecount for the book
    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('favoritecount')
      .eq('id', bookId)
      .single();

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
