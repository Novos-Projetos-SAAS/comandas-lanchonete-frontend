"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Can({ perform, permission, fallback = null, children }) {
    const { hasPermission, isReady } = useAuth();
    
    // 🟢 Aceita tanto 'perform' quanto 'permission' para evitar falhas silenciosas
    const permissaoAlvo = perform || permission;

    // Enquanto o Next.js não valida a sessão no mount, não desenha nada
    if (!isReady) return null;

    if (!hasPermission(permissaoAlvo)) {
        return fallback;
    }
    
    return <>{children}</>;
}