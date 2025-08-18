import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { protect, admin } from '@/lib/middleware';

export const POST = protect(admin(async (request) => {
  const supabase = createClient();

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

  // 2. Parse the file from the FormData
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    console.log('No file provided in formData.');
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Basic validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.log('Invalid file type:', file.type);
    return NextResponse.json({ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }, { status: 400 });
  }

  // 3. Upload the file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `book-covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('book-covers') // Assuming a 'book-covers' bucket
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }

  // 4. Get the public URL of the uploaded file
  const supabaseAdmin = createAdminClient();
  const { data: urlData, error: getUrlError } = supabaseAdmin.storage
    .from('book-covers')
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

  // Append a cache-busting timestamp to the public URL
  const publicUrlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

  // 5. Return a success response
  return NextResponse.json({
    message: 'Cover uploaded successfully',
    newUrl: publicUrlWithCacheBuster,
  });
}));
