import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { protect } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';

export const PATCH = protect(async (request, { params }) => {
  const { id } = params;

  const idErrors = validateMongoId(id);
  if (Object.keys(idErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid User ID', errors: idErrors }, { status: 400 });
  }

  // Check if the user is authorized to update this user's profile picture
  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to update this user' }, { status: 403 });
  }

  await dbConnect();
  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { profilePicture: profilePictureUrl } = await request.json();

    if (profilePictureUrl) {
      user.profilePicture = profilePictureUrl;
    } else {
      // If profilePictureUrl is null or empty string, it means user wants to clear it or no new picture provided
      // For now, we'll treat null/empty as no picture provided, but could be extended to clear
      return NextResponse.json({ message: 'No profile picture provided' }, { status: 400 });
    }

    const updatedUser = await user.save();
    return NextResponse.json({ profilePicture: updatedUser.profilePicture });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
});