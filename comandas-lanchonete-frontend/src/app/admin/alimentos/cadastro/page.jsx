"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import ProdutoForm from "@/components/forms/produtos";
import { useProdutos } from "@/hooks/useProdutos";
import styles from "./page.module.css";

/**
 * Cadastro protegido por alimentos.criar.
 */
export default function CadastroProdutoPage() {
    const router = useRouter();
    const {
        categorias,
        carregarCategorias,
        criarProduto
    } = useProdutos({ carregarLista: false });

    useEffect(() => {
        carregarCategorias().catch(() => {});
    }, [carregarCategorias]);

    const handleSave = async (payload) => {
        try {
            await criarProduto(payload);
            await Swal.fire({
                title: "Produto cadastrado!",
                text: `${payload.nome} foi incluído no cardápio.`,
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });
            router.push("/admin/alimentos");
        } catch (error) {
            await Swal.fire({
                title: "Erro ao cadastrar",
                text: error.response?.data?.message || "Verifique os dados e tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
            throw error;
        }
    };

    return (
        <Can perform="alimentos.criar" fallback={<AccessDenied />}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/admin/alimentos" className={styles.backButton}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className={styles.title}>Novo Produto</h1>
                    </div>
                </div>

                <ProdutoForm
                    mode="create"
                    categorias={categorias}
                    onSave={handleSave}
                    onCancel={() => router.push("/admin/alimentos")}
                />
            </div>
        </Can>
    );
}
