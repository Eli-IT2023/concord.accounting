import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Modal } from "react-bootstrap";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import CustomDatePicker from "../../../components/CustomDatePicker";

const CreateAssets = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);

  const [transactionCode, setTransactionCode] = useState("");
  const [date, setDate] = useState();
  const [expenses_id, setExpenses_id] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [monthsToPay, setMonthsToPay] = useState("");
  const [depreciationAmount, setDepreciationAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [productName, setProductName] = useState("");
  const [currencyList, setCurrencyList] = useState([]);
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );

  const [currencyName, setCurrencyName] = useState("PHP");
  const [products, setProducts] = useState([]);
  const [forecast, setForecast] = useState([]);

  const [allowZeroDepreciation, setAllowZeroDepreciation] = useState(false);

  useEffect(() => {
    fetchLastCode();
    fetchAssets();
    // calculateDepreciationAmount();
    calculateTotalCost();
    // calculateMonthsToPay();
  }, [costPerUnit, quantity, monthsToPay, totalCost]);

  // function getTodayDate() {
  //   const today = new Date();
  //   return today.toISOString().split("T")[0];
  // }

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const removeComma = (num) => {
    return parseFloat(String(num).replace(/,/g, ""));
  };

  const calculateTotalCost = () => {
    setTotalCost(
      (removeComma(costPerUnit) || 0) * (removeComma(quantity) || 0)
    );
  };

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/fixedasset/getCode")
      .then((res) => {
        setTransactionCode(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAssets = () => {
    axios
      .get(BASE_URL + "/fixedasset/fetchExpensesProducts", {
        params: { id: 0 },
      })
      .then((res) => {
        let newExpensesData = [];
        // console.log("Raw response data:", res.data);

        res.data.forEach((data) => {
          // console.log("Checking item:", data);

          // Case 1: No fixed asset exists or empty array
          if (!data.fixed_assets || data.fixed_assets.length === 0) {
            // console.log("Case 1: No fixed assets or empty array");
            newExpensesData.push(data);
          }
          // Case 2: Fixed asset exists with empty array
          else if (
            Array.isArray(data.fixed_assets) &&
            data.fixed_assets.length === 0
          ) {
            // console.log("Case 2: Empty fixed assets array");
            newExpensesData.push(data);
          }
          // Case 3: Fixed asset exists with Rejected status
          else if (
            Array.isArray(data.fixed_assets) &&
            data.fixed_assets.length > 0
          ) {
            const lastAsset = data.fixed_assets[data.fixed_assets.length - 1];
            if (lastAsset.status === "Rejected") {
              // console.log("Case 3: Last asset has Rejected status");
              newExpensesData.push(data);
            }
          }
        });

        // console.log("Filtered data:", newExpensesData);
        setProducts(newExpensesData);
      })
      .catch((error) => {
        console.error("Error fetching assets:", error);
      });
  };

  const clearFilters = () => {
    setExpenses_id("");

    setCostPerUnit("");
    setQuantity("");
    setTotalCost("");
  };
  const handleProductChange = (e) => {
    setExpenses_id(e.target.value);

    const product = products.find(
      (p) => String(p.id) === String(e.target.value)
    );
    if (product) {
      setCostPerUnit(product.unitPrice);

      setQuantity(product.assetQuantity);
      setDate(product.expenses_date);
      setCurrencyName(product.currency.currency_name);
    }
  };

  const openModal = async (e) => {
    //save buttonm
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
      if (Number(totalCost).toFixed(2) === "0.00") {
        swal({
          icon: "warning",
          title: "Invalid Total Cost",
          text: "The total cost must be greater than zero. Please review your entries.",
        });
        return;
      }

      if (
        monthsToPay == 0 &&
        depreciationAmount == 0 &&
        !allowZeroDepreciation
      ) {
        swal({
          icon: "warning",
          title: "Invalid Months to Pay and Depreciation Amount",
          text: "Months to Pay and Depreciation Amount should be greater than zero.",
        });
        return;
      }

      // Prevent invalid value when Months to Pay is less than 1, ex: 0.234, 0.51
      if (Math.trunc(monthsToPay) === 0 && !allowZeroDepreciation) {
        //Modified validation for months to pay to allow zero
        swal({
          icon: "warning",
          title: "Invalid Months to Pay",
          text: "Months to Pay cannot be less than one",
        }).then(() => setMonthsToPay(0));
        return;
      }

      const forecastData = [];
      const startDate = new Date(date); // Convert the date string to a Date object
      const monthsToForecast = Math.ceil(parseFloat(monthsToPay)); // Ensure monthsToPay is rounded up

      // Set a fixed depreciation amount
      const fixedDepreciationAmount = parseFloat(
        String(depreciationAmount).replace(/,/g, "")
      ); // Change this to your desired fixed amount

      for (let i = 1; i <= monthsToForecast; i++) {
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(startDate.getMonth() + i); // Add months
        forecastData.push({
          date: nextMonth.toISOString().split("T")[0], // Format to YYYY-MM-DD
          amount: fixedDepreciationAmount, // Use the fixed depreciation amount
        });
      }

      // Calculate total depreciation
      const totalDepreciation = fixedDepreciationAmount * monthsToForecast;

      // Calculate remaining amount
      const remainingAmount = totalCost - totalDepreciation;

      // If there's a remaining amount, adjust the last month's amount
      if (remainingAmount < 0) {
        // If total depreciation exceeds total cost, adjust the last entry
        forecastData[forecastData.length - 1].amount += remainingAmount; // Adjust last month's amount
      } else if (remainingAmount > 0) {
        // If there's a remaining amount, add it as an additional forecast entry
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(startDate.getMonth() + monthsToForecast); // Add one more month
        forecastData.push({
          date: nextMonth.toISOString().split("T")[0], // Format to YYYY-MM-DD
          amount: remainingAmount, // Remaining amount
        });
      }

      setForecast(forecastData);
      setShow(true);
    }
    setValidated(true);
  };

  const handleSaveAsset = () => {
    setShow(false);

    let formatMonthsToPay = String(monthsToPay).replace(/,/g, "");
    let formatDepreciationAmount = String(depreciationAmount).replace(/,/g, "");

    dateValidation(date, setDate);

    swal({
      title: "Are you sure?",
      text: "Create this new fixed asset?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/fixedasset/createFixedAsset`, {
            transactionCode,
            date,
            expenses_id,
            costPerUnit: removeComma(costPerUnit),
            quantity: removeComma(quantity),
            totalCost,
            monthsToPay: formatMonthsToPay,
            depreciationAmount: formatDepreciationAmount,
            remarks,
            forecast,
            userLoggedID,
            productName,
            currencyId,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Fixed asset created successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                navigate("/accounting/fixedAsset");
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
                text: "Action is prohibited because the Depreciation Date has already passed the posted cutoff.",
                icon: "error",
                button: true,
              });
            }
          });
      } else {
        setShow(true);
      }
    });
  };

  const handleMonthsToPay = (value) => {
    if (value == ".") {
      setMonthsToPay((prev) => prev + ".");
    }
    let inputValue = String(value || 0).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    setMonthsToPay(formattedValue);
    // Calculate depreciation amount based on months to pay
    if (totalCost && numericValue > 0) {
      const total = totalCost / numericValue;

      let [integerPart, decimalPart] = String(total).split(".");

      if (integerPart) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      let formattedValue =
        decimalPart !== undefined
          ? `${integerPart}.${decimalPart}`
          : integerPart;

      setDepreciationAmount(formattedValue);
    } else {
      setDepreciationAmount(0);
    }
  };

  const handleDepriciationAmount = (value) => {
    if (value == ".") {
      setMonthsToPay((prev) => prev + ".");
    }
    let inputValue = String(value || 0).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    setDepreciationAmount(formattedValue);
    // Calculate months to pay based on depreciation amount
    if (numericValue > 0) {
      const total = totalCost / numericValue;

      setMonthsToPay(Math.ceil(total));
    } else {
      setMonthsToPay(0);
    }
  };

  const fetchCurrency = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setCurrencyList(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  // Reusable function for numbers
  const handleAmountChange = (value, setState) => {
    if (value === ".") {
      setState((prev) => (prev.includes(".") ? value : prev + "."));
      return;
    }

    // Remove non-numeric and non-dot characters
    let inputValue = value.replace(/[^0-9.]/g, "");

    // Split integer and decimal
    let [integerPart, decimalPart] = inputValue.split(".");

    // ✅ Remove leading zeros from integer part only (keep at least one digit)
    if (integerPart) {
      integerPart = integerPart.replace(/^0+(?!$)/, "");
      // Add commas
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Rebuild formatted value
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setState(formattedValue);
  };

  const dateValidation = async (selectedDate, clearField) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      // if (res.data == false) {
      //   swal({
      //     icon: "error",
      //     title: "Invalid Date Selection",
      //     text: "Please Create Cutoff for this Date",
      //   }).then(() => {
      //     clearField("");
      //   });
      // }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleMonthsToPay(monthsToPay);
  }, [totalCost]);

  useEffect(() => {
    setDate(dateToday());
    fetchCurrency();
  }, []);

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

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/accounting/fixedAsset" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            ADD FIXED ASSET
          </span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
      </div>
      <Form noValidate validated={validated} onSubmit={openModal}>
        <div className="container mt-4">
          <div className="row mb-2">
            <div className="col-sm">
              <span>Item Code</span>
              <input
                type="text"
                name=""
                id=""
                required
                className="form-control p-3"
                readOnly
                onChange={(e) => setTransactionCode(e.target.value)}
                value={transactionCode}
              />
            </div>
            <div className="col-sm">
              <span>Depreciation Date</span>
              {/* <input
                type="date"
                name=""
                id=""
                required
                readOnly
                className="form-control p-3"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              /> */}
              {/* <div className="position-relative">
                <DatePicker
                  selected={date}
                  onChange={(date) => {
                    setDate(date);
                    dateValidation(date, setDate);
                  }}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control p-3"
                  // readOnly
                  customInput={<CustomInput />}
                />
                <i
                  class="fa-solid fa-calendar-week calendar-position"
                  style={{
                    right: `${validated ? "2rem" : "1rem"}`,
                    top: "1.3rem",
                  }}
                ></i>
              </div> */}
              <CustomDatePicker
                selected={date ? new Date(date) : ""}
                handleDateChange={(date) => {
                  setDate(date);
                  dateValidation(date, setDate);
                }}
                setter={setDate}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1.3rem"}
              />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm">
              {/* <span>Item Name</span>
              <select
                className="form-select p-3"
                value={expenses_id}
                onChange={handleProductChange}
                required
              >
                <option value="" selected disabled>
                  Select Item
                </option>
                {products.map((expenses, index) => (
                  <option key={index} value={expenses.id}>
                    {`${expenses.transaction_id} - ${expenses.product_name}`}
                  </option>
                ))}
              </select> */}
              <span>Product Name</span>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="form-control p-3"
                required
              />
            </div>

            <div className="col-sm">
              <span>Currency</span>
              <select
                className="form-select p-3"
                value={currencyId}
                onChange={(e) => {
                  const currency = currencyList.find(
                    (item) => item.id === e.target.value
                  );
                  setCurrencyName(currency.currency_name);
                  setCurrencyId(e.target.value);
                }}
                required
              >
                <option value="" disabled>
                  Select Currency
                </option>
                {currencyList.map((data) => (
                  <option key={data.id} value={data.id}>
                    {data.currency_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm">
              <span>Quantity</span>
              <input
                type="text"
                value={quantity}
                onChange={(e) => {
                  handleAmountChange(e.target.value, setQuantity);
                }}
                min={0}
                className="form-control"
                style={{
                  padding: `1rem ${validated ? "2rem" : "1rem"} 1rem 1rem`,
                }}
                required
              />
            </div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2 z-0">
                  <span>Cost Per Unit</span>
                  <div className="input-group mb-2">
                    {/* <div className="input-group-prepend">
                      <div className="input-group-text h-100">
                        {currencyName}
                      </div>
                    </div> */}
                    <input
                      type="text"
                      // readOnly
                      value={costPerUnit.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        style: "currency",
                        currency: currencyName,
                      })}
                      onInput={onInputFloat}
                      onChange={(e) => {
                        // setCostPerUnit(e.target.value);
                        handleAmountChange(e.target.value, setCostPerUnit);
                      }}
                      className="form-control p-3"
                      id="inlineFormInputGroup"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm">
              <div className="row">
                {/* <div className="col-sm mb-2">
                  <span>Available to Depreciate Quantity</span>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      readOnly
                      onInput={onInputFloat}
                      value={quantity.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="form-control p-3"
                      id="inlineFormInputGroup"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div> */}
                <div className="col-sm">
                  <span>Total Cost</span>
                  <input
                    type="text"
                    required
                    onInput={onInputFloat}
                    className="form-control p-3"
                    id="inlineFormInputGroup"
                    value={totalCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      style: "currency",
                      currency: currencyName,
                    })}
                    placeholder="0.00"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-sm mb-2">
              <span>Months to Pay</span>
              <div className="input-group mb-2">
                <input
                  type="text"
                  onInput={onInputFloat}
                  required
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                  placeholder="0"
                  value={monthsToPay}
                  readOnly={allowZeroDepreciation}
                  onChange={(e) => {
                    if (!allowZeroDepreciation) {
                      // Only allow changes when checkbox is unchecked
                      const cleanedValue = String(e.target.value).replace(
                        /^0+,|^0+/,
                        ""
                      ); // Remove leading zeros and comma

                      handleMonthsToPay(cleanedValue);
                    }
                  }}
                  // Prevent Decimal input
                  onKeyDown={(e) => {
                    if (e.key === ".") e.preventDefault();
                  }}
                />
              </div>
              {/* <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allowZeroMonthsCheck"
                  checked={allowZeroMonths}
                  onChange={(e) => setAllowZeroMonths(e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor="allowZeroMonthsCheck"
                >
                  Allow zero months to pay
                </label>
              </div> */}
            </div>
            <div className="col-sm mb-2">
              <span>Depreciation Amount</span>
              <div className="input-group mb-2">
                <div className="input-group-prepend">
                  <div className="input-group-text h-100">{currencyName}</div>
                </div>
                <input
                  type="text"
                  required
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                  placeholder="0.00"
                  value={depreciationAmount}
                  readOnly={allowZeroDepreciation}
                  onChange={(e) => {
                    if (!allowZeroDepreciation) {
                      // Only allow changes when checkbox is unchecked
                      const cleanedValue = String(e.target.value).replace(
                        /^0+,|^0+/,
                        ""
                      ); // Remove leading zeros and comma
                      handleDepriciationAmount(cleanedValue);
                    }
                  }}
                  onInput={onInputFloat}
                />
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allowZeroDepreciationCheck"
                  checked={allowZeroDepreciation}
                  onChange={(e) => {
                    setAllowZeroDepreciation(e.target.checked);
                    // When checkbox is checked, set values to 0
                    if (e.target.checked) {
                      setDepreciationAmount("0");
                      setMonthsToPay("0");
                    }
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor="allowZeroDepreciationCheck"
                >
                  Allow zero depreciation amount
                </label>
              </div>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm mb-2">
              <span>Remarks</span>
              <textarea
                cols="5"
                rows="5"
                className="form-control p-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
              <Button
                variant="secondary"
                className="w-100 me-3"
                type="button"
                onClick={() => navigate("/accounting/fixedAsset")}
              >
                Cancel
              </Button>
              <Button className="btn btn-primary w-100" type="submit">
                View
              </Button>
            </div>
          </div>
        </div>
      </Form>

      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Fixed Asset Forecast</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {forecast.map((date, index) => (
            <div key={index} className="mb-3">
              <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(date.date).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div>
                    <strong>Amount:</strong>{" "}
                    {date.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      style: "currency",
                      currency: currencyName,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveAsset}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateAssets;
