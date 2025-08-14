import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { validateUserUpdate } from '@/lib/validation'; // Removed validateMongoId
import { supabase } from '@/lib/supabase'; // Import supabase client
import bcrypt from 'bcryptjs'; // For password hashing/comparison

async function getUser(id, includePassword = false) {
  // Removed validateMongoId call
  if (!id) { // Simple ID validation for Supabase (assuming UUID or integer)
    return { user: null, error: { message: 'معرف المستخدم مطلوب' } };
  }

  let query = supabase.from('users').select(includePassword ? '*' : 'id,username,email,favorites,readingList,role');
  query = query.eq('id', id).single();

  const { data: user, error: userError } = await query;

  if (userError || !user) {
    return { user: null, error: { message: 'لم يتم العثور على المستخدم' } };
  }
  return { user, error: null };
}

export const GET = protect(async (request, { params }) => {
  const { id } = params;
  const { user, error } = await getUser(id);

  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }

  // Remove password before sending response
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  return NextResponse.json(userWithoutPassword);
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
  if (request.user.role !== 'admin' && id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to update this user' }, { status: 403 });
  }

  try {
    const errors = validateUserUpdate(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    let hashedPassword = user.password;
    if (body.password != null) {
      if (!body.oldPassword) {
        return NextResponse.json({ message: 'Old password is required to change password.' }, { status: 400 });
      }
      // Compare old password
      const isMatch = await bcrypt.compare(body.oldPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ message: 'Old password is incorrect.' }, { status: 400 });
      }
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }

    const userDataToUpdate = {
      username: body.username ?? user.username,
      email: body.email ?? user.email,
      password: hashedPassword,
      favorites: body.favorites ?? user.favorites,
      readingList: body.readingList ?? user.readingList,
    };

    // Filter out undefined values to only update provided fields
    Object.keys(userDataToUpdate).forEach(key => {
      if (userDataToUpdate[key] === undefined) {
        delete userDataToUpdate[key];
      }
    });

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(userDataToUpdate)
      .eq('id', id)
      .select('*, password') // Select password to hash it if needed
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Update username in Supabase Auth user_metadata if it was changed
    if (body.username != null && body.username !== user.username) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { username: body.username },
      });
      if (authUpdateError) {
        console.error('Error updating user_metadata in Supabase Auth:', authUpdateError.message);
        // Decide how to handle this error: rollback, log, or ignore
      }
    }

    // Return user without password
    const userWithoutPassword = { ...updatedUser };
    delete userWithoutPassword.password;
    return NextResponse.json(userWithoutPassword);
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
});

export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = params;
  const { user, error } = await getUser(id);
  if (error) {
    return NextResponse.json(error, { status: error.message === 'User not found' ? 404 : 400 });
  }

  // Check if the user is authorized to delete this user
  if (request.user.role !== 'admin' && id !== request.user.id) {
    return NextResponse.json({ message: 'Not authorized to delete this user' }, { status: 403 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ message: "خطأ في حذف المستخدم" }, { status: 500 });
  }
}));