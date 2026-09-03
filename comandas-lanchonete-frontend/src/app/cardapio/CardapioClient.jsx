"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CardapioClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim();

    useEffect(() => {
        if (token) {
            router.replace(`/m/${encodeURIComponent(token)}`);
        } else {
            router.replace("/");
        }
    }, [router, token]);

    return null;
}
