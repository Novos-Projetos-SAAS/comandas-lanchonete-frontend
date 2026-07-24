"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useCargos } from "@/hooks/useCargos";
import UsuarioForm from "@/components/forms/usuarios"; // 🟢 Ajuste o path se necessário
import Swal from "sweetalert2";
import { ArrowLeft, User } from "lucide-react";
import styles from "../cadastro/page.module.css"; // 🟢 Aproveitando o mesmo CSS da tela de cadastro!

export default function DetalhesUsuarioPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const id = params?.id;
    const modeParam = searchParams.get("mode") || "view"; // 'view' ou 'edit'

    const { buscarUsuarioPorId, atualizarUsuario } = useUsuarios();
    const { cargos } = useCargos();

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    // 🟢 Busca os dados iniciais do usuário ao abrir a tela
    useEffect(() => {
        let isMounted = true;

        async function carregarDados() {
            if (!id) return;
            setLoading(true);
            setErro(null);

            try {
                const response = await buscarUsuarioPorId(id);

                console.log("response", response);

                // Extrai o objeto do usuário independente de como o backend empacote (data.data ou data)
                const dadosUsuario = response?.data?.usuario || response?.usuario || response?.data;
                
                if (isMounted) {
                    setUsuario(dadosUsuario);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Erro ao carregar usuário:", error);
                    setErro("Não foi possível carregar os dados deste usuário.");
                    Swal.fire({
                        title: "Erro!",
                        text: "Usuário não encontrado ou erro no servidor.",
                        icon: "error",
                        iconColor: "#dc2626",
                        confirmButtonColor: "#dc2626"
                    });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        carregarDados();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // 🟢 Função de salvar alterações
    const handleSave = async (payload) => {
        try {
            await atualizarUsuario(id, payload);

            await Swal.fire({
                title: "Atualizado!",
                text: "Os dados do usuário foram salvos com sucesso.",
                icon: "success",
                iconColor: "#16a34a",
                confirmButtonColor: "#ea580c" // Botão Laranja mantendo o padrão da marca
            });

            router.push("/admin/usuarios");
        } catch (error) {
            Swal.fire({
                title: "Erro ao Atualizar",
                text: error.response?.data?.message || "Verifique os dados e tente novamente.",
                icon: "error",
                iconColor: "#dc2626",
                confirmButtonColor: "#dc2626"
            });
            throw error; // Repassa o erro para o form parar o loading do botão
        }
    };

    const handleCancel = () => {
        router.push("/admin/usuarios");
    };

    return (
        <div className={styles.container}>
            {/* 🟢 CABEÇALHO */}
            <div className={styles.header}>
                <Link href="/admin/usuarios" className={styles.backButton} title="Voltar para listagem">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className={styles.title}>
                        {modeParam === "edit" ? "Editar Usuário" : "Detalhes do Usuário"}
                    </h1>
                    {usuario?.nome && (
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary, #71717a)" }}>
                            #{usuario.id} — {usuario.nome}
                        </span>
                    )}
                </div>
            </div>

            {/* 🟢 ESTADOS DE CARREGAMENTO E ERRO */}
            {loading ? (
                <div style={{
                    padding: "3rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-surface, #ffffff)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color, #e4e4e7)",
                    color: "var(--text-secondary, #71717a)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem"
                }}>
                    <User size={36} style={{ opacity: 0.4 }} />
                    <span>Carregando informações do usuário...</span>
                </div>
            ) : erro || !usuario ? (
                <div style={{
                    padding: "2.5rem",
                    textAlign: "center",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    color: "#dc2626"
                }}>
                    <p style={{ fontWeight: 600, margin: "0 0 1rem 0" }}>{erro || "Usuário não encontrado."}</p>
                    <button
                        onClick={() => router.push("/admin/usuarios")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#dc2626",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Voltar para a lista
                    </button>
                </div>
            ) : (
                /* 🟢 FORMULÁRIO PREENCHIDO */
                <UsuarioForm
                    initialData={usuario}
                    mode={modeParam}
                    cargosList={cargos || []}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}