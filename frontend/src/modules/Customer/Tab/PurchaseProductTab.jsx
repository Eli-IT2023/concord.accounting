import React, { useState, useEffect, useRef } from "react";
import BASE_URL from "../../../assets/global/url";
import { format, parse } from "date-fns";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";

function PurchaseProductTab({ customerId }) {
  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  // Initialize default pagination
  const pagination = useServerPagination(
    `${BASE_URL}/customer/getCustomerApprovedInvoices/${customerId}`,
    10,
    {}
  );

  // Initialize search pagination
  const searchPagination = useServerPagination(
    `${BASE_URL}/customer/getCustomerApprovedInvoices/${customerId}/search`,
    10,
    {
      searchText: searchTerm,
      filterColumn: "all",
    }
  );

  // Normalize date format for search
  const normalizeDateForSearch = (input) => {
    if (!input) return input;

    // Try multiple date formats
    const formats = [
      "MMM/dd/yyyy", // Jan/05/2026
      "MM/dd/yyyy",  // 01/05/2026
      "yyyy-MM-dd",  // 2026-01-05
      "MMM/dd/yy",   // Jan/05/26
      "MM/dd/yy",    // 01/05/26
      "dd/MM/yyyy",  // 05/01/2026
    ];

    for (let fmt of formats) {
      try {
        const parsed = parse(input, fmt, new Date());
        if (!isNaN(parsed)) {
          return format(parsed, "yyyy-MM-dd");
        }
      } catch (e) {
        // Continue to next format
      }
    }

    // If no date format matched, return original input (might be transaction number)
    return input;
  };

  // Transform pagination data to display format
  useEffect(() => {
    const responseData = isSearching ? searchPagination.data : pagination.data;

    // Extract data array - handle both response formats
    const invoices = Array.isArray(responseData)
      ? responseData
      : responseData?.data || [];

    if (invoices && invoices.length > 0) {
      const transformedData = invoices.map((invoice) => ({
        sales_invoice_id: invoice.sales_invoice_id,
        transactionDate: invoice.createdAt,
        transactionNumber: invoice.client_transaction_id,
        destination: invoice.destination,
        purchaseDate: invoice.invoice_date,
        dateApproved: invoice.date_approved,
        totalAmount: invoice.total_amount,
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
        // Normalize the search term before sending
        const normalizedSearchTerm = normalizeDateForSearch(value.trim());
        
        // Update search pagination with normalized search term
        searchPagination.updateParams({
          searchText: normalizedSearchTerm,
          filterColumn: "all",
        });
      } else {
        // Auto clear when search term is empty
        setIsSearching(false);
        pagination.updateParams({});
      }
    }, 300); // 300ms debounce delay
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
          placeholder="Search by Transaction Number or Date (e.g., Jan/05/2026, 01/05/2026, or INV-001)..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
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
              purchaseData.map((invoice, index) => (
                <tr key={`${invoice.sales_invoice_id}-${index}`}>
                  <td className="p-2">
                    {invoice.transactionDate
                      ? format(new Date(invoice.transactionDate), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">{invoice.transactionNumber}</td>
                  <td className="p-2">{invoice.destination}</td>
                  <td className="p-2">
                    {invoice.purchaseDate
                      ? format(new Date(invoice.purchaseDate), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {invoice.dateApproved
                      ? format(new Date(invoice.dateApproved), "MMM/dd/yyyy")
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {`₱ ${parseFloat(invoice.totalAmount).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`}
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

export default PurchaseProductTab;