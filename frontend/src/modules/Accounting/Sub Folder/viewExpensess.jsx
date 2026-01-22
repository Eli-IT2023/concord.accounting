import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import swal from "sweetalert";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import PDFExpenses from "../PdfExpenses/PDFExpenses";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { format } from "date-fns";
import CustomDatePicker from "../../../components/CustomDatePicker";

const AddExpenses = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [validated, setValidated] = useState(false);
  const [transaction_id, setTransaction_id] = useState("");
  const [clientTransactionId, setClientTransactionId] = useState("");
  const [expensesType_db, setExpensesType_db] = useState([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [expenses_date, setExpenses_date] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency_db, setCurrency_db] = useState([]);
  const [foreign, setForeign] = useState("Local");
  const [expensesSubType_id, setExpensesSubType_id] = useState();
  const [expensesType_name, setExpensesType_name] = useState("");
  const [selected_currency_id, setSelected_currency_id] = useState();

  const [productName, setProductName] = useState("");
  const [currencyRate, setCurrencyRate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [assetQuantity, setAssetQuantity] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState(false);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true);
  const [isCurrencyDisabled, setIsCurrencyDisabled] = useState(false);
  const [editableCurrencyRate, setEditableCurrencyRate] =
    useState(currencyRate);

  const [print, setPrint] = useState(false);
  // const fetchLastCode = () => {
  //   axios
  //     .get(BASE_URL + "/expenses/getCode")
  //     .then((res) => {
  //       setTransaction_id(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // };

  const fetchExpenses = async () => {
    await axios
      .get(BASE_URL + "/expenses2/fetchTable")
      .then((response) => {
        setExpensesType_db(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const fetchCurrency = async () => {
    await axios
      .get(BASE_URL + "/currency/fetchCurrency")
      .then((response) => {
        setCurrency_db(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const reloadDataExpenses = async () => {
    axios
      .get(`${BASE_URL}/expenses/fetch_data_update`, {
        params: {
          id,
        },
      })
      .then((res) => {
        setTransaction_id(res.data.transaction_id);
        setClientTransactionId(res.data.client_transaction_id);
        setSelected_currency_id(res.data.currency_id);
        setProductName(res.data.product_name);
        setUnitPrice(res.data.unitPrice);
        setAssetQuantity(res.data.assetQuantity);
        setTotalAmount(res.data.totalAmount);
        setExpenses_date(res.data.expenses_date);
        setDueDate(res.data.due_date);
        setDesc(res.data.desc);
        setExpensesSubType_id({
          value: res.data.expenses2_id.toString(),
          label: `${res.data.expenses2.expenses_one.expenses_type_one} - ${res.data.expenses2.sub_type}`,
        });
        setExpensesType_name(res.data.expenses2.sub_type);
        setForeign(res.data.foreign);
        setStatus(res.data.status);
        setIsCutoffPosted(res.data.isPosted);
        setIsCutoffExists(res.data.cutoffExists);
        setCurrencyRate(res.data.rate);
        setIsCurrencyDisabled(res.data.existInFixedAsset);
      });
  };

  const handleExpensesChange = (selectedOption) => {
    const selectedId = selectedOption?.value;
    setExpensesSubType_id(selectedOption);

    setProductName("");
    setUnitPrice("");
    setAssetQuantity("");

    const selected = expensesType_db.find(
      (data) => String(data.id) === String(selectedId, 10)
    );
    if (selected) {
      setExpensesType_name(selected.sub_type);
    } else {
      setExpensesType_name("");
    }
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const add = async (e) => {
    //save buttonm
    e.preventDefault();
    const form = e.currentTarget;

    let formatTotalAmount = String(totalAmount).replace(/,/g, "");
    let formatUnitPrice = String(unitPrice).replace(/,/g, "");
    let formatAsset = String(assetQuantity).replace(/,/g, "");

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
        title: "Update this expenses?",
        text: "Please confirm to update this expenses",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/expenses/updateExpenses`, {
              id,
              totalAmount: parseFloat(formatTotalAmount),
              desc,
              expenses_date,
              dueDate,
              expensesSubType_id: expensesSubType_id?.value,
              transaction_id,
              clientTransactionId,
              foreign,
              selected_currency_id,
              productName,
              unitPrice: parseFloat(formatUnitPrice),
              assetQuantity: parseFloat(formatAsset),
              currencyRate: editableCurrencyRate,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Expenses created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/accounting/expenses");
                });
              } else if (res.status === 201) {
                swal({
                  title: "Opppss!",
                  text: "Cutoff already posted for this date",
                  icon: "warning",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
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
            .catch((err) => {
              if (err.response && err.response.status === 409) {
                swal({
                  icon: "error",
                  title: "Transaction ID Conflict",
                  text: "The transaction ID you entered already exists in the system. Please use a unique identifier.",
                });
                return;
              }
            });
        }
      });
    }
    setValidated(true);
  };

  useEffect(() => {
    fetchExpenses();
    // fetchLastCode();
    fetchCurrency();
    reloadDataExpenses();
  }, []);

  const handleApprove = () => {
    swal({
      title: "Approve this request?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        // For expense journal
        const currency = currency_db.find((c) => c.id === selected_currency_id);
        const currencyName = currency?.currency_name;
        const currencyRate = currency?.currency_rate;

        try {
          axios
            .post(
              `${BASE_URL}/expenses/approved`,
              {
                expenseJournal: {
                  expenses2Id: expensesSubType_id?.value,
                  date: expenses_date,
                  totalAmount,
                  paymentType: "Debit",
                  currencyName,
                  currencyRate,
                },
              }, // req.body
              {
                params: {
                  id,
                  userLoggedID,
                },
              } // req.query
            )
            .then((res) => {
              if (res.status === 201) {
                swal({
                  title: "Oppss!",
                  text: "Insufficient balance",
                  icon: "error",
                  dangerMode: true,
                });
              } else if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Successfully approved this request",
                  icon: "success",
                  timer: 2000,
                }).then(() => {
                  // navigate(
                  //   `/accounting/expenses?page=${searchParams.get("page")}`
                  // );
                  reloadDataExpenses();
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "warning",
                  buttons: true,
                  dangerMode: true,
                });
              }
            });
        } catch (error) {
          console.log(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          });
        }
      }
    });
  };

  const handleReject = () => {
    swal({
      title: "Reject this request?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/expenses/rejected`, null, {
              params: {
                id,
                userLoggedID,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Successfully rejected this request",
                  icon: "success",

                  dangerMode: true,
                }).then(() => {
                  // navigate(
                  //   `/accounting/expenses?page=${searchParams.get("page")}`
                  // );
                  reloadDataExpenses();
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "warning",
                  buttons: true,
                  dangerMode: true,
                });
              }
              // setExpensesData(res.data);
              // console.log(res.data);
            });
        } catch (error) {
          console.log(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          });
        }
      }
    });
  };

  const dateValidation = async (selectedDate, clearField, dateLabel) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      // if (res.data == false) {
      //   swal({
      //     icon: "error",
      //     title: `Invalid ${dateLabel}`,
      //     text: `Please Create Cutoff for this Date (${format(
      //       selectedDate,
      //       "MMM/dd/yyyy"
      //     )})`,
      //     // buttons: false,
      //     // timer: 2000,
      //   }).then(() => {
      //     clearField("");
      //   });
      // }
    } catch (error) {
      console.error(error);
    }
  };

  const dueDateValidation = async (selectedDueDate, clearField) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDueDate,
        },
      });
      // if (res.data == false) {
      //   swal({
      //     icon: "error",
      //     title: "Invalid Due Date Selection",
      //     text: "Please Create Cutoff for this Date",
      //   }).then(() => {
      //     clearField("");
      //   });
      // }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAmountValue = (value) => {
    if (value == ".") {
      setTotalAmount((prev) => prev + ".");
    }

    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setTotalAmount(formattedValue);
  };

  const handleSetUnitPriceValue = (value) => {
    if (value == ".") {
      setUnitPrice((prev) => prev + ".");
    }

    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setUnitPrice(formattedValue);
  };

  const handleChangeCurrency = (value) => {
    const curr = currency_db.find((data) => String(data.id) === String(value));
    setSelected_currency_id(curr.id);
    if (!edit) {
      setCurrencyRate(curr.currency_rate);
      setEditableCurrencyRate(curr.currency_rate);
    }
  };

  const openPDFPreview = () => {
    // window.open(`/invoice-pdf-view?id=${id}`, "_blank");
    setPrint(true);
  };

  // Expense Type 1 Options for dropdown select
  const expenseType1Options = expensesType_db.map((item) => ({
    value: item.id,
    label: `${item.expenses_one.expenses_type_one} - ${item.sub_type}`,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-3 w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={() => {
          onClick();

          const date = new Date(value).getFullYear();

          generateYears(date); // Reset/Initialize Year List based on selected date
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
        disabled={!edit}
      />
    )
  );

  //   useEffect to sync the currency rate when it changes, around line 125
  useEffect(() => {
    if (currencyRate !== undefined && currencyRate !== null) {
      setEditableCurrencyRate(currencyRate);
    }
  }, [currencyRate]);

  //  function to handle currency rate changes, around line 135
  const handleEditableCurrencyRateChange = (e) => {
    const value = e.target.value;
    let inputValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const decimalCount = (inputValue.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      if (inputValue) {
        inputValue = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      const cleanedValue = inputValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma
      setEditableCurrencyRate(value.length > 1 ? cleanedValue : inputValue);
      setCurrencyRate(value.length > 1 ? cleanedValue : inputValue);
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center">
        <div className="d-flex align-items-center title-custom">
          <span className="fs-3">
            <Link to="/accounting/expenses" className="text-dark me-2">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            EXPENSES DETAILS
          </span>
        </div>

        {/* Button on the right */}
        {authrztn.includes("Expenses-Print") && status !== "For-Approval" && (
          <div>
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={openPDFPreview}
            >
              Preview PDF
            </button>
          </div>
        )}
      </div>

      <Form noValidate validated={validated} onSubmit={add}>
        <div className="container-fluid mt-4 p-0">
          <div className="row mx-auto">
            <div className="d-none col-sm">
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
              <span>Transaction ID :</span>
              <div className="input-group mb-2">
                <input
                  type="text"
                  required
                  value={clientTransactionId}
                  onChange={(e) => setClientTransactionId(e.target.value)}
                  className="form-control p-3"
                  id="client-transaction-id"
                  disabled={!edit}
                />
              </div>
            </div>
            <div className="col-sm">
              <Form.Group className="mb-3" controlId="payWith">
                <Form.Label className="fw-bold">Foreign Type :</Form.Label>
                <div className="d-flex">
                  <Form.Check
                    type="radio"
                    name=""
                    id="Local"
                    label="Local"
                    value="Local"
                    disabled={!edit}
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
                    disabled={!edit}
                    checked={foreign === "Overseas"}
                    onClick={(e) => {
                      setForeign(e.target.value);
                    }}
                    className="me-3"
                  />
                </div>
              </Form.Group>
            </div>
          </div>
          <div className="row mx-auto">
            <React.Fragment>
              <div className="col-sm mb-2">
                <span>Expenses Type 1</span>
                {/* <select
                  required
                  onChange={handleExpensesChange}
                  className="form-select p-3"
                  value={expensesSubType_id}
                  disabled={!edit}
                >
                  <option value="" selected disabled>
                    Select Expense Type
                  </option>
                  {expensesType_db.map((data) => (
                    <option key={data.id} value={data.id}>
                      {`${data.expenses_one.expenses_type_one} - ${data.sub_type}`}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={expenseType1Options}
                  value={expensesSubType_id}
                  onChange={handleExpensesChange}
                  placeholder={`Select Expense Type 1`}
                  styles={selectCustomStyles(
                    expensesSubType_id,
                    validated,
                    "0.55rem"
                  )}
                  isDisabled={!edit}
                  required
                />
              </div>

              <div className="col-sm mb-2">
                <span>Expenses Type 2</span>
                <input
                  type="text"
                  required
                  readOnly
                  value={expensesType_name}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
            </React.Fragment>
          </div>

          {/* {expensesSubType_id === "6614fb23-2cfb-434e-901a-3f06d6ebc54f" && (
            <div className="row mx-auto mt-3">
              <div className="col-sm mb-2">
                <span>Product Name</span>
                <input
                  type="text"
                  value={productName}
                  required
                  readOnly={!edit}
                  onChange={(e) => setProductName(e.target.value)}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
              <div className="col-sm mb-2">
                <span>Unit Price</span>
                <input
                  type="text"
                  value={unitPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly={!edit}
                  required
                  onChange={(e) => {
                    handleSetUnitPriceValue(e.target.value);
                    handleAmountValue(e.target.value * assetQuantity);
                  }}
                  onInput={onInputFloat}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
              <div className="col-sm mb-2">
                <span>Quantity</span>
                <input
                  type="text"
                  value={assetQuantity.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly={!edit}
                  required
                  onChange={(e) => {
                    let value = e.target.value;

                    if (value == ".") {
                      setAssetQuantity((prev) => prev + ".");
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

                    let formatAmount = parseFloat(inputValue.replace(/,/g, ""));

                    setAssetQuantity(formattedValue);
                    let formatUnitPrice = String(unitPrice).replace(
                      /[^0-9.]/g,
                      ""
                    );
                    handleAmountValue(
                      parseFloat(formatUnitPrice) * formatAmount
                    );
                  }}
                  onInput={onInputFloat}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
            </div>
          )} */}

          <div className="row mx-auto mt-3">
            <div className="col-sm mb-2">
              <label htmlFor="due_date">Due Date</label>
              {/* <input
                value={dueDate}
                readOnly={!edit}
                type="date"
                required
                onChange={(e) => {
                  setDueDate(e.target.value);
                  // if (e.target.value) {
                  //   dueDateValidation(e.target.value, setDueDate);
                  // }
                }}
                name=""
                id="due_date"
                className="form-control py-3 ps-3"
                style={{ paddingRight: `${validated ? "2rem" : "1rem"}` }}
              /> */}
              <CustomDatePicker
                selected={dueDate ? new Date(dueDate) : ""}
                handleDateChange={(date) => {
                  setDueDate(date);
                }}
                setter={setDueDate}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                iconTopOffset={"1.3rem"}
              />
            </div>

            <div className="col-sm">
              <label htmlFor="expenses_date">Expenses Date</label>
              {/* <input
                value={expenses_date}
                readOnly={!edit}
                type="date"
                required
                onChange={(e) => {
                  setExpenses_date(e.target.value);
                  if (e.target.value) {
                    dateValidation(e.target.value, setExpenses_date);
                  }
                }}
                name=""
                id="expenses_date"
                className="form-control py-3 ps-3"
                style={{ paddingRight: `${validated ? "2rem" : "1rem"}` }}
              /> */}
              <CustomDatePicker
                label={"Expenses Date"}
                selected={expenses_date ? new Date(expenses_date) : ""}
                handleDateChange={(date) => {
                  setExpenses_date(date);
                  if (date) {
                    dateValidation(date, setExpenses_date, "Expenses Date");
                  }
                }}
                setter={setExpenses_date}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1.3rem"}
              />
            </div>
          </div>
          <div className="row mx-auto mt-3">
            <div className="col-sm">
              <div className="col-sm mb-2">
                <span>Amount</span>
                <div className="input-group mb-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text h-100">
                      <select
                        required
                        onChange={(e) => handleChangeCurrency(e.target.value)}
                        className="form-select"
                        disabled={!edit || isCurrencyDisabled}
                        value={selected_currency_id}
                      >
                        <option value="" selected disabled>
                          Select Currency
                        </option>
                        {currency_db.map((data) => (
                          <option key={data.id} value={data.id}>
                            {`${data.currency_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={totalAmount?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    required
                    readOnly={
                      expensesSubType_id ===
                      "11111111-1111-1111-1111-111111111111"
                        ? true
                        : !edit
                    }
                    onChange={(e) => handleAmountValue(e.target.value)}
                    onInput={onInputFloat}
                    className="form-control p-3 z-0"
                    id="inlineFormInputGroup"
                  />
                </div>
              </div>

              {selected_currency_id !== "" &&
              selected_currency_id !==
                "11111111-1111-1111-1111-111111111111" ? (
                <div className="col-sm mb-2 d-none">
                  <span>
                    Currency Rate <span className="text-danger">*</span>
                  </span>
                  <div className="input-group mb-2">
                    {edit ? (
                      <input
                        type="text"
                        value={editableCurrencyRate}
                        required
                        onChange={handleEditableCurrencyRateChange}
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="Enter Currency Rate"
                        readOnly
                      />
                    ) : (
                      <input
                        type="text"
                        value={parseFloat(currencyRate || 1).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }
                        )}
                        readOnly
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="col-sm mb-2">
              <label htmlFor="description">Description</label>
              <Form.Control
                id="remarks"
                as="textarea"
                readOnly={!edit}
                rows={3}
                style={{
                  fontSize: "16px",
                  height: "200px",
                  maxHeight: "200px",
                  resize: "none",
                  overflowY: "auto",
                }}
                placeholder="Enter Description"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="row mt-4 mx-auto">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          {status === "For-Approval" ? (
            <React.Fragment>
              {edit ? (
                <div className="row w-25 me-3">
                  <div className="col-sm text-end">
                    <div className="w-75 ms-auto text-nowrap">
                      <Button
                        variant="outline-secondary"
                        className="mx-3 w-50"
                        type="button"
                        onClick={() => {
                          setEdit(false);
                          reloadDataExpenses();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button className="btn btn-primary w-50" type="submit">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-25 text-end">
                  <div className="d-flex w-100 flex-row">
                    <div
                      className={`d-flex flex-row ${
                        authrztn.includes("Expenses-Approved")
                          ? "w-50"
                          : "w-100"
                      }`}
                    >
                      {authrztn.includes("Expenses-Edit") && (
                        <Button
                          className="btn btn-primary w-100 me-3"
                          onClick={(e) => {
                            e.preventDefault();
                            setEdit(true);
                          }}
                          type="button"
                        >
                          Edit
                        </Button>
                      )}
                    </div>

                    {authrztn.includes("Expenses-Approved") && (
                      <div className="flex-grow-1">
                        <button
                          className="btn btn-outline-danger w-100"
                          type="button"
                          onClick={openPDFPreview}
                          disabled={isCutoffPosted || !isCutoffExists}
                        >
                          Preview PDF
                        </button>
                      </div>
                    )}

                    {/* Add an additional check for Expenses-Approve BEFORE rendering the buttons */}
                    {authrztn.includes("Expenses-Approved") &&
                      status === "For-Approval" && (
                        <div className="d-none d-flex w-100 flex-row">
                          <Button
                            variant="danger"
                            className="w-50"
                            type="button"
                            onClick={() => {
                              handleReject();
                            }}
                            disabled={isCutoffPosted || !isCutoffExists}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            className="ms-3 w-50"
                            type="button"
                            onClick={() => {
                              handleApprove();
                            }}
                            disabled={isCutoffPosted || !isCutoffExists}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                  </div>
                  {(authrztn.includes("Expenses-Edit") ||
                    authrztn.includes("Expenses-Approved")) &&
                    isCutoffPosted &&
                    status === "For-Approval" && (
                      <div
                        className="w-100 p-0 ms-auto mt-2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <p className="text-danger">
                          Action is prohibited as the Expenses date has already
                          been posted.
                        </p>
                      </div>
                    )}

                  {(authrztn.includes("Expenses-Edit") ||
                    authrztn.includes("Expenses-Approved")) &&
                    !isCutoffExists &&
                    status === "For-Approval" && (
                      <div
                        className="w-100 p-0 ms-auto mt-2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <p className="text-danger">
                          Action is prohibited as the Expenses date has not been
                          created.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </div>
      </Form>

      <Modal show={print} size="xl" onHide={() => setPrint(false)}>
        <div className="position-relative">
          <PDFDownloadLink
            document={<PDFExpenses id={id} />}
            fileName={`Expenses - ${transaction_id}.pdf`}
          >
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip
                  id="tooltip-right"
                  className="me-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  Download as{" "}
                  <strong className="text-danger">
                    "Expenses - {transaction_id}.pdf"
                  </strong>
                </Tooltip>
              }
              delay={300}
            >
              <Button
                variant="light"
                className="position-absolute btn btn-light border border-secondary-subtle mb-5 rounded-5"
                style={{ bottom: "-1.8rem", left: "1rem" }}
              >
                <i class="fa-solid fa-download"></i>
              </Button>
            </OverlayTrigger>
          </PDFDownloadLink>

          {/* Add an additional check for Expenses-Approve BEFORE rendering the buttons */}
          <div
            className="position-absolute"
            style={{
              bottom: "1.5rem",
              right: "2.5rem",
            }}
          >
            {authrztn.includes("Expenses-Approved") &&
            status === "For-Approval" ? (
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-danger px-3"
                  type="button"
                  onClick={() => {
                    handleReject();
                  }}
                  disabled={isCutoffPosted || !isCutoffExists}
                >
                  Reject
                </button>
                <button
                  className="btn btn-sm btn-success"
                  type="button"
                  onClick={() => {
                    handleApprove();
                  }}
                  disabled={isCutoffPosted || !isCutoffExists}
                >
                  Approve
                </button>
              </div>
            ) : (
              <span
                className={`badge px-3 py-2 fs-6 ${
                  status === "Approved"
                    ? "bg-success-subtle text-success border border-success-subtle"
                    : "bg-danger-subtle text-danger border border-danger-subtle"
                }`}
              >
                {status}
              </span>
            )}
          </div>
          <PDFViewer style={{ width: "100%", height: "90vh" }}>
            <PDFExpenses id={id} />
          </PDFViewer>
        </div>
      </Modal>
    </div>
  );
};

export default AddExpenses;
