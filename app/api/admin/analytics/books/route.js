import { NextResponse } from 'next/server';
import { protect, getUserFromRequest } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const GET = protect(async (request) => {
    const supabase = await createClient();

    // Check if user is admin
    const user = getUserFromRequest(request);
    if (user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Get all book views with book details
        const { data: bookViews } = await supabase
            .from('analytics_events')
            .select('book_id, metadata')
            .eq('event_type', 'book_view')
            .not('book_id', 'is', null);

        // Count views per book
        const bookViewCounts = {};
        bookViews?.forEach(view => {
            if (!bookViewCounts[view.book_id]) {
                bookViewCounts[view.book_id] = {
                    book_id: view.book_id,
                    views: 0,
                    title: view.metadata?.title || '',
                    author: view.metadata?.author || '',
                };
            }
            bookViewCounts[view.book_id].views++;
        });

        // Get book reads
        const { data: bookReads } = await supabase
            .from('analytics_events')
            .select('book_id, metadata')
            .eq('event_type', 'book_read')
            .not('book_id', 'is', null);

        // Add read counts
        bookReads?.forEach(read => {
            if (bookViewCounts[read.book_id]) {
                bookViewCounts[read.book_id].reads = (bookViewCounts[read.book_id].reads || 0) + 1;
            } else {
                bookViewCounts[read.book_id] = {
                    book_id: read.book_id,
                    views: 0,
                    reads: 1,
                    title: read.metadata?.title || '',
                    author: read.metadata?.author || '',
                };
            }
        });

        // Convert to array and sort by views
        const booksStats = Object.values(bookViewCounts)
            .map(book => ({
                ...book,
                reads: book.reads || 0,
            }))
            .sort((a, b) => b.views - a.views);

        return NextResponse.json({ books: booksStats });
    } catch (error) {
        console.error('Analytics books error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch book analytics' },
            { status: 500 }
        );
    }
});
