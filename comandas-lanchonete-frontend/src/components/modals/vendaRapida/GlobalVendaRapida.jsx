"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import ModalVendaRapida from "./index.jsx";
import { registrarVendaRapida } from "@/services/caixas.service";
import { agendarFeedbackVendaConcluida } from "@/lib/venda-rapida-feedback.mjs";

const elevarAlerta = () => {
    const container = Swal.getContainer();
    if (container) container.style.zIndex = "3000";
};

export default function GlobalVendaRapida({ open, onClose }) {
    const [isLoading, setIsLoading] = useState(false);

    const finalizarVenda = async dados => {
        try {
            setIsLoading(true);
            await registrarVendaRapida(dados);

            window.dispatchEvent(new CustomEvent("venda-rapida:concluida"));

            agendarFeedbackVendaConcluida({
                mostrar: opcoes => Swal.fire(opcoes),
                opcoes: { didOpen: elevarAlerta }
            });

            return true;
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Não foi possível finalizar a venda",
                text: error.response?.data?.message || "Erro ao registrar a venda rápida.",
                confirmButtonColor: "#ef4444",
                didOpen: elevarAlerta
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ModalVendaRapida
            open={open}
            onClose={onClose}
            onFinalizar={finalizarVenda}
            isLoading={isLoading}
        />
    );
}
