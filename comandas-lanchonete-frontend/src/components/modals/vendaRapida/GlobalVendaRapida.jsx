"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import ModalVendaRapida from "./index.jsx";
import { registrarVendaRapida } from "@/services/caixas.service";

export default function GlobalVendaRapida({ open, onClose }) {
    const [isLoading, setIsLoading] = useState(false);

    const finalizarVenda = async dados => {
        try {
            setIsLoading(true);
            await registrarVendaRapida(dados);

            await Swal.fire({
                icon: "success",
                title: "Venda concluída",
                text: "A venda rápida foi registrada com sucesso.",
                confirmButtonColor: "#0f6475"
            });

            return true;
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Não foi possível finalizar a venda",
                text: error.response?.data?.message || "Erro ao registrar a venda rápida.",
                confirmButtonColor: "#ef4444"
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