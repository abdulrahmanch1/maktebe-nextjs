import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { protect, admin } from '@/lib/middleware';

export const GET = protect(admin(async (request) => {
  await dbConnect();
  try {
    const users = await User.find();
    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}));
