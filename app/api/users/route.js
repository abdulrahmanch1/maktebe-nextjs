import { NextResponse } from 'next/server';
import { protect, admin } from '@/lib/middleware';
import { createClient } from '@/utils/supabase/server';

export const GET = protect(admin(async (request) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  // Get page and pageSize from query params, with defaults
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  if (page < 1 || pageSize < 1) {
    return NextResponse.json({ message: 'Page and pageSize must be positive integers.' }, { status: 400 });
  }

  // Calculate the range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // Fetch a paginated list of users, selecting only safe fields
    const { data: users, error: fetchError, count } = await supabase
      .from('profiles') // Querying the 'profiles' table which is safer
      .select('id, username, email, created_at', { count: 'exact' }) // Select only necessary, safe fields
      .order('created_at', { ascending: false })
      .range(from, to);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return NextResponse.json({
      users,
      meta: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      }
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ message: 'Failed to fetch users.', error: err.message }, { status: 500 });
  }
}));
