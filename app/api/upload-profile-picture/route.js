import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const POST = async (request) => {
  const supabase = createClient();

  // 1. Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse the file from the FormData
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Basic validation (can be expanded)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }, { status: 400 });
  }

  // 3. Upload the file to Supabase Storage. We use the user-impersonated client
  // so that the file is correctly owned by the user, which satisfies RLS policies.
  const filePath = `${user.id}/profile.png`; // Use a consistent name to overwrite the old picture

  const { error: uploadError } = await supabase.storage
    .from('profile-pictures') // The new bucket
    .upload(filePath, file, {
      upsert: true, // This will overwrite the file if it already exists
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }

  // 4. Get the public URL of the uploaded file
  const supabaseAdmin = createAdminClient(); // Use admin for subsequent steps for simplicity
  const { data: urlData } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    return NextResponse.json({ error: 'Failed to get public URL.' }, { status: 500 });
  }

  const publicUrl = urlData.publicUrl;

  // 5. Update the user's profile with the new URL
  const { error: profileUpdateError } = await supabaseAdmin
    .from('profiles')
    .update({ profilepicture: publicUrl }) // Corrected column name to all lowercase
    .eq('id', user.id);

  if (profileUpdateError) {
    console.error('Profile update error:', profileUpdateError);
    return NextResponse.json({ error: 'Failed to update profile with new picture.' }, { status: 500 });
  }

  // 6. Return a success response
  return NextResponse.json({
    message: 'Profile picture updated successfully',
    newUrl: publicUrl,
  });
};
