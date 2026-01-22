import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

const Loan = ({ authrztn }) => {
  const navigate = useNavigate();
  const [filteredLoanData, setFilteredLoanData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [validated, setValidated] = useState(false);
  const [show, setShow] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [currencyList, setCurrencyList] = useState([]);
  const [subject2LoanDataList, setSubject2LoanDataList] = useState([]);
  const [subject3LoanDataList, setSubject3LoanDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const userLoggedID = useDecodeToken();
  const [selectedIDUpdate, setSelectedIDUpdate] = useState("");
  const [selectedIDUpdateStatus, setSelectedIDUpdateStatus] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [loanData, setLoanData] = useState({
    transactionNumber: "",
    issuedDate: "",
    transactionDate: "",
    subject1: "",
    subject2: "",
    subject2_name: "",
    subject3: "",
    subject3_name: "",
    checkNumber: "",
    amount: "",
    currency_id: "",
    currency_name: "",
    remarks: "",
    loan_name: "",
  });

  const handleCloseModalSubject = () => {
    setShow(false);
    setShowUpdate(false);
    setIsEdit(false);
    setLoanData({
      issuedDate: "",
      transactionDate: "",
      subject1: "",
      subject2: "",
      subject2_name: "",
      subject3: "",
      subject3_name: "",
      checkNumber: "",
      amount: "",
      currency_id: "",
      currency_name: "",
      remarks: "",
      loan_name: "",
    });
  };

  const fetchTransactionNumber = () => {
    axios
      .get(BASE_URL + "/loan_outstanding/getTransactionNumber")
      .then((res) => {
        setLoanData({
          ...loanData,
          transactionNumber: res.data,
        });

        setShow(true);
      });
  };

  const fetchSubject2Data = (value) => {
    axios
      .get(BASE_URL + "/accountListSub/getSubject", {
        params: {
          account_selected: value,
        },
      })
      .then((res) => {
        // console.log(res.data);
        setSubject2LoanDataList(res.data);
      });
  };

  const fetchSubject3Data = (value) => {
    axios
      .get(BASE_URL + "/accountListSub/getSubject3", {
        params: { subjectId: value },
      })
      .then((res) => {
        setSubject3LoanDataList(res.data);
      });
  };

  const fetchCurrencyList = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrencyList(res.data);
    });
  };

  const fetchDataTable = () => {
    axios.get(BASE_URL + "/loan_outstanding/fetchLoan").then((res) => {
      setFilteredLoanData(res.data);
    });
  };
  const handleAddLoan = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      try {
        const isQuestion = await swal({
          title: "Are you sure?",
          text: "Once you add, you will not be able to undo this loan",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });
        const formatLoanData = {
          ...loanData,
          amount: parseFloat(loanData.amount.replace(/,/g, "")),
          created_by: userLoggedID,
        };
        if (isQuestion) {
          await axios
            .post(BASE_URL + "/loan_outstanding/addLoan", formatLoanData)
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Loan Added",
                  text: "The loan has been added",
                  icon: "success",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  // fetchCutoff();
                  // fetchTransactionNumber();
                  // handleCloseModalSubject();
                  handleCloseModalSubject();
                  fetchDataTable();
                });
              }
            })
            .catch((error) => {
              console.log(error);
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            });
        }
      } catch (error) {
        console.log(error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
      }
    }
    setValidated(false);
  };

  const handleUpdateLoan = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      try {
        const isQuestion = await swal({
          title: "Are you sure?",
          text: "Once you add, you will not be able to undo this loan",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });
        const formatLoanData = {
          ...loanData,
          amount: parseFloat(loanData.amount.replace(/,/g, "")),
          loanId: selectedIDUpdate,
        };
        if (isQuestion) {
          await axios
            .post(BASE_URL + "/loan_outstanding/updateLoan", formatLoanData)
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "The loan has been updated successfully",
                  icon: "success",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  // fetchCutoff();
                  // fetchTransactionNumber();
                  // handleCloseModalSubject();
                  handleCloseModalSubject();
                  fetchDataTable();
                });
              }
            })
            .catch((error) => {
              console.log(error);
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            });
        }
      } catch (error) {
        console.log(error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
      }
    }
    setValidated(false);
  };

  const handleLoanAmount = (e) => {
    let value = e.target.value;

    if (value == ".") {
      setLoanData((prev) => ({
        ...prev,
        amount: prev.amount + ".",
      }));
    }

    let inputValue = value.replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setLoanData({
      ...loanData,
      amount: formattedValue,
    });
  };

  const columns = [
    {
      name: "Transaction Number",
      selector: (row) => `${row.transaction_number}`,
    },
    {
      name: "Loan Description",
      selector: (row) => `${row.loan_name}`,
    },
    {
      name: "Loan For",
      selector: (row) => `${row.account_list_sub3.account_name}`,
    },
    {
      name: "Transaction Date",
      selector: (row) => `${row.transaction_date}`,
    },
    {
      name: "Loan Amount",
      selector: (row) =>
        `${row.amount.toLocaleString("en-US", {
          style: "currency",
          currency: row.currency.currency_name,
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`,
    },
    {
      name: "Check Number",
      selector: (row) => `${row.check_number}`,
    },
    {
      name: "Issued Date",
      selector: (row) => `${row.date_issued}`,
    },

    {
      name: "Remarks",
      selector: (row) => `${row.remarks}`,
    },
    {
      name: "Status",
      selector: (row) => `${row.status}`,
    },
  ];

  const handleApprove = async (e) => {
    try {
      const isQuestion = await swal({
        title: "Are you sure?",
        text: "You are about to approve this loan",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });
      const formatLoanData = {
        ...loanData,
        amount: parseFloat(loanData.amount.replace(/,/g, "")),
        loanId: selectedIDUpdate,
        userLoggedID: userLoggedID,
      };
      if (isQuestion) {
        await axios
          .post(BASE_URL + "/loan_outstanding/approveLoan", formatLoanData)
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "The loan has been updated successfully",
                icon: "success",
                timer: 2000,
                button: false,
              }).then(() => {
                // fetchCutoff();
                // fetchTransactionNumber();
                // handleCloseModalSubject();
                handleCloseModalSubject();
                fetchDataTable();
              });
            }
          })
          .catch((error) => {
            console.log(error);
            swal({
              title: "Something went wrong",
              text: "Please contact your support immediately",
              icon: "error",
              timer: 2000,
            });
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = (e) => {};

  useEffect(() => {
    fetchCurrencyList();
    setIsLoading(false);
    fetchDataTable();
  }, []);

  const handleRedirect = (row) => {
    fetchSubject2Data(row.subject1);
    fetchSubject3Data(row.subject2_id);
    setSelectedIDUpdate(row.id);
    setSelectedIDUpdateStatus(row.status);
    const value = String(row.amount);

    // console.log(row.amount);

    if (value == ".") {
      setLoanData((prev) => ({
        ...prev,
        amount: prev.amount + ".",
      }));
    }

    let inputValue = value.replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
    setLoanData({
      ...loanData,
      issuedDate: row.date_issued,
      transactionDate: row.transaction_date,
      subject1: row.subject1,
      subject2: row.subject2_id,
      // subject2_name: row.subject2.account_name,
      subject3: row.subject3_id,
      // subject3_name: row.subject3.account_name,
      checkNumber: row.check_number,
      amount: formattedValue,
      currency_id: row.currency_id,
      currency_name: row.currency.currency_name,
      transactionNumber: row.transaction_number,
      remarks: row.remarks,
      loan_name: row.loan_name,
    });

    setShowUpdate(true);
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
      ) : authrztn.includes("Loan-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">LOAN MANAGEMENT</span>
              <span>LOAN</span>
            </div>
            <div>
              <button
                onClick={fetchTransactionNumber}
                className="btn btn-primary d-flex flex-row align-items-center title-button"
              >
                <i className="bx bx-plus fs-5"></i> Create
              </button>
            </div>
          </div>
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <span>Loan Type</span>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Loan Type
                  </option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Employee Loan">Employee Loan</option>
                  <option value="Bank Loan">Bank Loan</option>
                  <option value="Vendor Loan">Vendor Loan</option>
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>From</span>
                <input type="date" name="" id="" className="form-control" />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input type="date" name="" id="" className="form-control" />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button>
              </div>
            </div>
          </div>
          <div className="w-100 mt-4 mb-2 container-fluid">
            <div className="input-group w-50">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                // value={searchQuery}
                // onChange={handleSearchChange}
              />
            </div>
          </div>
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={filteredLoanData}
              customStyles={customStyles}
              pagination
              className="dataTable"
              onRowClicked={handleRedirect}
            />
          </div>

          {/* Subject modal for LOAN ADD */}
          <Modal
            show={show}
            onHide={handleCloseModalSubject}
            backdrop="static"
            size="lg"
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={(e) => handleAddLoan(e)}
            >
              <Modal.Header closeButton>
                <Modal.Title className="text-primary fw-bold">
                  Add Loan Details
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="w-100 px-2 py-0">
                  <div className="card border-0">
                    <div className="card-body">
                      <h5 className="card-title mb-4">Loan Information</h5>

                      {/* Transaction Number Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionNumber"
                            className="fw-semibold"
                          >
                            Transaction Number
                          </label>
                          <Form.Control
                            type="text"
                            id="transactionNumber"
                            readOnly
                            required
                            value={loanData.transactionNumber}
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                transactionNumber: e.target.value,
                              })
                            }
                            placeholder="Enter transaction number"
                            className="rounded"
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionNumber"
                            className="fw-semibold"
                          >
                            Name{" "}
                          </label>
                          <Form.Control
                            type="text"
                            id="transactionNumber"
                            required
                            value={loanData.loan_name}
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                loan_name: e.target.value,
                              })
                            }
                            placeholder="Loan Description"
                            className="rounded"
                          />
                        </div>
                      </div>

                      {/* Transaction Date Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionDate"
                            className="fw-semibold"
                          >
                            Transaction Date
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-calendar-alt"></i>
                            </span>
                            <Form.Control
                              type="date"
                              id="transactionDate"
                              value={loanData.transactionDate}
                              required
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  transactionDate: e.target.value,
                                })
                              }
                              className="rounded"
                            />
                          </div>
                        </div>

                        <div className="col-sm">
                          <label htmlFor="issuedDate" className="fw-semibold">
                            Issued Date
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-calendar-alt"></i>
                            </span>
                            <Form.Control
                              type="date"
                              id="issuedDate"
                              value={loanData.issuedDate}
                              required
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  issuedDate: e.target.value,
                                })
                              }
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Currency Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="currency" className="fw-semibold">
                            Currency
                          </label>
                          <Form.Select
                            value={loanData.currency_id}
                            required
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                currency_id: e.target.value,
                                currency_name:
                                  e.target.options[e.target.selectedIndex].text,
                              })
                            }
                          >
                            <option value="" selected disabled>
                              Select Currency
                            </option>
                            {currencyList.map((currency) => (
                              <option key={currency.id} value={currency.id}>
                                {currency.currency_name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                        <div className="col-sm">
                          <label htmlFor="checkNumber" className="fw-semibold">
                            Check Number
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-file-invoice"></i>
                            </span>
                            <Form.Control
                              type="text"
                              id="checkNumber"
                              value={loanData.checkNumber}
                              required
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  checkNumber: e.target.value,
                                })
                              }
                              placeholder="Enter check number"
                              className="rounded"
                              maxLength={15}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subject Fields  */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject1" className="fw-semibold">
                            Subject 1
                          </label>
                          <Form.Select
                            id="subject1"
                            value={loanData.subject1}
                            disabled={loanData.currency_id === ""}
                            required
                            onChange={(e) => {
                              setLoanData({
                                ...loanData,
                                subject1: e.target.value,
                                subject2: "",
                                subject3: "",
                              });
                              fetchSubject2Data(e.target.value);
                            }}
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 1
                            </option>
                            <option value="Owner's Equity Account">
                              Owner's Equity Account
                            </option>
                            <option value="Account-List">Account-List</option>
                            <option value="Asset Account">Asset Account</option>
                            <option value="Liabilities Account">
                              Liabilities Account
                            </option>
                          </Form.Select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject2" className="fw-semibold">
                            Subject 2
                          </label>
                          <Form.Select
                            id="subject2"
                            value={loanData.subject2}
                            disabled={loanData.currency_id === ""}
                            required
                            onChange={(e) => {
                              setLoanData({
                                ...loanData,
                                subject2: e.target.value,
                                subject3: "",
                                subject2_name:
                                  e.target.options[e.target.selectedIndex].text,
                              });
                              fetchSubject3Data(e.target.value);
                            }}
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 2
                            </option>
                            {subject2LoanDataList.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.subject_name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject3" className="fw-semibold">
                            Subject 3
                          </label>
                          <Form.Select
                            id="subject3"
                            value={loanData.subject3}
                            disabled={loanData.currency_id === ""}
                            required
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                subject3: e.target.value,
                                subject3_name:
                                  e.target.options[e.target.selectedIndex].text,
                              })
                            }
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 3
                            </option>
                            {subject3LoanDataList
                              .filter(
                                (option) =>
                                  String(option.currency_id) ===
                                  String(loanData.currency_id)
                              )
                              .map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.account_name}
                                </option>
                              ))}
                          </Form.Select>
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="amount" className="fw-semibold">
                            Amount
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              {loanData.currency_name}
                            </span>
                            <Form.Control
                              type="text"
                              id="amount"
                              value={loanData.amount}
                              required
                              // onChange={(e) =>
                              //   setLoanData({
                              //     ...loanData,
                              //     amount: e.target.value,
                              //   })
                              // }
                              onChange={handleLoanAmount}
                              placeholder="Enter amount"
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="remarks" className="fw-semibold">
                            Remarks
                          </label>
                          <div className="input-group">
                            <Form.Control
                              as="textarea"
                              id="remarks"
                              value={loanData.remarks}
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  remarks: e.target.value,
                                })
                              }
                              placeholder="Enter remarks"
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleCloseModalSubject}
                  className="rounded"
                >
                  Close
                </Button>
                <Button variant="primary" type="submit" className="rounded">
                  Save Loan
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Subject modal for LOAN Update */}
          <Modal
            show={showUpdate}
            onHide={handleCloseModalSubject}
            backdrop="static"
            size="lg"
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={(e) => handleUpdateLoan(e)}
            >
              <Modal.Header closeButton>
                <Modal.Title className="text-primary fw-bold">
                  Loan Details
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="w-100 px-2 py-0">
                  <div className="card border-0">
                    <div className="card-body">
                      <h5 className="card-title mb-4">Loan Information</h5>

                      {/* Transaction Number Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionNumber"
                            className="fw-semibold"
                          >
                            Transaction Number
                          </label>
                          <Form.Control
                            type="text"
                            id="transactionNumber"
                            readOnly
                            required
                            value={loanData.transactionNumber}
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                transactionNumber: e.target.value,
                              })
                            }
                            placeholder="Enter transaction number"
                            className="rounded"
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionNumber"
                            className="fw-semibold"
                          >
                            Name{" "}
                          </label>
                          <Form.Control
                            type="text"
                            id="transactionNumber"
                            required
                            value={loanData.loan_name}
                            readOnly={isEdit === false}
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                loan_name: e.target.value,
                              })
                            }
                            placeholder="Loan Description"
                            className="rounded"
                          />
                        </div>
                      </div>

                      {/* Transaction Date Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label
                            htmlFor="transactionDate"
                            className="fw-semibold"
                          >
                            Transaction Date
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-calendar-alt"></i>
                            </span>
                            <Form.Control
                              type="date"
                              id="transactionDate"
                              readOnly={isEdit === false}
                              value={loanData.transactionDate}
                              required
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  transactionDate: e.target.value,
                                })
                              }
                              className="rounded"
                            />
                          </div>
                        </div>

                        <div className="col-sm">
                          <label htmlFor="issuedDate" className="fw-semibold">
                            Issued Date
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-calendar-alt"></i>
                            </span>
                            <Form.Control
                              type="date"
                              id="issuedDate"
                              value={loanData.issuedDate}
                              required
                              readOnly={isEdit === false}
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  issuedDate: e.target.value,
                                })
                              }
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Currency Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="currency" className="fw-semibold">
                            Currency
                          </label>
                          <Form.Select
                            value={loanData.currency_id}
                            required
                            disabled={isEdit === false}
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                currency_id: e.target.value,
                                currency_name:
                                  e.target.options[e.target.selectedIndex].text,
                              })
                            }
                          >
                            <option value="" selected disabled>
                              Select Currency
                            </option>
                            {currencyList.map((currency) => (
                              <option key={currency.id} value={currency.id}>
                                {currency.currency_name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                        <div className="col-sm">
                          <label htmlFor="checkNumber" className="fw-semibold">
                            Check Number
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-file-invoice"></i>
                            </span>
                            <Form.Control
                              type="text"
                              id="checkNumber"
                              value={loanData.checkNumber}
                              required
                              readOnly={isEdit === false}
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  checkNumber: e.target.value,
                                })
                              }
                              placeholder="Enter check number"
                              className="rounded"
                              maxLength={15}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subject Fields  */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject1" className="fw-semibold">
                            Subject 1
                          </label>
                          <Form.Select
                            id="subject1"
                            value={loanData.subject1}
                            disabled={
                              loanData.currency_id === "" || isEdit === false
                            }
                            required
                            onChange={(e) => {
                              setLoanData({
                                ...loanData,
                                subject1: e.target.value,
                                subject2: "",
                                subject3: "",
                              });
                              fetchSubject2Data(e.target.value);
                            }}
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 1
                            </option>
                            <option value="Owner's Equity Account">
                              Owner's Equity Account
                            </option>
                            <option value="Account-List">Account-List</option>
                            <option value="Asset Account">Asset Account</option>
                            <option value="Liabilities Account">
                              Liabilities Account
                            </option>
                          </Form.Select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject2" className="fw-semibold">
                            Subject 2
                          </label>
                          <Form.Select
                            id="subject2"
                            value={loanData.subject2}
                            disabled={
                              loanData.currency_id === "" || isEdit === false
                            }
                            required
                            onChange={(e) => {
                              setLoanData({
                                ...loanData,
                                subject2: e.target.value,
                                subject3: "",
                                subject2_name:
                                  e.target.options[e.target.selectedIndex].text,
                              });
                              fetchSubject3Data(e.target.value);
                            }}
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 2
                            </option>
                            {subject2LoanDataList.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.subject_name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="subject3" className="fw-semibold">
                            Subject 3
                          </label>
                          <Form.Select
                            id="subject3"
                            value={loanData.subject3}
                            disabled={
                              loanData.currency_id === "" || isEdit === false
                            }
                            required
                            onChange={(e) =>
                              setLoanData({
                                ...loanData,
                                subject3: e.target.value,
                                subject3_name:
                                  e.target.options[e.target.selectedIndex].text,
                              })
                            }
                            className="rounded"
                          >
                            <option value="" disabled>
                              Select Subject 3
                            </option>
                            {subject3LoanDataList
                              .filter(
                                (option) =>
                                  String(option.currency_id) ===
                                  String(loanData.currency_id)
                              )
                              .map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.account_name}
                                </option>
                              ))}
                          </Form.Select>
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="amount" className="fw-semibold">
                            Amount
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              {loanData.currency_name}
                            </span>
                            <Form.Control
                              type="text"
                              id="amount"
                              value={loanData.amount}
                              readOnly={isEdit === false}
                              required
                              // onChange={(e) =>
                              //   setLoanData({
                              //     ...loanData,
                              //     amount: e.target.value,
                              //   })
                              // }
                              onChange={handleLoanAmount}
                              placeholder="Enter amount"
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="row mb-3">
                        <div className="col-sm">
                          <label htmlFor="remarks" className="fw-semibold">
                            Remarks
                          </label>
                          <div className="input-group">
                            <Form.Control
                              as="textarea"
                              id="remarks"
                              readOnly={isEdit === false}
                              value={loanData.remarks}
                              onChange={(e) =>
                                setLoanData({
                                  ...loanData,
                                  remarks: e.target.value,
                                })
                              }
                              placeholder="Enter remarks"
                              className="rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                {isEdit === false ? (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleCloseModalSubject}
                    className="rounded"
                  >
                    Close
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => setIsEdit(false)}
                    className="rounded"
                  >
                    Cancel
                  </Button>
                )}

                {selectedIDUpdateStatus === "Pending" && (
                  <>
                    {isEdit === false && (
                      <>
                        <Button
                          variant="warning"
                          type="button"
                          onClick={() => setIsEdit(true)}
                          className="rounded"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="success"
                          type="button"
                          className="rounded"
                          onClick={handleApprove}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="danger"
                          type="button"
                          className="rounded"
                          onClick={handleReject}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </>
                )}
                {isEdit === true && (
                  <Button variant="primary" type="submit" className="rounded">
                    Save Changes
                  </Button>
                )}
              </Modal.Footer>
            </Form>
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

export default Loan;
