"use client";

import { useMemo, useState } from "react";

import {
    Save
} from "lucide-react";

import InputForm from "@/components/ui/inputForm";
import SelectForm from "@/components/ui/selectForm";

import styles from "./index.module.css";

/**
 * Formulário responsável pela abertura administrativa
 * de uma nova comanda.
 *
 * Neste momento a comanda precisa somente de:
 *
 * - mesa;
 * - nome do cliente opcional.
 *
 * Status, valor e caixa são definidos automaticamente
 * pelo backend.
 */
export default function ComandaForm({
    mesas = [],
    loadingMesas = false,
    onSave,
    onCancel
}) {
    const [loading, setLoading] =
        useState(false);

    const [errors, setErrors] =
        useState({});

    const [formData, setFormData] =
        useState({
            mesa_id: "",
            cliente_nome: ""
        });

    /**
     * Transforma as mesas retornadas pelo backend
     * no formato esperado pelo SelectForm.
     */
    const opcoesMesas = useMemo(() => {
        return mesas.map((mesa) => ({
            value: String(mesa.id),

            label:
                `Mesa ${String(mesa.numero).padStart(
                    2,
                    "0"
                )}`
        }));
    }, [mesas]);

    /**
     * Atualiza um campo e remove o erro
     * daquele campo quando o usuário volta a digitar.
     */
    const atualizarCampo = (
        nome,
        valor
    ) => {
        setFormData((dadosAtuais) => ({
            ...dadosAtuais,
            [nome]: valor
        }));

        if (errors[nome]) {
            setErrors((errosAtuais) => ({
                ...errosAtuais,
                [nome]: null
            }));
        }
    };

    /**
     * Valida somente o que realmente é necessário
     * para abrir a comanda.
     */
    const validar = () => {
        const novosErros = {};

        const mesaId =
            Number(formData.mesa_id);

        if (
            !formData.mesa_id ||
            !Number.isInteger(mesaId) ||
            mesaId <= 0
        ) {
            novosErros.mesa_id =
                "Selecione uma mesa.";
        }

        if (
            formData.cliente_nome.trim().length > 100
        ) {
            novosErros.cliente_nome =
                "O nome do cliente deve possuir no máximo 100 caracteres.";
        }

        setErrors(novosErros);

        return (
            Object.keys(novosErros).length === 0
        );
    };

    /**
     * Envia somente os campos aceitos pelo backend.
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validar()) {
            return;
        }

        setLoading(true);

        const payload = {
            mesa_id:
                Number(formData.mesa_id),

            cliente_nome:
                formData.cliente_nome.trim() ||
                null
        };

        try {
            await onSave(payload);
        } catch (error) {
            console.error(
                "Erro ao abrir comanda:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const semMesasDisponiveis =
        !loadingMesas &&
        mesas.length === 0;

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
        >
            <SelectForm
                label="Mesa"
                name="mesa_id"
                value={formData.mesa_id}
                onChange={(event) => {
                    atualizarCampo(
                        "mesa_id",
                        event.target.value
                    );
                }}
                options={opcoesMesas}
                placeholder={
                    loadingMesas
                        ? "Carregando mesas..."
                        : semMesasDisponiveis
                            ? "Nenhuma mesa livre"
                            : "Selecione uma mesa"
                }
                disabled={
                    loadingMesas ||
                    semMesasDisponiveis ||
                    loading
                }
                error={errors.mesa_id}
            />

            <InputForm
                label="Nome do Cliente"
                name="cliente_nome"
                maxLength="100"
                placeholder="Ex: João da Silva"
                value={formData.cliente_nome}
                onChange={(event) => {
                    atualizarCampo(
                        "cliente_nome",
                        event.target.value
                    );
                }}
                disabled={loading}
                error={errors.cliente_nome}
            />

            <div className={styles.infoBox}>
                <div className={styles.infoItem}>
                    <span>Status inicial</span>
                    <strong>Aberta</strong>
                </div>

                <div className={styles.infoItem}>
                    <span>Valor inicial</span>
                    <strong>R$ 0,00</strong>
                </div>

                <div className={styles.infoItem}>
                    <span>Caixa</span>
                    <strong>
                        Caixa atualmente aberto
                    </strong>
                </div>
            </div>

            {semMesasDisponiveis && (
                <div className={styles.warningBox}>
                    Não existem mesas livres no momento.
                    Finalize uma comanda existente ou
                    libere uma mesa antes de abrir uma
                    nova comanda.
                </div>
            )}

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    className={styles.btnSave}
                    disabled={
                        loading ||
                        loadingMesas ||
                        semMesasDisponiveis
                    }
                >
                    <Save size={18} />

                    {loading
                        ? "Abrindo..."
                        : "Abrir Comanda"}
                </button>
            </div>
        </form>
    );
}