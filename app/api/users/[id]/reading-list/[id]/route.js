import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Book from '@/models/Book';
import { protect } from '@/lib/middleware';
import { validateReadingStatus, validateMongoId } from '@/lib/validation';

async function getUserAndReadingListItem(id, id) {
  await dbConnect();
  const userIdErrors = validateMongoId(id);
  const bookIdErrors = validateMongoId(id);
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return { user: null, readingListItem: null, error: { message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } } };
  }

  const user = await User.findById(id);
  if (!user) {
    return { user: null, readingListItem: null, error: { message: 'User not found' } };
  }

  const readingListItem = user.readingList.find(item => item.book.toString() === id);
  if (!readingListItem) {
    return { user, readingListItem: null, error: { message: 'Book not found in reading list' } };
  }
  return { user, readingListItem, error: null };
}

export const PATCH = protect(async (request, { params }) => {
  const { id } = params;
  const { read } = await request.json();

  const validationErrors = validateReadingStatus({ read });
  if (Object.keys(validationErrors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors: validationErrors }, { status: 400 });
  }

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, bookId);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' || error.message === 'Book not found in reading list' ? 404 : 400 });
  }

  try {
    readingListItem.read = read;
    await user.save();
    return NextResponse.json(user.readingList);
  } catch (err) {
    console.error('Error updating reading status:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});

export const DELETE = protect(async (request, { params }) => {
  const { id } = params;

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify this reading list' }, { status: 403 });
  }

  const { user, readingListItem, error } = await getUserAndReadingListItem(id, id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' || error.message === 'Book not found in reading list' ? 404 : 400 });
  }

  try {
    user.readingList = user.readingList.filter(item => item.book.toString() !== id);
    await user.save();
    await Book.findByIdAndUpdate(id, { $inc: { readCount: -1 } });
    return NextResponse.json(user.readingList);
  } catch (err) {
    console.error('Error deleting from reading list:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
