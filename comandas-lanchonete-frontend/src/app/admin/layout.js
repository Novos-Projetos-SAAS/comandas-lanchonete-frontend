// src/app/admin/layout.jsx
import AdminLayoutClient from "@/components/layouts/adminLayoutClient/AdminLayoutClient.jsx";

export const metadata = {
    title: "Resenha Espetos | Painel Administrativo", 
    description: "Sistema de gestão de pedidos e cardápio.",
    icons: {
        icon: "/favicon.ico", 
    },
};

export default function AdminLayout({ children }) {
    return (
        <AdminLayoutClient>
            {children}
        </AdminLayoutClient>
    );
}