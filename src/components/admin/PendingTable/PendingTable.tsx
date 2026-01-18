'use client';

import { Badge } from '@/components/ui';
import type { Site } from '@/lib/types';
import styles from './PendingTable.module.css';

interface PendingTableProps {
    sites: Site[];
    loading: boolean;
}

export function PendingTable({ sites, loading }: PendingTableProps) {
    const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
        if (!date) return 'N/A';
        const d = typeof date === 'object' && 'toDate' in date ? (date as any).toDate() : new Date(date);
        return d.toLocaleDateString();
    };

    return (
        <table className={styles.table}>
            <thead className={styles.tableHead}>
                <tr><th>Site</th><th>Category</th><th>Submitted</th><th>Actions</th></tr>
            </thead>
            <tbody className={styles.tableBody}>
                {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : sites.length > 0 ? (
                    sites.slice(0, 5).map((site) => (
                        <tr key={site.id}>
                            <td><a href={site.url} target="_blank" rel="noopener noreferrer">{site.name}</a></td>
                            <td><Badge variant="default">{site.category}</Badge></td>
                            <td>{formatDate(site.submittedAt)}</td>
                            <td>
                                <button className={`${styles.actionBtn} ${styles.approve}`}>Approve</button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No pending submissions
                    </td></tr>
                )}
            </tbody>
        </table>
    );
}
