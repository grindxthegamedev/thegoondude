/**
 * useCategorySites Hook
 * Fetches top sites for each category (for homepage SEO)
 */

'use client';

import { useState, useEffect } from 'react';
import type { Site } from '../types';
import { CATEGORIES } from '../categories';

interface CategorySites {
    [categoryId: string]: Site[];
}

interface UseCategorySitesResult {
    categorySites: CategorySites;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook for fetching top sites per category
 * @param sitesPerCategory Number of sites to fetch per category
 */
export function useCategorySites(sitesPerCategory: number = 3): UseCategorySitesResult {
    const [categorySites, setCategorySites] = useState<CategorySites>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadCategorySites() {
            setLoading(true);
            setError(null);

            try {
                const { fetchSitesByCategory } = await import('../firebase/sites');

                const results: CategorySites = {};

                // Fetch sites for each category in parallel
                await Promise.all(
                    CATEGORIES.map(async (cat) => {
                        try {
                            const sites = await fetchSitesByCategory(cat.slug, sitesPerCategory);
                            if (!cancelled) {
                                results[cat.id] = sites;
                            }
                        } catch (err) {
                            console.warn(`Failed to fetch sites for ${cat.id}:`, err);
                            results[cat.id] = [];
                        }
                    })
                );

                if (!cancelled) {
                    setCategorySites(results);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch category sites'));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCategorySites();

        return () => {
            cancelled = true;
        };
    }, [sitesPerCategory]);

    return { categorySites, loading, error };
}
