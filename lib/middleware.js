import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (handler) => {
  return async (req, ...args) => {
    await dbConnect();
    let token;

    if (req.headers.get('authorization') && req.headers.get('authorization').startsWith('Bearer')) {
      try {
        token = req.headers.get('authorization').split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return NextResponse.json({ message: 'Not authorized, user not found' }, { status: 401 });
        }
        return handler(req, ...args);
      } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Not authorized, token failed' }, { status: 401 });
      }
    }

    if (!token) {
      return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
    }
  };
};

export const admin = (handler) => {
  return async (req, ...args) => {
    if (req.user && req.user.role === 'admin') {
      return handler(req, ...args);
    } else {
      return NextResponse.json({ message: 'Not authorized as an admin' }, { status: 403 });
    }
  };
};
