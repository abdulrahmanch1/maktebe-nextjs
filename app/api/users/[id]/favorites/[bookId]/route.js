import { NextResponse } from 'next/server';
import { protect, getUserFromRequest } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Removed validateMongoId
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side
import { revalidatePath } from 'next/cache';


export const POST = protect(async (request, { params }) => {
  const supabase = await createClient();
  const { id, bookId } = await params;

  if (!id || !bookId) {
    return NextResponse.json({ message: 'User ID and Book ID are required' }, { status: 400 });
  }

  const user = getUserFromRequest(request);
  if (id !== user.id) {
    return NextResponse.json({ message: 'Not authorized to modify these favorites' }, { status: 403 });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('favorites')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];

    if (currentFavorites.includes(bookId)) {
      return NextResponse.json({ message: 'Book already in favorites' }, { status: 409 });
    }

    const updatedFavorites = [...currentFavorites, bookId];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorites: updatedFavorites })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: incrementError } = await supabase.rpc('increment_favorite_count', { book_id_param: bookId });

    if (incrementError) {
      console.error('Error incrementing favoriteCount:', incrementError.message);
      return NextResponse.json({ message: 'تمت إضافة الكتاب إلى المفضلة، لكن فشل تحديث العداد الإجمالي' }, { status: 500 });
    }

    const { data: updatedBook, error: fetchError } = await supabase
      .from('books')
      .select('favoritecount')
      .eq('id', bookId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch favoritecount after increment:', fetchError);
    }

    revalidatePath(`/book/${bookId}`, 'page');

    return NextResponse.json({
      message: 'Book added to favorites',
      favoriteCount: updatedBook?.favoritecount,
    });
  } catch (error) {
    console.error("Error adding book to favorites:", error);
    return NextResponse.json({ message: "فشل إضافة الكتاب إلى المفضلة" }, { status: 500 });
  }
});

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

  const user = getUserFromRequest(request);
  if (id !== user.id) {
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

    const { data: updatedBook, error: fetchBookError } = await supabase
      .from('books')
      .select('favoritecount')
      .eq('id', bookId)
      .single();

    if (fetchBookError) {
      console.error('Failed to fetch favoritecount after decrement:', fetchBookError);
    }

    revalidatePath(`/book/${bookId}`, 'page'); // Revalidate the book details page

    return NextResponse.json({
      message: 'Book removed from favorites',
      favoriteCount: updatedBook?.favoritecount,
    });
  } catch (error) {
    console.error("Error removing book from favorites:", error);
    return NextResponse.json({ message: "فشل إزالة الكتاب من المفضلة" }, { status: 500 });
  }
});
