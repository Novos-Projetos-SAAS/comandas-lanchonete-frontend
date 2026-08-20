import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import ToastProvider from "@/components/providers/ToastProvider";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
});

export const metadata = {
    title: "Resenha Espetos",
    description: "Sistema de gerenciamento"
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
            <body suppressHydrationWarning>
                <AuthProvider>
                    {children}
                    <ToastProvider />
                </AuthProvider>
            </body>
        </html>
    );
}