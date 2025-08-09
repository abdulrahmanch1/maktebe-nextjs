import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Book from '@/models/Book';
import { protect } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';

export const DELETE = protect(async (request, { params }) => {
  const { id } = params;

  const userIdErrors = validateMongoId(id);
  const bookIdErrors = validateMongoId(id);
  if (Object.keys(userIdErrors).length > 0 || Object.keys(bookIdErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid IDs', errors: { ...userIdErrors, ...bookIdErrors } }, { status: 400 });
  }

  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to modify these favorites' }, { status: 403 });
  }

  await dbConnect();
  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.favorites = user.favorites.filter(id => id.toString() !== id);
    await user.save();
    await Book.findByIdAndUpdate(id, { $inc: { favoriteCount: -1 } });

    return NextResponse.json({ favorites: user.favorites });
  } catch (err) {
    console.error("Error removing favorite:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
