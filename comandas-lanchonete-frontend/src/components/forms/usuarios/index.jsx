'use client'

import { useState } from "react";
import Image from "next/image";
import { validateEmail, validatePassword, getPasswordIssues } from "@/utils/validators"; // 🟢 Import de validadores
import InputForm from "@/components/ui/inputForm";
import SelectForm from "@/components/ui/selectForm";
import { Edit, Save, Send, Copy, Check, Eye, EyeOff, X } from "lucide-react"; // 🟢 Ícones Eye, EyeOff e X adicionados
import styles from "./index.module.css"; 
import { useConvites } from "@/hooks/useConvites";

// 🟢 Componente visual para cada item do checklist de requisitos da senha
const PasswordReqItem = ({ label, met }) => (
    <div className={`${styles.reqItem} ${met ? styles.success : styles.pending}`}>
        {met ? <Check size={12} /> : <X size={12} />}
        <span>{label}</span>
    </div>
);

// 🟢 Lista padrão de regras da senha
const allPasswordRules = [
    "Mínimo de 12 caracteres",
    "Pelo menos uma letra maiúscula",
    "Pelo menos uma letra minúscula",
    "Pelo menos um número",
    "Pelo menos um caractere especial (!@#$...)"
];

export default function UsuarioForm({ 
    initialData, 
    mode = 'create', 
    onSave, 
    onCancel,
    cargosList = [] 
}) {
    const [loading, setLoading] = useState(false);
    const [isEditable, setIsEditable] = useState(mode === 'create' || mode === 'edit');
    const [showPassword, setShowPassword] = useState(false); // 🟢 Estado para mostrar/ocultar senha
    const [errors, setErrors] = useState({});

    // Abas: 'direto' ou 'convite'
    const [tab, setTab] = useState("direto");
    const [conviteGerado, setConviteGerado] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [erroConvite, setErroConvite] = useState("");

    const { gerarConvite, loading: loadingConvite } = useConvites();

    const [formData, setFormData] = useState({
        id: initialData?.id || null,
        nome: initialData?.nome || "",
        email: initialData?.email || "",
        cargo_id: initialData?.cargo_id?.toString() || "", 
        ativo: initialData?.ativo ?? true,
        senha: "", 
    });

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

    // 🟢 Avaliação em tempo real dos requisitos da senha
    const passwordIssues = getPasswordIssues(formData.senha);
    const isPasswordValid = validatePassword(formData.senha);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        let finalValue = value;
        if (name === 'ativo') {
            finalValue = value === 'true';
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (erroConvite) setErroConvite("");
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nome || formData.nome.trim().length < 3) {
            newErrors.nome = "O nome deve ter pelo menos 3 caracteres.";
        }
        
        if (!formData.email || !validateEmail(formData.email)) {
            newErrors.email = "Insira um endereço de e-mail válido.";
        }

        if (!formData.cargo_id) {
            newErrors.cargo_id = "Selecione um cargo para o usuário.";
        }

        // 🟢 Validação de Senha baseada nas regras de segurança
        const isTypingPassword = formData.senha && formData.senha.length > 0;
        if (mode === 'create' || (mode === 'edit' && isTypingPassword)) {
            if (!isPasswordValid) {
                newErrors.senha = "A senha não atende a todos os requisitos de segurança.";
            }
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
            cargo_id: Number(formData.cargo_id), 
            ativo: formData.ativo
        };

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

    const handleGerarConvite = async (e) => {
        e.preventDefault();
        setErroConvite("");

        if (!formData.cargo_id) {
            setErroConvite("Selecione um cargo para gerar o link de convite.");
            return;
        }

        try {
            const dadosConvite = await gerarConvite({ cargo_id: Number(formData.cargo_id) });
            setConviteGerado(dadosConvite);
        } catch (err) {
            setErroConvite(err.response?.data?.message || err.message || "Erro ao gerar convite.");
        }
    };

    const copiarLink = () => {
        if (conviteGerado?.linkCadastro) {
            navigator.clipboard.writeText(conviteGerado.linkCadastro);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 3000);
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
        <div className={styles.wrapper}>
            {/* 🟢 ABAS DE OPÇÃO NO TOPO (Apenas na Criação) */}
            {mode === 'create' && (
                <div className={styles.tabsContainer}>
                    <button
                        type="button"
                        onClick={() => { setTab("direto"); setErroConvite(""); }}
                        className={`${styles.tabBtn} ${tab === "direto" ? styles.tabActive : ""}`}
                    >
                        Cadastro Direto
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab("convite"); setErrors({}); }}
                        className={`${styles.tabBtn} ${tab === "convite" ? styles.tabActive : ""}`}
                    >
                        <Send size={16} /> Gerar Link de Convite
                    </button>
                </div>
            )}

            {/* 🟢 ABA 1 / EDIÇÃO / VISUALIZAÇÃO: Formulário Principal */}
            {(tab === "direto" || mode !== 'create') && (
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

                    {/* 🟢 BLOCO DA SENHA COM AJUDA E CHECKLIST (OCUPANDO 2 COLUNAS PARA MELHOR VISUALIZAÇÃO) */}
                    <div className={styles.passwordWrapperBox} style={{ gridColumn: '1 / -1' }}>
                        <InputForm
                            label={mode === 'create' ? "Senha de Acesso" : "Nova Senha"}
                            name="senha"
                            type={showPassword ? "text" : "password"}
                            placeholder={mode === 'create' ? "Mínimo 8 caracteres" : "Deixe em branco para manter a atual"}
                            value={formData.senha}
                            onChange={handleChange}
                            disabled={!isEditable}
                            error={errors.senha}
                        />

                        {/* 🟢 Botão de Mostrar / Ocultar Senha */}
                        {isEditable && (
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Ocultar senha" : "Ver senha"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}

                        {/* 🟢 Texto explicativo ao editar uma conta */}
                        {isEditable && initialData?.id && (
                            <span className={styles.passwordHelpText}>
                                💡 Se não quiser alterar a senha atual deste usuário, basta deixar este campo vazio.
                            </span>
                        )}

                        {/* 🟢 Checklist visual exibido enquanto o usuário digita uma senha inválida */}
                        {isEditable && formData.senha && formData.senha.length > 0 && !isPasswordValid && (
                            <div className={styles.passwordRequirements}>
                                {allPasswordRules.map((rule) => (
                                    <PasswordReqItem
                                        key={rule}
                                        label={rule}
                                        met={!passwordIssues.includes(rule)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

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
            )}

            {/* 🟢 ABA 2: Gerar Link de Convite */}
            {mode === 'create' && tab === "convite" && (
                <div className={styles.conviteWrapper}>
                    <p className={styles.conviteText}>
                        O sistema gerará um link exclusivo (com validade de 2 horas) para o funcionário se cadastrar sozinho escolhendo a própria senha.
                    </p>

                    {erroConvite && <div className={styles.errorBox}>{erroConvite}</div>}

                    <form onSubmit={handleGerarConvite} className={styles.form}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <SelectForm
                                label="Cargo do Novo Funcionário *"
                                name="cargo_id"
                                value={formData.cargo_id} 
                                onChange={handleChange}
                                options={opcoesCargos}
                                placeholder="Selecione para qual cargo será o convite..."
                            />
                        </div>

                        <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
                            <button type="button" onClick={onCancel} className={styles.btnCancel} disabled={loadingConvite}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.btnSave} disabled={loadingConvite}>
                                {loadingConvite ? "Gerando..." : "Gerar Link Agora"}
                            </button>
                        </div>
                    </form>

                    {/* Exibição do link gerado */}
                    {conviteGerado && (
                        <div className={styles.linkResultBox}>
                            <span className={styles.linkSuccessTitle}>🎉 Link de convite gerado!</span>
                            <p className={styles.linkInfo}>
                                Expira em: <strong>{new Date(conviteGerado.expira_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({conviteGerado.cargo_nome})
                            </p>

                            {conviteGerado.imagem_qrcode && (
                                <div className={styles.qrCodeWrapper}>
                                    {/* <img 
                                        src={conviteGerado.imagem_qrcode} 
                                        alt="QR Code para Cadastro" 
                                        className={styles.qrCodeImage}
                                    /> */}
                                    
                                    <Image 
                                        src={conviteGerado.imagem_qrcode} 
                                        alt="QR Code para Cadastro" 
                                        width={180}
                                        height={180}
                                        className={styles.qrCodeImage}
                                        unoptimized
                                    />
                                    <span className={styles.qrCodeHint}>
                                        Peça ao funcionário para escanear com a câmera do celular para abrir a tela de cadastro.
                                    </span>
                                    <a 
                                        href={conviteGerado.imagem_qrcode} 
                                        download={`qrcode-convite-${conviteGerado.cargo_nome.toLowerCase().replace(/\s+/g, '-')}.png`}
                                        className={styles.btnDownloadQr}
                                    >
                                        Baixar QR Code PNG
                                    </a>
                                </div>
                            )}

                            <div className={styles.copyWrapper}>
                                <input
                                    type="text"
                                    readOnly
                                    value={conviteGerado.linkCadastro}
                                    className={styles.inputCopy}
                                />
                                <button type="button" onClick={copiarLink} className={styles.btnCopy}>
                                    {copiado ? <Check size={18} /> : <Copy size={18} />}
                                    {copiado ? "Copiado!" : "Copiar Link"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}