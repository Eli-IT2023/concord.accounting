import React, { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, Link } from "react-router-dom";
import swal from "sweetalert";
import { customStyles } from "../../../assets/table-style";
import DataTable from "react-data-table-component";
import { jwtDecode } from "jwt-decode";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  PaginationControls,
  usePagination,
} from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const BulkCollection = ({ authrztn, roleType }) => {
  const userLoggedID = useDecodeToken();
  // const [userLoggedID, setUserLoggedID] = useState("");
  // const decodeToken = () => {
  //   var token = localStorage.getItem("accessToken");
  //   if (typeof token === "string") {
  //     var decoded = jwtDecode(token);
  //     // console.log("DECODED TOKEN:", decoded);
  //     setUserLoggedID(decoded.id);
  //   }
  // };
  // useEffect(() => {
  //   decodeToken();
  // }, []);
  const navigate = useNavigate();
  const [cutOffData, setCutOffData] = useState([]);

  const [currencyName, setCurrencyName] = useState("");
  const [editableRow, setEditableRow] = useState(null);
  const [editedData, setEditedData] = useState({});

  const [validated, setValidated] = useState(false);
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject1Disabled, setIsSubject1Disabled] = useState(true);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [localCustomerData, setLocalCustomerData] = useState([]);
  const [isCustomerDisabled, setIsCustomerDisabled] = useState(true);
  const [isTransactionDisabled, setIsTransactionDisabled] = useState(true);
  const [currency_db, setCurrency_db] = useState([]);

  const [transactionNumber, setTransactionNumber] = useState("");
  const [date, setDate] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [selected_currency_id, setSelected_currency_id] = useState("");

  const [selectedPayment, setSelectedPayment] = useState("Bank");
  // const [onlinePaymentCheckbox, setOnlinePaymentCheckbox] = useState(false);
  // const [checkCheque, setCheckCheque] = useState(false);
  const [checkOrOnline, setCheckOrOnline] = useState("");
  const [bankAmount, setBankAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [floatPayment, setFloatPayment] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [items, setItems] = useState([
    // {
    //   transactionId: "",
    //   remarks: "",
    //   invoiceDate: "",
    //   dueDate: "",
    //   totalAmount: "",
    //   discount: "",
    //   discountType: "",
    // },
  ]);
  const [editIndex, setEditIndex] = useState(null);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [paginationUrl, setPaginationUrl] = useState("");

  const submitModal = () => {
    // const filteredExpensesData = localExpensesData
    //   .filter((item) => item.checkbox == true)
    //   .map((item) => {
    //     return {
    //       transactionId: item.transaction_id,
    //       expensesType: `${item.expenses2.expenses_one.expenses_type_one} (${item.expenses2.sub_type})`,
    //       expensesDate: item.expenses_date
    //         ? new Date(item.expenses_date).toISOString().split("T")[0]
    //         : "",
    //       totalAmount: item.totalAmount,
    //       description: item.desc,
    //     };
    //   });

    setTransactions((prev) => {
      return prev.filter((item) => !selectedRow.includes(item.transaction_id));
    });

    setItems((prev) => {
      return [
        ...prev,
        ...transactions.filter((item) =>
          selectedRow.includes(item.transaction_id)
        ),
      ];
    });

    setSelectedRow([]);
    setSearchTerm("");
    setFilterColumn("all");
    setShow(false);
  };

  const handleIndividualCheckBoxChange = (transaction_id) => {
    if (selectedRow.includes(transaction_id)) {
      setSelectedRow((prev) => {
        return prev.filter((item) => transaction_id !== item);
      });
    } else {
      setSelectedRow((prev) => {
        return [...prev, transaction_id];
      });
    }
  };

  const handleAllCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked == true) {
      setSelectedRow(transactions.map((item) => item.transaction_id));
    } else {
      setSelectedRow([]);
    }
  };

  const columns = [
    // Checkbox column - always visible
    {
      name: (
        <input type="checkbox" onChange={(e) => handleAllCheckboxChange(e)} />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRow.includes(row.transaction_id)}
          onChange={() => handleIndividualCheckBoxChange(row.transaction_id)}
        />
      ),
      width: "120px",
    },
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id || "",
    },
    {
      name: "Remarks",
      selector: (row) => row.remarks || "",
    },
    {
      name: "Invoice Date",
      selector: (row) =>
        row.invoice_date
          ? format(new Date(row.invoice_date), "MMM dd, yyyy")
          : "",
    },
    {
      name: "Due Date",
      selector: (row) =>
        row.due_date ? format(new Date(row.due_date), "MMM dd, yyyy") : "",
    },
    // Management-only columns below
    {
      name: "Amount",
      selector: (row) => row.calculated_amount,
      sortable: true,
      format: (row) => `${(row.calculated_amount || 0).toFixed(2)}`,
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
    {
      name: "Discount",
      selector: (row) => row.calculated_discount,
      sortable: true,
      format: (row) => `${(row.calculated_discount || 0).toFixed(2)}`,
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
    {
      name: "Withhold Tax",
      selector: (row) => row.withhold_tax,
      sortable: true,
      format: (row) => `${(row.withhold_tax || 0).toFixed(2)}`,
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
    {
      name: "Subtotal",
      selector: (row) => row.calculated_subtotal,
      sortable: true,
      format: (row) =>
        `${(row.calculated_subtotal - row.withhold_tax || 0).toFixed(2)}`,
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
  ];

  // Function to add a new row
  const addNewItem = () => {
    handleShow();
    // setItems([
    //   ...items,
    //   {
    //     transactionId: "",
    //     remarks: "",
    //     invoiceDate: "",
    //     dueDate: "",
    //     totalAmount: "",
    //     discount: "",
    //     discountType: "",
    //   },
    // ]);
  };

  // Function to delete a row
  const deleteItem = (item, index) => {
    // if (items.length === 1) {
    //   // Prevent deleting the last row if there's only one row
    //   return;
    // }
    // const updatedItems = [...items];
    // updatedItems.splice(index, 1);
    // setItems(updatedItems);
    setTransactions((prev) => {
      return [...prev, item];
    });

    setItems((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((item) => item !== item.transaction_id);
    });
  };

  // Function to toggle edit mode
  const toggleEdit = (index) => {
    setEditIndex(editIndex === index ? null : index);
  };

  const fetchTransactionCode = () => {
    axios
      .get(BASE_URL + "/bulkcollection/transactionBulkCollection")
      .then((res) => {
        setTransactionNumber(res.data);
      })
      .catch((err) => {
        console.log(err);
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

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/bulkcollection/getCutoffPosted")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCollectionDate = (date) => {
    const collectionDate = date;
    setCollectionDate(collectionDate);

    // Check if the dueDate is within any cutoff range
    const isWithinCutoff = cutOffData.some((cutoff) => {
      const fromDate = new Date(cutoff.from);
      const toDate = new Date(cutoff.to);
      const selectedDate = new Date(collectionDate);

      return selectedDate >= fromDate && selectedDate <= toDate;
    });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Transaction Date Conflict",
        text: "The transaction date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setCollectionDate("");
      });
    }
  };

  const handleIssuedDate = (date) => {
    const dateIssue = date;
    setDate(dateIssue);

    // Check if the dueDate is within any cutoff range
    const isWithinCutoff = cutOffData.some((cutoff) => {
      const fromDate = new Date(cutoff.from);
      const toDate = new Date(cutoff.to);
      const selectedDate = new Date(dateIssue);

      return selectedDate >= fromDate && selectedDate <= toDate;
    });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Collection Date Conflict",
        text: "The collection date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setDate("");
      });
    }
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (selectedPayment === "Cash") {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setDate(currentDate);
    }
  }, [selectedPayment]);

  useEffect(() => {
    setCollectionDate(dateToday());
  }, []);

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

    try {
      axios
        .get(`${BASE_URL}/bulkcollection/getSubject1LocalCollection`, {
          params: {
            account_selected: account_selected,
            selectedPayment,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);
          setSubject2("");
          setSubject3("");
          setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
          setIsSubject3Disabled(true); // Reset and disable Subject 3

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

  const handleSubject2Change = (event, subject_type) => {
    const selectedSubject2 = event.target.value;

    try {
      axios
        .get(`${BASE_URL}/bulkcollection/getSubject3LocalCollection`, {
          params: {
            subjectId: selectedSubject2,
            selected_currency_id,
          },
        })
        .then((res) => {
          setSubject3DataList(res.data);
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

  const handlePaymentMethod = (e) => {
    const paymentMethod = e.target.value;
    setSelectedPayment(paymentMethod);
    setCheckOrOnline("");
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setRefNumber("");
    setCheckNumber("");
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);

    // if (paymentMethod) {
    //   axios
    //     .get(`${BASE_URL}/bulkcollection/getAccountList/${paymentMethod}`)
    //     .then((res) => {
    //       setAccountListData(res.data);
    //       setValidated(false);

    //     })
    //     .catch((err) => {
    //       console.log(err);
    //     });
    // } else {
    //   setAccountListData([]);
    // }
  };

  // const handleOnlineCheck = (e) => {
  // const isChecked = e.target.checked;
  // setOnlinePaymentCheckbox(isChecked);
  // if (isChecked) {
  //   setCheckCheque(false);
  // }
  // };

  //   const handleCheque = (e) => {
  //   const isChecked = e.target.checked;
  //   setCheckCheque(isChecked);
  //   if (isChecked) {
  //     setOnlinePaymentCheckbox(false);
  //   }
  // };

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    setSubject3(selectedAccountId);

    // Find the selected account in the accountListData
    const selectedAccount = subject3DataList.find(
      (account) => String(account.id) === String(selectedAccountId)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    }
  };
  // useEffect(() => {
  //   // Fetch initial customer data
  //   axios
  //     .get(BASE_URL + "/bulkcollection/getCustomerLocalSales")
  //     .then((res) => {
  //       const uniqueCustomers = [];
  //       const customerSet = new Set();

  //       res.data.forEach((invoice) => {
  //         if (!customerSet.has(invoice.customer.customer_id)) {
  //           customerSet.add(invoice.customer.customer_id);
  //           uniqueCustomers.push(invoice.customer);
  //         }
  //         console.log(invoice);
  //       });

  //       setLocalCustomerData(uniqueCustomers);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);

  const handleCurrencyChange = (value) => {
    setSelected_currency_id(value);
    const currency_symbol = currency_db.find(
      (currency) => String(currency.id) === String(value)
    );

    if (currency_symbol) {
      setCurrencyName(currency_symbol.currency_name);
    }
    axios
      .get(BASE_URL + "/bulkcollection/getCustomerLocalSales", {
        params: {
          currency_id: value,
        },
      })
      .then((res) => {
        const uniqueCustomers = [];
        const customerSet = new Set();

        res.data.forEach((invoice) => {
          if (!customerSet.has(invoice.customer.customer_id)) {
            customerSet.add(invoice.customer.customer_id);
            uniqueCustomers.push(invoice.customer);
          }
          console.log(invoice);
        });

        setLocalCustomerData(uniqueCustomers);
        setIsCustomerDisabled(false);
      })
      .catch((err) => {
        console.log(err);
      });
    setSelectedCustomerId("");
    setTransactions([]);
    setItems([]);
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);

    if (customerId) {
      fetchSalesInvoiceOrderList(customerId, selected_currency_id);
    }
  };

  const pagination = useServerPagination(paginationUrl, 10);

  const paginationHook = usePagination(transactions, 10);

  const fetchSalesInvoiceOrderList = (customerId, selected_currency_id) => {
    setPaginationUrl(
      `${BASE_URL}/bulkcollection/getTransactionsByCustomer/${customerId}/${selected_currency_id}`
    );
    pagination.updateParams({
      searchText: searchTerm,
      filterColumn,
    });
    setIsTransactionDisabled(false);
    // axios
    //   .get(
    //     `${BASE_URL}/bulkcollection/getTransactionsByCustomer/${customerId}/${selected_currency_id}`,
    //     {
    //       params: {
    //         searchText: searchTerm,
    //         filterColumn,
    //       },
    //     }
    //   )
    //   .then((res) => {
    //     setTransactions(
    //       res.data.filter(
    //         (item) =>
    //           !items
    //             .map((item) => item.transaction_id)
    //             .includes(item.transaction_id)
    //       )
    //     );
    //     console.log(res.data);
    //     setIsTransactionDisabled(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  const handleTransactionChange = (index, transactionId) => {
    const transaction = transactions.find(
      (t) => String(t.sales_invoice_id) === String(transactionId)
    );
    if (transaction) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        transactionId: transactionId,
        remarks: transaction.remarks,
        invoiceDate: transaction.createdAt
          ? new Date(transaction.createdAt).toISOString().split("T")[0]
          : "",
        dueDate: transaction.due_date
          ? new Date(transaction.due_date).toISOString().split("T")[0]
          : "",
        totalAmount: transaction.total_amount || 0,
        discount:
          (transaction.transaction_discount || 0) +
          (transaction.item_discount || 0),
        discountType: transaction.discount_type || "",
      };
      setItems(updatedItems);
      setIsSubject1Disabled(false);
    }
  };

  const getAvailableTransactionIds = (index) => {
    const selectedTransactionIds = items
      .map((item) => item.transactionId)
      .filter((id) => id);
    return transactions.filter(
      (transaction) =>
        !selectedTransactionIds.includes(
          transaction.sales_invoice_id.toString()
        ) ||
        items[index].transactionId === transaction.sales_invoice_id.toString()
    );
  };

  useEffect(() => {
    const sum = items.reduce(
      (acc, item) =>
        acc +
        (parseFloat(item.calculated_subtotal || 0) -
          parseFloat(item.withhold_tax || 0)),
      0
    );

    setTotalAmountSum(sum);
  }, [items]);

  const totalCashPaid = floatPayment.reduce(
    (acc, data) =>
      data.paymentMethod === "Cash" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const totalBankPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber === "" &&
      data.refNumber === "" &&
      data.paymentMethod === "Bank"
        ? acc + parseFloat(String(data.amount).replace(/,/g, "") || 0)
        : acc,
    0
  );

  const totalCheckPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber !== ""
        ? acc + parseFloat(String(data.amount).replace(/,/g, "") || 0)
        : acc,
    0
  );

  const totalOnlinePaid = floatPayment.reduce(
    (acc, data) =>
      data.refNumber !== "" && data.paymentMethod === "Bank"
        ? acc + parseFloat(String(data.amount).replace(/,/g, "") || 0)
        : acc,
    0
  );

  const toPayAmount = parseFloat(totalAmountSum);

  const balance_now = toPayAmount - totalPayment;
  const [lastBalance, setLastBalance] = useState(0);

  const onInputFloat = (e) => {
    let value = e.target.value;

    // Remove non-numeric and non-decimal characters
    value = value.replace(/[^0-9.]/g, "");

    // Prevent multiple leading zeros unless followed by a decimal
    if (/^0{2,}/.test(value)) {
      value = "0";
    } else {
      value = value.replace(/^0+(?=\d)/, ""); // Remove unnecessary leading zeros
    }

    // Ensure only one decimal point is allowed
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join(""); // Keep only the first decimal
    }

    e.target.value = value;
  };

  // const handleAmountValue = (value) => {
  //   // const inputValue = parseFloat(value || 0);
  //   if (/^\d*\.?\d*$/.test(value)) {
  //     if (parseFloat(value) > totalAmountSum) {
  //       swal({
  //         title: "Oppss!",
  //         text: "Please input not greater than the balance",
  //         icon: "error",
  //         buttons: false,
  //         timer: 2000,
  //         dangerMode: true,
  //       }).then(() => {
  //         setAmount(0);
  //       });
  //     } else {
  //       setAmount(value);
  //     }
  //   }
  // };

  const handleAmountValue = (value) => {
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

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    // Check if the input value is greater than the totalAmountSum
    if (numericValue > totalAmountSum) {
      swal({
        title: "Oppss!",
        text: "Please input not greater than the balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmount(0);
      });
    } else {
      setAmount(formattedValue);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!selectedPayment) {
      swal({
        icon: "error",
        title: "Payment Method Required",
        text: "Please select either Bank or Cash as the payment method.",
        buttons: false,
        timer: 2000,
      });
      return;
    }

    if (amount <= 0) {
      swal({
        icon: "error",
        title: "Please input valid amount",
        text: "The amount should not be 0",
        buttons: false,
        timer: 2000,
      });

      return;
    }

    const form = e.currentTarget;

    let formatAmount = amount.replace(/,/g, "");
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
      swal({
        title: "Add this payment?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const newPayment = {
            paymentMethod: selectedPayment,
            subject1: subject1,
            subject2: subject2,
            subject3: subject3,
            accountName: accountName,
            amount: parseFloat(formatAmount),
            issuedDate: date,
            checkNumber: checkNumber,
            refNumber: refNumber,
            checkOrOnline: checkOrOnline || null,
            status: "Pending",
          };
          setFloatPayment((prevPayments) => {
            // Check for matching payment based on all the conditions
            const existingPaymentIndex = prevPayments.findIndex(
              (payment) =>
                payment.subject3 === newPayment.subject3 &&
                payment.issuedDate === newPayment.issuedDate &&
                // First condition: match by paymentMethod, checkNumber, and issuedDate
                ((!newPayment.refNumber &&
                  payment.paymentMethod == newPayment.paymentMethod &&
                  payment.checkNumber == newPayment.checkNumber) ||
                  // Second condition: match when both are "Cash" with the same issuedDate
                  (payment.paymentMethod === "Cash" &&
                    newPayment.paymentMethod === "Cash") ||
                  // Third condition: match when both are "Bank" with empty checkNumber, empty refNumber, and same issuedDate
                  (payment.paymentMethod === "Bank" &&
                    newPayment.paymentMethod === "Bank" &&
                    !payment.checkNumber &&
                    !payment.refNumber &&
                    !newPayment.checkNumber &&
                    !newPayment.refNumber) ||
                  // Fourth condition: match when both are "Bank" with the same refNumber and issuedDate
                  (newPayment.refNumber &&
                    payment.paymentMethod === "Bank" &&
                    newPayment.paymentMethod === "Bank" &&
                    payment.refNumber == newPayment.refNumber))
            );

            if (existingPaymentIndex !== -1) {
              const updatedPayments = [...prevPayments];
              updatedPayments[existingPaymentIndex] = {
                ...updatedPayments[existingPaymentIndex],
                amount:
                  updatedPayments[existingPaymentIndex].amount +
                  newPayment.amount,
              };
              return updatedPayments;
            }

            return [...prevPayments, newPayment];
          });

          setTotalPayment((prevTotal) => {
            const newTotal = prevTotal + parseFloat(formatAmount);
            const newBalance = toPayAmount - newTotal; // Calculate new balance

            setLastBalance(balance_now);
            return newTotal;
          });
          swal({
            icon: "success",
            title: "Payment Added",
            text: "The new payment has been added successfully",
            buttons: false,
            timer: 2000,
          }).then(() => {
            setValidated(false);
            setSelectedPayment("");
            setAccountName("");
            setAmount(0);
            setCheckNumber("");
            setRefNumber("");
            setDate("");
            setSubject1("");
            setSubject2("");
            setSubject3("");
            setIsSubject2Disabled(true);
            setIsSubject3Disabled(true);
            setCheckOrOnline("");
          });
        }
      });
    }
    setValidated(true);
  };

  const handleSavePayment = async () => {
    // if (balance_now !== 0) {
    //   await swal({
    //     title: "Balance not settled",
    //     text: "Please ensure the balance is zero before approve the payment.",
    //     icon: "warning",
    //     buttons: false,
    //     timer: 2000,
    //     dangerMode: true,
    //   });
    //   return;
    // }

    if (!collectionDate) {
      swal({
        title: "Required Field Missing",
        text: "Please ensure Transaction Date is filled out.",
        icon: "error",
        buttons: false,
        timer: 3000,
      });
      return;
    }

    const confirmed = await swal({
      title: "Create this new collection?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const res = await axios.post(
          `${BASE_URL}/bulkcollection/addPaymentLocal`,
          {
            items,
            selectedCustomerId,
            collectionDate,
            // selectedPayment,
            // bankAmount,
            // checkNumber,
            // refNumber,
            // amount,
            // accountName,
            // date,
            floatPayment,
            balance_now,
            transactionNumber,
            selected_currency_id,
            type: "Local",
            userLoggedID,
          }
        );

        if (res.status === 200) {
          const wrapper = document.createElement("div");
          wrapper.classList.add("center-swal-text", "pb-4");
          wrapper.innerHTML =
            "New Collection added to this bulk collection transaction";
          swal({
            title: "Success",
            content: wrapper,
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate("/sales/local-collections");
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error", // Changed to error for better clarity
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    }

    setValidated(true);
  };

  const handleEditClick = (index, data) => {
    setEditableRow(index);
    setEditedData({ ...data });
  };

  const handleInputChange = (e, field) => {
    const value = field === "issuedDate" ? e : e.target.value;

    if (value == "." && field == "amount") {
      setEditedData((prev) => ({
        ...prev,
        ["amount"]: prev + ".",
      }));
    }

    let inputValue = field !== "issuedDate" ? value.replace(/[^0-9.]/g, "") : 0;

    if (inputValue) {
      inputValue = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    if (
      field === "issuedDate"
        ? true
        : /^\d*\.?\d*$/.test(value) && field != "amount"
    ) {
      setEditedData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setEditedData((prev) => ({
        ...prev,
        [field]: inputValue,
      }));
    }
  };

  const handleBlur = (index) => {
    if (editableRow === index) {
      // Update floatPayment with edited data
      setFloatPayment((prevPayments) => {
        const updatedPayments = prevPayments.map((payment, i) =>
          i === index ? { ...payment, ...editedData } : payment
        );

        // Calculate the new total payment
        const newTotalPayment = updatedPayments.reduce(
          (sum, payment) =>
            sum + parseFloat(String(payment.amount).replace(/,/g, "") || 0),
          0
        );
        setTotalPayment(newTotalPayment);

        return updatedPayments;
      });
      setEditableRow(null);
    }
  };

  const handleDeletePayment = (index) => {
    setFloatPayment((prevPayments) => {
      // Remove the payment at the specified index
      const updatedPayments = prevPayments.filter((_, i) => i !== index);

      // Calculate the new total payment after deletion
      const newTotalPayment = updatedPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0
      );
      setTotalPayment(newTotalPayment);

      return updatedPayments;
    });

    // swal({
    //   icon: "success",
    //   title: "Payment Deleted",
    //   text: "The payment has been removed successfully",
    //   buttons: false,
    //   timer: 2000,
    // });
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick, index }, ref) => (
    <input
      type="text"
      className="form-control w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
        padding: `${index !== undefined ? "0.4rem" : "0.5rem"}`,
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      required
      {...(index !== undefined ? { disabled: editableRow !== index } : {})}
    />
  ));

  useEffect(() => {
    fetchTransactionCode();
    fetchCurrency();
    fetchCutOff();
  }, []);

  useEffect(() => {
    fetchSalesInvoiceOrderList(selectedCustomerId, selected_currency_id);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    if (pagination.data) {
      setTransactions(
        pagination.data
          .filter(
            (item) =>
              !items
                .map((item) => item.transaction_id)
                .includes(item.transaction_id)
          )
          .map((item) => ({
            ...item,
            total_amount: item.total_amount || 0,
            item_discount: item.item_discount || 0,
            transaction_discount: item.transaction_discount || 0,
            invoice_date: item.invoice_date
              ? new Date(item.invoice_date)
              : null,
            due_date: item.due_date ? new Date(item.due_date) : null,
          }))
      );
    }
  }, [pagination.data, items]);

  useEffect(() => {
    if (
      searchTerm &&
      searchTerm.trim() !== "" &&
      pagination.currentPage === 1 &&
      transactions.length < 10
    ) {
      pagination.setTotalPages(
        Math.ceil(transactions?.length / pagination.itemsPerPage)
      );
    }
  }, [transactions]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/local-collections" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            CREATE LOCAL RECEIVABLE
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
              className="form-control p-2"
              value={transactionNumber}
              readOnly
            />
          </div>
          <div className="col-sm">
            <span>Issued Date</span>
            {/* <input
              type="date"
              name=""
              id=""
              className="form-control p-2"
              onChange={handleCollectionDate}
              required
              value={collectionDate}
            /> */}
            <div>
              <DatePicker
                selected={collectionDate}
                onChange={handleCollectionDate}
                dateFormat="MMM dd, yyyy"
                required
                customInput={<CustomInput />}
              />
            </div>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm">
            <span>Currency</span>
            <div className="input-group mb-2">
              <Form.Select
                name=""
                id=""
                className="form-select p-2"
                required
                onChange={(e) => handleCurrencyChange(e.target.value)}
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
              </Form.Select>
            </div>
          </div>
          <div className="col-sm">
            <span>Customer</span>
            <div className="input-group mb-2">
              <Form.Select
                name=""
                id=""
                className="form-select p-2"
                required
                onChange={handleCustomerChange}
                value={selectedCustomerId}
                disabled={isCustomerDisabled}
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {localCustomerData.map((customer, i) => (
                  <option key={i} value={customer.customer_id}>
                    {`${customer.company_name}`}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div
            className={roleType?.includes("Management") ? "col-sm" : "d-none"}
          >
            <span>Balance</span>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text h-100">{currencyName}</div>
              </div>
              <input
                type="text"
                className="form-control p-2"
                id="inlineFormInputGroup"
                placeholder="0.00"
                value={totalAmountSum.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Order List</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
          <div className="table-responsive">
            <table
              className="table table-bordered table-hover"
              id="local-order-list-table"
            >
              <thead className="table-light">
                <tr>
                  <th className="p-2">Transaction ID</th>
                  <th className="p-2">Remarks</th>
                  <th className="p-2">Invoice Date</th>
                  <th className="p-2">Due Date</th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Amount
                  </th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Discount
                  </th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Withhold Tax
                  </th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Subtotal
                  </th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              {items.length > 0 ? (
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {/* <select
                        className="form-select form-select-sm p-2"
                        // disabled={editIndex !== index}
                        // onChange={(e) =>
                        //   handleTransactionChange(index, e.target.value)
                        // }
                        value={item.transaction_id}
                        disabled
                      >
                        <option value="" disabled selected>
                          Select ID
                        </option>
                        {getAvailableTransactionIds(index).map(
                          (transaction) => (
                            <option
                              key={transaction.sales_invoice_id}
                              value={transaction.sales_invoice_id}
                            >
                              {transaction.transaction_id}
                            </option>
                          )
                        )}
                      </select> */}
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.transaction_id || ""}
                        />
                      </td>
                      <td>
                        {/* <select
                        className="form-select form-select-sm p-2"
                        // disabled={editIndex !== index}
                        onChange={(e) =>
                          handleTransactionChange(index, e.target.value)
                        }
                        value={item.remarks}
                        disabled={isTransactionDisabled}
                      >
                        <option value="" disabled selected>
                          Select Remarks
                        </option>
                        {getAvailableTransactionIds(index).map(
                          (transaction) => (
                            <option
                              key={transaction.sales_invoice_id}
                              value={transaction.sales_invoice_id}
                            >
                              {transaction.remarks}
                            </option>
                          )
                        )}
                      </select> */}
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.remarks || ""}
                        />
                      </td>
                      <td>
                        {/* <input
                          type="date"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.invoice_date || ""}
                        /> */}

                        <DatePicker
                          selected={item.invoice_date}
                          dateFormat="MMM dd, yyyy"
                          className="form-control form-control-sm p-2"
                          readOnly
                        />
                      </td>
                      <td>
                        {/* <input
                          type="date"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.due_date || ""}
                        /> */}
                        <DatePicker
                          selected={item.due_date}
                          dateFormat="MMM dd, yyyy"
                          className="form-control form-control-sm p-2"
                          readOnly
                        />
                      </td>
                      <td
                        className={
                          roleType?.includes("Management") ? "" : "d-none"
                        }
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={
                            item.calculated_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"
                          }
                          readOnly
                        />
                      </td>
                      <td
                        className={
                          roleType?.includes("Management")
                            ? "text-center"
                            : "d-none"
                        }
                      >
                        <div className="input-group mb-2">
                          <Form.Control
                            type="text"
                            className="form-control-sm p-2"
                            id="inlineFormInputGroup"
                            placeholder={
                              item.discount_type === "percentage"
                                ? "Discount (%)"
                                : "Discount (0.00)"
                            }
                            value={(
                              item.calculated_discount +
                              item.transaction_discount
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            readOnly
                          />
                          {/* <div className="input-group-prepend">
                            <div
                              className="d-none input-group-text bg-white custom-discount-btn"
                              disabled
                            >
                              {item.discount_type === "percentage"
                                ? "%"
                                : "0.00"}
                            </div>
                          </div> */}
                        </div>
                      </td>
                      <td
                        className={
                          roleType?.includes("Management") ? "" : "d-none"
                        }
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={
                            item.withhold_tax.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"
                          }
                          readOnly
                        />
                      </td>
                      <td
                        className={
                          roleType?.includes("Management") ? "" : "d-none"
                        }
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={
                            (
                              item.calculated_subtotal - item.withhold_tax
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"
                          }
                          readOnly
                        />
                      </td>

                      <td className="text-center">
                        {/* <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => toggleEdit(index)}
                      >
                        <i
                          className={`fa-solid ${
                            editIndex === index ? "fa-save" : "fa-edit"
                          }`}
                        ></i>
                      </button> */}
                        <button
                          className="btn btn-sm btn-outline-danger "
                          onClick={() => deleteItem(item, index)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <caption className="text-center mt-3">
                  There are no records to display
                </caption>
              )}
            </table>
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end mt-2">
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={addNewItem}
          >
            New Item
          </button>
        </div>
        <Modal
          show={show}
          size="xl"
          onHide={() => {
            setFilterColumn("all");
            setSearchTerm("");
            handleClose();
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Order List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    { value: "remarks", label: "Remarks" },
                    { value: "invoice_date", label: "Invoice Date" },
                    { value: "due_date", label: "Due Date" },
                    ...(roleType?.includes("Management")
                      ? [
                          { value: "calculated_amount", label: "Amount" },
                          { value: "calculated_discount", label: "Discount" },
                          { value: "withhold_tax", label: "Withhold Tax" },
                          { value: "calculated_subtotal", label: "Subtotal" },
                        ]
                      : []),
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
            {/* Debugger*/}
            {/* {process.env.NODE_ENV === "development" && (
              <div
                style={{
                  fontSize: "12px",
                  marginBottom: "10px",
                  color: "#666",
                }}
              >
                Debug - First transaction data:{" "}
                {JSON.stringify(transactions[0], null, 2)}
              </div>
            )} */}
            <DataTable
              columns={columns}
              data={transactions.map((t) => ({
                ...t,
                // Keep the original values as fallback
                total_amount: t.total_amount || 0,
                item_discount: t.item_discount || 0,
                transaction_discount: t.transaction_discount || 0,
                // Ensure calculated values are properly mapped
                calculated_amount: t.calculated_amount || 0,
                calculated_discount: t.calculated_discount || 0,
                calculated_subtotal: t.calculated_subtotal || 0,
              }))}
              customStyles={customStyles}
              className="dataTable"
              noDataComponent="No transactions found"
            />
            <PaginationControls {...pagination} />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterColumn("all");
                setSearchTerm("");
                handleClose();
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
                    {/* <div className="mt-2">
                      <input type="checkbox" checked={onlinePaymentCheckbox} onChange={handleOnlineCheck} />
                      <label>Online</label>
                    </div>
                    <div className="mt-2">
                      <input type="checkbox" checked={checkCheque} onChange={handleCheque} />
                      <label>Check</label>
                    </div> */}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      Online / Check{" "}
                      <span
                        style={{ fontSize: "0.8rem", fontWeight: "normal" }}
                      >
                        (Optional)
                      </span>
                    </Form.Label>
                    <Form.Select
                      className="form-select"
                      onChange={(e) => {
                        setCheckOrOnline(e.target.value);
                        if (e.target.value == "Check") {
                          setSubject1("");
                          setSubject2("");
                          setSubject3("");
                          setRefNumber("");
                          setCheckNumber("");
                          setIsSubject2Disabled(true);
                          setIsSubject3Disabled(true);
                        }
                      }}
                      value={checkOrOnline}
                    >
                      <option value="" selected disabled>
                        Select
                      </option>
                      <option value="Online">Online</option>
                      {selectedPayment !== "Cash" && (
                        <option value="Check">Check</option>
                      )}
                    </Form.Select>
                  </Form.Group>

                  {checkOrOnline !== "Check" && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        Subject 1 <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        className="form-select"
                        onChange={handleSubject1Change}
                        value={subject1}
                        required={checkOrOnline !== "Check"}
                        disabled={items.length == 0}
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
                  )}

                  {checkOrOnline !== "Check" && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        Subject 2 <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        className="form-select"
                        onChange={(e) =>
                          handleSubject2Change(
                            e,
                            e.target.options[
                              e.target.selectedIndex
                            ].getAttribute("data-subject-type")
                          )
                        }
                        value={subject2}
                        disabled={isSubject2Disabled}
                        required={checkOrOnline !== "Check"}
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
                      </Form.Select>
                    </Form.Group>
                  )}

                  {checkOrOnline !== "Check" && (
                    <Form.Group className="mb-3" controlId="accountName">
                      <Form.Label className="fw-bold">
                        Accounts <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        value={subject3}
                        className="p-2"
                        onChange={handleAccountChange}
                        required={checkOrOnline !== "Check"}
                        disabled={isSubject3Disabled}
                      >
                        <option value="" disabled selected>
                          Select Account name
                        </option>
                        {subject3DataList.map((data) => (
                          <option key={data.id} value={data.id}>
                            {data.account_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}

                  {checkOrOnline === "Check" && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[0-9-]*$/.test(value) && value.length <= 15) {
                            setCheckNumber(value);
                          }
                        }}
                        required={checkOrOnline === "Check"}
                      />
                    </Form.Group>
                  )}

                  {checkOrOnline === "Online" && (
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

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>
                      Amount <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">₱</span>
                      <Form.Control
                        type="text"
                        className="p-2"
                        required
                        placeholder="0.00"
                        value={amount}
                        onInput={onInputFloat}
                        onChange={(e) => handleAmountValue(e.target.value)}
                      />
                    </div>
                    {/* <span>
                      Account Balance:{" "}
                      <strong>
                        {bankAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span> */}
                  </Form.Group>

                  {selectedPayment === "Bank" && (
                    <Form.Group className="mb-3" controlId="date">
                      <Form.Label>
                        Collection Date <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      {/* <Form.Control
                        type="date"
                        required
                        className="p-2"
                        value={date}
                        onChange={handleIssuedDate}
                      /> */}
                      <div>
                        <DatePicker
                          selected={date}
                          onChange={handleIssuedDate}
                          dateFormat="MMM dd, yyyy"
                          required
                          customInput={<CustomInput />}
                        />
                      </div>
                    </Form.Group>
                  )}

                  {/* For Cash payment, show collection date but without input */}
                  {selectedPayment === "Cash" && (
                    <Form.Group className="mb-3" controlId="date">
                      <Form.Label>
                        Collection Date <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      {/* <Form.Control
                        type="date"
                        className="p-2"
                        value={date}
                        readOnly // Makes it uneditable
                      /> */}
                      <div>
                        <DatePicker
                          selected={date}
                          dateFormat="MMM dd, yyyy"
                          className="form-control p-2"
                          readOnly
                        />
                      </div>
                    </Form.Group>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 p-2"
                    disabled={balance_now === 0}
                  >
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
                    <table
                      className="table table-bordered table-hover"
                      id="local-collection-payment-list"
                    >
                      <thead>
                        <tr>
                          <th className="p-2">Type</th>
                          <th className="p-2">Account Name</th>
                          <th
                            className={
                              roleType?.includes("Management")
                                ? "p-2"
                                : "d-none"
                            }
                          >
                            Amount
                          </th>
                          <th className="p-2">Check Number</th>
                          <th className="p-2">Ref Number</th>
                          <th className="p-2">Issued Date</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floatPayment.map((data, i) => (
                          <tr key={i}>
                            <td>{data.paymentMethod}</td>
                            <td>{data.accountName}</td>
                            <td
                              className={
                                roleType?.includes("Management") ? "" : "d-none"
                              }
                            >
                              <Form.Control
                                type="text"
                                value={
                                  editableRow === i
                                    ? editedData.amount
                                    : data.amount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                }
                                onChange={(e) => handleInputChange(e, "amount")}
                                onBlur={() => handleBlur(i)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleBlur(i)
                                }
                                disabled={editableRow !== i}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={
                                  editableRow === i
                                    ? editedData.checkNumber
                                    : data.checkNumber || "--"
                                }
                                onChange={(e) =>
                                  handleInputChange(e, "checkNumber")
                                }
                                onBlur={() => handleBlur(i)}
                                disabled={editableRow !== i}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={
                                  editableRow === i
                                    ? editedData.refNumber
                                    : data.refNumber || "--"
                                }
                                onChange={(e) =>
                                  handleInputChange(e, "refNumber")
                                }
                                onBlur={() => handleBlur(i)}
                                disabled={editableRow !== i}
                              />
                            </td>
                            <td>
                              {/* <Form.Control
                                type="date"
                                value={
                                  editableRow === i
                                    ? editedData.issuedDate
                                    : data.issuedDate
                                }
                                onChange={(e) =>
                                  handleInputChange(e, "issuedDate")
                                }
                                onBlur={() => handleBlur(i)}
                                disabled={editableRow !== i}
                              /> */}
                              <DatePicker
                                selected={
                                  editableRow === i
                                    ? editedData.issuedDate
                                    : data.issuedDate
                                }
                                onChange={(date) => {
                                  handleInputChange(date, "issuedDate");
                                }}
                                onBlur={() => handleBlur(i)}
                                dateFormat="MMM dd, yyyy"
                                customInput={<CustomInput index={i} />}
                              />
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleEditClick(i, data)}
                              >
                                <i className="fa-solid fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeletePayment(i)}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div
                className={
                  roleType?.includes("Management")
                    ? "w-100 border shadow-sm p-2 rounded"
                    : "d-none"
                }
              >
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Balance Details</span>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Last Balance</span>
                      <span className="text-secondary">
                        {lastBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">New Balance</span>
                      <span className="text-white text-underline">
                        {balance_now.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm"></div>
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Cash</span>
                      <span className="text-secondary">
                        {totalCashPaid.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Bank</span>
                      <span className="text-secondary">
                        {totalBankPaid.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Check</span>
                      <span className="text-secondary">
                        {totalCheckPaid.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Online</span>
                      <span className="text-secondary">
                        {totalOnlinePaid.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Total Payment</span>
                      <span className="text-white text-underline">
                        {totalPayment.toLocaleString("en-US", {
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
                  <button
                    className="btn btn-outline-secondary w-100 me-3"
                    onClick={() => navigate("/sales/local-collections")}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary w-100"
                    type="button"
                    onClick={handleSavePayment}
                    disabled={totalPayment === 0}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCollection;
