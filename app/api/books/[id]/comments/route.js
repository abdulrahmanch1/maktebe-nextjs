import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Book from '@/models/Book';
import { protect } from '@/lib/middleware';
import { validateComment, validateMongoId } from '@/lib/validation';

export const POST = protect(async (request, { params }) => {
  await dbConnect();
  const { id } = params;
  const { text } = await request.json();

  const errors = validateComment({ text });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  const bookIdErrors = validateMongoId(id);
  if (Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid Book ID', errors: bookIdErrors }, { status: 400 });
  }

  try {
    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    const newComment = {
      user: request.user._id,
      text,
    };

    book.comments.push(newComment);
    await book.save();

    // Find the newly added comment to return its _id and populated user info
    const addedComment = book.comments[book.comments.length - 1];
    // Manually populate user info for the added comment
    const populatedComment = {
      ...addedComment.toObject(),
      user: { _id: request.user._id, username: request.user.username, profilePicture: request.user.profilePicture },
    };

    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
