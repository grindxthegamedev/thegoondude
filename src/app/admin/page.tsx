'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Badge } from '@/components';
import { verifyAdminPassword, isAdminAuthenticated, setAdminAuthenticated } from '@/lib/auth/adminAuth';
import { useAdminStats, usePendingSites } from '@/lib/hooks';
import styles from './page.module.css';

export default function AdminPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const { stats, loading: statsLoading } = useAdminStats();
    const { sites: pendingSites, loading: pendingLoading } = usePendingSites();

    useEffect(() => {
        setAuthenticated(isAdminAuthenticated());
        setLoading(false);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const valid = await verifyAdminPassword(password);
        if (valid) {
            setAdminAuthenticated(true);
            // Store password for Cloud Function calls
            sessionStorage.setItem('admin_password', password);
            setAuthenticated(true);
        } else {
            setError('Invalid password');
        }
    };

    const handleLogout = () => {
        setAdminAuthenticated(false);
        sessionStorage.removeItem('admin_password');
        setAuthenticated(false);
    };

    if (loading) return <div className={styles.page}><p>Loading...</p></div>;

    if (!authenticated) {
        return (
            <div className={styles.page}>
                <div className={styles.authRequired}>
                    <h1 className={styles.authTitle}>🔒 Admin Access</h1>
                    <p className={styles.authDesc}>Enter the admin password to continue.</p>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <Input label="Password" name="password" type="password" value={password}
                            onChange={setPassword} error={error} placeholder="Enter admin password" />
                        <Button type="submit" size="lg">Login →</Button>
                    </form>
                </div>
            </div>
        );
    }

    const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
        if (!date) return 'N/A';
        const d = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📊 Admin Dashboard</h1>
                <Button onClick={handleLogout} variant="ghost" size="sm">Logout</Button>
            </header>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <div className={styles.statLabel}>Pending Reviews</div>
                    <div className={styles.statValue}>{statsLoading ? '...' : stats.pendingCount}</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statLabel}>Published Sites</div>
                    <div className={styles.statValue}>{statsLoading ? '...' : stats.publishedCount}</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statLabel}>Submitters</div>
                    <div className={styles.statValue}>{statsLoading ? '...' : stats.totalSubmitters}</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statLabel}>Revenue</div>
                    <div className={styles.statValue}>${statsLoading ? '...' : stats.totalRevenue}</div>
                </div>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>🕐 Pending Review Queue</h2>
                </div>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr><th>Site</th><th>Category</th><th>Submitted</th><th>Actions</th></tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {pendingLoading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : pendingSites.length > 0 ? (
                            pendingSites.slice(0, 5).map((site) => (
                                <tr key={site.id}>
                                    <td><a href={site.url} target="_blank" rel="noopener">{site.name}</a></td>
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
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <Button href="/admin/sites" variant="secondary" size="sm">Manage Sites</Button>
                    <Button href="/admin/users" variant="secondary" size="sm">Manage Submitters</Button>
                </div>
            </section>
        </div>
    );
}
