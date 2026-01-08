/**
 * Auth Utilities
 * Role-based access control helpers
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '../firebase/config';

export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: UserRole;
    createdAt: Date;
}

/**
 * Get user profile with role from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const db = getDb();
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            uid,
            ...docSnap.data(),
        } as UserProfile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(uid: string): Promise<boolean> {
    const profile = await getUserProfile(uid);
    return profile?.role === 'admin';
}

/**
 * Check if user has moderator or admin role
 */
export async function isModerator(uid: string): Promise<boolean> {
    const profile = await getUserProfile(uid);
    return profile?.role === 'admin' || profile?.role === 'moderator';
}

/**
 * Create initial user profile (called on first sign-in)
 */
export async function createUserProfile(
    uid: string,
    email: string,
    displayName?: string
): Promise<UserProfile> {
    const db = getDb();
    const profile: UserProfile = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'user', // Default role
        createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', uid), profile);
    return profile;
}
