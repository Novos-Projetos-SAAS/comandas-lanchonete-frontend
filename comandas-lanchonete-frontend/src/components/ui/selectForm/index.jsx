"use client";
import styles from "./index.module.css";

export default function SelectForm({ label, name, options = [], value, onChange, error, placeholder = "Selecione...", ...props }) {
    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={name} className={styles.label}>{label}</label>}
            
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`${styles.select} ${error ? styles.inputError : ""}`}
                {...props}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}