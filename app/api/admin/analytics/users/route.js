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
        // Get all events with user info
        const { data: events } = await supabase
            .from('analytics_events')
            .select('user_id, event_type, created_at')
            .not('user_id', 'is', null);

        // Count events per user
        const userStats = {};
        events?.forEach(event => {
            const userId = event.user_id;
            if (!userStats[userId]) {
                userStats[userId] = {
                    user_id: userId,
                    total_events: 0,
                    page_views: 0,
                    book_views: 0,
                    book_reads: 0,
                    last_activity: event.created_at,
                };
            }
            userStats[userId].total_events++;
            if (event.event_type === 'page_view') userStats[userId].page_views++;
            if (event.event_type === 'book_view') userStats[userId].book_views++;
            if (event.event_type === 'book_read') userStats[userId].book_reads++;

            // Update last activity if this event is more recent
            if (new Date(event.created_at) > new Date(userStats[userId].last_activity)) {
                userStats[userId].last_activity = event.created_at;
            }
        });

        // Get user profiles for usernames
        const userIds = Object.keys(userStats);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

        // Add usernames to stats
        const usersWithProfiles = Object.values(userStats).map(user => ({
            ...user,
            username: profiles?.find(p => p.id === user.user_id)?.username || 'مستخدم غير معروف',
        })).sort((a, b) => b.total_events - a.total_events);

        return NextResponse.json({ users: usersWithProfiles });
    } catch (error) {
        console.error('Analytics users error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch user analytics' },
            { status: 500 }
        );
    }
});
