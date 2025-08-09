import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { protect, admin } from '@/lib/middleware';
import { validateUserUpdate, validateMongoId } from '@/lib/validation';

async function getUser(id, includePassword = false) {
  await dbConnect();
  const errors = validateMongoId(id);
  if (Object.keys(errors).length > 0) {
    return { user: null, error: { message: 'Invalid User ID', errors } };
  }
  let query = User.findById(id);
  if (!includePassword) {
    query = query.select('-password');
  }
  const user = await query;
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
  const body = await request.json();

  // Fetch user with password if password is being updated
  const { user, error } = await getUser(id, body.password != null);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }

  // Check if the user is authorized to update this user
  if (request.user.role !== 'admin' && id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to update this user' }, { status: 403 });
  }

  try {
    const errors = validateUserUpdate(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    if (body.password != null) {
      if (!body.oldPassword) {
        return NextResponse.json({ message: 'Old password is required to change password.' }, { status: 400 });
      }
      if (!(await user.matchPassword(body.oldPassword))) {
        return NextResponse.json({ message: 'Old password is incorrect.' }, { status: 400 });
      }
      user.password = body.password; // Password will be hashed by pre-save hook
    }

    if (body.username != null) user.username = body.username;
    if (body.email != null) user.email = body.email;
    if (body.favorites != null) user.favorites = body.favorites;
    if (body.readingList != null) user.readingList = body.readingList;

    const updatedUser = await user.save();
    // Return user without password
    const userWithoutPassword = updatedUser.toObject();
    delete userWithoutPassword.password;
    return NextResponse.json(userWithoutPassword);
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
