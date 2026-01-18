'use client';

import { useState, useEffect } from 'react';
import { toggleVote, getSiteVotes } from '@/lib/firebase/actions';
import styles from './VoteButtons.module.css';

interface VoteButtonsProps {
    siteId: string;
    initialUpvotes?: number;
    initialDownvotes?: number;
}

export function VoteButtons({ siteId, initialUpvotes = 0, initialDownvotes = 0 }: VoteButtonsProps) {
    const [votes, setVotes] = useState({ up: initialUpvotes, down: initialDownvotes });
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [loading, setLoading] = useState(false);

    // Load initial user state from local storage immediately
    useEffect(() => {
        const stored = localStorage.getItem(`vote_${siteId}`);
        if (stored === 'up' || stored === 'down') {
            setUserVote(stored);
        }
    }, [siteId]);

    const handleVote = async (type: 'up' | 'down') => {
        if (loading) return;

        // Optimistic update
        const previousUserVote = userVote;
        const previousVotes = { ...votes };

        setUserVote(current => current === type ? null : type);

        setVotes(current => {
            const newVotes = { ...current };

            // Remove old vote
            if (previousUserVote === 'up') newVotes.up--;
            if (previousUserVote === 'down') newVotes.down--;

            // Add new vote (if not toggling off)
            if (previousUserVote !== type) {
                if (type === 'up') newVotes.up++;
                if (type === 'down') newVotes.down++;
            }

            return newVotes;
        });

        // Backend call
        setLoading(true);
        try {
            await toggleVote(siteId, type);
            // Success - update local storage
            if (previousUserVote === type) {
                localStorage.removeItem(`vote_${siteId}`);
            } else {
                localStorage.setItem(`vote_${siteId}`, type);
            }
        } catch (err) {
            console.error('Vote failed:', err);
            // Revert on error
            setUserVote(previousUserVote);
            setVotes(previousVotes);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <span className={styles.label}>Was this helpful?</span>
            <div className={styles.buttons}>
                <button
                    onClick={() => handleVote('up')}
                    className={`${styles.btn} ${userVote === 'up' ? styles.activeUp : ''}`}
                    aria-label="Upvote"
                >
                    👍 <span className={styles.count}>{votes.up}</span>
                </button>
                <button
                    onClick={() => handleVote('down')}
                    className={`${styles.btn} ${userVote === 'down' ? styles.activeDown : ''}`}
                    aria-label="Downvote"
                >
                    👎 <span className={styles.count}>{votes.down}</span>
                </button>
            </div>
        </div>
    );
}
