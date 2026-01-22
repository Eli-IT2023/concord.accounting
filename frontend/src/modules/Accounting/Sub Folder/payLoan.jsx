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

const PayLoan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [checkReference, setCheckReference] = useState("");
  const [amount, setAmount] = useState("");
  const [modalRemarks, setModalRemarks] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const [remainingBalance, setRemainingBalance] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balanceAfterPayment, setBalanceAfterPayment] = useState(0);

  const [hasChanges, setHasChanges] = useState(false);

  const [userMasterList, setUserMasterList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [labelData, setLabelData] = useState([]);
  const [paymentLoan, setPaymentLoan] = useState([]);
  const [selectedPage, setSelectedPage] = useState("LoanDetails");
  const { register, setValue, getValues, watch, control } = useForm({
    defaultValues: {
      loanReference: "",
      loanType: "",
      loanUser: "",
      accountName: "",
      labelAccount_id: "",
      paymentOptions: "",
      loanAmount: "",
      interestPercent: "",
      interestAmount: "",
      loanTerms: "",
      remarks: "",
    },
  });

  const handleSelectedPage = (selected) => {
    setSelectedPage(selected);
  };

  const handleCancelLoan = () => {
    navigate("/accounting/loan");
  };

  useEffect(() => {
    setBalanceAfterPayment(remainingBalance - totalPaid);
  }, [remainingBalance, totalPaid]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/loan/fetchLoan`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const payment = res.data;

          setValue("loanReference", payment.reference);
          setValue("loanType", payment.type);
          setValue("loanUser", payment.masterlist.id);
          setValue(
            "accountName",
            payment.loan_label_mother.account_list.account_list_id
          );
          setValue("labelAccount_id", payment.loan_label_mother.label.id);
          setValue("paymentOptions", payment.payment_options);
          setValue("loanAmount", payment.loan_amount);
          setValue("interestPercent", payment.interest_percent);
          setValue("interestAmount", payment.interest_percent);
          setValue("loanTerms", payment.terms);
          setValue("remarks", payment.remarks);

          setRemainingBalance(payment.loan_amount);
        }
      })
      .catch((err) => console.log(err));
  }, [id, setValue]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/loan/fetchLoanPayment`, {
        params: { id: id },
      })
      .then((res) => {
        const LoanData = res.data.map((data) => ({
          transaction_date: data.transaction_date,
          amount_pay: data.amount_pay,
          payment_method: data.payment_method,
          account_list: data.account_list_id,
          check_reference: data.check_reference,
          remarks: data.remarks,
          account_name: `${data.account_list.bank_name} - ${data.account_list.account_name}`,
          type: "old",
        }));
        setPaymentLoan(LoanData);
        const dataBaseTotalPaid = res.data.reduce(
          (sum, data) => sum + data.amount_pay,
          0
        );
        setTotalPaid(dataBaseTotalPaid);
      })
      .catch((err) => console.log(err));
  }, [id]);

  const fetchUserList = () => {
    axios
      .get(BASE_URL + "/loan/fetchUserList")
      .then((res) => {
        setUserMasterList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccountList = () => {
    axios
      .get(BASE_URL + "/loan/getAccountListData")
      .then((res) => {
        setAccountList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchLabel = () => {
    axios
      .get(BASE_URL + "/label/fetchTable")
      .then((res) => {
        setLabelData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleMakePayment = () => {
    setAddPaymentModal(true);
  };
  // const handleMakePayment = (row) => {
  //   const rowIndex = paymentLoan.findIndex((r) => r.id === row.id);
  //   const previousRow = paymentLoan[rowIndex - 1];

  //   if (rowIndex === 0) {
  //     setAddPaymentModal(true);
  //     setAmountToPay(row.amortization);
  //     setRemainingBalance(row.remaining);
  //     setSelectedRowId(row.id);
  //   } else if (previousRow && previousRow.actual_paid !== 0) {
  //     setAddPaymentModal(true);
  //     setAmountToPay(row.amortization);
  //     setRemainingBalance(row.remaining);
  //     setSelectedRowId(row.id);
  //     setSelectedPayments((prev) => ({
  //       ...prev,
  //       [row.id]: { amount: 0 },
  //     }));
  //   } else {
  //     swal({
  //       title: "Incomplete Payment!",
  //       text: "You need to complete the payment on the previous row before proceeding with subsequent payments.",
  //       icon: "warning",
  //       confirmButtonText: "OK",
  //     }).then(() => {
  //       setAddPaymentModal(false);
  //     });
  //   }
  // };

  const handleCloseAddPaymentModal = () => {
    setAddPaymentModal(false);
  };

  const handleAccountChange = (e) => {
    const AccountBankName = e.target.options[e.target.selectedIndex].text;
    setSelectedAccount(e.target.value);
    setBankAccount(AccountBankName);
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      return;
    }
    const newPayment = {
      transaction_date: paymentDate,
      amount_pay: parseFloat(amount),
      payment_method: paymentMethod,
      account_list: selectedAccount,
      check_reference: checkReference,
      remarks: modalRemarks,
      account_name: bankAccount,
      type: "new",
    };
    setHasChanges(true);
    // Push the new payment data into paymentLoan array
    setPaymentLoan((prev) => [...prev, newPayment]);
    setAddPaymentModal(false);
    setPaymentMethod("Cash");
    setPaymentDate("");
    setSelectedAccount("");
    setCheckReference("");
    setAmount("");
    setModalRemarks("");
  };

  const savePayment = (e) => {
    e.preventDefault();
    axios
      .post(`${BASE_URL}/loan/savePayment`, {
        id,
        paymentLoan,
      })
      .then((response) => {
        if (response.status === 200) {
          swal({
            title: "Success!",
            text: "Payments saved successfully.",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/accounting/loan");
          });
        }
      })
      .catch((err) => {
        console.error(err);
        swal({
          title: "Error!",
          text: "An error occurred while saving payments.",
          icon: "error",
          confirmButtonText: "OK",
        });
      });
  };

  const forecastColumn = [
    {
      name: "Transaction Date",
      selector: (row) => {
        const date = new Date(row.transaction_date);
        return new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
        }).format(date);
      },
    },
    {
      name: "Amount Pay",
      selector: (row) =>
        row.amount_pay.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Account",
      selector: (row) => row.account_name,
    },
    {
      name: "Payment Method",
      selector: (row) => row.payment_method,
    },
    {
      name: "Cheque Reference",
      selector: (row) => row.check_reference || "N/A",
    },
    {
      name: "Remarks",
      selector: (row) => row.remarks || "N/A",
    },
  ];

  useEffect(() => {
    fetchUserList();
    fetchAccountList();
    fetchLabel();
  }, []);

  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">LOAN DETAILS</span>
          </div>
          <div></div>
        </div>
        <Form onSubmit={savePayment}>
          <div className="container">
            <div className="row mt-3 mb-2">
              <div className="col-sm mb-2">
                <span>Loan Number</span>
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
                  Loan Type <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("loanType")}
                  disabled
                >
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
                <span>
                  Name <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("loanUser")}
                  disabled
                >
                  <option>Select Name</option>
                  {userMasterList.map((data, i) => (
                    <option key={data.id} value={data.id}>
                      {`${data.fname} ${data.mname} ${data.lname}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <span>
                  Account <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("accountName")}
                  disabled
                >
                  <option value="">Select Account</option>
                  {accountList.map((data, i) => (
                    <option
                      key={data.account_list_id}
                      value={data.account_list_id}
                    >
                      {`${data.bank_name} - ${data.account_name}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4 mb-2">
                <span>
                  Payment Options <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("paymentOptions")}
                  disabled
                >
                  <option value="" selected disabled>
                    Select Payment
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Loan Amount <span className="text-danger">*</span>
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
                    <span>Int Per (%)</span>
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
                    <span>
                      Int Amount <span className="text-danger">*</span>
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
                  <div className="col-sm mb-2">
                    <span>
                      Term | Cutoff <span className="text-danger">*</span>
                    </span>
                    <input
                      type="text"
                      className="form-control p-3"
                      id="inlineFormInputGroup"
                      {...register("loanTerms")}
                      readOnly
                    />
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Subject <span className="text-danger">*</span>
                    </span>
                    <Form.Select
                      name=""
                      id=""
                      className="form-select p-3"
                      {...register("labelAccount_id")}
                      required
                      disabled
                    >
                      <option value="" selected disabled>
                        Select Subject
                      </option>
                      {labelData.map((data, i) => (
                        <option key={data.id} value={data.id}>
                          {`${data.label_name} - ${data.sub_label_name}`}
                        </option>
                      ))}
                    </Form.Select>
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
                      <div className="w-100 mt-3 container-fluid">
                        <DataTable
                          columns={forecastColumn}
                          data={paymentLoan}
                          customStyles={customStyles}
                          pagination
                          className="dataTable"
                        />
                      </div>
                      <div className="w-100 d-flex">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleMakePayment()}
                          type="button"
                          disabled={balanceAfterPayment === 0}
                        >
                          Make Payment
                        </button>
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
                <button
                  className="btn btn-primary w-100 p-2"
                  type="submit"
                  disabled={!hasChanges}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Form>
      </div>

      <Modal
        show={addPaymentModal}
        onHide={handleCloseAddPaymentModal}
        size="md"
      >
        <Modal.Body>
          <strong>Payment Method</strong> <br />{" "}
          <p style={{ fontSize: "15px" }}>Loan Payment</p>
          <Form onSubmit={handleAddPayment}>
            <Form.Group className="mb-3 p-0">
              <Form.Label>Pay With:</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Cash"
                  name="paymentMethod"
                  id="cash"
                  value="cash"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Check"
                  name="paymentMethod"
                  id="check"
                  value="check"
                  checked={paymentMethod === "Check"}
                  onChange={() => setPaymentMethod("Check")}
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
                  required
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Account <span className="text-danger">*</span>
              </Form.Label>
              <div>
                <Form.Select
                  value={selectedAccount}
                  onChange={handleAccountChange}
                  required
                >
                  <option value="" selected disabled>
                    Select Account
                  </option>
                  {accountList.map((data, i) => (
                    <option
                      key={data.account_list_id}
                      value={data.account_list_id}
                      name={`${data.bank_name} - ${data.account_name}`}
                    >
                      {`${data.bank_name} - ${data.account_name}`}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </Form.Group>
            {paymentMethod === "Check" && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Check # <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="000000-000-0000"
                  required={paymentMethod === "Check"}
                  value={checkReference}
                  onChange={(e) => setCheckReference(e.target.value)}
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
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  name=""
                  id=""
                  cols="5"
                  rows="5"
                  className="form-control"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Amount to pay</strong>
                <div>
                  ₱{" "}
                  {balanceAfterPayment.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Payment
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PayLoan;
