import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const PayEquity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [userMasterList, setUserMasterList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [paymentEquity, setPaymentEquity] = useState([]);
  const [selectedPage, setSelectedPage] = useState("LoanDetails");
  const { register, setValue, getValues, watch, control } = useForm({
    defaultValues: {
      loanReference: "",
      loanUser: "",
      accountName: "",
      paymentOptions: "",
      releaseDate: "",
      loanAmount: "",
      interestPercent: "",
      interestAmount: "",
      loanTerms: "",
      remarks: "",
    },
  });
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [accountID, setAccountID] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSelectedPage = (selected) => {
    setSelectedPage(selected);
  };

  const handleCancelLoan = () => {
    navigate("/accounting/equity");
  };

  useEffect(() => {
    axios
      .get(`${BASE_URL}/equity/fetchEquity`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const payment = res.data;

          setValue("loanReference", payment.reference);
          setValue("loanUser", payment.masterlist.id);
          setValue("accountName", payment.account_list.account_list_id);
          setValue("paymentOptions", payment.payment_options);
          setValue("releaseDate", payment.release_date);
          setValue("loanAmount", payment.loan_amount);
          setValue("interestPercent", payment.interest_percent);
          setValue("interestAmount", payment.interest_amount);
          setValue("loanTerms", payment.terms);
          setValue("remarks", payment.remarks);
        }
      })
      .catch((err) => console.log(err));
  }, [id, setValue]);

  const fetchPayments = () => {
    axios
      .get(`${BASE_URL}/equity/fetchEquityPayment`, {
        params: { id: id },
      })
      .then((res) => {
        const transformedData = res.data.map((data) => ({
          paymentMethod: data.payment_method,
          paymentDate: data.payment_date,
          accountID: data.account_id,
          accountName: `${data.account_list.bank_name} - ${data.account_list.account_name}`,
          checkNumber: data.check_number,
          amount: data.amount,
          remarks: data.remarks,
          type: "old",
        }));
        setPaymentEquity(transformedData);

        // alert(transformedData);
      })
      .catch((err) => console.log(err));
  };

  const fetchUserList = () => {
    axios
      .get(BASE_URL + "/equity/fetchUserList")
      .then((res) => {
        setUserMasterList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccountList = () => {
    axios
      .get(BASE_URL + "/equity/getAccountListData", {
        params: {
          paymentMethod,
        },
      })
      .then((res) => {
        setAccountList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCloseModal = () => {
    setAddPaymentModal(false);
    // Optionally, clear the form after submission
    setPaymentMethod("CASH");
    setPaymentDate("");
    setAccountID("");
    setCheckNumber("");
    setAmount("");
    setRemarks("");
  };

  const handleAccountChange = (e) => {
    const selectedAccountID = e.target.value; // Get account ID
    const selectedAccountName = e.target.options[e.target.selectedIndex].text; // Get account name

    setAccountID(selectedAccountID);
    setAccountName(selectedAccountName);
  };

  const handleSave = (e) => {
    e.preventDefault(); // prevent default form submission

    swal({
      icon: "warning",
      title: "Are you sure?",
      text: "You are about to save changes.",
      buttons: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(BASE_URL + "/equity/saveEquity", null, {
              params: {
                id,
                paymentEquity,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Changes Successfully saved",
                }).then(() => {
                  fetchPayments();
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                });
              }
            })
            .catch((err) => {
              console.log(err);
              swal({
                icon: "error",
                title: "Something went wrong",
                text: "Please contact your support immediately",
              });
            });
        } catch (error) {
          console.log(error);
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact your support immediately",
          });
        }
      }
    });
  };

  const handleAddPayment = (e) => {
    e.preventDefault(); // prevent default form submission

    swal({
      icon: "warning",
      title: "Add this Payment?",
      text: "You are about to add a payment.",
      buttons: true,
    }).then((confirmed) => {
      if (confirmed) {
        // Create a new payment object with the input values
        const newPayment = {
          paymentMethod: checkNumber === "" ? "BANK" : "CHECK",
          paymentDate,
          accountID,
          accountName,
          checkNumber: checkNumber === "" ? null : checkNumber,
          amount,
          remarks,
          type: "new",
        };

        // Update the payments array with the new payment
        setPaymentEquity([...paymentEquity, newPayment]);

        handleCloseModal();
      }
    });
  };

  useEffect(() => {
    fetchUserList();
    fetchAccountList();
    fetchPayments();
  }, [paymentMethod]);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const columns = [
    {
      name: "Type",
      selector: (row) => row.paymentMethod,
    },
    {
      name: "Account Name",
      selector: (row) => row.accountName,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
    },

    {
      name: "Check Number",
      selector: (row) => (row.checkNumber ? row.checkNumber : "N/A"),
    },
    {
      name: "Remarks",
      selector: (row) => row.remarks,
    },
    {
      name: "Issued Date",
      selector: (row) => row.paymentDate,
    },
  ];
  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        <Form onSubmit={handleSave}>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">LEND DETAILS</span>
            </div>
            <div></div>
          </div>
          <div className="container">
            <div className="row mt-3 mb-2">
              <div className="col-sm mb-2">
                <span>Equity ID</span>
                <input
                  type="text"
                  name=""
                  id=""
                  className="form-control p-3"
                  readOnly
                  {...register("loanReference")}
                />
              </div>
              <div className="col-sm mb-2">
                <span>
                  Name <span className="text-danger">*</span>
                </span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("loanUser")}
                  disabled
                >
                  <option value="" selected disabled>
                    Select Name
                  </option>
                  {userMasterList.map((data, i) => (
                    <option key={data.id} value={data.id}>
                      {`${data.fname} ${data.mname} ${data.lname}`}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-sm mb-2">
                <span>
                  Account <span className="text-danger">*</span>
                </span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("accountName")}
                  disabled
                >
                  <option value="" selected disabled>
                    Select Category
                  </option>
                  {accountList.map((data, i) => (
                    <option
                      key={data.account_list_id}
                      value={data.account_list_id}
                    >
                      {`${data.bank_name} - ${data.account_name}`}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Payment Options <span className="text-danger">*</span>
                    </span>
                    <Form.Select
                      name=""
                      id=""
                      className="form-select p-3"
                      {...register("paymentOptions")}
                      disabled
                    >
                      <option value="" selected disabled>
                        Select Option
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Check">Check</option>
                    </Form.Select>
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Release Date <span className="text-danger">*</span>
                    </span>
                    <Form.Control
                      type="date"
                      name=""
                      id=""
                      className="form-control p-3"
                      {...register("releaseDate")}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Amount <span className="text-danger">*</span>
                    </span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">₱</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0.00"
                        {...register("loanAmount")}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Interest (%)
                      {/* <span className="text-danger">*</span> */}
                    </span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">%</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0"
                        {...register("interestPercent")}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-sm mb-2">
                    <span>Total Interest Amount</span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">₱</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0.00"
                        {...register("interestAmount")}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-12 col-md-8 mb-3">
                    <span>
                      Term | Cutoff <span className="text-danger">*</span>
                    </span>
                    <Form.Control
                      name=""
                      id=""
                      className="form-select p-3"
                      {...register("loanTerms")}
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <span>Remarks</span>
                <textarea
                  name=""
                  id=""
                  cols="5"
                  rows="5"
                  className="form-control"
                  {...register("remarks")}
                  readOnly
                ></textarea>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="second-content">
              <div className="transaction-section">
                <ul className="nav nav-tabs">
                  <li
                    className="nav-item"
                    onClick={() => handleSelectedPage("LoanDetails")}
                    style={{ cursor: "pointer" }}
                  >
                    <a className="nav-link">Loan Details</a>
                  </li>
                  <li
                    className="nav-item"
                    onClick={() => handleSelectedPage("PaymentForecast")}
                    style={{ cursor: "pointer" }}
                  >
                    <a className="nav-link">Payment</a>
                  </li>
                </ul>

                {selectedPage === "LoanDetails" ? (
                  <>
                    <div className="mainLoanDetails"></div>
                  </>
                ) : (
                  selectedPage === "PaymentForecast" && (
                    <>
                      <div>
                        <Button
                          onClick={(e) => setAddPaymentModal(true)}
                          className="float-end"
                        >
                          Add Payment
                        </Button>

                        <div className="w-100 mt-3 container-fluid">
                          <DataTable
                            columns={columns}
                            data={paymentEquity}
                            customStyles={customStyles}
                            pagination
                            className="dataTable"
                          />
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                <button
                  className="btn btn-outline-secondary w-100 me-3 p-2"
                  type="button"
                  onClick={handleCancelLoan}
                >
                  Cancel
                </button>
                <button className="btn btn-primary w-100 p-2" type="submit">
                  Save
                </button>
              </div>
            </div>
          </div>
        </Form>
      </div>

      <Modal show={addPaymentModal} onHide={handleCloseModal} size="md">
        <Form onSubmit={handleAddPayment}>
          <Modal.Body>
            <strong>Payment Method</strong> <br />{" "}
            <p className="fs-6 text-secondary">Equity Payment</p>
            <Form.Group className="mb-3 p-0">
              <Form.Label>Pay With:</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="CASH"
                  name="paymentMethod"
                  id="CASH"
                  value="CASH"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="BANK"
                  name="paymentMethod"
                  id="BANK"
                  value="BANK"
                  checked={paymentMethod === "BANK"}
                  onChange={() => setPaymentMethod("BANK")}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Payment Date <span className="text-danger">*</span>
              </Form.Label>
              <div>
                <Form.Control
                  inline
                  type="date"
                  label="Date"
                  name="paymentDate"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Account <span className="text-danger">*</span>
              </Form.Label>
              <div>
                <Form.Select value={accountID} onChange={handleAccountChange}>
                  <option value="" selected disabled>
                    Select Account
                  </option>
                  {accountList.map((data, i) => (
                    <option
                      key={data.account_list_id}
                      value={data.account_list_id}
                      name={data.account_name}
                    >
                      {`${data.bank_name} - ${data.account_name}`}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </Form.Group>
            {paymentMethod === "BANK" && (
              <Form.Group className="mb-3">
                <Form.Label>Check #</Form.Label>
                <Form.Control
                  type="text"
                  onChange={(e) => setCheckNumber(e.target.value)}
                  value={checkNumber}
                  placeholder="000000-000-0000"
                />
              </Form.Group>
            )}
            <div className="mb-3">
              <label htmlFor="amount" className="form-label">
                Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">₱</span>
                <Form.Control
                  type="text"
                  onInput={onInputFloat}
                  onChange={(e) => setAmount(e.target.value)}
                  value={amount}
                  id="amount"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <div className="col-12">
                <span>Remarks</span>
                <textarea
                  onChange={(e) => setRemarks(e.target.value)}
                  value={remarks}
                  name=""
                  id=""
                  cols="5"
                  rows="5"
                  className="form-control"
                ></textarea>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="submit" className="btn btn-primary">
              Add Payment
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
            >
              Close
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default PayEquity;
