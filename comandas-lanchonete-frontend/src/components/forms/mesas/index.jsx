"use client";

import { useEffect, useState } from "react";
import { Edit, Save } from "lucide-react";
import InputForm from "@/components/ui/inputForm";
import styles from "./index.module.css";

/**
 * Formulário reutilizável nos modos de cadastro, visualização e edição.
 * A validação do número ocorre antes de chamar a função onSave recebida da página.
 */
export default function MesaForm({
    initialData = null,
    mode = "create",
    allowEdit = true,
    onSave,
    onCancel
}) {
    const [numero, setNumero] = useState(initialData?.numero ? String(initialData.numero) : "");
    const [isEditable, setIsEditable] = useState(mode === "create" || mode === "edit");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Sincroniza o estado local quando a mesa carregada ou o modo da tela mudar.
    useEffect(() => {
        setNumero(initialData?.numero ? String(initialData.numero) : "");
        setIsEditable(mode === "create" || mode === "edit");
        setError("");
    }, [initialData, mode]);

    // Aceita somente números inteiros positivos, igual à validação do backend.
    const validar = () => {
        const numeroConvertido = Number(numero);

        if (!numero || !Number.isInteger(numeroConvertido) || numeroConvertido <= 0) {
            setError("Informe um número inteiro maior que zero.");
            return false;
        }

        setError("");
        return true;
    };

    // Converte o valor do input para número antes de enviar à API.
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validar()) return;

        setLoading(true);
        try {
            await onSave({ numero: Number(numero) });
            if (mode !== "create") setIsEditable(false);
        } catch (formError) {
            console.error("Erro ao salvar mesa:", formError);
        } finally {
            setLoading(false);
        }
    };

    // Na edição, cancela apenas as alterações; no cadastro, retorna à listagem.
    const handleCancel = () => {
        if (mode !== "create" && isEditable) {
            setNumero(String(initialData?.numero || ""));
            setError("");
            setIsEditable(false);
            return;
        }

        onCancel();
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {/* O ID é informativo e nunca pode ser alterado. */}
            {initialData && (
                <InputForm
                    label="ID da Mesa"
                    name="id"
                    value={initialData.id}
                    disabled
                />
            )}

            {/* Único campo editável do cadastro atual. */}
            <InputForm
                label="Número da Mesa"
                name="numero"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 12"
                value={numero}
                onChange={(event) => {
                    setNumero(event.target.value);
                    if (error) setError("");
                }}
                disabled={!isEditable}
                error={error}
                autoFocus={mode === "create"}
            />

            {/* Status retornados pelo backend para consulta do administrador. */}
            {initialData && (
                <div className={styles.readonlyGrid}>
                    <div className={styles.readonlyField}>
                        <span>Situação no sistema</span>
                        <strong className={!initialData.ativo ? styles.inactiveText : styles.activeText}>
                            {initialData.ativo ? "Ativa" : "Inativa"}
                        </strong>
                    </div>
                    <div className={styles.readonlyField}>
                        <span>Status operacional</span>
                        <strong>{initialData.precisa_atencao ? "Precisa de atenção" : initialData.status}</strong>
                    </div>
                </div>
            )}

            {/* Botões variam conforme o formulário está em leitura ou edição. */}
            <div className={styles.actions}>
                {!isEditable ? (
                    allowEdit && (
                        <button type="button" className={styles.btnSave} onClick={() => setIsEditable(true)}>
                            <Edit size={17} /> Editar número
                        </button>
                    )
                ) : (
                    <>
                        <button type="button" className={styles.btnCancel} onClick={handleCancel} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnSave} disabled={loading}>
                            <Save size={18} />
                            {loading ? "Salvando..." : mode === "create" ? "Cadastrar Mesa" : "Salvar Alterações"}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
}
