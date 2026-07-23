'use client'

import { useState } from "react" // 🟢 useEffect removido!
import InputForm from "@/components/ui/inputForm"; 
import SelectForm from "@/components/ui/selectForm";
import { Edit, Save } from "lucide-react";
import styles from "./index.module.css"; 

export default function CategoriaAlimentosForm({ initialData, mode = 'create', onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [isEditable, setIsEditable] = useState(mode === 'create' || mode === 'edit');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        id: initialData?.id || null,
        nome: initialData?.nome || "",
        descricao: initialData?.descricao || "",
        ativo: initialData?.ativo ?? true,
    });

    // 🟢 NOVA ABORDAGEM DO REACT: Rastreamos o ID anterior para saber se a prop mudou.
    // Isso substitui o useEffect e evita a dupla renderização que causou o erro!
    const [prevId, setPrevId] = useState(initialData?.id);

    if (initialData?.id !== prevId) {
        setPrevId(initialData?.id); // Atualiza o rastreador
        
        // Atualiza os dados do formulário sem causar cascata de renderização
        setFormData({
            id: initialData?.id || null,
            nome: initialData?.nome || "",
            descricao: initialData?.descricao || "",
            ativo: initialData?.ativo ?? true,
        });
        setIsEditable(mode === 'create' || mode === 'edit');
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        let finalValue = value;
        if (name === 'ativo') {
            finalValue = value === 'true';
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nome || formData.nome.trim().length < 2) {
            newErrors.nome = "O nome deve ter pelo menos 2 caracteres.";
        }
        
        if (!formData.descricao || formData.descricao.trim().length < 3) {
            newErrors.descricao = "Adicione uma breve descrição para a categoria.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        const payload = {
            nome: formData.nome,
            descricao: formData.descricao,
            ativo: formData.ativo
        };

        try {
            await onSave(payload);
            if (mode === 'edit') setIsEditable(false);
        } catch (error) {
            console.error("Erro no formulário:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (mode === 'view' && isEditable) {
            setIsEditable(false);
            setFormData({
                id: initialData?.id || null,
                nome: initialData?.nome || "",
                descricao: initialData?.descricao || "",
                ativo: initialData?.ativo ?? true,
            });
            setErrors({});
        } else {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {initialData && (
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputForm
                        label="ID da Categoria"
                        name="id"
                        value={initialData.id}
                        disabled={true}
                    />
                </div>
            )}

            <InputForm
                label="Nome da Categoria"
                name="nome"
                placeholder="Ex: Lanches, Bebidas, Porções"
                value={formData.nome}
                onChange={handleChange}
                disabled={!isEditable}
                error={errors.nome}
            />

            <InputForm
                label="Descrição"
                name="descricao"
                placeholder="Ex: Hambúrgueres artesanais, sanduíches..."
                value={formData.descricao}
                onChange={handleChange}
                disabled={!isEditable}
                error={errors.descricao}
            />

            <SelectForm
                label="Status da Categoria"
                name="ativo"
                value={formData.ativo.toString()} 
                onChange={handleChange}
                disabled={!isEditable}
                options={[
                    { value: "true", label: "Ativo" },
                    { value: "false", label: "Inativo" }
                ]}
            />

            <div className={styles.actions}>
                {!isEditable ? (
                    <button type="button" className={styles.btnSave} onClick={() => setIsEditable(true)}>
                        <Edit size={16} style={{ marginRight: 8 }} /> Editar Dados
                    </button>
                ) : (
                    <>
                        <button type="button" onClick={handleCancelClick} className={styles.btnCancel} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnSave} disabled={loading}>
                            {loading ? "Salvando..." : (
                                <>
                                    <Save size={18} style={{ marginRight: 8 }} />
                                    {mode === 'create' ? "Cadastrar Categoria" : "Salvar Alterações"}
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
}