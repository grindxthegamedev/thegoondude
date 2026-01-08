'use client';

import { useState } from 'react';
import { SiteListing } from '@/components';
import { useSites } from '@/lib/hooks';
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
    { value: 'cams', label: 'Cams' },
    { value: 'amateur', label: 'Amateur' },
    { value: 'vr', label: 'VR' },
    { value: 'hentai', label: 'Hentai' },
    { value: 'dating', label: 'Dating' },
    { value: 'niche', label: 'Niche' },
];

export default function SitesPage() {
    const [sortBy, setSortBy] = useState<'rating' | 'publishedAt' | 'name'>('rating');
    const [category, setCategory] = useState('');

    const { sites, loading, error } = useSites({
        sortBy,
        category: category || undefined,
        limit: 20,
    });

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>🔥 Browse Sites</h1>
                <p className={styles.subtitle}>
                    Discover the best adult sites, reviewed by AI
                </p>
            </header>

            {/* Filters */}
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

            {/* Listings */}
            <div className={styles.listings}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Loading sites...</p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Failed to load sites</p>
                        <p>Please try again later</p>
                    </div>
                ) : sites.length > 0 ? (
                    sites.map((site, i) => (
                        <SiteListing key={site.id} site={site} rank={i + 1} />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>No sites found</p>
                        <p>Be the first to submit a site!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
