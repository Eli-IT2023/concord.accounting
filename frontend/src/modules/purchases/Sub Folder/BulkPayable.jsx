import React, { useState, useEffect } from "react";
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

const BulkPayable = () => {
  const navigate = useNavigate();
  const { module } = useParams();
  const location = useLocation();
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
  const [currency, setCurrency] = useState("");
  const [isAmountDisabled, setIsAmountDisabled] = useState(true);

  //For modal New Item
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);

  const userLoggedID = useDecodeToken(); // For token
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [paginationUrl, setPaginationUrl] = useState("");

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
    setAvailablePayables((prev) => {
      return prev.filter((item) => !selectedRow.includes(item.id));
    });

    setPayableList((prev) => {
      return [
        ...prev,
        ...availablePayables
          .filter((item) => selectedRow.includes(item.id))
          .map((item) => {
            // Find the selected payable for the current item
            const selectedPayable = availablePayables.find(
              (payable) => payable.transaction_id === item.transaction_id
            );

            // Extract product price from payable_products
            const productPrice =
              selectedPayable?.payable_products?.[0]?.product_tag_vendor
                ?.product_price || "";

            const totalAmountPrice = selectedPayable.totalPrice;

            return {
              id: item.id || "",
              transactionId: item.transaction_id || "",
              invoiceDate: item.createdAt || "",
              purchaseDate: item.purchaseDate || "",
              description: item.description || "",
              dueDate: item.due_date || "",
              amount: productPrice || "",
              discount: item.discount_value || "",
              totalAmount: totalAmountPrice,
              newItemList: true,
            };
          }),
      ];
    });

    setSelectedRow([]);
    setFilterColumn("all");
    setSearchTerm("");
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
      selector: (row) => row.transaction_id,
    },
    {
      name: "Remarks",
      selector: (row) => row.description,
    },
    {
      name: "Purchase Date",
      selector: (row) => `${format(row.purchaseDate, "MMM dd, yyyy")}`,
    },
    {
      name: "Due Date",
      selector: (row) => `${format(row.due_date, "MMM dd, yyyy") || ""}`,
    },
    {
      name: "Amount",
      selector: (row) =>
        // `${
        //   row.payable_products &&
        //   row.payable_products[0] &&
        //   row.payable_products[0].product_tag_vendor
        //     ? row.payable_products[0].product_tag_vendor.product_price
        //     : ""
        // }`,
        row.totalPrice.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
    {
      name: "Discount",
      selector: (row) => `${row.discount_value}`,
    },
  ];

  const addNewItem = () => {
    if (currency == "" || selectedVendorId == null) {
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
    console.log("Selected Transaction IDs:", selectedTransactionIds);

    fetchPayableList(
      selectedVendorId,
      module,
      searchTerm,
      filterColumn,
      payableList,
      currency
    );

    // Filter payables based on currency and selected transactions
    const filteredPayables = allPayable.filter(
      (payable) =>
        !selectedTransactionIds.includes(payable.transaction_id) &&
        payable.currencyId == currency
    );

    // Update available payments
    setAvailablePayables(filteredPayables);

    handleShow();
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
      return prev.filter((item) => item !== item.id);
    });
  };

  useEffect(() => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((response) => {
        const mappedVendors = response.data.map((data) => ({
          value: data.id,
          label: data.company_name,
        }));
        setVendorMap(mappedVendors);
        // setSelectedTransactionId(mappedVendors[0]?.value || null);
      })
      .catch((error) => {
        console.error("Error fetching vendor:", error);
      });
  }, []);

  const pagination = useServerPagination(paginationUrl, 10);

  const paginationHook = usePagination(availablePayables, 10);

  const fetchPayableList = (
    vendorId,
    module,
    searchTerm,
    filterColumn,
    payableList,
    currency
  ) => {
    setPaginationUrl(
      `${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}/?module=${module}`
    );
    pagination.updateParams({
      id: vendorId,
      module: module,
      searchText: searchTerm,
      filterColumn,
      payableList,
      currency,
    });
    setSelectedVendorId(vendorId);
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
      selectedVendorId,
      module,
      searchTerm,
      filterColumn,
      payableList,
      currency
    );
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  const handleVendorChange = (event) => {
    const vendorId = event.target.value;
    if (vendorId) {
      // Clear the current payableList
      setPayableList([]);
      setBalance(0);
      setCurrency("");
      setFloatPayment([]);

      fetchPayableList(
        vendorId,
        module,
        searchTerm,
        filterColumn,
        payableList,
        currency
      );
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
    const dateToday = `${year}${month}${day}`;

    let lastTransaction = localStorage.getItem(`transaction-${dateToday}`);
    let newTransactionNumber;

    if (lastTransaction) {
      const lastNumber = parseInt(lastTransaction.slice(-4));
      const incrementedNumber = String(lastNumber + 1).padStart(4, "0");
      newTransactionNumber = `${dateToday}${incrementedNumber}`;
    } else {
      newTransactionNumber = `${dateToday}0001`;
    }

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

    try {
      axios
        .get(`${BASE_URL}/payable/getSubject1LocalPayable`, {
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
        .get(`${BASE_URL}/payable/getSubject3LocalPayable`, {
          params: {
            subjectId: selectedSubject2,
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
              subject2: subject2,
              subject3: subject3,
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

        const res = await axios.post(`${BASE_URL}/payable/addPayment`, {
          // payableList: filteredData,
          payableList,
          transactionNumber,
          selectedVendorId,
          currency,
          floatPayment,
          balance,
          payableDate,
          currentLocation,
          subject3,
          createdBy: userLoggedID,
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
            navigate(
              `/purchases/${
                module === "local" ? "local-purchase" : "overseas-purchase"
              }`
            );
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
    setValidated(true);
  };

  const fetchCurrency = async () => {
    try {
      let res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setAllCurrency(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    // setPayableList([
    //   {
    //     id: "",
    //     transactionId: "",
    //     invoiceDate: "",
    //     dueDate: "",
    //     amount: "",
    //     discount: "",
    //     totalAmount: "",
    //   },
    // ]);
    setBalance(0);
    setFloatPayment([]);
  };

  // Balance Details Cash
  const cash = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Cash";
    })
    .reduce((total, value) => {
      return total + parseFloat(value.amountInputted);
    }, 0);

  // Balance Details Account
  const account = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Bank" && data.checkNumber == "";
    })
    .reduce((total, value) => {
      return total + parseFloat(value.amountInputted);
    }, 0);

  // Balance Details Check
  const check = floatPayment
    .filter((data) => {
      return data?.paymentMethod == "Bank" && data.checkNumber != "";
    })
    .reduce((total, value) => {
      return total + parseFloat(value.amountInputted);
    }, 0);

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
    const totalAmount = payableList.reduce((sum, item) => {
      const amount = parseFloat(item.totalAmount) || 0;
      return sum + amount;
    }, 0);
    setBalance(totalAmount);
    setTotalAmountSum(totalAmount - (cash + account + check));
  }, [payableList]);

  useEffect(() => {
    fetchCurrency();
    setPayableDate(dateToday());
    setCurrentDate(dateToday());
  }, []);

  useEffect(() => {
    if (amountInputted) {
      handleAmountValue(amountInputted);
    }
  }, [date]);

  useEffect(() => {
    setAllPayable(
      pagination.data.map((item) => {
        return {
          ...item,
        };
      })
    );

    setAvailablePayables(
      pagination.data.map((item) => {
        return {
          ...item,
        };
      })
    );
  }, [pagination.data]);

  useEffect(() => {
    if (
      searchTerm &&
      searchTerm.trim() !== "" &&
      pagination.currentPage === 1 &&
      availablePayables.length < 10
    ) {
      pagination.setTotalPages(
        Math.ceil(availablePayables?.length / pagination.itemsPerPage)
      );
    }
  }, [availablePayables]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link
              to={`${
                module === "local"
                  ? "/purchases/local-purchase"
                  : "/purchases/overseas-purchase"
              }`}
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
            <div className="input-group mb-2">
              <Form.Select
                className="form-select p-2"
                required
                onChange={handleVendorChange}
                value={selectedVendorId}
              >
                <option disabled selected value="">
                  Select Vendor
                </option>
                {vendorMap.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
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
              >
                <option disabled selected value="">
                  Select Currency
                </option>
                {allCurrency.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.currency_name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="col-sm">
            <span>Balance</span>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text h-100">₱</div>
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
            {/* <input
              type="date"
              name=""
              id=""
              value={payableDate}
              required
              onChange={(e) => setPayableDate(e.target.value)}
              className="form-control p-2"
            /> */}
            <div>
              <DatePicker
                selected={payableDate}
                onChange={(date) => {
                  setPayableDate(date);
                }}
                dateFormat="MMM dd, yyyy"
                className="form-control p-2"
                customInput={<CustomInput />}
              />
            </div>
          </div>
        </div>
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
                    <td>
                      <input
                        className="form-control"
                        value={item.transactionId || ""}
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
                          dateFormat="MMM dd, yyyy"
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
                          dateFormat="MMM dd, yyyy"
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
                      <option value="" disabled>
                        Select Account name
                      </option>
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
                        maxLength={15}
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
                    <div>
                      <DatePicker
                        selected={date}
                        dateFormat="MMM dd, yyyy"
                        onChange={(date) => {
                          setDate(date);
                          setIsAmountDisabled(false);
                        }}
                        className="form-control p-2"
                        customInput={<CustomInput />}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">₱</span>
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
                          <th className="p-2">Type</th>
                          <th className="p-2">Account Name</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Check Number</th>
                          <th className="p-2">Ref Number</th>
                          <th className="p-2">Issue Date</th>
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
                              {data.amountInputted?.toLocaleString("en-US", {
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
                        {" "}
                        {totalAmountSum.toLocaleString("en-US", {
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
          <Modal.Title>Payable Lists</Modal.Title>
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
