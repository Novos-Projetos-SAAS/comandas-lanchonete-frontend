"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="bottom-center"
            reverseOrder={false}
            
            containerStyle={{
                bottom: "calc(80px + env(safe-area-inset-bottom))"
            }}
            toastOptions={{
                duration: 1800,
                style: {
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "9px",
                    padding: "10px 14px",
                    fontSize: ".82rem",
                    boxShadow: "0 8px 25px rgba(0,0,0,.18)"
                },
                success: {
                    iconTheme: {
                        primary: "#16a34a",
                        secondary: "#fff"
                    }
                }
            }}
        />
    );
}