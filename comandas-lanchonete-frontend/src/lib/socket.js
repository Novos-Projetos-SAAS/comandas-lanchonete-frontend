import { io } from "socket.io-client";
import { resolverApiUrl } from './network.mjs';

let socket = null;

function criarSocket() {
    const apiUrl = resolverApiUrl(
        process.env.NEXT_PUBLIC_API_URL,
        window.location
    );

    let socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

    try {
        socketUrl = new URL(apiUrl).origin;
    } catch {}

    return io(socketUrl, {
        autoConnect: false,
        withCredentials: true,
        transports: ["websocket", "polling"]
    });
}

export function obterSocket() {
    if (typeof window === "undefined") return null;
    if (!socket) socket = criarSocket();
    return socket;
}

export function conectarSocket() {
    const instancia = obterSocket();
    if (instancia && !instancia.connected) instancia.connect();
    return instancia;
}

export function reconectarSocket() {
    if (typeof window === "undefined") return null;

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    return conectarSocket();
}
