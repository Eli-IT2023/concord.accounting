import React, { useState, useEffect, useRef } from "react";
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
import { Modal } from "react-bootstrap";
import swal from "sweetalert";
import { ArrowsClockwise } from "@phosphor-icons/react";

const Customer = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  // const [search, setSearch] = useState("");
  const [searchText, setSearchText] = useState("");
  // const [inboundData, setInboundData] = useState([]);
  // const [filteredData, setFilteredData] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [changeToStatus, setChangeToStatus] = useState("");
  // const [deletionTrigger, setDeletionTrigger] = useState(false);

  // total customer count
  const [totalCustomers, setTotalCustomers] = useState(0); // State to store total customers

  // total customer month count
  const [monthlyCustomerCount, setMonthlyCustomerCount] = useState(0);

  const pagination = useServerPagination("about:blank", 10);

  //Reload Table
  const reloadTable = () => {
    pagination.updateApiUrl(BASE_URL + "/customer/getCustomers");
    pagination.updateParams({
      selectedStatus,
      selectedType,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/customer/getCustomers", {
    //     params: {
    //       selectedStatus,
    //       selectedType,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     const sortedCustomerList = res.data.sort(
    //       (a, b) => b.customer_id - a.customer_id
    //     );
    //     setInboundData(sortedCustomerList);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  useEffect(() => {
    reloadTable();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleChangeStatus = () => {
    try {
      if (changeToStatus === "") {
        swal({
          icon: "warning",
          title: "Warning",
          text: "Please select status before proceeding.",
        });
        return;
      }

      swal({
        icon: "warning",
        title: "Are you sure?",
        text: "You are about to change the status of selected items.",
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/customer/customerChangeStatus`,
              {
                selectedCustomers: [...new Set(selectedCustomers)],
                changeToStatus,
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Statuses Updated",
                text: "All selected items have been updated",
              }).then(() => {
                setSelectedCustomers([]);
                setChangeToStatus("");
                setShowChangeStatusModal(false);
                reloadTable();
              });
            }
          }
        })
        .catch((error) => {
          console.error(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
  };

  // Table Row
  const userData = pagination.data.map((data, i) => {
    const createdAtDate = new Date(data.createdAt);
    const formattedDate = createdAtDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Capitalize the first letter of formType
    const formType = data.type === "individual" ? "Individual" : "Company";

    return {
      key: i,
      customerId: data.customer_id,
      tin: data.tin || "--",
      companyName: data.company_name || "--",
      mobileNumber: data.mobile_no || "--",
      email: data.email || "--",
      country: data.country,
      dateCreated: formattedDate,
      formType: formType, // Updated formType
      balance: data.balance,
      // customerName: data.first_name + " " + data.last_name,
      customerStatus: data.status === true ? "Active" : "Inactive",
      customerName: `${
        data.first_name && data.last_name
          ? data.first_name + " " + data.last_name
          : "--"
      }`, // Template string for full name
    };
  });

  const uniqueSelectedCustomers = [...new Set(selectedCustomers)];

  // Customer soft delete
  const handleDeleteCustomer = (id) => {
    try {
      swal({
        icon: "warning",
        title: "Confirm Deletion",
        text: "Are you sure you want to delete?",
        buttons: ["Cancel", "OK"],
        dangerMode: true,
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/customer/customerSoftDelete/${id}`
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Deleted Successfully",
                text: "The customer has been deleted successfully",
              }).then(() => {
                reloadTable();
                // setDeletionTrigger(true);
              });
              return;
            }
          }
          return;
        })
        .catch((error) => {
          console.error(error);

          if (error.response && error.response.status === 409) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
              <span style="color: rgba(0, 0, 0, 0.65)">
                Delete first the invoice in module <strong>Sales Invoice</strong> with Transaction
                Number: <strong>${error.response.data.transaction_id}</strong>
              </span>
            `;
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              content: wrapper,
            });
            return;
          }

          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
  };

  // Handle bulk deletion of customer
  const handleBulkDeleteCustomer = () => {
    try {
      swal({
        icon: "warning",
        title: "Are you sure?",
        text: "Are you sure you want to delete?",
        buttons: ["Cancel", "OK"],
        dangerMode: true,
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/customer/customerBulkSoftDelete`,
              {
                selectedCustomers: [...new Set(selectedCustomers)],
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Customers Deleted",
                text: res.data.message,
              }).then(() => {
                setSelectedCustomers([]);
                reloadTable();
              });
              return;
            }
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 409) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `<span style="color: rgba(0, 0, 0, 0.65)">
            <strong>${
              error.response.data.company_name ||
              error.response.data.customer_name
            }</strong> has an existing transaction. 
            Delete first the invoice in module <strong>Sales Invoice</strong> with Transaction
                Number: <strong>${error.response.data.transaction_id}</strong>
            </span>`;
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              content: wrapper,
            });
            return;
          }
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    customerCount();
    fetchMonthlyCustomerCount();
  }, [selectedStatus, selectedType]);

  // useEffect(() => {
  //   reloadTable();
  // }, [searchText, selectedStatus, selectedType]);

  // useEffect(() => {
  //   setSearchText("");
  // }, [filterColumn]);

  // useEffect(() => {
  //   const sortedCustomerList = pagination.data.sort(
  //     (a, b) => b.customer_id - a.customer_id
  //   );
  //   setInboundData(sortedCustomerList);

  //   if (
  //     deletionTrigger &&
  //     sortedCustomerList?.length === 0 &&
  //     pagination.currentPage > 1
  //   ) {
  //     pagination.setCurrentPage(pagination.currentPage - 1);
  //   }
  // }, [pagination.data]);

  // Table Header
  const columns = [
    // {
    //   name: "CUSTOMER ID",
    //   selector: (row) => row.customerId,
    // },
    {
      name: (
        <input
          checked={userData.length === selectedCustomers.length}
          onChange={(e) => {
            setSelectedCustomers(() => {
              return e.target.checked
                ? userData.map((item) => item.customerId)
                : [];
            });
          }}
          type="checkbox"
        />
      ),
      selector: (row) => (
        <input
          checked={selectedCustomers.includes(row.customerId)}
          onChange={(e) => {
            setSelectedCustomers((prev) => {
              return e.target.checked
                ? [...prev, row.customerId]
                : prev.filter((customerId) => customerId !== row.customerId);
            });
          }}
          type="checkbox"
        />
      ),
      width: "8rem",
    },
    {
      name: "Tin",
      selector: (row) => row.tin,
    },
    {
      name: "Customer",
      selector: (row) => row.customerName,
    },
    {
      name: "Company",
      selector: (row) => row.companyName,
    },
    {
      name: "Phone",
      selector: (row) => row.mobileNumber,
    },
    {
      name: "Email",
      selector: (row) => row.email,
    },
    {
      name: "Country",
      selector: (row) => row.country,
    },
    // {
    //   name: "DATE ADDED",
    //   selector: (row) => row.dateCreated,
    // },
    {
      name: "Type",
      selector: (row) => row.formType,
    },
    {
      name: "Status",
      selector: (row) => row.customerStatus,
      cell: (row) => (
        <div
          style={{
            padding: "5px, 10px",
            borderRadius: "5px",
            color: row.customerStatus
              ? row.customerStatus === "Active"
                ? "#3B9F3F"
                : "#FFA500"
              : "initial",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          {row.customerStatus}
        </div>
      ),
    },
    {
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => {
            handleDeleteCustomer(row.customerId);
          }}
        ></i>
      ),
    },
  ];

  // useEffect(() => {
  //   customerCount();
  //   fetchMonthlyCustomerCount();
  // }, [selectedStatus, selectedType]);

  // const applyFilter = () => {
  //   reloadTable();
  // };

  // useEffect(() => {
  //   let filtered = inboundData;

  //   // Filter by search input
  //   if (search.trim() !== "") {
  //     filtered = filtered.filter((item) => {
  //       return (
  //         (item.customer_id &&
  //           typeof item.customer_id === "string" &&
  //           item.customer_id.includes(search)) ||
  //         (item.first_name &&
  //           typeof item.first_name === "string" &&
  //           item.first_name.toLowerCase().includes(search.toLowerCase())) ||
  //         (item.last_name &&
  //           typeof item.last_name === "string" &&
  //           item.last_name.toLowerCase().includes(search.toLowerCase())) ||
  //         (item.company_name &&
  //           typeof item.company_name === "string" &&
  //           item.company_name.toLowerCase().includes(search.toLowerCase())) ||
  //         (item.email &&
  //           typeof item.email === "string" &&
  //           item.email.toLowerCase().includes(search.toLowerCase())) ||
  //         (item.country &&
  //           typeof item.country === "string" &&
  //           item.country.toLowerCase().includes(search.toLowerCase())) ||
  //         (item.type &&
  //           typeof item.type === "string" &&
  //           item.type.toLowerCase().includes(search.toLowerCase()))
  //       );
  //     });
  //   }

  //   // Filter by selected type (if selectedType is not empty)
  //   if (selectedType) {
  //     filtered = filtered.filter(
  //       (item) =>
  //         item.type && item.type.toLowerCase() === selectedType.toLowerCase()
  //     );
  //   }

  //   if (selectedStatus) {
  //     filtered = filtered.filter(
  //       (item) => item.status === (selectedStatus === "Active" ? true : false)
  //     );
  //   }

  //   setFilteredData(filtered);
  // }, [search, inboundData, selectedType, selectedStatus]);

  const handleRowClicked = (row) => {
    navigate(`/initUpdate/${row.customerId}`);
  };

  // Handle type filter change
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setSelectedType(value);
    pagination.updateApiUrl(`${BASE_URL}/customer/getCustomersByFilter`);
    pagination.updateParams({
      selectedStatus,
      selectedType: value,
    });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setSelectedStatus(value);
    pagination.updateApiUrl(`${BASE_URL}/customer/getCustomersByFilter`);
    pagination.updateParams({
      selectedStatus: value,
      selectedType,
    });
  };
  const debounceTimer = useRef(null);
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(async () => {
      pagination.updateApiUrl(`${BASE_URL}/customer/getCustomersBySearch`);
      pagination.updateParams({
        selectedStatus,
        selectedType,
        filterColumn,
        searchText: value,
      });
    }, 600);

    // Cleanup timer on unmount or searchTermFilter change
    return () => clearTimeout(debounceTimer.current);
  };

  // Clear all filters
  // const clearFilters = () => {
  //   setSearch("");
  //   setSelectedType(""); // Clear the selected type
  //   setSelectedStatus(""); // Clear the selected status
  //   setFilteredData(inboundData); // Reset filtered data to original data
  //   reloadTable(true);
  // };

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
              {uniqueSelectedCustomers.length > 0 ? (
                <>
                  <button
                    className="btn btn-secondary title-button me-2"
                    onClick={() => setShowChangeStatusModal(true)}
                  >
                    <ArrowsClockwise className="fs-5" color="#f2f2f2" /> Change
                    Status
                  </button>
                  <button
                    className="btn btn-danger title-button"
                    onClick={handleBulkDeleteCustomer}
                  >
                    <i
                      className="fas fa-trash"
                      style={{
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                    ></i>{" "}
                    Delete <span>({uniqueSelectedCustomers.length})</span>
                  </button>
                </>
              ) : (
                authrztn.includes("Customers-Add") && (
                  <Link
                    to="/sales/customers/create"
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> Create
                  </Link>
                )
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
          <div className="row">
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <label htmlFor="status">Status</label>
                <select
                  name="status"
                  id="status"
                  className="form-select"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="formType">Type</label>
                <select
                  name="formType"
                  id="formType"
                  className="form-select"
                  value={selectedType}
                  onChange={handleTypeChange}
                >
                  <option value="All">All Type</option>
                  {/* <option value="Individual">Individual</option>
              <option value="Company">Company</option> */}
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100" onClick={applyFilter}>
                  Apply Filter
                </button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilters}
                >
                  Clear Filter
                </button> */}
              </div>
              <div className="col-sm mb-2"></div>
              <div className="col-sm"></div>
            </div>
          </div>
          <div className="w-100 row mx-0 mt-2">
            <div className="col-sm mb-2 d-flex align-items-end">
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
                        filterColumn === "tin" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("tin")}
                    >
                      Tin
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "first_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("first_name")}
                    >
                      Customer Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "company_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("company_name")}
                    >
                      Company
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "mobile_no" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("mobile_no")}
                    >
                      Phone
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
                        filterColumn === "date_added" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("date_added")}
                    >
                      Date Added
                    </button>
                  </li> */}
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "type" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("type")}
                    >
                      Type
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="w-100 mt-2 rounded container-fluid">
            <DataTable
              columns={columns}
              data={userData}
              customStyles={customStyles}
              onRowClicked={handleRowClicked}
            />
            <PaginationControls {...pagination} />
          </div>

          {/* Change Status Modal */}

          <Modal
            show={showChangeStatusModal}
            onHide={() => setShowChangeStatusModal(false)}
            size="md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Change Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <label htmlFor="change-status">Status</label>
              <select
                name="change-status"
                id="change-status"
                value={changeToStatus}
                onChange={(e) => setChangeToStatus(e.target.value)}
                className="form-select"
              >
                <option value="" selected disabled>
                  Select Status
                </option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-primary" onClick={handleChangeStatus}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowChangeStatusModal(false)}
              >
                Close
              </button>
            </Modal.Footer>
          </Modal>
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
