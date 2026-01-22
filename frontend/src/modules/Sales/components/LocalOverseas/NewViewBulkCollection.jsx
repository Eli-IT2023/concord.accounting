import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../../assets/global/url";
import {
  useNavigate,
  useParams,
  Link,
  useSearchParams,
} from "react-router-dom";
import swal from "sweetalert";
import { customStyles } from "../../../../assets/table-style";
import DataTable from "react-data-table-component";
import { jwtDecode } from "jwt-decode";
import useDecodeToken from "../../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  PaginationControls,
  usePagination,
} from "../../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import Select from "react-select";
import { selectCustomStyles } from "../../../../assets/global/selectCustomStyles";
import { useDateValidation } from "../../../../hooks/customHook/useDateValidation";
import { truncateToTwoDecimals } from "../../../../utils/numberFormatter";
import CustomDatePicker from "../../../../components/CustomDatePicker";
import { usePostedCutoffValidation } from "../../../../hooks/customHook/usePostedCutoffValidation";

const NewViewBulkCollection = ({
  authrztn,
  setId,
  setIdToAdd,
  setEdit, // To determine if user is still editing then suddenly navigates to other page
  setRoute,
}) => {
  const userLoggedID = useDecodeToken();
  const { dateValidation } = useDateValidation();
  const { postedCutoffValidation } = usePostedCutoffValidation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [module, setModule] = useState("Local");
  const [currencyName, setCurrencyName] = useState("");
  const [checkOrOnline, setCheckOrOnline] = useState("");

  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [cutOffData, setCutOffData] = useState([]);
  const [bulkCollectionData, setBulkCollectionData] = useState([]);
  const [status, setStatus] = useState("");

  const [validated, setValidated] = useState(false);
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isCustomerDisabled, setIsCustomerDisabled] = useState(true);
  const [isTransactionDisabled, setIsTransactionDisabled] = useState(true);

  const [localCustomerData, setLocalCustomerData] = useState([]);
  const [currency_db, setCurrency_db] = useState([]);

  const [date, setDate] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true);
  const [selected_currency_id, setSelected_currency_id] = useState("");

  const [selectedPayment, setSelectedPayment] = useState("Bank");
  const [bankAmount, setBankAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [floatPayment, setFloatPayment] = useState([]);

  const [existingTransactionIds, setExistingTransactionIds] = useState(
    new Set(),
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [removeIds, setRemoveIds] = useState([]);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [payAddedTransactions, setPayAddedTransactions] = useState([]);
  const [removeIdsPaymentList, setRemoveIdsPaymentList] = useState([]);
  const [selectedRowTransactions, setSelectedRowTransactions] = useState([]);
  const [transactionToGetBack, setTransactionToGetBack] = useState([]);

  const [isVisibleLiabNote, setIsVisibleLiabNote] = useState(false);

  const [currencyRate, setCurrencyRate] = useState(1);

  const submitModal = () => {
    const mergedData = [
      ...new Set([...selectedRow, ...selectedRowTransactions]),
    ];

    fetchTransactions(mergedData);

    setSelectedRowTransactions(mergedData);

    setFilterColumn("all");
    setSearchTerm("");
    // setSelectedRow([]);
    pagination.setCurrentPage(1);
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
      name: "Invoice Date",
      selector: (row) => format(row.invoice_date, "MMM/dd/yyyy"),
    },
    {
      name: "Due Date",
      selector: (row) =>
        row.due_date ? format(row.due_date, "MMM/dd/yyyy") : "",
    },
    {
      name: "DR Number/ Container Number",
      selector: (row) => row.dr_number || row.container_number,
      width: "18rem",
    },
    {
      name: "PO Number",
      selector: (row) => row.po_number,
    },
    {
      name: "Amount",
      selector: (row) => truncateToTwoDecimals(row.total_amount),
    },
    {
      name: "Discount",
      selector: (row) =>
        truncateToTwoDecimals(row.item_discount + row.transaction_discount),
    },
  ];

  // Function to add a new row
  const addNewItem = () => {
    fetchTransactions(selectedRow);

    handleShow();
  };

  // Function to delete a row
  const deleteItem = async (item, index) => {
    setItems((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((itemRow) => itemRow !== item.transaction_id);
    });

    setSelectedRowTransactions((prev) => {
      return prev.filter((itemRow) => itemRow !== item.transaction_id);
    });

    setRemoveIds((prev) => {
      return [...prev, item.sales_invoice_id];
    });

    if (item.payAdded === true) {
      await axios.put(`${BASE_URL}/bulkcollection/deleteOrderListTransaction`, {
        id,
        idToRemove: item.sales_invoice_id,
      });

      setTransactionToGetBack((prev) => [...prev, item.sales_invoice_id]);
      setIdToAdd((prev) => [...prev, item.sales_invoice_id]);
      setId(id);
      setRoute("bulkcollection");
    }
  };

  // Function to toggle edit mode
  const toggleEdit = (index) => {
    setEditIndex(editIndex === index ? null : index);
  };

  const fetchCurrency = async (currency_id) => {
    await axios
      .get(BASE_URL + "/currency/fetchCurrency")
      .then((response) => {
        setCurrency_db(response.data);
        setCurrencyName(
          response.data.find(
            (currency) => String(currency.id) === String(currency_id),
          )?.currency_name || "",
        );
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const fetchCustomer = async () => {
    await axios
      .get(BASE_URL + "/bulkcollection/getCustomerData")
      .then((response) => {
        setLocalCustomerData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/bulkcollection/getCutoff")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCurrencyChange = (value) => {
    setSelected_currency_id(value);
    setCurrencyName(
      currency_db.find((currency) => String(currency.id) === String(value))
        ?.currency_name || "",
    );

    // Fetch customers based on the selected currency
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
        });

        setLocalCustomerData(uniqueCustomers); // Update customers for selected currency
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    if (customerId) {
      axios
        .get(
          `${BASE_URL}/bulkcollection/getTransactionsByCustomer/${customerId}/${selected_currency_id}`,
        )
        .then((res) => {
          setTransactions(res.data);
          setIsTransactionDisabled(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setTransactions([]);
    }
  };

  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      setIsVisibleLiabNote(false);
      account_selected = "Account-List";
    } else if (selectedSubject1 === "Asset Account") {
      setIsVisibleLiabNote(false);
      account_selected = "Asset Account";
    } else if (selectedSubject1 === "Liabilities Account") {
      setIsVisibleLiabNote(true);
      account_selected = "Liabilities Account";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      setIsVisibleLiabNote(false);
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
        .get(`${BASE_URL}/bulkcollection/getSubject1LocalCollection`, {
          params: {
            account_selected: account_selected,
            selectedPayment,
            selected_currency_id,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);
          setSubject2("");
          setSubject3("");
          setIsSubject2Disabled(false);
          setIsSubject3Disabled(true);
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
        .get(`${BASE_URL}/bulkcollection/getSubject3LocalCollection`, {
          params: {
            subjectId: selectedSubject2?.value,
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

  const totalCashPaid = floatPayment.reduce(
    (acc, data) =>
      data.paymentMethod === "Cash" ? acc + parseFloat(data.amount || 0) : acc,
    0,
  );

  const totalBankPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber === "" &&
      data.refNumber === "" &&
      data.paymentMethod === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0,
  );

  const totalCheckPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber !== "" ? acc + parseFloat(data.amount || 0) : acc,
    0,
  );

  const totalOnlinePaid = floatPayment.reduce(
    (acc, data) =>
      data.refNumber !== "" && data.paymentMethod === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0,
  );

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
  };

  const handleAccountChange = (selectedOption) => {
    const selectedAccountId = selectedOption?.value;
    setSubject3(selectedOption);

    // Find the selected account in the accountListData
    const selectedAccount = subject3DataList.find(
      (account) => account.id === String(selectedAccountId),
    );

    // If the account is found, update the bankAmount state with the amount
    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    }
  };

  const toPayAmount = parseFloat(totalAmountSum);

  const balance_now = toPayAmount - totalPayment;
  const [lastBalance, setLastBalance] = useState(0);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

  const handleAmountValue = (value) => {
    if (value === ".") {
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

    let numericValue = parseFloat(formatAmount);

    setAmount(formattedValue);

    // Validation: Prevent payment amount from exceeding balance
    if (parseNumber(formattedValue) > balance_now) {
      swal({
        icon: "error",
        title: "Oppss!",
        text: "Please input not greater than the balance",
      }).then(() => {
        setAmount("");
      });
    }
  };

  const handleCollectionDate = (date) => {
    const collectionDate = date;
    setCollectionDate(collectionDate);

    dateValidation(date, setCollectionDate, "Transaction Date");

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

    dateValidation(date, setDate, "Collection Date");
    postedCutoffValidation(date, setDate, "Collection Date");

    // Add safety check
    if (!Array.isArray(cutOffData) || cutOffData.length === 0) {
      console.warn("Cutoff data not available yet");
      return;
    }

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
        title: "Issued Date Conflict",
        text: "The issued date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setDate("");
      });
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

    const form = e.currentTarget;
    setIsVisibleLiabNote(false);
    let formatAmount = amount?.replace(/,/g, "");
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
      dateValidation(date, setDate, "Collection Date");
      postedCutoffValidation(date, setDate, "Collection Date");
      swal({
        title: "Add this payment?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        const isForApproval = status === "For Approval";
        const newPayment = {
          paymentMethod: selectedPayment,
          subject1: subject1,
          subject2: subject2?.value,
          subject3: subject3?.value,
          accountName: accountName,
          amount: parseFloat(formatAmount),
          issuedDate: date,
          checkNumber: checkNumber,
          refNumber: refNumber,
          checkOrOnline: checkOrOnline || null,
          status: "Approved",
        };

        if (confirmed) {
          setFloatPayment((prevPayments) => {
            // Check for matching payment based on all the conditions
            const existingPaymentIndex = prevPayments.findIndex(
              (payment) =>
                payment.subject3 === newPayment.subject3 &&
                payment.issuedDate === newPayment.issuedDate &&
                // First condition: match by paymentMethod, checkNumber, and issuedDate
                ((payment.paymentMethod === newPayment.paymentMethod &&
                  payment.checkNumber === newPayment.checkNumber) ||
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
                  (payment.paymentMethod === "Bank" &&
                    newPayment.paymentMethod === "Bank" &&
                    payment.refNumber === newPayment.refNumber)),
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
            setSelectedPayment("Bank");
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

        // Handle payment for approved collections
        if (confirmed && !isForApproval) {
          try {
            const res = await axios.post(`${BASE_URL}/invoice/payment`, {
              bulkCollectionId: id,
              newPayment,
              transactionNumber: bulkCollectionData.transaction_number,
              userLoggedID,
              module,
            });

            if (res.status === 201) {
              swal({
                icon: "success",
                title: "Payment Added",
                text: "The new payment has been added successfully",
                buttons: false,
                timer: 2000,
              }).then(() => {
                setValidated(false);
                setSelectedPayment("Bank");
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
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
    setValidated(true);
  };

  console.log(totalAmountSum, "totalamountsum");

  const handleUpdateLocalCollection = async (e) => {
    //save buttonm
    e.preventDefault();
    const form = e.currentTarget;

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

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      if (items.length == 0) {
        swal({
          title: "Opppss!",
          text: "Please add atleast one item to the Order List.",
          icon: "error",
          button: true,
        });
        return;
      }
      swal({
        title: "Update this collection?",
        text: "Please confirm to update this collection",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/bulkcollection/update`, {
              items,
              selectedCustomerId: selectedCustomerId?.value,
              collectionDate,
              floatPayment,
              userLoggedID,
              balance_now,
              id,
              removeIds: [...new Set(removeIds)],
              removeIdsPaymentList,
              totalAmount: totalAmountSum,
              currencyRate,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Local collection updated successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate(`/sales/view-local-bulk-collection/${id}`);
                  setValidated(false);
                  setSelectedPayment("Bank");
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
                  setIsEditing(false);
                  setTransactionToGetBack([]);
                  setIdToAdd([]);
                  setId(null);
                  setEdit(false);
                  setSelectedRow([]);
                  setSelectedRowTransactions([]);
                  window.onbeforeunload = null;
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
            });
        }
      });
    }
    // setValidated(true);
  };

  const handleApproveRejectLocalCollection = async (e, action) => {
    const message =
      action === "approve"
        ? "Approve this collection?"
        : "Reject this collection?";
    const status = action === "approve" ? "Approved" : "Rejected";

    console.log(`floatPayment`, floatPayment);

    const confirmed = await swal({
      title: message,
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      const currency = currency_db.find((c) => c.id === selected_currency_id); // For sales journal
      try {
        const transaction_num = bulkCollectionData.transaction_number;
        const res = await axios.post(
          `${BASE_URL}/bulkcollection/collections/approve-reject`,
          {
            id,
            status,
            items,
            floatPayment,
            collectionDate,
            userLoggedID,
            transaction_num,
            module,
            salesJournal: {
              customerId: selectedCustomerId,
              paymentType: "Credit",
              currencyName: currency.currency_name,
              currencyRate: currency.currency_rate,
            },
          },
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text:
              action === "approve"
                ? "Local collection has been approved"
                : "Local collection has been rejected",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(
              `/sales/local-collections?page=${searchParams.get("page")}`,
            );
          });
        } else if (res.status === 202) {
          const { invoiceDate, CutoffName, status } = res.data;
          let invoiceStatus;
          if (status == "Approved") {
            invoiceStatus = "Approval";
          } else {
            invoiceStatus = "Rejection";
          }
          swal({
            title: `${invoiceStatus} Declined`,
            text: `Transaction cannot be ${status} as its collection date (${invoiceDate}) falls within the posted cutoff period named "${CutoffName}".`,
            icon: "warning",
            button: "OK",
          });
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          swal({
            title: "Failed to Update Collection",
            text:
              error.response.data.message ||
              "Failed to update local collection.",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          });
        } else {
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
      }
    }
    setValidated(true);
  };

  const fetchLocalBulkCollection = () => {
    axios
      .get(`${BASE_URL}/bulkcollection/viewLocalBulkCollection`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const { data, isPosted, cutoffExists } = res.data;
          setBulkCollectionData(data);
          setSelectedCustomerId(data.customer_id);
          setSelected_currency_id(data.currency_id);
          setCollectionDate(data.collection_date);
          setCurrencyRate(data.rate);
          fetchCurrency(data.currency_id);
          setIsCutoffPosted(isPosted);
          setIsCutoffExists(cutoffExists);
          setStatus(data.status);
          setModule(data.type);

          if (
            data.bulk_collection_transactions &&
            data.bulk_collection_transactions.length > 0
          ) {
            const existingIds = new Set(
              data.bulk_collection_transactions.map((transaction) =>
                transaction.sales_invoice.sales_invoice_id.toString(),
              ),
            );
            setExistingTransactionIds(existingIds);
            console.log(data.bulk_collection_transactions);

            const mappedItems = data.bulk_collection_transactions.map(
              (transaction) => ({
                sales_invoice_id: transaction.sales_invoice_id,
                transaction_id: transaction.sales_invoice.transaction_id,
                client_transaction_id:
                  transaction.sales_invoice.client_transaction_id,
                remarks: transaction.sales_invoice.remarks,
                invoice_date: new Date(transaction.sales_invoice.createdAt)
                  .toISOString()
                  .split("T")[0],
                due_date: transaction.sales_invoice.due_date,
                total_amount: transaction.sales_invoice.total_amount,
                transaction_discount:
                  parseFloat(transaction.sales_invoice.transaction_discount) ||
                  0,
                item_discount:
                  parseFloat(transaction.sales_invoice.item_discount) || 0,
                discount_type: transaction.sales_invoice.discount_type,
                payAdded: transaction.sales_invoice.payAdded,
              }),
            );
            setItems(mappedItems);
          }

          const formattedPayments = data.bulk_collection_payments.map(
            (payment) => ({
              id: payment.id,
              paymentMethod: payment.payment_type,
              accountName: payment.account_list_sub3
                ? payment.account_list_sub3.account_name
                : "",
              amount: payment.amount,
              checkNumber: payment.check_number || "",
              refNumber: payment.ref_number || "",
              issuedDate: payment.date_issued,
              subject3: payment.account_list_sub3_id,
              checkOrOnline: payment.check_or_online || null,
              status: payment.status,
            }),
          );

          setFloatPayment(formattedPayments);

          const total = formattedPayments.reduce(
            (acc, payment) => acc + payment.amount,
            0,
          );
          setTotalPayment(total);
        }
      })
      .catch((err) => console.log(err));
  };

  const pagination = useServerPagination(
    `${BASE_URL}/bulkcollection/getTransactionsByCustomerLocal`,
    10,
  );

  const paginationHook = usePagination(transactions, 10);

  const fetchTransactions = async (selectedRowTransactions) => {
    pagination.updateParams({
      customer_id: bulkCollectionData.customer_id,
      selected_currency_id,
      searchText: searchTerm,
      filterColumn,
      selectedRow: selectedRowTransactions,
    });
  };

  console.log(items, "items");

  const getAvailableTransactionIds = (index) => {
    const selectedTransactionIds = items
      .map((item, idx) => (idx !== index ? item.transactionId : null))
      .filter((id) => id);

    if (index === 0) {
      return transactions.filter(
        (transaction) =>
          !selectedTransactionIds.includes(
            transaction.sales_invoice_id.toString(),
          ) ||
          items[index].transactionId ===
            transaction.sales_invoice_id.toString(),
      );
    }

    const firstRowTransactionId = items[0].transactionId;
    return transactions.filter((transaction) => {
      const transactionIdStr = transaction.sales_invoice_id.toString();
      return (
        (!selectedTransactionIds.includes(transactionIdStr) &&
          transactionIdStr !== firstRowTransactionId &&
          transaction.payAdded === false) ||
        items[index].transactionId === transactionIdStr
      );
    });
  };

  const handleTransactionChange = (index, transactionId) => {
    const transaction = transactions.find(
      (t) => t.sales_invoice_id === String(transactionId),
    );
    console.log(transaction);
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
    }
  };

  const handleDeletePayment = (index, data) => {
    setFloatPayment((prevPayments) => {
      // Remove the payment at the specified index
      const updatedPayments = prevPayments.filter((_, i) => i !== index);

      // Calculate the new total payment after deletion
      const newTotalPayment = updatedPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0,
      );
      setTotalPayment(newTotalPayment);

      return updatedPayments;
    });

    if (data.id) {
      setRemoveIdsPaymentList((prev) => [...prev, data.id]);
    }
  };

  const isTableDisabled =
    bulkCollectionData.status === "Approved" ||
    bulkCollectionData.status === "Rejected";

  const isPaymentInputDisabled =
    balance_now === 0 ||
    (balance_now === 0 && !isEditing) ||
    (status === "For Approval" && !isEditing);

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

  // Currency List
  const currencyList = {
    PHP: "Philippine Peso (Philippines)",
    USD: "US Dollar (United States)",
    CNY: "Chinese Yuan (China)",
    HKD: "Hong Kong Dollar (Hong Kong)",
    EUR: "Euro (European Union)",
    JPY: "Japanese Yen (Japan)",
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ label, value, onClick, generateYears, index }, ref) => (
      <input
        type="text"
        className="form-control w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
          padding: `${index !== undefined ? "0.4rem" : "0.5rem"}`,
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
        disabled={
          label === "Transaction Date" ? !isEditing : isPaymentInputDisabled
        }
      />
    ),
  );

  if (isEditing === true) {
    window.onbeforeunload = (e) => {
      e.preventDefault();
      const payload = JSON.stringify({ id, idToAdd: transactionToGetBack });
      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(
        `${BASE_URL}/bulkcollection/getBackOrderListTransaction`,
        blob,
      );

      setIsEditing(false);
      window.onbeforeunload = null; // To clean up the event listener
      return "";
    };
  }

  useEffect(() => {
    if (selectedPayment === "Cash") {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setDate(currentDate);
    }
  }, [selectedPayment]);

  useEffect(() => {
    const sum = items.reduce(
      (acc, item) => acc + parseFloat(item.total_amount || 0),
      0,
    );
    setTotalAmountSum(sum);
  }, [items]);

  useEffect(() => {
    fetchLocalBulkCollection();
  }, [id, isEditing]);

  useEffect(() => {
    fetchTransactions(selectedRowTransactions);
  }, [bulkCollectionData.customer_id]);

  useEffect(() => {
    fetchCustomer();
    fetchCutOff();
  }, []);

  useEffect(() => {
    fetchTransactions(selectedRowTransactions);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    setTransactions(pagination.data.data);

    if (pagination?.data?.items) {
      // Skip if all selectedRows already exist in items
      const existingIds = items.map((item) => item.transaction_id);
      const isFullySynced =
        selectedRow.every((id) => existingIds.includes(id)) &&
        items.length === selectedRow.length;

      if (isFullySynced) return;

      const newItems = pagination.data.items.filter(
        (item) =>
          selectedRow.includes(item.transaction_id) &&
          !existingIds.includes(item.transaction_id),
      );

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
      }
    }
  }, [pagination.data.data]);

  // function to handle currency rate formatting (similar to create_invoice.jsx)
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
    <div className="h-100 w-100 bg-white custom-container">
      <div className="w-100 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link to="/sales/local-collections" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            NEW COLLECTIONS OVERVIEW
          </span>
          <p className="fs-6">
            Status:{" "}
            <span
              style={{
                color:
                  bulkCollectionData.status === "For Approval"
                    ? "orange"
                    : bulkCollectionData.status === "Approved"
                      ? "green"
                      : "red",
                textTransform: "uppercase",
              }}
            >
              {bulkCollectionData.status}
            </span>
          </p>
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
              value={bulkCollectionData.transaction_number}
              readOnly
            />
          </div>
          <div className="col-sm">
            <span>Transaction Date</span>
            <CustomDatePicker
              label={"Transaction Date"}
              selected={collectionDate ? new Date(collectionDate) : ""}
              handleDateChange={handleCollectionDate}
              setter={setCollectionDate}
              CustomInput={CustomInput}
              isRequired={true}
              validated={validated}
              dateValidation={dateValidation}
            />
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
                disabled
                value={selected_currency_id}
              >
                <option value="" selected disabled>
                  Select Currency
                </option>
                {currency_db.map((data) => (
                  <option key={data.id} value={data.id}>
                    {data.currency_name} - {currencyList[data.currency_name]}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          {selected_currency_id &&
          selected_currency_id != "11111111-1111-1111-1111-111111111111" ? (
            <div className="col-sm">
              <span>Currency Rate</span>
              <Form.Control
                type="text"
                name=""
                id=""
                className="form-control p-2"
                required
                onChange={handleCurrencyRateChange}
                value={currencyRate}
                disabled={!isEditing}
              />
            </div>
          ) : (
            <div className="col-sm">
              <span>Customer</span>
              <div className="input-group mb-2">
                <Form.Select
                  name=""
                  id=""
                  className="form-select p-2"
                  required
                  value={selectedCustomerId}
                  disabled
                >
                  <option value="" selected disabled>
                    Select Customer
                  </option>
                  {localCustomerData.map((customer, i) => (
                    <option key={i} value={customer.customer_id}>
                      {!customer.firstname || !customer.last_name
                        ? customer.company_name
                        : `${customer.first_name} ${customer.last_name}`}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          )}
        </div>
        {selected_currency_id &&
        selected_currency_id != "11111111-1111-1111-1111-111111111111" ? (
          <div className="row p-2">
            <div className="col-sm">
              <span>Customer</span>
              <div className="input-group mb-2">
                <Form.Select
                  name=""
                  id=""
                  className="form-select p-2"
                  required
                  value={selectedCustomerId}
                  disabled
                >
                  <option value="" selected disabled>
                    Select Customer
                  </option>
                  {localCustomerData.map((customer, i) => (
                    <option key={i} value={customer.customer_id}>
                      {!customer.firstname || !customer.last_name
                        ? customer.company_name
                        : `${customer.first_name} ${customer.last_name}`}
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
                  placeholder="0.00"
                  value={truncateToTwoDecimals(totalAmountSum)}
                  readOnly
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="container-fluid">
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
                  <th className="p-2">Invoice Date</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Discount</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              {items.length > 0 ? (
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="d-none form-control form-control-sm p-2"
                          readOnly
                          value={item.transaction_id || ""}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.client_transaction_id || ""}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.remarks || ""}
                        />
                      </td>
                      <td>
                        <DatePicker
                          selected={item.invoice_date}
                          dateFormat="MMM/dd/yyyy"
                          className="form-control form-control-sm p-2"
                          readOnly
                        />
                      </td>
                      <td>
                        <DatePicker
                          selected={item.due_date}
                          dateFormat="MMM/dd/yyyy"
                          className="form-control form-control-sm p-2"
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={truncateToTwoDecimals(item.total_amount)}
                          readOnly
                        />
                      </td>
                      <td className="text-center">
                        <div className="input-group mb-2">
                          <Form.Control
                            type="text"
                            className="form-control-sm p-2"
                            id="inlineFormInputGroup"
                            placeholder={
                              item.discountType === "percentage"
                                ? "Discount (%)"
                                : "Discount (0.00)"
                            }
                            value={truncateToTwoDecimals(
                              item.item_discount + item.transaction_discount,
                            )}
                            readOnly
                          />
                          <div className="input-group-prepend">
                            <div
                              className="input-group-text bg-white custom-discount-btn"
                              disabled
                            >
                              {item.discount_type === "percentage"
                                ? "%"
                                : "0.00"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-danger "
                          disabled={
                            bulkCollectionData.status !== "For Approval" ||
                            !isEditing ||
                            (items.length === 1 && index === 0)
                          }
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
        {bulkCollectionData.status === "For Approval" && (
          <>
            <div className="w-100 d-flex justify-content-end mt-2">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={addNewItem}
                disabled={isTableDisabled || !isEditing}
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
                      onChange={(e) => {
                        let input = e.target.value;

                        // Remove commas
                        const raw = String(input).replace(/,/g, "");

                        const [intPart, decimalPart] = raw.split(".");

                        // Add commas to integer part
                        const withCommas = intPart.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ",",
                        );

                        // Join back decimal part if it exists
                        const formatted =
                          decimalPart !== undefined
                            ? `${withCommas}.${decimalPart}`
                            : withCommas;

                        if (
                          transactions.find((item) => {
                            const price = item.total_amount;
                            const precision17 = Number(
                              price.toPrecision(17),
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
                        // { value: "transaction_id", label: "Transaction ID" },
                        // { value: "remarks", label: "Remarks" },
                        { value: "invoice_date", label: "Invoice Date" },
                        { value: "due_date", label: "Due Date" },
                        {
                          value: "dr_number",
                          label: "DR Number / Container Number",
                        },
                        {
                          value: "po_number",
                          label: "PO Number",
                        },
                        { value: "total_amount", label: "Amount" },
                        { value: "discount", label: "Discount" },
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
                  columns={columns}
                  data={transactions}
                  customStyles={customStyles}
                  className="dataTable"
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
          </>
        )}
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
                        disabled={isPaymentInputDisabled}
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
                        disabled={isPaymentInputDisabled}
                      />
                    </div>
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
                        if (e.target.value === "Check") {
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
                      disabled={isPaymentInputDisabled}
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
                        {isVisibleLiabNote && (
                          <span
                            className="fst-italic text-danger "
                            style={{ fontSize: 9.5 }}
                          >
                            (Please be advised that this liability will result
                            in a deduction from the selected account upon
                            collection)
                          </span>
                        )}
                      </Form.Label>
                      <Form.Select
                        className="form-select"
                        onChange={handleSubject1Change}
                        value={subject1}
                        required={checkOrOnline !== "Check"}
                        disabled={isPaymentInputDisabled}
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
                      <Select
                        options={subject2Options}
                        value={subject2}
                        onChange={(selectedOption) =>
                          handleSubject2Change(selectedOption)
                        }
                        placeholder={`Select Subject 2`}
                        styles={selectCustomStyles(subject2, validated)}
                        isDisabled={isSubject2Disabled}
                        required={checkOrOnline !== "Check"}
                        isSearchable
                      />
                    </Form.Group>
                  )}

                  {checkOrOnline !== "Check" && (
                    <Form.Group className="mb-3" controlId="accountName">
                      <Form.Label className="fw-bold">
                        Accounts <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Select
                        options={subject3Options}
                        value={subject3}
                        onChange={handleAccountChange}
                        placeholder={`Select Account name`}
                        styles={selectCustomStyles(subject3, validated)}
                        isDisabled={isSubject3Disabled}
                        required={checkOrOnline !== "Check"}
                        isSearchable
                      />
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
                          setCheckNumber(value);
                        }}
                        disabled={isPaymentInputDisabled}
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
                        disabled={isPaymentInputDisabled}
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <div className="input-group z-0">
                      <span className="input-group-text">{currencyName}</span>
                      <Form.Control
                        type="text"
                        className="p-2"
                        required
                        placeholder="0.00"
                        value={amount}
                        onInput={onInputFloat}
                        onChange={(e) => handleAmountValue(e.target.value)}
                        disabled={isPaymentInputDisabled}
                      />
                    </div>
                  </Form.Group>

                  {selectedPayment === "Bank" && (
                    <Form.Group className="mb-3" controlId="date">
                      <Form.Label>
                        Collection Date <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <CustomDatePicker
                        label={"Collection Date"}
                        selected={date ? new Date(date) : ""}
                        handleDateChange={handleIssuedDate}
                        setter={setDate}
                        CustomInput={CustomInput}
                        isRequired={true}
                        validated={validated}
                        dateValidation={dateValidation}
                        postedCutoffValidation={postedCutoffValidation}
                      />
                    </Form.Group>
                  )}

                  {selectedPayment === "Cash" && (
                    <Form.Group className="mb-3" controlId="date">
                      <Form.Label>
                        Collection Date <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <CustomDatePicker
                        label={"Collection Date"}
                        selected={date ? new Date(date) : ""}
                        handleDateChange={handleIssuedDate}
                        setter={setDate}
                        CustomInput={CustomInput}
                        isRequired={true}
                        validated={validated}
                        dateValidation={dateValidation}
                        postedCutoffValidation={postedCutoffValidation}
                      />
                    </Form.Group>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 p-2"
                    disabled={
                      balance_now === 0 ||
                      (balance_now === 0 && !isEditing) ||
                      (status === "For Approval" && !isEditing)
                    }
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
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th className="p-2">Type</th>
                          <th className="p-2">Account Name</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Check Number</th>
                          <th className="p-2">Ref Number</th>
                          <th className="p-2">Issued Date</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floatPayment.map((data, i) => (
                          <tr>
                            <td>{data.paymentMethod}</td>
                            <td>{data.accountName}</td>
                            <td>{truncateToTwoDecimals(data.amount)}</td>
                            <td>
                              {data.checkNumber === ""
                                ? "--"
                                : data.checkNumber}
                            </td>
                            <td>
                              {data.refNumber === "" ? "--" : data.refNumber}
                            </td>
                            <td>{format(data.issuedDate, "MMM/dd/yyyy")}</td>
                            <td className="text-center d-flex">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeletePayment(i, data)}
                                disabled={
                                  bulkCollectionData.status !==
                                    "For Approval" || !isEditing
                                }
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
              <div className="w-100 border shadow-sm p-2 rounded ">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Balance Details</span>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Last Balance</span>
                      <span className="text-secondary">
                        {truncateToTwoDecimals(lastBalance)}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">New Balance</span>
                      <span className="text-white text-underline">
                        {`${currencyName} ${truncateToTwoDecimals(
                          balance_now,
                        )}`}
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
                        {`${currencyName} ${truncateToTwoDecimals(
                          totalPayment,
                        )}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-4">
                <div className="col-sm"></div>
                <div className="col-sm"></div>
                <div className="col-sm">
                  <div className="row">
                    <div className="col-sm d-flex flex-row mb-2 w-100">
                      <div className="w-100 me-3">
                        {!isEditing &&
                          bulkCollectionData.status === "For Approval" && (
                            <button
                              className="btn btn-primary w-100 px-4"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsEditing(true);
                                setEdit(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                      </div>
                      {authrztn.includes("LocalCollections-Approve") &&
                      bulkCollectionData.status === "For Approval" &&
                      !isEditing ? (
                        <>
                          <button
                            className="btn btn-danger w-100 me-3"
                            type="button"
                            onClick={(e) =>
                              handleApproveRejectLocalCollection(e, "reject")
                            }
                            disabled={isCutoffPosted || !isCutoffExists}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-success w-100"
                            type="button"
                            onClick={(e) =>
                              handleApproveRejectLocalCollection(e, "approve")
                            }
                            disabled={isCutoffPosted || !isCutoffExists}
                          >
                            Approve
                          </button>
                        </>
                      ) : (
                        <>
                          {authrztn.includes("LocalCollections-Edit") &&
                            bulkCollectionData.status === "For Approval" && (
                              <>
                                {isEditing && (
                                  <>
                                    <button
                                      className="btn btn-secondary w-100 me-3"
                                      type="button"
                                      onClick={() => {
                                        swal({
                                          icon: "warning",
                                          title: "Are you sure?",
                                          text: "Your changes will not be saved",
                                          buttons: ["Cancel", "OK"],
                                          dangerMode: true,
                                        }).then((confirmed) => {
                                          if (confirmed) {
                                            const payload = JSON.stringify({
                                              id,
                                              idToAdd: transactionToGetBack,
                                            });
                                            const blob = new Blob([payload], {
                                              type: "application/json",
                                            });

                                            navigator.sendBeacon(
                                              `${BASE_URL}/bulkcollection/getBackOrderListTransaction`,
                                              blob,
                                            );

                                            setIsEditing(false);
                                            setTransactionToGetBack([]);
                                            setIdToAdd([]);
                                            setId(null);
                                            setEdit(false);
                                            setSelectedRow([]);
                                            setSelectedRowTransactions([]);
                                            window.onbeforeunload = null;
                                          }
                                          return;
                                        });
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="btn btn-primary w-100"
                                      type="button"
                                      onClick={handleUpdateLocalCollection}
                                    >
                                      Update
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                        </>
                      )}
                    </div>

                    {(authrztn.includes("LocalCollections-Edit") ||
                      authrztn.includes("LocalCollections-Approve")) &&
                      isCutoffPosted &&
                      bulkCollectionData.status !== "Claimed" && (
                        <div>
                          <p className="text-danger">
                            Action is prohibited as the transaction date has
                            already been posted.
                          </p>
                        </div>
                      )}

                    {(authrztn.includes("LocalCollections-Edit") ||
                      authrztn.includes("LocalCollections-Approve")) &&
                      !isCutoffExists &&
                      bulkCollectionData.status !== "Claimed" && (
                        <div>
                          <p className="text-danger">
                            Action is prohibited as the transaction date has not
                            been created.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewViewBulkCollection;
