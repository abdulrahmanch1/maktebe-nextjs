import BookDetailsClient from "./BookDetailsClient";
import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';

// Always fetch fresh data to avoid serving stale or missing books
export const dynamic = 'force-dynamic';

const normalizeBookId = (rawId) => {
  if (Array.isArray(rawId)) {
    return rawId[rawId.length - 1];
  }
  return rawId;
};

// Pre-generate top 100 books for faster indexing
export async function generateStaticParams() {
  // Use direct Supabase client (no cookies needed for build-time)
  const { createClient: createDirectClient } = await import('@supabase/supabase-js');
  const supabase = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: books } = await supabase
    .from('books')
    .select('id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  return books?.map((book) => ({
    id: book.id,
  })) || [];
}

async function getBookData(id) {
  // Validate ID - prevent source map files and other invalid IDs
  if (!id || id.includes('.map') || id.includes('.js')) {
    console.error('Invalid book ID format:', id);
    return { book: null, comments: [], relatedBooks: [] };
  }

  // Use the server client so RLS/session rules stay consistent with the rest of the app
  const supabase = await createClient();

  // Fetch book, comments, and related books concurrently for better performance
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, profiles!books_user_id_fkey(username, email)')
    .eq('id', id)
    .single();

  if (bookError) {
    // "PGRST116" => no rows found
    if (bookError.code === 'PGRST116') {
      return { book: null, comments: [], relatedBooks: [] };
    }
    console.error('Error fetching book:', bookError);
    throw new Error(bookError.message || 'Failed to fetch book');
  }

  if (!book) {
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
  const bookId = normalizeBookId(params.id);
  if (!bookId) {
    notFound();
  }
  const { book, comments } = await getBookData(bookId);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';

  if (!book) {
    return {
      title: 'مكتبة الكتب | كتاب غير موجود',
      description: 'الكتاب الذي تبحث عنه غير موجود.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  // Calculate aggregate rating
  let ratingValue = 0;
  let reviewCount = 0;

  if (comments && comments.length > 0) {
    const ratedComments = comments.filter(c => c.rating > 0);
    if (ratedComments.length > 0) {
      const totalRating = ratedComments.reduce((acc, curr) => acc + curr.rating, 0);
      ratingValue = (totalRating / ratedComments.length).toFixed(1);
      reviewCount = ratedComments.length;
    }
  }

  const baseDescription = book.description?.trim()
    ? book.description.trim()
    : `حمل واقرأ كتاب ${book.title} للمؤلف ${book.author} مجاناً بصيغة PDF. استمتع بقراءة أونلاين أو تحميل مباشر من مكتبة دار القرَاء.`;
  const pageDescription = baseDescription.length > 180 ? `${baseDescription.slice(0, 177)}...` : baseDescription;

  const pageKeywords = Array.isArray(book.keywords) && book.keywords.length > 0
    ? book.keywords
    : ['كتب', 'روايات', 'قراءة', 'تحميل كتب', 'pdf', book.category, book.author, book.title].filter(Boolean);

  const metadata = {
    title: `${book.title} - ${book.author} | تحميل وقراءة pdf`,
    description: pageDescription,
    keywords: pageKeywords,
    alternates: {
      canonical: `/book/${params.id}`,
    },
    openGraph: {
      title: `${book.title} - ${book.author} | تحميل وقراءة مجاناً`,
      description: pageDescription,
      url: `${siteUrl}/book/${params.id}`,
      images: [
        {
          url: book.cover || '/imgs/no_cover_available.png',
          width: 800,
          height: 1200,
          alt: `غلاف كتاب ${book.title}`,
        },
      ],
      type: 'book',
      authors: [book.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} - ${book.author}`,
      description: pageDescription,
      images: [book.cover || '/imgs/no_cover_available.png'],
    },
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
    inLanguage: book.language || 'ar',
    numberOfPages: book.pages,
    description: book.description,
    image: book.cover,
    url: `${siteUrl}/book/${params.id}`,
    datePublished: book.created_at, // Or publish_date if available
    publisher: {
      '@type': 'Organization',
      name: 'دار القرَاء'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: book.category || 'الكتب',
        item: `${siteUrl}/?category=${encodeURIComponent(book.category || '')}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: `${siteUrl}/book/${params.id}`
      }
    ]
  };

  // Only add aggregateRating if there are actual ratings
  if (reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue,
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1"
    };
  }

  return {
    ...metadata,
    other: {
      'application/ld+json': JSON.stringify([jsonLd, breadcrumbSchema]),
    },
  };
}

const BookDetailsPage = async (props) => {
  const params = await props.params;
  const bookId = normalizeBookId(params.id);
  if (!bookId) {
    notFound();
  }
  const { book, comments, relatedBooks } = await getBookData(bookId);

  if (!book) {
    notFound();
  }

  // Combine all data into a single object for the client component
  const bookDetails = { ...book, comments, relatedBooks };

  return <BookDetailsClient initialBook={bookDetails} />;
};

export default BookDetailsPage;
