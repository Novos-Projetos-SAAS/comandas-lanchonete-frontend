"use client";
import { useId } from "react";
import styles from "./index.module.css";

export default function SelectForm({ label, name, options = [], value, onChange, error, placeholder = "Selecione...", ...props }) {
    const generatedId = useId();
    const inputId = props.id || name || generatedId;
    const errorId = inputId + "-error";
    const describedBy = [props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined;
    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
            
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`${styles.select} ${error ? styles.inputError : ""}`}
                {...props}
                id={inputId}
                aria-invalid={error ? true : props["aria-invalid"]}
                aria-describedby={describedBy}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            
            {error && <span id={errorId} role="alert" className={styles.errorText}>{error}</span>}
        </div>
    );
}