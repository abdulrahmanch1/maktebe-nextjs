import axios from "axios";
import { API_URL } from "@/constants";
import BookDetailsClient from "./BookDetailsClient";

// Server-side function to generate metadata
export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const { data: book } = await axios.get(`${API_URL}/api/books/${id}`);
    
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
      url: `https://maktebe.vercel.app/book/${id}`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5', // Placeholder
        reviewCount: book.comments ? book.comments.length : 0,
      },
    };

    return {
      ...metadata,
      alternates: {
        canonical: `/book/${id}`,
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
  } catch (error) {
    return {
      title: 'مكتبة الكتب | كتاب غير موجود',
      description: 'الكتاب الذي تبحث عنه غير موجود.',
    };
  }
}

// The main page component (Server Component)
const BookDetailsPage = ({ params }) => {
  // The client component will handle all the state and interactivity.
  return <BookDetailsClient params={params} />;
};

export default BookDetailsPage;
