import BookDetailsClient from "./BookDetailsClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getBookData(id) {
  const supabase = await createClient();

  // Fetch book, comments, and related books concurrently for better performance
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, profiles(username, email)')
    .eq('id', id)
    .single();

  if (bookError || !book) {
    console.error('Error fetching book:', bookError);
    return { book: null, comments: [], relatedBooks: [] };
  }

  // Fetch comments and related books in parallel after getting the main book's category
  const [commentsResult, relatedBooksResult] = await Promise.all([
    supabase
      .from('comments')
      .select('*, profiles(username, email, profilepicture)')
      .eq('book_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('books')
      .select('id, title, author, cover, category') // Select only necessary fields for cards
      .eq('category', book.category)
      .eq('status', 'approved')
      .neq('id', book.id)
      .limit(5)
  ]);

  const { data: comments, error: commentsError } = commentsResult;
  const { data: relatedBooks, error: relatedBooksError } = relatedBooksResult;

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }
  if (relatedBooksError) {
    console.error('Error fetching related books:', relatedBooksError);
  }

  return {
    book,
    comments: comments || [],
    relatedBooks: relatedBooks || [],
  };
}

export async function generateMetadata(props) {
  const params = await props.params;
  const { book } = await getBookData(params.id);

  if (!book) {
    return {
      title: 'مكتبة الكتب | كتاب غير موجود',
      description: 'الكتاب الذي تبحث عنه غير موجود.',
    };
  }

  const metadata = {
    title: `مكتبة الكتب | ${book.title} - ${book.author}`,
    description: book.description,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    bookFormat: 'http://schema.org/EBook',
    inLanguage: book.language,
    numberOfPages: book.pages,
    description: book.description,
    image: book.cover,
    url: `https://www.dar-alqurra.com/book/${params.id}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5', // Placeholder
      reviewCount: book.comments ? book.comments.length : 0,
    },
  };

  return {
    ...metadata,
    alternates: {
      canonical: `/book/${params.id}`,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      images: [book.cover],
      url: `https://www.dar-alqurra.com/book/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [book.cover],
    },
    other: {
      'application/ld+json': JSON.stringify(jsonLd),
    },
  };
}

const BookDetailsPage = async (props) => {
  const params = await props.params;
  const { book, comments, relatedBooks } = await getBookData(params.id);

  if (!book) {
    notFound();
  }

  // Combine all data into a single object for the client component
  const bookDetails = { ...book, comments, relatedBooks };

  return <BookDetailsClient initialBook={bookDetails} />;
};

export default BookDetailsPage;
