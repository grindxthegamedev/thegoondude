'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { isAdminAuthenticated } from '@/lib/auth/adminAuth';
import { useSubmitters } from '@/lib/hooks';
import styles from '../page.module.css';

export default function AdminUsersPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [checkDone, setCheckDone] = useState(false);
    const { submitters, loading } = useSubmitters();

    useEffect(() => {
        setAuthenticated(isAdminAuthenticated());
        setCheckDone(true);
    }, []);

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

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>👥 Submitters ({submitters.length})</h1>
            </header>

            <section className={styles.section}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th>Email</th>
                            <th>Submissions</th>
                            <th>First Submission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : submitters.length > 0 ? (
                            submitters.map((user) => (
                                <tr key={user.email}>
                                    <td>{user.email}</td>
                                    <td>{user.submissionCount}</td>
                                    <td>{formatDate(user.firstSubmission)}</td>
                                    <td>
                                        <button className={styles.actionBtn}>View Sites</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No submitters yet. Emails from submissions will appear here.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <Button href="/admin" variant="ghost" size="sm">← Back to Dashboard</Button>
        </div>
    );
}
