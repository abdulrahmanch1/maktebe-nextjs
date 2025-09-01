require('dotenv').config({ path: '.env.local' });
const { createAdminClient } = require('../utils/supabase/admin');

const fixBookCoverUrls = async () => {
  console.log('Starting script to fix book cover URLs...');
  const supabase = createAdminClient();

  // Fetch all books
  const { data: books, error: fetchError } = await supabase
    .from('books')
    .select('id, cover');

  if (fetchError) {
    console.error('Error fetching books:', fetchError.message);
    return;
  }

  if (!books || books.length === 0) {
    console.log('No books found.');
    return;
  }

  console.log(`Found ${books.length} books. Checking for incorrect URLs...`);

  const updates = [];
  const incorrectUrlPattern = '/book-covers/book-covers/';

  for (const book of books) {
    if (book.cover && typeof book.cover === 'string' && book.cover.includes(incorrectUrlPattern)) {
      const newUrl = book.cover.replace(incorrectUrlPattern, '/book-covers/');
      updates.push(
        supabase
          .from('books')
          .update({ cover: newUrl })
          .eq('id', book.id)
      );
      console.log(`- Preparing update for book ID ${book.id}:`);
      console.log(`  Old URL: ${book.cover}`);
      console.log(`  New URL: ${newUrl}`);
    }
  }

  if (updates.length === 0) {
    console.log('No incorrect URLs found that need fixing.');
    return;
  }

  console.log(`
Found ${updates.length} books to update. Executing updates...`);

  // Execute all updates in parallel
  const results = await Promise.all(updates);

  let successCount = 0;
  results.forEach((result, index) => {
    if (result.error) {
      console.error(`Failed to update book ID ${books[index].id}:`, result.error.message);
    } else {
      successCount++;
    }
  });

  console.log(`
Script finished.`);
  console.log(`Successfully updated ${successCount} out of ${updates.length} books.`);
};

fixBookCoverUrls().catch(console.error);
