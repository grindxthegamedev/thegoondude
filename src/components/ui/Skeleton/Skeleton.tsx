/**
 * Skeleton Component
 * Loading placeholder for content
 */

import styles from './Skeleton.module.css';

interface SkeletonProps {
    variant?: 'text' | 'card' | 'listing' | 'circle';
    width?: string;
    height?: string;
    count?: number;
}

export function Skeleton({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <>
            {items.map((i) => (
                <div
                    key={i}
                    className={`${styles.skeleton} ${styles[variant]}`}
                    style={{ width, height }}
                />
            ))}
        </>
    );
}

/** Pre-built skeleton for SiteListing */
export function SiteListingSkeleton() {
    return (
        <div className={styles.listingWrapper}>
            <Skeleton variant="circle" width="48px" height="48px" />
            <div className={styles.listingContent}>
                <Skeleton variant="text" width="60%" height="20px" />
                <Skeleton variant="text" width="40%" height="14px" />
            </div>
            <Skeleton variant="text" width="50px" height="24px" />
        </div>
    );
}

/** Multiple listing skeletons */
export function SiteListingsSkeletonGroup({ count = 5 }: { count?: number }) {
    return (
        <div className={styles.listingsGroup}>
            {Array.from({ length: count }, (_, i) => (
                <SiteListingSkeleton key={i} />
            ))}
        </div>
    );
}
