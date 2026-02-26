import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export interface User {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.name,
                    avatar_url: session.user.user_metadata.avatar_url,
                });
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.name,
                    avatar_url: session.user.user_metadata.avatar_url,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string) => {
        console.log('Attempting login for:', email);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
            },
        });
        if (error) {
            console.error('Login error:', error);
            throw error;
        }
        console.log('Login OTP request successful');
    };

    const verifyOtp = async (email: string, token: string) => {
        console.log('Attempting OTP verification for:', email);
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        if (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
        console.log('OTP verification successful', data);
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return { user, loading, login, verifyOtp, logout };
};

