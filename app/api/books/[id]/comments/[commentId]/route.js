import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/dbConnect'; // This file was deleted, so remove this import
// import Book from '@/models/Book'; // Comment out or remove this line
import { protect, admin } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';

// async function getBookAndComment(id, commentId) {
//   // await dbConnect(); // Remove this line
//   const bookIdErrors = validateMongoId(id);
//   const commentIdErrors = validateMongoId(commentId);

//   if (Object.keys(bookIdErrors).length > 0 || Object.keys(commentIdErrors).length > 0) {
//     return { book: null, comment: null, error: { message: 'Invalid IDs', errors: { ...bookIdErrors, ...commentIdErrors } } };
//   }

//   // const book = await Book.findById(id); // Replace with Supabase query
//   // if (!book) {
//   //   return { book: null, comment: null, error: { message: 'Book not found' } };
//   // }

//   // const comment = book.comments.id(commentId); // Replace with Supabase query
//   // if (!comment) {
//   //   return { book, comment: null, error: { message: 'Comment not found' } };
//   // }
//   // return { book, comment, error: null };
//   return { book: null, comment: null, error: { message: 'TODO: Implement getBookAndComment with Supabase' } };
// }

export const DELETE = protect(async (request, { params }) => {
  const { id, commentId } = params;
  // const { book, comment, error } = await getBookAndComment(id, commentId); // Replace with Supabase logic

  // if (error) {
  //   return NextResponse.json(error, { status: error.message === 'Book not found' || error.message === 'Comment not found' ? 404 : 400 });
  // }

  // // Check if the user is the comment author or an admin
  // if (request.user._id.toString() !== comment.user.toString() && request.user.role !== 'admin') {
  //   return NextResponse.json({ message: 'Not authorized to delete this comment' }, { status: 403 });
  // }

  // try {
  //   comment.deleteOne(); // Mongoose subdocument method - Replace with Supabase logic
  //   await book.save(); // Replace with Supabase logic
  //   return NextResponse.json({ message: 'Comment deleted successfully' });
  // } catch (err) {
  //   console.error('Error deleting comment:', err);
  //   return NextResponse.json({ message: err.message }, { status: 500 });
  // }
  return NextResponse.json({ message: 'DELETE comment endpoint - TODO: Implement with Supabase' });
});

export const PATCH = protect(async (request, { params }) => {
  const { id, commentId } = params;
  // const { book, comment, error } = await getBookAndComment(id, commentId); // Replace with Supabase logic

  // if (error) {
  //   return NextResponse.json(error, { status: error.message === 'Book not found' || error.message === 'Comment not found' ? 404 : 400 });
  // }

  // try {
  //   const userId = request.user._id;
  //   const userLikedIndex = comment.likes.findIndex(id => id.toString() === userId.toString());

  //   let liked = false;
  //   if (userLikedIndex === -1) {
  //     // User has not liked, so add like
  //     comment.likes.push(userId);
  //     liked = true;
  //   } else {
  //     // User has liked, so remove like
  //     comment.likes.splice(userLikedIndex, 1);
  //     liked = false;
  //   }

  //   await book.save();

  //   return NextResponse.json({ likes: comment.likes.length, liked });
  // } catch (err) {
  //   console.error('Error toggling like:', err);
  //   return NextResponse.json({ message: err.message }, { status: 500 });
  // }
  return NextResponse.json({ message: 'PATCH comment endpoint - TODO: Implement with Supabase' });
});
