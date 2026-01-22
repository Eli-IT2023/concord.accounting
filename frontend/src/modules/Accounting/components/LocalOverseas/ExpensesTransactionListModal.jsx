import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import { useNavigate, useSearchParams } from "react-router-dom";
import swal from "sweetalert";
import useDecodeToken from "../../../../hooks/customHook/useDecodeToken";
import { format, max } from "date-fns";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

const ExpensesTransactionListModal = ({ activeTab }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();

  const debounceTimer = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [expandedData, setExpandedData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);

  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.transaction_number,
    },
    {
      name: "Transaction Date",
      selector: (row) => format(row.pay_date, "MMM/dd/yyyy"),
    },
    {
      name: "Date Created",
      selector: (row) => format(row.createdAt, "MMM/dd/yyy, hh:mm a"),
    },
    {
      name: "Total Amount",
      selector: (row) =>
        row.remainingBalance.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
    {
      name: "Status",
      selector: (row) => row.status,
    },
    {
      name: "Action",
      selector: (row) => (
        <div className="d-flex justify-content-center align-items-center ">
          {" "}
          <i
            className="fa-solid fa-eye  text-primary me-2"
            style={{
              fontSize: "1.5rem",

              display: "inline-block",
              transition: "transform 0.2s ease-in-out",
              cursor: "pointer",
              opacity: 1, // Key change: use opacity
            }}
            title="Transaction Details"
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onClick={() => {
              navigate(
                `/accounting/view-pay-expenses/${activeTab}/${row.id}?page=${pagination.currentPage}`
              );
            }}
          ></i>
          <i
            className="d-none fas fa-trash"
            style={{
              color: "red",
              fontSize: "1.5rem",

              textDecoration: "underline",
              display: "inline-block",
              transition: "transform 0.2s ease-in-out",
              cursor: "pointer",
              opacity: 1, // Key change: use opacity
            }}
            title="Delete"
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          ></i>
        </div>
      ),
    },
  ];

  const pagination = useServerPagination("about:blank", 10); // dummy init

  const fetchData = () => {
    pagination.updateApiUrl(
      BASE_URL + "/expenses/transaction-list/expense-type/transactions"
    );
    pagination.updateParams({
      domestic_type: activeTab,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(
        `${BASE_URL}/expenses/transaction-list/expense-type/transactions/search`
      );
      pagination.updateParams({ searchText: value, domestic_type: activeTab });
    }, 500);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="w-100 mt-3 container-fluid">
        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search Expense Type"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <DataTable
          customStyles={customStyles}
          columns={columns}
          className="dataTable"
          data={pagination.data}
        />

        <PaginationControls {...pagination} />
      </div>
    </>
  );
};

export default ExpensesTransactionListModal;
