'use client';

import { SiteListing } from '../SiteListing';
import { useSites } from '@/lib/hooks/useSites';
import styles from './RelatedSites.module.css';

interface RelatedSitesProps {
    currentSiteId: string;
    category: string;
}

export function RelatedSites({ currentSiteId, category }: RelatedSitesProps) {
    // Fetch more sites than needed to ensure we have enough after filtering
    const { sites, loading } = useSites({
        category,
        limit: 4
    });

    // Filter out the current site
    const relatedSites = sites
        .filter(site => site.id !== currentSiteId)
        .slice(0, 3);

    if (loading) return null; // Or skeleton
    if (relatedSites.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>You Might Also Like</h3>
            <div className={styles.grid}>
                {relatedSites.map((site, i) => (
                    <div key={site.id} className={styles.cardWrapper}>
                        <SiteListing site={site} rank={i + 1} compact />
                    </div>
                ))}
            </div>
        </div>
    );
}
