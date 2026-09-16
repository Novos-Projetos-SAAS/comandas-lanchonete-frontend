import axios from 'axios';
import Cookies from 'js-cookie';
import { resolverApiUrl } from './network.mjs';
import { criarAuthorizationBearer } from './auth-token.mjs';

const baseURL = resolverApiUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
    baseURL,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;

    const authorization = criarAuthorizationBearer(Cookies.get('token'));

    if (authorization && !config.headers.Authorization) {
        config.headers.Authorization = authorization;
    }

    return config;
});

export default api;
