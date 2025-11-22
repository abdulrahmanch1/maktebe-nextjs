import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const GET = protect(async (request) => {
    const supabase = await createClient();

    // Check if user is admin
    if (request.user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Get total events count
        const { count: totalEvents } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true });

        // Get total unique users
        const { data: uniqueUsers } = await supabase
            .from('analytics_events')
            .select('user_id')
            .not('user_id', 'is', null);

        const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id) || []).size;

        // Get page views count
        const { count: pageViews } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'page_view');

        // Get book views count
        const { count: bookViews } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'book_view');

        // Get book reads count
        const { count: bookReads } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'book_read');

        // Get events from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentEvents } = await supabase
            .from('analytics_events')
            .select('created_at, event_type')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        // Group events by day
        const eventsByDay = {};
        recentEvents?.forEach(event => {
            const date = new Date(event.created_at).toISOString().split('T')[0];
            if (!eventsByDay[date]) {
                eventsByDay[date] = { date, page_views: 0, book_views: 0, book_reads: 0 };
            }
            if (event.event_type === 'page_view') eventsByDay[date].page_views++;
            if (event.event_type === 'book_view') eventsByDay[date].book_views++;
            if (event.event_type === 'book_read') eventsByDay[date].book_reads++;
        });

        const dailyStats = Object.values(eventsByDay);

        return NextResponse.json({
            overview: {
                totalEvents: totalEvents || 0,
                uniqueUsers: uniqueUserCount,
                pageViews: pageViews || 0,
                bookViews: bookViews || 0,
                bookReads: bookReads || 0,
            },
            dailyStats,
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch analytics overview' },
            { status: 500 }
        );
    }
});
