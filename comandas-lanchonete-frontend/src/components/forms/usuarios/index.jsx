'use client'

import { useState } from "react";
import InputForm from "@/components/ui/forms/InputForm.jsx"; 
import SelectForm from "@/components/ui/forms/SelectForm.jsx"; 
import { Edit, Save } from "lucide-react";
import styles from "./usuarioForm.module.css"; 

export default function UsuarioForm({ 
    initialData, 
    mode = 'create', 
    onSave, 
    onCancel,
    // 🟢 Recebe a lista de cargos da API para preencher o Select dinamicamente
    cargosList = [] 
}) {
    const [loading, setLoading] = useState(false);
    const [isEditable, setIsEditable] = useState(mode === 'create' || mode === 'edit');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        id: initialData?.id || null,
        nome: initialData?.nome || "",
        email: initialData?.email || "",
        // 🟢 Mantém como string no estado do input, mas converte para inteiro no envio
        cargo_id: initialData?.cargo_id?.toString() || "", 
        ativo: initialData?.ativo ?? true,
        senha: "", 
    });

    // Rastreador de ID para atualização sem useEffect (React 18+)
    const [prevId, setPrevId] = useState(initialData?.id);

    if (initialData?.id !== prevId) {
        setPrevId(initialData?.id);
        setFormData({
            id: initialData?.id || null,
            nome: initialData?.nome || "",
            email: initialData?.email || "",
            cargo_id: initialData?.cargo_id?.toString() || "",
            ativo: initialData?.ativo ?? true,
            senha: "",
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
        
        if (!formData.nome || formData.nome.trim().length < 3) {
            newErrors.nome = "O nome deve ter pelo menos 3 caracteres.";
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            newErrors.email = "Insira um endereço de e-mail válido.";
        }

        if (!formData.cargo_id) {
            newErrors.cargo_id = "Selecione um cargo para o usuário.";
        }

        // Senha obrigatória no cadastro, mas opcional na edição
        if (mode === 'create' && (!formData.senha || formData.senha.length < 6)) {
            newErrors.senha = "A senha deve ter pelo menos 6 caracteres.";
        } else if (mode === 'edit' && formData.senha && formData.senha.length < 6) {
            newErrors.senha = "A nova senha deve ter pelo menos 6 caracteres.";
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
            email: formData.email,
            // 🟢 Converte para inteiro (Integer), exatamente como o Knex espera na Chave Estrangeira
            cargo_id: Number(formData.cargo_id), 
            ativo: formData.ativo
        };

        // Só envia a senha no payload se o usuário digitou alguma coisa
        if (formData.senha) {
            payload.senha = formData.senha;
        }

        try {
            await onSave(payload);
            if (mode === 'edit') {
                setIsEditable(false);
                setFormData(prev => ({ ...prev, senha: "" })); 
            }
        } catch (error) {
            console.error("Erro no formulário de usuário:", error);
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
                email: initialData?.email || "",
                cargo_id: initialData?.cargo_id?.toString() || "",
                ativo: initialData?.ativo ?? true,
                senha: "",
            });
            setErrors({});
        } else {
            onCancel();
        }
    };

    // 🟢 Mapeia a lista de cargos da API para o formato que o SelectForm espera { value, label }
    // Se a lista vier vazia, usa um fallback básico provisório para você poder testar
    const opcoesCargos = cargosList.length > 0 
        ? cargosList.map(cargo => ({ value: cargo.id.toString(), label: cargo.nome }))
        : [
            { value: "1", label: "Administrador" },
            { value: "2", label: "Gerente" },
            { value: "3", label: "Caixa" },
            { value: "4", label: "Garçom" },
            { value: "5", label: "Cozinha" }
          ];

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {initialData && (
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputForm
                        label="ID do Usuário"
                        name="id"
                        value={initialData.id}
                        disabled={true}
                    />
                </div>
            )}

            <InputForm
                label="Nome Completo"
                name="nome"
                placeholder="Ex: João da Silva"
                value={formData.nome}
                onChange={handleChange}
                disabled={!isEditable}
                error={errors.nome}
            />

            <InputForm
                label="E-mail (Login)"
                name="email"
                type="email"
                placeholder="Ex: joao@lanchonete.com.br"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditable}
                error={errors.email}
            />

            <SelectForm
                label="Perfil de Acesso (Cargo)"
                name="cargo_id"
                value={formData.cargo_id} 
                onChange={handleChange}
                disabled={!isEditable}
                options={opcoesCargos}
                error={errors.cargo_id}
                placeholder="Selecione o cargo..."
            />

            <InputForm
                label={mode === 'create' ? "Senha de Acesso" : "Nova Senha (deixe em branco para manter)"}
                name="senha"
                type="password"
                placeholder={mode === 'create' ? "Mínimo 6 caracteres" : "••••••••"}
                value={formData.senha}
                onChange={handleChange}
                disabled={!isEditable}
                error={errors.senha}
            />

            <SelectForm
                label="Status da Conta"
                name="ativo"
                value={formData.ativo.toString()} 
                onChange={handleChange}
                disabled={!isEditable}
                options={[
                    { value: "true", label: "Ativo (Acesso Permitido)" },
                    { value: "false", label: "Inativo (Acesso Bloqueado)" }
                ]}
            />

            <div className={styles.actions}>
                {!isEditable ? (
                    <button type="button" className={styles.btnSave} onClick={() => setIsEditable(true)}>
                        <Edit size={16} style={{ marginRight: 8 }} /> Editar Usuário
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
                                    {mode === 'create' ? "Cadastrar Usuário" : "Salvar Alterações"}
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
}