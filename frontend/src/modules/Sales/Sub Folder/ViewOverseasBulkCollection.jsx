import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, useParams, Link } from "react-router-dom";
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

const ViewOverseasBulkCollection = ({ authrztn }) => {
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
  const [currencyName, setCurrencyName] = useState("");
  const [checkOrOnline, setCheckOrOnline] = useState("");

  const { id } = useParams();
  const [edit, setEdit] = useState(false);
  const [cutOffData, setCutOffData] = useState([]);
  const [bulkCollectionData, setBulkCollectionData] = useState([]);

  const [validated, setValidated] = useState(false);
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);

  const [localCustomerData, setLocalCustomerData] = useState([]);
  const [currency_db, setCurrency_db] = useState([]);

  const [date, setDate] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [selected_currency_id, setSelected_currency_id] = useState("");

  const [selectedPayment, setSelectedPayment] = useState("Bank");
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
  const [removeIds, setRemoveIds] = useState([]);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [payAddedTransactions, setPayAddedTransactions] = useState([]);

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

    setPayAddedTransactions((prev) => {
      return prev.filter((item) => !selectedRow.includes(item.transaction_id));
    });

    setFilterColumn("all");
    setSearchTerm("");
    setSelectedRow([]);
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
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Remarks",
      selector: (row) => row.remarks,
    },
    {
      name: "Invoice Date",
      selector: (row) => format(row.invoice_date, "MMM dd, yyyy"),
    },
    {
      name: "Due Date",
      selector: (row) => format(row.due_date, "MMM dd, yyyy"),
    },
    {
      name: "Amount",
      selector: (row) =>
        row.total_amount.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
    {
      name: "Discount",
      selector: (row) =>
        parseFloat(row.item_discount + row.transaction_discount),
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

    // const idToRemove = items[index]?.transactionId;
    // if (idToRemove) {
    //   setRemoveIds((prev) => {
    //     return [...new Set([...prev, idToRemove])];
    //   });
    // }
    setTransactions((prev) => {
      return [...prev, item];
    });

    setItems((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((item) => item !== item.transaction_id);
    });

    setRemoveIds((prev) => {
      return [...prev, item.sales_invoice_id];
    });

    if (item.payAdded == true) {
      setPayAddedTransactions((prev) => [...prev, item]);
    }
  };

  const fetchCurrency = async (currency_id) => {
    await axios
      .get(BASE_URL + "/currency/fetchCurrency")
      .then((response) => {
        setCurrency_db(response.data);
        setCurrencyName(
          response.data.find(
            (currency) => String(currency.id) === String(currency_id)
          )?.currency_name || ""
        );
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const fetchCustomer = async () => {
    await axios
      .get(BASE_URL + "/overseas_bulkcollection/getCustomerData")
      .then((response) => {
        setLocalCustomerData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/overseas_bulkcollection/getCutoffPosted")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
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

    try {
      axios
        .get(
          `${BASE_URL}/overseas_bulkcollection/getSubject1OverseasCollection`,
          {
            params: {
              account_selected: account_selected,
              selectedPayment,
            },
          }
        )
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
        .get(
          `${BASE_URL}/overseas_bulkcollection/getSubject3OverseasCollection`,
          {
            params: {
              subjectId: selectedSubject2,
              selected_currency_id,
            },
          }
        )
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

  useEffect(() => {
    const sum = items.reduce(
      (acc, item) => acc + parseFloat(item.total_amount || 0),
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
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0
  );

  const totalCheckPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber !== "" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const totalOnlinePaid = floatPayment.reduce(
    (acc, data) =>
      data.refNumber !== "" && data.paymentMethod === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0
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

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    setSubject3(selectedAccountId);

    // Find the selected account in the accountListData
    const selectedAccount = subject3DataList.find(
      (account) => account.id === String(selectedAccountId)
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

  const handleAmountValue = (value) => {
    if (value == ".") {
      setAmount((prev) => prev + ".");
    }
    let inputValue = value.replace(/[^0-9.]/g, "");
    if (inputValue) {
      inputValue = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formatAmount = inputValue.replace(/,/g, "");

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
      const cleanedValue = inputValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma
      setAmount(value.length > 1 ? cleanedValue : inputValue);
    }
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
        title: "Issued Date Conflict",
        text: "The issued date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setDate("");
      });
    }
  };

  useEffect(() => {
    if (selectedPayment === "Cash") {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setDate(currentDate);
    }
  }, [selectedPayment]);

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
      if (amount == 0) {
        swal({
          icon: "error",
          title: "Invalid Amount",
          text: "Please ensure the amount is greater than zero before submitting.",
          button: "OK",
        });
        return;
      }

      swal({
        title: "Add this payment?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        let formatAmount = amount.replace(/,/g, "");
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
            status: "Approved",
          };
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
                    payment.refNumber === newPayment.refNumber))
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
      });
    }
    setValidated(true);
  };

  const handleUpdateOverseasCollection = async (e) => {
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
            .post(`${BASE_URL}/overseas_bulkcollection/update`, {
              items,
              selectedCustomerId,
              collectionDate,
              floatPayment,
              balance_now,
              id,
              removeIds: [...new Set(removeIds)],
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Overseas collection updated successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate(`/sales/view-overseas-bulk-collection/${id}`);
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
                  setEdit(false);
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
    setValidated(true);
  };

  const handleApproveRejectLocalCollection = async (e, action) => {
    const message =
      action === "approve"
        ? "Approve this collection?"
        : "Reject this collection?";
    const status = action === "approve" ? "Approved" : "Rejected";

    if (parseFloat(balance_now.toFixed(2)) !== 0) {
      await swal({
        title: "Balance not settled",
        text: "Please ensure the balance is zero before approve the payment.",
        icon: "warning",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      });
      return;
    }

    const confirmed = await swal({
      title: message,
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const transaction_num = bulkCollectionData.transaction_number;

        const res = await axios.post(
          `${BASE_URL}/overseas_bulkcollection/approveRejectOverseasCollection`,
          {
            id,
            status,
            items,
            floatPayment,
            collectionDate,
            userLoggedID,
            transaction_num,
          }
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text:
              action === "approve"
                ? "Overseas collection has been approved"
                : "Overseas collection has been rejected",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate("/sales/overseas-collections");
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
              "Failed to update overseas collection.",
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

  useEffect(() => {
    axios
      .get(`${BASE_URL}/overseas_bulkcollection/viewOverseasBulkCollection`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const { data, isPosted } = res.data;
          setBulkCollectionData(data);
          setSelectedCustomerId(data.customer_id);
          setSelected_currency_id(data.currency_id);
          setCollectionDate(data.collection_date);
          fetchCurrency(data.currency_id);
          setIsCutoffPosted(isPosted);

          if (
            data.bulk_collection_transactions &&
            data.bulk_collection_transactions.length > 0
          ) {
            const existingIds = new Set(
              data.bulk_collection_transactions.map((transaction) =>
                transaction.sales_invoice.sales_invoice_id.toString()
              )
            );
            //   setExistingTransactionIds(existingIds);

            const mappedItems = data.bulk_collection_transactions.map(
              (transaction) => ({
                sales_invoice_id: transaction.sales_invoice_id,
                transaction_id: transaction.sales_invoice.transaction_id,
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
              })
            );
            setItems(mappedItems);
          }

          if (
            data.bulk_collection_payments &&
            data.bulk_collection_payments.length > 0
          ) {
            const formattedPayments = data.bulk_collection_payments.map(
              (payment) => ({
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
              })
            );

            setFloatPayment(formattedPayments);

            const total = formattedPayments.reduce(
              (acc, payment) => acc + payment.amount,
              0
            );
            setTotalPayment(total);
          }
        }
      })
      .catch((err) => console.log(err));
  }, [id]);

  const pagination = useServerPagination(
    `${BASE_URL}/overseas_bulkcollection/getTransactionsByCustomerOverseas`,
    10
  );

  const paginationHook = usePagination(transactions, 10);

  const fetchTransactions = async () => {
    pagination.updateParams({
      customer_id: bulkCollectionData.customer_id,
      selected_currency_id,
      searchText: searchTerm,
      filterColumn,
    });
    // try {
    //   if (bulkCollectionData.customer_id) {
    //     const response = await axios.get(
    //       `${BASE_URL}/overseas_bulkcollection/getTransactionsByCustomerOverseas`,
    //       {
    //         params: {
    //           customer_id: bulkCollectionData.customer_id,
    //           selected_currency_id,
    //           searchText: searchTerm,
    //           filterColumn,
    //         },
    //       }
    //     );
    //     setTransactions(
    //       payAddedTransactions.length > 0
    //         ? [
    //             ...response.data.filter(
    //               (item) =>
    //                 !items
    //                   .map((item) => item.transaction_id)
    //                   .includes(item.transaction_id)
    //             ),
    //             ...payAddedTransactions.filter((item) => {
    //               const totalDiscount =
    //                 (parseFloat(item.item_discount) || 0) +
    //                 (parseFloat(item.transaction_discount) || 0);

    //               const includesSearchTerm = (str, searchTerm) => {
    //                 return String(str)
    //                   .toLowerCase()
    //                   .includes(searchTerm.toLowerCase());
    //               };

    //               if (item.payAdded == true) {
    //                 // Handle all search
    //                 if (filterColumn == "all") {
    //                   return [
    //                     item.transaction_id,
    //                     item.remarks,
    //                     item.invoice_date,
    //                     item.due_date,
    //                     item.total_amount,
    //                     totalDiscount,
    //                   ].some((value) => includesSearchTerm(value, searchTerm));
    //                 } else {
    //                   let discountSearch;

    //                   filterColumn == "discount"
    //                     ? // Handle discount search
    //                       (discountSearch = includesSearchTerm(
    //                         totalDiscount,
    //                         searchTerm
    //                       ))
    //                     : // Handle Individual filter search
    //                       (discountSearch =
    //                         item[filterColumn] &&
    //                         includesSearchTerm(item[filterColumn], searchTerm));

    //                   return discountSearch;
    //                 }
    //               }

    //               return false;
    //             }),
    //           ]
    //         : response.data.filter(
    //             (item) =>
    //               !items
    //                 .map((item) => item.transaction_id)
    //                 .includes(item.transaction_id)
    //           )
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error fetching transactions:", error);
    // }
  };

  useEffect(() => {
    fetchTransactions();
  }, [bulkCollectionData.customer_id]);

  const getAvailableTransactionIds = (index) => {
    const selectedTransactionIds = items
      .map((item, idx) => (idx !== index ? item.transactionId : null))
      .filter((id) => id);

    if (index === 0) {
      return transactions.filter(
        (transaction) =>
          !selectedTransactionIds.includes(
            transaction.sales_invoice_id.toString()
          ) ||
          items[index].transactionId === transaction.sales_invoice_id.toString()
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
      (t) => t.sales_invoice_id === String(transactionId)
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
  };

  const isTableDisabled =
    bulkCollectionData.status === "Approved" ||
    bulkCollectionData.status === "Rejected";

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
      disabled={isTableDisabled || !edit}
    />
  ));

  useEffect(() => {
    fetchCustomer();
    fetchCutOff();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    setTransactions(
      payAddedTransactions.length > 0
        ? [
            ...pagination.data.filter(
              (item) =>
                !items
                  .map((item) => item.transaction_id)
                  .includes(item.transaction_id)
            ),
            ...payAddedTransactions.filter((item) => {
              const totalDiscount =
                (parseFloat(item.item_discount) || 0) +
                (parseFloat(item.transaction_discount) || 0);

              const includesSearchTerm = (str, searchTerm) => {
                return String(str)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              };

              if (item.payAdded == true) {
                // Handle all search
                if (filterColumn == "all") {
                  return [
                    item.transaction_id,
                    item.remarks,
                    item.invoice_date,
                    item.due_date,
                    item.total_amount,
                    totalDiscount,
                  ].some((value) => includesSearchTerm(value, searchTerm));
                } else {
                  let discountSearch;

                  filterColumn == "discount"
                    ? // Handle discount search
                      (discountSearch = includesSearchTerm(
                        totalDiscount,
                        searchTerm
                      ))
                    : // Handle Individual filter search
                      (discountSearch =
                        item[filterColumn] &&
                        includesSearchTerm(item[filterColumn], searchTerm));

                  return discountSearch;
                }
              }

              return false;
            }),
          ]
        : pagination.data.filter(
            (item) =>
              !items
                .map((item) => item.transaction_id)
                .includes(item.transaction_id)
          )
    );
  }, [pagination.data]);

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
            <Link to="/sales/overseas-collections" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            OVERSEAS COLLECTIONS OVERVIEW
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
            {/* <input
              type="date"
              name=""
              id=""
              className="form-control p-2"
              onChange={handleCollectionDate}
              value={collectionDate}
              disabled={isTableDisabled || !edit}
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
                // onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled
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
                // onChange={handleCustomerChange}
                value={selectedCustomerId}
                disabled
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {localCustomerData.map((customer, i) => (
                  <option key={i} value={customer.customer_id}>
                    {`${customer.first_name} ${customer.last_name}`}
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
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={
                            item?.total_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"
                          }
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
                            value={(
                              item.item_discount + item.transaction_discount
                            )?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
                          disabled={
                            bulkCollectionData.status !== "For Approval" ||
                            !edit
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
                disabled={isTableDisabled || !edit}
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
                        disabled={isTableDisabled || !edit}
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
                        disabled={isTableDisabled || !edit}
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
                      disabled={isTableDisabled || !edit}
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
                        disabled={isTableDisabled || !edit}
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
                        disabled={isSubject2Disabled || !edit}
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
                        disabled={isSubject3Disabled || !edit}
                      >
                        <option value="">Select Account name</option>
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
                        disabled={isTableDisabled || !edit}
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
                        disabled={isTableDisabled || !edit}
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
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
                        disabled={isTableDisabled || !edit}
                      />
                    </div>
                    {/* <span>
                      Account Balance:
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
                        disabled={isTableDisabled || !edit}
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

                  {selectedPayment === "Cash" && (
                    <Form.Group className="mb-3" controlId="date">
                      <Form.Label>
                        Collection Date <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      {/* <Form.Control
                        type="date"
                        className="p-2"
                        value={date}
                        readOnly
                      /> */}
                      <DatePicker
                        selected={date}
                        className="form-control p-2"
                        dateFormat="MMM dd, yyyy"
                        readOnly
                      />
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
                              {data.refNumber === "" ? "--" : data.refNumber}
                            </td>
                            <td>{format(data.issuedDate, "MMM dd, yyyy")}</td>
                            <td className="text-center d-flex">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeletePayment(i)}
                                disabled={
                                  bulkCollectionData.status !==
                                    "For Approval" || !edit
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
                <div className="col-sm">
                  {authrztn.includes("OverseasCollections-Edit") &&
                    bulkCollectionData.status === "For Approval" && (
                      <>
                        {edit ? (
                          <div className="row">
                            <div className="col-sm mb-2">
                              <button
                                className="btn btn-secondary w-100"
                                type="button"
                                onClick={() => {
                                  setEdit(false);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="col-sm">
                              <button
                                className="btn btn-primary w-100"
                                type="button"
                                onClick={handleUpdateOverseasCollection}
                              >
                                Update
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-outline-primary w-100"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setEdit(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                </div>
                <div className="col-sm"></div>
                {authrztn.includes("OverseasCollections-Approve") &&
                  bulkCollectionData.status === "For Approval" &&
                  !edit && (
                    <div className="col-sm">
                      <div className="row">
                        <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                          <button
                            className="btn btn-outline-danger w-100 me-3"
                            type="button"
                            onClick={(e) =>
                              handleApproveRejectLocalCollection(e, "reject")
                            }
                            disabled={isCutoffPosted}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-success w-100"
                            type="button"
                            onClick={(e) =>
                              handleApproveRejectLocalCollection(e, "approve")
                            }
                            disabled={isCutoffPosted}
                          >
                            Approve
                          </button>
                        </div>
                        {isCutoffPosted && (
                          <div>
                            <p className="text-danger">
                              Action is prohibited as the transaction date has
                              already been posted.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOverseasBulkCollection;
