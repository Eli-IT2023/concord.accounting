// usePagination.js - Custom hook for pagination
import { useState, useMemo, useEffect } from "react";

export const usePagination = (data, itemsPerPageDefault = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageDefault);
  const [totalPages, setTotalPages] = useState(1);

  // Calculate the actual data to display and pagination info
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedData = data?.slice(startIndex, endIndex);

    // Update total pages when data or itemsPerPage changes
    const newTotalPages = Math.ceil(data?.length / itemsPerPage);
    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages);
      // Adjust current page if it exceeds the new total
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }

    return slicedData;
  }, [data, currentPage, itemsPerPage, totalPages]);

  // Navigate to specific page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to first page
  const firstPage = () => {
    setCurrentPage(1);
  };

  // Go to last page
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  // Change items per page
  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for display (with ellipsis)
  const getPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 7) {
      // If we have 7 or fewer pages, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Add ellipsis or additional page numbers
      if (currentPage > 3) {
        pageNumbers.push("...");
      }

      // Add pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push("...");
      }

      // Always include last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeItemsPerPage,
    getPageNumbers,
  };
};

// PaginationControls.js - Reusable pagination component
export const PaginationControls = ({
  itemsPerPage,
  currentPage,
  totalPages,
  changeItemsPerPage,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  getPageNumbers,
  Module,
}) => {
  // const [searchParams, setSearchParams] = useSearchParams();

  // const setRemeberPaginationState = () => {
  //   const selectedPage = {
  //     selectedPage: currentPage,
  //     showedItems: itemsPerPage,
  //   };
  //   localStorage.setItem(`${Module}_pagination`, JSON.stringify(selectedPage));
  // };

  // useEffect(() => {
  //   setRemeberPaginationState();
  // }, [currentPage, itemsPerPage]);

  const removepaginationLocalStorage = () => {
    // localStorage.removeItem(`${Module}_pagination`);
  };

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="d-flex align-items-center">
        <span className="me-2">Show</span>
        <select
          className="form-select form-select-sm"
          //   style={{ width: "100px" }}
          value={itemsPerPage}
          onChange={(e) => {
            changeItemsPerPage(e.target.value);
            // setSearchParams((prev) => {
            //   prev.set("items-shown", e.target.value);
            //   return prev;
            // });
            removepaginationLocalStorage();
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className="page-item px-1">
            <button
              className="page-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                firstPage();
                removepaginationLocalStorage();
              }}
              disabled={currentPage === 1}
              style={{ padding: "0 5px", minHeight: "1.7rem" }}
            >
              <span aria-hidden="true">&laquo;&laquo;</span>
            </button>
          </li>
          <li className="page-item px-1">
            <button
              className="page-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevPage();
                removepaginationLocalStorage();
              }}
              disabled={currentPage === 1}
              style={{ padding: "0 5px", minHeight: "1.7rem" }}
            >
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>

          {getPageNumbers().map((pageNum, index) =>
            pageNum === "..." ? (
              <li key={`ellipsis-${index}`} className="page-item disabled px-2">
                <span className="page-link">...</span>
              </li>
            ) : (
              <li
                key={`page-${pageNum}`}
                className={`px-1 page-item ${
                  currentPage === pageNum ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  style={{
                    background: currentPage === pageNum ? "#2F80ED" : "none",
                    padding: "0 8px",
                    borderRadius: "6px",
                    minHeight: "1.7rem",
                    color: currentPage === pageNum ? "white" : "inherit", // Optional: change text color when active
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToPage(pageNum);
                    removepaginationLocalStorage();
                  }}
                >
                  {pageNum}
                </button>
              </li>
            )
          )}

          <li className="page-item px-1">
            <button
              className="page-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextPage();
              }}
              disabled={currentPage === totalPages}
              style={{ padding: "0 5px", minHeight: "1.7rem" }}
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
          <li className="page-item px-1">
            <button
              className="page-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                lastPage();
                removepaginationLocalStorage();
              }}
              disabled={currentPage === totalPages}
              style={{ padding: "0 5px", minHeight: "1.7rem" }}
            >
              <span aria-hidden="true">&raquo;&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
