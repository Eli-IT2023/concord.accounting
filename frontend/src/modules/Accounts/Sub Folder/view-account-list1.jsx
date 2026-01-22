import React, { useState, useEffect } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import dayjs from "dayjs";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";

import { Table, Modal, Button, Form, Card } from "react-bootstrap";

import {
  Cardholder,
  ArrowCircleUp,
  ArrowCircleDown,
  HandWithdraw,
} from "@phosphor-icons/react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useSort } from "../../../hooks/customHook/tableSort";
import CustomDatePicker from "../../../components/CustomDatePicker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ViewAccountlist1 = () => {
  // State for dropdown selections
  const [subject1, setSubject1] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject2, setSubject2] = useState("");
  const [subject2Type, setSubject2Type] = useState("");
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [subject3, setSubject3] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [checkNo, setCheckNo] = useState("");
  const [date, setDate] = useState("");
  // State to manage disabled states
  const [isSubject1Disabled, setIsSubject1Disabled] = useState(true);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);
  const [isSelectedCurrencyDisabled, setIsSelectedCurrencyDisabled] =
    useState(true);
  const [transaction, setTransaction] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);

  const [otherCurrency, setOtherCurrency] = useState(false);
  const [currencyList, setCurrencyList] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedCurrencyName, setSelectedCurrencyName] = useState("");
  const [originalRate, setOriginalRate] = useState("");

  const [currencyRate, setCurrencyRate] = useState("");
  const [receivedCurrencyRate, setReceivedCurrencyRate] = useState("");
  const [payModal, setPayModal] = useState(false);

  const [selectedPaymentPay, setSelectedPaymentPay] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const handleShow = () => setShowModal(true);
  const handleShow2 = (type) => {
    setOtherCurrency(type === "Normal" ? false : true);
    setShowModal2(true);
  };

  const handleShowPayModal = () => setPayModal(true);

  const userLoggedID = useDecodeToken();
  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const { id } = useParams();
  const location = useLocation();

  const fromAccList = location.state ? location.state.accList : false;
  const fromLiability = location.state ? location.state.liability : false;

  const [accountName, setAccountName] = useState([]);
  const [validated, setValidated] = useState(false);
  const [totalAmountGraph, setTotalAmountGraph] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [createdAt, setCreatedAt] = useState("");

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
    setIsSubject1Disabled(true);
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
    setIsPaymentMethodDisabled(true);
    setIsRemarksDisabled(true);
    setSelectedCurrency("");
  };

  const [graphBalance, setGraphBalance] = useState([]);
  const pagination = useServerPagination(
    BASE_URL + "/accountListSub/getTransaction",
    10,
    {
      id: id,
    }
  );

  const reloadTable = () => {
    pagination.updateParams({
      id: id,
      sortType: "desc",
      sortDBTableColumn: "date",
    });
    // axios
    //   .get(`${BASE_URL}/accountListSub/getTransaction`, {
    //     params: {
    //       id: id,
    //     },
    //   })
    //   .then((res) => {
    //     setTransaction(res.data);
    //     setFilteredTransactions(res.data);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching transactions:", error);
    //   });
  };

  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrencyList(res.data);
    });
  };

  const Balance = () => {
    axios
      .get(`${BASE_URL}/accountListSub/getBalance`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        const balanceData = res.data.data; // Assuming res.data contains an array of { date, amount }
        const totalAmount = res.data.totalAmount;
        setTotalAmountGraph(totalAmount);

        // Initialize an array for 12 months (January = 0, December = 11)
        const monthlyData = Array(12).fill(0);

        // Loop through the balance data and accumulate amounts by month
        balanceData.forEach((balance) => {
          const date = new Date(balance.date); // Parse the date
          const month = date.getMonth(); // Get the month (0 = January, 11 = December)

          const amount = Math.abs(balance.amount); // Get the balance amount
          const amount_type = balance.type;

          if (amount_type === "Debit") {
            monthlyData[month] += amount; // Sum amounts for Debit types
          } else if (amount_type === "Credit") {
            monthlyData[month] -= amount; // Subtract amounts for Credit types
          }
        });

        // Log to verify the monthlyData array
        console.log("Monthly balance data:", monthlyData);

        // Update the chartData state with the accumulated monthly amounts
        setChartData((prevState) => ({
          ...prevState,
          datasets: [
            {
              ...prevState.datasets[0],
              data: monthlyData, // Set the processed monthly data to the chart
            },
          ],
        }));
      })
      .catch((error) => {
        console.error("Error fetching balance:", error);
      });
  };
  const [module_type, setModule_type] = useState("");

  const reloadAccountName = () => {
    axios
      .get(`${BASE_URL}/accountListSub/accountName/`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setAccountName(res.data);
        setModule_type(res.data?.account_list_base_sub?.module_type);
      });
  };

  useEffect(() => {
    setFilteredTransactions(pagination.data);
    setTransaction(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    Balance();
    reloadTable();
    reloadAccountName();
    reloadCurrency();
  }, []);

  const [chartData, setChartData] = useState({
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Net Balance",
        borderColor: "rgb(178, 161, 255)",
        backgroundColor: "rgba(178, 161, 255, 0.3)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: totalAmountGraph,
        ticks: {
          callback: (value) =>
            `${value.toLocaleString("en-US", {
              style: "currency",
              currency: "PHP",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
      },
    },
  };

  // Update subject2 and subject3 based on Subject 1 selection
  const handleSubject1Change = (selectedOption) => {
    const selectedSubject1 = selectedOption.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      account_selected = "Account-List";
    } else if (selectedSubject1 === "Asset Account") {
      account_selected = "Asset Account";
    } else if (selectedSubject1 === "Liabilities Account") {
      account_selected = "Liabilities Account";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      account_selected = "Owner's Equity Account";
    }

    try {
      if (fromLiability) {
        axios
          .get(`${BASE_URL}/accountListSub/getSubjectToPay`, {
            params: {
              account_selected: account_selected,
              currency_id: selectedCurrency?.value,
              selectedPayment: selectedPaymentPay,
            },
          })
          .then((res) => {
            setSubject1(selectedOption);

            setSubject2("");
            setSubject3("");
            setPaymentMethod("");
            setIsSubject2Disabled(otherCurrency ? true : false);

            setIsSubject3Disabled(true);
            setIsPaymentMethodDisabled(true);
            setIsRemarksDisabled(true);

            setSubject2DataList(res.data);
            setIsSubject2Disabled(false);
            console.log(res.data);
          });
      } else {
        axios
          .get(`${BASE_URL}/accountListSub/getSubjectWithSpecificCurrency`, {
            params: {
              account_selected: account_selected,
              currency_id: selectedCurrency?.value,
            },
          })
          .then((res) => {
            setSubject1(selectedOption);

            setSubject2("");
            setSubject3("");
            setPaymentMethod("");
            setIsSubject2Disabled(otherCurrency ? true : false); // Enable Subject 2 after Subject 1 selection
            // setIsSelectedCurrencyDisabled(false);
            setIsSubject3Disabled(true); // Reset and disable Subject 3
            setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
            setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

            setSubject2DataList(res.data); //retrieve subject 2 data
            setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
            console.log(res.data);
          });
      }
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
  const handleSubject2Change = (selectedOption) => {
    const subject_type = selectedOption?.subject_type;
    const selectedSubject2 = selectedOption?.value;
    setSubject3DataList([]);
    try {
      if (otherCurrency) {
        axios
          .get(
            `${BASE_URL}/accountListSub/getSubject3ChainDropdownWithCurrency`,
            {
              params: {
                subjectId: selectedSubject2,
                id: id,
                selectedCurrency: selectedCurrency?.value,
              },
            }
          )
          .then((res) => {
            console.log("DATA WITH CURR", res.data);
            setSubject3DataList(res.data);
            setSubject2(selectedOption);
            setSubject3("");
            setPaymentMethod("");
            setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
            setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
            setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

            setSubject2Type(subject_type);
          });
      } else {
        axios
          .get(`${BASE_URL}/accountListSub/getSubject3ChainDropdown`, {
            params: {
              subjectId: selectedSubject2,
              id: id,
            },
          })
          .then((res) => {
            setSubject3DataList(res.data);
            setSubject2(selectedOption);
            setSubject3("");
            setPaymentMethod("");
            setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
            setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
            setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
            setSubject2Type(subject_type);
          });
      }
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
  const handleSubject3Change = (selectedOption) => {
    const selectedSubject3 = selectedOption;
    setSubject3(selectedSubject3);
    setPaymentMethod("");
    setIsPaymentMethodDisabled(false); // Enable Payment Method after Subject 3 selection

    if (fromLiability) {
      setIsRemarksDisabled(false); // Reset and disable Remarks/Check No.
    } else {
      setIsRemarksDisabled(true);
    }
  };

  // Enable Remarks/Check No. after Payment Method selection
  const handlePaymentMethodChange = (selectedOption) => {
    // const selectedPaymentMethod = event.target.value;
    setPaymentMethod(selectedOption);
    setIsRemarksDisabled(false); // Enable Remarks/Check No. after Payment Method selection
    setCheckNo("");
  };

  const handleCurrencyChange = (selectedOption) => {
    try {
      const id = selectedOption.value;
      const currData = currencyList.find((curr) => curr.id === id);
      if (accountName?.currency?.currency_name === "PHP") {
        setCurrencyRate(currData.currency_rate);
        setReceivedCurrencyRate(currData.currency_rate);
        setOriginalRate(currData.currency_rate);
      } else {
        const currData = currencyList.find(
          (curr) => curr?.currency_name === accountName?.currency?.currency_name
        );
        setCurrencyRate(currData.currency_rate);
        setReceivedCurrencyRate(currData.currency_rate);
        setOriginalRate(currData.currency_rate);
      }
      setSelectedCurrency(selectedOption);
      setSelectedCurrencyName(currData.currency_name);

      // setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
      setIsSubject1Disabled(false);
      setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
      setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
    } catch (error) {
      console.error(error);
    }
  };

  //function for create transaction
  const handleFormSubmit = async (e, type) => {
    e.preventDefault();
    const form = e.currentTarget;

    let formatAmount = String(amount).replace(/,/g, "");

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
        //Para sa activity log malaman kung saan nag create ng transaction kung Owner Equity ba or Accounting List kasi iisang route lang meron
        const currentLocation = location.pathname.includes("view-equityAccount")
          ? "Owner's Equity"
          : location.pathname.includes("view-liabilityAccount")
          ? "Asset Account"
          : "Accounting List";

        if (willProceed) {
          let response;

          if (otherCurrency) {
            const amountToSend = handleCalculateConversion(
              currencyRate,
              parseFloat(String(amount).replace(/,/g, ""))
            );
            response = await axios.post(
              `${BASE_URL}/accountListSub/createTransactionToOtherCurrency`,
              {
                subject1: subject1?.value,
                subject3: subject3?.value,
                paymentMethod: paymentMethod?.value,
                amount: parseFloat(amountToSend),
                amountToDeduct: parseFloat(formatAmount),
                checkNo,
                date,
                id,
                type,
                module_from: module_type,
                userLoggedID,
                currentLocation,
                currencyRate,
                receivedCurrencyRate:
                  accountName.currency.currency_name === "PHP"
                    ? "0"
                    : receivedCurrencyRate,
                originalRate,
                currentCurrencyAmount: parseFloat(
                  String(amount).replace(/,/g, "")
                ),
                from_currency_name: accountName?.currency?.currency_name,
                to_currency_name: selectedCurrencyName,
              }
            );
          } else {
            response = await axios.post(
              `${BASE_URL}/accountListSub/createTransaction`,
              {
                subject1: subject1?.value,
                subject3: subject3?.value,
                paymentMethod: paymentMethod?.value,
                amount: parseFloat(formatAmount),
                checkNo,
                date,
                id,
                type,
                module_from: module_type,
                userLoggedID,
                currentLocation,
                currencyRate: accountName?.currency?.id,
              }
            );
          }

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Transaction created successfully",
              timer: 2000,
            }).then(() => {
              handleClose();
              reloadTable();
              reloadAccountName();
              Balance();
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

  const handlePayLiability = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    let formatAmount = String(amount).replace(/,/g, "");

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
          title: "Are you sure? sa",
          text: "Once submitted, you will not be able to edit this transaction.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });
        //Para sa activity log malaman kung saan nag create ng transaction kung Owner Equity ba or Accounting List kasi iisang route lang meron
        const currentLocation = location.pathname.includes("view-equityAccount")
          ? "Owner's Equity"
          : location.pathname.includes("view-liabilityAccount")
          ? "Liability"
          : location.pathname.includes("view-assetAccount")
          ? "Asset Account"
          : "Accounting List";

        if (willProceed) {
          const response = await axios.post(
            `${BASE_URL}/accountListSub/createTransactionLiability`,
            {
              subject1: subject1?.value,
              subject3: subject3?.value,
              paymentMethod: selectedPaymentPay,
              amount: parseFloat(formatAmount),
              checkNo,
              date,
              id,
              module_from: module_type,
              userLoggedID,
              currentLocation,
              currencyRate: accountName?.currency?.id,
            }
          );

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Transaction created successfully",
              timer: 2000,
            }).then(() => {
              handleClose();
              reloadTable();
              reloadAccountName();
              Balance();
              setPayModal(false);
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

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const applyFilter = () => {
    if (!fromDate || !toDate) {
      swal({
        icon: "error",
        title: "Date range required",
        text: "Please select both a From and To date before proceeding.",
      });

      return;
    }

    pagination.updateParams({
      id: id,
      startDate: new Date(fromDate).toLocaleDateString(),
      endDate: new Date(toDate).toLocaleDateString(),
      sortType: "desc",
      sortDBTableColumn: "date",
    });
    // if (fromDate && toDate) {
    //   const filtered = transaction.filter((t) => {
    //     const transactionDate = new Date(t.date);
    //     const from = new Date(fromDate);
    //     const to = new Date(toDate);

    //     // Check if transaction date is within the selected date range
    //     return transactionDate >= from && transactionDate <= to;
    //   });
    //   setFilteredTransactions(filtered);
    // } else {
    //   setFilteredTransactions(transaction); // Show all if no filter applied
    // }
  };

  const clearFilter = () => {
    setFromDate("");
    setToDate("");
    setFilteredTransactions(transaction); // Reset to all transactions
  };

  const [dateOtherIncome, setDateOtherIncome] = useState("");
  const [descriptionOtherIncome, setDescriptionOtherIncome] = useState("");
  const [amountOtherIncome, setAmountOtherIncome] = useState("");
  //Owners Equity Account
  const handleOtherIncomeSubmit = async (e) => {
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
          title: "Add Other Income?",
          text: "Once submitted, you will not be able to edit this transaction.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });

        if (willProceed) {
          const response = await axios.post(
            `${BASE_URL}/accountListSub/addOtherIncome`,
            {
              dateOtherIncome,
              descriptionOtherIncome,
              amountOtherIncome,
              id,
            }
          );

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Transaction created successfully",
              timer: 2000,
            }).then(() => {
              handleClose();
              reloadTable();
              reloadAccountName();
              Balance();
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

  const handleAmountChange = (value) => {
    if (value == ".") {
      setAmount((prev) => prev + ".");
    }

    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    if (accountName?.amount < numericValue) {
      swal({
        icon: "error",
        title: `Insufficient Balance`,
        text: "The amount you are trying to withdraw is greater than the available balance.",
      }).then(() => {
        setAmount("0");
      });
    } else {
      setAmount(formattedValue);
    }
  };

  const handleCalculateConversion = (rate, amount) => {
    if (accountName?.currency?.currency_name === "PHP") {
      return amount / rate;
    } else {
      return amount * rate;
    }
  };

  const handlePaymentMethod = (e) => {
    const paymentMethod = e.target.value;
    setSelectedPaymentPay(paymentMethod);
    setSubject1("");
    setSubject2("");
    setSubject3("");
  };

  // Currency Options for dropdown select
  // const currencyOptions = currencyList
  //   .filter((option) => option.id !== accountName?.currency?.id)
  //   .map((item) => ({
  //     value: item.id,
  //     label: item.currency_name,
  //   }));

  const currencyOptions =
    accountName?.currency?.currency_name !== "PHP"
      ? [
          {
            value: "11111111-1111-1111-1111-111111111111",
            label: "PHP",
          },
        ]
      : currencyList
          .filter((option) => option.id !== accountName?.currency?.id)
          .map((item) => ({
            value: item.id,
            label: item.currency_name,
          }));

  // Subject 1 Options for dropdown select
  const subject1Options = (subjectType) => {
    const isLiability = subjectType === "Liabilities Account";
    return [
      "Account-List",
      "Asset Account",
      ...(isLiability ? [] : ["Liabilities Account"]), // Conditionally include "Liabilities Account" option
      "Owner's Equity Account",
    ].map((item) => ({
      value: item,
      label: item,
    }));
  };

  // Subject 2 Options for dropdown select
  const subject2Options = subject2DataList?.map((item) => {
    return {
      value: item.id,
      label: item.subject_name,
      subject_type: item.subject_type,
    };
  });

  // Subject 3 Options for dropdown select
  const subject3Options = subject3DataList
    .filter(
      (option) =>
        otherCurrency || option.currency.id === accountName?.currency?.id
    )
    .map((item) => {
      return {
        value: item.id,
        label: item.account_name,
      };
    });

  // Payment method options for dropdown select
  const paymentMethodOptions = ["Cash", "Bank", "Online"].map((item) => ({
    value: item,
    label: item,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, disabled, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100"
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
        disabled={disabled}
        required
      />
    )
  );

  const { isSortedAsc, sortColumn, toggleSort } = useSort(
    "name",
    true,
    pagination.dynamicApiUrl
  );

  const handleSortData = (column) => {
    toggleSort(column, (params) => {
      pagination.updateParams({
        sortType: params.sortType,
        sortDBTableColumn: params.sortDBTableColumn,
        id: id,
      });
    });
  };

  console.log(`pagination.data`, pagination.data);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link
              to={
                module_type === "Account-List"
                  ? `/accounts/account-list1?subject2=${searchParams.get(
                      "subject2"
                    )}&items-shown=${searchParams.get("items-shown")}`
                  : module_type === "Owner's Equity Account"
                  ? `/accounting/equity?subject2=${searchParams.get(
                      "subject2"
                    )}&items-shown=${searchParams.get("items-shown")}`
                  : module_type === "Liabilities Account"
                  ? `/accounting/liabilities1?subject2=${searchParams.get(
                      "subject2"
                    )}&items-shown=${searchParams.get("items-shown")}`
                  : `/accounting/assetaccount-list1?subject2=${searchParams.get(
                      "subject2"
                    )}&items-shown=${searchParams.get("items-shown")}`
              }
              className="text-dark mx-2"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            View Account
          </span>
        </div>
        {/* <div className="d-flex flex-row align-items-center row">
          <div className="col-sm">
            <span className="">Account Currency</span>
          </div>
          <div className="col-sm-8">
            <select name="" id="" className="form-select p-2">
              <option value="" selected disabled>
                Select Currency
              </option>
            </select>
          </div>
        </div> */}
      </div>
      <div className="container-fluid mt-3">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="w-100 h-100 border shadow-sm rounded p-2">
              <h5>Account Details</h5>
              <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <span>
                  <strong>Account Name:</strong>{" "}
                  <span>{accountName.account_name} </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Account Type:</strong>{" "}
                  <span>
                    {accountName?.account_list_base_sub?.subject_type}{" "}
                  </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Currency:</strong>{" "}
                  <span>{accountName?.currency?.currency_name} </span>
                </span>
              </div>
              <br />
              <h5>Account Balance</h5>
              <div
                className="card p-2 mt-2 shadow-sm d-flex align-items-center justify-content-center"
                style={{ height: "8rem" }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "2rem",
                    color: "#4b49ac",
                  }}
                >
                  {/* {`${(transaction[0]?.balance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: accountName?.currency?.currency_name || "PHP",
                  })}`} */}
                  {accountName?.amount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: accountName?.currency?.currency_name || "PHP",
                  })}
                </span>
              </div>
              <br />
              {accountName?.account_list_base_sub?.module_type !==
              "Liabilities Account" ? (
                <div
                  className="card p-2 mt-2 text-start shadow-sm"
                  style={{ height: "8rem" }}
                >
                  <div className="w-100 h-100 d-flex flex-column justify-content-around align-items-center">
                    {/* {accountName?.account_list_base_sub?.module_type ===
                    "Owner's Equity Account" && (
                    <button
                      className="btn btn-outline-success px-5 w-75"
                      onClick={handleShow}
                    >
                      <i className="fas fa-plus"></i> Other Income
                    </button>
                  )} */}

                    <button
                      className="btn btn-warning px-5 w-75"
                      onClick={() => handleShow2("Normal")}
                    >
                      <i className="fas fa-paper-plane"></i> Transfer Money
                    </button>

                    {fromAccList ? (
                      <>
                        <button
                          className="btn btn-warning px-5 w-75"
                          onClick={() => handleShow2("Other")}
                        >
                          <i className="fas fa-paper-plane"></i> Transfer Money
                          to Other Currency
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-column justify-content-around align-items-center">
                    <button
                      className="btn btn-warning w-75"
                      onClick={handleShowPayModal}
                    >
                      <i className="fas fa-paper-plane"></i> PAY
                    </button>
                  </div>
                </>
              )}

              <br />
            </div>
          </div>
          <div className="col-12 col-md-8">
            <div className="balance-chart w-100">
              <Card>
                <Card.Body>
                  <Card.Title>Balance</Card.Title>
                  <Line options={chartOptions} data={chartData} />
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <div className="w-100 d-flex align-items-center my-4">
        <span>Transaction History</span>
        <hr className="flex-grow-1 mx-3" />
      </div>

      <div className="w-100">
        <div className="row">
          <div className="col-sm">
            <div className="row">
              <div className="col-sm mb-2">
                <span>From</span>
                {/* <input
                  type="date"
                  className="form-control p-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                /> */}
                {/* <div className="position-relative">
                  <DatePicker
                    selected={fromDate}
                    dateFormat="MMM/dd/yyyy"
                    onChange={(date) => {
                      setFromDate(date);
                    }}
                    className="form-control p-2"
                    customInput={<CustomInput />}
                  />
                  <i
                    class="fa-solid fa-calendar-week calendar-position"
                    style={{
                      right: "1rem",
                      top: "0.8rem",
                    }}
                  ></i>
                </div> */}
                <CustomDatePicker
                  selected={fromDate ? new Date(fromDate) : ""}
                  handleDateChange={(date) => {
                    setFromDate(date);
                  }}
                  setter={setFromDate}
                  CustomInput={CustomInput}
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                {/* <input
                  type="date"
                  className="form-control p-2"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                /> */}
                {/* <div className="position-relative">
                  <DatePicker
                    selected={toDate}
                    dateFormat="MMM/dd/yyyy"
                    onChange={(date) => {
                      setToDate(date);
                    }}
                    className="form-control p-2"
                    customInput={<CustomInput />}
                  />
                  <i
                    class="fa-solid fa-calendar-week calendar-position"
                    style={{
                      right: "1rem",
                      top: "0.8rem",
                    }}
                  ></i>
                </div> */}
                <CustomDatePicker
                  selected={toDate ? new Date(toDate) : ""}
                  handleDateChange={(date) => {
                    setToDate(date);
                  }}
                  setter={setToDate}
                  CustomInput={CustomInput}
                />
              </div>
            </div>
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
            <button className="btn w-100" onClick={applyFilter}>
              Apply Filter
            </button>
            <button className="btn btn-secondary w-100" onClick={clearFilter}>
              Clear Filter
            </button>
          </div>
          <div className="col-sm"></div>
        </div>
        <div className="w-100 overflow-y-scroll" style={{ maxHeight: "90vh" }}>
          <table className="w-100 table-bordered border-top-none bg-white text-sm">
            {/* Header section */}
            <thead
              className={`sticky-thead ${
                filteredTransactions?.length > 0 && "border-bottom-none"
              }`}
            >
              {/* Main category headers */}
              <tr>
                <th
                  className="p-3 text-left bg-gray-100 border-b-2 border-gray-300 z-3"
                  rowSpan="2"
                  onClick={() => handleSortData("date")}
                >
                  <div className="d-flex flex-row p-0 align-items-center">
                    Date
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "date" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 10 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "date" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 10 }}
                      ></i>
                    </span>
                  </div>
                </th>

                {/* Withdraw section with gradient background */}
                <th className="text-center border-bottom-none" colSpan="4">
                  <div className="p-3 font-bold text-amber-800">Withdraw</div>
                </th>

                {/* Deposit section with gradient background */}
                <th
                  className="text-center bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-gray-300 border-bottom-none"
                  colSpan="4"
                >
                  <div className="p-3 font-bold text-blue-800">Deposit</div>
                </th>

                <th
                  className="p-3 text-center bg-gray-100 border-b-2 border-gray-300"
                  rowSpan="2"
                >
                  Balance
                </th>
              </tr>

              {/* Subheader row */}
              <tr>
                {/* Withdraw columns */}
                <th className="p-3 text-left font-medium text-amber-700 bg-amber-50 border-b-2 border-amber-200 box-shadow-top">
                  Payment Method
                </th>
                <th className="p-3 text-left font-medium text-amber-700 bg-amber-50 border-b-2 border-amber-200 box-shadow-top">
                  To
                </th>
                <th className="p-3 text-left font-medium text-amber-700 bg-amber-50 border-b-2 border-amber-200 box-shadow-top">
                  Check No.
                </th>
                <th className="p-3 text-right font-medium text-amber-700 bg-amber-50 border-b-2 border-amber-200 box-shadow-top">
                  Amount
                </th>

                {/* Deposit columns */}
                <th className="p-3 text-left font-medium text-blue-700 bg-blue-50 border-b-2 border-blue-200 box-shadow-top">
                  Payment Method
                </th>
                <th className="p-3 text-left font-medium text-blue-700 bg-blue-50 border-b-2 border-blue-200 box-shadow-top">
                  From
                </th>
                <th className="p-3 text-left font-medium text-blue-700 bg-blue-50 border-b-2 border-blue-200 box-shadow-top">
                  Check No.
                </th>
                <th className="p-3 text-right font-medium text-blue-700 bg-blue-50 border-b-2 border-blue-200 box-shadow-top">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((transaction, index) => {
                // Calculate the balance
                const debitAmount = transaction.debit
                  ? parseFloat(transaction.debit.amount)
                  : 0;
                const creditAmount = transaction.credit
                  ? parseFloat(transaction.credit.amount)
                  : 0;
                const cumulativeBalance =
                  transaction.balance ?? debitAmount - creditAmount;

                // Alternate row styling
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={index}
                    className={`${
                      isEven ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    {/* Date column with special styling */}
                    <td className="p-3 border-b">
                      <div className="font-medium text-gray-800">
                        {format(transaction.date, "MMM/dd/yyyy")}
                      </div>
                    </td>

                    {/* Withdraw section */}
                    <td
                      className={`p-3 border-b ${
                        transaction.credit ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {transaction.credit ? (
                        <div className="text-gray-700">
                          {transaction.credit.payment_method}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b ${
                        transaction.credit ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {transaction.credit && transaction.credit.sub3_tos ? (
                        <div className="text-gray-700">
                          {transaction.credit.sub3_tos.account_name}
                        </div>
                      ) : transaction.credit &&
                        transaction.credit.sub3_tos === null ? (
                        <div className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full inline-block">
                          {`(${transaction.credit.module_from}) ${transaction.credit.transaction_number}`}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b ${
                        transaction.credit ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {transaction.credit ? (
                        <div className="text-gray-700">
                          {transaction.credit.check_or_remarks}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b text-right ${
                        transaction.credit ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {transaction.credit ? (
                        <div className="font-medium text-amber-700">
                          {transaction.credit.amount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    {/* Deposit section */}
                    <td
                      className={`p-3 border-b ${
                        transaction.debit ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {transaction.debit ? (
                        <div className="text-gray-700">
                          {transaction.debit.payment_method}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b ${
                        transaction.debit ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {transaction.debit && transaction.debit.sub3_tos ? (
                        <div className="text-gray-700">
                          {transaction.debit.sub3_tos.account_name}
                        </div>
                      ) : transaction.debit &&
                        transaction.debit.sub3_tos === null ? (
                        <div className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full inline-block">
                          {`(${transaction.debit.module_from}) ${transaction.debit.transaction_number}`}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b ${
                        transaction.debit ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {transaction.debit ? (
                        <div className="text-gray-700">
                          {transaction.debit.check_or_remarks}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td
                      className={`p-3 border-b text-right ${
                        transaction.debit ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {transaction.debit ? (
                        <div className="font-medium text-blue-700">
                          {transaction.debit.amount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ) : (
                        "---"
                      )}
                    </td>

                    {/* Balance column */}
                    <td
                      className={
                        creditAmount > 0
                          ? "text-danger p-3 border-b text-right"
                          : "text-primary p-3 border-b text-right"
                      }
                    >
                      <div
                        className={`font-medium ${
                          cumulativeBalance < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {cumulativeBalance?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                          style: "currency",
                          currency:
                            accountName?.currency?.currency_name || "PHP",
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationControls {...pagination} />
      </div>

      {/* In */}

      <Modal show={showModal} onHide={handleClose} backdrop="static" size="md">
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleOtherIncomeSubmit(e)}
        >
          <Modal.Header className="border-0">
            <Modal.Title>Other Income</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="w-100">
              <div className="row">
                <div className="col-sm">
                  <span>Date</span>
                  <input
                    type="date"
                    required
                    className="form-control"
                    onChange={(e) => setDateOtherIncome(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-sm">
                  <span>Description: </span>
                  <textarea
                    type="text"
                    required
                    className="form-control "
                    onChange={(e) => setDescriptionOtherIncome(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-sm">
                  <span>Amount: </span>
                  <input
                    type="text"
                    className="form-control "
                    required
                    onInput={onInputFloat}
                    onChange={(e) => setAmountOtherIncome(e.target.value)}
                  />
                </div>
              </div>
            </div>
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

      <Modal show={showModal2} onHide={handleClose} backdrop="static" size="md">
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleFormSubmit(e, "Credit")}
        >
          <Modal.Header closeButton>
            <Modal.Title className="text-primary">
              <strong>Payment Confirmation (Credit)</strong>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="container-fluid">
              {otherCurrency ? (
                <>
                  <div className="mb-3">
                    <label htmlFor="amount" className="fw-semibold">
                      Currency
                    </label>
                    {/* <select
                      className="form-select"
                      required
                      onChange={handleCurrencyChange}
                      // disabled={isSelectedCurrencyDisabled}
                    >
                      <option value="" disabled selected>
                        Select Currency
                      </option>
                      {currencyList
                        .filter(
                          (option) => option.id != accountName?.currency?.id
                        )
                        .map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.currency_name}
                          </option>
                        ))}
                    </select> */}
                    <Select
                      options={currencyOptions}
                      value={selectedCurrency}
                      onChange={handleCurrencyChange}
                      placeholder={`Select Currency`}
                      styles={selectCustomStyles(selectedCurrency, validated)}
                      required
                      isSearchable
                    />
                  </div>
                </>
              ) : null}

              {accountName?.account_list_base_sub?.module_type !==
              "Liabilities Account" ? null : (
                <>
                  <Form.Group className="mb-3" controlId="payWith">
                    <Form.Label className="fw-bold">Pay With:</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="bank"
                        label="Bank"
                        value="Bank"
                        // checked={selectedPayment === "Bank"}
                        // onChange={handlePaymentMethod}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="cash"
                        label="Cash"
                        value="Cash"
                        // checked={selectedPayment === "Cash"}
                        // onChange={handlePaymentMethod}
                        className="me-3"
                      />
                    </div>
                  </Form.Group>
                </>
              )}

              <div className="mb-3">
                <label htmlFor="subject1" className="fw-semibold">
                  Subject 1
                </label>
                {/* <select
                  className="form-select"
                  onChange={handleSubject1Change}
                  value={subject1}
                  required
                  disabled={isSubject1Disabled && otherCurrency}
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
                </select> */}
                <Select
                  options={subject1Options()}
                  value={subject1}
                  onChange={handleSubject1Change}
                  isDisabled={isSubject1Disabled && otherCurrency}
                  placeholder={`Select Subject 1`}
                  styles={selectCustomStyles(subject1, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3 is-invalid">
                <label htmlFor="subject2" className="fw-semibold">
                  Subject 2
                </label>
                {/* <select
                  className="form-select"
                  onChange={(e) =>
                    handleSubject2Change(
                      e,
                      e.target.options[e.target.selectedIndex].getAttribute(
                        "data-subject-type"
                      )
                    )
                  }
                  value={subject2}
                  disabled={isSubject2Disabled}
                  required
                >
                  <option value="" selected disabled>
                    Select Subject 2
                  </option>
                  {subject2DataList.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      data-subject-type={option.subject_type}
                    >
                      {option.subject_name}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={subject2Options}
                  value={subject2}
                  onChange={handleSubject2Change}
                  isDisabled={isSubject2Disabled}
                  placeholder={`Select Subject 2`}
                  styles={selectCustomStyles(subject2, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3">
                <label htmlFor="subject3" className="fw-semibold">
                  Subject 3
                </label>
                {/* <select
                  className="form-select"
                  onChange={handleSubject3Change}
                  value={subject3}
                  disabled={isSubject3Disabled}
                  required
                >
                  <option value="" selected disabled>
                    Select Subject 3
                  </option>
                  {subject3DataList
                    .filter(
                      (option) =>
                        otherCurrency ||
                        option.currency.id === accountName?.currency?.id
                    )
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.account_name}
                      </option>
                    ))}
                </select> */}
                <Select
                  options={subject3Options}
                  value={subject3}
                  onChange={handleSubject3Change}
                  isDisabled={isSubject3Disabled}
                  placeholder={`Select Subject 3`}
                  styles={selectCustomStyles(subject3, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3">
                <label htmlFor="payment-method" className="fw-semibold">
                  Payment Method
                </label>
                {/* <select
                  className="form-select"
                  onChange={handlePaymentMethodChange}
                  value={paymentMethod}
                  disabled={isPaymentMethodDisabled}
                  required
                >
                  <option value="" selected disabled>
                    Select Payment Method
                  </option>
                  {subject2Type === "Cash" ? (
                    <option value="Cash">Cash</option>
                  ) : (
                    <option value="Bank">Bank</option>
                  )}
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>

                  <option value="Online">Online</option>
                </select> */}
                <Select
                  options={paymentMethodOptions}
                  value={paymentMethod}
                  onChange={handlePaymentMethodChange}
                  isDisabled={isPaymentMethodDisabled}
                  placeholder={`Select Payment Method`}
                  styles={selectCustomStyles(paymentMethod, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3">
                <label htmlFor="payment-method" className="fw-semibold">
                  {paymentMethod === "Bank" ? "Check No." : "Remarks"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={checkNo}
                  disabled={isRemarksDisabled}
                  onChange={(e) => setCheckNo(e.target.value)}
                  maxLength={paymentMethod === "Bank" && 15}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="date" className="fw-semibold">
                  Date
                </label>
                {/* <input
                  type="date"
                  className="form-control"
                  disabled={isRemarksDisabled}
                  required
                  onChange={(e) => setDate(e.target.value)}
                /> */}
                {/* <div className="position-relative">
                  <DatePicker
                    selected={date}
                    dateFormat="MMM/dd/yyyy"
                    onChange={(date) => {
                      setDate(date);
                    }}
                    className="form-control p-2"
                    customInput={
                      <CustomInput isRemarksDisabled={isRemarksDisabled} />
                    }
                  />
                  <i
                    class="fa-solid fa-calendar-week calendar-position"
                    style={{
                      right: `${
                        validated && !isRemarksDisabled ? "2rem" : "1rem"
                      }`,
                      top: "0.8rem",
                    }}
                  ></i>
                </div> */}
                <CustomDatePicker
                  selected={date ? new Date(date) : ""}
                  handleDateChange={(date) => {
                    setDate(date);
                  }}
                  setter={setDate}
                  validated={validated}
                  isRequired={true}
                  disabled={isRemarksDisabled}
                  CustomInput={CustomInput}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="amount" className="fw-semibold">
                  Amount{" "}
                  {otherCurrency ? (
                    <>(In {accountName.currency.currency_name})</>
                  ) : null}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="0.00"
                  disabled={isRemarksDisabled}
                  required
                  onInput={onInputFloat}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>

              {otherCurrency ? (
                <>
                  <div className="row">
                    {" "}
                    {/* currency rate nung pumasok ang pera  */}
                    {accountName?.currency?.currency_name !== "PHP" && (
                      <div className="col-sm mb-3">
                        <label htmlFor="amount" className="fw-semibold">
                          Received Rate
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="0.00"
                          disabled={isRemarksDisabled}
                          required
                          onInput={onInputFloat}
                          value={receivedCurrencyRate}
                          onChange={(e) =>
                            setReceivedCurrencyRate(e.target.value)
                          }
                        />
                      </div>
                    )}
                    <div className="col-sm mb-3">
                      <label htmlFor="amount" className="fw-semibold">
                        {" "}
                        {/* currency rate sa pag convert  */}
                        Exchange Rate
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0.00"
                        disabled={isRemarksDisabled}
                        required
                        onInput={onInputFloat}
                        value={currencyRate}
                        onChange={(e) => setCurrencyRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="w-100 d-flex align-items-center">
                    <span>Indicative Exchange Rate</span>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="w-100 mb-2 p-2">
                    <div className="fs-5 fw-bold">
                      {accountName.currency.currency_name === "PHP"
                        ? "1"
                        : currencyRate}{" "}
                      {selectedCurrencyName} ={" "}
                      {accountName.currency.currency_name === "PHP"
                        ? currencyRate
                        : "1"}{" "}
                      {accountName.currency.currency_name}{" "}
                    </div>
                  </div>
                  <div className="w-100 d-flex align-items-center">
                    <span>Total Calculated Amount to Send</span>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="w-100 mb-2 p-2">
                    <div className="fs-5 fw-bold">
                      {parseFloat(String(amount).replace(/,/g, "")) > 0 ? (
                        <>
                          {handleCalculateConversion(
                            currencyRate,
                            parseFloat(String(amount).replace(/,/g, ""))
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {selectedCurrencyName}
                        </>
                      ) : (
                        <>0.00 {selectedCurrencyName}</>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* <Table bordered>
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
                      onChange={(e) =>
                        handleSubject2Change(
                          e,
                          e.target.options[e.target.selectedIndex].getAttribute(
                            "data-subject-type"
                          )
                        )
                      }
                      value={subject2}
                      disabled={isSubject2Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 2
                      </option>
                      {subject2DataList.map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                          data-subject-type={option.subject_type}
                        >
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
                      {subject3DataList
                        .filter(
                          (option) =>
                            option.currency.id === accountName?.currency?.id
                        )
                        .map((option) => (
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
                      {subject2Type === "Cash" ? (
                        <option value="Cash">Cash</option>
                      ) : (
                        <option value="Bank">Bank</option>
                      )}

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
                  Amount
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0.00"
                      disabled={isRemarksDisabled}
                      required
                      onInput={onInputFloat}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </Table> */}
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

      {/* For Pay Modal  */}
      <Modal
        show={payModal}
        onHide={() => setPayModal(false)}
        backdrop="static"
        size="md"
      >
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handlePayLiability(e)}
        >
          <Modal.Header closeButton>
            <Modal.Title className="text-primary">
              <strong>Payment Confirmation (Credit)</strong>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="container-fluid">
              <Form.Group className="mb-3" controlId="payWith">
                <Form.Label className="fw-bold">Pay With:</Form.Label>
                <div className="d-flex">
                  <Form.Check
                    type="radio"
                    name="paymentType"
                    id="bank"
                    label="Bank"
                    value="Bank"
                    checked={selectedPaymentPay === "Bank"}
                    onChange={handlePaymentMethod}
                    className="me-3"
                  />
                  <Form.Check
                    type="radio"
                    name="paymentType"
                    id="cash"
                    label="Cash"
                    value="Cash"
                    checked={selectedPaymentPay === "Cash"}
                    onChange={handlePaymentMethod}
                    className="me-3"
                  />
                </div>
              </Form.Group>

              <div className="mb-3">
                <label htmlFor="subject1" className="fw-semibold">
                  Subject 1
                </label>
                {/* <select
                  className="form-select"
                  onChange={handleSubject1Change}
                  value={subject1}
                  required
                  disabled={isSubject1Disabled && otherCurrency}
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
                </select> */}
                <Select
                  options={subject1Options("Liabilities Account")}
                  value={subject1}
                  onChange={handleSubject1Change}
                  isDisabled={isSubject1Disabled && otherCurrency}
                  placeholder={`Select Subject 1`}
                  styles={selectCustomStyles(subject1, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3">
                <label htmlFor="subject2" className="fw-semibold">
                  Subject 2
                </label>
                {/* <select
                  className="form-select"
                  onChange={(e) =>
                    handleSubject2Change(
                      e,
                      e.target.options[e.target.selectedIndex].getAttribute(
                        "data-subject-type"
                      )
                    )
                  }
                  value={subject2}
                  disabled={isSubject2Disabled}
                  required
                >
                  <option value="" selected disabled>
                    Select Subject 2
                  </option>
                  {subject2DataList.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      data-subject-type={option.subject_type}
                    >
                      {option.subject_name}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={subject2Options}
                  value={subject2}
                  onChange={handleSubject2Change}
                  isDisabled={isSubject2Disabled}
                  placeholder={`Select Subject 2`}
                  styles={selectCustomStyles(subject2, validated)}
                  required
                  isSearchable
                />
              </div>

              <div className="mb-3">
                <label htmlFor="subject3" className="fw-semibold">
                  Subject 3
                </label>
                {/* <select
                  className="form-select"
                  onChange={handleSubject3Change}
                  value={subject3}
                  disabled={isSubject3Disabled}
                  required
                >
                  <option value="" selected disabled>
                    Select Subject 3
                  </option>
                  {subject3DataList
                    .filter(
                      (option) =>
                        otherCurrency ||
                        option.currency.id === accountName?.currency?.id
                    )
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.account_name}
                      </option>
                    ))}
                </select> */}
                <Select
                  options={subject3Options}
                  value={subject3}
                  onChange={handleSubject3Change}
                  isDisabled={isSubject3Disabled}
                  placeholder={`Select Subject 3`}
                  styles={selectCustomStyles(subject3, validated)}
                  required
                  isSearchable
                />
              </div>

              {/* <div className="mb-3">
                <label htmlFor="payment-method" className="fw-semibold">
                  Payment Method
                </label>
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
                  {subject2Type === "Cash" ? (
                    <option value="Cash">Cash</option>
                  ) : (gfvvvvvvv 
                    <option value="Bank">Bank</option>
                  )}

                  <option value="Online">Online</option>
                </select>
              </div> */}

              <div className="mb-3">
                <label htmlFor="payment-method" className="fw-semibold">
                  {selectedPaymentPay === "Bank" ? "Check No." : "Remarks"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={checkNo}
                  disabled={isRemarksDisabled}
                  onChange={(e) => setCheckNo(e.target.value)}
                  maxLength={selectedPaymentPay === "Bank" && 15}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="date" className="fw-semibold">
                  Date
                </label>
                {/* <input
                  type="date"
                  className="form-control"
                  disabled={isRemarksDisabled}
                  required
                  onChange={(e) => setDate(e.target.value)}
                /> */}
                {/* <div className="position-relative">
                  <DatePicker
                    selected={date}
                    dateFormat="MMM/dd/yyyy"
                    onChange={(date) => {
                      setDate(date);
                    }}
                    className="form-control p-2"
                    customInput={
                      <CustomInput isRemarksDisabled={isRemarksDisabled} />
                    }
                  />
                  <i
                    class="fa-solid fa-calendar-week calendar-position"
                    style={{
                      right: `${
                        validated && !isRemarksDisabled ? "2rem" : "1rem"
                      }`,
                      top: "0.8rem",
                    }}
                  ></i>
                </div> */}
                <CustomDatePicker
                  selected={date ? new Date(date) : ""}
                  handleDateChange={(date) => {
                    setDate(date);
                  }}
                  setter={setDate}
                  validated={validated}
                  isRequired={true}
                  disabled={isRemarksDisabled}
                  CustomInput={CustomInput}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="amount" className="fw-semibold">
                  Amount
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="0.00"
                  disabled={isRemarksDisabled}
                  required
                  onInput={onInputFloat}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => setPayModal(false)}
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

export default ViewAccountlist1;
