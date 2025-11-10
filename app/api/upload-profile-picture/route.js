import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadFile } from '@/utils/supabase/storage';
import { createAdminClient } from '@/utils/supabase/admin';

export const POST = async (request) => {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  try {
    // 1. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the file from the FormData
    const formData = await request.formData();
    const file = formData.get('file');

    // 3. Upload the file using the centralized helper
    const newUrl = await uploadFile(supabaseAdmin, 'profile-pictures', file, ['image/jpeg', 'image/png', 'image/webp']);

    // 4. Update the user's profile with the new URL
    // Use the admin client to update the profile table
    
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ profilepicture: newUrl })
      .eq('id', user.id);

    if (profileUpdateError) {
      // If this fails, we should ideally try to delete the just-uploaded file to prevent orphans.
      console.error('Profile update error:', profileUpdateError);
      const fileName = newUrl.split('/').pop().split('?')[0];
      await supabaseAdmin.storage.from('profile-pictures').remove([fileName]);
      return NextResponse.json({ error: 'Failed to update profile with new picture.' }, { status: 500 });
    }

    // 5. Return a success response
    return NextResponse.json({
      message: 'Profile picture updated successfully',
      newUrl: newUrl,
    });

  } catch (error) {
    console.error('Profile picture upload process error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};