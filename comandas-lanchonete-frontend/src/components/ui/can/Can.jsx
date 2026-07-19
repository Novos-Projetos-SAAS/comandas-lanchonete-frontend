"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Can({ perform, fallback = null, children }) {
    const { hasPermission, isReady } = useAuth();
    

    // Enquanto não valida a sessão no mount, não desenha nada para evitar flashes
    if (!isReady) return null;

    if (!hasPermission(perform)) {
        return fallback;
    }
    

    return <>{children}</>;
}