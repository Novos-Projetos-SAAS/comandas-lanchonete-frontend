"use client";

import { useEffect, useState } from "react";
import { Edit, Save } from "lucide-react";
import InputForm from "@/components/ui/inputForm";
import styles from "./index.module.css";

/**
 * Formulário reutilizado em cadastro, visualização e edição.
 * O select de status só aparece durante a edição e respeita mesas.status.
 */
export default function MesaForm({
    initialData = null,
    mode = "create",
    allowDataEdit = true,
    allowStatusEdit = false,
    onSave,
    onCancel
}) {
    const [numero, setNumero] = useState(initialData?.numero ? String(initialData.numero) : "");
    const [clienteNome, setClienteNome] = useState(initialData?.comanda?.cliente_nome || "");
    const [statusMesa, setStatusMesa] = useState(
        initialData ? (initialData.ativo ? initialData.status : "Inativa") : "Livre"
    );
    const [isEditable, setIsEditable] = useState(mode === "create" || mode === "edit");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Atualiza o formulário quando os dados forem recarregados pelo backend.
    useEffect(() => {
        setNumero(initialData?.numero ? String(initialData.numero) : "");
        setClienteNome(initialData?.comanda?.cliente_nome || "");
        setStatusMesa(initialData ? (initialData.ativo ? initialData.status : "Inativa") : "Livre");
        setIsEditable(mode === "create" || mode === "edit");
        setError("");
    }, [initialData, mode]);

    const validar = () => {
        const numeroConvertido = Number(numero);

        if (!numero || !Number.isInteger(numeroConvertido) || numeroConvertido <= 0) {
            setError("Informe um número inteiro maior que zero.");
            return false;
        }

        if (clienteNome.trim().length > 100) {
            setError("O nome do cliente deve possuir no máximo 100 caracteres.");
            return false;
        }

        setError("");
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validar()) return;

        setLoading(true);

        try {
            const payload = {
                numero: Number(numero),
                cliente_nome: clienteNome.trim() || null
            };

            // O status só entra no payload da edição quando o usuário possui
            // a permissão específica para alterar a situação operacional da mesa.
            if (initialData && allowStatusEdit) {
                payload.status = statusMesa;
            }

            await onSave(payload);

            if (mode !== "create") setIsEditable(false);
        } catch (formError) {
            console.error("Erro ao salvar mesa:", formError);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (mode !== "create" && isEditable) {
            setNumero(String(initialData?.numero || ""));
            setClienteNome(initialData?.comanda?.cliente_nome || "");
            setStatusMesa(initialData ? (initialData.ativo ? initialData.status : "Inativa") : "Livre");
            setError("");
            setIsEditable(false);
            return;
        }

        onCancel();
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {initialData && (
                <InputForm
                    label="ID da Mesa"
                    name="id"
                    value={initialData.id}
                    disabled
                />
            )}

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
                disabled={!isEditable || !allowDataEdit}
                error={error}
                autoFocus={mode === "create"}
            />

            {initialData?.comanda && (
                <InputForm
                    label="Nome do Cliente"
                    name="cliente_nome"
                    maxLength="100"
                    placeholder="Cliente não informado"
                    value={clienteNome}
                    onChange={(event) => {
                        setClienteNome(event.target.value);
                        if (error) setError("");
                    }}
                    disabled={!isEditable || !allowDataEdit}
                />
            )}

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

                        {isEditable && allowStatusEdit ? (
                            <select
                                className={styles.statusSelect}
                                value={statusMesa}
                                onChange={(event) => setStatusMesa(event.target.value)}
                                aria-label="Status da mesa"
                            >
                                <option value="Livre">Livre</option>
                                <option value="Ocupada">Ocupada</option>
                                <option value="Fechando">Fechando</option>
                                <option value="Inativa">Inativa</option>
                            </select>
                        ) : (
                            <strong>
                                {!initialData.ativo
                                    ? "Inativa"
                                    : initialData.precisa_atencao
                                        ? "Precisa de atenção"
                                        : initialData.status}
                            </strong>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                {!isEditable ? (
                    (allowDataEdit || allowStatusEdit) && (
                        <button type="button" className={styles.btnSave} onClick={() => setIsEditable(true)}>
                            <Edit size={17} /> Editar dados
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
