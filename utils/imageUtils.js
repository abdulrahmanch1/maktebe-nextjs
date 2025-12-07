/**
 * Constructs a Supabase Storage URL for a given path or ID.
 * 
 * @param {string} pathOrUrl - The file path, ID, or full URL.
 * @param {string} bucketName - The name of the Supabase Storage bucket (e.g., 'author-images', 'book-covers').
 * @returns {string} The full URL to the image.
 */
export const getStorageUrl = (pathOrUrl, bucketName) => {
    if (!pathOrUrl) return null;

    // If it's already a full URL (http/https), return it as is
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
        return pathOrUrl;
    }

    // If it's a local path (starts with /), return it as is
    if (pathOrUrl.startsWith('/')) {
        return pathOrUrl;
    }

    // Otherwise, construct the Supabase Storage URL
    // Pattern: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Ensure no double slashes if pathOrUrl starts with / (though we handled local paths above, just in case of mixed usage)
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;

    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
};
