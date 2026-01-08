'use client';

import { use } from 'react';
import { SiteListing } from '@/components';
import { useSites } from '@/lib/hooks';
import styles from '../page.module.css';

interface CategoryPageProps {
    params: Promise<{ category: string }>;
}

const CATEGORY_NAMES: Record<string, string> = {
    tubes: 'Tubes',
    premium: 'Premium',
    cams: 'Cam Sites',
    amateur: 'Amateur',
    vr: 'VR',
    hentai: 'Hentai',
    dating: 'Dating',
    niche: 'Niche',
    free: 'Free',
    top: 'Top Rated',
    new: 'New Sites',
};

export default function CategoryPage({ params }: CategoryPageProps) {
    const { category } = use(params);
    const categoryName = CATEGORY_NAMES[category] || category;

    // Handle special routes
    const isTop = category === 'top';
    const isNew = category === 'new';

    const { sites, loading, error } = useSites({
        category: isTop || isNew ? undefined : category,
        sortBy: isNew ? 'publishedAt' : 'rating',
        isNew: isNew ? true : undefined,
        limit: 20,
    });

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {isTop ? '🔥' : isNew ? '✨' : '📁'} {categoryName}
                </h1>
                <p className={styles.subtitle}>
                    {isTop && 'The highest rated adult sites'}
                    {isNew && 'Fresh additions to our directory'}
                    {!isTop && !isNew && `Browse ${categoryName.toLowerCase()} sites`}
                </p>
            </header>

            <div className={styles.listings}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Loading sites...</p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Failed to load sites</p>
                    </div>
                ) : sites.length > 0 ? (
                    sites.map((site, i) => (
                        <SiteListing key={site.id} site={site} rank={isTop ? i + 1 : undefined} />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>No sites in this category yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
