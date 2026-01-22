import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Nav, Tab, Table } from "react-bootstrap";
import swal from "sweetalert";
import { Link, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";

const AddOtherIncome = ({ authrztn, roleType }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();

  const [transaction_id, setTransaction_id] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [incomeType, setOtherIncomeType] = useState("");
  const [foreign, setForeign] = useState("Local");
  const [incomeType_name, setOtherIncomeType_name] = useState("");
  const [accountID, setAccountID] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentName, setPaymentName] = useState(""); // State for payment name in online payment
  const [referenceNumber, setReferenceNumber] = useState(""); // State for reference number in online payment
  const [date, setDate] = useState(getTodayDate());
  const [validated, setValidated] = useState(false);

  const [vendor_product, setVendor_product] = useState([]);
  const [incomeType_db, setOtherIncomeType_db] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedproductItem, setSelectedProductItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxes, setTaxes] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [desc, setDesc] = useState("");
  const [income_date, setOtherIncome_date] = useState("");
  const [accountListData, setAccountListData] = useState([]); // get account list
  const [bankAmount, setBankAmount] = useState("");
  const [floatPayment, setFloatPayment] = useState([]);
  const [subjectList, setSubjectList] = useState({
    subject1: "",
    subject2: "",
    subject3: "",
  });
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }
  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };
  const CalculateTotalAmount = () => {
    if (incomeType === "Fixed Asset") {
      const total =
        parseFloat(quantity) *
        parseFloat(unitPrice) *
        (parseFloat(taxes) / 100 + 1);
      setTotalAmount(isNaN(total) ? 0 : total);
    }
  };

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/otherIncome/getCode")
      .then((res) => {
        setTransaction_id(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccountData = async () => {
    // console.log(payment);
    try {
      const res = await axios.get(
        `${BASE_URL}/payable_payment/getAccountList`,
        {
          params: {
            payment: "Bank",
          },
        }
      );
      console.log("*********************: ", res.data);
      setAccountListData(res.data);
      setValidated(false);
      setBankAmount("0");
      setAccountID("");
      setAccountName("");
      setCheckNumber("");
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
    const total = floatPayment.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    setTotalAmount(total);
  }, [floatPayment]);

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    setAccountID(selectedAccountId);

    console.log(
      "**************************--- account_list_base_sub_id: ",
      selectedAccountId
    );
    // Find the selected account in the accountListData
    const selectedAccount = accountListData.find(
      (account) => String(account.id) === String(selectedAccountId, 10)
    );

    // Update the bankAmount if an account is found
    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    } else {
      setBankAmount("0");
    }
  };

  const handleAddPayment = (event) => {
    event.preventDefault();
    event.stopPropagation();
    let finalPayment;

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
    // if (payment === "Bank") {
    //   if (checkNumber !== "") {
    //     finalPayment = "Check";
    //   } else {
    //     finalPayment = "Bank";
    //   }
    // } else {
    //   finalPayment = payment;
    // }

    let formatAmount = String(amount).replace(/,/g, "");
    swal({
      title: "Add this Payment?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        const newPayment = {
          type: finalPayment,
          accountID: accountID,
          accountName: accountName,
          amount: parseFloat(formatAmount),
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

  const handleAmountValue = (value) => {
    if (payment !== "Online") {
      if (value > bankAmount) {
        swal({
          title: "Oppss!",
          text: "Please input not greater than the account balance",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        }).then(() => {
          setAmount(bankAmount);
        });
      } else {
        if (value > balanceNow) {
          swal({
            title: "Oppss!",
            text: "Please input not greater than the balance to pay",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            setAmount(balanceNow);
          });
        } else {
          setAmount(value);
        }
      }
    } else {
      setAmount(value);
    }
  };

  const totalCashPaid = floatPayment.reduce(
    (acc, data) =>
      data.type === "Cash" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const totalBankPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber === "" && data.type === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0
  );

  const totalCheckPaid = floatPayment.reduce(
    (acc, data) =>
      data.type === "Check" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const totalOnlinePaid = floatPayment.reduce(
    (acc, data) =>
      data.type === "Online" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const balanceNow =
    totalAmount -
    (totalCashPaid + totalBankPaid + totalCheckPaid + totalOnlinePaid);

  useEffect(() => {
    CalculateTotalAmount();
    fetchAccountData();
    fetchLastCode();
  }, [payment, quantity, unitPrice, taxes, incomeType]);

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

  const add = async (e) => {
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
    } else {
      swal({
        title: "Create this new other income?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/otherIncome/createOtherIncome`, {
              quantity,
              unitPrice,
              taxes,
              totalAmount,
              desc,
              income_date,
              floatPayment,
              incomeType,
              transaction_id,
              foreign,
              balanceNow,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "OtherIncome created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/accounts/other-income");
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            })
            .catch((error) => {
              if (error.response && error.response.status == 409) {
                swal({
                  title: "Oopps!",
                  text: "Action is prohibited because the date provided for the Other Income Date has already passed the posted cutoff.",
                  icon: "error",
                  button: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const clearFields = () => {
    setSelectedVendor("");
    setFilteredItems([]);
    setSelectedProductItem(null);
    setOtherIncomeType_name("");
    setQuantity("");
    setUnitPrice("");
    setTaxes(0);
    setTotalAmount("");
    setDesc("");
    setOtherIncome_date("");
  };

  const removePayment = (index, type) => {
    setFloatPayment(floatPayment.filter((_, i) => i !== index));
  };

  console.log(floatPayment);

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
        {...(paymentMethodDate ? {} : { required: true })}
      />
    )
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/accounts/other-income" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            ADD OTHER INCOME
          </span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
      </div>
      <Form noValidate validated={validated} onSubmit={add}>
        <div className="container-fluid mt-4 p-0">
          <div className="row mx-auto">
            <div className="col-sm">
              <span>Transaction ID :</span>
              <div className="input-group mb-2">
                <input
                  type="text"
                  required
                  value={transaction_id}
                  readOnly
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
                    checked={foreign === "Local"}
                    onClick={(e) => {
                      setForeign(e.target.value);
                    }}
                    className="me-3"
                  />
                  <Form.Check
                    type="radio"
                    name=""
                    id="Overseas"
                    label="Overseas"
                    value="Overseas"
                    checked={foreign === "Overseas"}
                    onClick={(e) => {
                      setForeign(e.target.value);
                    }}
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
                  required
                  onChange={(e) => setOtherIncomeType(e.target.value)}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
            </React.Fragment>
            23
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
                  readOnly
                  value={totalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  onInput={onInputFloat}
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
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                type="text"
                name=""
                id="description"
                className="form-control p-3"
              />
            </div>
            <div className="col-sm mb-2">
              <label htmlFor="income_date">Other Income Date</label>
              {/* <input
                value={income_date}
                type="date"
                required
                onChange={(e) => setOtherIncome_date(e.target.value)}
                name=""
                id="income_date"
                style={{
                  paddingRight: validated ? "2rem" : "1rem",
                }}
                className="form-control py-3 ps-3"
              /> */}
              <div>
                <DatePicker
                  selected={income_date}
                  onChange={(date) => {
                    setOtherIncome_date(date);
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

                  {/* <Form.Group className="mb-3" controlId="payWith">
                    <Form.Label className="fw-bold">Pay With:</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="Cash"
                        label="Cash"
                        value="Cash"
                        onClick={fetchAccountData}
                        checked={payment === "Cash"}
                        onChange={(e) => setPayment(e.target.value)}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="Bank"
                        label="Bank"
                        value="Bank"
                        checked={payment === "Bank"}
                        onClick={fetchAccountData}
                        onChange={(e) => setPayment(e.target.value)}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="online"
                        label="Online"
                        value="Online"
                        checked={payment === "Online"}
                        onChange={(e) => setPayment(e.target.value)}
                      />
                    </div>
                  </Form.Group> */}

                  {/* {(payment === "Cash" || payment === "Bank") && ( */}
                  {/* <Form.Group className="mb-3" controlId="accountID">
                    <Form.Label>Account</Form.Label>
                    <Form.Select
                      // value={accountID}
                      className="p-2"
                      value={accountID}
                      onChange={handleAccountChange}
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

                      Add your account options here
                    </Form.Select>
                  </Form.Group> */}
                  {/* )} */}

                  {/* {payment === "Bank" && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                      />
                    </Form.Group>
                  )} */}

                  {/* {payment === "Online" && (
                    <>
                      <Form.Group className="mb-3" controlId="paymentName">
                        <Form.Label>Payment Name</Form.Label>
                        <Form.Control
                          type="text"
                          className="p-2"
                          placeholder="Enter Payment Name"
                          value={paymentName}
                          onChange={(e) => setPaymentName(e.target.value)}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="referenceNumber">
                        <Form.Label>Reference Number</Form.Label>
                        <Form.Control
                          type="text"
                          className="p-2"
                          placeholder="Enter Reference Number"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                      </Form.Group>
                    </>
                  )} */}

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
                      className="py-2 ps-2"
                      value={date}
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
                    onClick={handleAddPayment}
                    // disabled={!totalAmount}
                    variant="primary"
                    className="w-100 p-2"
                  >
                    Add Payment
                  </Button>
                </div>
              </div>
              <div className="col-12 col-md-8 p-2 d-flex flex-column">
                <div className="">
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
                                  {/* <th>Type</th> */}
                                  <th>Account Name</th>
                                  <th>Amount</th>
                                  <th>Check Number</th>
                                  <th>Issue Date</th>
                                  <th>Online Wallet</th>
                                  <th>Online Reference No.</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {floatPayment.map((data, i) => (
                                  <tr>
                                    {/* <td>{data.type}</td> */}
                                    <td>
                                      {data.accountName === ""
                                        ? "--"
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
                                        ? "--"
                                        : data.checkNumber}
                                    </td>
                                    <td>
                                      {format(data.issuedDate, "MMM dd, yyyy")}
                                    </td>
                                    <td>
                                      {data.online_name === ""
                                        ? "--"
                                        : data.online_name}
                                    </td>
                                    <td>
                                      {data.onlineRefNum === ""
                                        ? "--"
                                        : data.onlineRefNum}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          removePayment(i, "paymentList")
                                        }
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                          <div className="row mt-5">
                            <div className="col-sm mb-2">
                              {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
                                <span>Last Balance</span>
                                <span className="text-secondary">
                                  {toPayAmount - balanceBefore}
                                </span>
                              </div> */}
                              <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                                <span className="text-white">New Balance</span>
                                <span className="text-white text-underline">
                                  {balanceNow.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="col-sm"></div>
                            <div className="col-sm">
                              {/* <div className="d-flex justify-content-between">
                                <span>Cash</span>
                                <span className="text-secondary">
                                  {totalCashPaid.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Bank</span>
                                <span className="text-secondary">
                                  {totalBankPaid.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Check</span>
                                <span className="text-secondary">
                                  {totalCheckPaid.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Online</span>
                                <span className="text-secondary">
                                  {totalOnlinePaid.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
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

                      <Tab.Pane eventKey="multipleOtherIncome">
                        <div className="border p-3 rounded">
                          <h5>Multiple OtherIncome</h5>
                          <div className="table-responsive">
                            <Table bordered hover>
                              <thead>
                                <tr>
                                  <th>OtherIncome Type</th>
                                  <th>Description</th>
                                  <th>Payment</th>
                                  <th>Amount</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Electricity</td>
                                  <td>For Month of January Meralco Bill</td>
                                  <td>Cash</td>
                                  <td>₱ 18,762.67</td>
                                  <td className="text-primary">Edit</td>
                                </tr>
                                <tr>
                                  <td>
                                    <Form.Control as="select">
                                      <option>Select</option>
                                      <option>Water</option>
                                      <option>Internet</option>
                                    </Form.Control>
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      placeholder="Add Description"
                                    />
                                  </td>
                                  <td>
                                    <Form.Control as="select">
                                      <option>Select Payment</option>
                                      <option>Cash</option>
                                      <option>Account</option>
                                      <option>Check</option>
                                    </Form.Control>
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      placeholder="₱ 0.00"
                                    />
                                  </td>
                                  <td className="text-primary">Edit</td>
                                </tr>
                              </tbody>
                            </Table>
                          </div>
                          <div className="row mt-3">
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm">
                              <Button variant="primary" className="w-100">
                                Add New List
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Tab.Pane>

                      <Tab.Pane eventKey="distributeOtherIncome">
                        <div className="border p-3 rounded">
                          <h5>Distribute OtherIncome</h5>
                          <div className="table-responsive">
                            <Table bordered hover>
                              <thead>
                                <tr>
                                  <th>Employee ID</th>
                                  <th>Employee Name</th>
                                  <th>Payment</th>
                                  <th>Amount</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>TP-40015</td>
                                  <td>Regin Legaspi</td>
                                  <td>Cash</td>
                                  <td>₱ 18,762.67</td>
                                  <td className="text-primary">Edit</td>
                                </tr>
                                <tr>
                                  <td>
                                    <Form.Control as="select">
                                      <option>Select</option>
                                      <option>Water</option>
                                      <option>Internet</option>
                                    </Form.Control>
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      placeholder="Add Description"
                                    />
                                  </td>
                                  <td>
                                    <Form.Control as="select">
                                      <option>Select Payment</option>
                                      <option>Cash</option>
                                      <option>Account</option>
                                      <option>Check</option>
                                    </Form.Control>
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      placeholder="₱ 0.00"
                                    />
                                  </td>
                                  <td className="text-primary">Edit</td>
                                </tr>
                              </tbody>
                            </Table>
                          </div>
                          <div className="row mt-3">
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm"></div>
                            <div className="col-sm">
                              <Button variant="primary" className="w-100">
                                Add New List
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
                <div className="row mt-4">
                  <div className="col-sm"></div>
                  <div className="col-sm"></div>
                  <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                    {/* <button className="btn btn-outline-secondary w-100 me-3">
                      Cancel
                    </button> */}
                    <button
                      disabled={floatPayment.length <= 0}
                      type="submit"
                      className="btn btn-primary w-100"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AddOtherIncome;
