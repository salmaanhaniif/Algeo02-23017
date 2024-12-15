import React from "react";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);

  const renderNumber = (pageNumber: number) => (
    <button
      key={pageNumber}
      onClick={() => onPageChange(pageNumber)}
      className={`pagination-button ${pageNumber === page ? 'pagination-button-active' : ''}`}
      disabled={pageNumber === page}
    >
      {pageNumber}
    </button>
  );

  const renderPageNumbers = () => {
    let numbers = [];

    // Jika total halaman <= 3, tampilkan semua halaman
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(renderNumber(i));
      }
    } else {
      // Selalu tampilkan halaman pertama
      numbers.push(renderNumber(1));

      // Tampilkan "..." jika halaman saat ini lebih dari 3 dan tidak dekat dengan halaman terakhir
      if (page > 3) {
        numbers.push(<span key="dots-start" className="pagination-dots">...</span>);
      }

      // Tampilkan halaman sebelumnya dan berikutnya dalam rentang halaman aktif
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        numbers.push(renderNumber(i));
      }

      // Tampilkan "..." jika halaman saat ini lebih jauh dari halaman terakhir
      if (page < totalPages - 2) {
        numbers.push(<span key="dots-end" className="pagination-dots">...</span>);
      }

      // Selalu tampilkan halaman terakhir
      numbers.push(renderNumber(totalPages));
    }

    return numbers;
  };

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="pagination-button"
      >
        Prev
      </button>
      {renderPageNumbers()}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="pagination-button"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
