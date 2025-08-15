import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const POST = async (request) => {
  const supabase = createClient();

  console.log('--- Starting profile picture upload process ---');

  // 1. Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error getting user:', userError);
    return NextResponse.json({ error: 'Authentication error.' }, { status: 401 });
  }
  if (!user) {
    console.log('No authenticated user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('User authenticated:', user.id);

  // 2. Parse the file from the FormData
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    console.log('No file provided in formData.');
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  console.log('File received:', file.name, 'Type:', file.type);

  // Basic validation (can be expanded)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.log('Invalid file type:', file.type);
    return NextResponse.json({ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }, { status: 400 });
  }

  // 3. Upload the file to Supabase Storage. We use the user-impersonated client
  // so that the file is correctly owned by the user, which satisfies RLS policies.
  const filePath = `${user.id}/profile.png`; // Use a consistent name to overwrite the old picture
  console.log('Attempting to upload file to:', filePath);

  const { error: uploadError } = await supabase.storage
    .from('profile-pictures') // The new bucket
    .upload(filePath, file, {
      upsert: true, // This will overwrite the file if it already exists
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
  console.log('File uploaded successfully.');

  // 4. Get the public URL of the uploaded file
  const supabaseAdmin = createAdminClient(); // Use admin for subsequent steps for simplicity
  console.log('Attempting to get public URL for:', filePath);
  const { data: urlData, error: getUrlError } = supabaseAdmin.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);

  if (getUrlError) {
    console.error('Supabase getPublicUrl error:', getUrlError);
    return NextResponse.json({ error: 'Failed to get public URL.' }, { status: 500 });
  }
  if (!urlData || !urlData.publicUrl) {
    console.error('Public URL data or publicUrl is missing.');
    return NextResponse.json({ error: 'Failed to get public URL.' }, { status: 500 });
  }

  const publicUrl = urlData.publicUrl;
  console.log('Public URL obtained:', publicUrl);

  // 5. Update the user's profile with the new URL
  console.log('Attempting to update user profile with new URL.');
  const { error: profileUpdateError } = await supabaseAdmin
    .from('profiles')
    .update({ profilepicture: publicUrl }) // Corrected column name to all lowercase
    .eq('id', user.id);

  if (profileUpdateError) {
    console.error('Profile update error:', profileUpdateError);
    return NextResponse.json({ error: 'Failed to update profile with new picture.' }, { status: 500 });
  }
  console.log('User profile updated successfully.');

  // 6. Return a success response
  console.log('--- Profile picture upload process completed successfully ---');
  return NextResponse.json({
    message: 'Profile picture updated successfully',
    newUrl: publicUrl,
  });
};