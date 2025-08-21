import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';
import { uploadFile } from '@/utils/supabase/storage'; // Import uploadFile

export const POST = protect(async (request) => {
  const supabase = await createClient();
  const formData = await request.formData();

  const userId = request.user.id;
  const coverFile = formData.get('cover');
  const pdfFile = formData.get('pdfFile');

  // Step 1: Extract and assemble text-based data
  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    category: formData.get('category'),
    description: formData.get('description'),
    pages: parseInt(formData.get('pages'), 10) || 0,
    publishYear: parseInt(formData.get('publishYear'), 10) || 0,
    language: formData.get('language'),
    keywords: formData.get('keywords') ? JSON.parse(formData.get('keywords')) : [],
    status: 'pending',
    user_id: userId,
    cover: null, // Initialize as null
    pdfFile: null, // Initialize as null
  };

  // Step 2: Validate text-based data BEFORE file uploads
  const errors = validateBook(bookData);
  if (Object.keys(errors).length > 0) {
    // Note: We are validating before assigning file URLs. 
    // The validation function might need to be aware that `cover` and `pdfFile` can be null at this stage.
    // Assuming validateBook can handle this.
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
  }

  // Helper function to sanitize filenames
  const sanitizeFilename = (filename) => {
    return filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_\.]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Step 3: Upload files if validation was successful
  try {
    if (coverFile && coverFile.size > 0) {
      const sanitizedCoverFileName = sanitizeFilename(coverFile.name);
      const coverFileName = `${Date.now()}-${sanitizedCoverFileName}`;
      bookData.cover = await uploadFile(supabase, 'book-covers', coverFileName, coverFile);
    }

    if (pdfFile && pdfFile.size > 0) {
      const sanitizedPdfFileName = sanitizeFilename(pdfFile.name);
      const pdfFileName = `${Date.now()}-${sanitizedPdfFileName}`;
      bookData.pdfFile = await uploadFile(supabase, 'book-pdfs', pdfFileName, pdfFile);
    }
  } catch (uploadError) {
    console.error('Error during file upload:', uploadError);
    return NextResponse.json({ message: 'فشل في تحميل الملفات.' }, { status: 500 });
  }

  // Step 4: Insert the final record into the database
  try {
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error (suggest):', insertError);
      // Attempt to delete uploaded files if database insert fails
      if (bookData.cover) await supabase.storage.from('book-covers').remove([bookData.cover.split('/').pop()]);
      if (bookData.pdfFile) await supabase.storage.from('book-pdfs').remove([bookData.pdfFile.split('/').pop()]);
      throw new Error(insertError.message);
    }

    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/books/suggest:', error);
    return NextResponse.json({ message: 'فشل في اقتراح الكتاب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
  }
});
