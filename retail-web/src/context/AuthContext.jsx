import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, settingsService, userService } from '../services/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('KES');
    const [exchangeRate, setExchangeRate] = useState(null);

    // Restore session from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');
        const savedCurrency = localStorage.getItem('currency');

        if (token && role && userId) {
            setUser({ token, role, userId });
            if (savedCurrency) setCurrency(savedCurrency);
            // Fetch exchange rate
            settingsService.getRate()
                .then(res => setExchangeRate(res.data))
                .catch(() => { });
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (credentials) => {
        const res = await authService.login(credentials);
        const { token, refreshToken, role, userId } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId);

        setUser({ token, role, userId });

        // Fetch exchange rate after login
        try {
            const rateRes = await settingsService.getRate();
            setExchangeRate(rateRes.data);
        } catch {
            // Rate may not be configured yet
        }

        return role;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('currency');
        setUser(null);
        setExchangeRate(null);
    }, []);

    const switchCurrency = useCallback(async (newCurrency) => {
        setCurrency(newCurrency);
        localStorage.setItem('currency', newCurrency);
        try {
            await userService.updateCurrency(newCurrency);
        } catch {
            // Silently fail — the preference just won't be saved on the server
        }
    }, []);

    const refreshRate = useCallback(async () => {
        try {
            const res = await settingsService.getRate();
            setExchangeRate(res.data);
        } catch {
            // Leave current rate
        }
    }, []);

    const value = {
        user,
        loading,
        currency,
        exchangeRate,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        logout,
        switchCurrency,
        refreshRate,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
