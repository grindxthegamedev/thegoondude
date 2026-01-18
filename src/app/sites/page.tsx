'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteListing, SearchBar, Button } from '@/components';
import { searchSites, fetchSites } from '@/lib/firebase/sites';
import type { Site } from '@/lib/types';
import styles from './page.module.css';

const SORT_OPTIONS = [
    { value: 'rating', label: 'Top Rated' },
    { value: 'publishedAt', label: 'Newest' },
    { value: 'name', label: 'A-Z' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'tubes', label: 'Tubes' },
    { value: 'premium', label: 'Premium' },
    { value: 'cams', label: 'Cam Sites' },
    { value: 'amateur', label: 'Amateur' },
    { value: 'onlyfans', label: 'OnlyFans Alt' },
    { value: 'vr', label: 'VR/Interactive' },
    { value: 'hentai', label: 'Hentai' },
    { value: 'dating', label: 'Dating/Hookup' },
    { value: 'niche', label: 'Niche/Fetish' },
    { value: 'games', label: 'Games' },
    { value: 'free', label: 'Free Sites' },
];

const PAGE_SIZE = 20;

// Wrapper component to handle Suspense boundary for useSearchParams
export default function SitesPage() {
    return (
        <Suspense fallback={<div className={styles.page}><p>Loading...</p></div>}>
            <SitesContent />
        </Suspense>
    );
}

function SitesContent() {
    const searchParams = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const categoryParam = searchParams.get('category') || '';
    const sortByParam = searchParams.get('sortBy') as 'rating' | 'publishedAt' | 'name' | null;

    const [sortBy, setSortBy] = useState<'rating' | 'publishedAt' | 'name'>(sortByParam || 'rating');
    const [category, setCategory] = useState(categoryParam);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Sync state with URL params when they change
    useEffect(() => {
        if (categoryParam !== category) setCategory(categoryParam);
        if (sortByParam && sortByParam !== sortBy) setSortBy(sortByParam);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryParam, sortByParam]);

    // Reset when filters change
    useEffect(() => {
        setSites([]);
        setHasMore(true);
        loadSites(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, category, queryParam]);

    const loadSites = useCallback(async (isInitial: boolean) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const currentCount = isInitial ? 0 : sites.length;

            let newSites: Site[];
            if (queryParam.trim()) {
                // Search mode - no pagination for now
                newSites = await searchSites(queryParam, 50);
                setHasMore(false);
            } else {
                // Browse mode with pagination
                newSites = await fetchSites({
                    category: category || undefined,
                    sortBy,
                    limitCount: currentCount + PAGE_SIZE,
                });
                setHasMore(newSites.length === currentCount + PAGE_SIZE);
            }

            setSites(isInitial ? newSites : newSites);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load'));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, category, queryParam, sites.length]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadSites(false);
        }
    };

    const isSearching = !!queryParam.trim();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {isSearching ? `🔍 Results for "${queryParam}"` : '🔥 Browse Sites'}
                </h1>
                <p className={styles.subtitle}>
                    {isSearching
                        ? `Found ${sites.length} matching sites`
                        : 'Discover the best adult sites, reviewed by AI'}
                </p>
            </header>

            {isSearching && (
                <div className={styles.searchContainer}>
                    <SearchBar placeholder="Search again..." />
                </div>
            )}

            {!isSearching && (
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Sort by:</label>
                        <select
                            className={styles.filterSelect}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Category:</label>
                        <select
                            className={styles.filterSelect}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className={styles.listings}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>
                            {isSearching ? 'Searching...' : 'Loading sites...'}
                        </p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Failed to load sites</p>
                        <p>Please try again later</p>
                    </div>
                ) : sites.length > 0 ? (
                    <>
                        {sites.map((site, i) => (
                            <SiteListing key={site.id} site={site} rank={i + 1} />
                        ))}

                        {/* Load More Button */}
                        {hasMore && !isSearching && (
                            <div className={styles.loadMoreWrapper}>
                                <button
                                    className={styles.loadMoreBtn}
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading...' : 'Load More Sites'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>
                            {isSearching ? 'No results found' : 'No sites found'}
                        </p>
                        <p>
                            {isSearching
                                ? 'Try a different search term'
                                : 'Be the first to submit a site!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
