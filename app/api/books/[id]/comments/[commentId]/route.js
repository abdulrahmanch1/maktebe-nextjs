import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server'; // Correct import for server-side

async function getComment(commentId) {
  const supabase = await createClient(); // Instantiate supabase client
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
  const supabase = await createClient(); // Instantiate supabase client
  const { commentId } = await params;

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
  const supabase = await createClient(); // Instantiate supabase client
  const { commentId } = await params;
  const { comment, error } = await getComment(commentId);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'Comment not found' ? 404 : 400 });
  }

  try {
    const userId = request.user.id;

    // Log for debugging
    console.log('Comment likes data:', comment.likes);
    console.log('User ID:', userId);

    // Ensure currentLikes is an array, handle null/undefined/corrupted data
    let currentLikes = [];
    if (Array.isArray(comment.likes)) {
      currentLikes = comment.likes;
    } else if (comment.likes === null || comment.likes === undefined) {
      currentLikes = [];
    } else {
      // If it's corrupted (e.g., a string or object), reset to empty array
      console.warn('Corrupted likes data, resetting to empty array:', comment.likes);
      currentLikes = [];
    }

    // Convert all likes to strings for consistent comparison
    currentLikes = currentLikes.map(id => String(id));
    const userIdString = String(userId);

    const userLikedIndex = currentLikes.indexOf(userIdString);

    let liked = false;
    if (userLikedIndex === -1) {
      // User has not liked, so add like
      currentLikes.push(userIdString);
      liked = true;
    } else {
      // User has liked, so remove like
      currentLikes.splice(userLikedIndex, 1);
      liked = false;
    }


    const { data: updatedComments, error: updateError } = await supabase
      .from('comments')
      .update({ likes: currentLikes })
      .eq('id', commentId)
      .select();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw new Error(updateError.message);
    }

    // Check if comment was found and updated
    if (!updatedComments || updatedComments.length === 0) {
      return NextResponse.json({ message: 'التعليق غير موجود أو تم حذفه' }, { status: 404 });
    }

    return NextResponse.json({ likes: updatedComments[0].likes.length, liked });
  } catch (err) {
    console.error('Error toggling like:', err);
    return NextResponse.json({ message: "خطأ في تبديل الإعجاب" }, { status: 500 });
  }
});
