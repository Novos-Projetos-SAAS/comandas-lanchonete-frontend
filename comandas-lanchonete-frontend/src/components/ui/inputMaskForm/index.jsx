"use client";
import { IMaskInput } from "react-imask";
import styles from "./index.module.css";

export default function InputMaskForm({ label, name, mask, value, onChange, error, ...props }) {
    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={name} className={styles.label}>{label}</label>}
            
            <IMaskInput
                id={name}
                name={name}
                mask={mask}
                value={value || ''}
                // Dispara o onChange no mesmo formato que um input normal (target.name, target.value)
                onAccept={(val) => onChange({ target: { name, value: val } })} 
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                {...props}
            />
            
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}