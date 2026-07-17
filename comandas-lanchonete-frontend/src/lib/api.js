import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
});

// Interceptor: Antes de qualquer requisição sair, ele injeta o Token
api.interceptors.request.use((config) => {
    // Busca o token do localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('@Lanchonete:token') : null;
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});