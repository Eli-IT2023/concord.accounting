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

const SalesTransactionListModal = ({ activeTab }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();

  const debounceTimer = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [expandedData, setExpandedData] = useState({});
  const [expandedRowId, setExpandedRowId] = useState(null);

  const columns = [
    {
      name: "", // or "Details"
      button: true, // marks it as non-sortable etc.
      cell: () => null, // or any custom content
    },
    {
      name: "Customer Name",
      selector: (row) => row.customerName,
    },
    {
      name: "Country",
      selector: (row) => row.country,
    },
    {
      name: "Remaining Balance",
      selector: (row) =>
        row.remainingBalance.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
  ];

  const pagination = useServerPagination("about:blank", 10); // dummy init
  const paginationDropdown = useServerPagination("about:blank", 10); // dummy init

  const fetchData = () => {
    pagination.updateApiUrl(BASE_URL + "/invoice/transaction-list/customers");
    pagination.updateParams({ domestic_type: activeTab });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(
        `${BASE_URL}/invoice/transaction-list/customers/search`
      );
      pagination.updateParams({ searchText: value, domestic_type: activeTab });
    }, 500);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(pagination.data);

  return (
    <>
      <div className="w-100 mt-3 container-fluid">
        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search Customer Name"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <DataTable
          customStyles={customStyles}
          columns={columns}
          className="dataTable"
          data={pagination.data}
          expandableRows
          expandableRowsHeader
          onRowExpandToggled={(expanded, row) => {
            if (expanded && !expandedData[row.id]) {
              // Fetch only if not yet loaded
              paginationDropdown.updateApiUrl(
                BASE_URL + "/invoice/transaction-list/transactions"
              );
              paginationDropdown.updateParams({
                customer_id: row.customer_id,
                domestic_type: activeTab,
              });

              setExpandedRowId(row.customer_id);
            } else {
              setExpandedRowId(null);
            }
          }}
          expandableRowExpanded={(row) => row.customer_id === expandedRowId}
          expandableRowsComponent={({ data }) => {
            const sales = paginationDropdown.data;

            return (
              <div>
                <h6>Sales Detail</h6>

                <table
                  className="table table-bordered table-sm"
                  style={{ cursor: "pointer" }}
                >
                  <thead>
                    <tr className="text-center">
                      <th>Transaction No.</th>
                      <th>Transaction Date</th>
                      <th>Date Created</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales && sales.length > 0 ? (
                      sales.map((sales_data) => (
                        <tr key={sales_data.id} className="text-center ">
                          <td>{sales_data.transaction_number}</td>
                          <td>
                            {format(sales_data.collection_date, "MMM/dd/yyyy")}
                          </td>
                          <td>{format(sales_data.createdAt, "MMM/dd/yyyy")}</td>

                          <td>
                            {sales_data.remainingBalance.toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td>{sales_data.status}</td>
                          <td>
                            {" "}
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
                                  (e.currentTarget.style.transform =
                                    "scale(1.1)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                                onClick={() => {
                                  navigate(
                                    `/sales/view-local-bulk-collection/${sales_data.id}?page=${paginationDropdown.currentPage}`
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
                                  (e.currentTarget.style.transform =
                                    "scale(1.1)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              ></i>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No sales found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls {...paginationDropdown} />
              </div>
            );
          }}
        />

        <PaginationControls {...pagination} />
      </div>
    </>
  );
};

export default SalesTransactionListModal;
