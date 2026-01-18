'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { getDb } from '../firebase/config';
import type { Site } from '../types';

interface AdminStats {
    pendingCount: number;
    publishedCount: number;
    totalSubmitters: number;
    totalRevenue: number;
}

interface Submitter {
    email: string;
    submissionCount: number;
    firstSubmission: Date;
}

/**
 * Fetch admin dashboard stats
 */
import { getDashboardData, getAllSitesData } from '../firebase/adminActions';


/**
 * Fetch admin dashboard stats
 */
export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        pendingCount: 0,
        publishedCount: 0,
        totalSubmitters: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            const data = await getDashboardData();
            if (data?.stats) {
                setStats(data.stats);
            }
            setLoading(false);
        }
        fetchStats();
    }, []);

    return { stats, loading };
}

/**
 * Fetch all sites for admin
 */
export function useAdminSites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSites() {
            setLoading(true);
            const data = await getAllSitesData();
            if (data?.sites) {
                const mapped = data.sites.map((s: any) => ({
                    ...s,
                    submittedAt: s.submittedAt ? { toDate: () => new Date(s.submittedAt) } : null,
                    publishedAt: s.publishedAt ? { toDate: () => new Date(s.publishedAt) } : null
                }));
                setSites(mapped);
            }
            setLoading(false);
        }
        fetchSites();
    }, []);

    return { sites, loading };
}

/**
 * Fetch pending sites for review queue
 */
export function usePendingSites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPending() {
            setLoading(true);
            const data = await getDashboardData();
            if (data?.pendingSites) {
                // Convert date strings back to objects if needed, or handle in component
                // Firestore timestamps come as ISO strings from JSON
                // Components might expect Date objects/Timestamps
                // We'll map them
                const mapped = data.pendingSites.map((s: any) => ({
                    ...s,
                    submittedAt: s.submittedAt ? { toDate: () => new Date(s.submittedAt) } : null
                }));
                setSites(mapped);
            }
            setLoading(false);
        }
        fetchPending();
    }, []);

    return { sites, loading };
}

/**
 * Fetch unique submitters (emails from submissions)
 */
export function useSubmitters() {
    const [submitters, setSubmitters] = useState<Submitter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubmitters() {
            try {
                const db = getDb();
                const snapshot = await getDocs(collection(db, 'sites'));

                const emailMap = new Map<string, { count: number; first: Date }>();

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const email = data.submitterEmail;
                    if (email) {
                        const existing = emailMap.get(email);
                        const date = data.submittedAt?.toDate?.() || new Date();
                        if (existing) {
                            existing.count++;
                            if (date < existing.first) existing.first = date;
                        } else {
                            emailMap.set(email, { count: 1, first: date });
                        }
                    }
                });

                const list: Submitter[] = [];
                emailMap.forEach((value, email) => {
                    list.push({ email, submissionCount: value.count, firstSubmission: value.first });
                });

                list.sort((a, b) => b.submissionCount - a.submissionCount);
                setSubmitters(list);
            } catch (err) {
                console.error('Failed to fetch submitters:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSubmitters();
    }, []);

    return { submitters, loading };
}

/**
 * Fetch batch job status
 */
import { getBatchStatus, startBatchReview, stopBatchReview } from '../firebase/adminActions';

export function useBatchStatus() {
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function fetchStatus() {
            setLoading(true);
            const data = await getBatchStatus();
            if (isMounted) {
                setJob(data);
                setLoading(false);
            }
        }

        fetchStatus();

        // Poll every 3 seconds if job is running
        const interval = setInterval(() => {
            if (job?.status === 'running') {
                getBatchStatus().then(data => {
                    if (isMounted && data) setJob(data);
                });
            }
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [refreshTrigger, job?.status]);

    const refresh = () => setRefreshTrigger(p => p + 1);

    const startBatch = async () => {
        const res = await startBatchReview();
        if (res.success) refresh();
        return res;
    };

    const stopBatch = async () => {
        const res = await stopBatchReview(job?.id);
        if (res.success) refresh();
        return res;
    };

    return { job, loading, startBatch, stopBatch, refresh };
}
