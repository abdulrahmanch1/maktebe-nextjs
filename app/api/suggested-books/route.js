import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const GET = protect(admin(async (request) => {
  const supabase = await createClient();

  try {
    const { data: suggestedBooks, error: fetchError } = await supabase
      .from('books')
      .select('*, comments(*, profiles(username, email, profilepicture))')
      .eq('status', 'pending'); // Fetch books with status 'pending'

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ message: 'فشل جلب الكتب المقترحة.' }, { status: 500 });
    }

    return NextResponse.json(suggestedBooks);
  } catch (error) {
    console.error('Error in /api/suggested-books GET:', error);
    return NextResponse.json({ message: 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}));
