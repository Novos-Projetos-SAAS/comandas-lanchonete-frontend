"use client";
import styles from "./index.module.css";

export default function InputForm({ label, name, type = "text", error, ...props }) {
    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={name} className={styles.label}>{label}</label>}
            
            <input
                id={name}
                name={name}
                type={type}
                className={`${styles.input} ${error ? styles.inputError : ""}`}
                {...props}
            />
            
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}