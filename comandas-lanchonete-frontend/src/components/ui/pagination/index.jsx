'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import styles from "./index.module.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Se não houver páginas suficientes para paginar, não renderiza nada
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className={styles.container}>
      
      <span className={styles.info}>
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>

      <div className={styles.controls}>
        
        {/* Botão Primeira Página (<<) */}
        <button
          className={styles.button}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Primeira Página"
        >
          <ChevronsLeft size={20} />
        </button>

        {/* Botão Anterior (<) */}
        <button
          className={styles.button}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Página Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Botão Próxima (>) */}
        <button
          className={styles.button}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Próxima Página"
        >
          <ChevronRight size={20} />
        </button>

        {/* Botão Última Página (>>) */}
        <button
          className={styles.button}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Última Página"
        >
          <ChevronsRight size={20} />
        </button>

      </div>
    </div>
  );
}