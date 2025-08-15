import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
// import { validateUserUpdate } from '@/lib/validation'; // This can be re-enabled if needed

// GET handler to fetch a user's public profile
export const GET = protect(async (request, { params }) => {
  const { id } = params;
  const supabase = createClient();

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
  const { id } = params;
  const body = await request.json();
  const supabase = createClient();

  // The 'protect' middleware ensures we have a user.
  // Now, check for authorization: user can only update themselves, unless they are an admin.
  const { data: { user: requestingUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestingUser.id).single();

  if (profile?.role !== 'admin' && requestingUser.id !== id) {
    return NextResponse.json({ message: 'غير مصرح لك بتحديث هذا المستخدم' }, { status: 403 });
  }

  const { password, username, ...otherProfileData } = body;

  // --- Step 1: Update Auth Data (Password, etc.) ---
  if (password) {
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      console.error('Supabase auth update error:', authError);
      return NextResponse.json({ message: 'فشل تحديث كلمة المرور', error: authError.message }, { status: 400 });
    }
  }
  
  // --- Step 2: Update Auth Metadata (Username) ---
  if (username) {
      const { error: authMetaError } = await supabase.auth.updateUser({ data: { username } });
      if (authMetaError) {
          console.error('Supabase auth metadata update error:', authMetaError);
          // Not returning here, as the profile update might still be important
      }
  }

  // --- Step 3: Update Public Profile Data ---
  const profileDataToUpdate = { username, ...otherProfileData };
  // Ensure we don't try to update the object with empty values if only password was changed
  if (Object.keys(profileDataToUpdate).length > 0) {
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(profileDataToUpdate)
      .eq('id', id)
      .select('id, username, email, role')
      .single();

    if (profileError) {
      console.error('Supabase profile update error:', profileError);
      return NextResponse.json({ message: 'فشل تحديث الملف الشخصي', error: profileError.message }, { status: 400 });
    }
    return NextResponse.json(updatedProfile);
  }

  // If only password was updated, just return a success message
  return NextResponse.json({ message: 'تم تحديث بيانات المستخدم بنجاح' });
});

// DELETE handler to remove a user completely
export const DELETE = protect(admin(async (request, { params }) => {
  const { id } = params;
  
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