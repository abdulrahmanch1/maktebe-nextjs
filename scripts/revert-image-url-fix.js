require('dotenv').config({ path: '.env.local' });
const { createAdminClient } = require('../utils/supabase/admin');

const revertUrlFix = async () => {
  console.log('Starting script to revert book cover URLs...');
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

  console.log(`Found ${books.length} books. Checking for URLs to revert...`);

  const updates = [];
  const correctUrlPattern = '/book-covers/book-covers/';
  const incorrectUrlPattern = '/book-covers/';

  for (const book of books) {
    // Revert only if the URL is "fixed" and doesn't have the duplication
    if (book.cover && typeof book.cover === 'string' && !book.cover.includes(correctUrlPattern)) {
      // Check if the URL is a Supabase storage URL before modifying
      if (book.cover.includes('jldyyfkashoisxxyfhmb.supabase.co')) {
        const newUrl = book.cover.replace(incorrectUrlPattern, correctUrlPattern);
        updates.push(
          supabase
            .from('books')
            .update({ cover: newUrl })
            .eq('id', book.id)
        );
        console.log(`- Preparing revert for book ID ${book.id}:`);
        console.log(`  Old (incorrect) URL: ${book.cover}`);
        console.log(`  New (correct) URL: ${newUrl}`);
      }
    }
  }

  if (updates.length === 0) {
    console.log('No URLs found that need reverting.');
    return;
  }

  console.log(`
Found ${updates.length} books to revert. Executing updates...`);

  // Execute all updates in parallel
  const results = await Promise.all(updates);

  let successCount = 0;
  results.forEach((result, index) => {
    if (result.error) {
      console.error(`Failed to revert book ID ${books[index].id}:`, result.error.message);
    } else {
      successCount++;
    }
  });

  console.log(`
Script finished.`);
  console.log(`Successfully reverted ${successCount} out of ${updates.length} books.`);
};

revertUrlFix().catch(console.error);
