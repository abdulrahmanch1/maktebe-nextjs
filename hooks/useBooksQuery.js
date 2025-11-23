import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL, BOOKS_PAGE_SIZE } from '@/constants';

export const useBooksQuery = (searchTerm, category) => {
    return useInfiniteQuery({
        queryKey: ['books', { searchTerm, category }],
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
        staleTime: Infinity, // Never refetch automatically
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
};
