"use client"

import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import styles from "./index.module.css";

export default function AberturaCaixa({ onAbrir, isLoading }) {
    const [saldoInicial, setSaldoInicial] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valorTratado = saldoInicial ? parseFloat(saldoInicial.replace(',', '.')) : 0;
        await onAbrir(valorTratado);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                
                <div className={styles.header}>
                    <div className={styles.iconBox}>
                        <Wallet size={40} />
                    </div>
                    <h2 className={styles.title}>Caixa Fechado</h2>
                    <p className={styles.subtitle}>
                        Para iniciar as operações, informe o fundo de troco atual da gaveta.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Saldo Inicial (Troco)
                        </label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currency}>R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={saldoInicial}
                                onChange={(e) => setSaldoInicial(e.target.value)}
                                className={styles.input}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.btnSave}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinnerIcon} />
                                Abrindo Caixa...
                            </>
                        ) : (
                            "Abrir Caixa"
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}