require('dotenv').config({ path: '.env.local' });
const { createAdminClient } = require('../utils/supabase/admin');

const removeCoverQueryParams = async () => {
  console.log('Starting script to remove query parameters from book cover URLs...');
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

  console.log(`Found ${books.length} books. Checking for query parameters...`);

  const updates = [];

  for (const book of books) {
    if (book.cover && typeof book.cover === 'string') {
      const url = new URL(book.cover);
      if (url.search) { // Check if there are any query parameters
        url.search = ''; // Remove all query parameters
        const newUrl = url.toString();
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
  }

  if (updates.length === 0) {
    console.log('No URLs found with query parameters that need removing.');
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

removeCoverQueryParams().catch(console.error);
