import { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { socketService } from '../services/socket';

export interface User {
    id: string;
    phone: string;
    name?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        if (savedUser && token) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            socketService.connect(token);
        }
        setLoading(false);
    }, []);

    const login = async (phone: string) => {
        const { data } = await authApi.login({ phone });
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        socketService.connect(data.accessToken);
    };

    const register = async (phone: string, name: string) => {
        const { data } = await authApi.register({ phone, name });
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        socketService.connect(data.accessToken);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        socketService.disconnect();
    };

    return { user, loading, login, register, logout };
};
