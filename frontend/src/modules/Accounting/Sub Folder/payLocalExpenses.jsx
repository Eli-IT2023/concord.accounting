import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Modal, Nav, Tab, Table } from "react-bootstrap";
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
import maskCurrency from "../../../utils/maskCurrency";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const LocalBulkExpenses = ({ authrztn, roleType }) => {
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
  const { foreign_url } = useParams();
  const [validated, setValidated] = useState(false);
  const [localExpensesData, setLocalExpensesData] = useState([]);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [date, setDate] = useState("");
  const [payExpensesDate, setPayExpensesDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [currencyName, setCurrencyName] = useState("");
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [items, setItems] = useState([
    // {
    //   transactionId: "",
    //   expensesType: "",
    //   expensesDate: "",
    //   totalAmount: "",
    //   description: "",
    // },
  ]);
  // const [editIndex, setEditIndex] = useState(null);
  const foreignExpenses = foreign_url === "local" ? "LOCAL" : "OVERSEAS";

  //useState sa payment method
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
  const [amountInputted, setAmountInputted] = useState("0"); //amount 'to sa payment method
  const [onlineWalletRemarks, setOnlineWalletRemarks] = useState("");
  const [totalPayment, setTotalPayment] = useState(0);
  const [isAmountDisabled, setIsAmountDisabled] = useState(true);
  const [currency_db, setCurrency_db] = useState([]);
  const [selected_currency_id, setSelected_currency_id] = useState("");
  const [floatPayment, setFloatPayment] = useState([]);

  //useState sa additional expenses
  const [activeTab, setActiveTab] = useState("paymentList");
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
        LoanORAccount: "",
        rate: "",
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
        rate: "",
        currentAmount: "",
      },
    },
  });
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const currencyRef = useRef(null);

  const deletePayment = (item, index) => {
    setFloatPayment((prev) => {
      return prev.filter((_, i) => {
        return index !== i;
      });
    });
    setTotalAmountSum((prev) => {
      return prev + item.amountInputted;
    });
  };

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

    setItems((prev) => {
      return [
        ...prev,
        ...localExpensesData.filter((item) =>
          selectedRow.includes(item.transaction_id)
        ),
      ];
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
      omit: !roleType?.includes("Management"),
    },
  ];

  // Function to add a new expenses row
  const addNewItem = () => {
    if (!selected_currency_id) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML =
        "Please select currency first to proceed to the Expenses List";

      swal({
        icon: "warning",
        title: "Currency Selection Required",
        content: wrapper,
        button: "OK",
      }).then(() => {
        currencyRef.current.focus();
        currencyRef.current.showPicker();
      });

      return;
    }
    handleShow();
  };

  // Function to delete a row
  const deleteItem = (item, index) => {
    // if (items.length === "11111111-1111-1111-1111-111111111111") {
    //   // Prevent deleting the last row if there's only one row
    //   return;
    // }

    setLocalExpensesData((prev) => {
      return [...prev, item];
    });

    setItems((prev) => {
      return prev.filter((_, i) => index !== i);
    });

    setSelectedRow((prev) => {
      return prev.filter((item) => item !== item.transaction_id);
    });

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

  // Function to toggle edit mode
  // const toggleEdit = (index) => {
  //   setEditIndex(editIndex === index ? null : index);
  // };

  const fetchTransactionCode = () => {
    axios
      .get(BASE_URL + "/paylocalexpenses/payLocalExpensesTransactionCode")
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

  const handleCurrencyChange = (value) => {
    setSelected_currency_id(value);

    const currency_symbol = currency_db.find(
      (currency) => String(currency.id) === String(value)
    );

    if (currency_symbol) {
      setCurrencyName(currency_symbol.currency_name);
      // setItems([
      //   {
      //     transactionId: "",
      //     expensesType: "",
      //     expensesDate: "",
      //     totalAmount: "",
      //     description: "",
      //   },
      // ]);
    }

    fetchExpensesList(foreign_url, value);
  };

  const pagination = useServerPagination(
    BASE_URL + "/paylocalexpenses/getLocalExpensesData",
    10
  );

  const fetchExpensesList = (foreign_url, currency_id) => {
    pagination.updateParams({
      foreign: foreign_url,
      currency_id: currency_id,
      searchText: searchTerm,
      filterColumn,
    });
    // axios
    //   .get(BASE_URL + "/paylocalexpenses/getLocalExpensesData", {
    //     params: {
    //       foreign: foreign_url,
    //       currency_id: currency_id,
    //       searchText: searchTerm,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setLocalExpensesData(
    //       res.data.filter(
    //         (data) =>
    //           !items
    //             .map((item) => item.transaction_id)
    //             .includes(data.transaction_id)
    //       )
    //     );
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  //section para sa payment method to
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

  const handleTransactionChange = (index, transactionId) => {
    const transaction = localExpensesData.find(
      (t) => t.id.toString() === transactionId
    );
    if (transaction) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        transactionId: transactionId,
        id: transaction.transaction_id,
        expensesType: `${transaction.expenses2.expenses_one.expenses_type_one} (${transaction.expenses2.sub_type})`, // or another suitable field for 'expensesType'
        expensesDate: transaction.expenses_date
          ? new Date(transaction.expenses_date).toISOString().split("T")[0]
          : "",
        totalAmount: transaction.totalAmount || 0,
        description: transaction.description || "n/a",
        remarks: transaction.desc,
      };
      setItems(updatedItems);
      console.log("Selected transaction ID:", transactionId);
      console.log("Updated items:", updatedItems);
    }
  };

  const getAvailableTransactionIds = (index) => {
    const selectedTransactionIds = items
      .map((item) => item.transactionId)
      .filter((id) => id);
    return localExpensesData.filter(
      (transaction) =>
        !selectedTransactionIds.includes(transaction.id.toString()) ||
        items[index].transactionId === transaction.id.toString()
    );
  };

  useEffect(() => {
    const sum = items.reduce(
      (acc, item) => acc + parseFloat(item.totalAmount || 0),
      0
    );

    console.log(items);
    setTotalAmountSum(sum);
  }, [items]);

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

  const totalCashPaid = floatPayment.reduce(
    (acc, data) =>
      data.paymentMethod === "Cash"
        ? acc + parseFloat(data.amountInputted || 0)
        : acc,
    0
  );

  const totalBankPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber === "" &&
      data.refNumber === "" &&
      data.paymentMethod === "Bank"
        ? acc + parseFloat(data.amountInputted || 0)
        : acc,
    0
  );

  const totalCheckPaid = floatPayment.reduce(
    (acc, data) =>
      data.checkNumber !== ""
        ? acc + parseFloat(data.amountInputted || 0)
        : acc,
    0
  );

  const totalOnlinePaid = floatPayment.reduce(
    (acc, data) =>
      data.refNumber !== "" && data.paymentMethod === "Bank"
        ? acc + parseFloat(data.amountInputted || 0)
        : acc,
    0
  );

  const totalPaymentMethodAmount =
    totalCashPaid + totalBankPaid + totalCheckPaid + totalOnlinePaid;
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
  //section para sa payment method to end

  //section para sa mga add and deduction expenses

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

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
          console.log("Subject 2 Change", res.data);
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
        return prev;
      }

      return {
        ...prev,
        [expenseType]: {
          ...prev[expenseType],
          [rowId]: { ...currentRow, amount: formattedValue },
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

  const sumAmounts = (type) => {
    return Object.values(expenses[type]).reduce((acc, expense) => {
      const multiplyTo = selected_currency_id == 1 ? 1 : expense.rate;
      return (
        acc +
        (parseFloat(String(expense.amount).replace(/,/g, "")) || 0) * multiplyTo
      );
    }, 0);
  };

  const toPayAmount = parseFloat(totalAmountSum);
  const totalPayAmount = parseFloat(totalPayment);

  const sumOfAdditionalandToPay = sumAmounts("additional") + toPayAmount;
  const sumOfDeductionandTotalPayment =
    sumAmounts("deduction") + totalPayAmount;
  const payableExpenses =
    sumOfAdditionalandToPay - sumOfDeductionandTotalPayment;

  const renderExpenseTable = (type) => (
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
          <th>Action</th>
        </tr>
      </thead>
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
                {/* {type === "additional" && (
                  <option value="Loan_Unique">Loan</option>
                )} */}
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
                onChange={(e) => {
                  const selectedValue = e.target.value;

                  const selectedOption = row.subject3Options.find(
                    (option) => option.id == parseFloat(selectedValue)
                  );

                  const currAmount = selectedOption?.amount || 0;

                  handleSubject3AddExpensesChange(
                    rowId,
                    selectedValue,
                    type,
                    row.subject1 === "Loan_Unique" ? "loan" : "account",
                    currAmount
                  );
                }}
                required
                disabled={row.disabledSubject3}
              >
                <option disabled value="">
                  Select Subject 3
                </option>

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
                onChange={(e) =>
                  handleRemarksChange(rowId, e.target.value, type)
                }
                placeholder="Description ..."
              />
            </td>
            <td>
              <Form.Control
                type="text"
                value={row.amount}
                onChange={(e) =>
                  handleAmountChange(rowId, e.target.value, type)
                }
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
    </Table>
  );
  //section para sa mga add and deduction expenses

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
        title: "Create this new expenses?",
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

  const handleSavePayment = async () => {
    if (payExpensesDate === "") {
      swal({
        icon: "warning",
        title: "Pay Date is required",
        text: "Please select the pay date",
        buttons: false,
        timer: 2000,
      });
      return;
    }
    const confirmed = await swal({
      title: "Create this new expenses?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

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
            rate: expense.rate || 1,
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
            rate: expense.rate || 1,
          });
        }

        const res = await axios.post(
          `${BASE_URL}/paylocalExpenses/addPayment`,
          {
            items,
            payExpensesDate,
            transactionNumber,
            floatPayment,
            expenses: expensesToSubmit,
            foreign_url: foreign_url,
            userLoggedID,
          }
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Payment Expenses has been added successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            if (foreign_url === "local") {
              navigate("/accounting/local-expenses");
            } else {
              navigate("/accounting/overseas-expenses");
            }
          });
        }
      } catch (error) {
        if (error.response && error.response.status === 409) {
          swal({
            title: "Oopps!",
            text: "Action is prohibited because the date provided for the Pay Date has already passed the posted cutoff.",
            icon: "error",
            button: true,
          });
          return;
        }

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
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
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
      required
    />
  ));

  useEffect(() => {
    if (pagination.data) {
      setLocalExpensesData(
        pagination.data.filter(
          (data) =>
            !items
              .map((item) => item.transaction_id)
              .includes(data.transaction_id)
        )
      );
    }
  }, [pagination.data]);

  useEffect(() => {
    if (pagination.currentPage === 1 && localExpensesData.length < 10) {
      pagination.setTotalPages(
        Math.ceil(localExpensesData?.length / pagination.itemsPerPage)
      );
    }
  }, [localExpensesData]);

  useEffect(() => {
    fetchTransactionCode();
    fetchCurrency();
    setPayExpensesDate(dateToday());
    setCurrentDate(dateToday());
  }, []);

  useEffect(() => {
    if (amountInputted) {
      handleAmountValue(amountInputted);
    }
  }, [date]);

  useEffect(() => {
    fetchExpensesList(foreign_url, selected_currency_id);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
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
            {foreignExpenses} EXPENSES
          </span>
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
                value={transactionNumber}
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
              ref={currencyRef}
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
          <div className="col-sm">
            <span>Pay Date</span>
            {/* <input
              type="date"
              name=""
              id=""
              value={payExpensesDate}
              className="form-control p-2"
              onChange={(e) => setPayExpensesDate(e.target.value)}
              required
            /> */}
            <div>
              <DatePicker
                selected={payExpensesDate}
                onChange={(date) => {
                  setPayExpensesDate(date);
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
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Amount
                  </th>
                  {/* <th className="p-2">Description</th> */}
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              {items?.length > 0 ? (
                <tbody>
                  {items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="form-control"
                          value={item.transaction_id || ""}
                          type="text"
                          readOnly
                        />
                      </td>
                      <td>
                        {/* <select
                        disabled={selected_currency_id === ""}
                        className="form-select form-select-sm p-2"
                        onChange={(e) =>
                          handleTransactionChange(index, e.target.value)
                        }
                        value={item.transactionId}
                      >
                        <option value="" disabled>
                          Select Remarks
                        </option>
                        {getAvailableTransactionIds(index).map(
                          (transaction) => (
                            <option key={transaction.id} value={transaction.id}>
                              {transaction.desc}
                            </option>
                          )
                        )}
                      </select> */}
                        <input
                          className="form-control"
                          value={item.desc || ""}
                          type="text"
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={
                            `${item.expenses2.expenses_one.expenses_type_one} (${item.expenses2.sub_type})` ||
                            ""
                          }
                        />
                      </td>
                      <td>
                        {/* <input
                          type="date"
                          className="form-control form-control-sm p-2"
                          readOnly
                          value={item.expenses_date || ""}
                        /> */}

                        <DatePicker
                          selected={item.expenses_date}
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
                            item.totalAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"
                          }
                          readOnly
                        />
                      </td>
                      {/* <td className="text-center">
                      <div className="input-group mb-2">
                        <Form.Control
                          type="text"
                          className="form-control-sm p-2"
                          id="inlineFormInputGroup"
                          value={item.description}
                          readOnly
                        />
                      </div>
                    </td> */}
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
            New Expenses
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
                    ...(roleType?.includes("Management")
                      ? [{ value: "totalAmount", label: "Amount" }]
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
                    <Form.Label>Date</Form.Label>
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
                        value={amountInputted}
                        onInput={onInputFloat}
                        onChange={(e) => handleAmountValue(e.target.value)}
                        disabled={isAmountDisabled}
                      />
                    </div>
                    <span>
                      Account Balance:{" "}
                      <strong>
                        {roleType?.includes("Management") ? (
                          bankAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        ) : (
                          <span
                            className="masked-value"
                            style={{ fontSize: "1rem", fontWeight: "bold" }}
                          >
                            {maskCurrency(10)}
                          </span>
                        )}
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
                                <th
                                  className={
                                    roleType?.includes("Management")
                                      ? ""
                                      : "d-none"
                                  }
                                >
                                  Amount
                                </th>
                                <th>Check Number</th>
                                <th>Issue Date</th>
                                <th>Online Wallet</th>
                                <th>Online Reference No.</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {floatPayment.map((data, i) => (
                                <tr>
                                  <td>{data.paymentMethod}</td>
                                  <td>
                                    {data.accountName === ""
                                      ? "--"
                                      : data.accountName}
                                  </td>
                                  <td
                                    className={
                                      roleType?.includes("Management")
                                        ? ""
                                        : "d-none"
                                    }
                                  >
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
                                  <td>
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
                          </Table>
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="AddExpenses">
                      <div className="border p-3 rounded">
                        <h5>Additional Expenses</h5>
                        <div className="table-responsive">
                          {renderExpenseTable("additional")}
                        </div>
                        <div className="row mt-3">
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm">
                            <Button
                              variant="primary"
                              onClick={() => handleAddRow("additional")}
                              className="w-100"
                              type="button"
                            >
                              Add New List
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="DeductionExpenses">
                      <div className="border p-3 rounded">
                        <h5>Deduction Expenses</h5>
                        <div className="table-responsive">
                          {renderExpenseTable("deduction")}
                        </div>
                        <div className="row mt-3">
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm"></div>
                          <div className="col-sm">
                            <Button
                              variant="primary"
                              onClick={() => handleAddRow("deduction")}
                              className="w-100"
                              type="button"
                            >
                              Add New List
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
              <div
                className={
                  roleType?.includes("Management") ? "row mt-5" : "d-none"
                }
              >
                <div className="col-sm">
                  <div className="d-flex justify-content-between">
                    <span>Expenses</span>
                    <span className="text-secondary">
                      {totalAmountSum.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Additional Expenses</span>
                    <span className="text-secondary">
                      {sumAmounts("additional").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Deduction Expenses</span>
                    <span className="text-secondary">
                      {sumAmounts("deduction").toLocaleString("en-US", {
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
                    <span>Payable Expenses :</span>
                    <span>
                      <span>{currencyName} &nbsp;</span>
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
                      {totalCashPaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Bank</span>
                    <span className="text-secondary">
                      {totalBankPaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Check</span>
                    <span className="text-secondary">
                      {totalCheckPaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <label>Online</label>
                    <span className="text-secondary">
                      {totalOnlinePaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                    <span>Total Payment :</span>
                    <span>
                      <span>{currencyName} &nbsp;</span>
                      {totalPaymentMethodAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {/* {totalCashPaid +
                                    totalBankPaid +
                                    totalCheckPaid +
                                    totalOnlinePaid} */}
                    </span>
                  </div>
                </div>
              </div>
              <div className="row mt-4">
                <div className="col-sm"></div>
                <div className="col-sm"></div>
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  {/* <button
                    className="btn btn-outline-secondary w-100 me-3"
                    type="button"
                    onClick={() => {
                      if (foreign_url === "local") {
                        navigate("/accounting/local-expenses");
                      } else {
                        navigate("/accounting/overseas-expenses");
                      }
                    }}
                  >
                    Cancel
                  </button> */}
                  {floatPayment.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSavePayment}
                      className="btn btn-primary w-100"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalBulkExpenses;
