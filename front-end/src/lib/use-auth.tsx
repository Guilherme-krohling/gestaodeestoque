import { useState, useEffect } from 'react';
import { api } from './api';

export function useAuth() {
    const [session, setSession] = useState<{ user: any } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setSession(null);
                setLoading(false);
                return;
            }
            try {
                const { data } = await api.get('/auth/me');
                setSession({ user: data });
            } catch (err) {
                localStorage.removeItem('token');
                setSession(null);
            }
            setLoading(false);
        };
        verify();
    }, []);

    return { session, loading };
}
