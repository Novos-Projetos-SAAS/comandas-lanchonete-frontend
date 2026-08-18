"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import ProdutoForm from "@/components/forms/produtos";
import { useAuth } from "@/hooks/useAuth";
import { useProdutos } from "@/hooks/useProdutos";
import styles from "./page.module.css";

/**
 * Detalhes do produto com edição opcional e alteração de status protegida.
 */
export default function ProdutoDetalhesClient() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { hasPermission } = useAuth();
    const {
        categorias,
        carregarCategorias,
        buscarProdutoPorId,
        atualizarProduto,
        alternarStatus
    } = useProdutos({ carregarLista: false });

    const [produto, setProduto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const id = params?.id;
    const modoSolicitado = searchParams.get("mode") === "edit" ? "edit" : "view";
    const podeEditar = hasPermission("alimentos.editar");
    const podeAlterarStatus = hasPermission("alimentos.status");
    const modo = modoSolicitado === "edit" && podeEditar ? "edit" : "view";

    const carregarProduto = async () => {
        setLoading(true);
        setErro("");

        try {
            const [dados] = await Promise.all([
                buscarProdutoPorId(id),
                carregarCategorias()
            ]);
            setProduto(dados);
        } catch (error) {
            setErro(error.response?.data?.message || "Produto não encontrado.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        carregarProduto();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async (payload) => {
        try {
            await atualizarProduto(id, payload);
            await Swal.fire({
                title: "Produto atualizado!",
                text: "As alterações foram salvas com sucesso.",
                icon: "success",
                confirmButtonColor: "var(--brand-orange)"
            });
            await carregarProduto();
            router.replace(`/admin/alimentos/${id}?mode=view`);
        } catch (error) {
            await Swal.fire({
                title: "Erro ao atualizar",
                text: error.response?.data?.message || "Verifique os dados e tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
            throw error;
        }
    };

    const handleStatus = async () => {
        const ativar = !produto.ativo;

        try {
            await alternarStatus(id, ativar);
            await carregarProduto();
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível alterar",
                text: error.response?.data?.message || "Tente novamente.",
                icon: "error",
                confirmButtonColor: "var(--brand-red)"
            });
        }
    };

    if (loading) return <div className={styles.loading}>Carregando produto...</div>;

    if (erro || !produto) {
        return (
            <div className={styles.errorCard}>
                <AlertTriangle size={34} />
                <strong>{erro || "Produto não encontrado."}</strong>
                <Link href="/admin/alimentos">Voltar ao cardápio</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/alimentos" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className={styles.title}>
                        {modo === "edit" ? "Editar Produto" : produto.nome}
                    </h1>
                </div>
            </div>

            <div className={styles.statusBar}>
                <div className={styles.statusText}>
                    <strong>{produto.ativo ? "Produto ativo" : "Produto inativo"}</strong>
                    <span>
                        {produto.ativo
                            ? "O item está disponível no cardápio público."
                            : "O item permanece no histórico, mas não aparece para os clientes."}
                    </span>
                </div>

                {podeAlterarStatus && (
                    <button
                        type="button"
                        className={`${styles.statusButton} ${produto.ativo ? styles.dangerButton : ""}`}
                        onClick={handleStatus}
                    >
                        {produto.ativo ? <Trash2 size={17} /> : <RotateCcw size={17} />}
                        {produto.ativo ? "Inativar" : "Reativar"}
                    </button>
                )}
            </div>

            <ProdutoForm
                initialData={produto}
                categorias={categorias}
                mode={modo}
                allowEdit={podeEditar}
                onSave={handleSave}
                onCancel={() => router.push("/admin/alimentos")}
            />
        </div>
    );
}
