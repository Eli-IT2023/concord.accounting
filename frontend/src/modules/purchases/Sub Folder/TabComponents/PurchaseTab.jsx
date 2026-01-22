import React, { useState, useEffect, useRef } from "react";
import BASE_URL from "../../../../assets/global/url";
import { format } from "date-fns";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

function PurchaseTab({ vendorId }) {
  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  // Initialize server pagination
  const pagination = useServerPagination(
    `${BASE_URL}/payable/getInfobyVendor`,
    10,
    {
      id: vendorId,
      module: "local",
    }
  );

  // Search pagination hook
  const searchPagination = useServerPagination(
    `${BASE_URL}/payable/getInfobyVendor/search`,
    10,
    {
      id: vendorId,
      module: "local",
      searchText: searchTerm,
    }
  );

  // Transform pagination data to display format
  useEffect(() => {
    const data = isSearching ? searchPagination.data : pagination.data;

    if (data && data.isFetch && data.isFetch.length > 0) {
      const transformedData = data.isFetch.map((item) => ({
        transaction_date: item.createdAt,
        transaction_id: item.transaction_id || item.client_transaction_id,
        destination: item.domestic_type,
        purchase_date: item.purchaseDate,
        date_approved: item.date_approved,
        total_amount: item.totalPrice || item.totalAmount || 0,
        currency: item.currency?.currency_name || "PHP",
      }));
      setPurchaseData(transformedData);
    } else {
      setPurchaseData([]);
    }
  }, [pagination.data, searchPagination.data, isSearching]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (value.trim() !== "") {
        setIsSearching(true);
        searchPagination.updateParams({
          id: vendorId,
          module: "local",
          searchText: value,
        });
      } else {
        // Auto clear when search term is empty
        setIsSearching(false);
        pagination.updateParams({
          id: vendorId,
          module: "local",
        });
      }
    }, 500); // 500ms debounce delay
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isLoading = isSearching ? searchPagination.loading : pagination.loading;
  const currentPagination = isSearching ? searchPagination : pagination;

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Transaction Number or Date..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th className="p-2">Transaction Date</th>
              <th className="p-2">Transaction Number</th>
              <th className="p-2">Destination</th>
              <th className="p-2">Purchase Date</th>
              <th className="p-2">Date Approved</th>
              <th className="p-2">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchaseData.length > 0 ? (
              purchaseData.map((data, index) => (
                <tr key={index}>
                  <td className="p-2">
                    {data.transaction_date
                      ? format(new Date(data.transaction_date), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">{data.transaction_id}</td>
                  <td className="p-2">
                    {data.destination === "local" ? "Local" : "Overseas"}
                  </td>
                  <td className="p-2">
                    {data.purchase_date
                      ? format(new Date(data.purchase_date), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {data.date_approved
                      ? format(new Date(data.date_approved), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {`${data.currency} ${parseFloat(
                      data.total_amount
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted p-4">
                  <em>
                    {isSearching && searchTerm.trim() !== ""
                      ? "No results found"
                      : "No purchase data available"}
                  </em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls {...currentPagination} />
    </div>
  );
}

export default PurchaseTab;
