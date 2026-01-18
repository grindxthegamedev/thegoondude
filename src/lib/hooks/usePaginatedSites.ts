/**
 * usePaginatedSites Hook
 * React hook for paginated site fetching with "Load More" support
 */

'use client';

import { useState, useCallback } from 'react';
import type { Site } from '../types';

interface UsePaginatedSitesOptions {
    category?: string;
    sortBy?: 'rating' | 'publishedAt' | 'name';
    pageSize?: number;
}

interface UsePaginatedSitesResult {
    sites: Site[];
    loading: boolean;
    loadingMore: boolean;
    error: Error | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    reset: () => void;
}

/**
 * Hook for paginated site fetching
 * Uses Firestore cursor-based pagination
 */
export function usePaginatedSites(
    options: UsePaginatedSitesOptions = {}
): UsePaginatedSitesResult {
    const { category, sortBy = 'rating', pageSize = 20 } = options;

    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<unknown>(null);
    const [initialized, setInitialized] = useState(false);

    /**
     * Fetch next page of sites
     */
    const fetchPage = useCallback(async (isInitial: boolean) => {
        if (isInitial) {
            setLoading(true);
            setSites([]);
            setLastDoc(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const { fetchSitesPaginated } = await import('../firebase/sitesPaginated');

            const result = await fetchSitesPaginated({
                category,
                sortBy,
                pageSize,
                startAfterDoc: isInitial ? null : lastDoc,
            });

            if (isInitial) {
                setSites(result.sites);
            } else {
                setSites(prev => [...prev, ...result.sites]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch sites'));
        } finally {
            if (isInitial) {
                setLoading(false);
                setInitialized(true);
            } else {
                setLoadingMore(false);
            }
        }
    }, [category, sortBy, pageSize, lastDoc]);

    /**
     * Load more sites
     */
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        await fetchPage(false);
    }, [loadingMore, hasMore, fetchPage]);

    /**
     * Reset and refetch from beginning
     */
    const reset = useCallback(() => {
        setInitialized(false);
        fetchPage(true);
    }, [fetchPage]);

    // Initial fetch
    if (!initialized && !loading) {
        fetchPage(true);
    }

    return {
        sites,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        reset,
    };
}
