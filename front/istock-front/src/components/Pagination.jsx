// components/Pagination.jsx
export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goto = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <div className="pagination">
      <div className="pagination__info">
        Página {page} de {totalPages} — {total} resultados
      </div>
      <div className="pagination__controls">
        <button
          className="btn btn--ghost"
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <button
          className="btn btn--ghost"
          onClick={() => goto(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
