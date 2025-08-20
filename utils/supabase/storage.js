import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function uploadFile(supabase, bucketName, filePath, file) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { upsert: true });

  if (error) {
    throw new Error(`Failed to upload file to ${bucketName}: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
