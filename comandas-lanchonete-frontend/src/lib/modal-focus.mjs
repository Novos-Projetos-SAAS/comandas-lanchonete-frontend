const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function modalFocusTargets(dialog) {
    return [...dialog.querySelectorAll(FOCUSABLE)].filter(element =>
        element.tabIndex >= 0 && element.getClientRects().length && !element.closest("[inert]")
    );
}

export function focusModal(dialog) {
    (modalFocusTargets(dialog)[0] || dialog).focus();
}

export function activateModalFocus(dialog, onEscape) {
    const doc = dialog.ownerDocument;
    const previousFocus = doc.activeElement;
    const previousOverflow = doc.body.style.overflow;
    const siblings = [];
    for (let current = dialog; current.parentElement; current = current.parentElement) {
        for (const sibling of current.parentElement.children) {
            if (sibling !== current && sibling instanceof doc.defaultView.HTMLElement
                && !sibling.matches(".swal2-container, [data-rht-toaster], script, style, link")) {
                siblings.push([sibling, sibling.inert]);
                sibling.inert = true;
            }
        }
        if (current.parentElement === doc.body) break;
    }
    doc.body.style.overflow = "hidden";
    focusModal(dialog);
    const handleKeyDown = event => {
        // SweetAlert manages the top confirmation dialog itself.
        if (doc.querySelector(".swal2-container")) return;
        if (event.key === "Escape" && onEscape) {
            event.preventDefault();
            event.stopPropagation();
            onEscape();
        }
        if (event.key !== "Tab") return;
        const targets = modalFocusTargets(dialog);
        const first = targets[0] || dialog;
        const last = targets.at(-1) || dialog;
        if (!targets.length || !dialog.contains(doc.activeElement)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && (doc.activeElement === first || doc.activeElement === dialog)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    doc.addEventListener("keydown", handleKeyDown, true);
    return () => {
        doc.removeEventListener("keydown", handleKeyDown, true);
        for (const [sibling, wasInert] of siblings) sibling.inert = wasInert;
        doc.body.style.overflow = previousOverflow;
        if (previousFocus?.isConnected && !previousFocus.closest("[inert]")) previousFocus.focus();
    };
}
