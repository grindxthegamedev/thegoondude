'use client';

import { useBatchStatus } from '@/lib/hooks/useAdmin';
import styles from './BatchControls.module.css';
import { useState } from 'react';

/**
 * Batch Review Controls
 * Start/Stop and monitor automated review batches
 */
export default function BatchControls() {
    const { job, loading, startBatch, stopBatch, refresh } = useBatchStatus();
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await startBatch();
            if (!res.success) setError(res.error || 'Failed to start');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStop = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await stopBatch();
            if (!res.success) setError(res.error || 'Failed to stop');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading batch status...</div>;

    const isRunning = job?.status === 'running';
    const progress = job ? Math.round((job.processedCount / (job.totalSites || 1)) * 100) : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Automated Review Batch</h3>
                <div className={styles.actions}>
                    {!isRunning ? (
                        <button
                            className={`${styles.button} ${styles.start}`}
                            onClick={handleStart}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Starting...' : 'Start New Batch'}
                        </button>
                    ) : (
                        <button
                            className={`${styles.button} ${styles.stop}`}
                            onClick={handleStop}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Stopping...' : 'Stop Batch'}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {job && (
                <div className={styles.statusPanel}>
                    <div className={styles.statusRow}>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Status</span>
                            <span className={`${styles.value} ${styles[job.status]}`}>
                                {job.status.toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Progress</span>
                            <span className={styles.value}>
                                {job.processedCount} / {job.totalSites}
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Success</span>
                            <span className={`${styles.value} ${styles.success}`}>
                                {job.successCount}
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.label}>Errors</span>
                            <span className={`${styles.value} ${styles.errorCount}`}>
                                {job.errorCount}
                            </span>
                        </div>
                    </div>

                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {isRunning && job.currentSiteName && (
                        <div className={styles.currentAction}>
                            Processing: <strong>{job.currentSiteName}</strong>...
                        </div>
                    )}

                    {job.errors && job.errors.length > 0 && (
                        <div className={styles.errorLog}>
                            <h4>Recent Errors</h4>
                            <ul>
                                {job.errors.slice(-5).map((err: any, i: number) => (
                                    <li key={i}>
                                        <strong>{err.name}</strong>: {err.error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
