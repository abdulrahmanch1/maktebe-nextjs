
// scripts/find-orphan-files.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.");
  process.exit(1);
}

// Create a Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Extracts the file path from a full Supabase public URL.
 * E.g., "https://.../book-covers/some-file.jpg?t=123" -> "some-file.jpg"
 * @param {string} publicUrl - The full public URL of the file.
 * @param {string} bucketName - The name of the storage bucket.
 * @returns {string|null} The file path or null if parsing fails.
 */
function getPathFromUrl(publicUrl, bucketName) {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // The path in the URL is like /storage/v1/object/public/bucket-name/file-name.ext
    const parts = url.pathname.split(`/${bucketName}/`);
    if (parts.length > 1) {
      return parts[1];
    }
    return null;
  } catch (e) {
    console.warn(`Invalid URL provided: ${publicUrl}`);
    return null;
  }
}


async function findOrphanFiles() {
  console.log("Starting to find orphan files...");

  try {
    // 1. Fetch all book records from the database
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('cover, pdfFile');

    if (booksError) {
      throw new Error(`Error fetching books: ${booksError.message}`);
    }

    console.log(`Found ${books.length} book records in the database.`);

    // 2. Create a set of all currently used file paths
    const usedFilePaths = new Set();
    for (const book of books) {
      const coverPath = getPathFromUrl(book.cover, 'book-covers');
      const pdfPath = getPathFromUrl(book.pdfFile, 'book-pdfs');
      if (coverPath) usedFilePaths.add(coverPath);
      if (pdfPath) usedFilePaths.add(pdfPath);
    }
    console.log(`Found ${usedFilePaths.size} unique file paths in use.`);

    const orphanFiles = [];
    const bucketsToScan = ['book-covers', 'book-pdfs'];

    for (const bucketName of bucketsToScan) {
      console.log(`
Scanning folder "${bucketName}" inside bucket "${bucketName}"...`);
      
      // List all files inside the folder that has the same name as the bucket
      const { data: filesInBucket, error: listError } = await supabase
        .storage
        .from(bucketName)
        .list(bucketName); // <-- The fix is here: specify the folder path

      if (listError) {
        throw new Error(`Error listing files in ${bucketName}/${bucketName}: ${listError.message}`);
      }
      
      if (!filesInBucket || filesInBucket.length === 0) {
        console.log(`Folder "${bucketName}" is empty or could not be read.`);
        continue;
      }

      console.log(`Found ${filesInBucket.length} files in folder "${bucketName}".`);

      // Compare files in bucket with used files
      for (const file of filesInBucket) {
        // Reconstruct the full path as it would be stored in the database URL
        const fullPath = `${bucketName}/${file.name}`; 
        if (file.id && !usedFilePaths.has(fullPath)) { // Check file.id to ignore folders
          orphanFiles.push({ bucket: bucketName, path: fullPath });
        }
      }
    }

    // 5. Report the results
    console.log("\n--- Scan Complete ---");
    if (orphanFiles.length > 0) {
      console.log(`Found ${orphanFiles.length} orphan files that can be deleted:`);
      orphanFiles.forEach(file => {
        console.log(`- Bucket: ${file.bucket}, Path: ${file.path}`);
      });
      console.log("\nThis script is read-only. No files have been deleted.");
      console.log("To delete these files, you can run a delete script or remove them manually from the Supabase dashboard.");
    } else {
      console.log("No orphan files found. Your storage is clean!");
    }

  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

findOrphanFiles();
