import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL, BOOKS_PAGE_SIZE } from '@/constants';

export const useBooksQuery = (searchTerm, category, initialData = null) => {
    return useInfiniteQuery({
        queryKey: ['books', { searchTerm, category }],
        initialData: initialData ? {
            pages: [initialData],
            pageParams: [0],
        } : undefined,
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams();
            params.set('limit', BOOKS_PAGE_SIZE.toString());
            params.set('offset', pageParam.toString());

            if (searchTerm) params.set('query', searchTerm);
            if (category && category !== 'الكل') params.set('category', category);

            const { data } = await axios.get(`${API_URL}/api/books?${params.toString()}`);
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < BOOKS_PAGE_SIZE) return undefined;
            return allPages.length * BOOKS_PAGE_SIZE;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes (increased from Infinity to allow eventual updates)
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
    });
};
