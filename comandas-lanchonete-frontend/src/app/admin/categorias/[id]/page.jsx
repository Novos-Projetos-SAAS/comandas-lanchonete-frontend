"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CategoriaAlimentosForm from "@/components/forms/categoriasAlimentos";
import { useCategorias } from "@/hooks/useCategorias";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css"; // 🟢 Importando o CSS

export default function DetalhesCategoriaPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    
    const mode = searchParams.get("mode") === "edit" ? "edit" : "view";
    const id = params.id;

    const { obterPorId, editar } = useCategorias(); 
    
    const [categoriaInfo, setCategoriaInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoria = async () => {
            try {
                const data = await obterPorId(id);

                console.log("data >> :", data.data);


                setCategoriaInfo(data.data);
            } catch (error) {
                Swal.fire('Erro', 'Categoria não encontrada.', 'error');
                router.push("/admin/categorias");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCategoria();
    }, [id]);

    const handleSave = async (payload) => {
        try {
            await editar(id, payload);
            
            await Swal.fire({
                title: 'Atualizada!',
                text: 'Os dados foram salvos com sucesso.',
                icon: 'success',
                iconColor: '#16a34a',
                confirmButtonColor: '#16a34a'
            });
            
            router.push("/admin/categorias");
        } catch (error) {
            Swal.fire({
                title: 'Erro!',
                text: 'Falha ao salvar as alterações.',
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

    if (loading) {
        return <div className={styles.loading}>Carregando dados da categoria...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/categorias" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className={styles.title}>
                    {mode === 'edit' ? 'Editar Categoria' : 'Detalhes da Categoria'}
                </h1>
            </div>

            <CategoriaAlimentosForm 
                initialData={categoriaInfo}
                mode={mode} 
                onSave={handleSave} 
                onCancel={handleCancel} 
            />
        </div>
    );
}