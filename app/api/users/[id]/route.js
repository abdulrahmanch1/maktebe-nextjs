import { NextResponse } from 'next/server';
import { protect, admin, getUserFromRequest } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
// import { validateUserUpdate } from '@/lib/validation'; // This can be re-enabled if needed

// GET handler to fetch a user's public profile
export const GET = protect(async (request, { params }) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, email, role') // Select only public-safe fields
    .eq('id', id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ message: 'لم يتم العثور على المستخدم' }, { status: 404 });
  }

  return NextResponse.json(profile);
});

// PATCH handler to update a user's profile or auth info
export const PATCH = protect(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();

  // The 'protect' middleware ensures we have a user.
  // Now, check for authorization: user can only update themselves.
  const requestingUser = getUserFromRequest(request);

  if (!requestingUser || requestingUser.id !== id) {
    return NextResponse.json({ message: 'غير مصرح لك' }, { status: 403 });
  }

  const {
    username,
    oldPassword,
    newPassword,
    password: passwordAlias,
    ...otherProfileData
  } = body;

  const nextPassword = newPassword ?? passwordAlias;

  // --- Case 1: Update Password ---
  if (nextPassword) {
    if (!oldPassword) {
      return NextResponse.json({ message: 'كلمة المرور القديمة مطلوبة لتغييرها' }, { status: 400 });
    }

    // Step 1: Verify the user's old password by trying to sign in with it.
    // We need the user's email for this.
    const { email } = requestingUser;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });

    if (signInError) {
      return NextResponse.json({ message: 'كلمة المرور القديمة غير صحيحة' }, { status: 401 });
    }

    // Step 2: If the old password was correct, update to the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });

    if (updateError) {
      console.error('Supabase password update error:', updateError);
      return NextResponse.json({ message: 'فشل تحديث كلمة المرور', error: updateError.message }, { status: 500 });
    }
  }

  // --- Case 2: Update Profile Data (e.g., username) ---
  const profileDataToUpdate = { ...otherProfileData };
  if (username) {
    profileDataToUpdate.username = username;
  }

  if (Object.keys(profileDataToUpdate).length > 0) {
    // Also update the user's metadata in auth.users if username changes
    if (username) {
      const { error: authMetaError } = await supabase.auth.updateUser({ data: { username } });
      if (authMetaError) {
        console.error('Supabase auth metadata update error:', authMetaError);
        // We can choose to continue or return an error. Let's continue but log it.
      }
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(profileDataToUpdate)
      .eq('id', id)
      .select('id, username, email, role')
      .single();

    if (profileError) {
      console.error('Supabase profile update error:', profileError);
      return NextResponse.json({ message: 'فشل تحديث الملف الشخصي', error: profileError.message }, { status: 500 });
    }

    return NextResponse.json(updatedProfile);
  }

  // If only password was updated and was successful, return a success message.
  if (nextPassword) {
    return NextResponse.json({ message: 'تم تحديث كلمة المرور بنجاح' });
  }

  return NextResponse.json({ message: 'لا توجد بيانات للتحديث' }, { status: 400 });
});

// DELETE handler to remove a user completely
export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = await params;

  // For deletion, we need the admin client with the service role key
  const supabaseAdmin = createAdminClient();

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (deleteError) {
    console.error('Supabase admin delete error:', deleteError);
    return NextResponse.json({ message: 'فشل حذف المستخدم', error: deleteError.message }, { status: 500 });
  }

  // Note: It's best practice to set up a trigger in your Supabase database
  // to automatically delete the user's profile from the 'profiles' table
  // when the user is deleted from 'auth.users'.
  // Example: CREATE TRIGGER on_auth_user_deleted AFTER DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_delete_user();
  // Where handle_delete_user is a function that runs: DELETE FROM public.profiles WHERE id = old.id;

  return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
}));
