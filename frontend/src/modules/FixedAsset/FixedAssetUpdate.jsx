import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Modal } from "react-bootstrap";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";

const FixedAssetUpdate = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [edit, setEdit] = useState(false);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const [forecast, setForecast] = useState([]);

  const [status, setStatus] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [date, setDate] = useState();
  const [expenses_id, setExpenses_id] = useState("");

  const [costPerUnit, setCostPerUnit] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [monthsToPay, setMonthsToPay] = useState(0);
  // const [deductedMonthsToPay, setDeductedMonthsToPay] = useState(0);
  const [depreciationAmount, setDepreciationAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [currencyName, setCurrencyName] = useState("PHP");
  const [products, setProducts] = useState([]);

  const [approvedForecast, setApprovedForecast] = useState([]);

  const [approvedForecastValue, setApprovedForecastValue] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);

  useEffect(() => {
    fetchAssets();
    // calculateDepreciationAmount();
    calculateTotalCost();
  }, [costPerUnit, quantity, monthsToPay, totalCost]);

  // function getTodayDate() {
  //   const today = new Date();
  //   return today.toISOString().split("T")[0];
  // }

  const getApprovedForecast = () => {
    axios
      .get(BASE_URL + "/fixedasset/getApprovedForecast", {
        params: {
          id: id,
        },
      })
      .then((res) => {
        console.log(res.data);
        setApprovedForecast(res.data);

        const total = res.data.reduce(
          (acc, curr) => (curr.isPaid ? acc + curr.amount : acc),
          0
        );
        setApprovedForecastValue(totalCost - total);
        const paidItems = res.data.filter((item) => item.isPaid);
        setPaidCount(monthsToPay - paidItems.length); // Count of rows where isPaid is true
      });
  };

  const reloadData = () => {
    axios
      .get(BASE_URL + "/fixedasset/getFixedAssetById", {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setTransactionCode(res.data.transaction_code);
        setDate(res.data.date_depreciated);
        setExpenses_id(res.data.expenses_id);
        setCurrencyName(res.data.expense.currency.currency_name);
        // setProductName(res.data.expense.product_name);
        setCostPerUnit(res.data.cost_per_unit);
        setQuantity(res.data.quantity);
        setTotalCost(res.data.total_cost);
        setMonthsToPay(res.data.static_months_to_pay);
        // setDeductedMonthsToPay(res.data.months_to_pay);
        setDepreciationAmount(res.data.depreciation_amount);
        setRemarks(res.data.remarks);
        setStatus(res.data.status);
        setIsCutoffPosted(res.data.isPosted);
      });
  };

  useEffect(() => {
    if (status === "Approved") {
      getApprovedForecast();
    }
    reloadData();
  }, [status]);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const calculateTotalCost = () => {
    setTotalCost(costPerUnit * quantity);
  };

  const fetchAssets = () => {
    axios
      .get(BASE_URL + "/fixedasset/fetchExpensesProducts", {
        params: { id: id },
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

  const handleProductChange = (e) => {
    setExpenses_id(e.target.value);

    const product = products.find(
      (p) => String(p.id) === String(e.target.value)
    );
    if (product) {
      setCostPerUnit(product.unitPrice);
      setCurrencyName(product.currency.currency_name);
      setQuantity(product.assetQuantity);
      setDate(product.expenses_date);
    }
  };

  const calculateForecast = () => {
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
  };

  const handleCheckForecast = () => {
    calculateForecast();
    setShow(true);
  };

  const openModal = async (e) => {
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
      calculateForecast();
    }
    setValidated(true);
  };

  const handleSaveAsset = () => {
    setShow(false);

    let formatMonthsToPay = String(monthsToPay).replace(/,/g, "");
    let formatDepreciationAmount = String(depreciationAmount).replace(/,/g, "");

    swal({
      title: "Update this fixed asset?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/fixedasset/updateFixedAsset`, null, {
            params: {
              date,
              expenses_id,
              costPerUnit,
              quantity,
              totalCost,
              monthsToPay: formatMonthsToPay,
              depreciationAmount: formatDepreciationAmount,
              remarks,
              forecast,
              id,
              userLoggedID,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Fixed asset updated successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                reloadData();
                setEdit(false);
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
          });
      } else {
        setShow(true);
      }
    });
  };

  const handleApprove = () => {
    swal({
      title: "Approve this fixed asset?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/fixedasset/approveFixedAsset`, null, {
            params: {
              id,
              userLoggedID,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              window.location.reload();
              swal({
                title: "Success",
                text: "Fixed asset approved successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                reloadData();
                setEdit(false);
                setShow(false);
              });
            }
          });
      }
    });
  };

  const handleReject = () => {
    swal({
      title: "Reject this fixed asset?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/fixedasset/rejectFixedAsset`, null, {
            params: {
              id,
              userLoggedID,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Fixed asset rejected successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                reloadData();
                setEdit(false);
              });
            }
          });
      }
    });
  };

  const handleSkip = (forecastId, formattedDate) => {
    swal({
      title: "Skip depreciation?",
      text: `Are you sure you want to skip depreciation for the month of ${formattedDate}?`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/fixedasset/skipDeduction`, null, {
            params: {
              id,
              forecastId,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: `Depreciation for the month of ${formattedDate} has been successfully skipped.`,
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                reloadData();
                getApprovedForecast();
              });
            }
          });
      }
    });
  };

  const handleMonthsToPay = (value) => {
    if (value == ".") {
      setMonthsToPay((prev) => prev + ".");
    }
    let inputValue = value.replace(/[^0-9.]/g, "");

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
    let inputValue = value.replace(/[^0-9.]/g, "");

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

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/accounting/fixedAsset" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            PREVIEW FIXED ASSET
          </span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
      </div>
      {status === "Approved" && (
        <div className="row mt-3 mx-auto">
          <div className="col-sm">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Product Current Value</h5>
                <p
                  className="card-text text-success amount "
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={handleCheckForecast}
                >
                  {approvedForecastValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: currencyName,
                  })}
                </p>
                <p className="card-text">
                  from{" "}
                  {totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: currencyName,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Months Remaining</h5>
                <p
                  className="card-text text-success amount"
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={handleCheckForecast}
                >
                  {paidCount}
                </p>
                <p className="card-text">OF {monthsToPay} months</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <Form noValidate validated={validated} onSubmit={openModal}>
        <div className="container-fluid mt-4">
          <div className="row mb-2">
            <div className="col-sm">
              <span>Transaction Code</span>
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
              <span>Date Depreciated</span>
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
              <div>
                <DatePicker
                  selected={date}
                  onChange={(date) => {
                    setDate(date);
                  }}
                  dateFormat="MMM dd, yyyy"
                  className="form-control p-3"
                  readOnly
                  placeholderText={"mmm/dd/yyyy"}
                />
              </div>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm">
              <span>Item Name</span>
              <select
                className="form-select p-3"
                onChange={handleProductChange}
                required
                disabled={!edit}
                value={expenses_id}
              >
                <option value="" selected disabled>
                  Select Item
                </option>

                {products.map((expenses, index) => (
                  <option key={index} value={expenses.id}>
                    {`${expenses.transaction_id} - ${expenses.product_name}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm mb-2">
              <span>Cost Per Unit</span>
              <div className="input-group mb-2">
                <input
                  type="text"
                  value={costPerUnit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: currencyName,
                  })}
                  onInput={onInputFloat}
                  readOnly
                  onChange={(e) => {
                    setCostPerUnit(e.target.value);
                  }}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
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
                </div>
                <div className="col-sm">
                  <span>Total Cost</span>
                  <input
                    type="text"
                    required
                    readOnly
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
                  readOnly={!edit}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                  placeholder="0"
                  value={monthsToPay}
                  // onChange={(e) => {
                  //   const value = e.target.value;
                  //   setMonthsToPay(value);
                  //   // Calculate depreciation amount based on months to pay
                  //   if (totalCost && value > 0) {
                  //     setDepreciationAmount(totalCost / value);
                  //   } else {
                  //     setDepreciationAmount(0);
                  //   }
                  // }}
                  onChange={(e) => {
                    handleMonthsToPay(e.target.value);
                  }}
                />
              </div>
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
                  readOnly={!edit}
                  className="form-control p-3"
                  id="inlineFormInputGroup"
                  placeholder="0.00"
                  value={depreciationAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  // readOnly={monthsToPay !== ""}
                  // onChange={(e) => {
                  //   const value = e.target.value.replace(/[^0-9.]/g, ""); // Ensure valid float input
                  //   setDepreciationAmount(value);
                  //   // Calculate months to pay based on depreciation amount
                  //   if (value > 0) {
                  //     setMonthsToPay(Math.ceil(totalCost / value));
                  //   } else {
                  //     setMonthsToPay(0);
                  //   }
                  // }}
                  onChange={(e) => {
                    handleDepriciationAmount(e.target.value);
                  }}
                  onInput={onInputFloat}
                />
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
                readOnly={!edit}
              ></textarea>
            </div>
          </div>
          <div className="button-container mt-5">
            <div className="">
              {status === "Pending" ? (
                <React.Fragment>
                  {edit ? (
                    <>
                      <Button
                        variant="outline-secondary"
                        className="me-3"
                        type="button"
                        onClick={() => {
                          setEdit(false);

                          reloadData();
                        }}
                      >
                        Cancel Edit
                      </Button>
                      <Button className="btn btn-primary" type="submit">
                        View
                      </Button>
                    </>
                  ) : (
                    <div className="d-flex flex-row justify-content-between">
                      <div className="d-flex flex-row">
                        {authrztn.includes("FixedAssets-Edit") && (
                          <Button
                            className="btn btn-primary"
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
                      <div className="d-flex flex-row justify-content-end">
                        <Button
                          variant="outline-warning"
                          className="me-3"
                          type="button"
                          onClick={() => {
                            handleCheckForecast();
                          }}
                        >
                          Check Forecast
                        </Button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ) : (
                <React.Fragment></React.Fragment>
              )}
            </div>
          </div>
        </div>
      </Form>

      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Fixed Asset Forecast</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {status === "Approved"
            ? approvedForecast.map((date, index) => (
                <div key={index} className="mb-3">
                  <div className="card p-3 shadow-sm border-0 rounded">
                    <div className="row align-items-center">
                      <div className="col-sm">
                        <strong>Date:</strong>
                        <span className="text-muted">
                          {new Date(date.date).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                          {/* <span
                            className={`mx-3 badge ${
                              date.isPaid ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {date.isPaid ? "Depreciated" : "Pending"}
                          </span> */}
                          <span
                            className={`mx-3 badge ${
                              date.status === "Paid"
                                ? "bg-success"
                                : date.status === "Skipped"
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                          >
                            {date.status === "Paid"
                              ? "Depreciated"
                              : date.status === "Skipped"
                              ? "Skipped"
                              : "Pending"}
                          </span>
                        </span>
                      </div>
                      <div className="col-sm">
                        <strong>Amount:</strong>{" "}
                        <span className="fw-bold">
                          {date.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            style: "currency",
                            currency: currencyName,
                          })}
                        </span>
                      </div>

                      {date.status === "Pending" && (
                        <div
                          className="text-end"
                          style={{ width: "max-content" }}
                          onClick={() =>
                            handleSkip(
                              date.id,
                              new Date(date.date).toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                              })
                            )
                          }
                        >
                          <button className="btn btn-warning">Skip</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : forecast.map((date, index) => (
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
          {status === "Pending" ? (
            <React.Fragment>
              {edit ? (
                <>
                  <Button
                    variant="outline-secondary"
                    className="me-3"
                    type="button"
                    onClick={() => {
                      handleClose();
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveAsset}
                  >
                    Update
                  </Button>
                </>
              ) : (
                <div className="d-flex flex-row justify-content-between">
                  <div className="d-flex flex-row">
                    {/* <Button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        setEdit(true);
                      }}
                      type="button"
                    >
                      Edit
                    </Button> */}
                  </div>
                  {authrztn.includes("FixedAssets-Approve") && (
                    <div className="d-flex flex-wrap gap-3">
                      <div className="align-self-center">
                        {isCutoffPosted && (
                          <p className="text-danger mb-0">
                            Action is prohibited as the Depreciated date has
                            already been posted.
                          </p>
                        )}
                      </div>
                      <div className="d-flex flex-row justify-content-end">
                        <Button
                          variant="outline-success"
                          className="me-3"
                          type="button"
                          onClick={() => {
                            handleApprove();
                          }}
                          disabled={isCutoffPosted}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline-danger"
                          type="button"
                          onClick={() => {
                            handleReject();
                          }}
                          disabled={isCutoffPosted}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FixedAssetUpdate;
