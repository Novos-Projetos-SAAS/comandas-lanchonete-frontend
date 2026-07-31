"use client";

import { useEffect, useState } from "react";
import { Edit, Save } from "lucide-react";
import InputForm from "@/components/ui/inputForm";
import SelectForm from "@/components/ui/selectForm";
import styles from "./index.module.css";

const formatarData = (data) => {
    if (!data) return "Não informado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(data));
};

/**
 * Formulário compartilhado entre cadastro, detalhes e edição de produtos.
 */
export default function ProdutoForm({
    initialData = null,
    categorias = [],
    mode = "create",
    allowEdit = true,
    onSave,
    onCancel
}) {
    const [form, setForm] = useState({
        nome: "",
        descricao: "",
        preco: "",
        categoria_produtos_id: ""
    });
    const [isEditable, setIsEditable] = useState(mode === "create" || mode === "edit");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setForm({
            nome: initialData?.nome || "",
            descricao: initialData?.descricao || "",
            preco: initialData?.preco ? String(initialData.preco) : "",
            categoria_produtos_id: initialData?.categoria_produtos_id
                ? String(initialData.categoria_produtos_id)
                : ""
        });
        setIsEditable(mode === "create" || mode === "edit");
        setErrors({});
    }, [initialData, mode]);

    const atualizarCampo = (campo, valor) => {
        setForm((atual) => ({ ...atual, [campo]: valor }));
        setErrors((atual) => ({ ...atual, [campo]: "" }));
    };

    const validar = () => {
        const novosErros = {};
        const precoNumerico = Number(String(form.preco).replace(",", "."));

        if (!form.nome.trim()) novosErros.nome = "Informe o nome do produto.";
        if (!Number.isFinite(precoNumerico) || precoNumerico <= 0) {
            novosErros.preco = "Informe um preço maior que zero.";
        }
        if (!form.categoria_produtos_id) {
            novosErros.categoria_produtos_id = "Selecione uma categoria.";
        }

        setErrors(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validar()) return;

        setLoading(true);

        try {
            await onSave({
                nome: form.nome.trim(),
                descricao: form.descricao.trim() || null,
                preco: Number(String(form.preco).replace(",", ".")),
                categoria_produtos_id: Number(form.categoria_produtos_id)
            });

            if (mode !== "create") setIsEditable(false);
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (mode !== "create" && isEditable) {
            setForm({
                nome: initialData?.nome || "",
                descricao: initialData?.descricao || "",
                preco: initialData?.preco ? String(initialData.preco) : "",
                categoria_produtos_id: initialData?.categoria_produtos_id
                    ? String(initialData.categoria_produtos_id)
                    : ""
            });
            setErrors({});
            setIsEditable(false);
            return;
        }

        onCancel();
    };

    const opcoesCategorias = categorias.map((categoria) => ({
        value: String(categoria.id),
        label: categoria.nome
    }));

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {initialData && (
                <InputForm
                    label="ID do Produto"
                    name="id"
                    value={initialData.id}
                    disabled
                />
            )}

            <InputForm
                label="Nome"
                name="nome"
                maxLength="100"
                value={form.nome}
                onChange={(event) => atualizarCampo("nome", event.target.value)}
                error={errors.nome}
                disabled={!isEditable}
                autoFocus={mode === "create"}
            />

            <InputForm
                label="Preço"
                name="preco"
                type="number"
                min="0.01"
                step="0.01"
                value={form.preco}
                onChange={(event) => atualizarCampo("preco", event.target.value)}
                error={errors.preco}
                disabled={!isEditable}
            />

            <SelectForm
                label="Categoria"
                name="categoria_produtos_id"
                value={form.categoria_produtos_id}
                onChange={(event) => atualizarCampo("categoria_produtos_id", event.target.value)}
                options={opcoesCategorias}
                error={errors.categoria_produtos_id}
                disabled={!isEditable}
                placeholder="Selecione a categoria"
            />

            <div className={styles.textareaGroup}>
                <label htmlFor="descricao">Descrição</label>
                <textarea
                    id="descricao"
                    name="descricao"
                    rows="5"
                    maxLength="1000"
                    value={form.descricao}
                    onChange={(event) => atualizarCampo("descricao", event.target.value)}
                    disabled={!isEditable}
                    placeholder="Ingredientes, tamanho ou observações do item"
                />
            </div>

            {initialData && (
                <div className={styles.readonlyGrid}>
                    <div className={styles.readonlyField}>
                        <span>Status</span>
                        <strong className={initialData.ativo ? styles.activeText : styles.inactiveText}>
                            {initialData.ativo ? "Ativo" : "Inativo"}
                        </strong>
                    </div>
                    <div className={styles.readonlyField}>
                        <span>Categoria atual</span>
                        <strong>{initialData.categoria_nome}</strong>
                    </div>
                    <div className={styles.readonlyField}>
                        <span>Criado em</span>
                        <strong>{formatarData(initialData.criado_em)}</strong>
                    </div>
                    <div className={styles.readonlyField}>
                        <span>Atualizado em</span>
                        <strong>{formatarData(initialData.atualizado_em)}</strong>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                {!isEditable ? (
                    allowEdit && (
                        <button type="button" className={styles.btnSave} onClick={() => setIsEditable(true)}>
                            <Edit size={17} /> Editar produto
                        </button>
                    )
                ) : (
                    <>
                        <button type="button" className={styles.btnCancel} onClick={handleCancel} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnSave} disabled={loading}>
                            <Save size={18} />
                            {loading ? "Salvando..." : mode === "create" ? "Cadastrar Produto" : "Salvar Alterações"}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
}
