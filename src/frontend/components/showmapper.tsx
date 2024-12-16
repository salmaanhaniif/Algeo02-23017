import React, { useState, useEffect } from "react";
import "../app/globals.css";

interface TableData {
  Title: string;
  Music: string;
  Image: string;
}

const ITEMS_PER_PAGE = 12;

/* Fungsi untuk menghitung data yang harus ditampilkan di halaman tertentu */
const paginate = <T,>(data: T[], page: number, itemsPerPage: number): T[] => {
  const startIndex = (page - 1) * itemsPerPage;
  return data.slice(startIndex, startIndex + itemsPerPage);
};

const Mapper: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]); // Tambahkan state untuk headers
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/uploads/mapper.txt");
      const text = await response.text();
      const rows = text.split("\n").map((row) => row.split("\uFFF9"));
      
      setHeaders(rows[0]); // Set headers dari baris pertama
      const data = rows.slice(1).map((row) => {
        const rowData: TableData = {
          Title: row[0],
          Music: row[1],
          Image: row[2],
        };
        return rowData;
      });
      setTableData(data);
    };

    if (isOpen) fetchData();
  }, [isOpen]);

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
  const currentData = paginate(tableData, currentPage, ITEMS_PER_PAGE);

  const handleBack = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="mapper">
        <button className="closeButton" onClick={onClose}>
        close
        </button>
        <h2>Data Mapper</h2>
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              {headers.slice(0,3).map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={index}>
                <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                <td>{row.Title}</td>
                <td>{row.Music}</td>
                <td>{row.Image}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={handleBack} disabled={currentPage === 1}>
          <span className="icon-flip">➤</span>
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages}>
              ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mapper;
