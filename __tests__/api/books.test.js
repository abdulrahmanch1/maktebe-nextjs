import { createMocks } from 'node-mocks-http';
import { GET } from '../../app/api/books/route';
import { NextResponse } from 'next/server';

// محاكاة next/server
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body, init) => ({
            json: async () => body,
            status: init?.status || 200,
        })),
    },
}));

// محاكاة Supabase
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null } })
        },
        from: jest.fn(() => {
            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                then: jest.fn((resolve) => resolve({
                    data: [
                        { id: 1, title: 'كتاب 1', status: 'approved' },
                        { id: 2, title: 'كتاب 2', status: 'approved' }
                    ],
                    error: null,
                    count: 2
                }))
            };
            return queryBuilder;
        })
    }))
}));

describe('واجهة برمجة تطبيقات الكتب (Books API)', () => {
    it('تعيد قائمة بالكتب المعتمدة', async () => {
        const { req } = createMocks({
            method: 'GET',
            url: 'http://localhost/api/books',
        });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0].title).toBe('كتاب 1');
    });
});
