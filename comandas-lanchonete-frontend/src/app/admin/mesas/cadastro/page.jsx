"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import MesaForm from "@/components/forms/mesas";
import { useMesas } from "@/hooks/useMesas";
import styles from "./page.module.css";

/** Página protegida responsável apenas pelo cadastro de uma nova mesa. */
export default function CadastroMesaPage() {
    const router = useRouter();
    const { criarMesa } = useMesas({ carregarLista: false });

    // Envia o payload validado pelo formulário e retorna ao mapa após o sucesso.
    const handleSave = async (payload) => {
        try {
            await criarMesa(payload);
            await Swal.fire({
                title: "Mesa cadastrada!",
                text: `A Mesa ${payload.numero} foi criada com sucesso.`,
                icon: "success",
                iconColor: "var(--brand-blue)",
                confirmButtonColor: "var(--brand-orange)"
            });
            router.push("/admin/mesas");
        } catch (error) {
            await Swal.fire({
                title: "Erro ao cadastrar",
                text: error.response?.data?.message || "Verifique o número informado e tente novamente.",
                icon: "error",
                iconColor: "var(--brand-red)",
                confirmButtonColor: "var(--brand-red)"
            });
            throw error;
        }
    };

    return (
        <Can perform="mesas.criar" fallback={<AccessDenied />}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/admin/mesas" className={styles.backButton} title="Voltar para mesas">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className={styles.title}>Nova Mesa</h1>
                        <p className={styles.subtitle}>Cadastre o número que será exibido no mapa do salão.</p>
                    </div>
                </div>

                {/* O mesmo formulário é reutilizado nos modos criar, visualizar e editar. */}
                <MesaForm
                    mode="create"
                    onSave={handleSave}
                    onCancel={() => router.push("/admin/mesas")}
                />
            </div>
        </Can>
    );
}
