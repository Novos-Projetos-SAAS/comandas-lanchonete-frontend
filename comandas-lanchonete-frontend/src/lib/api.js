import axios from 'axios';
import { resolverApiUrl } from './network.mjs';

const baseURL = resolverApiUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
    baseURL,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

export default api;
