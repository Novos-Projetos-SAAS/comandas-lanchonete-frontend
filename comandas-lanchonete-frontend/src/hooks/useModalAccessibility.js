"use client";

import { useEffect, useRef } from "react";
import { activateModalFocus } from "@/lib/modal-focus.mjs";

export function useModalAccessibility(open, onEscape) {
    const dialogRef = useRef(null);
    const escapeRef = useRef(onEscape);
    useEffect(() => { escapeRef.current = onEscape; }, [onEscape]);
    useEffect(() => {
        if (!open || !dialogRef.current) return;
        return activateModalFocus(dialogRef.current, () => escapeRef.current?.());
    }, [open]);
    return dialogRef;
}
