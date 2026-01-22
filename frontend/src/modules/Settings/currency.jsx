import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
const Currency = ({ initialData, authrztn }) => {
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [basedCurrency, setBasedCurrency] = useState("PHP");
  const [currencyName, setCurrencyName] = useState("");
  const [currencyRate, setCurrencyRate] = useState("");
  const [status, setStatus] = useState("");
  const [validated, setValidated] = useState(false);
  const [selectedID, setSelectedID] = useState("");
  const [indicativeRate, setIndicativeRate] = useState("");
  const [currencyData, setCurrencyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");

  const userLoggedID = useDecodeToken();

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/currency/fetchPaginatedCurrency"
  );

  const pagination = useServerPagination(paginationUrl, 10);

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/currency/fetchPaginatedCurrency");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/currency/fetchCurrencyForFilter");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
        statusFilter: statusFilter || "All", // Match backend parameter name
      });
    }
  };

  const reloadTable = () => {
    axios
      .get(BASE_URL + "/currency/fetchCurrencyForFilter", {
        params: {
          searchText,
          filterColumn,
          statusFilter,
        },
      })
      .then((res) => {
        setCurrencyData(res.data);
        setIsLoading(false);
      });
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.checked ? "Active" : "Inactive");
  };

  useEffect(() => {
    if (showUpdateModal && initialData) {
      setBasedCurrency(initialData.basedCurrency);
      setCurrencyName(initialData.currencyName);
      setCurrencyRate(initialData.currencyRate);
      setIndicativeRate(
        `1 ${initialData.currencyName} = ${initialData.currencyRate} ${initialData.basedCurrency}`
      );
    }
    const timer = setTimeout(() => {
      reloadTable();
    }, 1500);
    return () => clearTimeout(timer);
  }, [showUpdateModal, initialData]);

  //   useEffect(() => {
  //     const timer = setTimeout(() => {
  //       reloadTable();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }, [searchText, filterColumn]);

  //   useEffect(() => {
  //     reloadTable();
  //   }, [searchText, filterColumn, statusFilter]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const updateIndicativeRate = (currencyName, currencyRate, basedCurrency) => {
    if (currencyName && currencyRate && basedCurrency) {
      setIndicativeRate(`1 ${currencyName} = ${currencyRate} ${basedCurrency}`);
    } else {
      setIndicativeRate("");
    }
  };

  const handleInputChange = (setter, value, field) => {
    setter(value.toUpperCase());

    // Delay the indicative rate update to ensure state updates are applied first
    setTimeout(() => {
      if (field === "currencyName") {
        updateIndicativeRate(value.toUpperCase(), currencyRate, basedCurrency);
      } else if (field === "currencyRate") {
        updateIndicativeRate(currencyName, value, basedCurrency);
      } else if (field === "basedCurrency") {
        updateIndicativeRate(currencyName, currencyRate, value.toUpperCase());
      }
    }, 0);
  };

  const handleClose = () => {
    setShowModal(false);
    setShowUpdateModal(false);
    setBasedCurrency("PHP");
    setCurrencyName("");
    setCurrencyRate("");
    setStatus("");
    setValidated(false);
    setIndicativeRate("");
  };
  const handleShow = () => setShowModal(true);

  const handleUpdateShow = (data) => {
    setShowUpdateModal(true);
    setSelectedID(data.id);
    setBasedCurrency(data.based_currency);
    setCurrencyName(data.currency_name);

    setCurrencyRate(
      String(data.currency_rate).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
    setStatus(data.status);
    setIndicativeRate(
      `1 ${data.currency_name} = ${data.currency_rate.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${data.based_currency}`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
        buttons: false,
        timer: 2000,
      });
    } else {
      swal({
        title: "Create this new currency?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/currency/addCurrency", {
                basedCurrency,
                currencyName,
                currencyRate: parseFloat(
                  String(currencyRate).replace(/,/g, "")
                ),
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Currency successfully added.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  reloadTable();
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Currency duplicated, unable to insert.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              });
          } catch (error) {
            console.error("Error adding currency:", error);
            swal({
              title: "Error!",
              text: "There was an error adding the currency.",
              icon: "error",
              buttons: false,
              timer: 2000,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
        buttons: false,
        timer: 2000,
      });
    } else {
      swal({
        title: "Update this currency?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/currency/updateCurrency", {
                basedCurrency,
                currencyName,
                currencyRate: parseFloat(
                  String(currencyRate).replace(/,/g, "")
                ),
                status,
                selectedID,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Currency successfully updated.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  pagination.updateParams({});
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Currency duplicated, unable to update.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              });
          } catch (error) {
            console.error("Error updating currency:", error);
            swal({
              title: "Error!",
              text: "There was an error updating the currency.",
              icon: "error",
              buttons: false,
              timer: 2000,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const columns = [
    {
      name: "Base Currency",
      selector: (row) => row.based_currency,
    },
    {
      name: "Currency",
      selector: (row) => row.currency_name,
    },
    {
      name: "Currency Rate",
      selector: (row) =>
        row.currency_rate.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            color: row.status === "Active" ? "green" : "red",
            padding: "5px 10px",
            borderRadius: "5px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </div>
      ),
    },
  ];

  //   const filteredItems = currencyData.filter((item) => {
  //     if (!searchText) return true;

  //     const searchLower = searchText.toLowerCase();

  //     // Special handling for currency rate search
  //     if (filterColumn === "currency_rate" || filterColumn === "all") {
  //       // Try to parse the search text as a number
  //       const searchNumber = parseFloat(searchLower.replace(/,/g, ""));

  //       // Compare both the formatted and raw values
  //       const matchesFormatted = item.currency_rate
  //         .toLocaleString("en-US", {
  //           minimumFractionDigits: 2,
  //           maximumFractionDigits: 2,
  //         })
  //         .toLowerCase()
  //         .includes(searchLower);

  //       const matchesRaw =
  //         !isNaN(searchNumber) &&
  //         Math.abs(item.currency_rate - searchNumber) < 0.0001; // Account for floating point precision

  //       if (filterColumn === "currency_rate") {
  //         return matchesFormatted || matchesRaw;
  //       }
  //     }

  //     switch (filterColumn) {
  //       case "based_currency":
  //         return item.based_currency.toLowerCase().includes(searchLower);
  //       case "currency_name":
  //         return item.currency_name.toLowerCase().includes(searchLower);
  //       case "status":
  //         return item.status.toLowerCase().includes(searchLower);
  //       default:
  //         return (
  //           item.based_currency.toLowerCase().includes(searchLower) ||
  //           item.currency_name.toLowerCase().includes(searchLower) ||
  //           item.status.toLowerCase().includes(searchLower) ||
  //           item.currency_rate
  //             .toLocaleString("en-US", {
  //               minimumFractionDigits: 2,
  //               maximumFractionDigits: 2,
  //             })
  //             .toLowerCase()
  //             .includes(searchLower) ||
  //           (!isNaN(parseFloat(searchLower)) &&
  //             Math.abs(item.currency_rate - parseFloat(searchLower)) < 0.0001)
  //         );
  //     }
  //   });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  // export
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanySettings/getSettings`
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);
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
      ) : authrztn.includes("Currency-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">CURRENCIES</span>
              <span>CURRENCY CONVERSION LIST</span>
              {/* <img
                src={settings?.company_logo}
                alt="Report Logo"
                className="img-fluid"
                style={{ maxHeight: "130px" }}
              /> */}
            </div>

            <div>
              {authrztn.includes("Currency-Add") && (
                <button
                  className="btn btn-primary d-flex align-items-center title-button"
                  onClick={handleShow}
                >
                  <i className="bx bx-plus fs-5"></i> Add Currency
                </button>
              )}
            </div>
          </div>
          <div className="row container-fluid">
            <div className="col-4">
              <label for="status" className="mb-2">
                Status
              </label>
              <select
                className="form-select"
                name="status"
                id="status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="w-100 row mx-0 mt-3">
            {/* <div className="col-sm text-end mb-2">
              <button className="btn btn-secondary" onClick={clearFilter}>
                Clear Filter
              </button>
            </div> */}
            <div className="col-sm mb-2">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
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
                        filterColumn === "based_currency" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("based_currency")}
                    >
                      Base Currency
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "currency_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("currency_name")}
                    >
                      Currency Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "currency_rate" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("currency_rate")}
                    >
                      Currency Rate
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* <div className="w-100 mt-2 container-fluid">
            
            <DataTable
              columns={columns}
              data={currencyData}
              customStyles={customStyles}
              onRowClicked={(row) => handleUpdateShow(row)}
              pagination
              className="dataTable"
            />
          </div> */}

          <div className="container-fluid">
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive ">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BASE CURRENCY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CURRENCY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CURRENCY RATE
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex justify-content-center align-items-center">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger py-4">
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
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      return (
                        <tr
                          style={{
                            cursor: "pointer",
                          }}
                          key={item.id}
                          onClick={() => handleUpdateShow(item)}
                        >
                          <td className="text-center">{item.based_currency}</td>
                          <td className="text-center">{item.currency_name}</td>
                          <td className="text-center">
                            {item.currency_rate.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className="text-center"
                            style={{
                              color: item.status === "Active" ? "green" : "red",
                              padding: "5px 10px",
                              borderRadius: "5px",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                            }}
                          >
                            {item.status || "N/A"}
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

          <Modal show={showModal} onHide={handleClose} backdrop="static">
            <Modal.Header className="border-0" closeButton>
              <Modal.Title>Exchange Rate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="basedCurrency">
                  <Form.Label>Based Currency</Form.Label>
                  <Form.Control
                    type="text"
                    value={basedCurrency}
                    readOnly
                    placeholder="Enter Based Currency"
                    onChange={(e) =>
                      handleInputChange(
                        setBasedCurrency,
                        e.target.value,
                        "basedCurrency"
                      )
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="currencyName">
                  <Form.Label>
                    Currency <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={currencyName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrencyName(value);
                      updateIndicativeRate(value, currencyRate, basedCurrency);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    <option value="PHP">Philippine Peso (Philippines)</option>
                    <option value="USD">U.S. Dollar (United States)</option>
                    <option value="CNY">Chinese Yuan (China)</option>
                    <option value="HKD">Hong Kong Dollar (Hong Kong)</option>
                    <option value="EUR">Euro (Europe)</option>
                    <option value="JPY">Japanese Yen (Japan)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="currencyRate">
                  <Form.Label>
                    Currency Rate <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={currencyRate}
                    placeholder="Enter Currency Rate"
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value == ".") {
                        setCurrencyRate((prev) => prev + ".");
                      }

                      let inputValue = String(value).replace(/[^0-9.]/g, "");

                      let [integerPart, decimalPart] = inputValue.split(".");

                      if (integerPart) {
                        integerPart = integerPart.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ","
                        );
                      }
                      let formattedValue =
                        decimalPart !== undefined
                          ? `${integerPart}.${decimalPart}`
                          : integerPart;

                      setCurrencyRate(formattedValue);
                      updateIndicativeRate(currencyName, value, basedCurrency);
                    }}
                    required
                  />
                </Form.Group>

                <div className="w-100 d-flex align-items-center">
                  <span>Indicative Exchange Rate</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="w-100 mb-2 p-2">
                  {indicativeRate && (
                    <div className="fs-5 fw-bold">{indicativeRate}</div>
                  )}
                </div>

                <Modal.Footer>
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                  <Button variant="primary" type="submit">
                    Submit
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Update Modal */}
          <Modal show={showUpdateModal} onHide={handleClose} backdrop="static">
            <Modal.Header className="border-0" closeButton>
              <Modal.Title>Update Exchange Rate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form noValidate validated={validated} onSubmit={handleUpdate}>
                <Form.Group className="mb-3" controlId="basedCurrency">
                  <Form.Label>Based Currency</Form.Label>
                  <Form.Control
                    type="text"
                    readOnly
                    value={basedCurrency}
                    onChange={(e) =>
                      handleInputChange(
                        setBasedCurrency,
                        e.target.value,
                        "basedCurrency"
                      )
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="currencyName">
                  <Form.Label>
                    Currency <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={currencyName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrencyName(value);
                      updateIndicativeRate(value, currencyRate, basedCurrency);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    <option value="PHP">Philippine Peso (Philippines)</option>
                    <option value="USD">U.S. Dollar (United States)</option>
                    <option value="CNY">Chinese Yuan (China)</option>
                    <option value="HKD">Hong Kong Dollar (Hong Kong)</option>
                    <option value="EUR">Euro (Europe)</option>
                    <option value="JPY">Japanese Yen (Japan)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="currencyRate">
                  <Form.Label>
                    Currency Rate <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={currencyRate}
                    placeholder="Enter Currency Rate"
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value == ".") {
                        setCurrencyRate((prev) => prev + ".");
                      }

                      let inputValue = String(value).replace(/[^0-9.]/g, "");

                      let [integerPart, decimalPart] = inputValue.split(".");

                      if (integerPart) {
                        integerPart = integerPart.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ","
                        );
                      }
                      let formattedValue =
                        decimalPart !== undefined
                          ? `${integerPart}.${decimalPart}`
                          : integerPart;

                      setCurrencyRate(formattedValue);
                      updateIndicativeRate(currencyName, value, basedCurrency);
                    }}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="currencyName">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="status-switch"
                    label={
                      <span
                        className={
                          status === "Active"
                            ? "switch-label-active"
                            : "switch-label-inactive"
                        }
                      >
                        {status === "Active" ? "Active" : "Inactive"}
                      </span>
                    }
                    checked={status === "Active"}
                    onChange={handleStatusChange}
                  />
                </Form.Group>

                <div className="w-100 d-flex align-items-center">
                  <span>Indicative Exchange Rate</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="w-100 mb-2 p-2">
                  {indicativeRate && (
                    <div className="fs-5 fw-bold">{indicativeRate}</div>
                  )}
                </div>

                <Modal.Footer>
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                  {authrztn.includes("Currency-Edit") && (
                    <Button variant="primary" type="submit">
                      Submit
                    </Button>
                  )}
                </Modal.Footer>
              </Form>
            </Modal.Body>
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

export default Currency;
