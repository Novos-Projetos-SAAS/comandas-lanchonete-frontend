"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { useUsuarios } from "@/hooks/useUsuarios";
import { useCargos } from "@/hooks/useCargos";

import UsuarioForm from "@/components/forms/usuarios"; // 🟢 Ajuste o path se o componente estiver em outra pasta

import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

import styles from "./page.module.css"; 

export default function NovoUsuarioPage() {
    const router = useRouter();
    const { criarUsuario } = useUsuarios();
    const { cargos } = useCargos(); 

    const handleSave = async (payload) => {
        try {
            await criarUsuario(payload);
            
            await Swal.fire({
                title: 'Sucesso!',
                text: 'Usuário cadastrado com sucesso.',
                icon: 'success',
                iconColor: '#16a34a',
                confirmButtonColor: '#ea580c' // Botão Laranja mantendo o padrão
            });
            
            router.push("/admin/usuarios");
        } catch (error) {
            Swal.fire({
                title: 'Erro!',
                text: error.response?.data?.message || 'Falha ao cadastrar o usuário.',
                icon: 'error',
                iconColor: '#dc2626',
                confirmButtonColor: '#dc2626'
            });
            throw error;
        }
    };

    const handleCancel = () => {
        router.push("/admin/usuarios");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/usuarios" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>
                    Novo Usuário
                </h1>
            </div>

            <UsuarioForm 
                mode="create" 
                cargosList={cargos || []}
                onSave={handleSave} 
                onCancel={handleCancel} 
            />
        </div>
    );
}