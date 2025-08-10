import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateMongoId } from '@/lib/validation';
import { supabase } from '@/lib/supabase'; // Import supabase client

export const PATCH = protect(async (request, { params }) => {
  const { id } = params;
  const { profilePictureUrl } = await request.json();

  const idErrors = validateMongoId(id);
  if (Object.keys(idErrors).length > 0) {
    return NextResponse.json({ message: 'Invalid User ID', errors: idErrors }, { status: 400 });
  }

  // Check if the user is authorized to update this user's profile picture
  if (id !== request.user._id.toString()) {
    return NextResponse.json({ message: 'Not authorized to update this user' }, { status: 403 });
  }

  try {
    // Update the user's profile picture in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ profilePicture: profilePictureUrl || '/imgs/user.jpg' }) // Set to default if null/empty
      .eq('id', id)
      .select('profilePicture') // Select only the updated field
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ profilePicture: updatedUser.profilePicture });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});