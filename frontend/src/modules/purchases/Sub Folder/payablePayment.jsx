import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  InputGroup,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import swal from "sweetalert";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import useStore from "../store/payablePayment"; // fetch payable data
import paymentStore from "../store/fetchPayment"; // for payment data fetch
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
// pdf
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import PayablePDF2 from "./PayablePDF2";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
// import { set } from "react-hook-form";
import { format } from "date-fns";
// import DatePicker from "react-datepicker";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import "../../../assets/css/style.css";
import CustomDatePicker from "../../../components/CustomDatePicker";

const PayablePayment = ({ authrztn }) => {
  const { id } = useParams();

  const {
    vendorId,
    vendorName,
    // setVendorID,
    email,
    // setEmail,
    country,
    // setCountry,
    warehouseID,
    setWarehouseID,
    warehouseName,
    transaction_id,
    clientTransactionId,
    createdAt,
    isPaid,
    due_date,
    purchaseDate,
    setPurchaseDate,
    containerNumber,
    setContainerNumber,
    pier,
    setPier,
    currencyId,
    setCurrencyId,
    currency_name,
    description,
    setDescription,
    modeOfPayment,
    domestic_type,
    setDomestic_type,
    tracking_number,
    setTracking_number,
    setDue_date,
    weighingFee,
    setWeighingFee,
    discountType,
    approvedBy,
    createdBy,
    isCutoffPosted,
    discountValue,
    status,
    dataProduct,
    // setDataProduct, // array from useStore
    dataOtherFees, // array from useStore
    fetchData,
    removeDataProduct,
    removeDataProductIds,
    currencyRate,
    updateDataProduct,
    setCurrencyRate,
  } = useStore();

  const { fetchDataPayment } = paymentStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [validated, setValidated] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [product, setProduct] = useState([]); // for select
  const [vendorsEdit, setVendorsEdit] = useState([]); // for select if edit
  const [warehouseEdit, setWarehouseEdit] = useState([]); // for select if edit
  const [currencyEdit, setCurrencyEdit] = useState([]);
  // const [accountListData, setAccountListData] = useState([]); // get account list
  // const [availableDataProduct, setAvailableDataProduct] = useState([]);
  const [floatDataProduct, setFloatDataProduct] = useState([]);

  const [payment, setPayment] = useState("Cash");
  const [accountName, setAccountName] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [discountBackend, setDiscountBackend] = useState("");
  const [editableCurrencyRate, setEditableCurrencyRate] =
    useState(currencyRate);

  const [totalWeight, setTotalWeight] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalLNetweight, setTotalLNetweight] = useState(0); // left side (KL)
  const [totalRNetweight, setTotalRNetweight] = useState(0); // right side (KL)

  const [print, setPrint] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const [isCutoffExists, setIsCutoffExists] = useState(true);
  const [IsCutoffPosted, setIsCutoffPosted] = useState(false);

  const userLoggedID = useDecodeToken();

  const onInputFloat = (e) => {
    // If current value is "0" and user types a digit, replace it
    if (
      e.target.value.startsWith("0") &&
      e.target.value.length === 2 &&
      e.target.value[1] !== "."
    ) {
      e.target.value = e.target.value.slice(1);
    }
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  useEffect(() => {
    const updatedTotalWeight = [...dataProduct, ...floatDataProduct].reduce(
      (acc, data) =>
        acc +
        parseFloat(
          String(data.weight).replace(/,/g, "") *
            (data.unitPrice || data.unitPrice) || 0
        ),
      0
    );
    // commented kasi may calculation for ylluja na dapat eradicate lahat ng decimal without rounding up

    // const updatedTotalMoisture = [...dataProduct, ...floatDataProduct].reduce(
    //   (acc, data) => {
    //     if (data.moisture_type === "%") {
    //       return (
    //         acc +
    //         parseFloat(
    //           (String(data.moisture).replace(/,/g, "") / 100) *
    //             (data.unitPrice || data.unitPrice) *
    //             (String(data.weight).replace(/,/g, "") || 0)
    //         )
    //       );
    //     } else {
    //       return acc + parseFloat(String(data.moisture).replace(/,/g, "") || 0);
    //     }
    //   },
    //   0
    // );

    const updatedTotalMoisture = [...dataProduct, ...floatDataProduct].reduce(
      (acc, data) => {
        const weight = parseFloat(String(data.weight).replace(/,/g, "")) || 0;
        const moisture =
          parseFloat(String(data.moisture).replace(/,/g, "")) || 0;
        const unitPrice =
          parseFloat(String(data.unitPrice).replace(/,/g, "")) || 0;

        if (data.moisture_type === "%") {
          // Calculate net weight after moisture removal (truncated)
          const netWeight = Math.floor(weight * (1 - moisture / 100));

          // Moisture amount in peso = (Original Weight - Net Weight) × Unit Price
          const moistureAmount = (weight - netWeight) * unitPrice;

          return acc + moistureAmount;
        } else {
          // Moisture is already in peso, add directly
          return acc + moisture;
        }
      },
      0
    );

    const updatedTotalNetWeight = [...dataProduct, ...floatDataProduct].reduce(
      (acc, data) =>
        acc +
        parseFloat(
          String(data.net_weight).replace(/,/g, "") *
            (data.unitPrice || data.unitPrice) || 0
        ),
      0
    );

    setTotalWeight(updatedTotalWeight);
    setTotalMoisture(updatedTotalMoisture);
    setTotalRNetweight(updatedTotalNetWeight);
  }, [dataProduct, floatDataProduct]);

  // const totalWeight = dataProduct.reduce(
  //   (acc, data) =>
  //     acc +
  //     parseFloat(data.weight * data.product_tag_vendor.product_price || 0),
  //   0
  // );

  // const calculateNetWeight = (index) => {
  //   netWeight = weight * (1 - moisture / 100);

  //   return netWeight;
  // };

  const totalOtherFees = dataOtherFees.reduce(
    (acc, data) => acc + parseFloat(data.fee_amount || 0),
    0
  );

  // const transactionID = transaction_id;

  const addNewItem = () => {
    setFloatDataProduct((prev) => [
      ...prev,
      {
        productCode: "",
        uom: "",
        unitPrice: 0,
        weight: 0,
        moisture: "0",
        moisture_type: "%",
      },
    ]);
  };

  // const totalMoisture = dataProduct.reduce((acc, data) => {
  //   if (data.moisture_type === "%") {
  //     return (
  //       acc +
  //       parseFloat(
  //         (data.moisture / 100) *
  //           data.product_tag_vendor.product_price *
  //           data.weight || 0
  //       )
  //     );
  //   } else {
  //     return acc + parseFloat(data.moisture || 0);
  //   }
  // }, 0); // Initial value for the accumulator

  const calculateDiscount = () => {
    const numValue = parseFloat(discountValue);
    // if (isNaN(numValue)) return "0.00";

    if (discountType === "%") {
      setDiscountBackend(
        (numValue / 100) *
          parseFloat(totalWeight - totalMoisture - weighingFee - totalOtherFees)
      );
    } else {
      setDiscountBackend(numValue);
    }
  };

  const toPayAmount =
    parseFloat(totalWeight - totalMoisture - weighingFee - totalOtherFees) -
    parseFloat(discountBackend);

  // const balance_now = toPayAmount - balanceNow;

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }
  // function formatDatetime(datetime) {
  //   const options = {
  //     year: "numeric",
  //     month: "2-digit",
  //     day: "2-digit",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   };
  //   return new Date(datetime).toLocaleString("en-US", options);
  // }

  // const onInputFloat = (e) => {
  //   e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  // };

  const fetchProductData = () => {
    axios
      .get(BASE_URL + "/payable/getProductData", {
        params: {
          vendorId,
        },
      })
      .then((res) => {
        setProduct(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchVenderData = () => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((res) => {
        setVendorsEdit(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchWarehousData = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setWarehouseEdit(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCurrency = async () => {
    try {
      const res = await axios.get(BASE_URL + "/currency/fetchCurrency");
      setCurrencyEdit(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // const fetchAvailableProduct = () => {
  //   axios
  //     .get(BASE_URL + "/payable/getAvailableProductVendor", {
  //       params: { vendorId },
  //     })
  //     .then((res) => {
  //       console.log("****************************res.data: ", res.data);
  //       setAvailableDataProduct(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // };

  // const fetchAccountData = async () => {
  //   // console.log(payment);
  //   try {
  //     const res = await axios.get(
  //       `${BASE_URL}/payable_payment/getAccountListData`,
  //       {
  //         params: {
  //           payment,
  //         },
  //       }
  //     );
  //     setAccountListData(res.data);
  //     setValidated(false);
  //     setBankAmount("0");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleAccountChange = (e) => {
  //   const selectedAccountId = e.target.value;
  //   setAccountName(selectedAccountId);

  //   // Find the selected account in the accountListData
  //   const selectedAccount = accountListData.find(
  //     (account) => account.account_list_id === String(selectedAccountId, 10)
  //   );

  //   // Update the bankAmount if an account is found
  //   if (selectedAccount) {
  //     setBankAmount(selectedAccount.bank_amount);
  //   } else {
  //     setBankAmount("0");
  //   }
  // };

  useEffect(() => {
    // fetchAccountData();
    fetchData(id);
    fetchDataPayment(id);

    axios
      .get(`${BASE_URL}/payable/getInfo`, {
        params: { id },
      })
      .then((res) => {
        if (res.data) {
          setIsCutoffPosted(res.data.isCutoffPosted);
          setIsCutoffExists(res.data.cutoffExists);
        }
      })
      .catch((err) => console.log(err));

    // Reset fields when payment method changes
    setAccountName("");
    setCheckNumber("");
    setRefNumber("");
    setAmount("");
    setDate(getTodayDate());
    fetchProductData();
    fetchVenderData();
    fetchWarehousData();
    fetchCurrency();
    // fetchAvailableProduct(vendorId);
    calculateDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, id, discountType, discountValue]);

  const handleUpdate = () => {
    setConfirmation(true);
    if (
      domestic_type !== "local" &&
      (tracking_number === "" || tracking_number === null)
    ) {
      swal({
        title: "Required Field Missing",
        text: "Please ensure Tracking Number is filled out.",
        icon: "error",
        buttons: false,
        timer: 3000,
      });
      return;
    }

    if (!purchaseDate) {
      swal({
        title: "Required Field Missing",
        text: "Please ensure Purchase Date is filled out.",
        icon: "error",
        buttons: false,
        timer: 3000,
      });
      return;
    }

    swal({
      title: "Update purchase information?",
      text: "Action cannot be undone!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (totalAmount1 === 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "center-swal-text";
        wrapper.innerHTML =
          "The Total Amount must be greater than zero. Please check your input.";
        swal({
          icon: "error",
          title: "Invalid Amount",
          content: wrapper,
        });
        return;
      }

      if (confirmed) {
        axios
          .put(`${BASE_URL}/payable/update`, null, {
            params: {
              vendorId,
              warehouseID,
              due_date,
              purchaseDate,
              containerNumber,
              pier,
              currencyId,
              description,
              domestic_type,
              tracking_number:
                domestic_type === "local" ? null : tracking_number,
              id,
              dataProduct,
              userLoggedID,
              removeDataProductIds,
              currencyRate: editableCurrencyRate,
              floatDataProduct, // Ensure you are sending the updated state
              weighingFee,
              totalAmount: totalAmount1,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Purchase updated successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                setIsEditable(false);
                fetchData(id);
                setFloatDataProduct([]);
              });
            }
            // else if (res.status === 201) {
            //   swal({
            //     title: "Opppss!",
            //     text: "Cutoff already posted for this date",
            //     icon: "warning",
            //     buttons: false,
            //     timer: 2000,
            //     dangerMode: true,
            //   });
            // }
            else {
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
          .catch((err) => {
            console.log(err);
          });
      }
    });
    setConfirmation(false);
  };

  // const handleVendorEdit = (value) => {
  //   setVendorID(value);

  //   const vendor = vendorsEdit.find((v) => String(v.id) === String(value, 10));
  //   if (vendor) {
  //     setEmail(vendor.company_email);
  //     setCountry(vendor.company_country);
  //   } else {
  //     setEmail("error");
  //   }
  // };

  // const handleAmountValue = (value) => {
  //   if (payment !== "Online") {
  //     if (value > bankAmount) {
  //       swal({
  //         title: "Oppss!",
  //         text: "Please input not greater than the account balance",
  //         icon: "error",
  //         buttons: false,
  //         timer: 2000,
  //         dangerMode: true,
  //       }).then(() => {
  //         setAmount(bankAmount);
  //       });
  //     } else {
  //       if (value > balance_now) {
  //         swal({
  //           title: "Oppss!",
  //           text: "Please input not greater than the balance to pay",
  //           icon: "error",
  //           buttons: false,
  //           timer: 2000,
  //           dangerMode: true,
  //         }).then(() => {
  //           setAmount(balance_now);
  //         });
  //       } else {
  //         setAmount(value);
  //       }
  //     }
  //   } else {
  //     setAmount(value);
  //   }
  // };

  // const handleAddPayment = async (e) => {
  //   e.preventDefault();
  //   const form = e.currentTarget;
  //   if (form.checkValidity() === false) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     swal({
  //       icon: "error",
  //       title: "Fields are required",
  //       text: "Please fill the red text fields",
  //       buttons: false,
  //       timer: 2000,
  //     });
  //   } else {
  //     swal({
  //       title: "Create this new purchase?",
  //       text: "",
  //       icon: "warning",
  //       buttons: true,
  //       dangerMode: true,
  //     }).then((confirmed) => {
  //       if (confirmed) {
  //         axios
  //           .post(`${BASE_URL}/payable_payment/addPayment`, null, {
  //             params: {
  //               id,
  //               payment_type: payment,
  //               accountlisID: accountName,
  //               amount,
  //               checkNumber,
  //               refNumber,
  //               date,
  //               bankAmount,
  //               transactionID,
  //             },
  //           })
  //           .then((res) => {
  //             if (res.status === 200) {
  //               swal({
  //                 title: "Success",
  //                 text: "Payment added to this payable transaction",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               }).then(() => {
  //                 setAccountName("");
  //                 setPayment("Cash");
  //                 setAmount("");
  //                 setCheckNumber("");
  //                 setRefNumber("");
  //                 setBankAmount("");
  //                 setDate(getTodayDate());
  //                 setValidated(false);
  //                 fetchDataPayment(id);
  //                 // fetchAccountData();
  //               });
  //             } else {
  //               swal({
  //                 title: "Something went wrong",
  //                 text: "Please contact your support immediately",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               });
  //             }
  //           });
  //       }
  //     });
  //   }
  //   setValidated(true);
  // };

  // const handleCancel = async () => {
  //   if (dataPayment && dataPayment.length > 0) {
  //     swal({
  //       title: "Oppss!",
  //       text: "You cannot cancel transaction already paid",
  //       icon: "error",
  //       buttons: false,
  //       timer: 2000,
  //       dangerMode: true,
  //     });
  //   } else {
  //     swal({
  //       title: "Are you sure?",
  //       text: "You are about to cancel this transaction",
  //       icon: "warning",
  //       buttons: true,
  //       dangerMode: true,
  //     }).then((confirmed) => {
  //       if (confirmed) {
  //         axios
  //           .post(`${BASE_URL}/payable/cancel_transaction`, null, {
  //             params: {
  //               id,
  //             },
  //           })
  //           .then((res) => {
  //             if (res.status === 200) {
  //               swal({
  //                 title: "Success",
  //                 text: "You successfully cancel this transaction",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               }).then(() => {
  //                 navigate("/Purchases/Payable");
  //               });
  //             } else {
  //               swal({
  //                 title: "Something went wrong",
  //                 text: "Please contact your support immediately",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               });
  //             }
  //           });
  //       }
  //     });
  //   }
  // };

  console.log(dataProduct);

  // const handleMarkPay = async () => {
  //   if (parseFloat(balance_now) > 0) {
  //     swal({
  //       title: "Oppss!",
  //       text: "You have balance to pay first",
  //       icon: "error",
  //       buttons: false,
  //       timer: 2000,
  //       dangerMode: true,
  //     });
  //   } else {
  //     swal({
  //       title: "Are you sure?",
  //       text: "You are about to mark as paid this transaction",
  //       icon: "warning",
  //       buttons: true,
  //       dangerMode: true,
  //     }).then((confirmed) => {
  //       if (confirmed) {
  //         axios
  //           .post(`${BASE_URL}/payable/markPaid_transaction`, null, {
  //             params: {
  //               id,
  //             },
  //           })
  //           .then((res) => {
  //             if (res.status === 200) {
  //               swal({
  //                 title: "Success",
  //                 text: "Transaction is tagged as paid",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               }).then(() => {
  //                 navigate("/Purchases/Payable");
  //               });
  //             } else {
  //               swal({
  //                 title: "Something went wrong",
  //                 text: "Please contact your support immediately",
  //                 icon: "success",
  //                 buttons: false,
  //                 timer: 2000,
  //                 dangerMode: true,
  //               });
  //             }
  //           });
  //       }
  //     });
  //   }
  // };

  // const totalCashPaid = dataPayment.reduce(
  //   (acc, data) =>
  //     data.payment_type === "Cash" ? acc + parseFloat(data.amount || 0) : acc,
  //   0
  // );

  // const totalBankPaid = dataPayment.reduce(
  //   (acc, data) =>
  //     data.check_number === null && data.payment_type === "Bank"
  //       ? acc + parseFloat(data.amount || 0)
  //       : acc,
  //   0
  // );

  // const totalCheckPaid = dataPayment.reduce(
  //   (acc, data) =>
  //     data.check_number !== null && data.payment_type === "Bank"
  //       ? acc + parseFloat(data.amount || 0)
  //       : acc,
  //   0
  // );

  // const totalOnlinePaid = dataPayment.reduce(
  //   (acc, data) =>
  //     data.payment_type === "Online" ? acc + parseFloat(data.amount || 0) : acc,
  //   0
  // );

  const dateValidation = async (selectedDate, setter, dateLabel) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      // if (res.data === false) {
      //   swal({
      //     icon: "error",
      //     title: `Invalid ${dateLabel}`,
      //     text: `Please Create Cutoff for this Date (${format(
      //       selectedDate,
      //       "MMM/dd/yyyy"
      //     )})`,
      //     // buttons: false,
      //     // timer: 2000,
      //   }).then(() => {
      //     setter("");
      //   });
      // } else {
      //   setter(selectedDate);
      // }
    } catch (error) {
      console.error(error);
    }
  };

  // const [paymentMethod, setPaymentMethod] = useState("Bank");
  // const [subject1, setSubject1] = useState("");
  // const [subject2DataList, setSubject2DataList] = useState([]);
  // const [subject2, setSubject2] = useState("");
  // const [subject2Type, setSubject2Type] = useState("");
  // const [subject3DataList, setSubject3DataList] = useState([]);
  // const [subject3, setSubject3] = useState("");

  // const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  // const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  // const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  // const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);
  // const [checkNo, setCheckNo] = useState("");

  // const handleSubject1Change = (event) => {
  //   const selectedSubject1 = event.target.value;
  //   let account_selected = "";

  //   if (selectedSubject1 === "Account-List") {
  //     account_selected = "Account-List";
  //   } else if (selectedSubject1 === "Asset Account") {
  //     account_selected = "Asset Account";
  //   } else if (selectedSubject1 === "Liabilities Account") {
  //     account_selected = "Liabilities Account";
  //   } else if (selectedSubject1 === "Owner's Equity Account") {
  //     account_selected = "Owner's Equity Account";
  //   }

  //   try {
  //     axios
  //       .get(`${BASE_URL}/accountListSub/getSubject`, {
  //         params: {
  //           account_selected: account_selected,
  //         },
  //       })
  //       .then((res) => {
  //         setSubject1(selectedSubject1);

  //         setSubject2("");
  //         setSubject3("");
  //         setPaymentMethod("");
  //         setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
  //         setIsSubject3Disabled(true); // Reset and disable Subject 3
  //         setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
  //         setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

  //         setSubject2DataList(res.data); //retrieve subject 2 data
  //       });
  //   } catch (error) {
  //     console.log(error);
  //     swal({
  //       title: "Something went wrong",
  //       text: "Please contact your support immediately",
  //       icon: "error",
  //     });
  //   }
  // };

  const formatNumber = (value) => {
    if (!value && value !== 0) return ""; // Handle empty input

    // Remove non-numeric characters except for the decimal point
    let inputValue = String(value).replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");

    // Format the integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine integer and decimal parts (if any)
    return decimalPart !== undefined
      ? `${integerPart}.${decimalPart}`
      : integerPart;
  };

  // const handleSubject2Change = (event, subject_type) => {
  //   const selectedSubject2 = event.target.value;

  //   try {
  //     axios
  //       .get(`${BASE_URL}/accountListSub/getSubject3ChainDropdown`, {
  //         params: {
  //           subjectId: selectedSubject2,
  //           id: id,
  //         },
  //       })
  //       .then((res) => {
  //         setSubject3DataList(res.data);
  //         setSubject2(selectedSubject2);
  //         setSubject3("");
  //         setPaymentMethod("");
  //         setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
  //         setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
  //         setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  //         setSubject2Type(subject_type);
  //       });
  //   } catch (error) {
  //     console.log(error);
  //     swal({
  //       title: "Something went wrong",
  //       text: "Please contact your support immediately",
  //       icon: "error",
  //     });
  //   }
  // };

  // const handleSubject3Change = (event) => {
  //   const selectedSubject3 = event.target.value;
  //   setSubject3(selectedSubject3);
  //   setPaymentMethod("");
  //   setIsPaymentMethodDisabled(false); // Enable Payment Method after Subject 3 selection
  //   setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  // };

  // const handlePaymentMethodChange = (event) => {
  //   const selectedPaymentMethod = event.target.value;
  //   setPaymentMethod(selectedPaymentMethod);
  //   setIsRemarksDisabled(false); // Enable Remarks/Check No. after Payment Method selection
  // };

  // const handleFormSubmit = async (e, type) => {
  //   e.preventDefault();
  //   const form = e.currentTarget;
  //   if (form.checkValidity() === false) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     setValidated(true);
  //     swal({
  //       icon: "error",
  //       title: "Required Fields",
  //       text: "Please fill in all required fields.",
  //     });
  //   } else {
  //     try {
  //       const willProceed = await swal({
  //         title: "Are you sure?",
  //         text: "Once submitted, you will not be able to edit this transaction.",
  //         icon: "warning",
  //         buttons: true,
  //         dangerMode: true,
  //       });

  //       if (willProceed) {
  //         const response = await axios.post(
  //           `${BASE_URL}/accountListSub/createTransaction`,
  //           {
  //             subject1,
  //             subject3,
  //             paymentMethod,
  //             amount,
  //             checkNo,
  //             date,
  //             id,
  //             type,
  //           }
  //         );

  //         if (response.status === 200) {
  //           swal({
  //             icon: "success",
  //             title: "Transaction created successfully",
  //             timer: 2000,
  //           }).then(() => {
  //             // reloadTable();
  //             // reloadAccountName();
  //           });
  //         } else {
  //           swal({
  //             icon: "error",
  //             title: "Something went wrong",
  //             text: "Please contact your support immediately",
  //             timer: 2000,
  //           });
  //         }
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       swal({
  //         icon: "error",
  //         title: "Something went wrong",
  //         text: "Please contact your support immediately",
  //         timer: 2000,
  //       });
  //     }
  //   }
  // };

  // const reloadAccountName = () => {
  //   axios
  //     .get(`${BASE_URL}/accountListSub/accountName/`, {
  //       params: {
  //         id: id,
  //       },
  //     })
  //     .then((res) => {
  //       setAccountName(res.data);
  //     });
  // };

  useEffect(() => {
    // reloadTable();
    // reloadAccountName();
    calcuNetWeightFromNetweightInputONly();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataProduct, floatDataProduct]);

  // const [transaction, setTransaction] = useState([]);

  // const reloadTable = () => {
  //   axios
  //     .get(`${BASE_URL}/accountListSub/getTransaction`, {
  //       params: {
  //         id: id,
  //       },
  //     })
  //     .then((res) => {
  //       setTransaction(res.data);
  //     });
  // };

  const approvedPayment = async (e) => {
    e.preventDefault();
    try {
      // Assuming you want to send all `product_id`s from `dataProduct`

      swal({
        title: "Approve this payable?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          const productData = dataProduct.map((data) => ({
            product_id: data.product_tag_vendor.product_id,
            costing: data.unitPrice,
            weight: data.weight,
            moistureType: data.moisture_type,
            netWeight:
              data.moisture_type === "%"
                ? Math.trunc(data.weight * (1 - data.moisture / 100))
                : Math.trunc(data.weight - data.moisture),
          }));

          // For payable journal creation
          const { totalQuantity, averageUnitPrice } = (() => {
            // Get total quantity
            const totalQuantity = productData.reduce(
              (acc, value) => acc + value.netWeight,
              0
            );

            // Sum up unit prices
            const { totalCount, totalUnitPrice } = productData.reduce(
              (acc, value) => {
                acc.totalCount += 1;
                acc.totalUnitPrice += value.costing;
                return acc;
              },
              { totalCount: 0, totalUnitPrice: 0 }
            );

            // Calculate average safely (avoid division by 0)
            const averageUnitPrice =
              totalCount > 0 ? totalUnitPrice / totalCount : 0;

            return { totalQuantity, averageUnitPrice };
          })();

          const response = await axios.put(
            `${BASE_URL}/payable/approvedPayable/${id}`,
            {
              status: "Approved",
              products: productData,
              vendorId: vendorId,
              purchaseDate: purchaseDate,
              transaction_id: transaction_id,
              approved_by: userLoggedID,
              warehouseID: warehouseID,
              currencyRate: currencyRate,
              currencyName: findCurrencyName?.currency_name ?? "PHP",
              payableJournal: {
                totalAmount: totalAmount1,
                totalQuantity,
                averageUnitPrice,
              },
            }
          );

          if (response.status === 200) {
            swal({
              title: "Approved successfully!",
              text: "The Payment has been approved successfully.",
              icon: "success",
              button: "OK",
            }).then(() => {
              // navigate(`/Purchases/Payable?page=${searchParams.get("page")}`);
              fetchData(id);
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support",
            });
          }
        } else {
          swal.close();
        }
      });
    } catch (err) {
      console.log(err);
    }
  };

  const rejectedPayment = async (e) => {
    e.preventDefault();
    try {
      swal({
        title: "Reject this payable?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          const response = await axios.put(
            `${BASE_URL}/payable/approvedPayable/${id}`,
            {
              status: "Rejected",
              approved_by: userLoggedID,
            }
          );

          if (response.status === 200) {
            swal({
              title: "Rejected successfully!",
              text: "The Payment has been rejected successfully.",
              icon: "success",
              button: "OK",
            }).then(() => {
              // navigate(`/Purchases/Payable?page=${searchParams.get("page")}`);
              fetchData(id);
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support",
            });
          }
        }
      });
    } catch (err) {
      console.log(err);
    }
  };

  // const [productCode, setProductCode] = useState("");
  // const [uom, setUOM] = useState("");
  // const [unitPrice, setUnitPrice] = useState(0);
  // const [weight, setWeight] = useState(0);
  // const [moisture, setMoisture] = useState(0);
  // const [netWeight, setNetWeight] = useState(0);

  // const [rowData, setRowData] = useState(
  //   floatDataProduct.map(() => ({
  //     productId: "",
  //     productTagVendorId: "",
  //     productCode: "",
  //     uom: "",
  //     unitPrice: 0,
  //     weight: 0,
  //     moisture: 0,
  //   }))
  // );

  // const updateRowData = (index, key, value) => {
  //   setRowData((prevRowData) => {
  //     const updatedRowData = [...prevRowData];
  //     updatedRowData[index][key] = value;
  //     return updatedRowData;
  //   });
  // };

  // Find the currency name
  const findCurrencyName = currencyEdit.find((item) => {
    if (currencyId) {
      return item.id === currencyId;
    }
  });

  const calculateTotalWeightInKilo = [
    ...dataProduct,
    ...floatDataProduct,
  ].reduce((total, value) => {
    return total + (parseFloat(String(value.weight).replace(/,/g, "")) || 0);
  }, 0);

  //commented kasi may perfered calculation na for moisture to net weight yung sa ylluja

  // const calculateTotalMoistureInKilo = [
  //   ...dataProduct,
  //   ...floatDataProduct,
  // ].reduce((total, value) => {
  //   // Get Moisture in pese
  //   const moistureInPeso = isNaN(
  //     parseFloat(String(value.moisture).replace(/,/g, "") / value.unitPrice) *
  //       parseFloat(String(value.weight).replace(/,/g, ""))
  //   )
  //     ? 0
  //     : parseFloat(String(value.moisture).replace(/,/g, "") / value.unitPrice) *
  //       parseFloat(String(value.weight).replace(/,/g, ""));

  //   // Get Moisture in percentage
  //   const moistureInPercentage = isNaN(
  //     (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
  //       parseFloat(String(value.weight).replace(/,/g, ""))
  //   )
  //     ? 0
  //     : (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
  //       parseFloat(String(value.weight).replace(/,/g, ""));

  //   return value.moisture_type == "%"
  //     ? total + moistureInPercentage
  //     : total + moistureInPeso;
  // }, 0);

  const calculateTotalMoistureInKilo = [
    ...dataProduct,
    ...floatDataProduct,
  ].reduce((total, value) => {
    // Helper to safely parse numbers
    const parseValue = (val) => {
      const parsed = parseFloat(String(val).replace(/,/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const moisture = parseValue(value.moisture);
    const weight = parseValue(value.weight);
    const unitPrice = parseValue(value.unitPrice);

    if (value.moisture_type === "%") {
      // Calculate net weight after moisture removal (truncated, not rounded)
      const netWeight = Math.floor(weight * (1 - moisture / 100));

      // Moisture in kg = Original Weight - Net Weight (truncated)
      const moistureInKg = weight - netWeight;

      return total + moistureInKg;
    } else {
      // Moisture in peso: convert peso to kg by dividing by unit price
      const moistureInKg = unitPrice > 0 ? moisture / unitPrice : 0;
      return total + moistureInKg;
    }
  }, 0);

  // const calcuNetWeightFromMoistureWeight = () => {
  //   const calculateTotalNetWeightInKilo = [
  //     ...dataProduct,
  //     ...floatDataProduct,
  //   ].reduce((total, value) => {
  //     const weight = parseFloat(String(value.weight).replace(/,/g, "")) || 0;
  //     const moisture =
  //       parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
  //     const unitPrice =
  //       parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;
  //     const netWeightInPeso = weight - moisture / unitPrice;
  //     const netWeightInPercentage = weight * (1 - moisture / 100);

  //     return value.moisture_type === "%"
  //       ? total + netWeightInPercentage
  //       : total + netWeightInPeso;
  //   }, 0);

  //   setTotalLNetweight(calculateTotalNetWeightInKilo);
  // };

  const calcuNetWeightFromMoistureWeight = () => {
    const calculateTotalNetWeightInKilo = [
      ...dataProduct,
      ...floatDataProduct,
    ].reduce((total, value) => {
      const weight = parseFloat(String(value.weight).replace(/,/g, "")) || 0;
      const moisture =
        parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
      const unitPrice =
        parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;

      if (value.moisture_type === "%") {
        // Calculate net weight with truncation (matching Net Qty behavior)
        const netWeightInPercentage = Math.trunc(weight * (1 - moisture / 100));
        return total + netWeightInPercentage;
      } else {
        // Moisture in peso: convert to kg and subtract from weight
        const moistureInKg = unitPrice > 0 ? moisture / unitPrice : 0;
        const netWeightInPeso = Math.trunc(weight - moistureInKg);
        return total + netWeightInPeso;
      }
    }, 0);

    setTotalLNetweight(calculateTotalNetWeightInKilo);
  };
  const calcuNetWeightFromNetweightInputONly = () => {
    const calculateTotalNetWeightInKilo = [
      ...dataProduct,
      ...floatDataProduct,
    ].reduce((total, value) => {
      const net_weight =
        parseFloat(String(value.net_weight).replace(/,/g, "")) || 0;
      // const moisture = parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
      // const unitPrice =
      //   parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;
      // const netWeightInPeso = weight - moisture / unitPrice;
      // const netWeightInPercentage = weight * (1 - moisture / 100);

      return total + net_weight;
    }, 0);
    setTotalLNetweight(calculateTotalNetWeightInKilo);
  };
  // const formatNumberWithCommas = (number) => {
  //   return new Intl.NumberFormat("en-US").format(number);
  // };

  // totalAmount
  let discountCalculation =
    discountType === "%"
      ? (discountValue / 100) *
        parseFloat(totalWeight - totalMoisture - weighingFee - totalOtherFees)
      : discountValue;
  const subtotal1 = totalWeight - totalMoisture - weighingFee - totalOtherFees;
  const totalAmount1 = subtotal1 - discountCalculation;

  const handleChangeCurrency = (value) => {
    const curr = currencyEdit?.find(
      (data) => String(data.id) === String(value)
    );
    setCurrencyId(curr.id);
    setCurrencyRate(curr.currency_rate);
  };

  // Add this function inside your component
  const openPDFPreview = () => {
    // window.open(`/pdf-view?id=${id}`, "_blank");
    setPrint(true);
  };

  // List of currency symbol
  const currencySymbol = {
    PHP: "₱",
    JPY: "¥",
    USD: "$",
    EUR: "€",
    HKD: "HK$",
    CNY: "CN¥",
  };

  // Product Options for dropdown select
  const productOptions = product.map((item) => ({
    value: item.product_list.product_id,
    label: item.product_list.product_name,
  }));

  const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

  // Price label
  // prettier-ignore
  const getPriceLabel = ({ productPrice = 0, inputtedPrice = 0 }) => {
    const suggestedPrice = parseNumber(productPrice); // Product price from supplier
    const userPrice = parseNumber(inputtedPrice); // Price provided by user

    if (suggestedPrice > userPrice) return { 
      color: "primary", 
      label: "Below Supplier Price",
      symbol: currencySymbol[findCurrencyName?.currency_name ?? "PHP"]
    };
    if (suggestedPrice < userPrice) return { 
      color: "danger", 
      label: "Above Supplier Price",
      symbol: currencySymbol[findCurrencyName?.currency_name ?? "PHP"]
    };
    return { 
      color: "success", 
      label: "Same Price",
      symbol: currencySymbol[findCurrencyName?.currency_name ?? "PHP"]
    };
  };
  const filteredProductOptions = (index) => {
    const productIdList = floatDataProduct
      .filter((_, i) => i !== index)
      .map((item) => item.productId);

    const productListDataProduct = dataProduct.map(
      (item) => item.product_tag_vendor.product_list.product_id
    );

    const filteredProduct = product.filter(
      (item) =>
        ![...productIdList, ...productListDataProduct].includes(
          item.product_list.product_id
        )
    );

    return filteredProduct.map((item) => ({
      value: item.product_list.product_id,
      label: item.product_list.product_name,
    }));
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, confirmation, generateYears }, ref) => (
      <input
        type="text"
        className={`form-control p-2 w-100 ${
          confirmation ? "border border-danger custom-red-focus" : ""
        }`}
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

  // Handle Total Amount negative value
  useEffect(() => {
    console.log("Tottta", totalAmount1);
    console.log("Subtota", subtotal1, discountCalculation);

    if (
      (totalWeight == null ||
        totalMoisture == null ||
        weighingFee == null ||
        totalOtherFees == null ||
        discountValue == null ||
        isNaN(totalWeight) ||
        isNaN(totalMoisture) ||
        isNaN(weighingFee) ||
        isNaN(totalOtherFees)) &&
      totalAmount1 < 0
    ) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML =
        "Transaction results in a negative total, due to fees with no usable product.";
      swal({
        icon: "warning",
        title: "Warning",
        content: wrapper,
        button: "OK",
        dangerMode: true,
      });
      return;
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount1]);

  const currencyList = {
    PHP: "Philippine Peso (Philippines)",
    USD: "US Dollar (United States)",
    CNY: "Chinese Yuan (China)",
    HKD: "Hong Kong Dollar (Hong Kong)",
    EUR: "Euro (European Union)",
    JPY: "Japanese Yen (Japan)",
  };

  // For Item list input select width
  const selectProductWidth = Math.max(
    ...dataProduct.map(
      (item) => item.product_tag_vendor.product_list.product_name?.length || 0
    ),
    ...floatDataProduct.map((item) => item.productName?.length || 0)
  );

  const validateDueDateGreaterThanPurchaseDate = (dueDate, purchaseDate) => {
    if (!dueDate || !purchaseDate) return true;

    const due = new Date(dueDate);
    const purchase = new Date(purchaseDate);

    if (due <= purchase) {
      swal({
        icon: "error",
        title: "Invalid Due Date",
        text: "Due Date must be greater than Purchase Date",
      }).then(() => {
        setDue_date("");
      });
      return false;
    }
    return true;
  };

  //seEffect to sync the currency rate when it changes
  useEffect(() => {
    setEditableCurrencyRate(currencyRate);
  }, [currencyRate]);

  //  function to handle currency rate changes
  const handleCurrencyRateChange = (value) => {
    setEditableCurrencyRate(value);
    setCurrencyRate(value);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="container-fluid p-3">
        <div className="border p-3 shadow-sm rounded">
          <div className="w-100 d-flex flex-row justify-content-between">
            <h4>
              <Link to="/purchases/payable" className="text-dark mx-2">
                <i class="fa-solid fa-arrow-left"></i>
              </Link>
              Payment Overview <span className="d-none">{vendorId}</span>
            </h4>

            {isEditable === true ? (
              <div className=" d-flex flex-row justify-content-end ">
                <div className="d-flex flex-column">
                  <div className="">
                    {toPayAmount < 0 && (
                      <div className="text-danger mt-2">
                        Amount to pay cannot be negative.
                      </div>
                    )}
                  </div>

                  <div className="">
                    <Button
                      variant="secondary"
                      type="button"
                      className="me-2"
                      onClick={() => {
                        setIsEditable(false);
                        fetchData(id);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdate}
                      disabled={toPayAmount < 0}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="dropdown dropdown-button">
                  {status === "Approved" || status === "Paid" ? (
                    <>
                      {authrztn.includes("Payable-Print") &&
                        (status === "Approved" || status === "Paid") && (
                          <div className="text-center">
                            <button
                              className="btn btn-outline-danger text-danger"
                              type="button"
                              onClick={openPDFPreview}
                            >
                              Preview PDF
                            </button>
                          </div>
                        )}
                    </>
                  ) : (
                    authrztn.includes("Payable-Edit") &&
                    status === "Pending" && (
                      <button
                        style={{
                          cursor:
                            status === "Rejected" || status === "Partially-Paid"
                              ? "not-allowed"
                              : "pointer",
                        }}
                        className="border-0"
                        type="button"
                        disabled={status === "Cancelled" || isPaid === "Paid"}
                        id="dropdownMenuButton1"
                        {...(status !== "Rejected" &&
                        status !== "Partially-Paid"
                          ? { "data-bs-toggle": "dropdown" }
                          : {})}
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-horizontal fs-4"></i>
                      </button>
                    )
                  )}
                  <ul
                    className="dropdown-menu"
                    aria-labelledby="dropdownMenuButton1"
                  >
                    {/* <li>
                      <span
                        style={{ cursor: "pointer" }}
                        className="dropdown-item"
                        onClick={handleMarkPay}
                      >
                        Mark as Paid
                      </span>
                    </li> */}

                    <li>
                      <span
                        style={{ cursor: "pointer" }}
                        className="dropdown-item"
                        onClick={() => setIsEditable(true)}
                      >
                        Edit Transaction
                      </span>
                    </li>

                    {/* {status === "Approved" && (
                      <div className="w-100">
                        <div className="w-100">
                          <button
                            className="w-100 border-0 text-danger"
                            type="button"
                            onClick={openPDFPreview}
                          >
                            Preview PDF
                          </button>
                        </div>
                      </div>
                    )} */}

                    {/* {authrztn.includes("Payable-Print") &&
                      (status === "Approved" || status === "Paid") && (
                        <li className="h-75 text-center">
                          <button
                            className="btn btn-outline-danger text-danger h-100"
                            type="button"
                            onClick={openPDFPreview}
                          >
                            Preview PDF
                          </button>
                        </li>
                      )} */}

                    {/* <li>
                      <span
                        style={{ cursor: "pointer" }}
                        className="dropdown-item"
                      >
                        Generate Invoice
                      </span>
                    </li> */}
                    {/* {status === "Pending" && (
                      <li>
                        <span
                          style={{ cursor: "pointer" }}
                          className="dropdown-item"
                          onClick={handleCancel}
                        >
                          Cancel Transaction
                        </span>
                      </li>
                    )} */}
                  </ul>
                </div>
              </>
            )}
          </div>
          <div className="row mx-auto p-3">
            <div className="col-sm d-flex flex-column mb-2">
              <h6>Vendor</h6>
              <React.Fragment>
                <span className="text-secondary">{vendorName}</span>
              </React.Fragment>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6>Mode of Payment</h6>

              <span className="text-secondary">{modeOfPayment}</span>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6>Email</h6>

              <span className="text-secondary">{email}</span>
            </div>

            <div className="col-sm d-flex flex-column mb-2">
              <h6>Country</h6>
              <span className="text-secondary">{country}</span>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6>Receiving Warehouse</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <select
                    required
                    value={warehouseID}
                    onChange={(e) => setWarehouseID(e.target.value)}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Warehouse
                    </option>
                    {warehouseEdit.map((data) => (
                      <option key={data.warehouse_id} value={data.warehouse_id}>
                        {data.name}
                      </option>
                    ))}
                  </select>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span className="text-secondary">{warehouseName}</span>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
        <div className="border-start border-bottom border-end p-3 shadow-sm rounded">
          <div className="row mx-auto p-3">
            <div className="d-none col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Transaction ID</h6>
              <h5>{transaction_id}</h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Transaction ID</h6>
              <h5>{clientTransactionId}</h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Date Created</h6>
              <h5>{createdAt && format(createdAt, "MMM/dd/yyyy, hh:mm a")}</h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Requested By</h6>
              <h5>{createdBy}</h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">
                {status === "Rejected" ? "Rejected By" : "Approved By"}
              </h6>
              <h5
                className={`${
                  approvedBy.trim() === "TBA" ? "text-muted fst-italic" : ""
                }`}
              >
                {approvedBy}
              </h5>
            </div>
          </div>
          <div className="row mx-auto p-2">
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Status</h6>
              <h5
                className={`w-50 text-center p-1 rounded ${
                  status === "Approved"
                    ? "text-success"
                    : status === "Pending"
                    ? "text-warning"
                    : "text-danger"
                }`}
              >
                {status}
              </h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Amount To Pay</h6>
              <h5>
                {toPayAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h5>
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Deadline</h6>
              {isEditable === true ? (
                <React.Fragment>
                  {/* <input
                    type="date"
                    id="dueDate"
                    onChange={(e) => setDue_date(e.target.value)}
                    required
                    value={due_date}
                    className="form-control p-2"
                  /> */}
                  {/* <div className="position-relative">
                    <DatePicker
                      selected={due_date}
                      onChange={(date) => setDue_date(date)}
                      dateFormat="MMM/dd/yyyy"
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
                    label={"Deadline"}
                    selected={due_date ? new Date(due_date) : ""}
                    handleDateChange={(date) => {
                      if (
                        validateDueDateGreaterThanPurchaseDate(
                          date,
                          purchaseDate
                        )
                      ) {
                        setDue_date(date);
                      }
                    }}
                    setter={setDue_date}
                    CustomInput={CustomInput}
                    validated={validated}
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{due_date && format(due_date, "MMM/dd/yyyy")}</h5>
                </React.Fragment>
              )}

              {/* <h6 className="text-secondary">Currency</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <select
                    required
                    value={currencyId}
                    // onChange={(e) => setCurrencyId(e.target.value)}
                    onChange={(e) => handleChangeCurrency(e.target.value)}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    {currencyEdit?.map((data) => (
                      <option key={data.id} value={data.id}>
                        {data.currency_name}
                      </option>
                    ))}
                  </select>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{currency_name}</h5>
                </React.Fragment>
              )} */}
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Purchase Date</h6>
              {isEditable === true ? (
                <React.Fragment>
                  {/* <input
                    type="date"
                    id="purchaseDate"
                    onChange={(e) => dateValidation(e.target.value)}
                    required
                    value={purchaseDate}
                    className="form-control p-2"
                  /> */}
                  {/* <div className="position-relative">
                    <DatePicker
                      selected={purchaseDate}
                      onChange={(date) => dateValidation(date, "Purchase Date")}
                      dateFormat="MMM/dd/yyyy"
                      className={`form-control p-2 ${
                        confirmation
                          ? "border border-danger custom-red-focus"
                          : ""
                      }`}
                      customInput={<CustomInput purchaseDate={true} />}
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
                    label={"Purchase Date"}
                    selected={purchaseDate ? new Date(purchaseDate) : ""}
                    handleDateChange={(date) =>
                      dateValidation(date, setPurchaseDate, "Purchase Date")
                    }
                    setter={setPurchaseDate}
                    CustomInput={CustomInput}
                    isRequired={true}
                    validated={validated}
                    dateValidation={dateValidation}
                    confirmation={confirmation}
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{purchaseDate && format(purchaseDate, "MMM/dd/yyyy")}</h5>
                </React.Fragment>
              )}
            </div>
          </div>
          <div className="row mx-auto p-2 mb-2">
            {/*<div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Currency</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <select
                    required
                    value={currencyId}
                    // onChange={(e) => setCurrencyId(e.target.value)}
                    onChange={(e) => handleChangeCurrency(e.target.value)}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    {currencyEdit?.map((data) => (
                      <option key={data.id} value={data.id}>
                        {data.currency_name}
                      </option>
                    ))}
                  </select>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{currency_name}</h5>
                </React.Fragment>
              )} 
            </div>*/}
            <div className="col-sm">
              <h6 className="text-secondary">Currency</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <select
                    required
                    value={currencyId}
                    // onChange={(e) => setCurrencyId(e.target.value)}
                    onChange={(e) => handleChangeCurrency(e.target.value)}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    {currencyEdit?.map((data) => (
                      <option key={data.id} value={data.id}>
                        {data.currency_name} -{" "}
                        {currencyList[data.currency_name]}
                      </option>
                    ))}
                  </select>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>
                    {currency_name} - {currencyList[currency_name]}
                  </h5>
                </React.Fragment>
              )}
            </div>
            <div className="col-sm d-none">
              <h6 className="text-secondary">Currency Rate</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      value={formatNumber(editableCurrencyRate)}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Remove non-numeric characters except decimal point
                        const cleanedValue = value.replace(/[^0-9.]/g, "");

                        // Prevent multiple decimal points
                        const decimalCount = (cleanedValue.match(/\./g) || [])
                          .length;
                        if (decimalCount <= 1) {
                          handleCurrencyRateChange(cleanedValue);
                        }
                      }}
                      onInput={onInputFloat}
                      className="form-control p-2"
                      placeholder="Enter Rate"
                      required
                      readOnly
                    />
                    <div className="input-group-append">
                      <div className="input-group-text py-2 text-secondary">
                        Rate
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>
                    {parseFloat(currencyRate || 1).toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </h5>
                </React.Fragment>
              )}
            </div>
            <div className="col-sm">
              <h6 className="text-secondary">Foreign Type</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <select
                    required
                    value={domestic_type}
                    onChange={(e) => setDomestic_type(e.target.value)}
                    className="form-select p-2"
                  >
                    <option value="" disabled>
                      Select Foreign Type
                    </option>
                    <option value="local">LOCAL</option>
                    <option value="overseas">OVERSEAS</option>
                  </select>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{domestic_type.toUpperCase()}</h5>
                </React.Fragment>
              )}
            </div>
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Container Number</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <input
                    type="text"
                    id="containerNumber"
                    onChange={(e) => setContainerNumber(e.target.value)}
                    required
                    value={containerNumber}
                    maxLength={50}
                    className="form-control p-2"
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{containerNumber}</h5>
                </React.Fragment>
              )}
            </div>
          </div>
          <div className="row mx-auto p-2 mb-2">
            {/* <div className="col-sm px-2 mx-1">
              {currencyId !== 1 && (
                <React.Fragment>
                  <h6 className="text-secondary">Currency Rate</h6>
                  {isEditable === true ? (
                    <React.Fragment>
                      <input
                        required
                        type="text"
                        id="trackingNumber"
                        value={currencyRate}
                        onChange={(e) => setCurrencyRate(e.target.value)}
                        className="form-control p-2"
                      />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <h5>{currencyRate}</h5>
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
            </div> */}
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Pier</h6>
              {isEditable === true ? (
                <React.Fragment>
                  <input
                    type="text"
                    id="pier"
                    onChange={(e) => setPier(e.target.value)}
                    required
                    value={pier}
                    maxLength={50}
                    className="form-control p-2"
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{pier}</h5>
                </React.Fragment>
              )}
            </div>

            <div className="col-sm-3">
              <h6 className="text-secondary">Weighing Fee</h6>
              {isEditable === true ? (
                <div className="input-group mb-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text py-2 text-secondary">
                      {currencySymbol[findCurrencyName?.currency_name ?? "PHP"]}
                    </div>
                  </div>
                  <input
                    type="text"
                    // onKeyDown={(e) => {
                    //   if (["+", "-", "e"].includes(e.key)) {
                    //     e.preventDefault();
                    //   }
                    // }}
                    onInput={onInputFloat}
                    onChange={(e) => {
                      let value = e.target.value;
                      // setWeighingFee(value === "" ? "" : Number(value));
                      setWeighingFee(value);
                    }}
                    value={formatNumber(weighingFee)}
                    min={0}
                    className="form-control p-2"
                    placeholder="0"
                    required
                  />
                </div>
              ) : (
                <React.Fragment>
                  <h5>
                    {currencySymbol[findCurrencyName?.currency_name ?? "PHP"]}{" "}
                    {weighingFee}
                  </h5>
                </React.Fragment>
              )}
            </div>
            <div className="col-sm-6 d-flex gap-4 px-2 mx-1">
              {domestic_type !== "local" && (
                <div className="w-50">
                  <React.Fragment>
                    <h6 className="text-secondary">Tracking Number</h6>
                    {isEditable === true ? (
                      <React.Fragment>
                        <input
                          required
                          type="text"
                          id="trackingNumber"
                          value={tracking_number}
                          onChange={(e) => setTracking_number(e.target.value)}
                          placeholder="Enter Tracking Number"
                          className={`form-control p-2 ${
                            confirmation
                              ? "border border-danger custom-red-focus"
                              : ""
                          }`}
                        />
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <h5>{tracking_number}</h5>
                      </React.Fragment>
                    )}
                  </React.Fragment>
                </div>
              )}

              <div className="w-50">
                <React.Fragment>
                  <h6 className="text-secondary">Remarks</h6>
                  {isEditable === true ? (
                    <React.Fragment>
                      <textarea
                        name="remarks"
                        id="remarks"
                        className="form-control p-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={1}
                      ></textarea>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <h5>{description}</h5>
                    </React.Fragment>
                  )}
                </React.Fragment>
              </div>
            </div>
          </div>
        </div>

        <div className="w-100 mt-4 border rounded shadow-sm p-2">
          <label htmlFor="" className="mb-2">
            Item List
          </label>
          <div className="table-responsive w-100">
            <table className="table table-bordered item-list-table">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Product Code</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Unit of Measure</th>
                  <th className="p-2">Qty</th>

                  {(status === "Approved" ||
                    status === "Paid" ||
                    status === "Partially-Paid") && (
                    <th className="p-2">Returned Qty</th>
                  )}
                  <th className="p-2">Moisture</th>
                  <th className="p-2">Net Qty</th>
                  <th className="p-2">Unit Price</th>
                  <th className="p-2">Subtotal</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {dataProduct.map((data) => {
                  const priceLabel = getPriceLabel({
                    productPrice: data.product_tag_vendor.product_price,
                    inputtedPrice: data.unitPrice,
                  });

                  return (
                    <tr key={data.id}>
                      <td>
                        <input
                          type="text"
                          value={
                            data.product_tag_vendor.product_list.product_code
                          }
                          className="form-control p-2"
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={
                            data.product_tag_vendor.product_list.product_name
                          }
                          className="form-control p-2"
                          style={{
                            ...(selectProductWidth
                              ? {
                                  width: `${
                                    Math.min(selectProductWidth, 42) + 5
                                  }ch`,
                                }
                              : { minWidth: "12rem" }),
                          }}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={
                            data.product_tag_vendor.product_list.unit_of_measure
                          }
                          className="form-control p-2"
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={formatNumber(data.weight)}
                          className="form-control p-2"
                          readOnly={!isEditable}
                          placeholder="Enter Qty"
                          onChange={(e) => {
                            const newValue = e.target.value;
                            // First update weight
                            updateDataProduct(data.id, "weight", newValue);

                            // Then calculate and update net_weight
                            const weightNum = parseFloat(
                              String(newValue).replace(/,/g, "")
                            );
                            const moistureNum = parseFloat(
                              String(data.moisture).replace(/,/g, "")
                            );

                            if (!isNaN(weightNum) && !isNaN(moistureNum)) {
                              let netWeight;
                              if (data.moisture_type === "%") {
                                netWeight = Math.trunc(
                                  weightNum * (1 - moistureNum / 100)
                                );
                              } else {
                                const unitPriceNum = parseFloat(
                                  String(data.unitPrice).replace(/,/g, "")
                                );
                                if (unitPriceNum) {
                                  netWeight = Math.trunc(
                                    weightNum - moistureNum / unitPriceNum
                                  );
                                }
                              }

                              if (netWeight !== undefined) {
                                updateDataProduct(
                                  data.id,
                                  "net_weight",
                                  netWeight
                                );
                                calcuNetWeightFromMoistureWeight();
                              }
                            }
                          }}
                        />
                      </td>
                      {(status === "Approved" ||
                        status === "Paid" ||
                        status === "Partially-Paid") && (
                        <td>
                          <input
                            type="text"
                            value={(
                              data.static_net_weight - data.net_weight
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            className="form-control"
                            readOnly
                          />
                        </td>
                      )}

                      <td>
                        <InputGroup className="mb-3">
                          <Form.Control
                            type="text"
                            readOnly={!isEditable}
                            value={formatNumber(data.moisture) || 0}
                            className="form-control p-2"
                            placeholder="Enter Moisture"
                            onChange={(e) => {
                              const newValue = e.target.value;

                              const cleanedValue = newValue.replace(
                                /^0+,|^0+/,
                                ""
                              ); // Remove leading zeros and comma

                              if (
                                parseFloat(String(newValue).replace(/,/g, "")) >
                                100
                              ) {
                                swal({
                                  icon: "error",
                                  title: "Moisture should not exceed 100",
                                  text: "Percentage discount cannot exceed 100%.",
                                }).then(() => {
                                  e.target.value = "";
                                });
                                return;
                              }

                              if (
                                data.moisture_type === "%" &&
                                parseFloat(String(newValue).replace(/,/g, "")) >
                                  100
                              ) {
                                swal({
                                  title: "Invalid Net Weight Amount.",
                                  text: "Net Weight Amount cannot be less than 0",
                                  button: true,
                                  icon: "error",
                                }).then(() => {
                                  updateDataProduct(data.id, "moisture", 0);
                                  updateDataProduct(data.id, "net_weight", 0);
                                });
                                return;
                              }

                              // First update moisture
                              updateDataProduct(
                                data.id,
                                "moisture",
                                cleanedValue
                              );

                              // Then calculate and update net_weight
                              const weightNum = parseFloat(
                                String(data.weight).replace(/,/g, "")
                              );
                              const moistureNum = parseFloat(
                                String(newValue).replace(/,/g, "")
                              );

                              if (!isNaN(weightNum) && !isNaN(moistureNum)) {
                                let netWeight;
                                if (data.moisture_type === "%") {
                                  netWeight = Math.trunc(
                                    weightNum * (1 - moistureNum / 100)
                                  );
                                } else {
                                  const unitPriceNum = parseFloat(
                                    String(data.unitPrice).replace(/,/g, "")
                                  );
                                  if (unitPriceNum) {
                                    netWeight = Math.trunc(
                                      weightNum - moistureNum / unitPriceNum
                                    );
                                  }
                                }

                                if (netWeight !== undefined) {
                                  updateDataProduct(
                                    data.id,
                                    "net_weight",
                                    netWeight
                                  );

                                  calcuNetWeightFromMoistureWeight();
                                }
                              }
                            }}
                          />
                          <InputGroup.Text id="basic-addon1">
                            {data.moisture_type}
                          </InputGroup.Text>
                        </InputGroup>
                      </td>
                      <td>
                        <input
                          type="text"
                          // value={
                          //   data.moisture_type === "%"
                          //     ? formatNumber(
                          //         parseFloat(
                          //           String(data.weight).replace(/,/g, "")
                          //         ) *
                          //           (1 -
                          //             parseFloat(
                          //               String(data.moisture).replace(/,/g, "")
                          //             ) /
                          //               100)
                          //       )
                          //     : formatNumber(
                          //         parseFloat(
                          //           String(data.weight).replace(/,/g, "")
                          //         ) -
                          //           parseFloat(
                          //             String(data.moisture).replace(/,/g, "")
                          //           ) /
                          //             parseFloat(
                          //               String(data.unitPrice).replace(/,/g, "")
                          //             )
                          //       )
                          // }
                          value={formatNumber(data.net_weight) || 0}
                          onChange={(e) => {
                            const cleanedValue = e.target.value.replace(
                              /^0+,|^0+/,
                              ""
                            ); // Remove leading zeros and comma
                            updateDataProduct(
                              data.id,
                              "net_weight",
                              cleanedValue
                            );
                          }}
                          readOnly={!isEditable}
                          className="form-control p-2"
                          placeholder="Enter Net Qty"
                        />
                      </td>
                      {/* Unit Price */}
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          readOnly={!isEditable}
                          value={formatNumber(data.unitPrice)}
                          onChange={(e) =>
                            updateDataProduct(
                              data.id,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                        <span className={`text-${priceLabel?.color}`}>
                          {priceLabel?.label} ({priceLabel?.symbol}
                          {data.product_tag_vendor.product_price.toLocaleString(
                            "en-US",
                            {
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }
                          )}
                          )
                        </span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          readOnly
                          value={(
                            data.net_weight * data.unitPrice
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          // onChange={(e) =>
                          //   updateDataProduct(
                          //     data.id,
                          //     "unitPrice",
                          //     e.target.value
                          //   )
                          // }
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this item?"
                              )
                            ) {
                              removeDataProduct(data.id);
                            }
                          }}
                          disabled={!isEditable}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {floatDataProduct.map((data, index) => {
                  const priceLabel = getPriceLabel({
                    productPrice: data.productPrice,
                    inputtedPrice: data.unitPrice,
                  });

                  return (
                    <tr key={index}>
                      <td>
                        <input type="hidden" value={data.productId} />
                        <input
                          type="text"
                          className="form-control p-2"
                          readOnly
                          value={data.productCode || ""}
                        />
                      </td>
                      <td>
                        <Select
                          options={productOptions}
                          // value={data.productName}
                          value={
                            productOptions.find(
                              (opt) => opt.value === data.productId
                            ) || null
                          }
                          classNamePrefix="item-list-table-select"
                          onChange={(selectedOption) => {
                            const selectedValue = String(
                              selectedOption?.value,
                              10
                            );
                            const selectedProduct = product.find(
                              (p) => p.product_id === selectedValue
                            );

                            console.log(selectedProduct);

                            if (selectedProduct) {
                              setFloatDataProduct((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        productCode:
                                          selectedProduct.product_list
                                            .product_code,
                                        uom: selectedProduct.product_list
                                          .unit_of_measure,
                                        unitPrice:
                                          selectedProduct.product_price,
                                        productPrice:
                                          selectedProduct.product_price, // static
                                        productId: selectedProduct.product_id,
                                        productTagVendorId: selectedProduct.id,
                                        productName:
                                          selectedProduct.product_list
                                            .product_name,
                                      }
                                    : item
                                )
                              );
                            }
                          }}
                          menuPortalTarget={document.body}
                          placeholder={`Select Product`}
                          styles={selectCustomStyles(
                            data.productId,
                            validated,
                            "0",
                            selectProductWidth
                          )}
                          isDisabled={!isEditable}
                          required
                          isSearchable
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          readOnly
                          value={data.uom || ""}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          placeholder="Enter Weight"
                          readOnly={!isEditable}
                          value={formatNumber(data.weight) || ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Remove invalid characters (anything except numbers and a single decimal point)
                            value = value.replace(/[^0-9.]/g, "");

                            // Prevent multiple decimals
                            const decimalCount = (value.match(/\./g) || [])
                              .length;
                            if (decimalCount > 1) {
                              value = value.slice(0, -1);
                            }

                            // Convert to number (but only if it's a valid float)
                            const newWeight = value ? parseFloat(value) : 0;
                            const currentMoisture = data.moisture || 0;

                            // Calculate net weight
                            const netWeight =
                              newWeight * (1 - currentMoisture / 100);

                            // Update state
                            setFloatDataProduct((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      weight: value, // Keep as a string to allow "1." to be entered
                                      net_weight: netWeight,
                                    }
                                  : item
                              )
                            );
                          }}
                        />
                      </td>

                      {/* Returned Quantity Column */}
                      {/* <td>
                      <input
                        type="text"
                        value={"0.00"}
                        className="form-control"
                        readOnly
                      />
                    </td> */}

                      <td>
                        <InputGroup className="mb-3">
                          <Form.Control
                            type="text"
                            className="form-control p-2"
                            placeholder="Enter Moisture"
                            readOnly={!isEditable}
                            value={formatNumber(data.moisture) || ""}
                            onChange={(e) => {
                              let value = e.target.value;

                              // Remove non-numeric characters except a single decimal point
                              value = value.replace(/[^0-9.]/g, "");

                              if (
                                parseFloat(String(value).replace(/,/g, "")) >
                                100
                              ) {
                                swal({
                                  icon: "error",
                                  title: "Moisture should not exceed 100",
                                  text: "Percentage discount cannot exceed 100%.",
                                }).then(() => {
                                  e.target.value = "";
                                });
                                return;
                              }

                              // Ensure only one decimal point
                              const decimalCount = (value.match(/\./g) || [])
                                .length;
                              if (decimalCount > 1) {
                                value = value.slice(0, -1);
                              }

                              // Convert to float (but only if it's valid)
                              const newMoisture = value ? parseFloat(value) : 0;
                              const currentWeight = data.weight || 0;

                              // Calculate net weight
                              const netWeight = Math.trunc(
                                currentWeight * (1 - newMoisture / 100)
                              );

                              // Update state
                              setFloatDataProduct((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        moisture: value, // Keep as a string to allow "1." input
                                        net_weight: netWeight,
                                      }
                                    : item
                                )
                              );
                            }}
                          />

                          <InputGroup.Text id="basic-addon1">%</InputGroup.Text>
                        </InputGroup>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          value={formatNumber(data.net_weight) || ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Remove invalid characters (anything except numbers and a single decimal point)
                            value = value.replace(/[^0-9.]/g, "");

                            // Prevent multiple decimals
                            const decimalCount = (value.match(/\./g) || [])
                              .length;
                            if (decimalCount > 1) {
                              value = value.slice(0, -1);
                            }

                            setFloatDataProduct((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, net_weight: value }
                                  : item
                              )
                            );
                          }}
                        />
                      </td>

                      {/* Unit Price */}
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          value={formatNumber(data.unitPrice) || ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Remove any non-digit or non-decimal characters
                            value = value.replace(/[^0-9.]/g, "");

                            // Prevent multiple decimals
                            const decimalCount = (value.match(/\./g) || [])
                              .length;
                            if (decimalCount > 1) {
                              value = value.slice(0, -1);
                            }

                            setFloatDataProduct((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, unitPrice: value }
                                  : item
                              )
                            );
                          }}
                        />

                        {/* Price label */}
                        {data.productCode && (
                          <span className={`text-${priceLabel?.color}`}>
                            {priceLabel?.label}{" "}
                            {data.productPrice?.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                              style: "currency",
                              currency: currency_name || "PHP",
                            })}
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control p-2"
                          readOnly
                          value={(
                            data.net_weight * data.unitPrice || 0
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            setFloatDataProduct((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          disabled={!isEditable}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="w-100 text-end mt-3">
            {isEditable && (
              <button className="btn btn-primary btn-sm" onClick={addNewItem}>
                New Item
              </button>
            )}
          </div>
          <div className="row mx-auto p-2 mt-4 mb-4">
            <div className="col-sm border-end">
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Qty: </span>
                <span className="text-secondary">
                  {calculateTotalWeightInKilo.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}{" "}
                  (Kg)
                </span>
              </div>
              {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Net Weight</span>
              <span className="text-secondary">
                {watch(`netWeight`) || "0.00"}
              </span>
            </div> */}
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Moisture: </span>
                <span className="text-danger">
                  {calculateTotalMoistureInKilo.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}{" "}
                  (Kg)
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Net Qty:</span>
                <span className="text-danger">
                  {totalLNetweight.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}{" "}
                  (Kg)
                </span>
              </div>
            </div>
            <div className="col-sm">
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Qty Amount</span>
                <span className="text-secondary">
                  {totalWeight.toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Amount of Moisture</span>
                <span className="text-danger">
                  {totalMoisture.toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Net Qty Amount</span>
                <span className="text-danger">
                  {totalRNetweight.toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Weighing Fee</span>
                <span className="text-danger">
                  {/* {formatNumberWithCommas(weighingFee) || "0.00"} */}
                  {(weighingFee || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                    style: "currency",
                    currency: currency_name || "PHP",
                  })}
                </span>
              </div>
              {dataOtherFees.map((data) => (
                <div className="w-100 d-flex flex-row justify-content-between p-2">
                  <span>{data.fee_name}</span>
                  <span className="text-danger">
                    {data.fee_amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: findCurrencyName?.currency_name || "PHP",
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}

              <div className="w-100 d-flex flex-row justify-content-between p-2 border-bottom d-none">
                <span>Other Fee</span>
                <button className="border-0 text-primary bg-white p-0">
                  Add
                </button>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Subtotal</span>
                <span className="text-secondary">
                  {/* {parseFloat(
                    totalWeight - totalMoisture - weighingFee - totalOtherFees
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} */}
                  {parseFloat(totalRNetweight - weighingFee).toLocaleString(
                    "en-US",
                    {
                      style: "currency",
                      currency: findCurrencyName?.currency_name || "PHP",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span
                  className="w-100"
                  style={{ cursor: "pointer" }}
                  // onClick={() => {
                  //   setIsPercent(!isPercent);
                  //   calculateDiscount();
                  // }}
                  id="basic-addon2"
                >
                  Discount (
                  <span className="mx-1 custom-font">
                    {discountType === "%"
                      ? "%"
                      : currencySymbol[
                          findCurrencyName?.currency_name || "PHP"
                        ]}
                  </span>
                  )
                </span>
                <span className="text-danger">
                  {discountValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                <span className="text-white">Total Amount:</span>
                <span className="text-white text-underline">
                  {/* {totalAmount1.toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} */}

                  {parseFloat(
                    totalRNetweight -
                      weighingFee -
                      totalOtherFees -
                      discountValue
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {!isEditable && (
                <>
                  <div className="col-sm mt-4">
                    <div className="d-none text-end">
                      {authrztn.includes("Payable-Approve") &&
                        status === "Pending" && (
                          <button
                            className="btn btn-danger me-1 px-4"
                            type="button"
                            onClick={rejectedPayment}
                            disabled={
                              status !== "Pending" ||
                              isCutoffPosted ||
                              !isCutoffExists
                            }
                          >
                            Reject
                          </button>
                        )}
                      &nbsp;
                      {authrztn.includes("Payable-Approve") &&
                        status === "Pending" && (
                          <button
                            onClick={approvedPayment}
                            disabled={
                              status !== "Pending" ||
                              isCutoffPosted ||
                              !isCutoffExists
                            }
                            className="btn btn-success"
                          >
                            Approve
                          </button>
                        )}
                    </div>
                    <div className="text-end">
                      {authrztn.includes("Payable-Approve") &&
                        status === "Pending" && (
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={openPDFPreview}
                            disabled={isCutoffPosted || !isCutoffExists}
                          >
                            Preview PDF
                          </button>
                        )}
                    </div>

                    {(authrztn.includes("Payable-Edit") ||
                      authrztn.includes("Payable-Approve")) &&
                      isCutoffPosted &&
                      status === "Pending" && (
                        <div className="w-100 mt-2 text-end">
                          <p className="text-danger">
                            Action is prohibited as the Purchase date has
                            already been posted.
                          </p>
                        </div>
                      )}

                    {(authrztn.includes("Payable-Edit") ||
                      authrztn.includes("Payable-Approve")) &&
                      !isCutoffExists &&
                      status === "Pending" && (
                        <div className="w-100 mt-2 text-end">
                          <p className="text-danger">
                            Action is prohibited as the Purchase date has not
                            been created.
                          </p>
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Modal show={print} size="xl" onHide={() => setPrint(false)}>
          <div className="position-relative">
            <PDFDownloadLink
              document={<PayablePDF2 id={id} />}
              fileName={`Payable - ${transaction_id}.pdf`}
            >
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip
                    id="tooltip-right"
                    className="me-2"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Download as{" "}
                    <strong className="text-danger">
                      "Payable - {transaction_id}.pdf"
                    </strong>
                  </Tooltip>
                }
                delay={300}
              >
                <Button
                  variant="light"
                  className="position-absolute btn btn-light border border-secondary-subtle mb-5 rounded-5"
                  style={{ bottom: "-1.8rem", left: "1rem" }}
                >
                  <i class="fa-solid fa-download"></i>
                </Button>
              </OverlayTrigger>
            </PDFDownloadLink>

            {/* Approve and Reject button inside PDF Modal */}
            <div
              className="position-absolute"
              style={{
                bottom: "1.5rem",
                right: "2.5rem",
              }}
            >
              {authrztn.includes("Payable-Approve") && status === "Pending" ? (
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-danger px-3"
                    type="button"
                    onClick={rejectedPayment}
                    disabled={
                      status !== "Pending" || isCutoffPosted || !isCutoffExists
                    }
                  >
                    Reject
                  </button>

                  <button
                    onClick={approvedPayment}
                    disabled={
                      status !== "Pending" || isCutoffPosted || !isCutoffExists
                    }
                    className="btn btn-sm btn-success"
                  >
                    Approve
                  </button>
                </div>
              ) : (
                <span
                  className={`badge px-3 py-2 fs-6 ${
                    status === "Approved"
                      ? "bg-success-subtle text-success border border-success-subtle"
                      : "bg-danger-subtle text-danger border border-danger-subtle"
                  }`}
                  style={{ pointerEvents: "none" }}
                >
                  {status}
                </span>
              )}
            </div>
            <PDFViewer style={{ width: "100%", height: "90vh" }}>
              <PayablePDF2 id={id} />
            </PDFViewer>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PayablePayment;
