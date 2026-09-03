import { io } from "socket.io-client";
import { resolverApiUrl } from './network.mjs';

let socket = null;

export function obterSocket() {
    if (typeof window === "undefined") return null;
    if (socket) return socket;

    const apiUrl = resolverApiUrl(
        process.env.NEXT_PUBLIC_API_URL,
        window.location
    );

    let socketUrl = `${window.location.protocol}//${window.location.hostname}:3333`;

    try {
        socketUrl = new URL(apiUrl).origin;
    } catch {}

    socket = io(socketUrl, {
        autoConnect: false,
        withCredentials: true,
        transports: ["websocket", "polling"]
    });

    return socket;
}
