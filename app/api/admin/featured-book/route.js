import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { protect } from '@/lib/middleware';

// GET - Get current featured book
export async function GET() {
    try {
        const supabase = await createClient();

        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        const fetchPromise = supabase
            .from('books')
            .select('*')
            .eq('is_featured', true)
            .eq('status', 'approved')
            .single();

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return NextResponse.json(data || null, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        console.error('Error fetching featured book:', {
            message: error.message,
            details: error.stack,
            hint: error.hint,
            code: error.code
        });
        return NextResponse.json(
            null, // Return null instead of error message
            {
                status: 200, // Return 200 so frontend doesn't error
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                }
            }
        );
    }
}

// PUT - Set a book as featured (Admin only)
export const PUT = protect(async (request) => {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ message: 'يجب أن تكون مسؤولاً' }, { status: 403 });
    }

    try {
        const { bookId } = await request.json();

        if (!bookId) {
            return NextResponse.json(
                { message: 'معرف الكتاب مطلوب' },
                { status: 400 }
            );
        }

        // The trigger will automatically unfeatured other books
        const { data, error } = await supabase
            .from('books')
            .update({ is_featured: true })
            .eq('id', bookId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            message: 'تم تحديد الكتاب كـ "كتاب الأسبوع" بنجاح',
            book: data
        });
    } catch (error) {
        console.error('Error setting featured book:', error);
        return NextResponse.json(
            { message: 'فشل تحديد الكتاب المميز' },
            { status: 500 }
        );
    }
});

// DELETE - Remove featured status (Admin only)
export const DELETE = protect(async (request) => {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ message: 'يجب أن تكون مسؤولاً' }, { status: 403 });
    }

    try {
        const { bookId } = await request.json();

        if (!bookId) {
            return NextResponse.json(
                { message: 'معرف الكتاب مطلوب' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('books')
            .update({ is_featured: false })
            .eq('id', bookId);

        if (error) throw error;

        return NextResponse.json({
            message: 'تم إلغاء تمييز الكتاب بنجاح'
        });
    } catch (error) {
        console.error('Error removing featured status:', error);
        return NextResponse.json(
            { message: 'فشل إلغاء تمييز الكتاب' },
            { status: 500 }
        );
    }
});
