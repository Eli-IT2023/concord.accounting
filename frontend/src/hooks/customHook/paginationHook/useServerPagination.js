// useServerPagination.js - Modified hook for server-side pagination
import { useState, useEffect } from "react";
import axios from "axios";

export const useServerPagination = (
  apiUrl,
  initialLimit = 10,
  initialParams = {},
  page
) => {
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [dynamicApiUrl, setDynamicApiUrl] = useState(apiUrl);
  const [httpMethod, setHttpMethod] = useState("GET");

  useEffect(() => {
    if (dynamicApiUrl) {
      fetchData();
    }
  }, [currentPage, itemsPerPage, params, dynamicApiUrl]);

  const updateApiUrl = (newUrl) => {
    setDynamicApiUrl(newUrl);
    setCurrentPage(1); // Reset to page 1 on URL change
  };

  const updateHttpMethod = (newMethod) => {
    setHttpMethod(newMethod);
    setCurrentPage(1); // Reset to page 1 on URL change
  };

  const fetchData = async () => {
    // Skip fetch when using a placeholder URL (e.g., "about:blank")
    if (!dynamicApiUrl || String(dynamicApiUrl).startsWith("about:")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (httpMethod === "GET") {
        response = await axios.get(`${dynamicApiUrl}`, {
          params: {
            ...params,
            page: currentPage,
            limit: itemsPerPage,
          },
        });
      }

      if (httpMethod === "POST") {
        response = await axios.post(`${dynamicApiUrl}`, {
          ...params,
          page: currentPage,
          limit: itemsPerPage,
        });
      }

      setData(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
      console.error("Error fetching data:", err);
    }
  };

  // Fetch data whenever page or limit changes
  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, params]);

  // const updateParams = (newParams) => {
  //   setParams((prev) => ({ ...prev, ...newParams }));
  //   if (newParams?.searchText || newParams?.searchTerm) setCurrentPage(1); // Reset to page 1 on filter change
  // };
  const updateParams = (newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
    if (JSON.stringify(params) !== JSON.stringify(newParams)) setCurrentPage(1);
    if (newParams?.searchText || newParams?.searchTerm) setCurrentPage(1); // Reset to page 1 on filter change
    // setCurrentPage(1); // Reset to page 1 on filter change
  };

  // Navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const firstPage = () => {
    setCurrentPage(1);
  };

  const lastPage = () => {
    setCurrentPage(totalPages);
  };

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
    data,
    setData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    setTotalPages,
    totalItems,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeItemsPerPage,
    getPageNumbers,
    refreshData: fetchData,
    updateHttpMethod,
    updateParams,
    updateApiUrl,
    dynamicApiUrl,
  };
};
