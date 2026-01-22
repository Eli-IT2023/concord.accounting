import React, { useState, useEffect } from "react";
import { Table, Modal, Button, Form } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";

const OwnersEquity2 = () => {
  const { id } = useParams();
  const [accountName, setAccountName] = useState([]);
  const [debitDataTransaction, setDebitDataTransaction] = useState([]);
  const [creditDataTransaction, setCreditDataTransaction] = useState([]);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountRes, debitRes, creditRes] = await Promise.all([
          axios.get(`${BASE_URL}/equity/equityAccountName/`, {
            params: { id },
          }),
          axios.get(`${BASE_URL}/equity/debitEquityTransaction/`, {
            params: { id },
          }),
          axios.get(`${BASE_URL}/equity/creditEquityTransaction/`, {
            params: { id },
          }),
        ]);

        setAccountName(accountRes.data);
        setDebitDataTransaction(debitRes.data);
        setCreditDataTransaction(creditRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
  }, [id]);

  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleShow2 = () => setShowModal2(true);

  const handleClose = () => {
    setShowModal(false);
    setShowModal2(false);
    setValidated(false);
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setPaymentMethod("");
    setAmount("");
    setCheckNo("");
    setDate("");
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
    setIsPaymentMethodDisabled(true);
    setIsRemarksDisabled(true);
  };

  // function for the specific row undisabled
  const [enabledRow, setEnabledRow] = useState(null);

  const handleEnableRow = (rowId) => {
    setEnabledRow(rowId); // Enable the clicked row, and disable all others
  };

  const isRowEnabled = (rowId) => enabledRow === rowId; // Check if a specific row is enabled
  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };
  // State for dropdown selections
  const [subject1, setSubject1] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject2, setSubject2] = useState("");
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [subject3, setSubject3] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [checkNo, setCheckNo] = useState("");
  const [date, setDate] = useState("");
  // State to manage disabled states
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);

  // Update subject2 and subject3 based on Subject 1 selection
  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      account_selected = "/accountListSub/getSubject";
    } else if (selectedSubject1 === "Asset Account") {
      account_selected = "/assetSub/getSubject";
    } else if (selectedSubject1 === "Liabilities Account") {
      account_selected = "/liabilitiesSub/getSubject";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      account_selected = "/equity/getEquitySubject";
    }

    try {
      axios.get(`${BASE_URL}${account_selected}`).then((res) => {
        setSubject1(selectedSubject1);

        setSubject2("");
        setSubject3("");
        setPaymentMethod("");
        setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
        setIsSubject3Disabled(true); // Reset and disable Subject 3
        setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
        setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

        setSubject2DataList(res.data); //retrieve subject 2 data
      });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
  };

  // Update Subject 3 based on Subject 2 selection
  const handleSubject2Change = (event) => {
    const selectedSubject2 = event.target.value;

    try {
      axios
        .get(`${BASE_URL}/equity/getEquitySubject3ChainDropdown`, {
          params: {
            subjectId: selectedSubject2,
            id: id,
          },
        })
        .then((res) => {
          setSubject3DataList(res.data);
          setSubject2(selectedSubject2);
          setSubject3("");
          setPaymentMethod("");
          setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
          setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
          setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
        });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
  };

  // Enable payment method after Subject 3 selection
  const handleSubject3Change = (event) => {
    const selectedSubject3 = event.target.value;
    setSubject3(selectedSubject3);
    setPaymentMethod("");
    setIsPaymentMethodDisabled(false); // Enable Payment Method after Subject 3 selection
    setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  };

  // Enable Remarks/Check No. after Payment Method selection
  const handlePaymentMethodChange = (event) => {
    const selectedPaymentMethod = event.target.value;
    setPaymentMethod(selectedPaymentMethod);
    setIsRemarksDisabled(false); // Enable Remarks/Check No. after Payment Method selection
  };

  //function for create transaction
  const handleFormSubmit = async (e, type) => {
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
        const willProceed = await swal({
          title: "Are you sure?",
          text: "Once submitted, you will not be able to edit this transaction.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });

        if (willProceed) {
          const response = await axios.post(
            `${BASE_URL}/equity/equityCreateTransaction`,
            {
              subject1,
              subject3,
              paymentMethod,
              amount,
              checkNo,
              date,
              id,
              type,
            }
          );

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Transaction created successfully",
              timer: 2000,
            }).then(() => {
              handleClose();
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
            });
          }
        }
      } catch (error) {
        console.error(error);
        swal({
          icon: "error",
          title: "Something went wrong",
          text: "Please contact your support immediately",
          timer: 2000,
        });
      }
    }
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case "PHP":
        return "₱"; // Philippine Peso
      case "USD":
        return "$"; // US Dollar
      case "CHN":
        return "¥"; // Chinese Yuan / Yen
      default:
        return ""; // Fallback for unknown currencies
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between mb-5">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link className="text-dark" to="/accounting/equity">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>{" "}
            {`(${accountName?.equity_account?.subject_name}) ${accountName.account_name} `}
          </span>
        </div>
        <div className="">
          <span className="fs-4">
            <strong>Current Balance : </strong>
            <span>{getCurrencySymbol(accountName?.currency)}</span>{" "}
            <span className="text-primary text-decoration-underline">
              {accountName?.amount !== undefined && accountName?.amount !== null
                ? accountName.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : 0.0}
            </span>
          </span>
        </div>
      </div>
      <div className="w-100 mb-4">
        <div className="row">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>

          <div className="col-sm d-flex flex-row">
            <button
              className="btn btn-success danger  w-100"
              style={{ padding: "0.7rem 1.7rem" }}
              onClick={handleShow}
            >
              In
            </button>
            <button
              className="btn btn-danger mx-2 w-100"
              style={{ padding: "0.7rem 1.7rem" }}
              onClick={handleShow2}
            >
              Out
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table bordered style={{ border: "1px solid black" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th colSpan={3}>Debit</th>
            <th colSpan={3}>Credit</th>
            <th>Balance</th>
          </tr>
          <tr>
            <th></th>
            <th>Payment Method</th>
            <th>Check No.</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Check No.</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* Debit Transactions */}
          {debitDataTransaction &&
            debitDataTransaction.length > 0 &&
            debitDataTransaction.map((debit, index) => (
              <tr key={`debit-${index}`}>
                <td rowSpan={1}>{debit.date}</td>
                <td>{debit.payment_method}</td>
                <td>{debit.check_or_remarks}</td>
                <td>{debit.amount}</td>
                <td></td>
                <td></td>
                <td></td>
                <td className="text-primary">{/* Balance logic here */}</td>
              </tr>
            ))}

          {/* Credit Transactions */}
          {creditDataTransaction &&
            creditDataTransaction.length > 0 &&
            creditDataTransaction.map((credit, index) => (
              <tr key={`credit-${index}`}>
                <td rowSpan={1}>{credit.date}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>{credit.payment_method}</td>
                <td>{credit.check_or_remarks}</td>
                <td>{credit.amount}</td>
                <td className="text-primary">{/* Balance logic here */}</td>
              </tr>
            ))}
        </tbody>
      </Table>

      {/* In */}

      <Modal show={showModal} onHide={handleClose} backdrop="static" size="xl">
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleFormSubmit(e, "Credit")}
        >
          <Modal.Header className="border-0">
            <Modal.Title>Payment Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table bordered>
              <thead>
                <tr>
                  <th>Subject 1</th>
                  <th>Subject 2</th>
                  <th>Subject 3</th>
                  <th>Payment Method</th>
                  <th>{paymentMethod === "Bank" ? "Check No." : "Remarks"}</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject1Change}
                      value={subject1}
                      required
                    >
                      <option value="" selected disabled>
                        Select Account
                      </option>
                      <option value="Account-List">Account-List</option>
                      <option value="Asset Account">Asset Account</option>
                      <option value="Liabilities Account">
                        Liabilities Account
                      </option>
                      <option value="Owner's Equity Account">
                        Owner's Equity Account
                      </option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject2Change}
                      value={subject2}
                      disabled={isSubject2Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 2
                      </option>
                      {subject2DataList.map((option) => (
                        <option key={option.equity_id} value={option.equity_id}>
                          {option.subject_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject3Change}
                      value={subject3}
                      disabled={isSubject3Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 3
                      </option>
                      {subject3DataList.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.account_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handlePaymentMethodChange}
                      value={paymentMethod}
                      disabled={isPaymentMethodDisabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Payment Method
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online">Online</option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      onChange={(e) => setCheckNo(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="date"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      required
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0.00"
                      disabled={isRemarksDisabled}
                      required
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* Out */}

      <Modal show={showModal2} onHide={handleClose} backdrop="static" size="xl">
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleFormSubmit(e, "Debit")}
        >
          <Modal.Header className="border-0">
            <Modal.Title>Payment Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table bordered>
              <thead>
                <tr>
                  <th>Subject 1</th>
                  <th>Subject 2</th>
                  <th>Subject 3</th>
                  <th>Payment Method</th>
                  <th>{paymentMethod === "Bank" ? "Check No." : "Remarks"}</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject1Change}
                      value={subject1}
                      required
                    >
                      <option value="" selected disabled>
                        Select Account
                      </option>
                      <option value="Account-List">Account-List</option>
                      <option value="Asset Account">Asset Account</option>
                      <option value="Liabilities Account">
                        Liabilities Account
                      </option>
                      <option value="Owner's Equity Account">
                        Owner's Equity Account
                      </option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject2Change}
                      value={subject2}
                      disabled={isSubject2Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 2
                      </option>
                      {subject2DataList.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.subject_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handleSubject3Change}
                      value={subject3}
                      disabled={isSubject3Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 3
                      </option>
                      {subject3DataList.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.account_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={handlePaymentMethodChange}
                      value={paymentMethod}
                      disabled={isPaymentMethodDisabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Payment Method
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online">Online</option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      required
                      onChange={(e) => setCheckNo(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="date"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      required
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0.00"
                      disabled={isRemarksDisabled}
                      required
                      onInput={onInputFloat}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default OwnersEquity2;
