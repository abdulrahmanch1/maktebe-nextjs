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
        // Get all page views
        const { data: pageViews } = await supabase
            .from('analytics_events')
            .select('page_path')
            .eq('event_type', 'page_view')
            .not('page_path', 'is', null);

        // Count views per page
        const pageViewCounts = {};
        pageViews?.forEach(view => {
            const path = view.page_path;
            if (!pageViewCounts[path]) {
                pageViewCounts[path] = { path, views: 0 };
            }
            pageViewCounts[path].views++;
        });

        // Convert to array and sort by views
        const pagesStats = Object.values(pageViewCounts)
            .sort((a, b) => b.views - a.views);

        return NextResponse.json({ pages: pagesStats });
    } catch (error) {
        console.error('Analytics pages error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch page analytics' },
            { status: 500 }
        );
    }
});
