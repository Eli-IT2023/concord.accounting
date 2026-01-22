import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Nav, Tab, Table } from "react-bootstrap";
import swal from "sweetalert";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles.js";

const AddExpenses = () => {
  const { currencyId, totalFixedAssetAmount } = useParams();
  const { state } = useLocation();
  const ids = state?.ids || [];
  const userLoggedID = useDecodeToken();

  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [transaction_id, setTransaction_id] = useState("");
  const [expensesType_db, setExpensesType_db] = useState([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [expenses_date, setExpenses_date] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency_db, setCurrency_db] = useState([]);
  const [foreign, setForeign] = useState("Local");
  const [expensesSubType_id, setExpensesSubType_id] = useState();
  const [expensesType_name, setExpensesType_name] = useState("");
  const [selected_currency_id, setSelected_currency_id] = useState("");

  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [assetQuantity, setAssetQuantity] = useState("");
  const [currencyRate, setCurrencyRate] = useState("");
  const [fixedAssetList, setFixedAssetList] = useState([]);

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/expenses/getCode")
      .then((res) => {
        setTransaction_id(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

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

  const handleExpensesChange = (selectedOption) => {
    const selectedId = selectedOption?.value;
    setExpensesSubType_id(selectedOption);

    setProductName("");
    setUnitPrice("");
    setAssetQuantity("");

    const selected = expensesType_db.find(
      (data) => data.id === String(selectedId, 10)
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

    let formatTotalAmount = totalAmount.replace(/,/g, "");
    let formatUnitPrice = unitPrice.replace(/,/g, "");
    let formatAsset = assetQuantity.replace(/,/g, "");

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
        title: "Create this new expenses?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/expenses/createExpenses`, {
              totalAmount:
                parseFloat(formatTotalAmount) ||
                (totalFixedAssetAmount == "null" ? "" : totalFixedAssetAmount),
              desc,
              expenses_date,
              dueDate,
              expensesSubType_id: expensesSubType_id?.value,
              transaction_id,
              foreign,
              selected_currency_id:
                selected_currency_id ||
                (currencyId == "null" ? "" : currencyId),
              productName,
              unitPrice: parseFloat(formatUnitPrice),
              assetQuantity: parseFloat(formatAsset),
              userLoggedID,
              currencyRate: currencyRate == "" ? null : currencyRate,
              fixedAssetIds: ids,
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
              }
              // else if (res.status === 202) {
              //   swal({
              //     title: "Opppss!",
              //     text: "Cutoff already posted for due date you've selected",
              //     icon: "warning",
              //     buttons: false,
              //     timer: 2000,
              //     dangerMode: true,
              //   });
              // }
              else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const dateValidation = async (selectedDate, clearField) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      if (res.data == false) {
        swal({
          icon: "error",
          title: "Invalid Date Selection",
          text: "Please Create Cutoff for this Date",
        }).then(() => {
          clearField("");
        });
      }
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
      if (res.data == false) {
        swal({
          icon: "error",
          title: "Invalid Due Date Selection",
          text: "Please Create Cutoff for this Date",
        }).then(() => {
          clearField("");
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchLastCode();
    fetchCurrency();
  }, []);

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
    setCurrencyRate(curr.currency_rate);
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  const fetchFixedAsset = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/fixedasset/getFixedAssetForecast`,
        {
          params: {
            fixedAssetIds: ids,
          },
        }
      );
      if (res.status === 200) {
        setFixedAssetList(res.data);
        setDesc(
          `Fixed Asset:\n${res.data[0].fixed_asset.product_name}\n${res.data
            .map((item) => {
              return `${format(item.date, "MMM dd, yyyy")} - ${item.amount}`;
            })
            .join(", ")}`
        );
      } else {
        swal({
          icon: "error",
          title: "Something Went Wrong",
          text: "Please contact support immediately",
        });
      }
    } catch (error) {
      console.error(error);
      swal({
        icon: "error",
        title: "Something Went Wrong",
        text: "Please contact support immediately",
      });
    }
  };

  useEffect(() => {
    setExpenses_date(dateToday());

    if (ids.length > 0) {
      fetchFixedAsset();
    }
  }, []);

  useEffect(() => {
    if (currencyId != "null" && currency_db.length > 0) {
      const curr = currency_db.find(
        (data) => String(data.id) == String(currencyId)
      );
      setCurrencyRate(curr?.currency_rate);
    }
  }, [currency_db]);

  console.log(currencyRate, "currency rate=====");

  // Expense Type 1 Options for dropdown select
  const expenseType1Options = expensesType_db.map((item) => ({
    value: item.id,
    label: `${item.expenses_one.expenses_type_one} - ${item.sub_type}`,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-3 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      required
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/accounting/expenses" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            ADD EXPENSES
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
              <Form.Group className="mb-3" controlId="payWith">
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
              </Form.Group>
            </div>
          </div>
          <div className="row mx-auto">
            <React.Fragment>
              <div className="col-sm mb-2">
                <span>
                  Expenses Type 1<span className="text-danger">*</span>
                </span>
                {/* <select
                  required
                  onChange={handleExpensesChange}
                  className="form-select p-3"
                  value={expensesSubType_id}
                >
                  <option value="" selected disabled>
                    Select Expense Type 1
                  </option>
                  {expensesType_db.map((data) => (
                    <option key={data.id} value={data.id}>
                      {`${data.expenses_one.expenses_type_one} - ${data.sub_type}`}
                    </option>
                  ))}
                  {fixedAssetList.map((data) => (
                    <option key={data.id} value={data.id}>
                      {`${format(data.date, "MMM dd, yyyy")} - ${data.amount}`}
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
                  required
                />
              </div>

              <div className="col-sm mb-2">
                <span>
                  Expenses Type 2 <span className="text-danger">*</span>
                </span>
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

          {/* {expensesSubType_id === "11111111-1111-1111-1111-111111111111" && (
            <div className="row mx-auto mt-3">
              <div className="col-sm mb-2">
                <span>Product Name</span>
                <input
                  type="text"
                  value={productName}
                  required
                  onChange={(e) => setProductName(e.target.value)}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                />
              </div>
              <div className="col-sm mb-2">
                <span>Unit Price</span>
                <input
                  type="text"
                  value={unitPrice}
                  required
                  onChange={(e) => {
                    handleSetUnitPriceValue(e.target.value);

                    handleAmountValue(
                      parseFloat(assetQuantity) * parseFloat(e.target.value)
                    );
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
                  value={assetQuantity}
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
                    handleAmountValue(formatUnitPrice * formatAmount);
                    // setTotalAmount(unitPrice * e.target.value);
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
              <label htmlFor="due_date">
                Due Date<span className="text-danger">*</span>
              </label>
              {/* <input
                value={dueDate}
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
              <div className="position-relative">
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                  }}
                  dateFormat="MMM dd, yyyy"
                  className="form-control p-2"
                  customInput={<CustomInput />}
                />
                <i
                  class="fa-solid fa-calendar-week calendar-position"
                  style={{
                    right: `${validated ? "2rem" : "1rem"}`,
                    top: "1.3rem",
                  }}
                ></i>
              </div>
            </div>
            <div className="col-sm">
              <label htmlFor="expenses_date">
                Expenses Date <span className="text-danger">*</span>
              </label>
              {/* <input
                value={expenses_date}
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
              <div className="position-relative">
                <DatePicker
                  selected={expenses_date}
                  onChange={(date) => {
                    setExpenses_date(date);
                    if (date) {
                      dateValidation(date, setExpenses_date);
                    }
                  }}
                  dateFormat="MMM dd, yyyy"
                  className="form-control p-2"
                  customInput={<CustomInput />}
                />
                <i
                  class="fa-solid fa-calendar-week calendar-position"
                  style={{
                    right: `${validated ? "2rem" : "1rem"}`,
                    top: "1.3rem",
                  }}
                ></i>
              </div>
            </div>
          </div>
          <div className="row mx-auto mt-3">
            <div className="col-sm">
              <div className="col-sm mb-2">
                <span>
                  Amount <span className="text-danger">*</span>
                </span>
                <div className="input-group mb-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text h-100">
                      <select
                        required
                        onChange={(e) => handleChangeCurrency(e.target.value)}
                        className="form-select"
                        value={
                          selected_currency_id ||
                          (currencyId == "null" ? "" : currencyId)
                        }
                        disabled={
                          currencyId !== "null" &&
                          totalFixedAssetAmount !== "null"
                        }
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
                    value={
                      totalAmount ||
                      (totalFixedAssetAmount == "null"
                        ? ""
                        : totalFixedAssetAmount)
                    }
                    required
                    // readOnly={
                    //   expensesSubType_id ===
                    //   "11111111-1111-1111-1111-111111111111"
                    // }
                    // onChange={(e) => setTotalAmount(e.target.value)}
                    onChange={(e) => handleAmountValue(e.target.value)}
                    // onInput={onInputFloat}
                    className="form-control p-3 z-0"
                    id="inlineFormInputGroup"
                  />
                </div>
              </div>

              {/* {selected_currency_id !== "" &&
              selected_currency_id ===
                "11111111-1111-1111-1111-111111111111" ? null : (
                <>
                  <div className="col-sm mb-2">
                    <span>
                      Currency Rate <span className="text-danger">*</span>
                    </span>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        value={currencyRate}
                        onInput={onInputFloat}
                        required
                        onChange={(e) => {
                          const value = e.target.value;
                          let inputValue = value.replace(/[^0-9.]/g, "");
                          if (inputValue) {
                            inputValue = inputValue.replace(
                              /\B(?=(\d{3})+(?!\d))/g,
                              ","
                            );
                          }
                          const cleanedValue = inputValue.replace(
                            /^0+,|^0+/,
                            ""
                          ); // Remove leading zeros and comma
                          setCurrencyRate(
                            value.length > 1 ? cleanedValue : inputValue
                          );
                        }}
                        // onInput={onInputFloat}
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                      />
                    </div>
                  </div>
                </>
              )} */}
            </div>

            <div className="col-sm mb-2">
              <label htmlFor="description">
                Description <span className="text-danger">*</span>
              </label>
              <Form.Control
                id="remarks"
                as="textarea"
                rows={3}
                style={{
                  fontSize: "16px",
                  height: "200px",
                  maxHeight: "200px",
                  resize: "none",
                  overflowY: "auto",
                }}
                placeholder="Enter Description"
                value={desc}
                required
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
            <button
              className="btn btn-secondary w-100 me-3"
              type="button"
              onClick={() => navigate("/accounting/expenses")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100">
              Save
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AddExpenses;
