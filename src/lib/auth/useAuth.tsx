'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getAuthInstance } from '../firebase/config';
import { getUserProfile, type UserProfile } from './roles';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    isModerator: boolean;
}

const AuthContext = createContext<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isModerator: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        loading: true,
        isAdmin: false,
        isModerator: false,
    });

    useEffect(() => {
        const auth = getAuthInstance();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const profile = await getUserProfile(user.uid);
                setState({
                    user,
                    profile,
                    loading: false,
                    isAdmin: profile?.role === 'admin',
                    isModerator: profile?.role === 'admin' || profile?.role === 'moderator',
                });
            } else {
                setState({
                    user: null,
                    profile: null,
                    loading: false,
                    isAdmin: false,
                    isModerator: false,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    return useContext(AuthContext);
}
