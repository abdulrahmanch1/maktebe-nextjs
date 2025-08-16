import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

async function getComment(commentId) {
  const supabase = createClient(); // Instantiate supabase client
  if (!commentId) {
    return { comment: null, error: { message: 'Comment ID is required' } };
  }

  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('*, user_id') // Select user_id to check ownership
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return { comment: null, error: { message: 'Comment not found' } };
  }
  return { comment, error: null };
}

export const DELETE = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { commentId } = params;

  const { comment, error } = await getComment(commentId);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Comment not found' ? 404 : 400 });
  }

  // Check if the user is the comment author or an admin
  if (request.user.id !== comment.user_id && request.user.role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized to delete this comment' }, { status: 403 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: 'تم حذف التعليق بنجاح' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return NextResponse.json({ message: "خطأ في حذف التعليق" }, { status: 500 });
  }
});

export const PATCH = protect(async (request, { params }) => {
  const supabase = createClient(); // Instantiate supabase client
  const { commentId } = params;
  const { comment, error } = await getComment(commentId);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Comment not found' ? 404 : 400 });
  }

  try {
    const userId = request.user.id;
    let currentLikes = comment.likes || []; // Ensure it's an array

    const userLikedIndex = currentLikes.indexOf(userId);

    let liked = false;
    if (userLikedIndex === -1) {
      // User has not liked, so add like
      currentLikes.push(userId);
      liked = true;
    } else {
      // User has liked, so remove like
      currentLikes.splice(userLikedIndex, 1);
      liked = false;
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ likes: currentLikes })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ likes: updatedComment.likes.length, liked });
  } catch (err) {
    console.error('Error toggling like:', err);
    return NextResponse.json({ message: "خطأ في تبديل الإعجاب" }, { status: 500 });
  }
});
