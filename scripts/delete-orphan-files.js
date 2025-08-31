// scripts/delete-orphan-files.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

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

function getPathFromUrl(publicUrl, bucketName) {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
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

async function deleteOrphanFiles() {
  console.log("Starting to find orphan files for deletion...");

  try {
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('cover, pdfFile');

    if (booksError) throw new Error(`Error fetching books: ${booksError.message}`);

    const usedFilePaths = new Set();
    for (const book of books) {
      const coverPath = getPathFromUrl(book.cover, 'book-covers');
      const pdfPath = getPathFromUrl(book.pdfFile, 'book-pdfs');
      if (coverPath) usedFilePaths.add(coverPath);
      if (pdfPath) usedFilePaths.add(pdfPath);
    }

    const orphanFiles = [];
    const bucketsToScan = ['book-covers', 'book-pdfs'];

    for (const bucketName of bucketsToScan) {
      const { data: filesInBucket, error: listError } = await supabase
        .storage
        .from(bucketName)
        .list(bucketName);

      if (listError) throw new Error(`Error listing files in ${bucketName}/${bucketName}: ${listError.message}`);
      if (!filesInBucket) continue;

      for (const file of filesInBucket) {
        const fullPath = `${bucketName}/${file.name}`;
        if (file.id && !usedFilePaths.has(fullPath)) {
          orphanFiles.push({ bucket: bucketName, path: fullPath });
        }
      }
    }

    console.log("\n--- Scan Complete ---");
    const filesToDelete = orphanFiles.filter(
      file => !file.path.endsWith('.emptyFolderPlaceholder')
    );

    if (filesToDelete.length > 0) {
      console.log(`Found ${filesToDelete.length} orphan files to delete:`);
      filesToDelete.forEach(file => {
        console.log(`- Bucket: ${file.bucket}, Path: ${file.path}`);
      });

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      rl.question('\nAre you sure you want to permanently delete these files? (Type "yes" to confirm): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          console.log('\nStarting deletion...');
          
          const pathsByBucket = {};
          filesToDelete.forEach(file => {
            if (!pathsByBucket[file.bucket]) pathsByBucket[file.bucket] = [];
            pathsByBucket[file.bucket].push(file.path);
          });

          for (const bucket in pathsByBucket) {
            const paths = pathsByBucket[bucket];
            const { data, error } = await supabase.storage.from(bucket).remove(paths);
            if (error) {
              console.error(`Error deleting files from bucket ${bucket}:`, error.message);
            } else {
              console.log(`Successfully deleted ${data.length} files from bucket ${bucket}.`);
            }
          }
        } else {
          console.log('\nDeletion cancelled.');
        }
        rl.close();
      });
    } else {
      console.log("No orphan files found. Your storage is clean!");
    }

  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

deleteOrphanFiles();
