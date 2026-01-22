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
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { ArrowsClockwise } from "@phosphor-icons/react";
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
  const [selectedCurrencies, setSelectedCurrencies] = useState([]);
  const [changeToStatus, setChangeToStatus] = useState("");
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);

  const userLoggedID = useDecodeToken();
  const pagination = useServerPagination(
    BASE_URL + "/currency/fetchCurrencyForFilter",
    10
  );

  const reloadTable = () => {
    pagination.updateParams({
      searchText,
      filterColumn,
      statusFilter,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/currency/fetchCurrencyForFilter", {
    //     params: {
    //       searchText,
    //       filterColumn,
    //       statusFilter,
    //     },
    //   })
    //   .then((res) => {
    //     setCurrencyData(res.data);
    //     setIsLoading(false);
    //   });
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.checked ? "Active" : "Inactive");
  };

  useEffect(() => {
    setCurrencyData(pagination.data);
  }, [pagination.data]);

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

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     reloadTable();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [searchText, filterColumn]);

  useEffect(() => {
    reloadTable();
  }, [searchText, filterColumn, statusFilter]);

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
                  reloadTable();
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
      name: (
        <input
          checked={selectedCurrencies.length === currencyData.length}
          onChange={(e) => {
            setSelectedCurrencies(() => {
              return e.target.checked
                ? currencyData.map((item) => item.id)
                : [];
            });
          }}
          type="checkbox"
        />
      ),
      selector: (row) => (
        <input
          checked={selectedCurrencies.includes(row.id)}
          onChange={() => {
            setSelectedCurrencies((prev) => {
              return !selectedCurrencies.includes(row.id)
                ? [...prev, row.id]
                : selectedCurrencies.filter(
                    (currencyId) => currencyId !== row.id
                  );
            });
          }}
          type="checkbox"
        />
      ),
      width: "8rem",
    },
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

  // Handle submit change status
  const handleChangeStatus = () => {
    // Update Status
    const updateStatus = async () => {
      try {
        const res = await axios.put(
          `${BASE_URL}/currency/bulkCurrencyStatusUpdate`,
          {
            selectedCurrencies,
            changeToStatus,
          }
        );

        if (res.status === 200) {
          swal({
            icon: "success",
            title: "Status Updated",
            text: "All selected items have been updated.",
          }).then(() => {
            setSelectedCurrencies([]);
            setChangeToStatus("");
            setShowChangeStatusModal(false);
            reloadTable();
          });
        }
      } catch (error) {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      }
    };

    // Confirmation
    swal({
      icon: "warning",
      title: "Are you sure?",
      text: "You are about to change the status of selected items.",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    })
      .then(async (confirm) => {
        if (!confirm) return;

        if (changeToStatus === "") {
          return swal({
            icon: "warning",
            title: "Warning",
            text: "Please select status before proceeding.",
          });
        }

        await updateStatus();
      })
      .catch((error) => {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      });
  };

  const filteredItems = currencyData.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    switch (filterColumn) {
      case "based_currency":
        return item.based_currency.toLowerCase().includes(searchLower);
      case "currency_name":
        return item.currency_name.toLowerCase().includes(searchLower);
      case "currency_rate":
        return item.currency_rate
          .toString()
          .toLowerCase()
          .includes(searchLower);
      case "status":
        return item.status.toLowerCase().includes(searchLower);
      default:
        return (
          item.based_currency.toLowerCase().includes(searchLower) ||
          item.currency_name.toLowerCase().includes(searchLower) ||
          item.currency_rate.toString().toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
        );
    }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
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
      ) : authrztn.includes("Currency-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">CURRENCIES</span>
              <span>CURRENCY CONVERSION LIST</span>
            </div>

            <div>
              {selectedCurrencies.length > 0 ? (
                <button
                  className="btn btn-secondary title-button"
                  onClick={() => setShowChangeStatusModal(true)}
                >
                  <ArrowsClockwise className="fs-5" color="#f2f2f2" /> Change
                  Status
                </button>
              ) : (
                authrztn.includes("Currency-Add") && (
                  <button
                    className="btn btn-primary d-flex align-items-center title-button"
                    onClick={handleShow}
                  >
                    <i className="bx bx-plus fs-5"></i> Add Currency
                  </button>
                )
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
                  onChange={(e) => setSearchText(e.target.value)}
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
          <div className="w-100 mt-2 container-fluid">
            <DataTable
              columns={columns}
              data={currencyData}
              customStyles={customStyles}
              onRowClicked={(row) => handleUpdateShow(row)}
              className="dataTable"
            />
            <PaginationControls {...pagination} />
          </div>

          {/* Add Modal */}
          {/* <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0">
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
                // onChange={(e) => {
                //   const value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
                //   handleInputChange(setCurrencyName, value, "currencyName");
                // }}
                onChange={(e) => {
                  setCurrencyName(e.target.value);
                }}
                required
              >
                <option selected disabled value="">
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
                  if (/^\d*\.?\d*$/.test(value)) {
                    handleInputChange(setCurrencyRate, value, "currencyRate");
                  }
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
      </Modal> */}
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
                onChange={(e) => {
                  setChangeToStatus(e.target.value);
                }}
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

          {/* <Modal show={showUpdateModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0">
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
              </Form.Label> */}
          {/* <Form.Control
                type="text"
                value={currencyName}
                placeholder="Enter Currency Name"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
                  handleInputChange(setCurrencyName, value, "currencyName");
                }}
                required
              /> */}
          {/* <Form.Select
                value={currencyName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
                  handleInputChange(setCurrencyName, value, "currencyName");
                }}
                onChange={(e) => {
                  setCurrencyName(e.target.value);
                }}
                required
              > */}
          {/* <option selected disabled value="">
                  Select Currency
                </option>
                <option value="PHP">Philippine Peso (Philippines)</option>
                <option value="USD">U.S. Dollar (United States)</option>
                <option value="CNY">Chinese Yuan (China)</option>
                <option value="HKD">Hong Kong Dollar (Hong Kong)</option>
                <option value="EUR">Euro (Europe)</option>
                <option value="JPY">Japanese Yen (Japan)</option>
              </Form.Select>
            </Form.Group> */}

          {/* <Form.Group className="mb-3" controlId="currencyRate">
              <Form.Label>
                Currency Rate <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={currencyRate}
                placeholder="Enter Currency Rate"
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    handleInputChange(setCurrencyRate, value, "currencyRate");
                  }
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
      </Modal> */}
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
