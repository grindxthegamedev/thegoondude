'use client';

import { useState, useEffect } from 'react';
import { Button, Input, AdminStats, PendingTable } from '@/components';
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

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>📊 Admin Dashboard</h1>
                <Button onClick={handleLogout} variant="ghost" size="sm">Logout</Button>
            </header>

            <AdminStats stats={stats} loading={statsLoading} />

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>🕐 Pending Review Queue</h2>
                </div>
                <PendingTable sites={pendingSites} loading={pendingLoading} />
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
