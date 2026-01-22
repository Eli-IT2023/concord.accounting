import React, { useState, useEffect } from "react";
import { Button, Form, Nav, Tab, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";

function ViewOtherIncome({ authrztn, roleType }) {
  const userLoggedID = useDecodeToken();
  const { id } = useParams();
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);

  const [otherIncome, setOtherIncome] = useState([]);
  const [paymentList, setPaymentList] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [incomeType, setIncomeType] = useState("");
  const [description, setDescription] = useState("");
  const [incomeDate, setIncomeDate] = useState(null);
  const [status, setStatus] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [accountListData, setAccountListData] = useState([]);
  const [floatPayment, setFloatPayment] = useState([]);

  const [accountID, setAccountID] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(null);
  const [paymentName, setPaymentName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankAmount, setBankAmount] = useState("0");
  const [totalAmount, setTotalAmount] = useState(0);

  const [removedPayments, setRemovedPayments] = useState([]);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [subjectList, setSubjectList] = useState({
    subject1: "",
    subject2: "",
    subject3: "",
  });
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);

  const handleEditClick = () => {
    if (status !== "Pending") return;
    setIsEditing(true);
  };
  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const reloadTable = () => {
    axios
      .get(`${BASE_URL}/otherIncome/getOtherIncome/${id}`)
      .then((res) => {
        const { data, paymentData, isPosted } = res.data;
        setOtherIncome(data);
        setIncomeType(data.incomeType);
        setDescription(data.desc);
        setIncomeDate(data.income_date);
        setTotalAmount(data.totalAmount);
        setPaymentList(paymentData);
        setStatus(data.status);
        setIsCutoffPosted(isPosted);
      })
      .catch((error) => {
        console.error("Error fetching otherIncome data:", error);
      });
  };

  const fetchAccountData = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/payable_payment/getAccountList`,
        {
          params: {
            payment: "Bank",
          },
        }
      );

      setAccountListData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubject2Data = (value) => {
    try {
      axios
        .get(BASE_URL + "/accountListSub/getSubject", {
          params: {
            account_selected: value,
          },
        })
        .then((res) => {
          // console.log(res.data);
          setSubject2DataList(res.data);
        });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubject3Data = (value) => {
    try {
      axios
        .get(BASE_URL + "/accountListSub/getSubject3", {
          params: { subjectId: value },
        })
        .then((res) => {
          setSubject3DataList(res.data);
          console.log(res.data);
        });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (amount > bankAmount) {
      swal({
        title: "Oppss!",
        text: "Please input not greater than the account balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmount("0");
      });
    }
  }, [bankAmount]);

  useEffect(() => {
    reloadTable();
    fetchAccountData();
  }, []);

  const update = async () => {
    const confirmed = await swal({
      title: "Are you sure you want to update?",
      text: "",
      icon: "warning",
      buttons: {
        cancel: {
          text: "No",
          value: false,
          visible: true,
          className: "btn-cancel",
          closeModal: true,
        },
        confirm: {
          text: "Yes",
          value: true,
          visible: true,
          className: "btn-confirm",
          closeModal: true,
        },
      },
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/otherIncome/update`, {
          transaction_id: otherIncome.transaction_id,
          id,
          incomeType,
          description,
          incomeDate,
          removedPayments,
          floatPayment,
          totalAmount,
          userLoggedID,
        });
        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Other Income has been updated successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(`/accounts/viewOtherIncome/${id}`);
            setIsEditing(false);
          });
        }
      } catch (error) {
        console.error("Error saving other income:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  useEffect(() => {
    console.log("Flloat", floatPayment);
  }, [floatPayment]);

  const handleAddPayment = () => {
    if (amount == 0) {
      swal({
        icon: "error",
        title: "Invalid Amount",
        text: "Please ensure the amount is greater than zero before submitting.",
        button: "OK",
      });
      return;
    }

    if (!date) {
      swal({
        icon: "error",
        title: "Missing Information",
        text: "The Date field is required. Please enter a date to continue.",
        button: "OK",
      });
      return;
    }

    swal({
      title: "Add this Payment?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      let formatAmount = String(amount).replace(/,/g, "");

      if (confirmed) {
        const newPayment = {
          accountID: accountID,
          accountName: accountName,
          amount: parseFloat(formatAmount),
          module_type: subjectList.subject1,
          issuedDate: date,
          checkNumber: checkNumber,
          online_name: paymentName,
          onlineRefNum: referenceNumber,
        };
        setFloatPayment((prevPayments) => [...prevPayments, newPayment]);

        swal({
          icon: "success",
          title: "Payment Added",
          text: "The new payment has been added successfully",
          buttons: false,
          timer: 2000,
        });

        setAccountID("");
        setDate("");
        setAmount(0);
        setSubjectList({
          subject1: "",
          subject2: "",
          subject3: "",
        });
        setIsSubject2Disabled(true);
        setIsSubject3Disabled(true);
      }
    });
  };

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    setAccountID(selectedAccountId);

    console.log(
      "**************************--- account_list_base_sub_id: ",
      selectedAccountId
    );
    const selectedAccount = accountListData.find(
      (account) => account.id === String(selectedAccountId, 10)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    } else {
      setBankAmount("0");
    }
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  useEffect(() => {
    const paymentListTotal = paymentList.reduce(
      (sum, item) => sum + parseFloat(item.amount || 0),
      0
    );
    const floatPaymentTotal = floatPayment.reduce(
      (sum, item) => sum + parseFloat(item.amount || 0),
      0
    );

    setTotalAmount(paymentListTotal + floatPaymentTotal);
  }, [paymentList, floatPayment]);

  const removePayment = (index, type) => {
    if (type === "paymentList") {
      const removedItem = paymentList[index];
      setRemovedPayments([...removedPayments, removedItem]);
      setPaymentList(paymentList.filter((_, i) => i !== index));
    } else if (type === "floatPayment") {
      const removedItem = floatPayment[index];
      setRemovedPayments([...removedPayments, removedItem]);
      setFloatPayment(floatPayment.filter((_, i) => i !== index));
    }
  };

  console.log(paymentList, "paymentList=====");
  console.log(floatPayment, "float====");
  console.log(removedPayments);

  const handleApproved = async () => {
    const confirmed = await swal({
      title: "Are you sure you want to approve this?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/otherIncome/updateStatus`, {
          id,
          status: "Approved",
          paymentList,
          floatPayment,
          userLoggedID,
          transaction_id: otherIncome.transaction_id,
        });

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Other Income has been approved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(`/accounts/other-income/`);
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  const handleRejected = async () => {
    const confirmed = await swal({
      title: "Are you sure you want to reject this?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/otherIncome/updateStatus`, {
          id,
          status: "Rejected",
          userLoggedID,
          transaction_id: otherIncome.transaction_id,
        });

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Other Income has been rejected successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(`/accounts/other-income/`);
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  const handleSetAmount = (value) => {
    if (value == ".") {
      setAmount((prev) => prev + ".");
    }
    let inputValue = value.replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    if (numericValue > bankAmount) {
      swal({
        title: "Oppss!",
        text: "Please input not greater than the account balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmount("0");
      });
    }

    setAmount(value.length > 1 ? cleanedValue : inputValue);
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, paymentMethodDate }, ref) => (
      <input
        type="text"
        className={`form-control ${paymentMethodDate ? "p-2" : "p-3"} w-100`}
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        placeholder="Select Date"
        disabled={!isEditing}
        {...(paymentMethodDate ? {} : { required: true })}
      />
    )
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="w-100 d-flex flex-row justify-content-between">
          <span className="fs-3">
            <Link to="/accounts/other-income" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            OTHER INCOME DETAILS
          </span>

          {authrztn.includes("OtherIncome-Edit") && !isEditing && (
            <div className="dropdown dropdown-button">
              <button
                className="border-0"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bx bx-dots-horizontal fs-4"></i>
              </button>
              <ul
                className="dropdown-menu"
                aria-labelledby="dropdownMenuButton1"
              >
                <li>
                  <span
                    className="dropdown-item"
                    onClick={handleEditClick}
                    style={{
                      cursor: status === "Pending" ? "pointer" : "not-allowed",
                      color: status === "Pending" ? "inherit" : "gray",
                    }}
                  >
                    Edit Transaction
                  </span>
                </li>
              </ul>
            </div>
          )}
          {/* Conditional Buttons */}
        </div>
      </div>

      <div className="container-fluid mt-4 p-0">
        <div className="row mx-auto">
          <div className="col-sm">
            <span>Transaction ID :</span>
            <div className="input-group mb-2">
              <input
                type="text"
                required
                readOnly
                value={otherIncome.transaction_id}
                className="form-control p-3"
                id="inlineFormInputGroup"
              />
            </div>
          </div>
          <div className="col-sm">
            {/* <Form.Group className="mb-3" controlId="payWith">
                <Form.Label className="fw-bold">Foreign Type :</Form.Label>
                <div className="d-flex">
                  <Form.Check
                    type="radio"
                    name=""
                    id="Local"
                    label="Local"
                    value="Local"
                    className="me-3"
                  />
                  <Form.Check
                    type="radio"
                    name=""
                    id="Overseas"
                    label="Overseas"
                    value="Overseas"
                    className="me-3"
                  />
                </div>
              </Form.Group> */}
          </div>
        </div>
        <div className="row mx-auto">
          <React.Fragment>
            <div className="col-sm mb-2">
              <span>Other Income Type</span>
              <input
                type="text"
                readOnly={!isEditing}
                name="inlineFormInputGroup"
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
                required
                className="form-control p-3"
              />
            </div>
          </React.Fragment>

          <div
            className={
              roleType?.includes("Management") ? "col-sm mb-2" : "d-none"
            }
          >
            <span>Amount</span>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text h-100">₱</div>
              </div>
              <input
                type="text"
                onInput={onInputFloat}
                value={totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
                className="form-control p-3"
                id="inlineFormInputGroup"
              />
            </div>
          </div>
        </div>
        <div className="row mx-auto mt-3">
          <div className="col-sm mb-2">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              disabled={!isEditing}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              name=""
              id="description"
              className="form-control p-3"
            />
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="income_date">Other Income Date</label>
            {/* <input
              type="date"
              required
              disabled={!isEditing}
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              name=""
              id="income_date"
              className="form-control p-3"
            /> */}
            <div>
              <DatePicker
                selected={incomeDate}
                onChange={(date) => {
                  setIncomeDate(date);
                }}
                dateFormat="MMM dd, yyyy"
                className="form-control p-2"
                customInput={<CustomInput />}
              />
            </div>
          </div>
        </div>
        <div className="w-100 d-flex align-items-center mt-4 p-2">
          <h5>Payment</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-4">
          <div className="w-100 p-2 mt-1 row">
            <div className="col-12 col-md-4 p-2">
              <div className="w-100 border shadow-sm p-3 rounded">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment Method</span>
                  <span className="text-secondary">Payment List</span>
                </div>

                {/* <Form.Group className="mb-3" controlId="accountID">
                  <Form.Label>Account</Form.Label>
                  <Form.Select
                    disabled={!isEditing}
                    className="p-2"
                    onChange={handleAccountChange}
                    value={accountID}
                  >
                    <option value="">Select Account name</option>
                    {accountListData.map((data) => (
                      <option
                        key={data.id}
                        value={data.id}
                        name={data.account_name}
                      >
                        {data.account_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group> */}

                <div className="row mb-3">
                  <div className="col-sm">
                    <label htmlFor="subject1" className="fw-semibold">
                      Subject 1
                    </label>
                    <Form.Select
                      id="subject1"
                      value={subjectList.subject1}
                      onChange={(e) => {
                        setSubjectList({
                          subject1: e.target.value,
                          subject2: "",
                          subject3: "",
                        });
                        setIsSubject2Disabled(false);
                        setBankAmount("0");
                        fetchSubject2Data(e.target.value);
                      }}
                      className="rounded"
                      disabled={!isEditing}
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
                      value={subjectList.subject2}
                      onChange={(e) => {
                        setSubjectList({
                          ...subjectList,
                          subject2: e.target.value,
                          subject3: "",
                        });
                        setIsSubject3Disabled(false);
                        setBankAmount("0");
                        fetchSubject3Data(e.target.value);
                      }}
                      className="rounded"
                      disabled={isSubject2Disabled}
                    >
                      <option value="" disabled>
                        Select Subject 2
                      </option>
                      {subject2DataList?.map((option) => (
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
                      Accounts
                    </label>
                    <Form.Select
                      id="subject3"
                      value={subjectList.subject3}
                      onChange={(e) => {
                        setSubjectList({
                          ...subjectList,
                          subject3: e.target.value,
                        });
                        handleAccountChange(e);
                      }}
                      className="rounded"
                      disabled={isSubject3Disabled}
                    >
                      <option value="" disabled>
                        Select Account Name
                      </option>
                      {subject3DataList?.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.account_name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <Form.Group className="mb-3" controlId="amount">
                  <Form.Label>Amount</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">₱</span>
                    <Form.Control
                      type="text"
                      className="p-2"
                      placeholder="0.00"
                      value={amount}
                      disabled={!isEditing}
                      onInput={onInputFloat}
                      // onChange={(e) => setAmount(e.target.value)}
                      onChange={(e) => handleSetAmount(e.target.value)}
                    />
                  </div>
                  <span>
                    Account Balance:{" "}
                    {bankAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </Form.Group>

                <Form.Group className="mb-3" controlId="date">
                  <Form.Label>Date</Form.Label>
                  {/* <Form.Control
                    type="date"
                    className="p-2"
                    value={date}
                    disabled={!isEditing}
                    onChange={(e) => setDate(e.target.value)}
                  /> */}
                  <div>
                    <DatePicker
                      selected={date}
                      onChange={(date) => {
                        setDate(date);
                      }}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput paymentMethodDate={true} />}
                    />
                  </div>
                </Form.Group>

                <Button
                  type="button"
                  variant="primary"
                  className="w-100 p-2"
                  disabled={!isEditing}
                  onClick={handleAddPayment}
                >
                  Add Payment
                </Button>
              </div>
            </div>
            <div className="col-12 col-md-8 p-2 d-flex flex-column">
              <div className={roleType?.includes("Management") ? "" : "d-none"}>
                <Tab.Container defaultActiveKey="paymentList">
                  <Nav variant="tabs">
                    <Nav.Item>
                      <Nav.Link
                        eventKey="paymentList"
                        className="text-dark custom-nav-link"
                      >
                        Payment List
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content className="mt-3">
                    <Tab.Pane eventKey="paymentList">
                      <div
                        className={
                          roleType?.includes("Management")
                            ? "border p-3 rounded"
                            : "d-none"
                        }
                      >
                        <h5>Payment List</h5>
                        <div className="table-responsive">
                          <Table bordered>
                            <thead>
                              <tr>
                                <th>Account Name</th>
                                <th>Amount</th>
                                <th>Check Number</th>
                                <th>Issue Date</th>
                                <th>Online Wallet</th>
                                <th>Online Reference No.</th>
                                {isEditing && <th>Action</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {paymentList.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.account_list_sub3.account_name}</td>
                                  <td>
                                    {item.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td>
                                    {item.check_number === ""
                                      ? "---"
                                      : item.check_number}
                                  </td>
                                  <td>
                                    {format(item.date_issued, "MMM dd, yyyy")}
                                  </td>
                                  <td>
                                    {item.online_name === ""
                                      ? "---"
                                      : item.online_name}
                                  </td>
                                  <td>
                                    {item.online_ref_number === ""
                                      ? "---"
                                      : item.online_ref_number}
                                  </td>
                                  {isEditing && (
                                    <td>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          removePayment(index, "paymentList")
                                        }
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}

                              {floatPayment.map((data, index) => (
                                <tr>
                                  {/* <td>{data.type}</td> */}
                                  <td>
                                    {data.accountName === ""
                                      ? "---"
                                      : data.accountName}
                                  </td>
                                  <td>
                                    {data.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td>
                                    {data.checkNumber === ""
                                      ? "---"
                                      : data.checkNumber}
                                  </td>
                                  <td>
                                    {format(data.issuedDate, "MMM dd, yyyy")}
                                  </td>
                                  <td>
                                    {data.online_name === ""
                                      ? "---"
                                      : data.online_name}
                                  </td>
                                  <td>
                                    {data.onlineRefNum === ""
                                      ? "---"
                                      : data.onlineRefNum}
                                  </td>
                                  {isEditing && (
                                    <td>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          removePayment(index, "floatPayment")
                                        }
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                        <div className="row mt-5">
                          <div className="col-sm mb-2">
                            {/* <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                                <span className="text-white">New Balance</span>
                                <span className="text-white text-underline"></span>
                              </div> */}
                          </div>
                          <div className="col-sm"></div>
                          <div className="col-sm">
                            {/* <div className="d-flex justify-content-between">
                              <span>Cash</span>
                              <span className="text-secondary"></span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Bank</span>
                              <span className="text-secondary"></span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Check</span>
                              <span className="text-secondary"></span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Online</span>
                              <span className="text-secondary"></span>
                            </div> */}
                            <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                              <span>Total Payment</span>
                              <span>
                                {totalAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
                {authrztn.includes("OtherIncome-Approve") &&
                !isEditing &&
                status === "Pending" ? (
                  <div className="row mt-3">
                    <div className="col-sm mb-2"></div>
                    <div className="col-sm mb-2"></div>
                    <div className="col-sm mb-2">
                      <button
                        className="btn btn-outline-danger w-100 me-3"
                        type="button"
                        onClick={handleRejected}
                        disabled={isCutoffPosted}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="col-sm mb-2">
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleApproved}
                        disabled={isCutoffPosted}
                      >
                        Approve
                      </button>
                    </div>
                    <div className="text-end">
                      {isCutoffPosted && (
                        <span
                          className="text-danger"
                          style={{
                            fontSize: "0.9rem",
                          }}
                        >
                          Action is prohibited as the Other Income date has
                          already been posted.
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {status === "Approved" ? null : (
                      <>
                        <div className="row mt-4">
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                            <button
                              className="btn btn-outline-secondary w-100 me-3"
                              onClick={handleCancelClick}
                            >
                              Cancel
                            </button>
                            {authrztn.includes("OtherIncome-Edit") && (
                              <button
                                type="submit"
                                className="btn btn-primary w-100"
                                onClick={update}
                                disabled={
                                  floatPayment.length == 0 &&
                                  paymentList.length == 0
                                }
                              >
                                Update
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOtherIncome;
