import React, { useState, useEffect } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import swal from "sweetalert";
import { useParams, useNavigate, Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import useStore from "../store/payablePayment"; // fetch payable data
import paymentStore from "../store/fetchPayment"; // for payment data fetch
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
// pdf
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import PayablePDF from "./PayablePDF";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { set } from "react-hook-form";
import { format } from "date-fns";
import DatePicker from "react-datepicker";

const PayablePayment = ({ authrztn }) => {
  const { id } = useParams();

  const {
    vendorId,
    vendorName,
    setVendorID,
    email,
    setEmail,
    country,
    setCountry,
    warehouseID,
    setWarehouseID,
    warehouseName,
    transaction_id,
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
    setDataProduct, // array from useStore
    dataOtherFees, // array from useStore
    fetchData,
    removeDataProduct,
    removeDataProductIds,
    currencyRate,
    updateDataProduct,
    setCurrencyRate,
  } = useStore();

  const { dataPayment, fetchDataPayment, balanceBefore, balanceNow } =
    paymentStore();

  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [product, setProduct] = useState([]); // for select
  const [vendorsEdit, setVendorsEdit] = useState([]); // for select if edit
  const [warehouseEdit, setWarehouseEdit] = useState([]); // for select if edit
  const [currencyEdit, setCurrencyEdit] = useState([]);
  const [accountListData, setAccountListData] = useState([]); // get account list
  const [availableDataProduct, setAvailableDataProduct] = useState([]);
  const [floatDataProduct, setFloatDataProduct] = useState([]);

  const [payment, setPayment] = useState("Cash");
  const [accountName, setAccountName] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [discountBackend, setDiscountBackend] = useState("");

  const [totalWeight, setTotalWeight] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalLNetweight, setTotalLNetweight] = useState(0); // left side (KL)
  const [totalRNetweight, setTotalRNetweight] = useState(0); // right side (KL)

  const [print, setPrint] = useState(false);

  const userLoggedID = useDecodeToken();

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

    const updatedTotalMoisture = [...dataProduct, ...floatDataProduct].reduce(
      (acc, data) => {
        if (data.moisture_type === "%") {
          return (
            acc +
            parseFloat(
              (String(data.moisture).replace(/,/g, "") / 100) *
                (data.unitPrice || data.unitPrice) *
                (String(data.weight).replace(/,/g, "") || 0)
            )
          );
        } else {
          return acc + parseFloat(String(data.moisture).replace(/,/g, "") || 0);
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

  const calculateNetWeight = (index) => {
    netWeight = weight * (1 - moisture / 100);

    return netWeight;
  };

  const totalOtherFees = dataOtherFees.reduce(
    (acc, data) => acc + parseFloat(data.fee_amount || 0),
    0
  );

  const transactionID = transaction_id;

  const addNewItem = () => {
    setFloatDataProduct((prev) => [
      ...prev,
      {
        productCode: "",
        uom: "",
        unitPrice: 0,
        weight: 0,
        moisture: 0,
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

  const balance_now = toPayAmount - balanceNow;

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }
  function formatDatetime(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

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
              domestic_type,
              tracking_number:
                domestic_type === "local" ? null : tracking_number,
              id,
              dataProduct,
              userLoggedID,
              removeDataProductIds,
              currencyRate,
              floatDataProduct, // Ensure you are sending the updated state
              weighingFee,
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
  };

  const handleVendorEdit = (value) => {
    setVendorID(value);

    const vendor = vendorsEdit.find((v) => String(v.id) === String(value, 10));
    if (vendor) {
      setEmail(vendor.company_email);
      setCountry(vendor.company_country);
    } else {
      setEmail("error");
    }
  };

  const handleAmountValue = (value) => {
    if (payment !== "Online") {
      if (value > bankAmount) {
        swal({
          title: "Oppss!",
          text: "Please input not greater than the account balance",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        }).then(() => {
          setAmount(bankAmount);
        });
      } else {
        if (value > balance_now) {
          swal({
            title: "Oppss!",
            text: "Please input not greater than the balance to pay",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            setAmount(balance_now);
          });
        } else {
          setAmount(value);
        }
      }
    } else {
      setAmount(value);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
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
      swal({
        title: "Create this new purchase?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/payable_payment/addPayment`, null, {
              params: {
                id,
                payment_type: payment,
                accountlisID: accountName,
                amount,
                checkNumber,
                refNumber,
                date,
                bankAmount,
                transactionID,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Payment added to this payable transaction",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  setAccountName("");
                  setPayment("Cash");
                  setAmount("");
                  setCheckNumber("");
                  setRefNumber("");
                  setBankAmount("");
                  setDate(getTodayDate());
                  setValidated(false);
                  fetchDataPayment(id);
                  // fetchAccountData();
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "success",
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

  const handleCancel = async () => {
    if (dataPayment && dataPayment.length > 0) {
      swal({
        title: "Oppss!",
        text: "You cannot cancel transaction already paid",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to cancel this transaction",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/payable/cancel_transaction`, null, {
              params: {
                id,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "You successfully cancel this transaction",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/Purchases/Payable");
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            });
        }
      });
    }
  };

  console.log(dataProduct);

  const handleMarkPay = async () => {
    if (parseFloat(balance_now) > 0) {
      swal({
        title: "Oppss!",
        text: "You have balance to pay first",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to mark as paid this transaction",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/payable/markPaid_transaction`, null, {
              params: {
                id,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Transaction is tagged as paid",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/Purchases/Payable");
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            });
        }
      });
    }
  };

  const totalCashPaid = dataPayment.reduce(
    (acc, data) =>
      data.payment_type === "Cash" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const totalBankPaid = dataPayment.reduce(
    (acc, data) =>
      data.check_number === null && data.payment_type === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0
  );

  const totalCheckPaid = dataPayment.reduce(
    (acc, data) =>
      data.check_number !== null && data.payment_type === "Bank"
        ? acc + parseFloat(data.amount || 0)
        : acc,
    0
  );

  const totalOnlinePaid = dataPayment.reduce(
    (acc, data) =>
      data.payment_type === "Online" ? acc + parseFloat(data.amount || 0) : acc,
    0
  );

  const dateValidation = async (selectedDate) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      if (res.data == false) {
        swal({
          icon: "error",
          title: "Invalid Date Selection",
          text: "Please Create Cutoff for this Date",
          // buttons: false,
          // timer: 2000,
        }).then(() => {
          setPurchaseDate("");
        });
      } else {
        setPurchaseDate(selectedDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [subject1, setSubject1] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject2, setSubject2] = useState("");
  const [subject2Type, setSubject2Type] = useState("");
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [subject3, setSubject3] = useState("");

  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);
  const [checkNo, setCheckNo] = useState("");

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
        .get(`${BASE_URL}/accountListSub/getSubject`, {
          params: {
            account_selected: account_selected,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);

          setSubject2("");
          setSubject3("");
          setPaymentMethod("");
          setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
          setIsSubject3Disabled(true); // Reset and disable Subject 3
          setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
          setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

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

  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input

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

  const handleSubject2Change = (event, subject_type) => {
    const selectedSubject2 = event.target.value;

    try {
      axios
        .get(`${BASE_URL}/accountListSub/getSubject3ChainDropdown`, {
          params: {
            subjectId: selectedSubject2,
            id: id,
          },
        })
        .then((res) => {
          setSubject3DataList(res.data);
          setSubject2(selectedSubject2);
          setSubject3("");
          setPaymentMethod("");
          setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
          setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
          setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
          setSubject2Type(subject_type);
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

  const handleSubject3Change = (event) => {
    const selectedSubject3 = event.target.value;
    setSubject3(selectedSubject3);
    setPaymentMethod("");
    setIsPaymentMethodDisabled(false); // Enable Payment Method after Subject 3 selection
    setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  };

  const handlePaymentMethodChange = (event) => {
    const selectedPaymentMethod = event.target.value;
    setPaymentMethod(selectedPaymentMethod);
    setIsRemarksDisabled(false); // Enable Remarks/Check No. after Payment Method selection
  };

  const handleFormSubmit = async (e, type) => {
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
          title: "Are you sure?",
          text: "Once submitted, you will not be able to edit this transaction.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });

        if (willProceed) {
          const response = await axios.post(
            `${BASE_URL}/accountListSub/createTransaction`,
            {
              subject1,
              subject3,
              paymentMethod,
              amount,
              checkNo,
              date,
              id,
              type,
            }
          );

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Transaction created successfully",
              timer: 2000,
            }).then(() => {
              reloadTable();
              // reloadAccountName();
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
    reloadTable();
    // reloadAccountName();
    calcuNetWeightFromNetweightInputONly();
  }, [dataProduct, floatDataProduct]);

  const [transaction, setTransaction] = useState([]);

  const reloadTable = () => {
    axios
      .get(`${BASE_URL}/accountListSub/getTransaction`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setTransaction(res.data);
      });
  };

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
                ? data.weight * (1 - data.moisture / 100)
                : data.weight - data.moisture,
          }));

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
            }
          );

          if (response.status === 200) {
            swal({
              title: "Approved successfully!",
              text: "The Payment has been approved successfully.",
              icon: "success",
              button: "OK",
            }).then(() => {
              navigate("/Purchases/Payable");
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
              //navigate to /Purchases/Payable
              navigate("/Purchases/Payable");
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

  const [productCode, setProductCode] = useState("");
  const [uom, setUOM] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [weight, setWeight] = useState(0);
  const [moisture, setMoisture] = useState(0);
  const [netWeight, setNetWeight] = useState(0);

  const [rowData, setRowData] = useState(
    floatDataProduct.map(() => ({
      productId: "",
      productTagVendorId: "",
      productCode: "",
      uom: "",
      unitPrice: 0,
      weight: 0,
      moisture: 0,
    }))
  );

  const updateRowData = (index, key, value) => {
    setRowData((prevRowData) => {
      const updatedRowData = [...prevRowData];
      updatedRowData[index][key] = value;
      return updatedRowData;
    });
  };

  // Find the currency name
  const findCurrencyName = currencyEdit.find((item) => {
    if (currencyId) {
      return item.id == currencyId;
    }
  });

  const calculateTotalWeightInKilo = [
    ...dataProduct,
    ...floatDataProduct,
  ].reduce((total, value) => {
    return total + (parseFloat(String(value.weight).replace(/,/g, "")) || 0);
  }, 0);

  const calculateTotalMoistureInKilo = [
    ...dataProduct,
    ...floatDataProduct,
  ].reduce((total, value) => {
    // Get Moisture in pese
    const moistureInPeso = isNaN(
      parseFloat(String(value.moisture).replace(/,/g, "") / value.unitPrice) *
        parseFloat(String(value.weight).replace(/,/g, ""))
    )
      ? 0
      : parseFloat(String(value.moisture).replace(/,/g, "") / value.unitPrice) *
        parseFloat(String(value.weight).replace(/,/g, ""));

    // Get Moisture in percentage
    const moistureInPercentage = isNaN(
      (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
        parseFloat(String(value.weight).replace(/,/g, ""))
    )
      ? 0
      : (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
        parseFloat(String(value.weight).replace(/,/g, ""));

    return value.moisture_type == "%"
      ? total + moistureInPercentage
      : total + moistureInPeso;
  }, 0);

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
      const netWeightInPeso = weight - moisture / unitPrice;
      const netWeightInPercentage = weight * (1 - moisture / 100);

      return value.moisture_type === "%"
        ? total + netWeightInPercentage
        : total + netWeightInPeso;
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
  const formatNumberWithCommas = (number) => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  // totalAmount
  let discountCalculation =
    discountType == "%"
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
  }, [totalAmount1]);

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
                <Button type="button" onClick={handleUpdate}>
                  Update
                </Button>
              </div>
            ) : (
              <>
                <div className="dropdown dropdown-button">
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
                    {...(status !== "Rejected" && status !== "Partially-Paid"
                      ? { "data-bs-toggle": "dropdown" }
                      : {})}
                    aria-expanded="false"
                  >
                    <i className="bx bx-dots-horizontal fs-4"></i>
                  </button>
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
                    {authrztn.includes("Payable-Edit") &&
                      status === "Pending" && (
                        <li>
                          <span
                            style={{ cursor: "pointer" }}
                            className="dropdown-item"
                            onClick={() => setIsEditable(true)}
                          >
                            Edit Transaction
                          </span>
                        </li>
                      )}

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

                    {authrztn.includes("Payable-Print") &&
                      (status === "Approved" || status === "Paid") && (
                        <div className="h-75">
                          <button
                            className="btn btn-outline-danger h-100"
                            type="button"
                            onClick={openPDFPreview}
                          >
                            Preview PDF
                          </button>
                        </div>
                      )}

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
            <div className="col-sm d-flex flex-column mb-2">
              <h6 className="text-secondary">Transaction ID</h6>
              <h5>{transaction_id}</h5>
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
                {status == "Rejected" ? "Rejected By" : "Approved By"}
              </h6>
              <h5
                className={`${
                  approvedBy.trim() == "TBA" ? "text-muted fst-italic" : ""
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
              <h6 className="text-secondary">Due Date</h6>
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
                  <div>
                    <DatePicker
                      selected={due_date}
                      onChange={(date) => setDue_date(date)}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{due_date && format(due_date, "MMM dd, yyyy")}</h5>
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
                  <div>
                    <DatePicker
                      selected={purchaseDate}
                      onChange={(date) => dateValidation(date)}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>
                    {purchaseDate && format(purchaseDate, "MMM dd, yyyy")}
                  </h5>
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
                    className="form-control p-2"
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{containerNumber}</h5>
                </React.Fragment>
              )}
            </div>
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
                    className="form-control p-2"
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h5>{pier}</h5>
                </React.Fragment>
              )}
            </div>
          </div>
          <div className="row mx-auto p-2 mb-2">
            <div className="col-sm px-2 mx-1">
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
                        placeholder="Enter Tracking Number"
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
            </div>

            <div className="col-sm">
              <h6 className="text-secondary">Weighing Fee</h6>
              {isEditable == true ? (
                <div className="input-group mb-2">
                  <div className="input-group-prepend">
                    <div className="input-group-text py-2 text-secondary">
                      {currencySymbol[findCurrencyName?.currency_name ?? "PHP"]}
                    </div>
                  </div>
                  <input
                    type="number"
                    onKeyDown={(e) => {
                      if (["+", "-", "e"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      let value = e.target.value;
                      setWeighingFee(value === "" ? "" : Number(value));
                    }}
                    value={weighingFee}
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
            <div className="col-sm-6 px-2 mx-1">
              {domestic_type !== "local" && (
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
                        className="form-control p-2"
                      />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <h5>{tracking_number}</h5>
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
            </div>
          </div>
        </div>

        <div className="w-100 mt-4 border rounded shadow-sm p-2">
          <label htmlFor="" className="mb-2">
            Item List
          </label>
          <div className="table-responsive ">
            <table className="table table-bordered ">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Product Code</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Unit of Measure</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2">Moisture</th>
                  <th className="p-2">Net Weight</th>
                  <th className="p-2">Unit Price</th>
                  <th className="p-2">Subtotal</th>
                  {isEditable && <th className="p-2">Action</th>}
                </tr>
              </thead>
              <tbody>
                {dataProduct.map((data) => (
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
                        placeholder="Enter Weight"
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
                              netWeight = weightNum * (1 - moistureNum / 100);
                            } else {
                              const unitPriceNum = parseFloat(
                                String(data.unitPrice).replace(/,/g, "")
                              );
                              if (unitPriceNum) {
                                netWeight =
                                  weightNum - moistureNum / unitPriceNum;
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
                                netWeight = weightNum * (1 - moistureNum / 100);
                              } else {
                                const unitPriceNum = parseFloat(
                                  String(data.unitPrice).replace(/,/g, "")
                                );
                                if (unitPriceNum) {
                                  netWeight =
                                    weightNum - moistureNum / unitPriceNum;
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
                        placeholder="Enter Net Weight"
                      />
                    </td>
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
                    {isEditable && (
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
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {floatDataProduct.map((data, index) => (
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
                      <select
                        className="form-select"
                        disabled={!isEditable}
                        onChange={(e) => {
                          const selectedValue = String(e.target.value, 10);
                          const selectedProduct = product.find(
                            (p) => p.product_id === selectedValue
                          );

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
                                      unitPrice: selectedProduct.product_price,
                                      productId: selectedProduct.product_id,
                                      productTagVendorId: selectedProduct.id,
                                    }
                                  : item
                              )
                            );
                          }
                        }}
                      >
                        <option value="">Select Product</option>
                        {product.map((item) => (
                          <option
                            key={item.product_list.product_id}
                            value={item.product_list.product_id}
                          >
                            {item.product_list.product_name}
                          </option>
                        ))}
                      </select>
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
                            const netWeight =
                              currentWeight * (1 - newMoisture / 100);

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
                              i === index ? { ...item, unitPrice: value } : item
                            )
                          );
                        }}
                      />
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
                    {isEditable && (
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            setFloatDataProduct((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="w-100 d-flex justify-content-end mt-2">
              {isEditable && (
                <button className="btn btn-primary btn-sm" onClick={addNewItem}>
                  New Item
                </button>
              )}
            </div>
          </div>
          <div className="row mx-auto p-2 mt-4 mb-4">
            <div className="col-sm border-end">
              <div className="w-100 d-flex flex-row justify-content-between p-2">
                <span>Total Weighted: </span>
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
                <span>Total Net Weight:</span>
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
                <span>Total Weighted Amount</span>
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
                <span>Total Net Weight Amount</span>
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
                  {parseFloat(
                    totalWeight - totalMoisture - weighingFee - totalOtherFees
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: findCurrencyName?.currency_name || "PHP",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                    {discountType == "%"
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
                  {totalAmount1.toLocaleString("en-US", {
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
                    <div className="text-end">
                      {authrztn.includes("Payable-Approve") &&
                        status === "Pending" && (
                          <button
                            className="btn btn-danger me-1 px-4"
                            type="button"
                            onClick={rejectedPayment}
                            disabled={status !== "Pending" || isCutoffPosted}
                          >
                            Reject
                          </button>
                        )}
                      &nbsp;
                      {authrztn.includes("Payable-Approve") &&
                        status === "Pending" && (
                          <button
                            onClick={approvedPayment}
                            disabled={status !== "Pending" || isCutoffPosted}
                            className="btn btn-success"
                          >
                            Approve
                          </button>
                        )}
                    </div>
                    {isCutoffPosted && status === "Pending" && (
                      <div className="w-100 mt-2 text-end">
                        <p className="text-danger">
                          Action is prohibited as the Purchase date has already
                          been posted.
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
          <PDFViewer style={{ width: "100%", height: "100vh" }}>
            <PayablePDF id={id} />
          </PDFViewer>
        </Modal>
        {/* <div className="w-100 mt-4">
          <div className="w-100 d-flex align-items-center">
            <h5>Payment</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 p-2 mt-1 row">
            <div className="col-12 col-md-4 p-2">
              <div className="w-100 border shadow-sm p-3 rounded">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment Method</span>
                  <span className="text-secondary">Payment List</span>
                </div>
                <Form validated={validated} onSubmit={handleAddPayment}>
                  <Form.Group className="mb-3" controlId="payWith">
                    <Form.Label className="fw-bold">Pay With:</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="Cash"
                        label="Cash"
                        value="Cash"
                        checked={payment === "Cash"}
                        onClick={fetchAccountData}
                        onChange={(e) => setPayment(e.target.value)}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="Bank"
                        label="Bank"
                        value="Bank"
                        onClick={fetchAccountData}
                        checked={payment === "Bank"}
                        onChange={(e) => setPayment(e.target.value)}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="Online"
                        label="Online"
                        value="Online"
                        onClick={fetchAccountData}
                        checked={payment === "Online"}
                        onChange={(e) => setPayment(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="accountName">
                    <Form.Label>Account</Form.Label>
                    <Form.Select
                      value={accountName}
                      className="p-2"
                      required={payment !== "Online"}
                      onChange={handleAccountChange}
                    >
                      <option disabled value="">
                        Select Account name
                      </option>
                      {accountListData.map((data) => (
                        <option
                          key={data.account_list_id}
                          value={data.account_list_id}
                        >
                          {data.account_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {payment === "Bank" && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                      />
                    </Form.Group>
                  )}
                  {payment === "Online" && (
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
                      />
                    </div>
                    {bankAmount && <span>Bank Amount: {bankAmount}</span>}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="date">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      className="p-2"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    disabled={status === "Cancelled" || isPaid === "Paid"}
                    type="submit"
                    className="w-100 p-2"
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
                  <span className="text-secondary">Rol Management</span>
                </div>
                <div className="mt-3">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th className="p-2">Type</th>
                          <th className="p-2">Account Holder</th>
                          <th className="p-2">Account Name</th>
                          <th className="p-2">Ammount</th>
                          <th className="p-2">Check Number</th>
                          <th className="p-2">Reference Number</th>
                          <th className="p-2">Issue Date</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataPayment.map((data) => (
                          <tr>
                            <td>{data.payment_type}</td>
                            <td>{`${
                              data.account_list?.masterlist
                                ? data.account_list.masterlist.fname
                                : ""
                            } ${
                              data.account_list?.masterlist
                                ? data.account_list.masterlist.lname
                                : "Paid Online"
                            }`}</td>
                            <td>
                              {data.account_list
                                ? data.account_list.account_name
                                : "Paid Online"}
                            </td>
                            <td>{data.amount}</td>
                            <td>
                              {data.check_number === null
                                ? "--"
                                : data.check_number}
                            </td>
                            <td>
                              {data.ref_number === null
                                ? "--"
                                : data.ref_number}
                            </td>
                            <td>{data.date_issued}</td>
                            <td className="text-primary">Edit</td>
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
                  <span className="text-secondary">Rol Management</span>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Last Balance</span>
                      <span className="text-secondary">
                        {toPayAmount - balanceBefore}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">New Balance</span>
                      <span className="text-white text-underline">
                        {balance_now}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm"></div>
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Cash</span>
                      <span className="text-secondary">{totalCashPaid}</span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Bank</span>
                      <span className="text-secondary">{totalBankPaid}</span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Check</span>
                      <span className="text-secondary">{totalCheckPaid}</span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Online Bank Transfer</span>
                      <span className="text-secondary">{totalOnlinePaid}</span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Total Payment</span>
                      <span className="text-white text-underline">
                        {totalCashPaid +
                          totalBankPaid +
                          totalCheckPaid +
                          totalOnlinePaid}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleFormSubmit(e, "Credit")}
        >
          <div className="col-12 col-md-8 p-2 d-flex flex-column">
            <div className="w-100 border shadow-sm p-2 rounded mb-2">
              <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                <span className="fw-bold">Payment List</span>
                <span className="text-secondary">Payrol Management</span>
              </div>
              <div className="mt-3">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Subject 1</th>
                        <th>Subject 2</th>
                        <th>Subject 3</th>
                        <th>Payment Method</th>
                        <th>
                          {paymentMethod === "Bank" ? "Check No." : "Remarks"}
                        </th>
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
                                e.target.options[
                                  e.target.selectedIndex
                                ].getAttribute("data-subject-type")
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
                            {subject3DataList.map((option) => (
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
                        <td style={{ padding: "15px" }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="0.00"
                            disabled={isRemarksDisabled}
                            required
                            onChange={(e) => setAmount(e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>

                    <Button variant="primary" type="submit">
                      Submit
                    </Button>
                  </table>
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
                      <input
                        type="date"
                        name=""
                        id=""
                        className="form-control p-2"
                      />
                    </div>
                    <div className="col-sm mb-2">
                      <span>To</span>
                      <input
                        type="date"
                        name=""
                        id=""
                        className="form-control p-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
                  <button className="btn w-100">Apply Filter</button>
                  <button className="btn btn-secondary w-100">
                    Clear Filter
                  </button>
                </div>
                <div className="col-sm"></div>
              </div>
              <table className="table table-bordered table-hover mt-2">
                <thead className="table-light">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Payment Method</th>
                    <th className="p-2">Check No.</th>
                    <th className="p-2">Withdraw</th>
                    <th className="p-2">Payment Method</th>
                    <th className="p-2">Check No.</th>
                    <th className="p-2">Deposit</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {transaction.map((transaction, index) => {
                    // Calculate the balance for this row
                    const debitAmount = transaction.debit
                      ? parseFloat(transaction.debit.amount)
                      : 0;
                    const creditAmount = transaction.credit
                      ? parseFloat(transaction.credit.amount)
                      : 0;
                    const rowBalance = debitAmount - creditAmount;

                    // Calculate cumulative balance
                    let cumulativeBalance = transaction.balance || rowBalance;

                    return (
                      <tr key={index}>
                        <td>{transaction.date}</td>
                        <td>
                          {transaction.debit
                            ? transaction.debit.payment_method
                            : "---"}
                        </td>
                        <td>
                          {transaction.debit
                            ? transaction.debit.check_or_remarks
                            : "---"}
                        </td>
                        <td>
                          ₱{" "}
                          {transaction.debit ? transaction.debit.amount : "---"}
                        </td>
                        <td>
                          {transaction.credit
                            ? transaction.credit.payment_method
                            : "---"}
                        </td>
                        <td>
                          {transaction.credit
                            ? transaction.credit.check_or_remarks
                            : "---"}
                        </td>
                        <td>
                          ₱{" "}
                          {transaction.credit
                            ? transaction.credit.amount
                            : "---"}
                        </td>
                        <td
                          className={
                            creditAmount > 0 ? "text-danger" : "text-primary"
                          }
                        >
                          {creditAmount > 0 ? "-" : "+"} ₱
                          {Math.abs(
                            creditAmount > 0 ? creditAmount : debitAmount || 0
                          ).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="w-100 border shadow-sm p-3 rounded ">
              <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                <span className="fw-bold">Balance Details</span>
                <span className="text-secondary">Rol Management</span>
              </div>
              <div className="row">
                <div className="col-sm mb-2">
                  <div className="w-100 d-flex flex-row justify-content-between p-2">
                    <span>Last Balance</span>
                    <span className="text-secondary">
                      {toPayAmount - balanceBefore}
                    </span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                    <span className="text-white">New Balance</span>
                    <span className="text-white text-underline">
                      {balance_now}
                    </span>
                  </div>
                </div>
                <div className="col-sm"></div>
                <div className="col-sm mb-2">
                  <div className="w-100 d-flex flex-row justify-content-between p-2">
                    <span>Cash</span>
                    <span className="text-secondary">{totalCashPaid}</span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-2">
                    <span>Bank</span>
                    <span className="text-secondary">{totalBankPaid}</span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-2">
                    <span>Check</span>
                    <span className="text-secondary">{totalCheckPaid}</span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-2">
                    <span>Online Bank Transfer</span>
                    <span className="text-secondary">{totalOnlinePaid}</span>
                  </div>
                  <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                    <span className="text-white">Total Payment</span>
                    <span className="text-white text-underline">
                      {totalCashPaid +
                        totalBankPaid +
                        totalCheckPaid +
                        totalOnlinePaid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form> */}
      </div>
    </div>
  );
};

export default PayablePayment;
