require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function revertCoverUrlFix() {
  console.log('Starting script to revert book cover URL changes...');

  try {
    // 1. Fetch all books from the database
    console.log('Fetching all books...');
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, cover');

    if (fetchError) {
      console.error('Error fetching books:', fetchError.message);
      return;
    }

    console.log(`Found ${books.length} total books.`);

    // 2. Identify books with the "fixed" URL structure that needs to be reverted
    const booksToRevert = books.filter(book => 
      book.cover && !book.cover.includes('book-covers/book-covers/') && book.cover.includes('book-covers/')
    );

    if (booksToRevert.length === 0) {
      console.log('No books with fixed cover URLs found to revert. Database may already be in the original state.');
      return;
    }

    console.log(`Found ${booksToRevert.length} books to revert.`);

    // 3. Update each record with the original (incorrect) URL
    for (const book of booksToRevert) {
      const revertedUrl = book.cover.replace('book-covers/', 'book-covers/book-covers/');
      console.log(`Reverting book ID: ${book.id}...`);
      console.log(`  Current URL: ${book.cover}`);
      console.log(`  Reverted URL: ${revertedUrl}`);

      const { error: updateError } = await supabase
        .from('books')
        .update({ cover: revertedUrl })
        .eq('id', book.id);

      if (updateError) {
        console.error(`  Failed to revert book ID ${book.id}:`, updateError.message);
      } else {
        console.log(`  Successfully reverted book ID: ${book.id}`);
      }
    }

    console.log('\nScript finished. All affected URLs have been reverted.');

  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  }
}

revertCoverUrlFix();
