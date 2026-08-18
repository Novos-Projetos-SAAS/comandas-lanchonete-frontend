"use client";

import Link from "next/link";

import {
    useEffect
} from "react";

import {
    useRouter
} from "next/navigation";

import {
    ArrowLeft
} from "lucide-react";

import Swal from "sweetalert2";

import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";

import ComandaForm from "@/components/forms/comandas";

import {
    useComandas
} from "@/hooks/useComandas";

import styles from "./page.module.css";

/**
 * Página administrativa responsável pela
 * abertura manual de uma nova comanda.
 */
export default function CadastroComandaPage() {
    const router = useRouter();

    const {
        mesasDisponiveis,
        loadingMesas,
        carregarMesasDisponiveis,
        abrirComanda
    } = useComandas({
        carregarLista: false
    });

    /**
     * Carrega somente as mesas livres assim
     * que a página for aberta.
     */
    useEffect(() => {
        carregarMesasDisponiveis()
            .catch(() => { });
    }, [
        carregarMesasDisponiveis
    ]);

    /**
     * Recebe do formulário um payload já
     * validado e envia para o backend.
     */
    const handleSave = async (payload) => {
        try {
            const response =
                await abrirComanda(payload);

            const comanda =
                response?.data?.comanda ||
                response?.comanda;

            await Swal.fire({
                title: "Comanda aberta!",
                text:
                    comanda?.id
                        ? `A Comanda #${comanda.id} foi aberta com sucesso.`
                        : "A nova comanda foi aberta com sucesso.",
                icon: "success",
                iconColor: "var(--status-success)",
                confirmButtonColor:
                    "var(--brand-orange)"
            });

            router.push(
                "/admin/comandas"
            );
        } catch (error) {
            await Swal.fire({
                title: "Não foi possível abrir",
                text:
                    error.response?.data?.message ||
                    "Verifique os dados informados e tente novamente.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor:
                    "var(--brand-red)"
            });

            throw error;
        }
    };

    return (
        <Can
            perform="comandas.abrir"
            fallback={<AccessDenied />}
        >
            <div className={styles.container}>

                <div className={styles.header}>
                    <Link
                        href="/admin/comandas"
                        className={styles.backButton}
                    >
                        <ArrowLeft size={24} />
                    </Link>

                    <div>
                        <h1 className={styles.title}>
                            Nova Comanda
                        </h1>
                    </div>
                </div>

                <ComandaForm
                    mesas={mesasDisponiveis}
                    loadingMesas={loadingMesas}
                    onSave={handleSave}
                    onCancel={() => {
                        router.push(
                            "/admin/comandas"
                        );
                    }}
                />

            </div>
        </Can>
    );
}