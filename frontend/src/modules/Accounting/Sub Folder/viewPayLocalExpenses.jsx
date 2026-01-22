import React, { useState, useEffect } from "react";
import { Button, Form, Nav, Modal, Tab, Table } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { Link, useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";
import { customStyles } from "../../../assets/table-style";
import DataTable from "react-data-table-component";
import { jwtDecode } from "jwt-decode";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const ViewLocalPayExpenses = ({ authrztn }) => {
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
  const { id, foreign_url } = useParams();

  const [isEditing, setIsEditing] = useState(false);

  const [bulkExpenses, setBulkExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addDeducts, setAddDeducts] = useState([]);

  const [expensesTotalAmount, setExpensesTotalAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [additionalTotalAmount, setAdditionalTotalAmount] = useState(0);
  const [deductionTotalAmount, setDeductionTotalAmount] = useState(0);
  const [activeTab, setActiveTab] = useState("paymentList");

  const [selected_currency_id, setSelected_currency_id] = useState("");
  const [currency_db, setCurrency_db] = useState([]);
  const [currencyName, setCurrencyName] = useState("");

  const [payDate, setPayDate] = useState(null);
  const [status, setStatus] = useState("");

  const [isAmountDisabled, setIsAmountDisabled] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);

  const [expenses, setExpenses] = useState({
    additional: {
      0: {
        subject1: "",
        subject2: "",
        subject3: "",
        payment_method: "",
        remarks: "",
        check: "",
        amount: "",
        subject2Options: [],
        subject3Options: [],
        type: "additional",
        disabledSubject2: true,
        disabledSubject3: true,
        disabledAmount: true,
        currentAmount: "",
      },
    },
    deduction: {
      0: {
        subject1: "",
        subject2: "",
        subject3: "",
        payment_method: "",
        remarks: "",
        check: "",
        amount: "",
        subject2Options: [],
        subject3Options: [],
        type: "deduction",
        disabledSubject2: true,
        disabledSubject3: true,
        disabledAmount: true,
        currentAmount: "",
      },
    },
  });

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [removePaymentListId, setRemovePaymentListId] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [isAddedTransactions, setIsAddedTransactions] = useState([]);
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

    setLocalExpensesData((prev) => {
      return prev.filter((item) => !selectedRow.includes(item.transaction_id));
    });

    setTransactions((prev) => {
      return [
        ...prev,
        ...localExpensesData.filter((item) =>
          selectedRow.includes(item.transaction_id)
        ),
      ];
    });

    setIsAddedTransactions((prev) => {
      return prev.filter((item) => !selectedRow.includes(item.transaction_id));
    });

    setFilterColumn("all");
    setSearchTerm("");
    setSelectedRow([]);
    setShow(false);
  };

  const deleteItem = (item, index) => {
    if (transactions.length === "1") {
      // Prevent deleting the last row if there's only one row
      return;
    }

    setLocalExpensesData((prev) => {
      return [...prev, item];
    });

    setTransactions((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((item) => item !== item.transaction_id);
    });

    setRemoveTransactionList((prev) => {
      return [...prev, String(item.id)];
    });

    if (item.isAdded == true) {
      setIsAddedTransactions((prev) => [...prev, item]);
    }

    // const updatedItems = [...items];
    // updatedItems.splice(index, 1);
    // setItems(updatedItems);

    // const deletedItem = items.find((_, i) => {
    //   return index == i;
    // });

    // console.log(deletedItem, "deleted Item");
    // const splittedExpensesType = deletedItem.expensesType.split("(");
    // setLocalExpensesData((prev) => [

    //   ...prev,
    //   {
    //     transaction_id: deletedItem.transactionId,
    //     desc: deletedItem.description,
    //     expenses2: {
    //       expenses_one: {
    //         expenses_type_one: splittedExpensesType[0].trim(),
    //       },
    //       sub_type: splittedExpensesType[1].trim().replace(/\)/g, ""),
    //     },
    //     expenses_date: deletedItem.expensesDate,
    //     totalAmount: deletedItem.totalAmount,
    //     checkbox: false,
    //   },
    // ]);
  };

  console.log(isAddedTransactions, "isAdded");

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
      setSelectedRow(localExpensesData.map((item) => item.transaction_id));
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
    },
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Remarks",
      selector: (row) => row.desc,
    },
    {
      name: "Expenses Type",
      selector: (row) =>
        `${row.expenses2.expenses_one.expenses_type_one} (${row.expenses2.sub_type})`,
    },
    {
      name: "Expenses Date",
      selector: (row) => format(row.expenses_date, "MMM dd, yyyy"),
      // row.expenses_date
      //   ? new Date(row.expenses_date).toISOString().split("T")[0]
      //   : "",
    },
    {
      name: "Amount",
      selector: (row) =>
        row.totalAmount.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
  ];

  const handleSubject1AddDeductExpensesChange = (rowId, value, expenseType) => {
    setExpenses((prev) => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [rowId]: {
          ...prev[expenseType][rowId],
          subject1: value,
          subject2: "",
          subject3: "",
          disabledSubject2: true,
          disabledSubject3: true,
          disabledAmount: true,
        },
      },
    }));

    axios
      .get(BASE_URL + "/paylocalexpenses/getSubjectAddDeductExpenses", {
        params: { account_selected: value },
      })
      .then((res) => {
        setExpenses((prev) => ({
          ...prev,
          [expenseType]: {
            ...prev[expenseType],
            [rowId]: {
              ...prev[expenseType][rowId],
              subject2Options: res.data,
              disabledSubject2: false,
            },
          },
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSubject2AddDeductExpensesChange = (rowId, value, expenseType) => {
    setExpenses((prev) => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [rowId]: {
          ...prev[expenseType][rowId],
          subject2: value,
          subject3: "",
          disabledSubject3: true,
          disabledAmount: true,
        },
      },
    }));

    // axios
    //   .get(BASE_URL + "/paylocalexpenses/getSubject3AddDeductExpenses", {
    //     params: {
    //       subjectId: value,
    //       totalAmountSum,
    //       selected_currency_id,
    //     },
    //   })
    //   .then((res) => {
    //     setExpenses((prev) => ({
    //       ...prev,
    //       [expenseType]: {
    //         ...prev[expenseType],
    //         [rowId]: {
    //           ...prev[expenseType][rowId],
    //           subject3Options: res.data,
    //           disabledSubject3: false,
    //         },
    //       },
    //     }));
    //   });

    if (value === "Loan_Unique") {
      axios
        .get(
          BASE_URL + "/paylocalexpenses/getSubject3AddDeductExpensesFORLOAN",
          {
            params: {
              selected_currency_id,
            },
          }
        )
        .then((res) => {
          setExpenses((prev) => ({
            ...prev,
            [expenseType]: {
              ...prev[expenseType],
              [rowId]: {
                ...prev[expenseType][rowId],
                subject3Options: res.data,
                disabledSubject3: false,
              },
            },
          }));
        });
    } else {
      axios
        .get(BASE_URL + "/paylocalexpenses/getSubject3AddDeductExpenses", {
          params: {
            subjectId: value,
            totalAmountSum,
            selected_currency_id,
          },
        })
        .then((res) => {
          setExpenses((prev) => ({
            ...prev,
            [expenseType]: {
              ...prev[expenseType],
              [rowId]: {
                ...prev[expenseType][rowId],
                subject3Options: res.data,
                disabledSubject3: false,
              },
            },
          }));
        });
    }
  };

  const handleSubject3AddExpensesChange = (
    rowId,
    value,
    expenseType,
    loanORAccount,
    currAmount
  ) => {
    setExpenses((prev) => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [rowId]: {
          ...prev[expenseType][rowId],
          subject3: value,
          LoanORAccount: loanORAccount,
          disabledAmount: false,
          currentAmount: currAmount,
        },
      },
    }));
  };

  const handleRemarksChange = (rowId, value, expenseType) => {
    setExpenses((prev) => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [rowId]: { ...prev[expenseType][rowId], remarks: value },
      },
    }));
  };

  const handleAmountChange = (rowId, value, expenseType) => {
    setExpenses((prev) => {
      const currentRow = prev[expenseType][rowId];

      if (value === ".") {
        value = "0.";
      }

      let inputValue = value.replace(/[^0-9.]/g, "");
      let [integerPart, decimalPart] = inputValue.split(".");

      if (integerPart) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      let formattedValue =
        decimalPart !== undefined
          ? `${integerPart}.${decimalPart}`
          : integerPart;
      let formatAmount = inputValue.replace(/,/g, "");
      let numericValue = parseFloat(formatAmount) || 0;

      if (numericValue > currentRow.currentAmount) {
        swal({
          icon: "error",
          title: "Enter another amount",
          text: `Amount cannot exceed ${currentRow.currentAmount.toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          buttons: false,
          timer: 2000,
        });
        return prev; // Prevent updating state
      }

      return {
        ...prev,
        [expenseType]: {
          ...prev[expenseType],
          [rowId]: { ...currentRow, amount: formattedValue }, // Store formatted value
        },
      };
    });
  };
  const handleRateChange = (rowId, value, expenseType) => {
    setExpenses((prev) => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [rowId]: { ...prev[expenseType][rowId], rate: value },
      },
    }));
  };

  const handleAddRow = (type) => {
    const newRowId = Object.keys(expenses[type]).length;
    setExpenses((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [newRowId]: {
          subject1: "",
          subject2: "",
          subject3: "",
          payment_method: "",
          remarks: "",
          check: "",
          amount: "",
          subject2Options: [],
          subject3Options: [],
          type: type,
          disabledSubject2: true,
          disabledSubject3: true,
          disabledAmount: true,
        },
      },
    }));
  };

  const handleRemoveRow = (rowId, type) => {
    setExpenses((prev) => {
      const updated = { ...prev[type] };
      delete updated[rowId];
      return { ...prev, [type]: updated };
    });
  };

  const handleCurrencyChange = (value) => {
    setSelected_currency_id(value);
  };

  const [isCurrencyFetched, setIsCurrencyFetched] = useState(false);

  const fetchCurrency = async () => {
    await axios
      .get(BASE_URL + "/currency/fetchCurrency")
      .then((response) => {
        setCurrency_db(response.data);
        setIsCurrencyFetched(true);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const pagination = useServerPagination(
    BASE_URL + "/paylocalexpenses/getLocalExpensesData",
    10
  );

  const fetchAvailableExpenses = async () => {
    pagination.updateParams({
      foreign: foreign_url,
      currency_id: "11111111-1111-1111-1111-111111111111",
      searchText: searchTerm,
      filterColumn,
    });
    // await axios
    //   .get(BASE_URL + "/paylocalexpenses/getLocalExpensesData", {
    //     params: {
    //       foreign: foreign_url,
    //       currency_id: "11111111-1111-1111-1111-111111111111",
    //       searchText: searchTerm,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setLocalExpensesData(
    //       isAddedTransactions.length > 0
    //         ? [
    //             ...res.data.filter(
    //               (data) =>
    //                 !transactions
    //                   .map((item) => item.transaction_id)
    //                   .includes(data.transaction_id)
    //             ),
    //             ...isAddedTransactions.filter((item) => {
    //               if (item.isAdded == true) {
    //                 const expenseType = `${item.expenses2.expenses_one.expenses_type_one} (${item.expenses2.sub_type})`;
    //                 const includesSearchTerm = (str, searchTerm) => {
    //                   return String(str)
    //                     .toLowerCase()
    //                     .includes(searchTerm.toLowerCase());
    //                 };
    //                 // Handle search for all
    //                 if (filterColumn === "all") {
    //                   return [
    //                     item.transaction_id,
    //                     item.desc,
    //                     item.expenses_date,
    //                     item.totalAmount,
    //                     expenseType,
    //                   ].some((value) => includesSearchTerm(value, searchTerm));
    //                 } else {
    //                   let searchResult;
    //                   filterColumn == "expenses_type"
    //                     ? // Handle expenses_type search
    //                       (searchResult = includesSearchTerm(
    //                         expenseType,
    //                         searchTerm
    //                       ))
    //                     : // Handle individual column search
    //                       (searchResult = includesSearchTerm(
    //                         item[filterColumn],
    //                         searchTerm
    //                       ));
    //                   return searchResult;
    //                 }
    //               }
    //               return false;
    //             }),
    //           ]
    //         : res.data.filter(
    //             (data) =>
    //               !transactions
    //                 .map((item) => item.transaction_id)
    //                 .includes(data.transaction_id)
    //           )
    //     );
    //     console.log("fetchAvailableExpenses is working", res.data);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  const foreignExpenses = foreign_url === "local" ? "LOCAL" : "OVERSEAS";
  const editPermission =
    foreignExpenses === "LOCAL"
      ? "LocalExpenses-Edit"
      : "OverseasExpenses-Edit";
  const approvePermission =
    foreignExpenses === "LOCAL"
      ? "LocalExpenses-Approve"
      : "OverseasExpenses-Approve";

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setCurrentDate(dateToday());
  }, []);

  const reloadTableBelow = () => {
    axios
      .get(`${BASE_URL}/paylocalexpenses/localExpensesSpecificDataFetching`, {
        params: { id: id },
      })
      .then((res) => {
        const { data, dataTransaction, dataPayment, dataAddDeduct, isPosted } =
          res.data;
        setBulkExpenses(data);
        setTransactions(
          dataTransaction.map((item) => {
            return item.expense;
          })
        );
        console.log(dataTransaction);
        console.log(dataPayment);
        setPayments(dataPayment);
        setAddDeducts(dataAddDeduct);
        setPayDate(data.pay_date);
        setStatus(data.status);
        setIsCutoffPosted(isPosted);

        // Initial calculation of totals
        calculateTotals(dataTransaction, dataPayment, dataAddDeduct, expenses);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchCurrency();
    fetchAvailableExpenses();

    reloadTableBelow();
  }, [id]);

  useEffect(() => {
    if (pagination.data) {
      setLocalExpensesData(
        isAddedTransactions.length > 0
          ? [
              ...pagination.data.filter(
                (data) =>
                  !transactions
                    .map((item) => item.transaction_id)
                    .includes(data.transaction_id)
              ),
              ...isAddedTransactions.filter((item) => {
                if (item.isAdded == true) {
                  const expenseType = `${item.expenses2.expenses_one.expenses_type_one} (${item.expenses2.sub_type})`;
                  const includesSearchTerm = (str, searchTerm) => {
                    return String(str)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                  };
                  // Handle search for all
                  if (filterColumn === "all") {
                    return [
                      item.transaction_id,
                      item.desc,
                      item.expenses_date,
                      item.totalAmount,
                      expenseType,
                    ].some((value) => includesSearchTerm(value, searchTerm));
                  } else {
                    let searchResult;
                    filterColumn == "expenses_type"
                      ? // Handle expenses_type search
                        (searchResult = includesSearchTerm(
                          expenseType,
                          searchTerm
                        ))
                      : // Handle individual column search
                        (searchResult = includesSearchTerm(
                          item[filterColumn],
                          searchTerm
                        ));
                    return searchResult;
                  }
                }
                return false;
              }),
            ]
          : pagination.data.filter(
              (data) =>
                !transactions
                  .map((item) => item.transaction_id)
                  .includes(data.transaction_id)
            )
      );
    }
  }, [pagination.data]);

  // Use an additional useEffect to wait until currency data is fetched
  useEffect(() => {
    if (isCurrencyFetched && transactions.length > 0) {
      // Determine and set currency symbol
      const currency_symbol = currency_db.find(
        (currency) =>
          String(currency.id) === String(transactions[0]?.currency_id)
      );

      if (currency_symbol) {
        setSelected_currency_id(currency_symbol.id);
        setCurrencyName(currency_symbol.currency_name);
      }
    }
  }, [isCurrencyFetched, transactions]);

  const calculateTotals = (
    dataTransaction,
    dataPayment,
    dataAddDeduct,
    expenses
  ) => {
    const total = dataTransaction.reduce(
      (acc, transaction) => acc + (transaction?.totalAmount || 0),
      0
    );
    const totalpayAmount = dataPayment.reduce(
      (acc, pay) => acc + (pay.amount || 0),
      0
    );

    let additionaltotal = 0;
    let deductiontotal = 0;
    dataAddDeduct.forEach((adds) => {
      if (adds.type_expenses === "additional") {
        additionaltotal +=
          parseFloat(String(adds.amount).replace(/,/g, "")) * adds.rate || 0;
      } else if (adds.type_expenses === "deduction") {
        deductiontotal +=
          parseFloat(String(adds.amount).replace(/,/g, "")) * adds.rate || 0;
      }
    });

    const calculateTotalAmountExpenses = (expenses) => {
      const sumAmounts = (category) =>
        Object.values(category).reduce((sum, item) => {
          const amount = parseFloat(String(item.amount).replace(/,/g, "")) || 0;
          return sum + amount;
        }, 0);

      const totalAdditional = sumAmounts(expenses.additional);
      const totalDeduction = sumAmounts(expenses.deduction);

      return { totalAdditional, totalDeduction };
    };

    const { totalAdditional, totalDeduction } =
      calculateTotalAmountExpenses(expenses);

    setExpensesTotalAmount(total);
    setTotalPayment(totalpayAmount);
    setAdditionalTotalAmount(additionaltotal + totalAdditional);
    setDeductionTotalAmount(deductiontotal + totalDeduction);
  };

  // useEffect to recalculate totals when `transactions` change
  useEffect(() => {
    calculateTotals(transactions, payments, addDeducts, expenses);
  }, [transactions, payments, addDeducts, expenses]);

  const handleAddNewExpense = () => {
    handleShow();
    // setTransactions([
    //   ...transactions,
    //   {
    //     expense: {
    //       transaction_id: "", // Initialize with an empty string
    //       totalAmount: "", // Start with an empty string or 0 if numeric
    //       expenses_date: "", // Start with an empty string
    //       desc: "", // Start with an empty string
    //       expenses2: {
    //         expenses_one: { expenses_type_one: "", sub_type: "" }, // Modify this as per your data structure
    //       },
    //     },
    //     newExpense: true,
    //   },
    // ]);
  };

  const handleEditTransaction = () => {
    setIsEditing(true);
  };

  const handleCancelEditTransaction = () => {
    swal({
      title: "Are you sure?",
      text: "Your changes will not be saved.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        setIsEditing(false);
      }
    });
  };

  const [removeTransactionList, setRemoveTransactionList] = useState([]);
  const [addedTransactionsList, setAddedTransactionList] = useState([]);
  console.log(removeTransactionList);
  console.log([...new Set(removeTransactionList)]);

  const handleRemoveTransaction = (index) => {
    // Get the transaction to be removed
    const removedTransaction = transactions[index];

    // Update the removed transaction list
    setRemoveTransactionList((prevList) => [
      ...prevList,
      removedTransaction.expense.id, // Add the removed transaction ID to the list
    ]);

    // Create a new array excluding the transaction at the given index
    const updatedTransactions = transactions.filter((_, i) => i !== index);

    // Update the state to reflect the changes in the UI
    setTransactions(updatedTransactions);
  };

  const [localExpensesData, setLocalExpensesData] = useState([]);

  useEffect(() => {
    if (pagination.currentPage === 1 && localExpensesData.length < 10) {
      pagination.setTotalPages(
        Math.ceil(localExpensesData?.length / pagination.itemsPerPage)
      );
    }
  }, [localExpensesData]);

  const getAvailableTransactionIds = (currentIndex) => {
    // Gather selected IDs, excluding the current index to avoid self-restriction.
    const selectedIds = transactions
      .map((t, index) =>
        index !== currentIndex ? t.expense.transaction_id : null
      )
      .filter(Boolean);

    // Filter `localExpensesData` to exclude selected IDs
    return localExpensesData.filter(
      (transaction) => !selectedIds.includes(transaction.id.toString())
    );
  };

  let cashTotal = 0;
  let bankTotal = 0;
  let checkTotal = 0;
  let onlineTotal = 0;

  // Calculate totals
  payments.forEach((data) => {
    if (data.payment_type === "Cash") {
      cashTotal += data.amount;
    } else if (data.payment_type === "Bank") {
      if (!data.check_number) {
        bankTotal += data.amount; // Bank without check number
      } else {
        checkTotal += data.amount; // Check with check number
      }
    }
    if (data.payment_type === "Bank" && data.online_ref_number) {
      onlineTotal += data.amount; // Online payment with reference number
    }
  });

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const sumOfAdditionalandToPay = additionalTotalAmount + expensesTotalAmount;
  const sumOfDeductionandTotalPayment = deductionTotalAmount + totalPayment;
  let payableExpenses = sumOfAdditionalandToPay - sumOfDeductionandTotalPayment;

  const deletePayment = (arrayName, item, index) => {
    if (arrayName == "floatPayment") {
      setFloatPayment((prev) => {
        return prev.filter((_, i) => {
          return index !== i;
        });
      });
    } else {
      setPayments((prev) => {
        return prev.filter((_, i) => {
          return index !== i;
        });
      });
    }
    if (item.id) {
      setRemovePaymentListId((prev) => {
        return [...prev, item?.id];
      });
    }
    payableExpenses += item.amountInputted;
  };

  const handleApprove = () => {
    swal({
      title: "Approve this pay expenses?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        const processedPayments = payments.map((payment) => {
          return {
            id: payment.id || "",
            pay_bulk_id: payment.pay_bulk_id || "",
            account_list_sub3_id: payment.account_list_sub3_id || "",
            payment_type: payment.payment_type || "",
            check_number: payment.check_number || "",
            amount: payment.amount || "",
            date_issued: payment.date_issued || "",
            createdAt: payment.createdAt || "",
            updatedAt: payment.updatedAt || "",
            account_list_sub3: {
              id: payment.account_list_sub3.id || "",
              account_list_base_sub_id:
                payment.account_list_sub3.account_list_base_sub_id || "",
              account_name: payment.account_list_sub3.account_name || "",
              amount: payment.account_list_sub3.amount || "",
              currency_id: payment.account_list_sub3.currency_id || "",
              createdAt: payment.account_list_sub3.createdAt || "",
              updatedAt: payment.account_list_sub3.updatedAt || "",
            },
          };
        });
        try {
          axios
            .post(`${BASE_URL}/paylocalexpenses/approved`, null, {
              params: {
                id,
                foreign_url,
                processedPayments,
                transactions_number: bulkExpenses.transaction_number,
                addDeducts,
                date_transacted: bulkExpenses.pay_date,
                userLoggedID,
              },
            })
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
                  if (foreign_url === "local") {
                    navigate("/accounting/local-expenses");
                  } else {
                    navigate("/accounting/overseas-expenses");
                  }
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
      title: "Reject this pay expenses?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/paylocalexpenses/rejected`, null, {
              params: {
                id,
                transactions,
                userLoggedID,
                foreign_url,
                transaction_number: bulkExpenses.transaction_number,
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
                  if (foreign_url === "local") {
                    navigate("/accounting/local-expenses");
                  } else {
                    navigate("/accounting/overseas-expenses");
                  }
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

  const handleUpdate = () => {
    // Filter out the transactions that are marked for removal
    const filteredTransactions = transactions.filter(
      (transaction) => !transaction.toBeRemoved
    );

    swal({
      title: "Do you want to update this transaction?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          const expensesToSubmit = [];

          // additional expenses
          for (const expense of Object.values(expenses.additional)) {
            expensesToSubmit.push({
              subject1: expense.subject1,
              subject2: expense.subject2,
              subject3: expense.subject3,
              remarks: expense.remarks,
              amount: parseFloat(String(expense.amount).replace(/,/g, "")),
              payment_method: expense.payment_method,
              type: "additional",
              LoanORAccount: expense.LoanORAccount,
              rate: expense.rate,
            });
          }

          // deduction expenses
          for (const expense of Object.values(expenses.deduction)) {
            expensesToSubmit.push({
              subject1: expense.subject1,
              subject2: expense.subject2,
              subject3: expense.subject3,
              remarks: expense.remarks,
              amount: parseFloat(String(expense.amount).replace(/,/g, "")),
              payment_method: expense.payment_method,
              type: "deduction",
              LoanORAccount: "account",
              rate: expense.rate,
            });
          }

          axios
            .post(`${BASE_URL}/paylocalexpenses/update`, null, {
              params: {
                id,
                transactions: filteredTransactions,
                payDate,
                removedIds: [...new Set(removeTransactionList)],
                addedIds: addedTransactionsList,
                floatPayment,
                expenses: expensesToSubmit,
                userLoggedID,
                foreign_url,
                removePaymentListId: [...new Set(removePaymentListId)],
              },
            })
            .then((res) => {
              setIsEditing(false);
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Successfully updated the transaction",
                  icon: "success",
                  dangerMode: true,
                }).then(() => {
                  resetExpenses();
                  reloadTableBelow();
                  setIsCutoffPosted(res.data.isPosted);
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact support immediately",
                  icon: "warning",
                  buttons: true,
                  dangerMode: true,
                });
              }
            });
        } catch (error) {
          console.error("Error updating transaction:", error);
          swal({
            title: "Something went wrong",
            text: "Please contact support immediately",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          });
        }
      }
    });
  };

  const handleAddTransaction = (index, selectedId) => {
    // Find the selected transaction details from localExpensesData
    const selectedTransaction = localExpensesData.find(
      (data) => String(data.id) === String(selectedId)
    );

    if (!selectedTransaction) {
      console.error("Selected transaction not found");
      return;
    }

    // Check if data and data.id exist in selectedTransaction
    const selectedTransactionId =
      selectedTransaction.data?.id || selectedTransaction.id;

    setAddedTransactionList((prevList) => [
      ...prevList,
      selectedTransactionId, // Ensure correct reference
    ]);

    // Update the transaction if it exists in localExpensesData
    if (selectedTransaction) {
      // Create a new transaction item based on selectedTransaction details
      const newTransaction = {
        expense: {
          transaction_id: selectedTransaction.transaction_id,
          expenses_date: selectedTransaction.expenses_date,
          totalAmount: selectedTransaction.totalAmount,
          expenses2: selectedTransaction.expenses2,
          desc: selectedTransaction.desc,
        },
        newExpense: false,
      };

      // Insert the new transaction into transactions at the specified index
      const updatedTransactions = [...transactions];
      updatedTransactions[index] = newTransaction;

      // Update the transactions state
      setTransactions(updatedTransactions);
    }
  };

  // **********************************************Payment Method*****************************************//
  const [validated, setValidated] = useState(false);

  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("Bank");
  const [onlinePaymentCheckbox, setOnlinePaymentCheckbox] = useState(false);
  const [bankAmount, setBankAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amountInputted, setAmountInputted] = useState(0); //amount 'to sa payment method
  const [onlineWalletRemarks, setOnlineWalletRemarks] = useState("");
  const [floatPayment, setFloatPayment] = useState([]);
  const [date, setDate] = useState("");
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  console.log(payments);
  console.log(floatPayment);

  useEffect(() => {
    if (amountInputted) {
      handleAmountValue(amountInputted);
    }
  }, [date]);

  useEffect(() => {
    fetchAvailableExpenses();
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    let formatAmountInputted = String(amountInputted).replace(/,/g, "");
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
      if (amountInputted === 0) {
        swal({
          icon: "error",
          title: "Amount Required",
          text: "The amount cannot be zero. Please enter a valid value.",
          buttons: "OK",
        });
        return;
      }

      swal({
        title: "Create this new purchase?",
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
            amountInputted: parseFloat(formatAmountInputted),
            issuedDate: date,
            checkNumber: checkNumber,
            refNumber: refNumber,
            remarks: onlineWalletRemarks,
          };
          setFloatPayment((prevPayments) => [...prevPayments, newPayment]);
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
        }
      });
    }
    setValidated(true);
  };

  const clearPaymentFields = () => {
    setValidated(false);
    setOnlinePaymentCheckbox(false);

    setRefNumber("");
    setOnlineWalletRemarks("");
    // setSelectedPayment("Bank");
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

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    setSubject3(selectedAccountId);
    const selectedAccount = subject3DataList.find(
      (account) => String(account.id) === String(selectedAccountId)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    }
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
        .get(`${BASE_URL}/paylocalexpenses/getSubject1LocalExpenses`, {
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
    console.log("test");

    try {
      axios
        .get(`${BASE_URL}/paylocalexpenses/getSubject3LocalExpenses`, {
          params: {
            subjectId: selectedSubject2,
            totalAmountSum,
            selected_currency_id,
          },
        })
        .then((res) => {
          console.log(
            "9******************************************selectedSubject2: ",
            selectedSubject2
          );
          setSubject3DataList(res.data);
          console.log(res.data);
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

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleAmountValue = (value) => {
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
    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    // Check if the input value is greater than the totalAmountSum
    if (numericValue > payableExpenses && date <= currentDate) {
      swal({
        title: "Oppss!",
        text: "Please input not greater than the balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmountInputted(0);
      });
    } else {
      setAmountInputted(cleanedValue);
    }
  };

  const handleAdditionalExpenses = (type) => {
    const newRowId = Object.keys(expenses[type]).length;
    setExpenses((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [newRowId]: {
          subject1: "",
          subject2: "",
          subject3: "",
          payment_method: "",
          remarks: "",
          check: "",
          amount: "",
          subject2Options: [],
          subject3Options: [],
          type: type,
          disabledSubject2: true,
          disabledSubject3: true,
          disabledAmount: true,
          rate: "",
        },
      },
    }));
  };

  const renderExpenseTable = (type) => (
    // <Table bordered hover>
    <tbody>
      {Object.entries(expenses[type]).map(([rowId, row]) => (
        <tr key={rowId}>
          <td>
            <Form.Control
              as="select"
              value={row.subject1}
              onChange={(e) =>
                handleSubject1AddDeductExpensesChange(
                  rowId,
                  e.target.value,
                  type
                )
              }
              required
            >
              <option disabled value="" selected>
                Select Subject 1
              </option>
              <option value="Account-List">Account-List</option>
              <option value="Liabilities Account">Liabilities Account</option>
              <option value="Asset Account">Asset Account</option>
              <option value="Owner's Equity Account">
                Owner's Equity Account
              </option>
              {type === "additional" && (
                <option value="Loan_Unique">Loan</option>
              )}
            </Form.Control>
          </td>
          <td>
            <Form.Control
              as="select"
              value={row.subject2}
              onChange={(e) =>
                handleSubject2AddDeductExpensesChange(
                  rowId,
                  e.target.value,
                  type
                )
              }
              required
              disabled={row.disabledSubject2}
            >
              <option disabled value="">
                Select Subject 2
              </option>
              {row.subject1 === "Loan_Unique" ? (
                <option value="Loan_Unique">Loan</option>
              ) : (
                row.subject2Options.map((data) => (
                  <option key={data.id} value={data.id}>
                    {`${data.subject_name}`}
                  </option>
                ))
              )}
            </Form.Control>
          </td>
          <td>
            <Form.Control
              as="select"
              value={row.subject3}
              onChange={(e) =>
                handleSubject3AddExpensesChange(
                  rowId,
                  e.target.value,
                  type,
                  row.subject1 === "Loan_Unique" ? "loan" : "account"
                )
              }
              required
              disabled={row.disabledSubject3}
            >
              <option>Select Subject 3</option>
              {row.subject3Options.map((data) =>
                row.subject1 === "Loan_Unique" ? (
                  <option key={data.id} value={data.id}>
                    {`${data.loan_name}`}
                  </option>
                ) : (
                  <option key={data.id} value={data.id}>
                    {`${data.account_name}`}
                  </option>
                )
              )}
            </Form.Control>
          </td>
          <td>
            <Form.Control
              type="text"
              value={row.remarks}
              onChange={(e) => handleRemarksChange(rowId, e.target.value, type)}
              placeholder="Description ..."
            />
          </td>
          <td>
            <Form.Control
              type="text"
              value={row.amount}
              onChange={(e) => handleAmountChange(rowId, e.target.value, type)}
              placeholder="0.00"
              required
              disabled={row.disabledAmount}
            />
          </td>
          {selected_currency_id == 1 ? null : (
            <>
              <td>
                <Form.Control
                  type="text"
                  value={row.rate}
                  onChange={(e) =>
                    handleRateChange(rowId, e.target.value, type)
                  }
                  placeholder="0.00"
                  required
                  disabled={row.disabledAmount}
                />
              </td>
            </>
          )}
          <td>
            <Button
              variant="danger"
              onClick={() => handleRemoveRow(rowId, type)}
              disabled={rowId === "0"}
            >
              Remove
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
    // </Table>
  );

  const resetExpenses = () => {
    setExpenses({
      additional: {
        0: {
          subject1: "",
          subject2: "",
          subject3: "",
          payment_method: "",
          remarks: "",
          check: "",
          amount: "",
          subject2Options: [],
          subject3Options: [],
          type: "additional",
          disabledSubject2: true,
          disabledSubject3: true,
          disabledAmount: true,
        },
      },
      deduction: {
        0: {
          subject1: "",
          subject2: "",
          subject3: "",
          payment_method: "",
          remarks: "",
          check: "",
          amount: "",
          subject2Options: [],
          subject3Options: [],
          type: "deduction",
          disabledSubject2: true,
          disabledSubject3: true,
          disabledAmount: true,
        },
      },
    });
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-2 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      readOnly={!isEditing}
      required
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="w-100 d-flex flex-row justify-content-between">
          <span className="fs-3">
            <Link
              to={`${
                foreignExpenses === "LOCAL"
                  ? "/accounting/local-expenses"
                  : "/accounting/overseas-expenses"
              }`}
              className="text-dark me-2"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            {foreignExpenses} EXPENSES DETAILS
          </span>
          {authrztn.includes(editPermission) && (
            <div className="dropdown dropdown-button">
              <button
                className="border-0"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bx bx-dots-horizontal fs-4"></i>
              </button>
              <ul
                className="dropdown-menu"
                aria-labelledby="dropdownMenuButton1"
              >
                <li>
                  <span
                    style={{
                      cursor:
                        status === "For-Approval" ? "pointer" : "not-allowed",
                      color: status === "For-Approval" ? "inherit" : "gray",
                    }}
                    className="dropdown-item"
                    onClick={
                      status === "For-Approval" ? handleEditTransaction : null
                    }
                  >
                    Edit Transaction
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="container-fluid mt-3">
        <div className="row p-2">
          <div className="col-sm">
            <span>Transaction Number</span>
            <div className="input-group mb-2">
              <Form.Control
                type="text"
                name=""
                id=""
                className=" p-2"
                value={bulkExpenses.transaction_number || ""}
                readOnly
              />
            </div>
          </div>
          <div className="col-sm">
            <span>
              Currency <span className="text-danger">*</span>
            </span>
            <select
              required
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="form-select p-2"
              value={selected_currency_id}
              disabled
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
                value={expensesTotalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
              />
            </div>
          </div>
          <div className="col-sm">
            <span>Transaction Date</span>
            {/* <input
              type="date"
              name="payDate"
              id=""
              readOnly={!isEditing}
              className="form-control p-2"
              value={payDate}
              required
              onChange={(e) => setPayDate(e.target.value)}
            /> */}
            <div>
              <DatePicker
                selected={payDate}
                onChange={(date) => {
                  setPayDate(date);
                }}
                dateFormat="MMM dd, yyyy"
                className="form-control p-2"
                customInput={<CustomInput />}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Expenses Lists</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Transaction ID</th>
                  <th className="p-2">Remarks</th>
                  <th className="p-2">Expenses Type</th>
                  <th className="p-2">Expenses Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Description</th>
                  {isEditing && <th className="p-2">Action</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control"
                        value={t?.transaction_id || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      {t.newExpense ? (
                        <select
                          required
                          className="form-control form-control-sm p-2"
                          onChange={(e) =>
                            handleAddTransaction(index, e.target.value)
                          }
                        >
                          <option selected disabled>
                            Select Remarks
                          </option>
                          {localExpensesData.map((data) => (
                            <option key={data.id} value={data.id}>
                              {data.desc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-control form-control-sm p-2"
                          type="text"
                          value={t?.desc}
                          readOnly
                        />
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm p-2"
                        readOnly
                        value={`${t?.expenses2.expenses_one.expenses_type_one} - ${t?.expenses2.sub_type}`}
                      />
                    </td>
                    <td>
                      {/* <input
                        type="date"
                        className="form-control form-control-sm p-2"
                        readOnly
                        value={t?.expenses_date}
                      /> */}
                      <DatePicker
                        selected={t?.expenses_date}
                        dateFormat="MMM dd, yyyy"
                        className="form-control form-control-sm p-2"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm p-2"
                        value={t?.totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <div className="input-group mb-2">
                        <Form.Control
                          type="text"
                          className="form-control-sm p-2"
                          id="inlineFormInputGroup"
                          value={t?.desc || "n/a"}
                          readOnly
                        />
                      </div>
                    </td>
                    {isEditing && (
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteItem(t, index)}
                          disabled={
                            transactions.length <= 1 ||
                            (transactions.length > 1 && !transactions[1]?.id)
                          }
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end mt-2">
          {isEditing && (
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleAddNewExpense}
            >
              New Expenses
            </button>
          )}
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
            <Modal.Title>Expenses Lists</Modal.Title>
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
                    { value: "desc", label: "Remarks" },
                    { value: "expenses_type", label: "Expenses Type" },
                    { value: "expenses_date", label: "Expenses Date" },
                    { value: "totalAmount", label: "Amount" },
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
              data={localExpensesData}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                        className="me-3"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        disabled={!isEditing}
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
                      disabled={!isEditing}
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
                    <Form.Select
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
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="accountName">
                    <Form.Label className="fw-bold">Accounts</Form.Label>
                    <Form.Select
                      value={subject3}
                      className="p-2"
                      onChange={handleAccountChange}
                      required={selectedPayment !== "Online"}
                      disabled={isSubject3Disabled}
                    >
                      <option value="">Select Account name</option>
                      {subject3DataList.map((data) => (
                        <option key={data.id} value={data.id}>
                          {data.account_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {selectedPayment === "Bank" && !onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        disabled={!isEditing}
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[0-9-]*$/.test(value) && value.length <= 15) {
                            setCheckNumber(value);
                          }
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                      disabled={!isEditing}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setIsAmountDisabled(false);
                      }}
                    /> */}
                    <div>
                      <DatePicker
                        selected={date}
                        onChange={(date) => {
                          setDate(date);
                          setIsAmountDisabled(false);
                        }}
                        dateFormat="MMM dd, yyyy"
                        className="form-control p-2"
                        customInput={<CustomInput />}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">{}</span>
                      <Form.Control
                        type="text"
                        className="p-2"
                        required
                        placeholder="0.00"
                        disabled={isAmountDisabled}
                        value={amountInputted}
                        onInput={onInputFloat}
                        onChange={(e) => handleAmountValue(e.target.value)}
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

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isEditing}
                    className="w-100 p-2"
                  >
                    Add Payment
                  </Button>
                </Form>
              </div>
            </div>

            <div className="col-12 col-md-8 p-2 d-flex flex-column">
              <div className="">
                <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
                  <Nav variant="tabs">
                    <Nav.Item>
                      <Nav.Link
                        eventKey="paymentList"
                        className="text-dark custom-nav-link"
                      >
                        Payment List
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        eventKey="AddExpenses"
                        className="text-dark custom-nav-link"
                      >
                        Add Expenses
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        eventKey="DeductionExpenses"
                        className="text-dark custom-nav-link"
                      >
                        Deduction Expenses
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content className="mt-3">
                    <Tab.Pane eventKey="paymentList">
                      <div className="border p-3 rounded">
                        <h5>Payment List</h5>
                        <div className="table-responsive">
                          <Table bordered>
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Account Name</th>
                                <th>Amount</th>
                                <th>Check Number</th>
                                <th>Issue Date</th>
                                <th>Online Wallet</th>
                                <th>Online Reference No.</th>
                                {isEditing && <th>Action</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((data, i) => (
                                <tr>
                                  <td>{data.payment_type}</td>
                                  <td>
                                    {data.account_list_sub3.account_name === ""
                                      ? "--"
                                      : data.account_list_sub3.account_name}
                                  </td>
                                  <td>
                                    {data.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td>
                                    {data.check_number === ""
                                      ? "--"
                                      : data.check_number}
                                  </td>
                                  <td>
                                    {format(data.date_issued, "MMM dd, yyyy")}
                                  </td>
                                  <td>
                                    {data.online_name === ""
                                      ? "--"
                                      : data.online_name}
                                  </td>
                                  <td>
                                    {data.online_ref_number === ""
                                      ? "--"
                                      : data.online_ref_number}
                                  </td>
                                  {isEditing && (
                                    <td>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() =>
                                          deletePayment("payments", data, i)
                                        }
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}

                              {floatPayment.map((data, i) => (
                                <tr>
                                  <td>{data.paymentMethod}</td>
                                  <td>
                                    {data.accountName === ""
                                      ? "--"
                                      : data.accountName}
                                  </td>
                                  <td>
                                    {data.amountInputted.toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
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
                                    {data.remarks === "" ? "--" : data.remarks}
                                  </td>
                                  <td>
                                    {data.refNumber === ""
                                      ? "--"
                                      : data.refNumber}
                                  </td>
                                  {/* <td className="text-primary">Edit</td> */}
                                  {isEditing && (
                                    <td>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() =>
                                          deletePayment("floatPayment", data, i)
                                        }
                                      >
                                        <i className="fa-solid fa-trash-can"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="AddExpenses">
                      <div className="border p-3 rounded">
                        <h5>Additional Expenses</h5>
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead>
                              <tr>
                                <th>Subject1</th>
                                <th>Subject2</th>
                                <th>Subject3</th>
                                <th>Remarks</th>
                                <th>Amount</th>
                                {selected_currency_id == 1 ? null : (
                                  <>
                                    <th>Rate</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {addDeducts
                                .filter(
                                  (ad) => ad.type_expenses === "additional"
                                )
                                .map((ad, i) => (
                                  <tr key={i}>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.loan_id
                                            ? "Loan"
                                            : ad.account_list_sub3
                                                .account_list_base_sub
                                                .module_type
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.loan_id
                                            ? "Loan"
                                            : ad.account_list_sub3
                                                .account_list_base_sub
                                                .subject_name
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.loan_id
                                            ? ad.loan_mother.loan_name
                                            : ad.account_list_sub3.account_name
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={ad.description}
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={ad.amount.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                        readOnly
                                      />
                                    </td>
                                    {selected_currency_id == 1 ? null : (
                                      <>
                                        <td>
                                          <Form.Control
                                            type="text"
                                            value={ad.rate}
                                            readOnly
                                          />
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                            </tbody>

                            {renderExpenseTable("additional")}
                          </Table>

                          <br />
                          {isEditing && (
                            <Button
                              onClick={() =>
                                handleAdditionalExpenses("additional")
                              }
                            >
                              Add New List
                            </Button>
                          )}
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="DeductionExpenses">
                      <div className="border p-3 rounded">
                        <h5>Deduction Expenses</h5>
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead>
                              <tr>
                                <th>Subject1</th>
                                <th>Subject2</th>
                                <th>Subject3</th>
                                <th>Remarks</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {addDeducts
                                .filter(
                                  (ad) => ad.type_expenses === "deduction"
                                )
                                .map((ad, i) => (
                                  <tr key={i}>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.account_list_sub3
                                            .account_list_base_sub.module_type
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.account_list_sub3
                                            .account_list_base_sub.subject_name
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={
                                          ad.account_list_sub3.account_name
                                        }
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={ad.description}
                                        readOnly
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="text"
                                        value={ad.amount}
                                        readOnly
                                      />
                                    </td>
                                    {selected_currency_id == 1 ? null : (
                                      <>
                                        <td>
                                          <Form.Control
                                            type="text"
                                            value={ad.rate}
                                            readOnly
                                          />
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                            </tbody>
                            {renderExpenseTable("deduction")}
                          </Table>
                          <br />
                          {isEditing && (
                            <Button
                              onClick={() =>
                                handleAdditionalExpenses("deduction")
                              }
                            >
                              Add New List
                            </Button>
                          )}
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
              <div className="row mt-5">
                <div className="col-sm">
                  <div className="d-flex justify-content-between">
                    <span>Expenses</span>
                    <span className="text-secondary">
                      {expensesTotalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Additional Expenses</span>
                    <span className="text-secondary">
                      {additionalTotalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Deduction Expenses</span>
                    <span className="text-secondary">
                      {deductionTotalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Payments</span>
                    <span className="text-secondary">
                      {totalPayment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                    <span>Payable Expenses</span>
                    <span>
                      {payableExpenses.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="col-sm"></div>
                <div className="col-sm">
                  <div className="d-flex justify-content-between">
                    <span>Cash</span>
                    <span className="text-secondary">
                      {cashTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Bank</span>
                    <span className="text-secondary">
                      {bankTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Check</span>
                    <span className="text-secondary">
                      {checkTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Online</span>
                    <span className="text-secondary">
                      {onlineTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                    <span>Total Payment</span>
                    <span>
                      {totalPayment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {bulkExpenses.status === "For-Approval" && (
                <div className="row mt-4">
                  <div className="col-sm"></div>
                  <div className="col-sm"></div>
                  <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                    {isEditing ? (
                      <>
                        <button
                          className="btn btn-outline-danger w-100 me-3"
                          type="button"
                          onClick={handleCancelEditTransaction}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          onClick={handleUpdate}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        {authrztn.includes(approvePermission) && (
                          <>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex gap-3">
                                <button
                                  className="btn btn-outline-danger w-50"
                                  type="button"
                                  onClick={handleReject}
                                  disabled={isCutoffPosted}
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary w-50"
                                  onClick={handleApprove}
                                  disabled={isCutoffPosted}
                                >
                                  Approve
                                </button>
                              </div>
                              <div>
                                <p
                                  className={`text-danger ${
                                    !isCutoffPosted && "invisible"
                                  }`}
                                >
                                  {" "}
                                  Action is prohibited as the Other Income date
                                  has already been posted.
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLocalPayExpenses;
