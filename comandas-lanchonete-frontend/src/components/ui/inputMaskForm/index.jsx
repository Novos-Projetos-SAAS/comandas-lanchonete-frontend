"use client";
import { IMaskInput } from "react-imask";
import { useId } from "react";
import styles from "./index.module.css";

export default function InputMaskForm({ label, name, mask, value, onChange, error, ...props }) {
    const generatedId = useId();
    const inputId = props.id || name || generatedId;
    const errorId = inputId + "-error";
    const describedBy = [props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined;
    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
            
            <IMaskInput
                name={name}
                mask={mask}
                value={value || ''}
                // Dispara o onChange no mesmo formato que um input normal (target.name, target.value)
                onAccept={(val) => onChange({ target: { name, value: val } })} 
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                {...props}
                id={inputId}
                aria-invalid={error ? true : props["aria-invalid"]}
                aria-describedby={describedBy}
            />
            
            {error && <span id={errorId} role="alert" className={styles.errorText}>{error}</span>}
        </div>
    );
}