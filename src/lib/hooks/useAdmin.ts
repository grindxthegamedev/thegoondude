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
            try {
                const db = getDb();
                const sitesRef = collection(db, 'sites');
                const snapshot = await getDocs(sitesRef);

                let pending = 0;
                let published = 0;
                const emails = new Set<string>();

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.status === 'pending') pending++;
                    if (data.status === 'published') published++;
                    if (data.submitterEmail) emails.add(data.submitterEmail);
                });

                setStats({
                    pendingCount: pending,
                    publishedCount: published,
                    totalSubmitters: emails.size,
                    totalRevenue: published * 20,
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
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
            try {
                const db = getDb();
                const q = query(collection(db, 'sites'), orderBy('submittedAt', 'desc'));
                const snapshot = await getDocs(q);

                const data: Site[] = [];
                snapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() } as Site);
                });
                setSites(data);
            } catch (err) {
                console.error('Failed to fetch sites:', err);
            } finally {
                setLoading(false);
            }
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
            try {
                const db = getDb();
                const q = query(
                    collection(db, 'sites'),
                    where('status', '==', 'pending'),
                    orderBy('submittedAt', 'desc')
                );
                const snapshot = await getDocs(q);

                const data: Site[] = [];
                snapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() } as Site);
                });
                setSites(data);
            } catch (err) {
                console.error('Failed to fetch pending:', err);
            } finally {
                setLoading(false);
            }
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
