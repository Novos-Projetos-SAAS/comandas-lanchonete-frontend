'use client'

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useConvites } from "@/hooks/useConvites";

import { validateEmail, validatePassword, getPasswordIssues } from "@/utils/validators";

import InputForm from "@/components/ui/inputForm";

import { Eye, EyeOff, Check, X, ShieldAlert, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";

import styles from "./CadastroRestritoClient.module.css"; // 🟢 CSS exclusivo do Client

const PasswordReqItem = ({ label, met }) => (
    <div className={`${styles.reqItem} ${met ? styles.success : styles.pending}`}>
        {met ? <Check size={14} /> : <X size={14} />}
        <span>{label}</span>
    </div>
);

const allPasswordRules = [
    "Mínimo de 12 caracteres",
    "Pelo menos uma letra maiúscula",
    "Pelo menos uma letra minúscula",
    "Pelo menos um número",
    "Pelo menos um caractere especial (!@#$...)"
];

export default function CadastroRestritoClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const { consumirConvite, loading } = useConvites();

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: ""
    });

    const passwordIssues = getPasswordIssues(formData.senha);
    const isPasswordValid = validatePassword(formData.senha);

    if (!token) {
        return (
            <div className={styles.card}>
                <div className={styles.blockedContent}>
                    <div className={styles.iconBlockedWrapper}>
                        <ShieldAlert size={48} />
                    </div>
                    <h1 className={styles.blockedTitle}>Convite Inválido ou Ausente</h1>
                    <p className={styles.blockedText}>
                        Este link de cadastro precisa de um token de segurança para validação. 
                        Verifique se você copiou o link completo ou solicite um novo convite/QR Code ao administrador.
                    </p>
                    <button onClick={() => router.push("/login")} className={styles.btnReturn}>
                        Ir para a tela de Login
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nome || formData.nome.trim().length < 3) {
            newErrors.nome = "Digite seu nome completo (mínimo 3 letras).";
        }

        if (!formData.email || !validateEmail(formData.email)) {
            newErrors.email = "Insira um endereço de e-mail válido.";
        }

        if (!isPasswordValid) {
            newErrors.senha = "A senha precisa atender a todos os requisitos de segurança.";
        }

        if (formData.senha !== formData.confirmarSenha) {
            newErrors.confirmarSenha = "As senhas não coincidem.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await consumirConvite({
                nome: formData.nome,
                email: formData.email,
                senha: formData.senha,
                token_convite: token
            });

            await Swal.fire({
                title: 'Cadastro Concluído!',
                text: 'Sua conta foi criada com sucesso e vinculada ao seu cargo na equipe. Você já pode acessar o sistema!',
                icon: 'success',
                iconColor: '#16a34a',
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'Ir para o Login'
            });

            router.push("/login");
        } catch (error) {
            Swal.fire({
                title: 'Não foi possível cadastrar',
                text: error.response?.data?.message || 'Este convite pode ter expirado ou já foi utilizado.',
                icon: 'error',
                iconColor: '#dc2626',
                confirmButtonColor: '#dc2626'
            });
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.badgeWelcome}>Conclua seu Cadastro</span>
                <h1 className={styles.title}>Bem-vindo(a) à Equipe!</h1>
                <p className={styles.subtitle}>
                    Preencha seus dados abaixo e defina sua senha pessoal de acesso.
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.fieldFull}>
                    <InputForm
                        label="Seu Nome Completo"
                        name="nome"
                        placeholder="Ex: João da Silva"
                        value={formData.nome}
                        onChange={handleChange}
                        error={errors.nome}
                    />
                </div>

                <div className={styles.fieldFull}>
                    <InputForm
                        label="E-mail de Trabalho (ou Pessoal)"
                        name="email"
                        type="email"
                        placeholder="exemplo@lanchonete.com.br"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                    />
                </div>

                <div className={styles.passwordWrapperBox}>
                    <InputForm
                        label="Crie uma Senha Forte"
                        name="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo de 12 caracteres"
                        value={formData.senha}
                        onChange={handleChange}
                        error={errors.senha}
                    />
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {formData.senha.length > 0 && !isPasswordValid && (
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

                <div className={styles.fieldFull}>
                    <InputForm
                        label="Confirme sua Senha"
                        name="confirmarSenha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite a mesma senha novamente"
                        value={formData.confirmarSenha}
                        onChange={handleChange}
                        error={errors.confirmarSenha}
                    />
                </div>

                <div className={styles.actions}>
                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? (
                            "Cadastrando..."
                        ) : (
                            <>
                                <span>Concluir Cadastro</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}