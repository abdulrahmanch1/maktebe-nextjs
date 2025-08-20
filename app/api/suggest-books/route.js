import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware'; // Assuming any logged-in user can suggest
import { validateBook } from '@/lib/validation';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin'; // For getting public URLs

export const POST = protect(async (request) => {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient(); // Use admin client for storage operations if RLS is strict

  try {
    const formData = await request.formData();

    const title = formData.get('title');
    const author = formData.get('author');
    const category = formData.get('category');
    const description = formData.get('description');
    const pages = parseInt(formData.get('pages'));
    const publishYear = parseInt(formData.get('publishYear'));
    const language = formData.get('language');
    const keywords = formData.get('keywords') ? formData.get('keywords').split(',').map(k => k.trim()).filter(k => k !== '') : [];
    const coverFile = formData.get('cover');
    const pdfFile = formData.get('pdfFile');

    let coverUrl = null;
    let pdfFileUrl = null;

    // Upload Cover File
    if (coverFile && coverFile.size > 0) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `book-covers/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('book-covers')
        .upload(filePath, coverFile, {
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase cover upload error:', uploadError);
        return NextResponse.json({ message: 'فشل رفع صورة الغلاف.' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        return NextResponse.json({ message: 'فشل الحصول على رابط صورة الغلاف.' }, { status: 500 });
      }
      coverUrl = urlData.publicUrl;
    }

    // Upload PDF File (optional)
    if (pdfFile && pdfFile.size > 0) {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `book-pdfs/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('book-pdfs')
        .upload(filePath, pdfFile, {
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase PDF upload error:', uploadError);
        return NextResponse.json({ message: 'فشل رفع ملف PDF.' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('book-pdfs')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        return NextResponse.json({ message: 'فشل الحصول على رابط ملف PDF.' }, { status: 500 });
      }
      pdfFileUrl = urlData.publicUrl;
    }

    const bookData = {
      title,
      author,
      category,
      description,
      pages,
      publishYear: publishYear,
      language,
      keywords,
      coverimage: coverUrl,
      pdffile: pdfFileUrl,
      status: 'pending',
      // Add any other default fields for a suggested book, e.g., 'status: "pending"'
    };

    console.log('Book data for validation:', bookData); // Debugging line

    const errors = validateBook(bookData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'فشل التحقق من البيانات', errors }, { status: 400 });
    }

    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ message: 'فشل إضافة الكتاب المقترح إلى قاعدة البيانات.', error: insertError.message }, { status: 500 }); // Added error.message
    }

    return NextResponse.json({ message: 'تم استلام اقتراح الكتاب بنجاح!', book: newBook }, { status: 201 });

  } catch (error) {
    console.error('Error in /api/suggest-books POST:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع أثناء معالجة الاقتراح.', error: error.message }, { status: 500 }); // Added error.message
  }
});
