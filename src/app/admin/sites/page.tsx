'use client';

import { useState, useEffect } from 'react';
import { Button, Badge } from '@/components';
import { isAdminAuthenticated } from '@/lib/auth/adminAuth';
import { useAdminSites } from '@/lib/hooks';
import { approveSite, rejectSite, deleteSite } from '@/lib/firebase/adminActions';
import { triggerFullPipeline, triggerReviewGeneration } from '@/lib/firebase/aiActions';
import BatchControls from '@/components/admin/BatchControls/BatchControls';
import styles from './page.module.css';

export default function AdminSitesPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [checkDone, setCheckDone] = useState(false);
    const { sites, loading } = useAdminSites();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setAuthenticated(isAdminAuthenticated());
        setCheckDone(true);
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        await approveSite(id);
        showMessage('success', 'Site approved!');
        window.location.reload();
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        await rejectSite(id);
        showMessage('success', 'Site rejected');
        window.location.reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this site permanently?')) return;
        setActionLoading(id);
        await deleteSite(id);
        window.location.reload();
    };

    const handleGenerateReview = async (id: string, name: string) => {
        setActionLoading(id);
        showMessage('success', `Generating AI review for ${name}...`);

        const result = await triggerFullPipeline(id);

        if (result.success) {
            showMessage('success', `Review generated! Rating: ${result.review?.rating}/10`);
            window.location.reload();
        } else {
            showMessage('error', result.error || 'Failed to generate review');
        }
        setActionLoading(null);
    };

    if (!checkDone) return <div className={styles.page}><p>Loading...</p></div>;
    if (!authenticated) {
        return (
            <div className={styles.page}>
                <div className={styles.authRequired}>
                    <h1 className={styles.authTitle}>🔒 Admin Required</h1>
                    <Button href="/admin" variant="secondary">Login First</Button>
                </div>
            </div>
        );
    }

    const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
        if (!date) return 'N/A';
        const d = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'hot' | 'new' | 'premium' | 'default'> = {
            pending: 'new', published: 'premium', processing: 'hot', rejected: 'default',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📁 Manage Sites ({sites.length})</h1>
            </header>

            {message && (
                <div style={{
                    padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: message.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                    color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                }}>
                    {message.text}
                </div>
            )}

            <BatchControls />

            <section className={styles.section}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr><th>Name</th><th>Status</th><th>Rating</th><th>Submitted</th><th>Actions</th></tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : sites.length > 0 ? (
                            sites.map((site) => (
                                <tr key={site.id}>
                                    <td><a href={site.url} target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>{site.name}</a></td>
                                    <td>{getStatusBadge(site.status)}</td>
                                    <td>{(site.rating ?? 0).toFixed(1)}</td>
                                    <td>{formatDate(site.submittedAt)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                            {site.status === 'pending' && (
                                                <>
                                                    <button className={`${styles.actionBtn} ${styles.approve}`}
                                                        onClick={() => handleGenerateReview(site.id, site.name)}
                                                        disabled={actionLoading === site.id}>
                                                        {actionLoading === site.id ? '...' : '🤖 AI Review'}
                                                    </button>
                                                    <button className={styles.actionBtn}
                                                        onClick={() => handleApprove(site.id)} disabled={actionLoading === site.id}>
                                                        Approve
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.reject}`}
                                                        onClick={() => handleReject(site.id)} disabled={actionLoading === site.id}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button className={styles.actionBtn} onClick={() => handleDelete(site.id)}
                                                disabled={actionLoading === site.id}>Delete</button>
                                            <Button href={`/review/${site.slug}`} variant="ghost" size="sm">View</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sites yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </section>

            <Button href="/admin" variant="ghost" size="sm">← Back to Dashboard</Button>
        </div>
    );
}
