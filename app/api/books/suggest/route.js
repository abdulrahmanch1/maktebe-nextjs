import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';
import { uploadFile } from '@/utils/supabase/storage'; // Import uploadFile

export const POST = protect(async (request) => {
  const supabase = await createClient();
  const formData = await request.formData();

  // We can extract the suggester's ID if needed in the future
  const userId = request.user.id; 

  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    category: formData.get('category'),
    description: formData.get('description'),
    pages: parseInt(formData.get('pages')),
    publishYear: parseInt(formData.get('publishYear')),
    language: formData.get('language'),
    keywords: formData.get('keywords') ? JSON.parse(formData.get('keywords')) : [],
    status: 'pending', // Explicitly set status to pending for review
    user_id: userId, // Add user_id
  };

  const coverFile = formData.get('cover');
  const pdfFile = formData.get('pdfFile');

  // Helper function to sanitize filenames for Supabase Storage
  const sanitizeFilename = (filename) => {
    return filename
      .normalize("NFD") // Normalize to decompose combined characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-zA-Z0-9-_\.]/g, "-") // Replace invalid characters with hyphens
      .replace(/--+/g, "-") // Replace multiple hyphens with a single hyphen
      .replace(/^-+|-+$/g, ""); // Trim hyphens from start and end
  };

  // Upload cover image
  if (coverFile && coverFile.size > 0) {
    const sanitizedCoverFileName = sanitizeFilename(coverFile.name);
    const coverFileName = `${Date.now()}-${sanitizedCoverFileName}`;
    try {
      const coverUrl = await uploadFile(supabase, 'book-covers', coverFileName, coverFile);
      bookData.cover = coverUrl;
    } catch (uploadError) {
      console.error('Error uploading cover image:', uploadError);
      return NextResponse.json({ message: 'فشل في تحميل صورة الغلاف.' }, { status: 500 });
    }
  } else {
    bookData.cover = null; // Set to null if no cover file is provided
  }

  // Upload PDF file
  if (pdfFile && pdfFile.size > 0) {
    const sanitizedPdfFileName = sanitizeFilename(pdfFile.name);
    const pdfFileName = `${Date.now()}-${sanitizedPdfFileName}`;
    try {
      const pdfUrl = await uploadFile(supabase, 'book-pdfs', pdfFileName, pdfFile);
      bookData.pdfFile = pdfUrl;
    } catch (uploadError) {
      console.error('Error uploading PDF file:', uploadError);
      return NextResponse.json({ message: 'فشل في تحميل ملف PDF.' }, { status: 500 });
    }
  } else {
    bookData.pdfFile = null; // Set to null if no PDF file is provided
  }

  const errors = validateBook(bookData);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  try {
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error (suggest):', insertError);
      throw new Error(insertError.message);
    }

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books/suggest:', error);
    return NextResponse.json({ message: 'فشل في اقتراح الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
});
