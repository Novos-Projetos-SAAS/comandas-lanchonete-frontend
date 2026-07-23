"use client";

import { useRouter } from "next/navigation";
import CategoriaAlimentosForm from "@/components/forms/categoriasAlimentos"; 
import { useCategorias } from "@/hooks/useCategorias";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css"; // 🟢 Importando o CSS

export default function NovaCategoriaPage() {
    const router = useRouter();
    const { criar } = useCategorias(); 

    const handleSave = async (payload) => {
        try {
            await criar(payload);
            
            await Swal.fire({
                title: 'Sucesso!',
                text: 'Categoria cadastrada com sucesso.',
                icon: 'success',
                iconColor: '#16a34a',
                confirmButtonColor: '#ea580c'
            });
            
            router.push("/admin/categorias");
        } catch (error) {
            Swal.fire({
                title: 'Erro!',
                text: 'Falha ao cadastrar a categoria.',
                icon: 'error',
                iconColor: '#dc2626',
                confirmButtonColor: '#dc2626'
            });
            throw error;
        }
    };

    const handleCancel = () => {
        router.push("/admin/categorias");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/categorias" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>
                    Nova Categoria
                </h1>
            </div>

            <CategoriaAlimentosForm 
                mode="create" 
                onSave={handleSave} 
                onCancel={handleCancel} 
            />
        </div>
    );
}