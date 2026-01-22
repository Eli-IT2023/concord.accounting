import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import swal from "sweetalert";
import { customStyles } from "../../../assets/table-style";
import DataTable from "react-data-table-component";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  PaginationControls,
  usePagination,
} from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
import { truncateToTwoDecimals } from "../../../utils/numberFormatter";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { usePostedCutoffValidation } from "../../../hooks/customHook/usePostedCutoffValidation";

const BulkPayable = () => {
  const navigate = useNavigate();
  const { module } = useParams();
  const location = useLocation();
  const prevSubject1 = useRef("");
  const { dateValidation } = useDateValidation();
  const { postedCutoffValidation } = usePostedCutoffValidation();
  const [transactionNumber, setTransactionNumber] = useState("");
  const [vendorMap, setVendorMap] = useState([]);
  const [availablePayables, setAvailablePayables] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [payableDate, setPayableDate] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [allPayable, setAllPayable] = useState([]);
  const [payableList, setPayableList] = useState([
    // {
    //   id: "",
    //   transactionId: "",
    //   invoiceDate: "",
    //   dueDate: "",
    //   amount: "",
    //   discount: "",
    //   totalAmount: "",
    // },
  ]);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [allCurrency, setAllCurrency] = useState([]);
  const [currencyRate, setCurrencyRate] = useState(1);

  const [currency, setCurrency] = useState("");
  const [isAmountDisabled, setIsAmountDisabled] = useState(true);

  //For modal New Item
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
  };
  const [selectedRow, setSelectedRow] = useState([]);
  const [selectedRowTransactions, setSelectedRowTransactions] = useState([]);

  const userLoggedID = useDecodeToken(); // For token
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [paginationUrl, setPaginationUrl] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [editPaymentList, setEditPaymentList] = useState({});

  const currencyName = allCurrency.find(
    (item) => item.id === currency
  )?.currency_name;

  const removeComma = (num) => {
    return parseFloat(String(num).replace(/,/g, ""));
  };

  const deletePayment = (item, index) => {
    setFloatPayment((prev) => {
      return prev.filter((_, i) => {
        return index !== i;
      });
    });

    const totalOrderListAmount = payableList.reduce((acc, value) => {
      return acc + value.totalAmount;
    }, 0);

    const totalPaymentListAmount = floatPayment
      .filter((_, i) => index !== i)
      .reduce((acc, value) => {
        return acc + value.amountInputted;
      }, 0);

    if (item.amountInputted > totalOrderListAmount) {
      const payableBalance = totalOrderListAmount - totalPaymentListAmount;
      if (payableBalance < 0) {
        setTotalAmountSum(0);
      } else {
        setTotalAmountSum(totalOrderListAmount - totalPaymentListAmount);
      }
    } else {
      setTotalAmountSum((prev) => {
        return prev + item.amountInputted;
      });
    }
  };

  const submitModal = () => {
    // setAvailablePayables((prev) => {
    //   return prev.filter((item) => !mergedData.includes(item.id));
    // });

    const mergedData = [
      ...new Set([...selectedRow, ...selectedRowTransactions]),
    ];

    fetchPayableList(
      selectedVendorId?.value,
      module,
      searchTerm,
      filterColumn,
      payableList,
      currency,
      mergedData
    );

    setSelectedRowTransactions(mergedData);

    // setSelectedRow([]);
    setFilterColumn("all");
    setSearchTerm("");
    pagination.setCurrentPage(1);
    setShow(false);
  };

  const handleIndividualCheckBoxChange = (id) => {
    if (selectedRow.includes(id)) {
      setSelectedRow((prev) => {
        return prev.filter((item) => id !== item);
      });
    } else {
      setSelectedRow((prev) => {
        return [...prev, id];
      });
    }
  };

  const handleAllCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked == true) {
      setSelectedRow(availablePayables.map((item) => item.id));
    } else {
      setSelectedRow([]);
    }
  };

  const modalColumn = [
    {
      name: (
        <input type="checkbox" onChange={(e) => handleAllCheckboxChange(e)} />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRow.includes(row.id)}
          onChange={() => handleIndividualCheckBoxChange(row.id)}
        />
      ),
    },
    {
      name: "Transaction ID",
      selector: (row) => (
        <>
          <span className="d-none">{row.transaction_id}</span>
          <span>{row.client_transaction_id}</span>
        </>
      ),
    },
    {
      name: "Remarks",
      selector: (row) => row.description || "n/a",
    },
    {
      name: "Purchase Date",
      selector: (row) =>
        `${row.purchaseDate ? format(row.purchaseDate, "MMM/dd/yyyy") : ""}`,
    },
    {
      name: "Due Date",
      selector: (row) =>
        `${row.due_date ? format(row.due_date, "MMM/dd/yyyy") : ""}`,
    },
    //commented kasi ang amount na total price is nasa table na
    // {
    //   name: "Amount",
    //   // selector: (row) =>
    //   //   // `${
    //   //   //   row.payable_products &&
    //   //   //   row.payable_products[0] &&
    //   //   //   row.payable_products[0].product_tag_vendor
    //   //   //     ? row.payable_products[0].product_tag_vendor.product_price
    //   //   //     : ""
    //   //   // }`,
    //   //   row.totalPrice.toLocaleString("en-US", {
    //   //     maximumFractionDigits: 2,
    //   //     minimumFractionDigits: 2,
    //   //   }),
    //   cell: (row) => {
    //     let unitPrice = 0;
    //     // row.payable_products.forEach((data) => {
    //     //   unitPrice += data.product_tag_vendor.product_price * data.weight;
    //     // });
    //     row.payable_products.forEach((data) => {
    //       unitPrice += data.unitPrice * data.weight;
    //     });

    //     const moisture = row.payable_products.reduce((acc, data) => {
    //       if (data.moisture_type === "%") {
    //         return (
    //           acc +
    //           parseFloat(
    //             (data.moisture / 100) * data.unitPrice * data.weight || 0
    //           )
    //         );
    //       } else {
    //         return acc + parseFloat(data.moisture || 0);
    //       }
    //     }, 0);

    //     const totalOtherFees = row.payable_other_fees.reduce(
    //       (acc, data) => acc + parseFloat(data.fee_amount || 0),
    //       0
    //     );

    //     const calculateDiscount =
    //       row.isPercent_Discount === true
    //         ? (row.discount_value / 100) *
    //           parseFloat(
    //             unitPrice - moisture - row.weighing_fee - totalOtherFees
    //           )
    //         : row.discount_value;

    //     return (
    //       <span className="text-center">
    //         {row.currency?.currency_name}{" "}
    //         {(
    //           unitPrice -
    //           moisture -
    //           row.weighing_fee -
    //           totalOtherFees -
    //           calculateDiscount
    //         ).toLocaleString("en-US", {
    //           minimumFractionDigits: 2,
    //           maximumFractionDigits: 2,
    //         })}
    //       </span>
    //     );
    //   },
    // },
    {
      name: "Amount",
      selector: (row) => `${row.totalPrice.toLocaleString("en-US")}`,
    },
    {
      name: "Discount",
      selector: (row) => `${row.discount_value}`,
    },
  ];

  const addNewItem = () => {
    if (currency === "" || selectedVendorId == null) {
      swal({
        title: "Missing Field",
        text: "Please select vendor and currency first",
        icon: "error",
      });

      return;
    }

    const selectedTransactionIds = payableList.map(
      (item) => item.transactionId
    );

    fetchPayableList(
      selectedVendorId?.value,
      module,
      searchTerm,
      filterColumn,
      payableList,
      currency,
      selectedRowTransactions
    );

    // // Filter payables based on currency and selected transactions
    // const filteredPayables = allPayable?.filter(
    //   (payable) =>
    //     !selectedTransactionIds.includes(payable.transaction_id) &&
    //     payable.currencyId == currency
    // );

    // // Update available payments
    // setAvailablePayables(filteredPayables);

    setShow(true);

    // handleShow();
    // setPayableList([
    //   ...payableList,
    //   {
    //     id: "",
    //     transactionId: "",
    //     invoiceDate: "",
    //     dueDate: "",
    //     amount: "",
    //     discount: "",
    //     totalAmount: "",z
    //     newItemList: true,
    //   },
    // ]);
  };

  const deleteItem = (item, index) => {
    // if (payableList.length === 1) {
    //   // Prevent deleting the last row if there's only one row
    //   return;
    // }
    // const updatedItems = [...payableList];
    // updatedItems.splice(index, 1);
    // setPayableList(updatedItems);

    setAvailablePayables((prev) => {
      return [...prev, item];
    });

    setPayableList((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((itemRow) => itemRow !== item.id);
    });

    setSelectedRowTransactions((prev) => {
      return prev.filter((itemRow) => itemRow !== item.id);
    });
  };

  useEffect(() => {
    const foreign = module.charAt(0).toUpperCase() + module.slice(1);
    axios
      .get(BASE_URL + "/vendors/payable-vendor", {
        params: {
          foreign,
        },
      })
      .then((response) => {
        const mappedVendors = response.data.map((data) => ({
          value: data.id,
          label: data.company_name || `${data.fname} ${data.lname}`,
        }));
        setVendorMap(mappedVendors);
        // setSelectedTransactionId(mappedVendors[0]?.value || null);
      })
      .catch((error) => {
        console.error("Error fetching vendor:", error);
      });
  }, []);

  const pagination = useServerPagination("null", 10);

  const paginationHook = usePagination(availablePayables, 10);

  const fetchPayableList = (
    vendorId,
    module,
    searchTerm,
    filterColumn,
    payableList,
    currency,
    selectedTransactions = []
  ) => {
    // setPaginationUrl(
    //   `${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}/?module=${module}`
    // );

    pagination.updateApiUrl(`${BASE_URL}/payable/getInfobyVendor`);
    pagination.updateParams({
      id: vendorId,
      module: module,
      searchText: searchTerm,
      filterColumn,
      payableList: payableList.map((item) => item.id),
      currency,
      selectedTransactions,
    });
    // setSelectedVendorId(vendorId);
    // axios
    //   .get(
    //     // `${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}/?module=${module}`
    //     `${BASE_URL}/payable/getInfobyVendor`,
    //     {
    //       params: {
    //         id: vendorId,
    //         module: module,
    //         searchText: searchTerm,
    //         filterColumn,
    //         payableList,
    //         currency,
    //       },
    //     }
    //   )
    //   .then((res) => {
    //     // setAvailablePayables(res.data);

    //     setAllPayable(
    //       res.data.map((item) => {
    //         return {
    //           ...item,
    //         };
    //       })
    //     );

    //     setAvailablePayables(
    //       res.data.map((item) => {
    //         return {
    //           ...item,
    //         };
    //       })
    //     );

    //     setSelectedVendorId(vendorId);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching payables:", error);
    //   });
  };

  useEffect(() => {
    fetchPayableList(
      selectedVendorId?.value,
      module,
      searchTerm,
      filterColumn,
      payableList,
      currency,
      selectedRowTransactions
    );
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  const handleVendorChange = async (selectedOption) => {
    const vendorId = selectedOption?.value;
    if (vendorId) {
      const res = await axios.get(`${BASE_URL}/vendors/fetchVendorCurrency`, {
        params: {
          vendorId: vendorId,
        },
      });

      // if (res.status === 200) {
      //   setCurrency(res.data.currency_id);
      // }

      // Clear the current payableList
      setPayableList([]);
      setBalance(0);
      setFloatPayment([]);
      setSelectedVendorId(selectedOption);
      fetchCurrency(vendorId);

      // fetchPayableList(
      //   selectedOption,
      //   module,
      //   searchTerm,
      //   filterColumn,
      //   payableList,
      //   currency || (res.data && res.data.currency_id)
      // );
    }
  };

  const handleTransactionChange = (index, transactionId) => {
    const selectedPayable = availablePayables.find(
      (payable) => payable.transaction_id === transactionId
    );

    if (selectedPayable) {
      console.log("*****selectedPayable:", selectedPayable); // Verify the structure here

      // Access product_price from payable_products if it exists
      const productPrice =
        selectedPayable.payable_products &&
        selectedPayable.payable_products[0] &&
        selectedPayable.payable_products[0].product_tag_vendor
          ? selectedPayable.payable_products[0].product_tag_vendor.product_price
          : "";

      const totalAmountPrice = selectedPayable.totalPrice;

      const updatedPayable = {
        id: selectedPayable.id,
        transactionId: selectedPayable.transaction_id,
        invoiceDate: selectedPayable.createdAt || "",
        purchaseDate: selectedPayable.purchaseDate || "",
        dueDate: selectedPayable.due_date || "",
        description: selectedPayable.description || "",
        amount: productPrice, // Set amount to product_price
        discount: selectedPayable.discount_value,
        totalAmount: totalAmountPrice,
      };

      const updatedPayableList = [...payableList];
      updatedPayableList[index] = updatedPayable;
      setPayableList(updatedPayableList);
    }
  };

  const generateFilteredOptions = (index) => {
    // List all transaction IDs except those already selected
    const selectedTransactionIds = payableList
      .filter((_, i) => i !== index)
      .map((item) => item.transactionId);

    return availablePayables.filter((payable) =>
      !currency && !selectedVendorId
        ? !selectedTransactionIds.includes(payable.transaction_id)
        : !selectedTransactionIds.includes(payable.transaction_id) &&
          payable.currencyId == currency
    );
  };

  useEffect(() => {
    generateTransactionNumber();
  }, []);

  const generateTransactionNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateToday = `${year}${month}`;

    const generateTwoNum = Math.floor(10 + Math.random() * 90);
    const time = new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .replace(/:/g, "");

    let lastTransaction = localStorage.getItem(`transaction-${dateToday}`);
    let newTransactionNumber = dateToday + time + generateTwoNum;

    // if (lastTransaction) {
    //   const lastNumber = parseInt(lastTransaction.slice(-4));
    //   const incrementedNumber = String(lastNumber + 1).padStart(4, "0");
    //   newTransactionNumber = `${dateToday}${incrementedNumber}`;
    // } else {
    //   newTransactionNumber = `${dateToday}0001`;
    // }

    localStorage.setItem(`transaction-${dateToday}`, newTransactionNumber);

    setTransactionNumber("AP" + newTransactionNumber);
  };

  //*************PAYMENT METHOD***************** */
  const [selectedPayment, setSelectedPayment] = useState("Bank");
  const [onlinePaymentCheckbox, setOnlinePaymentCheckbox] = useState(false);
  const [date, setDate] = useState("");
  const [validated, setValidated] = useState(false);

  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");

  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);

  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amountInputted, setAmountInputted] = useState("0"); //amount 'to sa payment method
  const [onlineWalletRemarks, setOnlineWalletRemarks] = useState("");
  const [totalPayment, setTotalPayment] = useState(0);

  const [floatPayment, setFloatPayment] = useState([]);

  const handlePaymentMethod = (e) => {
    const paymentMethod = e.target.value;
    setSelectedPayment(paymentMethod);
    setSubject1("");
    setSubject2("");
    setSubject3("");
  };

  const handleOnlineCheck = (e) => {
    setOnlinePaymentCheckbox(e.target.checked);
  };

  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
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

    const clearSubjects = () => {
      setSubject1("");
      setSubject2("");
      setSubject3("");
      setIsSubject2Disabled(true);
      setIsSubject3Disabled(true);
    };

    try {
      axios
        .get(`${BASE_URL}/payable/getSubject1LocalPayable`, {
          params: {
            account_selected: account_selected,
            selectedPayment,
            selected_currency_id: currency,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);
          setSubject2("");
          setSubject3("");
          setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
          setIsSubject3Disabled(true); // Reset and disable Subject 3

          setSubject2DataList(res.data);
        })
        .catch((error) => {
          if (error.response && error.response.status === 404) {
            swal({
              icon: "warning",
              title: "Warning",
              text: error.response.data.message,
            }).then(() => clearSubjects());
            return;
          }
          // Handle other errors
          throw error;
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

  const handleSubject2Change = (selectedOption) => {
    const selectedSubject2 = selectedOption;

    try {
      axios
        .get(`${BASE_URL}/payable/getSubject3LocalPayable`, {
          params: {
            subjectId: selectedSubject2?.value,
            totalAmountSum,
          },
        })
        .then((res) => {
          const subject3Currency = res.data.filter((item) => {
            return item.currency_id == currency;
          });
          setSubject3DataList(subject3Currency);
          setSubject2(selectedSubject2);
          setSubject3("");
          setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
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

  const handleAccountChange = (selectedOption) => {
    const selectedAccountId = selectedOption?.value;
    setSubject3(selectedOption);
    const selectedAccount = subject3DataList.find(
      (account) => String(account.id) === String(selectedAccountId)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    }
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleAmountValue = (value) => {
    // Amount validation to not exceed the balance
    if (
      value !== 0 &&
      parseFloat(value.replace(/,/g, "")) > totalAmountSum.toFixed(2)
    ) {
      swal({
        icon: "error",
        title: "Oppss!",
        text: "Please input not greater than the balance",
      }).then(() => {
        setAmountInputted("");
      });
    }

    if (value == ".") {
      setAmountInputted((prev) => prev + ".");
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

    // console.log("Formaat", formatInputValue);
    if (numericValue > totalAmountSum && date <= currentDate) {
      // Check if the input value is greater than the totalAmountSum
      swal({
        title: "Oppss!",
        text: "Please input not greater than the balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmountInputted("");
      });
    } else {
      setAmountInputted(formattedValue);

      // setAmountInputted((prev) => {
      //   return (prev =
      //     inputValue[inputValue.length - 1] == "."
      //       ? numericValue.toLocaleString()
      //       : inputValue);
      // });
    }
  };

  const handlePaymentListInputChange = (value, setState, index, key) => {
    setState((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };

      return updated;
    });
  };

  const handlePaymentListAmountChange = (value, setState, index, key) => {
    if (value === ".") {
      setState((prev) => {
        // Duplicate existing array
        const updated = [...prev];
        // Update item with specific index
        updated[index] = {
          ...updated[index],
          [key]: updated[index][key].includes(".")
            ? value
            : updated[index][key] + ".",
        };

        return updated;
      });
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

    setState((prev) => {
      // Duplicate the exisitng array
      const updated = [...prev];
      // Update item with specific index
      updated[index] = {
        ...updated[index],
        [key]: formattedValue,
      };

      return updated;
    });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    let formatAmountInputted = String(amountInputted).replace(/,/g, "");

    if (payableList.length == 0) {
      swal({
        icon: "error",
        title: "Oopps!",
        text: "Please ensure that there is at least one item in the order list before proceeding.",
        buttons: "OK",
      });
      return;
    }

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
        buttons: false,
        timer: 2000,
      });
    } else {
      try {
        const response = await axios.post(
          `${BASE_URL}/payable/validate-issued-date`,
          {
            issuedDate: date,
          }
        );
        if (response.data.isPosted) {
          swal({
            icon: "error",
            title: "Invalid Issued Date",
            text: "The issued date falls within a posted cutoff. Please select a different date.",
            buttons: false,
            timer: 2000,
          });
          return;
        }

        // Handle Zero amount validation
        if (amountInputted == 0) {
          swal({
            icon: "warning",
            title: "Warning: Invalid Amount",
            text: "The Amount must be greater than zero to proceed",
          });
          return;
        }

        swal({
          title: "Create this new payable?",
          text: "",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        }).then((confirmed) => {
          if (confirmed) {
            const newPayment = {
              paymentMethod: selectedPayment,
              subject1: subject1,
              subject2: subject2?.value,
              subject3: subject3?.value,
              accountName: accountName,
              amountInputted: parseFloat(formatAmountInputted),
              issuedDate: date,
              checkNumber: checkNumber,
              refNumber: refNumber,
              remarks: onlineWalletRemarks,
            };
            setFloatPayment((prevPayments) => {
              if (!prevPayments || prevPayments.length === 0) {
                return [...prevPayments, newPayment];
              } // Handle first payment in the list
              const existingPaymentIndex = prevPayments.findIndex((item) => {
                const { amountInputted: itemAmountInputted, ...itemRest } =
                  item; // Exclude amountInputted in previous payment list by destructuring

                const {
                  amountInputted: newPaymentAmountInputted, // Variable renaming
                  ...newPaymentRest
                } = newPayment; // Exclude amountInputted in newPayment by destructuring
                return (
                  JSON.stringify(itemRest) === JSON.stringify(newPaymentRest) // Compare two object then return the index
                );
              });
              if (existingPaymentIndex !== -1) {
                // If a match is found, update the existing payment
                return prevPayments.map((item, index) => {
                  if (index === existingPaymentIndex) {
                    return {
                      ...item,
                      amountInputted:
                        item.amountInputted + newPayment.amountInputted,
                    };
                  }
                  return item;
                });
              } else {
                // If no match is found, add the new payment to the array
                return [...prevPayments, newPayment];
              }
            });
            setTotalPayment(
              (prevTotal) => prevTotal + parseFloat(formatAmountInputted)
            );
            swal({
              icon: "success",
              title: "Payment Added",
              text: "The new payment has been added successfully",
              buttons: false,
              timer: 2000,
            }).then(() => {
              clearPaymentFields();
            });
            setTotalAmountSum((prev) => {
              return Math.max(
                0,
                parseFloat(prev) - parseFloat(formatAmountInputted)
              );
            });
          }
        });
      } catch (error) {
        console.error(error);
        swal({
          icon: "error",
          title: "Server Error",
          text: "Unable to validate the issued date. Please try again later.",
          buttons: false,
          timer: 2000,
        });
      }
    }
    setValidated(true);
  };

  const clearPaymentFields = () => {
    setValidated(false);
    setOnlinePaymentCheckbox(false);

    setRefNumber("");
    setOnlineWalletRemarks("");
    setAccountName("");
    setAmountInputted(0);
    setCheckNumber("");
    setRefNumber("");
    setDate("");
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
  };

  const handleSavePayment = async () => {
    if (!selectedVendorId || !payableDate) {
      swal({
        title: "Required Fields Missing",
        text: "Please ensure Vendor and Transaction Date are filled out.",
        icon: "error",
        buttons: false,
        timer: 3000,
      });
      return;
    }

    if (parseFloat(totalAmountSum.toFixed(2)) < 0) {
      swal({
        icon: "warning",
        title: "Warning",
        text: "Payable Balance cannot be less than zero. Please check your payment",
      });
      return;
    }

    dateValidation(payableDate, setPayableDate, "Transaction Date");

    // Validation: Prevent submission if no transactions have been added
    if (!payableList.length) {
      swal({
        icon: "warning",
        title: "No Transactions Added",
        text: "Please add at least one transaction to the order list before continuing.",
      });
      return;
    }

    const confirmed = await swal({
      title: "Create this new payable?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        // const payableToSubmit = [];

        // // additional payable
        // for (const payable of Object.values(payable.additional)) {
        //   payableToSubmit.push({
        //     subject1: payable.subject1,
        //     subject2: payable.subject2,
        //     subject3: payable.subject3,
        //     remarks: payable.remarks,
        //     amount: payable.amount,
        //     payment_method: payable.payment_method,
        //     type: "additional",
        //   });
        // }

        // // deduction payable
        // for (const payable of Object.values(payable.deduction)) {
        //   payableToSubmit.push({
        //     subject1: payable.subject1,
        //     subject2: payable.subject2,
        //     subject3: payable.subject3,
        //     remarks: payable.remarks,
        //     amount: payable.amount,
        //     payment_method: payable.payment_method,
        //     type: "deduction",
        //   });
        // }

        //Remove emptry strings data
        // const filteredData = payableList.filter(
        //   (item) => item.dueDate && item.dueDate.trim() !== ""
        // );

        const currentLocation = location.pathname.includes("bulk-payable/local")
          ? "Local"
          : "Overseas";

        const parsedFloatPayment = floatPayment.map((item) => {
          const convertedAmount = removeComma(item.amountInputted);
          return {
            ...item,
            amountInputted: convertedAmount,
          };
        });

        const res = await axios.post(`${BASE_URL}/payable/addPayment`, {
          // payableList: filteredData,
          payableList,
          transactionNumber,
          selectedVendorId: selectedVendorId?.value,
          currency,
          currencyRate,
          floatPayment: parsedFloatPayment,
          balance,
          payableDate,
          currentLocation,
          subject3,
          createdBy: userLoggedID,
          module,
        });

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Payable Payment has been added successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            // navigate(
            //   `/purchases/${
            //     module === "local" ? "local-purchase" : "overseas-purchase"
            //   }`
            // );
            navigate(`/purchases/local-purchase`);
          });
        } else if (res.status === 201) {
          swal({
            title: "Opppss!",
            text: "Transaction Date is already posted in Cutoff. Please use other date",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
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
    // setValidated(true);
  };

  const fetchCurrency = async (selectedVendorId) => {
    try {
      const foreign = module.charAt(0).toUpperCase() + module.slice(1);
      let res = await axios.get(`${BASE_URL}/currency/payable-currency`, {
        params: {
          foreign,
          selectedVendorId,
        },
      });

      if (res.data.length > 0) {
        const [firstItem] = res.data;
        setCurrency(firstItem.id);
        setCurrencyRate(firstItem.currency_rate);
      }
      setAllCurrency(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCurrencyChange = (e) => {
    const selectedCurrencyId = e.target.value;
    setCurrency(selectedCurrencyId);

    // Find the selected currency and set its rate
    const selectedCurrency = allCurrency.find(
      (curr) => curr.id === selectedCurrencyId
    );

    if (selectedCurrency) {
      setCurrencyRate(selectedCurrency.currency_rate);
    }

    setBalance(0);
    setFloatPayment([]);
  };

  console.log(currency, "currency======");

  // Balance Details Cash
  const cash = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Cash";
    })
    .reduce((total, value) => {
      return (
        total + parseFloat(String(value.amountInputted).replace(/,/g, "")) || 0
      );
    }, 0);

  // Balance Details Account
  const account = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Bank" && data.checkNumber == "";
    })
    .reduce((total, value) => {
      return (
        total + parseFloat(String(value.amountInputted).replace(/,/g, "")) || 0
      );
    }, 0);

  // Balance Details Check
  const check = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Bank" && data.checkNumber != "";
    })
    .reduce((total, value) => {
      return (
        total + parseFloat(String(value.amountInputted).replace(/,/g, "")) || 0
      );
    }, 0);

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  // Vendor Options for dropdown select
  const vendorOptions = vendorMap.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  // Subject 2 Options for dropdown select
  const subject2Options = subject2DataList.map((item) => ({
    value: item.id,
    label: item.subject_name,
    subject_type: item.subject_type,
  }));

  // Subject 3 Options for dropdown select
  const subject3Options = subject3DataList.map((item) => ({
    value: item.id,
    label: item.account_name,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, disabled, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100 z-0"
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
        disabled={disabled}
      />
    )
  );

  useEffect(() => {
    const totalAmount = payableList.reduce((sum, item) => {
      const amount = parseFloat(item.totalAmount) || 0;
      return sum + amount;
    }, 0);
    setBalance(totalAmount);
    setTotalAmountSum(totalAmount - (cash + account + check));

    if (parseFloat((totalAmount - (cash + account + check)).toFixed(2)) < 0) {
      swal({
        icon: "warning",
        title: "Warning",
        text: "Payable Balance cannot be less than zero. Please check your payment",
      });
    }
  }, [payableList, floatPayment]);

  useEffect(() => {
    setPayableDate(dateToday());
    setCurrentDate(dateToday());
  }, []);

  useEffect(() => {
    if (amountInputted) {
      handleAmountValue(amountInputted);
    }
  }, [date]);

  useEffect(() => {
    if (Array.isArray(pagination?.data?.isFetch)) {
      setAllPayable(
        pagination?.data?.isFetch?.map((item) => {
          return {
            ...item,
          };
        })
      );

      setAvailablePayables(
        pagination?.data?.isFetch?.map((item) => {
          return {
            ...item,
          };
        })
      );
    }

    const selectedTransactionIds = payableList.map(
      (item) => item.transactionId
    );

    const filteredPayables = pagination?.data?.isFetch?.filter(
      (payable) =>
        !selectedTransactionIds.includes(payable.transaction_id) &&
        payable.currencyId === currency
    );

    // Validation if there's no transaction with the selected vendor and currency
    if (
      currency &&
      selectedVendorId &&
      !searchTerm &&
      filteredPayables.length === 0 &&
      show
    ) {
      swal({
        icon: "warning",
        title: "Warning",
        text: "No transactions found under this vendor and currency. Please create a transaction first.",
      }).then(() => {
        setShow(false);
      });
      return;
    }

    //  nilagyan question marksss
    if (pagination?.data?.items && pagination?.data?.isFetch) {
      // Skip if all selectedRows already exist in Order List Table
      const existingIds = payableList.map((item) => item.id);
      const isFullySynced =
        selectedRow.every((id) => existingIds.includes(id)) &&
        payableList.length === selectedRow.length;

      if (isFullySynced) return;

      const newItems = pagination?.data?.items?.filter(
        (item) =>
          selectedRow.includes(item.id) && !existingIds.includes(item.id)
      );

      if (newItems.length > 0) {
        // setPayableList((prev) => [...prev, ...newItems]);
        setPayableList((prev) => {
          return [
            ...prev,
            ...newItems.map((item) => {
              // Find the selected payable for the current item
              const selectedPayable = pagination?.data?.items?.find(
                (payable) => payable.transaction_id === item.transaction_id
              );

              console.log(selectedPayable, "selectedpayable");

              // Extract product price from payable_products
              // const productPrice =
              //   selectedPayable?.payable_products?.[0]?.product_tag_vendor
              //     ?.product_price || "";

              const productPrice =
                selectedPayable?.payable_products?.[0]?.unitPrice || "";

              // let unitPrice = 0;

              // selectedPayable?.payable_products.forEach((data) => {
              //   unitPrice += data.unitPrice * data.weight;
              // });

              // const moisture = selectedPayable?.payable_products.reduce(
              //   (acc, data) => {
              //     if (data.moisture_type === "%") {
              //       return (
              //         acc +
              //         parseFloat(
              //           (data.moisture / 100) * data.unitPrice * data.weight ||
              //             0
              //         )
              //       );
              //     } else {
              //       return acc + parseFloat(data.moisture || 0);
              //     }
              //   },
              //   0
              // );

              // const totalOtherFees = selectedPayable?.payable_other_fees.reduce(
              //   (acc, data) => acc + parseFloat(data.fee_amount || 0),
              //   0
              // );

              // const calculateDiscount =
              //   selectedPayable.isPercent_Discount === true
              //     ? (selectedPayable.discount_value / 100) *
              //       parseFloat(
              //         unitPrice -
              //           moisture -
              //           selectedPayable.weighing_fee -
              //           totalOtherFees
              //       )
              //     : selectedPayable.discount_value;

              // const totalAmountPrice =
              //   unitPrice -
              //   moisture -
              //   selectedPayable.weighing_fee -
              //   totalOtherFees -
              //   calculateDiscount;

              return {
                ...item,
                id: item.id || "",
                transactionId: item.transaction_id || "",
                clientTransactionId:
                  selectedPayable.client_transaction_id || "",
                invoiceDate: item.createdAt || "",
                purchaseDate: item.purchaseDate || "",
                description: item.description || "",
                dueDate: item.due_date || "",
                amount: productPrice || "",
                discount: item.discount_value || "",
                totalAmount: item.totalPrice,
                newItemList: true,
              };
            }),
          ];
        });
      }
    }
  }, [pagination?.data?.isFetch, pagination?.data?.items]);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    if (payableList.length === 0 && prevSubject1.current === "") {
      swal({
        icon: "warning",
        title: "Warning",
        text: "Please select from the order list first before proceeding to payment method",
      }).then(() => {
        setSubject1("");
        setSubject2("");
        setIsSubject2Disabled(true);
      });
    }

    prevSubject1.current = subject1;
  }, [selectedPayment, onlinePaymentCheckbox, subject1]);

  const currencyList = {
    PHP: "Philippine Peso (Philippines)",
    USD: "US Dollar (United States)",
    CNY: "Chinese Yuan (China)",
    HKD: "Hong Kong Dollar (Hong Kong)",
    EUR: "Euro (European Union)",
    JPY: "Japanese Yen (Japan)",
  };

  // function to handle currency rate formatting
  const handleCurrencyRateChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setCurrencyRate(formattedValue);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link
              // to={`${
              //   module === "local"
              //     ? "/purchases/local-purchase"
              //     : "/purchases/overseas-purchase"
              // }`}
              to={"/purchases/local-purchase"}
              className="text-dark mx-2"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            PAYABLE
          </span>
        </div>
      </div>
      <div className="container-fluid mt-3">
        <div className="row p-2">
          <div className="col-sm">
            <span>Transaction Number</span>
            <input
              type="text"
              name=""
              id=""
              value={transactionNumber}
              className="form-control p-2"
              readOnly
            />
          </div>
          <div className="col-sm"></div>
        </div>
        <div className="row p-2">
          <div className="col-sm">
            <span>Vendor</span>
            <div className="mb-2">
              <Select
                options={vendorOptions}
                value={selectedVendorId}
                onChange={handleVendorChange}
                placeholder={`Select Vendor`}
                styles={selectCustomStyles(
                  selectedVendorId,
                  validated,
                  "0.12rem"
                )}
                onMenuOpen={() => {
                  if (vendorMap.length === 0) {
                    const foreign =
                      module.charAt(0).toUpperCase() + module.slice(1);
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("center-swal-text");
                    wrapper.innerHTML = `There are no approved transactions in the <strong>Create Purchase</strong> module that haven't already been added to <strong>${foreign} Purchase</strong>.`;

                    swal({
                      icon: "warning",
                      title: "Warning",
                      content: wrapper,
                    });
                  }
                }}
                menuIsOpen={vendorMap.length === 0 ? false : undefined}
                required
                isSearchable
              />
            </div>
          </div>
          <div className="col-sm">
            <span>Currency</span>
            <div className="input-group mb-2">
              <Form.Select
                className="form-select p-2"
                required
                onChange={handleCurrencyChange}
                value={currency}
                disabled={!selectedVendorId}
              >
                <option disabled selected value="">
                  Select Currency
                </option>
                {allCurrency.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.currency_name} -{" "}
                    {currencyList[option.currency_name]}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="col-sm">
            <span>Balance</span>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text h-100">{currencyName}</div>
              </div>
              <input
                type="text"
                className="form-control p-2"
                id="inlineFormInputGroup"
                value={balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
              />
            </div>
          </div>
          <div className="col-sm">
            <span>Transaction Date</span>
            <CustomDatePicker
              label={"Transaction Date"}
              selected={payableDate ? new Date(payableDate) : ""}
              handleDateChange={(date) => {
                setPayableDate(date);
                dateValidation(date, setPayableDate, "Transaction Date");
              }}
              setter={setPayableDate}
              CustomInput={CustomInput}
              isRequired={true}
              validated={validated}
              dateValidation={dateValidation}
            />
          </div>
        </div>
        {currency && currency !== "11111111-1111-1111-1111-111111111111" ? (
          <div className="row p-2">
            <div className="col-sm d-none">
              <span>
                Currency Rate<span className="text-danger">*</span>
              </span>
              <Form.Control
                type="text"
                name=""
                id=""
                className="form-control p-2"
                required
                onChange={handleCurrencyRateChange}
                value={currencyRate}
                readOnly
              />
            </div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
          </div>
        ) : null}
      </div>
      <div className="container-fluid ">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Order List</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Transaction ID</th>
                  <th className="p-2">Remarks</th>
                  <th className="p-2">Purchase Date</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Discount</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {payableList.map((item, index) => (
                  <tr key={index}>
                    <td className="d-none">
                      <input
                        className="form-control"
                        value={item.transactionId || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={item.clientTransactionId || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      {/* <select
                        className="form-select"
                        value={item.description || ""}
                        onChange={(e) =>
                          handleTransactionChange(index, e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select Remarks
                        </option>
                        {generateFilteredOptions(index).map((payable) => (
                          <option
                            key={payable.id}
                            value={payable.transaction_id}
                          >
                            {payable.description}
                          </option>
                        ))}
                      </select> */}
                      <input
                        className="form-control"
                        value={item.description || ""}
                        type="text"
                        readOnly
                      />
                      <input type="hidden" readOnly value={item.id} />
                    </td>
                    <td>
                      {/* <input
                        className="form-control"
                        value={item.purchaseDate || ""}
                        type="text"
                        readOnly
                      /> */}

                      <div>
                        {" "}
                        <DatePicker
                          selected={item.purchaseDate}
                          dateFormat="MMM/dd/yyyy"
                          className="form-control p-2"
                          readOnly
                        />
                      </div>
                    </td>
                    <td>
                      {/* <input
                        className="form-control"
                        value={item.dueDate || ""}
                        type="text"
                        readOnly
                      /> */}
                      <div>
                        <DatePicker
                          selected={item.dueDate}
                          dateFormat="MMM/dd/yyyy"
                          className="form-control p-2"
                          readOnly
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={
                          item.totalAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || ""
                        }
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={item.discount || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteItem(item, index)}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end mt-2">
          <button className="btn btn-primary btn-sm" onClick={addNewItem}>
            New Item
          </button>
        </div>
      </div>
      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Payment</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-4">
          <div className="w-100 p-2 mt-1 row">
            <div className="col-12 col-md-4 p-2">
              <div className="w-100 border shadow-sm p-3 rounded">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment Method</span>
                </div>
                <Form validated={validated} onSubmit={handleAddPayment}>
                  <Form.Group className="mb-3" controlId="payWith">
                    <Form.Label className="fw-bold">Pay With:</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="bank"
                        label="Bank"
                        value="Bank"
                        checked={selectedPayment === "Bank"}
                        onChange={handlePaymentMethod}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="cash"
                        label="Cash"
                        value="Cash"
                        checked={selectedPayment === "Cash"}
                        onChange={handlePaymentMethod}
                        className="me-3"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        checked={onlinePaymentCheckbox}
                        onChange={handleOnlineCheck}
                      />{" "}
                      <label>Online</label>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Subject 1</Form.Label>
                    <Form.Select
                      className="form-select"
                      onChange={handleSubject1Change}
                      value={subject1}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 1
                      </option>
                      <option value="Account-List">Account-List</option>
                      <option value="Asset Account">Asset Account</option>
                      <option value="Liabilities Account">
                        Liabilities Account
                      </option>
                      <option value="Owner's Equity Account">
                        Owner's Equity Account
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Subject 2</Form.Label>
                    {/* <Form.Select
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
                    </Form.Select> */}
                    <Select
                      options={subject2Options}
                      value={subject2}
                      onChange={(selectedOption) =>
                        handleSubject2Change(selectedOption)
                      }
                      placeholder={`Select Subject 2`}
                      styles={selectCustomStyles(subject2, validated)}
                      isDisabled={isSubject2Disabled}
                      required
                      isSearchable
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="accountName">
                    <Form.Label className="fw-bold">Accounts</Form.Label>
                    {/* <Form.Select
                      value={subject3}
                      className="p-2"
                      onChange={handleAccountChange}
                      required={selectedPayment !== "Online"}
                      disabled={isSubject3Disabled}
                    >
                      <option value="" disabled>
                        Select Account name
                      </option>
                      {subject3DataList.map((data) => (
                        <option key={data.id} value={data.id}>
                          {data.account_name}
                        </option>
                      ))}
                    </Form.Select> */}
                    <Select
                      options={subject3Options}
                      value={subject3}
                      onChange={handleAccountChange}
                      placeholder={`Select Account name`}
                      styles={selectCustomStyles(subject3, validated)}
                      isDisabled={isSubject3Disabled}
                      required={selectedPayment !== "Online"}
                      isSearchable
                    />
                  </Form.Group>

                  {selectedPayment === "Bank" && !onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          // if (/^[0-9-]*$/.test(value) && value.length <= 15) {
                          //   setCheckNumber(value);
                          // }
                          setCheckNumber(value);
                        }}
                      />
                    </Form.Group>
                  )}

                  {onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Reference #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        placeholder="000000-000-0000"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                      />
                    </Form.Group>
                  )}

                  {onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="online">
                      <Form.Label>Online Wallet Remarks</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        value={onlineWalletRemarks}
                        placeholder="Description"
                        onChange={(e) => setOnlineWalletRemarks(e.target.value)}
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3" controlId="date">
                    <Form.Label>Issued Date</Form.Label>
                    {/* <Form.Control
                      type="date"
                      required
                      className="p-2"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setIsAmountDisabled(false);
                      }}
                    /> */}
                    {/* <div className="position-relative">
                      <DatePicker
                        selected={date}
                        dateFormat="MMM/dd/yyyy"
                        onChange={(date) => {
                          setDate(date);
                          setIsAmountDisabled(false);
                          dateValidation(date, setDate, "Issued Date");
                        }}
                        className="form-control p-2"
                        customInput={<CustomInput />}
                      />
                      <i
                        class="fa-solid fa-calendar-week calendar-position"
                        style={{
                          right: `${validated ? "2rem" : "1rem"}`,
                          top: "0.8rem",
                        }}
                      ></i>
                    </div> */}
                    <CustomDatePicker
                      label={"Issued Date"}
                      selected={date ? new Date(date) : ""}
                      handleDateChange={(date) => {
                        setDate(date);
                        setIsAmountDisabled(false);
                        dateValidation(date, setDate, "Issued Date");
                        postedCutoffValidation(date, setDate, "Issued Date");
                      }}
                      setter={setDate}
                      CustomInput={CustomInput}
                      isRequired={true}
                      validated={validated}
                      dateValidation={dateValidation}
                      setIsAmountDisabled={setIsAmountDisabled}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">{currencyName}</span>
                      <Form.Control
                        type="text"
                        className="p-2"
                        required
                        placeholder="0.00"
                        value={amountInputted}
                        // onInput={onInputFloat}
                        // onBlur={(e) => {
                        //   setAmountInputted(e.target.value);
                        // }}
                        onChange={(e) => handleAmountValue(e.target.value)}
                        disabled={isAmountDisabled}
                      />
                    </div>
                    <span>
                      Account Balance:{" "}
                      <strong>
                        {bankAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                  </Form.Group>

                  <Button type="submit" variant="primary" className="w-100 p-2">
                    Add Payment
                  </Button>
                </Form>
              </div>
            </div>
            <div className="col-12 col-md-8 p-2 d-flex flex-column">
              <div className="w-100 border shadow-sm p-2 rounded mb-2">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment List</span>
                </div>
                <div className="mt-3">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th className="p-2 payment-list-td">Type</th>
                          <th className="p-2 payment-list-td">Account Name</th>
                          <th className="p-2 payment-list-td">Amount</th>
                          <th className="p-2 payment-list-td">Check Number</th>
                          <th className="p-2 payment-list-td">Ref Number</th>
                          <th className="p-2 payment-list-td">Issue Date</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floatPayment.map((data, i) => (
                          <tr>
                            <td>{data?.paymentMethod}</td>
                            <td>
                              {data?.accountName === ""
                                ? "--"
                                : data.accountName}
                            </td>
                            <td>
                              <>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={data.amountInputted?.toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                  onChange={(e) => {
                                    handlePaymentListAmountChange(
                                      e.target.value,
                                      setFloatPayment,
                                      i,
                                      "amountInputted"
                                    );
                                  }}
                                  readOnly={!editPaymentList[i]}
                                />
                              </>
                            </td>
                            <td>
                              <>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={
                                    editPaymentList[i]
                                      ? data.checkNumber ?? ""
                                      : data.checkNumber || "--"
                                  }
                                  onChange={(e) => {
                                    handlePaymentListInputChange(
                                      e.target.value,
                                      setFloatPayment,
                                      i,
                                      "checkNumber"
                                    );
                                  }}
                                  readOnly={!editPaymentList[i]}
                                />
                              </>
                            </td>
                            <td>
                              <>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={
                                    editPaymentList[i]
                                      ? data.refNumber ?? ""
                                      : data.refNumber || "--"
                                  }
                                  onChange={(e) => {
                                    handlePaymentListInputChange(
                                      e.target.value,
                                      setFloatPayment,
                                      i,
                                      "refNumber"
                                    );
                                  }}
                                  readOnly={!editPaymentList[i]}
                                />
                              </>
                            </td>
                            <td>
                              {/* <DatePicker
                                selected={data.issuedDate}
                                onChange={(date) => {
                                  handlePaymentListInputChange(
                                    date,
                                    setFloatPayment,
                                    i,
                                    "issuedDate"
                                  );
                                }}
                                dateFormat="MMM/dd/yyyy"
                                className="form-control p-2"
                                customInput={
                                  <CustomInput
                                    dateReadOnly={!editPaymentList[i]}
                                  />
                                }
                                readOnly={!editPaymentList[i]}
                              /> */}
                              <CustomDatePicker
                                index={i}
                                arrayOfObjectIndex={i}
                                field={"issuedDate"}
                                selected={
                                  data.issuedDate
                                    ? new Date(data.issuedDate)
                                    : ""
                                }
                                handleDateChange={(date) => {
                                  handlePaymentListInputChange(
                                    date,
                                    setFloatPayment,
                                    i,
                                    "issuedDate"
                                  );
                                }}
                                setter={setFloatPayment}
                                CustomInput={CustomInput}
                                disabled={!editPaymentList[i]}
                                validated={validated}
                              />
                            </td>
                            {/* <td className="text-primary">Edit</td> */}
                            <td className="text-nowrap">
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={() => {
                                  setEditPaymentList((prev) => ({
                                    ...prev,
                                    [i]: !prev[i],
                                  }));
                                }}
                              >
                                <i className="fa-solid fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deletePayment(data, i)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="w-100 border shadow-sm p-2 rounded ">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Balance Details</span>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Last Balance</span>
                      <span className="text-secondary"></span>
                    </div> */}
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Payable Balance</span>
                      <span className="text-white text-underline">
                        {currencyName} {truncateToTwoDecimals(totalAmountSum)}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm"></div>
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Cash</span>
                      <span className="text-secondary">
                        {cash.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Account</span>
                      <span className="text-secondary">
                        {account.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Check</span>
                      <span className="text-secondary">
                        {check.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Total Payment</span>
                      <span className="text-white text-underline">
                        {currencyName}{" "}
                        {(cash + account + check).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-4">
                <div className="col-sm"></div>
                <div className="col-sm"></div>
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  <Link
                    to={`${
                      module === "local"
                        ? "/purchases/local-purchase"
                        : "/purchases/overseas-purchase"
                    }`}
                    className="text-dark mx-2"
                  >
                    {/* <button className="btn btn-outline-secondary w-100 me-3">
                      Cancel
                    </button> */}
                  </Link>
                  <button
                    className="btn btn-primary w-100"
                    type="button"
                    onClick={handleSavePayment}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={show}
        size="xl"
        onHide={() => {
          handleClose();
          setFilterColumn("all");
          setSearchTerm("");
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Payable List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  let input = e.target.value;

                  // Remove commas
                  const raw = String(input).replace(/,/g, "");

                  const [intPart, decimalPart] = raw.split(".");

                  // Add commas to integer part
                  const withCommas = intPart.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  );

                  // Join back decimal part if it exists
                  const formatted =
                    decimalPart !== undefined
                      ? `${withCommas}.${decimalPart}`
                      : withCommas;

                  if (
                    availablePayables.find((item) => {
                      const price = item.totalPrice;
                      const precision17 = Number(
                        price.toPrecision(17)
                      ).toString();
                      const fixed17 = price.toFixed(17);
                      const fixed2 = price.toFixed(2);

                      return (
                        precision17.includes(raw) ||
                        fixed17.includes(raw) ||
                        fixed2.includes(raw)
                      );
                    })
                  ) {
                    setSearchTerm(formatted);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "all" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("all")}
                  >
                    All
                  </button>
                </li>
                {[
                  { value: "transaction_id", label: "Transaction ID" },
                  { value: "description", label: "Remarks" },
                  { value: "purchaseDate", label: "Purchase Date" },
                  { value: "due_date", label: "Due Date" },
                  { value: "totalPrice", label: "Amount" },
                  { value: "discount_value", label: "Discount" },
                ].map(({ value, label }) => (
                  <li key={value}>
                    <button
                      className={`dropdown-item ${
                        filterColumn === value ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn(value)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DataTable
            columns={modalColumn}
            data={availablePayables}
            customStyles={customStyles}
            onRowClicked={(row) => handleIndividualCheckBoxChange(row.id)}
            className="dataTable"
          />
          <PaginationControls {...pagination} />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              handleClose();
              setFilterColumn("all");
              setSearchTerm("");
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={submitModal}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BulkPayable;
