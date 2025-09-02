import { createClient } from "@/utils/supabase/server";
import { notFound } from 'next/navigation';
import PdfViewerClient from "./PdfViewerClient";


async function getBookPdfUrl(id) {
  const supabase = await createClient();
  const { data: book, error } = await supabase
    .from('books')
    .select('pdfFile, title') // We only need the PDF URL and title
    .eq('id', id)
    .single();

  if (error || !book) {
    notFound();
  }
  return book;
}

export async function generateMetadata({ params }) {
    const book = await getBookPdfUrl((await params).id);
    return {
        title: `قراءة: ${book.title}`,
    };
}

const PdfReadPage = async ({ params }) => {
  const book = await getBookPdfUrl((await params).id);

  return <PdfViewerClient pdfUrl={book.pdfFile} bookTitle={book.title} />;
};

export default PdfReadPage;