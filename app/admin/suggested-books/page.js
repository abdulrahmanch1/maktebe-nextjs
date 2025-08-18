import { createClient } from '@/utils/supabase/server';
import BookCard from '@/components/BookCard';
import './SuggestedBooksPage.css';

export const metadata = {
  title: 'الكتب المقترحة - لوحة التحكم',
  description: 'إدارة الكتب المقترحة من قبل المستخدمين.',
};

// Re-fetch data on every request to ensure it's up-to-date
export const revalidate = 0;

async function getSuggestedBooks() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'suggested')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching suggested books:', error);
    // Return an empty array or a specific error object to be handled by the component
    return []; 
  }
  return data;
}

const SuggestedBooksPage = async () => {
  const suggestedBooks = await getSuggestedBooks();

  return (
    <div className="suggested-books-page">
      <h1 className="page-title">الكتب المقترحة</h1>
      {suggestedBooks.length > 0 ? (
        <div className="books-grid">
          {suggestedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <p className="no-books-message">لا يوجد كتب مقترحة حالياً.</p>
      )}
    </div>
  );
};

export default SuggestedBooksPage;
