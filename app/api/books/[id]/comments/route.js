import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
// import { validateMongoId } from '@/lib/validation'; // Remove this import
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

export const GET = protect(async (request, { params }) => {
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params;

  // const bookIdErrors = validateMongoId(id); // Remove this line
  // if (Object.keys(bookIdErrors).length > 0) { // Remove this block
  //   return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  // }
  // Simple ID validation for Supabase (assuming UUID or integer)
  if (!id) {
    return NextResponse.json({ message: 'Book ID is required' }, { status: 400 });
  }

  try {
    // Fetch comments for the given book_id and populate user details
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*, profiles(username, profilepicture)') // Assuming 'profiles' is the table for user details
      .eq('book_id', id); // Assuming comments table has a book_id column

    if (commentsError) {
      throw new Error(commentsError.message);
    }

    
    return NextResponse.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return NextResponse.json({ message: "خطأ في جلب التعليقات" }, { status: 500 });
  }
});

export const POST = protect(async (request, { params }) => {
  const supabase = await createClient(); // Instantiate supabase client
  const { id } = await params;
  const { text } = await request.json();

  // const bookIdErrors = validateMongoId(id); // Remove this line
  // if (Object.keys(bookIdErrors).length > 0) { // Remove this block
  //   return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  // }
  // Simple ID validation for Supabase (assuming UUID or integer)
  if (!id) {
    return NextResponse.json({ message: 'معرف الكتاب مطلوب' }, { status: 400 });
  }

  try {
    // Insert new comment into the comments table
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        book_id: id,
        text: text,
        user_id: request.user.id, // Assuming request.user.id is the Supabase user ID
      })
      .select('*, profiles(username, profilepicture)') // Select the newly inserted comment and populate user details
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    
    return NextResponse.json(newComment, { status: 201 });
  } catch (err) {
    console.error('Error adding comment:', err);
    return NextResponse.json({ message: "خطأ في إضافة التعليق" }, { status: 500 });
  }
});