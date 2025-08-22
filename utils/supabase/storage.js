// A centralized and robust function for uploading files to Supabase Storage.
// It now accepts an authenticated Supabase client instance.
export async function uploadFile(supabase, bucketName, file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
  if (!file || file.size === 0) {
    throw new Error('No file provided or file is empty.');
  }

  // 1. Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`);
  }

  // 2. Sanitize and create a unique filename
  const fileExt = file.name.split('.').pop();
  const sanitizedBaseName = file.name
    .substring(0, file.name.length - fileExt.length - 1)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_\.]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
    
  const fileName = `${sanitizedBaseName}-${Date.now()}.${fileExt}`;

  // 3. Upload the file using the provided Supabase client
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      upsert: false, // It's a new unique name, no need for upsert
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error(`Failed to upload file to Supabase Storage: ${uploadError.message}`);
  }

  // 4. Get the public URL of the uploaded file
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    console.error('Failed to get public URL for:', fileName);
    throw new Error('File uploaded but failed to get public URL.');
  }

  // 5. Return the full public URL with a cache-busting timestamp
  return `${urlData.publicUrl}?t=${Date.now()}`;
}