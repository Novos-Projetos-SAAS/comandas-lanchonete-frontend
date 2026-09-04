import { io } from "socket.io-client";
import { resolverApiUrl } from './network.mjs';

let socket = null;

function criarSocket() {
    const apiUrl = resolverApiUrl(
        process.env.NEXT_PUBLIC_API_URL,
        window.location
    );

    let socketUrl = window.location.origin;

    if (!String(apiUrl).startsWith('/')) {
        try {
            socketUrl = new URL(apiUrl).origin;
        } catch {
            socketUrl = window.location.origin;
        }
    }

    return io(socketUrl, {
        autoConnect: false,
        withCredentials: true,
        transports: ["polling", "websocket"]
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
