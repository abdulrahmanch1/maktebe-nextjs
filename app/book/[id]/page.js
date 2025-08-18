import BookDetailsClient from "./BookDetailsClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';

async function getBookAndComments(id) {
  const supabase = createClient();

  const [bookResult, commentsResult] = await Promise.all([
    supabase.from('books').select('*').eq('id', id).single(),
    supabase.from('comments').select('*, profiles(username, profilepicture)').eq('book_id', id).order('created_at', { ascending: false })
  ]);

  const { data: book, error: bookError } = bookResult;
  const { data: comments, error: commentsError } = commentsResult;

  if (bookError || !book) {
    console.error('Error fetching book:', bookError);
    return null;
  }

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
    // Still return the book even if comments fail
    return { ...book, comments: [] };
  }

  return { ...book, comments };
}

export async function generateMetadata({ params }) {
  const book = await getBookAndComments(params.id);

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
    url: `https://maktebe.vercel.app/book/${params.id}`,
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
    },
    other: {
      'application/ld+json': JSON.stringify(jsonLd),
    },
  };
}

const BookDetailsPage = async ({ params }) => {
  const book = await getBookAndComments(params.id);

  if (!book) {
    notFound();
  }

  return <BookDetailsClient initialBook={book} />;
};

export default BookDetailsPage;
