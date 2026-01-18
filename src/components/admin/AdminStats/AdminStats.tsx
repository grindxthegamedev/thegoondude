'use client';

import styles from './AdminStats.module.css';

interface AdminStatsProps {
    stats: {
        pendingCount: number;
        publishedCount: number;
        totalSubmitters: number;
        totalRevenue: number;
    };
    loading: boolean;
}

export function AdminStats({ stats, loading }: AdminStatsProps) {
    return (
        <div className={styles.stats}>
            <div className={styles.stat}>
                <div className={styles.statLabel}>Pending Reviews</div>
                <div className={styles.statValue}>{loading ? '...' : stats.pendingCount}</div>
            </div>
            <div className={styles.stat}>
                <div className={styles.statLabel}>Published Sites</div>
                <div className={styles.statValue}>{loading ? '...' : stats.publishedCount}</div>
            </div>
            <div className={styles.stat}>
                <div className={styles.statLabel}>Submitters</div>
                <div className={styles.statValue}>{loading ? '...' : stats.totalSubmitters}</div>
            </div>
            <div className={styles.stat}>
                <div className={styles.statLabel}>Revenue</div>
                <div className={styles.statValue}>${loading ? '...' : stats.totalRevenue}</div>
            </div>
        </div>
    );
}
