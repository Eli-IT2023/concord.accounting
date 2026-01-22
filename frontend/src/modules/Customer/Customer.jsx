import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import "../../assets/css/style.css";
import { customStyles } from "../styles/table-style";
import { Link } from "react-router-dom";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../utils/CustomerDateInput";
import "../../assets/css/style.css";

const Customer = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterStatus, setFilterStatus] = useState("1");
  const [filterDateCreatedStart, setFilterDateCreatedStart] = useState("");
  const [filterDateCreatedEnd, setFilterDateCreatedEnd] = useState("");
  // total customer count
  const [totalCustomers, setTotalCustomers] = useState(0); // State to store total customers

  // total customer month count
  const [monthlyCustomerCount, setMonthlyCustomerCount] = useState(0);
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/customer/getCustomers"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // customer count
  const customerCount = () => {
    axios
      .get(BASE_URL + "/customer/countCustomers")
      .then((response) => {
        setTotalCustomers(response.data.totalCustomers);
      })
      .catch((error) => {
        console.error("Error fetching customer count:", error);
      });
  };

  // customer month count
  const fetchMonthlyCustomerCount = async () => {
    try {
      const response = await axios.get(
        BASE_URL + "/customer/countCustomersWithinMonth"
      );
      setMonthlyCustomerCount(response.data.count);
    } catch (error) {
      console.error("Error fetching monthly customer count:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      customerCount();
      fetchMonthlyCustomerCount();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    customerCount();
    fetchMonthlyCustomerCount();
  }, []);

  const handleSearch = (e) => {
    const searchText_value = e.target.value;
    setSearchText(searchText_value);
    setPaginationUrl(BASE_URL + "/customer/getCustomersSearch");
    pagination.updateParams({
      filterStatus,
      searchText_value,
      filterColumn,
    });
  };

  // Handle type filter change
  const handleFilter = (e) => {
    setPaginationUrl(BASE_URL + "/customer/getCustomersFilter");
    pagination.updateParams({
      filterStatus,
      filterDateCreatedStart,
      filterDateCreatedEnd,
    });
  };

  const handleClearFilter = () => {
    setFilterStatus("1");
    setFilterDateCreatedStart("");
    setFilterDateCreatedEnd("");
    setSearchText("");
    setFilterColumn("all");
    setPaginationUrl(BASE_URL + "/customer/getCustomers");
    pagination.updateParams({});
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("Customers-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">CUSTOMER</span>
              <span>CUSTOMER LIST</span>
            </div>

            <div>
              {authrztn.includes("Customers-Add") && (
                <Link
                  to="/sales/customers/create"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>
          <div className="row p-2 mx-auto d-flex align-items-center justify-content-center">
            <div className="col-sm-4 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-user-plus fs-3 h-100"></i>
                  <h3>Total Customer</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1 className="text-success">{totalCustomers}</h1>
                  <span className="text-secondary ">
                    <strong>+2</strong> CUSTOMER VS LAST MONTH
                  </span>
                </div>
              </div>
            </div>
            <div className="col-sm-4 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className="d-flex flex-row align-items-center payable-icon">
                  <i className="bx bx-user-plus fs-3 h-100"></i>
                  <h3>New Customer</h3>
                </div>
                <div className="mt-2 d-flex flex-column payable-card-desc">
                  <h1 className="text-success">{monthlyCustomerCount}</h1>
                  <span className="text-secondary">
                    <strong>+2</strong> CUSTOMER VS LAST MONTH
                  </span>
                </div>
              </div>
            </div>
            <div className="col-sm w-100 p-3 payable-card d-none">
              {/* <div className="w-100 border p-3 shadow-sm rounded h-100">
            <div className=" d-flex flex-row align-items-center payable-icon">
              <i class="bx bx-credit-card fs-3 h-100"></i>
              <h3>Sales Profit</h3>
            </div>

            <div className=" mt-2 d-flex flex-column payable-card-desc">
              <h1 className="payable-amounts">85,000</h1>
              <span className="text-secondary ">
                <strong>16%</strong> INCREASE
              </span>
            </div>
          </div> */}
            </div>
            <div className="col-sm w-100 p-3 payable-card d-none">
              {/* <div className="w-100 border p-3 shadow-sm rounded h-100">
            <div className=" d-flex flex-row align-items-center payable-icon">
              <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
              <h3>Collected</h3>
            </div>

            <div className=" mt-2 d-flex flex-column payable-card-desc">
              <h1 className="payable-amount">30,400</h1>
              <span className="text-secondary ">
                INCREASE <strong>12%</strong> VS LAST MONTH
              </span>
            </div>
          </div> */}
            </div>
          </div>
          <div className="p-3">
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="form-label">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                >
                  <option disabled value="">
                    Select Status
                  </option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">From</label>
                {/* <input
                  value={filterDateCreatedStart}
                  onChange={(e) => setFilterDateCreatedStart(e.target.value)}
                  type="date"
                  className="form-control"
                  placeholder="MM/DD/YYYY"
                /> */}
                <DatePicker
                  selected={filterDateCreatedStart}
                  onChange={(date) => setFilterDateCreatedStart(date)}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  customInput={<CustomDatePickerInput />}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">To</label>
                {/* <input
                  value={filterDateCreatedEnd}
                  onChange={(e) => setFilterDateCreatedEnd(e.target.value)}
                  type="date"
                  className="form-control"
                  placeholder="MM/DD/YYYY"
                /> */}
                <DatePicker
                  selected={filterDateCreatedEnd}
                  onChange={(date) => setFilterDateCreatedEnd(date)}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  customInput={<CustomDatePickerInput />}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>

              <div className="col-md-3 d-flex gap-2 justify-content-start align-items-center">
                <button
                  onClick={handleFilter}
                  type="button"
                  className="btn btn-dark flex-grow-1"
                >
                  Apply Filter
                </button>

                <button
                  onClick={handleClearFilter}
                  className="btn btn-light border flex-grow-1"
                >
                  Clear Filter
                </button>
              </div>

              <div className="col-md-3 ms-auto">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchText}
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
                        onClick={() => setFilterColumn("all")}
                      >
                        All
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "company_name" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("company_name")}
                      >
                        Company Name
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "mobile_no" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("mobile_no")}
                      >
                        Mobile Number
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "telephone_no" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("telephone_no")}
                      >
                        Telephone Number
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "company_email" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("company_email")}
                      >
                        Email
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "country" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("country")}
                      >
                        Country
                      </button>
                    </li>
                    {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "status" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("status")}
                  >
                    Status
                  </button>
                </li> */}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="w-100 mt-2 rounded container-fluid">
            {/* <DataTable
              columns={columns}
              data={userData}
              customStyles={customStyles}
              onRowClicked={handleRowClicked}
            /> */}
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      COMPANY NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      MOBILE NO.
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      TELEPHONE NO.
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      EMAIL
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      COUNTRY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      DATE CREATED
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      PURCHASE HISTORY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.error ? (
                    <tr>
                      <td className="text-center text-danger py-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                          <span>Error loading data</span>
                          <small className="text-muted mt-1">
                            {pagination.error.message}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      const formattedDate = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : "N/A";
                      return (
                        <tr
                          key={item.customer_id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            console.log(item.customer_id);
                            navigate(`/initUpdate/${item.customer_id}`);
                          }}
                        >
                          <td className="text-center">
                            {item.company_name || "--"}
                          </td>
                          <td className="text-center">
                            {item.mobile_no || "--"}
                          </td>
                          <td className="text-center">
                            {item.telephone_no || "--"}
                          </td>
                          <td className="text-center">
                            {item.company_email || "--"}
                          </td>
                          <td className="text-center">
                            {item.country || "--"}
                          </td>
                          <td className="text-center">
                            {formattedDate || "--"}
                          </td>
                          <td className="text-center">
                            <div>
                              <i
                                class="fa-solid fa-clock-rotate-left fs-3 text-primary purchase-history"
                                onMouseOver={(e) =>
                                  (e.target.style.opacity = "0.5")
                                }
                                onMouseOut={(e) =>
                                  (e.target.style.opacity = "1")
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/sales/customer-purchase-history/${item.customer_id}`
                                  );
                                }}
                              ></i>
                            </div>
                          </td>
                          <td className="text-center">
                            {" "}
                            <div
                              style={{
                                padding: "5px, 10px",
                                borderRadius: "5px",
                                color: item.status
                                  ? item.status === true
                                    ? "#3B9F3F"
                                    : "#FFA500"
                                  : "initial",
                                textTransform: "uppercase",
                                fontWeight: "bold",
                              }}
                            >
                              {item.status === true ? "Active" : "Inactive"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default Customer;
