import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format, max } from "date-fns";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useValidPage } from "../../../hooks/customHook/paginationHook/useValidPage";
import { Button, Modal } from "react-bootstrap";

const ModalContentPO = ({ activeTab }) => {
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
      name: "Company Name",
      selector: (row) => row.company_name,
    },
    {
      name: "Country",
      selector: (row) => row.company_country,
    },
    {
      name: "Remaining Balance",
      selector: (row) =>
        row.total_remaining_balance.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
  ];

  const pagination = useServerPagination("about:blank", 10); // dummy init
  const paginationDropdown = useServerPagination("about:blank", 10); // dummy init

  const fetchData = (cutOff) => {
    pagination.updateApiUrl(BASE_URL + "/payable/fetch_customer_with_payable");
    pagination.updateParams({ domestic_type: activeTab });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(
        `${BASE_URL}/payable/fetch_customer_with_payable/search`
      );
      pagination.updateParams({ searchText: value, domestic_type: activeTab });
    }, 500);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeletePayable = async (
    primary_id,
    purchase_date,
    transaction_id
  ) => {
    swal({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/payable/localOverseasdeletePayable/`,
            {
              params: {
                primary_id,
                purchase_date,
                transaction_id,
                userLoggedID,
              },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Purchase Payment Deleted Successfully!",
              text: "The purchase payment has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              paginationDropdown.refreshData();
            });
          } else if (response.status === 201) {
            swal({
              title: "Delete Prohibited!",
              text: `Date (${response.data.purchase_date}) cannot be deleted as its payable date falls within the posted cutoff period named "${response.data.cutoff_name}".`,
              icon: "warning",
              button: "OK",
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
            });
          }
        } catch (err) {
          console.log(err);
          swal({
            icon: "error",
            title: "Error",
            text: "An error occurred while deleting the invoice.",
          });
        }
      }
    });
  };
  return (
    <>
      <div className="w-100 mt-3 container-fluid">
        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search Company Name"
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
                BASE_URL + "/payable/fetch_local_payable_bulk_perVendor"
              );
              paginationDropdown.updateParams({
                vendor_id: row.id,
                domestic_type: activeTab,
              });

              setExpandedRowId(row.id);
            } else {
              setExpandedRowId(null);
            }
          }}
          expandableRowExpanded={(row) => row.id === expandedRowId}
          expandableRowsComponent={({ data }) => {
            const payables = paginationDropdown.data;

            return (
              <div>
                <h6>Payables Detail</h6>

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
                    {payables && payables.length > 0 ? (
                      payables.map((payable_data) => (
                        <tr key={payable_data.id} className="text-center ">
                          <td>{payable_data.transaction_number}</td>
                          <td>
                            {format(payable_data.payable_date, "MMM/dd/yyyy")}
                          </td>
                          <td>
                            {format(payable_data.createdAt, "MMM/dd/yyyy")}
                          </td>

                          <td>
                            {payable_data.remaining_balance.toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td>{payable_data.status}</td>
                          {/* Action */}
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
                                    `/Purchases/view-bulk-payable/${activeTab}/${payable_data.id}?page=${paginationDropdown.currentPage}`
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
                                onClick={() =>
                                  handleDeletePayable(
                                    payable_data.id,
                                    payable_data.payable_date,
                                    payable_data.transaction_number
                                  )
                                }
                              ></i>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No payables found.
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

export default ModalContentPO;
