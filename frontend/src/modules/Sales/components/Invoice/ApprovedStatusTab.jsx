import { MultiSelect } from "react-multi-select-component";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../../assets/global/url";
import React, { useState, useEffect, useContext } from "react";
import { RefreshContext } from "../../Invoice";
import BackloadModal from "./BackloadModal";

const ApprovedStatusTab = () => {
  const statusProps = useContext(RefreshContext);
  const {
    selectedCutOff,
    currencyId,
    customerOptions,
    setCustomerSearchValue,
    columns,
    handleUpdateInvoice,
    refreshKey,
    handleDeleteInvoice,
  } = statusProps;

  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [showBackloadModal, setShowBackloadModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState({
    invoiceId: null,
    transactionId: null,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [rotatedId, setRotatedId] = useState(null);

  const getApiUrl = () => {
    if (searchTerm.trim() !== "") {
      return `${BASE_URL}/invoice/getSalesData/search`;
    }
    if (selectedCustomer.length > 0) {
      return `${BASE_URL}/invoice/getSalesData/customer-filter`;
    }
    return `${BASE_URL}/invoice/getSalesData`;
  };

  const pagination = useServerPagination(getApiUrl(), 10, {
    startDate: selectedCutOff?.from,
    endDate: selectedCutOff?.to,
    status: ["Approved", "Partially Collected", "Collected", "Paid"],
    currencyId,
    ...(searchTerm.trim() !== "" && {
      searchTerm,
      filterColumn,
    }),
    ...(selectedCustomer.length > 0 && {
      selectedCustomer: selectedCustomer,
    }),
  });

  const columnsWithReturnItems = columns.map((column) => {
    if (column.name === "Action") {
      return {
        name: "Action",
        selector: (row) => {
          const status = row.status;
          const isReturned = status === "Returned";
          const isPending = status === "Pending";
          const isMenuOpen = openMenuId === row.sales_invoice_id;
          const isRotated = rotatedId === row.sales_invoice_id;

          return (
            <div className="d-flex align-items-center flex-column gap-2 p-3">
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: "#f8f9fa",
                  color: "#495057",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease-in-out",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                  e.currentTarget.style.borderColor = "#adb5bd";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.borderColor = "#dee2e6";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0, 0, 0, 0.05)";
                }}
                onClick={() => {
                  setOpenMenuId(isMenuOpen ? null : row.sales_invoice_id);
                  setRotatedId(isRotated ? null : row.sales_invoice_id);
                }}
              >
                <i
                  className="fa-solid fa-ellipsis-v"
                  style={{
                    transform: isRotated ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.3s ease-in-out",
                  }}
                ></i>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div
                  className="position-absolute bg-white border rounded shadow-sm "
                  style={{
                    top: "20px",
                    left: "-40px",
                    zIndex: 1000,
                    borderColor: "#dee2e6",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                    animation: "slideDown 0.2s ease-out",
                  }}
                >
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger text-decoration-none w-100 text-start p-2 fw-bold"
                    disabled={isReturned}
                    onClick={() => {
                      if (handleDeleteInvoice) {
                        handleDeleteInvoice(
                          row.sales_invoice_id,
                          row.invoice_date,
                          row,
                        );
                      }
                      setOpenMenuId(null);
                      setRotatedId(null);
                    }}
                  >
                    Delete
                  </button>

                  <hr className="m-1" />

                  {/* Return Items Button */}
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none w-100 text-start p-2 fw-bold"
                    style={{
                      color: "#FFA500",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoiceData({
                        invoiceId: row.sales_invoice_id,
                        transactionId: row.client_transaction_id,
                      });
                      setShowBackloadModal(true);
                      setOpenMenuId(null);
                      setRotatedId(null);
                    }}
                    disabled={status !== "Approved"}
                  >
                    Return Items
                  </button>
                </div>
              )}
            </div>
          );
        },
      };
    }
    return column;
  });
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
  };

  const handleCustomerChange = (selected) => {
    setSelectedCustomer(selected);
    if (selected.length > 0) {
      setSearchTerm("");
    }
  };

  const updatePaginationParams = () => {
    const apiUrl = getApiUrl();
    pagination.updateApiUrl(apiUrl);

    const params = {
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      status: ["Approved", "Partially Collected", "Collected"],
      currencyId,
    };

    // Add search params if searching
    if (searchTerm.trim() !== "") {
      params.searchTerm = searchTerm;
      params.filterColumn = filterColumn;
    }

    // Add customer filter params if customers selected
    if (selectedCustomer.length > 0) {
      params.selectedCustomer = selectedCustomer;
    }

    pagination.updateParams(params);
  };

  useEffect(() => {
    updatePaginationParams();
  }, [
    selectedCutOff,
    currencyId,
    searchTerm,
    filterColumn,
    selectedCustomer,
    refreshKey,
  ]);

  const handleCloseBackloadModal = () => {
    setShowBackloadModal(false);
    setSelectedInvoiceData({
      invoiceId: null,
      transactionId: null,
    });
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-12 col-md-4">
          <MultiSelect
            options={customerOptions}
            value={selectedCustomer}
            onChange={handleCustomerChange}
            labelledBy="Select Customer"
            // filterOptions={(options, filter) => {
            //   setCustomerSearchValue(filter);
            //   return options.filter(({ label }) =>
            //     label.toLowerCase().includes(filter.toLowerCase())
            //   );
            // }}
            debounceDuration={300}
            overrideStrings={{
              selectSomeItems: "Select Customer",
              search: "Search Customer",
            }}
          />
        </div>
        <div className="col-12 col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder={
                filterColumn === "all"
                  ? "Search"
                  : `Search by ${filterColumn}...`
              }
              value={searchTerm}
              onChange={handleSearch}
            />
            <button
              type="button"
              className="btn btn-outline-secondary dropdown-toggle-split"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="fa-solid fa-sliders"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className={`dropdown-item ${
                    filterColumn === "all" ? "active" : ""
                  }`}
                  onClick={() => handleFilterColumnSelect("all")}
                >
                  All
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              {[
                { value: "client_transaction_id", label: "Transaction ID" },
                { value: "destination", label: "Destination" },
                { value: "invoice_date", label: "Invoice Date" },
                { value: "due_date", label: "Due Date" },
                { value: "dr_number", label: "DR Number" },
                { value: "po_number", label: "PO Number" },
                { value: "total_amount", label: "Total Amount" },
              ].map(({ value, label }) => (
                <li key={value}>
                  <button
                    className={`dropdown-item ${
                      filterColumn === value ? "active" : ""
                    }`}
                    onClick={() => handleFilterColumnSelect(value)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="sales-invoice-data-table">
        <DataTable
          columns={columnsWithReturnItems}
          data={pagination.data}
          customStyles={customStyles}
          className="dataTable"
          onRowClicked={handleUpdateInvoice}
        />
        <PaginationControls {...pagination} />
      </div>

      <BackloadModal
        show={showBackloadModal}
        onHide={handleCloseBackloadModal}
        invoiceId={selectedInvoiceData.invoiceId}
        transactionId={selectedInvoiceData.transactionId}
      />
    </>
  );
};

export default ApprovedStatusTab;
