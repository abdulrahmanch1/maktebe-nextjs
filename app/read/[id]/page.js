import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';
import PdfViewerClient from "./PdfViewerClient";

export const dynamic = 'force-dynamic';

async function getBookPdfUrl(id) {
  try {
    const supabase = await createClient();
    const { data: book, error } = await supabase
      .from('books')
      .select('pdfFile, title')
      .eq('id', id)
      .single();

    if (error || !book) {
      console.error('Error fetching book (server):', error);
      return null;
    }
    return book;
  } catch (err) {
    console.warn('Failed to fetch book server-side (likely offline):', err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const book = await getBookPdfUrl(resolvedParams.id);
  const title = book?.title || 'قراءة الكتاب';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dar-alqurra.com';
  const canonicalUrl = `/book/${resolvedParams.id}`;

  return {
    title: `قراءة: ${title}`,
    description: `قراءة مباشرة لكتاب ${title} بصيغة PDF.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `قراءة: ${title}`,
      description: `قراءة مباشرة لكتاب ${title} بصيغة PDF.`,
      url: `${siteUrl}${canonicalUrl}`,
    },
  };
}

const PdfReadPage = async ({ params }) => {
  const resolvedParams = await params;
  const book = await getBookPdfUrl(resolvedParams.id);

  return <PdfViewerClient pdfUrl={book?.pdfFile} bookTitle={book?.title} bookId={resolvedParams.id} />;
};

export default PdfReadPage;
