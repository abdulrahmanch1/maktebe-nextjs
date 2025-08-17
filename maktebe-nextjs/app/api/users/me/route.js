import { NextResponse } from 'next/server';
import { protect } from '@/lib/middleware';

export const GET = protect(async (request) => {
  return NextResponse.json({ user: request.user });
});
