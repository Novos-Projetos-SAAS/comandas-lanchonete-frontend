import { io } from "socket.io-client";

let socket = null;

function criarSocket() {
    return io(window.location.origin, {
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
    descartarSocket();
    return conectarSocket();
}

export function descartarSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
