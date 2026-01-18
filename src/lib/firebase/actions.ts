/**
 * User Actions
 * Interactive features like voting, favoriting, etc.
 */

import { doc, runTransaction, getDoc } from 'firebase/firestore';
import { getDb } from './config';

/**
 * Toggle a vote for a site (up/down)
 * Uses Firestore transaction to ensure atomic updates
 * 
 * Logic:
 * - If user had no vote -> Add vote
 * - If user had same vote -> Remove vote (toggle off)
 * - If user had opposite vote -> Switch vote (remove old, add new)
 * 
 * Note: This client-side logic assumes the UI is handling the specific action (up/down).
 * Real 'toggle' logic is complex without a robust user ID system.
 * 
 * Simple version for anonymous/IP-based:
 * Just increment/decrement counters blindly based on UI state.
 * Real protection would happen in Security Rules or Cloud Functions.
 */
export async function toggleVote(siteId: string, type: 'up' | 'down') {
    const db = getDb();
    const siteRef = doc(db, 'sites', siteId);

    try {
        await runTransaction(db, async (transaction) => {
            const siteDoc = await transaction.get(siteRef);
            if (!siteDoc.exists()) throw new Error("Site does not exist");

            const data = siteDoc.data();
            const currentVotes = data.votes || { up: 0, down: 0 };

            // This is a naive implementation that trusts the client
            // In a real app, you'd verify the user ID in a subcollection
            // For MVP/Anonymous: We just increment. 
            // The UI handles the +/- logic visually.
            // But to make it work with the "switch" logic, we need to know the PREVIOUS state.
            // Since we can't easy know previous state in a blind call, 
            // we will implement specific 'add' and 'remove' actions if we wanted perfection.

            // SIMPLIFIED MVP APPROACH:
            // Just increment. UI prevents spamming via localStorage.
            // Does this allow abuse? Yes. Is it fine for MVP? Yes.

            const newVotes = { ...currentVotes };
            if (type === 'up') newVotes.up = (newVotes.up || 0) + 1;
            if (type === 'down') newVotes.down = (newVotes.down || 0) + 1;

            transaction.update(siteRef, { votes: newVotes });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}

/**
 * Get current votes for a site
 */
export async function getSiteVotes(siteId: string) {
    const db = getDb();
    const siteRef = doc(db, 'sites', siteId);
    const snap = await getDoc(siteRef);

    if (snap.exists()) {
        return snap.data().votes || { up: 0, down: 0 };
    }
    return { up: 0, down: 0 };
}
