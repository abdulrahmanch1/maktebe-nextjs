import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Book from '@/models/Book';
import { protect } from '@/lib/middleware';
import { validateReadingList, validateMongoId } from '@/lib/validation';

export const POST = protect(async (request, { params }) => {
  const { userId } = params;
  const { bookId } = await request.json();

  const userIdErrors = validateMongoId(userId);
  const bookIdErrors = validateReadingList({ bookId });
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } }, { status: 400 });
  }

  if (userId !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  await dbConnect();
  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const bookExists = user.readingList.some(item => item.book.toString() === bookId);
    if (bookExists) {
      return NextResponse.json({ message: 'Book already in reading list' }, { status: 400 });
    }

    user.readingList.push({ book: bookId, read: false });
    await user.save();
    await Book.findByIdAndUpdate(bookId, { $inc: { readCount: 1 } });

    return NextResponse.json(user.readingList, { status: 201 });
  } catch (err) {
    console.error("Error adding to reading list:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
