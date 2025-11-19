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

async function fixCoverUrls() {
  console.log('Starting script to fix book cover URLs...');

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

    // 2. Identify books with the incorrect URL structure
    const booksToUpdate = books.filter(book => 
      book.cover && book.cover.includes('book-covers/book-covers/')
    );

    if (booksToUpdate.length === 0) {
      console.log('No books with incorrect cover URLs found. Database is clean!');
      return;
    }

    console.log(`Found ${booksToUpdate.length} books to update.`);

    // 3. Update each record with the corrected URL
    for (const book of booksToUpdate) {
      const correctedUrl = book.cover.replace('book-covers/book-covers/', 'book-covers/');
      console.log(`Updating book ID: ${book.id}...`);
      console.log(`  Old URL: ${book.cover}`);
      console.log(`  New URL: ${correctedUrl}`);

      const { error: updateError } = await supabase
        .from('books')
        .update({ cover: correctedUrl })
        .eq('id', book.id);

      if (updateError) {
        console.error(`  Failed to update book ID ${book.id}:`, updateError.message);
      } else {
        console.log(`  Successfully updated book ID: ${book.id}`);
      }
    }

    console.log('\nScript finished. All incorrect URLs have been processed.');

  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  }
}

fixCoverUrls();
