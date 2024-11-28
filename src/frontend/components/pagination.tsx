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
        className={`mx-1 px-3 py-1 w-4 border-none rounded text-sm transition-colors duration-200 hover:bg-gray-300 focus:outline-none ${
          pageNumber === page ? 'text-gray-600 font-bold bg-gray-200' : 'text-gray-500'
        }`}
      >
        {pageNumber}
      </button>
    );
  
    const renderPageNumbers = () => {
      let numbers = [];
  
      if (totalPages <= 3) {
        for (let i = 1; i <= totalPages; i++) {
          numbers.push(renderNumber(i));
        }
      } else {
        numbers.push(renderNumber(1));
        
        if (page > 3) {
          numbers.push(<span key="dots-start" className="mx-1 text-gray-500">...</span>);
        }
  
        for (let i = Math.max(2, page); i <= Math.min(totalPages - 1, page + 1); i++) {
          numbers.push(renderNumber(i));
        }
  
        if (page < totalPages - 2) {
          numbers.push(<span key="dots-end" className="mx-1 text-gray-500">...</span>);
        }
  
        numbers.push(renderNumber(totalPages));
      }
  
      return numbers;
    };
  
    return (
      <div className=" absolute bottom-2 left-0 w-[calc(100%-20px)] my-2 mx-[10px] mb-4 h-[45px] flex items-center justify-center z-100">
        <button
          onClick={() => onPageChange(page-1)}
          disabled={page === 1}
          className=" text-gray-500 px-2 py-1 border-none rounded text-sm hover:bg-gray-200 disabled:opacity-50"
        > Prev
          </button>
        {renderPageNumbers()}
        <button
          onClick={() => onPageChange(page+1)}
          disabled={page === totalPages} 
          className="text-gray-500 px-2 py-1 border-none rounded text-sm hover:bg-gray-200 disabled:opacity-50"
        > Next</button>
      </div>
    );
  };
  
  export default Pagination;
  