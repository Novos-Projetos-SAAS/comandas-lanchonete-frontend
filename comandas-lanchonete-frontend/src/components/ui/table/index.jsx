'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import styles from './index.module.css';

export default function Table({
  columns,
  data,
  isLoading,
  onSort,
  sortColumn,
  sortDirection
}) {
  // Array para gerar as linhas de "carregando falso" (Skeleton)
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col, index) => {
              // Verifica se a coluna é ordenável (tem accessor, handler e não é a coluna de ações)
              const isSortable = !!onSort && !!col.accessor && col.accessor !== 'id' && col.header !== 'Ações';
              const isActive = sortColumn === col.accessor;

              return (
                <th
                  key={index}
                  className={`${styles.th} ${isSortable ? styles.sortableTh : ''} ${col.className || ''}`}
                  onClick={() => isSortable && onSort(col.accessor)}
                >
                  <div className={styles.thContent}>
                    {col.header}

                    {/* Ícone de Ordenação */}
                    {isSortable && (
                      <span className={styles.sortIcon}>
                        {isActive ? (
                          sortDirection === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            skeletonRows.map((_, rowIndex) => (
              <tr key={`skel-${rowIndex}`} className={styles.tr}>
                {columns.map((_, colIndex) => (
                  <td key={`skel-col-${colIndex}`} className={styles.td}>
                    <div className={styles.skeletonBar} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <>
              {data && data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`${styles.tr} ${styles.dataRow}`}>
                    {columns.map((col, colIndex) => {
                      const value = row[col.accessor];

                      return (
                        <td
                          key={colIndex}
                          className={`${styles.td} ${col.className || ''}`}
                        >
                          {/* Se a coluna tiver um render customizado (como o Status), usa ele. Senão, mostra o valor cru */}
                          {col.render ? col.render(value, row, rowIndex) : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className={styles.empty}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
