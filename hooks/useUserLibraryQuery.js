import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '@/constants';

export const useUserLibraryQuery = (userId, type) => {
    return useQuery({
        queryKey: ['userLibrary', userId, type],
        queryFn: async () => {
            if (!userId) return [];
            const endpoint = type === 'favorites'
                ? `${API_URL}/api/users/${userId}/favorites`
                : `${API_URL}/api/users/${userId}/reading-list`;

            const { data } = await axios.get(endpoint);
            return data;
        },
        enabled: !!userId,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
};
