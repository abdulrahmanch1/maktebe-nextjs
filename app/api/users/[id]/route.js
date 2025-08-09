import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { protect, admin } from '@/lib/middleware';
import { validateUserUpdate, validateMongoId } from '@/lib/validation';

async function getUser(id) {
  await dbConnect();
  const errors = validateMongoId(id);
  if (Object.keys(errors).length > 0) {
    return { user: null, error: { message: 'Invalid User ID', errors } };
  }
  const user = await User.findById(id).select('-password');
  if (!user) {
    return { user: null, error: { message: 'User not found' } };
  }
  return { user, error: null };
}

export const GET = protect(async (request, { params }) => {
  const { id } = params;
  const { user, error } = await getUser(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }
  return NextResponse.json(user);
});

export const PATCH = protect(async (request, { params }) => {
  const { id } = params;
  const { user, error } = await getUser(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }

  // Check if the user is authorized to update this user
  if (request.user.role !== 'admin' && id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to update this user' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const errors = validateUserUpdate(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    if (body.username != null) user.username = body.username;
    if (body.email != null) user.email = body.email;
    if (body.password != null) user.password = body.password; // Password will be hashed by pre-save hook
    if (body.favorites != null) user.favorites = body.favorites;
    if (body.readingList != null) user.readingList = body.readingList;

    const updatedUser = await user.save();
    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
});

export const DELETE = protect(async (request, { params }) => {
  const { id } = params;
  const { user, error } = await getUser(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }

  // Check if the user is authorized to delete this user
  if (request.user.role !== 'admin' && id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to delete this user' }, { status: 403 });
  }

  try {
    await User.deleteOne({ _id: id });
    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});
