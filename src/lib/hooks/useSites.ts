/**
 * useSites Hook
 * React hook for fetching sites from Firebase
 */

'use client';

import { useState, useEffect } from 'react';
import type { Site } from '../types';

interface UseSitesOptions {
    category?: string;
    sortBy?: 'rating' | 'publishedAt' | 'name';
    limit?: number;
    isNew?: boolean;
}

interface UseSitesResult {
    sites: Site[];
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Hook for fetching sites
 * Returns empty array until Firebase is connected
 */
export function useSites(options: UseSitesOptions = {}): UseSitesResult {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refetchKey, setRefetchKey] = useState(0);

    const refetch = () => setRefetchKey((k) => k + 1);

    useEffect(() => {
        let cancelled = false;

        async function loadSites() {
            setLoading(true);
            setError(null);

            try {
                // Dynamic import to avoid SSR issues
                const { fetchSites, fetchNewSites, fetchTopSites, fetchSitesByCategory } = await import('../firebase/sites');

                let data: Site[];

                if (options.isNew) {
                    data = await fetchNewSites(options.limit);
                } else if (options.category) {
                    data = await fetchSitesByCategory(options.category, options.limit);
                } else if (options.sortBy === 'rating') {
                    data = await fetchTopSites(options.limit);
                } else {
                    data = await fetchSites({
                        category: options.category,
                        sortBy: options.sortBy,
                        limitCount: options.limit,
                    });
                }

                if (!cancelled) {
                    setSites(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch sites'));
                    setSites([]); // Return empty on error
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSites();

        return () => {
            cancelled = true;
        };
    }, [options.category, options.sortBy, options.limit, options.isNew, refetchKey]);

    return { sites, loading, error, refetch };
}

/**
 * Hook for fetching top rated sites
 */
export function useTopSites(count: number = 10): UseSitesResult {
    return useSites({ sortBy: 'rating', limit: count });
}

/**
 * Hook for fetching new sites
 */
export function useNewSites(count: number = 10): UseSitesResult {
    return useSites({ isNew: true, limit: count });
}
