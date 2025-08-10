import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const GET = protect(async (request, { params }) => {
  const { id } = params;

  const bookIdErrors = validateMongoId(id);
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  try {
    // Fetch comments for the given book_id and populate user details
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*, users(username, profilePicture)') // Assuming 'users' is the table for user details
      .eq('book_id', id); // Assuming comments table has a book_id column

    if (commentsError) {
      throw new Error(commentsError.message);
    }

    return NextResponse.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});

export const POST = protect(async (request, { params }) => {
  const { id } = params;
  const { text } = await request.json();

  const bookIdErrors = validateMongoId(id);
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  try {
    // Insert new comment into the comments table
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        book_id: id,
        text: text,
        user_id: request.user._id, // Assuming request.user._id is the Supabase user ID
      })
      .select('*, users(username, profilePicture)') // Select the newly inserted comment and populate user details
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (err) {
    console.error('Error adding comment:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
