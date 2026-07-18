// src/lib/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 50000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true // 🟢 Isso faz o navegador enviar o cookie HttpOnly automaticamente
});

// REMOVA O INTERCEPTOR DE REQUEST QUE LÊ O COOKIE. 
// Deixe o backend ler o token direto do cookie da requisição.

export default api;