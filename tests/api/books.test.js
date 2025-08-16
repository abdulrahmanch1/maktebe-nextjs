import { GET } from '@/app/api/books/route';
import { NextResponse } from 'next/server';

// Mock the createClient function from Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        range: jest.fn(() => ({
          data: [],
          error: null,
          count: 0,
        })),
      })),
    })),
  })),
}));

describe('GET /api/books', () => {
  it('should return books with pagination headers', async () => {
    // Mock the request object
    const mockRequest = {
      url: 'http://localhost/api/books?page=1&limit=10',
    };

    // Mock Supabase response for select().range()
    require('@/utils/supabase/server').createClient.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [{ id: '1', title: 'Book 1' }],
            error: null,
            count: 100,
          })),
        })),
      })),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Total-Count')).toBe('100');
    expect(data).toEqual([{ id: '1', title: 'Book 1' }]);
  });

  it('should handle errors from Supabase', async () => {
    // Mock Supabase to return an error
    require('@/utils/supabase/server').createClient.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          range: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' },
            count: 0,
          })),
        })),
      })),
    });

    const mockRequest = {
      url: 'http://localhost/api/books?page=1&limit=10',
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('فشل في جلب الكتب. يرجى المحاولة مرة أخرى.');
  });
});
