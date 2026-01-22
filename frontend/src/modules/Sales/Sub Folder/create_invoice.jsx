import React, { useState, useEffect, useRef } from "react";
import { Form, Modal, Button } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, Link } from "react-router-dom";
import swal from "sweetalert";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
const Create_invoice = () => {
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return manilaTime;
  };

  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [customerData, setCustomerData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [cutOffData, setCutOffData] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [subject3Data, setSubject3Data] = useState([]);
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState(
    getManilaDate()
  );

  const [transactionDiscountModal, setTransactionDiscountModal] =
    useState(false);
  const [shippingFeeModal, setShippingFeeModal] = useState(false);
  const [displayDiscount, setDisplayDiscount] = useState(0);
  const [displayShippingFee, setDisplayShippingFee] = useState(0);
  const [inputDiscount, setInputDiscount] = useState("");
  const [inputShippingFee, setInputShippingFee] = useState("");
  const [modalDiscount, setModalDiscount] = useState(true);
  const [modalDiscountType, setModalDiscountType] = useState("fixed");
  const [modalDiscountValue, setModalDiscountValue] = useState("");

  const handleCloseTransactionDiscount = () =>
    setTransactionDiscountModal(false);
  const handleShowTransactionDiscount = () => setTransactionDiscountModal(true);

  const handleCloseShippingFee = () => setShippingFeeModal(false);
  const handleShowShippingFee = () => setShippingFeeModal(true);

  const [editIndex, setEditIndex] = useState(null);

  const [transactionId, setTransactionId] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  const [inputPaymentTerms, setInputPaymentTerms] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedSubject3, setSelectedSubject3] = useState("");
  const [remarks, setRemarks] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [pier, setPier] = useState("");
  const [currencyRate, setCurrencyRate] = useState(null);
  const [shipmentFee, setShipmentFee] = useState("");
  const [items, setItems] = useState([
    {
      productCode: "",
      productName: "",
      remaining: "",
      averagePrice: "",
      quantity: "",
      moisture: "",
      netWeight: "",
      unitPrice: "",
      sales_profit: "",
      discount: "",
      subtotal: 0,
      discountType: "percentage",
    },
  ]);
  const [totalItemDiscount, setTotalItemDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalNetWeight, setTotalNetWeight] = useState(0);
  const [totalWeightedAmount, setTotalWeightedAmount] = useState(0);
  const [totalMoistureAmount, setTotalMoistureAmount] = useState(0);
  const [totalNetWeightAmount, setTotalNetWeightAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [qty, setQty] = useState(0);
  const [isAmountQtyDisabled, setIsAmountQtyDisabled] = useState(true);
  const discountAmountPhp = useRef(0);
  const totalAmountUseRef = useRef(0);

  const fetchTransactionCode = () => {
    axios
      .get(BASE_URL + "/invoice/transactionSalesId")
      .then((res) => {
        setTransactionId(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/invoice/getCutoffPosted")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchWarehouse = () => {
    axios
      .get(BASE_URL + "/invoice/getWarehouse")
      .then((res) => {
        setWarehouseData(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchDataProduct = async (warehouse_id) => {
    try {
      if (!warehouse_id) {
        setProductData([]);
        return;
      }

      const [productRes] = await Promise.all([
        axios.get(
          `${BASE_URL}/invoice/getProductInventoryInvoice?warehouse_id=${warehouse_id}`
        ),
      ]);

      setProductData(productRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomerCurrency = async () => {
    try {
      const [currencyRes, customerRes] = await Promise.all([
        axios.get(`${BASE_URL}/currency/fetchCurrency`),
        axios.get(`${BASE_URL}/invoice/getCustomersData`),
      ]);

      setCurrencyData(currencyRes.data);

      const sortedCustomerList = customerRes.data.sort(
        (a, b) => b.customer_id - a.customer_id
      );
      setCustomerData(sortedCustomerList);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLiabilitySub3 = () => {
    axios
      .get(BASE_URL + "/invoice/getSubject3", {
        params: {
          selectedCurrency,
        },
      })
      .then((res) => {
        setSubject3Data(res.data);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  };

  useEffect(() => {
    fetchDataProduct();
    fetchTransactionCode();
    fetchCutOff();
    fetchWarehouse();
    fetchCustomerCurrency();
  }, []);

  useEffect(() => {
    if (selectedCurrency) {
      fetchLiabilitySub3();
    }
  }, [selectedCurrency]);

  const addNewItem = () => {
    setItems([
      ...items,
      {
        productCode: "",
        productName: "",
        remaining: "",
        averagePrice: "",
        quantity: "",
        moisture: "",
        netWeight: "",
        unitPrice: "",
        sales_profit: "",
        discount: "",
        subtotal: 0,
        discountType: "percentage",
      },
    ]);
  };

  // const handleProductChange = (index, productId) => {
  //   const selectedProduct = productData.find(
  //     (product) => product.product_id === parseInt(productId)
  //   );
  //   const updatedItems = [...items];
  //   if (selectedProduct) {
  //     updatedItems[index].productCode = selectedProduct.product_code;
  //     updatedItems[index].remaining = selectedProduct.stock;
  //     updatedItems[index].averagePrice = selectedProduct.average_price;
  //     updatedItems[index].productName = productId;
  //   }
  //   setItems(updatedItems);
  // };

  const handleProductChange = (index, productId) => {
    const selectedProduct = productData.find(
      (product) => String(product.product_id) === String(productId)
    );

    const updatedItems = [...items];
    if (selectedProduct) {
      updatedItems[index] = {
        ...updatedItems[index],
        productCode: selectedProduct.product_code,
        remaining: selectedProduct.total_stock,
        averagePrice: selectedProduct.average_price,
        productName: productId,
        stockDetails: selectedProduct.stock_details,
      };
    }
    setItems(updatedItems);
  };

  const getFilteredProductData = (index) => {
    const selectedProductIds = items
      .map((item) => item.productName)
      .filter((id) => id);
    return productData.filter(
      (product) =>
        !selectedProductIds.includes(product.product_id.toString()) ||
        items[index].productName === product.product_id.toString()
    );
  };

  const removeComma = (n) => {
    return parseFloat(String(n).replace(/,/g, ""));
  };

  console.log(items);

  const shipmentAmount = (e, field) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    // setAmount or setQty
    if (field === "amount") {
      if (e.target.value.length > 1) {
        setAmount(cleanedValue);
      } else {
        setAmount(formattedValue);
      }

      setShipmentFee(removeComma(e.target.value) * removeComma(qty));
    } else {
      if (e.target.value.length > 1) {
        setQty(cleanedValue);
      } else {
        setQty(formattedValue);
      }

      setShipmentFee(removeComma(e.target.value) * removeComma(amount));
    }
  };

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

  const handleTransactionDiscount = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.,]/g, "");

    if ((inputValue.match(/\./g) || []).length > 1) {
      return;
    }

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/,/g, "");
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
    setInputDiscount(formattedValue);
  };

  // const handleInputQTY = (index, field, value) => {
  //   if (value === ".") {
  //     setItems((prevItems) => {
  //       const updatedItems = [...prevItems];
  //       updatedItems[index][field] += ".";
  //       return updatedItems;
  //     });
  //     return;
  //   }

  //   let inputValue = value.replace(/[^0-9.]/g, "");

  //   if ((inputValue.match(/\./g) || []).length > 1) return;

  //   let [integerPart, decimalPart] = inputValue.split(".");

  //   if (integerPart) {
  //     integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  //   }

  //   let formattedValue =
  //     decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

  //   // Remove commas for calculations
  //   let numericValue = parseFloat(inputValue.replace(/,/g, "")) || 0;

  //   const updatedItems = [...items];
  //   updatedItems[index][field] = formattedValue; // Store formatted value in the state

  //   const quantity =
  //     parseFloat(String(updatedItems[index].quantity).replace(/,/g, "")) || 0;
  //   const unitPrice =
  //     parseFloat(String(updatedItems[index].unitPrice).replace(/,/g, "")) || 0;
  //   let discount =
  //     parseFloat(String(updatedItems[index].discount).replace(/,/g, "")) || 0;

  //   if (field === "unitPrice" || field === "averagePrice") {
  //     const averagePrices =
  //       parseFloat(
  //         String(updatedItems[index].averagePrice).replace(/,/g, "")
  //       ) || 0;
  //     updatedItems[index].sales_profit = averagePrices - unitPrice;
  //   }

  //   let subtotal = quantity * unitPrice;

  //   if (updatedItems[index].discountType === "percentage") {
  //     discount = (discount / 100) * subtotal;
  //   }

  //   if (!isNaN(discount)) {
  //     if (discount > subtotal) {
  //       swal({
  //         icon: "error",
  //         title: "Invalid Discount",
  //         text: "The discount should not exceed the total of the subtotal.",
  //       });
  //       updatedItems[index].discount = "0";
  //       discount = 0;
  //     }
  //     subtotal -= discount;
  //   }

  //   updatedItems[index].subtotal = subtotal;

  //   if (field === "quantity") {
  //     const quantity = numericValue;
  //     const remaining =
  //       parseFloat(String(updatedItems[index].remaining).replace(/,/g, "")) ||
  //       0;

  //     if (quantity > remaining) {
  //       swal({
  //         icon: "error",
  //         title: "Invalid Quantity",
  //         text: `The qty inputted must not exceed the available stock (${remaining}).`,
  //       });
  //       updatedItems[index].quantity = "0";
  //     }
  //   }

  //   setItems(updatedItems);
  //   calculateTotals(updatedItems);
  // };

  const handleInputQTY = (index, field, value) => {
    // if (value === ".") {
    //   setItems((prevItems) => {
    //     const updatedItems = [...prevItems];
    //     updatedItems[index][field] += ".";
    //     return updatedItems;
    //   });
    //   return;
    // }

    let inputValue = value.replace(/[^0-9.]/g, "");

    if ((inputValue.match(/\./g) || []).length > 1) return;

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    // Remove commas for calculations
    let numericValue = parseFloat(inputValue.replace(/,/g, "")) || 0;

    const updatedItems = [...items];
    updatedItems[index][field] =
      value.length > 1 && !value.includes(".") ? cleanedValue : formattedValue; // Store formatted value in the state

    const quantity =
      parseFloat(String(updatedItems[index].quantity).replace(/,/g, "")) || 0;
    let moisture =
      parseFloat(String(updatedItems[index].moisture).replace(/,/g, "")) || 0;
    const unitPrice =
      parseFloat(String(updatedItems[index].unitPrice).replace(/,/g, "")) || 0;
    let discount =
      parseFloat(String(updatedItems[index].discount).replace(/,/g, "")) || 0;
    let netWeight =
      parseFloat(String(updatedItems[index].netWeight).replace(/,/g, "")) || 0;

    // pag ang netWeight hindi directly edited, process ang tamang calculation
    if (field !== "netWeight") {
      netWeight = quantity * (1 - moisture / 100);
      updatedItems[index].netWeight = netWeight;
    } else if (field == "netWeight") {
      moisture = 100 * (1 - netWeight / quantity).toFixed(2);
      updatedItems[index].moisture = moisture;
    }
    // Optional condition back-calculate moisture from netWeight and quantity kapag directly nag-edit ang netWeight
    // else if (field === "netWeight" && quantity > 0) {

    //   // moisture = (1 - (netWeight / quantity)) * 100;
    //   // updatedItems[index].moisture = moisture;
    // }

    let subtotal = netWeight * unitPrice;

    if (field === "unitPrice" || field === "averagePrice") {
      const averagePrices =
        parseFloat(
          String(updatedItems[index].averagePrice).replace(/,/g, "")
        ) || 0;
      updatedItems[index].sales_profit = averagePrices - unitPrice;
    }

    if (field === "discount") {
      if (updatedItems[index].discountType === "percentage") {
        if (discount > 100) {
          swal({
            icon: "error",
            title: "Invalid Discount",
            text: "Percentage discount cannot exceed 100%.",
          });
          updatedItems[index].discount = "0";
          discount = 0;
        }
      } else {
        if (discount > subtotal) {
          swal({
            icon: "error",
            title: "Invalid Discount",
            text: "The discount should not exceed the subtotal.",
          });
          updatedItems[index].discount = "0";
          discount = 0;
        }
      }
    }

    // Calculate effective discount amount
    let effectiveDiscount = 0;
    if (updatedItems[index].discountType === "percentage") {
      effectiveDiscount = (discount / 100) * subtotal;
    } else {
      effectiveDiscount = discount;
    }

    subtotal -= effectiveDiscount;

    updatedItems[index].subtotal = subtotal;

    // Check if quantity exceeds remaining stock
    if (field === "quantity") {
      const quantity = numericValue;
      const remaining =
        parseFloat(String(updatedItems[index].remaining).replace(/,/g, "")) ||
        0;

      if (quantity > remaining) {
        const wrapper = document.createElement("div");
        wrapper.className = "center-swal-text";
        wrapper.innerHTML = `The quantity inputted must not exceed the available stock (${
          String(remaining).includes(".") ? remaining.toFixed(2) : remaining
        }).`;
        swal({
          icon: "error",
          title: "Invalid Quantity",
          content: wrapper,
        });
        updatedItems[index].quantity = "0";
        updatedItems[index].netWeight = "0";
        updatedItems[index].subtotal = 0;
      }
    }

    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    let totalDiscount = 0;
    let totalAmount = 0;
    let totalQuantity = 0;
    let totalMoisture = 0;
    let totalNetWeight = 0;
    let totalWeightedAmount = 0;
    let totalMoistureAmount = 0;
    let totalNetWeightAmount = 0;

    items.forEach((item) => {
      const quantity = parseFloat(String(item.quantity).replace(/,/g, "")) || 0;
      const moisture = parseFloat(String(item.moisture).replace(/,/g, "")) || 0;
      const netWeight =
        parseFloat(String(item.netWeight).replace(/,/g, "")) || 0;
      const unitPrice =
        parseFloat(String(item.unitPrice).replace(/,/g, "")) || 0;
      let discount = parseFloat(String(item.discount).replace(/,/g, "")) || 0;

      totalQuantity += quantity;
      totalMoisture += (moisture * quantity) / items.length; // Average moisture percentage
      totalNetWeight += netWeight;

      // Calculate weighted amounts
      const weightedAmount = quantity * unitPrice;
      const moistureAmount = ((quantity * moisture) / 100) * unitPrice;
      const netWeightAmount = netWeight * unitPrice;

      totalWeightedAmount += weightedAmount;
      totalMoistureAmount += moistureAmount;
      totalNetWeightAmount += netWeightAmount;

      // Calculate discount
      if (item.discountType === "percentage") {
        discount = (discount / 100) * netWeightAmount;
      }

      if (!isNaN(discount)) {
        if (discount > netWeightAmount) {
          discount = 0;
        }
      }

      totalDiscount += discount;
      totalAmount += parseFloat(item.subtotal);
    });

    // Update state with calculated totals
    setTotalItemDiscount(totalDiscount);
    setTotalQuantity(totalQuantity);
    setTotalMoisture(totalMoisture);
    setTotalNetWeight(totalNetWeight);
    setTotalWeightedAmount(totalWeightedAmount);
    setTotalMoistureAmount(totalMoistureAmount);
    setTotalNetWeightAmount(totalNetWeightAmount);

    // Apply transaction discount if any
    if (displayDiscount === 0) {
      setTotalAmount(totalAmount);
    } else {
      setTotalAmount(
        parseFloat(totalAmount - (discountAmountPhp.current || 0))
      );
    }
    totalAmountUseRef.current = totalAmount;

    // Calculate transaction discount
    let discountAmount = 0;
    if (modalDiscount) {
      discountAmount = parseFloat((displayDiscount / 100) * totalAmount);
      const newTotalAmount = parseFloat(totalAmount - discountAmount);
      setTotalAmount(newTotalAmount);
    } else {
      discountAmount = parseFloat(displayDiscount);
      const newTotalAmount = parseFloat(totalAmount - discountAmount);
      setTotalAmount(newTotalAmount);
    }
    discountAmountPhp.current = parseFloat(discountAmount.toFixed(2));
  };

  const handleDiscountButton = (index) => {
    const updatedItems = [...items];
    const currentDiscountType = updatedItems[index].discountType;

    updatedItems[index].discountType =
      currentDiscountType === "percentage" ? "fixed" : "percentage";

    if (isNaN(currentDiscountType)) {
      updatedItems[index].discount = "";
    } else if (currentDiscountType === "percentage") {
      updatedItems[index].discount = (
        parseFloat(updatedItems[index].discount) * 100
      ).toFixed(2);
    } else {
      updatedItems[index].discount = (
        parseFloat(updatedItems[index].discount) / 100
      ).toFixed(2);
    }

    setItems(updatedItems);
  };

  // const toggleEdit = (index) => {
  //   setEditIndex(index === editIndex ? null : index);
  // };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const handleDiscountIcon = () => {
    setModalDiscount(!modalDiscount);
    setModalDiscountType(!modalDiscount ? "percentage" : "fixed");
  };

  const handleAddDiscount = () => {
    const discountValue = inputDiscount.replace(/,/g, ""); // Remove commas
    const discount = parseFloat(discountValue) || 0; // Convert to number
    const discountType = modalDiscountType;
    const currentTotalAmount = parseFloat(totalAmountUseRef.current) || 0;

    if (discountType === "percentage") {
      if (discount > 100) {
        swal({
          icon: "error",
          title: "Invalid Discount",
          text: "Percentage discount cannot exceed 100%.",
        });
        setInputDiscount("0");
        return;
      }
    } else {
      if (discount > currentTotalAmount) {
        swal({
          icon: "error",
          title: "Invalid Discount",
          text: "Transaction discount should not exceed the total amount.",
        });
        setInputDiscount("0");
        return;
      }
    }

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (discount / 100) * currentTotalAmount;
    } else {
      discountAmount = discount;
    }

    const newTotalAmount = currentTotalAmount - discountAmount;
    setTotalAmount(newTotalAmount);
    discountAmountPhp.current = discountAmount;
    setDisplayDiscount(parseFloat(discountValue));
    setTransactionDiscountModal(false);
  };

  const handleAddShippingFee = () => {
    const shippingFee = parseFloat(inputShippingFee.replace(/,/g, "")) || 0;
    const currentTotalAmount = parseFloat(totalAmount) || 0;

    const newTotalAmount = currentTotalAmount + shippingFee;
    setTotalAmount(newTotalAmount);
    totalAmountUseRef.current = newTotalAmount;
    setDisplayShippingFee(parseFloat(inputShippingFee.replace(/,/g, "")));
    setShippingFeeModal(false);
  };

  const handleRemoveDiscount = (e) => {
    const discountValue = parseFloat(displayDiscount) || 0;
    const discountType = modalDiscountType;

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = discountAmountPhp.current || 0;
    } else {
      discountAmount = discountValue;
    }

    const newTotalAmount = parseFloat(totalAmount) + discountAmount;
    setTotalAmount(newTotalAmount);
    totalAmountUseRef.current = newTotalAmount;
    setDisplayDiscount(0);
    e.stopPropagation();
  };

  const handleRemoveShippingFee = (e) => {
    const shippingFeeValue = parseFloat(displayShippingFee) || 0;
    const newTotalAmount = parseFloat(totalAmount) - shippingFeeValue;
    setTotalAmount(newTotalAmount);
    totalAmountUseRef.current = newTotalAmount;
    setDisplayShippingFee(0);
    e.stopPropagation();
  };

  const dateValidation = async (selectedDate, clearField) => {
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
          clearField("");
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDueDateChange = (date) => {
    const dueDate = date;
    setSelectedDueDate(dueDate);
    // if (dueDate) {
    //   dateValidation(dueDate, setSelectedDueDate);
    // }
    // const isWithinCutoff = cutOffData.some((cutoff) => {
    //   const fromDate = new Date(cutoff.from);
    //   const toDate = new Date(cutoff.to);
    //   const selectedDate = new Date(dueDate);

    //   return selectedDate >= fromDate && selectedDate <= toDate;
    // });

    // if (isWithinCutoff) {
    //   swal({
    //     icon: "warning",
    //     title: "Due Date Conflict",
    //     text: "The due date you selected is already posted in the cutoff period!",
    //     confirmButtonColor: "#d33",
    //   }).then(() => {
    //     setSelectedDueDate("");
    //   });
    // }
  };

  const handleDueInvoiceDate = (date) => {
    const invoiceDate = date;
    setSelectedInvoiceDate(invoiceDate);
    if (invoiceDate) {
      dateValidation(invoiceDate, setSelectedInvoiceDate);
    }

    const isWithinCutoff = cutOffData.some((cutoff) => {
      const fromDate = new Date(cutoff.from);
      const toDate = new Date(cutoff.to);
      const selectedDate = new Date(invoiceDate);

      return selectedDate >= fromDate && selectedDate <= toDate;
    });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Invoice Date Conflict",
        text: "The invoice date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setSelectedInvoiceDate("");
      });
    }
  };

  const CancelInvoice = () => {
    navigate("/sales/invoices");
  };

  const add = async (e) => {
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
      if (totalAmount === 0) {
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

      swal({
        title: "Create this new sale?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const shipAmountFormat =
            parseFloat(String(shipmentFee).replace(/,/g, "")) || 0;

          const payload = {
            transactionId,
            selectedCustomer,
            selectedMethod,
            selectedDueDate,
            selectedInvoiceDate,
            inputPaymentTerms,
            remarks,
            containerNumber,
            pier,
            userLoggedID,
            selectedDestination,
            selectedCurrency,
            currencyRate,
            selectedWarehouse,
            selectedSubject3,
            shipAmountFormat,
            // items: items.map((item) => ({
            //   product_id: item.productName,
            //   quantity: item.quantity,
            //   unitPrice: item.unitPrice,
            //   discount: item.discount,
            //   discountType: item.discountType,
            //   subtotal: item.subtotal,
            //   averagePrice: item.averagePrice,
            //   salesProfit: item.sales_profit,
            // })),
            items: items.flatMap((item) => {
              let remainingQty = String(item.quantity).replace(/,/g, "");
              let distributedItems = [];

              for (const stockItem of item.stockDetails) {
                console.log("Inside", item);
                if (remainingQty > 0) {
                  const qtyToUse = Math.min(remainingQty, stockItem.stock);
                  const moisture =
                    parseFloat(String(item.moisture).replace(/,/g, "")) || 0;
                  const netWeight =
                    parseFloat(String(item.netWeight).replace(/,/g, "")) || 0;
                  distributedItems.push({
                    stock_management_id: stockItem.stock_management_id,
                    product_id: item.productName,
                    quantity: parseFloat(String(qtyToUse).replace(/,/g, "")),
                    unitPrice: parseFloat(
                      String(item.unitPrice).replace(/,/g, "")
                    ),
                    discount: parseFloat(
                      String(item.discount).replace(/,/g, "")
                    ),
                    discountType: item.discountType,
                    moisture: moisture,
                    netWeight: netWeight,
                    subtotal: item.subtotal,
                    averagePrice: item.averagePrice,
                    salesProfit: item.sales_profit,
                  });
                  remainingQty -= qtyToUse;
                }
              }
              return distributedItems;
            }),
            totalAmount,
            transactionDiscount: displayDiscount,
            transactionDiscountType: modalDiscountType,
            shippingFee: displayShippingFee,
            totalItemDiscount,
            amount,
            qty,
          };

          axios.post(`${BASE_URL}/invoice/create`, payload).then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Sales invoice created successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                navigate("../sales/invoices");
              });
            }
            // else if (res.status === 201) {
            //   swal({
            //     title: "Opppss!",
            //     text: "Cutoff already posted for the due date you selected",
            //     icon: "warning",
            //     buttons: false,
            //     timer: 2000,
            //     dangerMode: true,
            //   });
            // }
            else if (res.status === 205) {
              swal({
                title: "Insufficient Stock",
                text: "",
                icon: "error",
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

  const handleChangeCurrency = (value) => {
    const curr = currencyData.find((data) => String(data.id) === String(value));
    setSelectedCurrency(curr.id);
    setCurrencyRate(curr.currency_rate);
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control custom-form-height w-100"
      style={{ cursor: "pointer", caretColor: "transparent" }}
      onClick={onClick}
      value={value}
      ref={ref}
      required
      placeholder="Select Date"
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form noValidate validated={validated} onSubmit={add}>
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">
              <Link to="/sales/invoices" className="text-dark mx-2">
                <i class="fa-solid fa-arrow-left"></i>
              </Link>
              SALES INVOICE
            </span>
          </div>
        </div>
        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Transaction ID</span>
              <Form.Control
                type="text"
                name=""
                id=""
                className="form-control custom-form-height"
                readOnly
                value={transactionId}
              />
            </div>
            <div className="col-sm">
              <span>
                Warehouse <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => {
                  const warehouseId = e.target.value;
                  setSelectedWarehouse(warehouseId);
                  fetchDataProduct(warehouseId);
                }}
                value={selectedWarehouse}
              >
                <option value="" selected disabled>
                  Select Warehouse
                </option>
                {warehouseData.map((data, i) => (
                  <option key={i} value={data.warehouse_id}>
                    {`${data.name}`}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Customer <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedCustomer(e.target.value)}
                value={selectedCustomer}
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {customerData.map((data, i) => (
                  <option key={i} value={data.customer_id}>
                    {data.type === "company"
                      ? data.company_name
                      : `${data.first_name} ${data.last_name}`}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-3">
              <span>
                Payment Method <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedMethod(e.target.value)}
                value={selectedMethod}
              >
                <option value="" selected disabled>
                  Select Payment Method
                </option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Wallet">Wallet</option>
              </Form.Select>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Due Date <span className="text-danger">*</span>
              </span>
              {/* <Form.Control
                type="date"
                name=""
                id=""
                className="form-control custom-form-height"
                required
                onChange={handleDueDateChange}
                value={
                  selectedDueDate
                    ? format(new Date(selectedDueDate), "MMM dd, yyyy")
                    : ""
                }

                // min={currentDate}
              /> */}
              <div>
                <DatePicker
                  selected={selectedDueDate}
                  onChange={handleDueDateChange}
                  dateFormat="MMM dd, yyyy"
                  required
                  customInput={<CustomInput />}
                />
              </div>
            </div>
            <div className="col-sm mb-3">
              <span>
                Invoice Date <span className="text-danger">*</span>
              </span>
              {/* <Form.Control
                type="date"
                name=""
                id=""
                className="form-control custom-form-height"
                required
                onChange={handleDueInvoiceDate}
                value={selectedInvoiceDate}
              /> */}
              <div>
                <DatePicker
                  selected={selectedInvoiceDate}
                  onChange={handleDueInvoiceDate}
                  dateFormat="MMM dd, yyyy"
                  required
                  customInput={<CustomInput />}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              <div className="w-50 me-3">
                <span>
                  Destination <span className="text-danger">*</span>
                </span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select custom-form-height"
                  required
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  value={selectedDestination}
                >
                  <option value="" selected disabled>
                    Select Destination
                  </option>
                  <option value="Local">Local</option>
                  <option value="Overseas">Overseas</option>
                </Form.Select>
              </div>
              <div className="w-50">
                <span>
                  Currency <span className="text-danger">*</span>
                </span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select custom-form-height"
                  required
                  onChange={(e) => handleChangeCurrency(e.target.value)}
                  value={selectedCurrency}
                >
                  <option value="" selected disabled>
                    Select Currency
                  </option>
                  {currencyData.map((data, i) => (
                    <option key={i} value={data.id}>
                      {data.currency_name}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              {selectedCurrency &&
              selectedCurrency != "11111111-1111-1111-1111-111111111111" ? (
                <div className="w-50 me-3">
                  <>
                    <span>
                      Currency Rate<span className="text-danger">*</span>
                    </span>
                    <Form.Control
                      type="text"
                      name=""
                      id=""
                      className="form-control custom-form-height"
                      required
                      onChange={handleCurrencyRateChange}
                      value={currencyRate}
                    />
                  </>
                </div>
              ) : null}
              <div
                className={`${
                  selectedCurrency &&
                  selectedCurrency != "11111111-1111-1111-1111-111111111111"
                    ? "w-50"
                    : "w-100"
                }`}
              >
                <span>
                  Payment Terms <span className="text-danger">*</span>
                </span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height w-100"
                  required
                  onChange={(e) => setInputPaymentTerms(e.target.value)}
                  value={inputPaymentTerms}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              <div className="w-50 me-3">
                <span>Container Number</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => setContainerNumber(e.target.value)}
                  value={containerNumber}
                />
              </div>
              <div className="w-50">
                <span>Pier</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => setPier(e.target.value)}
                  value={pier}
                />
              </div>
            </div>
            {/* <div className="col-sm  mb-3 d-flex flex-row">
              <div className="w-50 me-3">
                <span>Liability Subject 3</span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select custom-form-height"
                  onChange={(e) => {
                    setSelectedSubject3(e.target.value);
                    setIsAmountQtyDisabled(false);
                  }}
                  value={selectedSubject3}
                >
                  <option value="" selected disabled>
                    Select Subject
                  </option>
                  {subject3Data.map((data, i) => (
                    <option key={i} value={data.id}>
                      {data.account_name}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div> */}
          </div>
          <div className="row mx-auto">
            <div className="col-sm">
              <span>Remarks</span>
              <Form.Control
                as="textarea"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                rows={3}
                maxLength={250}
              />
            </div>
            <div className="col-sm  mb-3 d-flex flex-row justify-content-between">
              <div className="w-25">
                <span>Amount</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => {
                    shipmentAmount(e, "amount");
                  }}
                  value={amount}
                  // disabled={isAmountQtyDisabled}
                  required={selectedSubject3}
                />
              </div>
              <span className="align-self-center mx-2">*</span>
              <div className="w-25">
                <span>Quantity</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => {
                    shipmentAmount(e, "qty");
                  }}
                  value={qty}
                  // disabled={isAmountQtyDisabled}
                  required={selectedSubject3}
                />
              </div>
              <span className="align-self-center mx-2">=</span>
              <div className="w-50">
                <span>Shipment Amount</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  // onChange={shipmentAmount}
                  value={
                    isNaN(removeComma(shipmentFee?.toLocaleString("en-US")))
                      ? ""
                      : shipmentFee?.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })
                  }
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
        <div className="container-fluid ">
          <div className="w-100 d-flex align-items-center mt-3 p-2">
            <h5>Item List</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th className="p-2">Product Code</th>
                    <th className="p-2">
                      Product Name<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">Remaining</th>
                    <th className="p-2">SRP</th>
                    <th className="p-2">
                      Unit Price<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">
                      Quantity<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">
                      Moisture<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">
                      Net Weight<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">Discount</th>
                    <th className="p-2">Subtotal</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={item.productCode}
                          readOnly
                        />
                      </td>
                      <td>
                        <Form.Select
                          value={item.productName}
                          onChange={(e) => {
                            const requiredFields = [
                              selectedMethod,
                              selectedDueDate,
                              selectedInvoiceDate,
                              selectedDestination,
                              selectedCurrency,
                              inputPaymentTerms,
                              currencyRate,
                            ];

                            if (requiredFields.some((field) => !field)) {
                              swal({
                                icon: "error",
                                title: "Missing Required Fields",
                                text: "Please fill out the required invoice details above before adding items.",
                              });
                              setValidated(true);
                              return;
                            }
                            handleProductChange(index, e.target.value);
                            setValidated(false);
                          }}
                          required
                        >
                          <option value="" disabled>
                            Select Product
                          </option>
                          {getFilteredProductData(index).map((data) => (
                            <option
                              key={data.product_id}
                              value={data.product_id}
                            >
                              {data.product_name}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={item.remaining.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={item.averagePrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={item.unitPrice}
                          required
                          placeholder="0"
                          onChange={(e) =>
                            handleInputQTY(index, "unitPrice", e.target.value)
                          }
                          disabled={!item.productName}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          className="form-control form-control-sm p-2"
                          placeholder="Input QTY"
                          value={item.quantity}
                          onChange={(e) =>
                            handleInputQTY(index, "quantity", e.target.value)
                          }
                          required
                          disabled={!item.productName}
                        />
                      </td>
                      <td>
                        {/* Form Moist */}
                        <Form.Control
                          type="text"
                          className="form-control form-control-sm p-2"
                          placeholder="Input Moisture"
                          value={item.moisture}
                          onChange={(e) => {
                            handleInputQTY(index, "moisture", e.target.value);
                          }}
                          required
                          disabled={!item.productName}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          className="form-control form-control-sm p-2"
                          placeholder="Net Weight"
                          value={item.netWeight}
                          onChange={(e) =>
                            handleInputQTY(index, "netWeight", e.target.value)
                          }
                          required
                          disabled={!item.productName}
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
                                : "Discount (₱)"
                            }
                            value={item.discount}
                            onChange={(e) =>
                              handleInputQTY(index, "discount", e.target.value)
                            }
                            disabled={!item.productName}
                          />
                          <div className="input-group-prepend">
                            <div
                              className="input-group-text bg-white custom-discount-btn"
                              onClick={() => handleDiscountButton(index)}
                            >
                              {item.discountType === "percentage" ? "%" : "₱"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm p-2"
                          value={item.subtotal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          readOnly
                          placeholder="0.00"
                        />
                      </td>
                      <td className="text-center">
                        {index !== 0 && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeItem(index)}
                            type="button"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
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
        </div>
        <div className="row mx-auto p-2 mt-4 mb-4">
          <div className="col-sm"></div>
          <div className="col-sm border-end">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Quantity</span>
              <span className="text-secondary">
                {totalQuantity.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Moisture</span>
              <span className="text-danger">{totalMoisture}</span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net Weight</span>
              <span className="text-danger">{totalNetWeight}</span>
            </div>
          </div>
          <div className="col-sm">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Quantity Amount</span>
              <span className="text-secondary">
                <span className="text-secondary">
                  {totalWeightedAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Amount of Moisture</span>
              <span className="text-danger">
                <span className="text-danger">
                  {totalMoistureAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net Weight Amount</span>
              <span className="text-danger">
                <span className="text-danger">
                  {totalNetWeightAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Transaction Discount</span>
              <span
                className="text-primary"
                onClick={handleShowTransactionDiscount}
                style={{ cursor: "pointer" }}
              >
                {displayDiscount > 0 ? (
                  <>
                    {modalDiscountType === "percentage"
                      ? `${displayDiscount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}%`
                      : `₱${displayDiscount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                    <span
                      size="sm"
                      className="ms-2"
                      style={{ color: "red", textDecoration: "underline" }}
                      onClick={handleRemoveDiscount}
                    >
                      Remove
                    </span>
                  </>
                ) : (
                  "Add"
                )}
              </span>
            </div>
            {/* <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Shipping</span>
              <span
                className="text-primary"
                onClick={handleShowShippingFee}
                style={{ cursor: "pointer" }}
              >
                {displayShippingFee > 0 ? (
                  <>
                    {displayShippingFee.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <span
                      size="sm"
                      className="ms-2"
                      style={{ color: "red", textDecoration: "underline" }}
                      onClick={handleRemoveShippingFee}
                    >
                      Remove
                    </span>
                  </>
                ) : (
                  "Add"
                )}
              </span>
            </div> */}
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Item Discount</span>
              <span className="text-secondary">
                {totalItemDiscount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Subtotal</span>
              <span className="text-secondary">
                <span className="text-secondary">
                  {(totalNetWeightAmount - totalItemDiscount).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
              <span className="text-white">Total Amount</span>
              <span className="text-white text-underline">
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={CancelInvoice}
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-sm">
                  <button className="btn btn-primary w-100" type="submit">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
      {/* Transaction Discount Modal  */}
      <Modal
        show={transactionDiscountModal}
        onHide={handleCloseTransactionDiscount}
        size="md"
      >
        <Form>
          <Modal.Header closeButton style={{ border: "none" }}>
            <Modal.Title>Discount</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex fs-6">
              <p>
                The discounts will be applied to this transaction automatically
              </p>
            </div>
            <div className="input-group mb-2">
              <Form.Control
                type="text"
                className="form-control-sm p-2"
                id="inlineFormInputGroup"
                value={inputDiscount}
                min={0}
                onChange={handleTransactionDiscount}
                placeholder={
                  modalDiscountType === "percentage"
                    ? "Discount (%)"
                    : "Discount (₱)"
                }
              />
              <div className="input-group-prepend">
                <div
                  className="input-group-text bg-white custom-discount-btn"
                  onClick={handleDiscountIcon}
                >
                  {modalDiscountType === "percentage" ? "%" : "₱"}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ border: "none" }}>
            <Button
              variant="outline-secondary"
              onClick={handleCloseTransactionDiscount}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddDiscount}>
              Add
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Shipping Fee modal  */}
      <Modal show={shippingFeeModal} onHide={handleCloseShippingFee} size="md">
        <Form>
          <Modal.Header closeButton style={{ border: "none" }}>
            <Modal.Title>Shipping Fee</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex fs-6">
              <p>
                Shipping fees are calculated based on the total of your order
                and your location
              </p>
            </div>
            <div className="input-group mb-2">
              <Form.Control
                type="text"
                className="form-control-sm p-2"
                id="inlineFormInputGroup"
                placeholder="Amount 0.00"
                value={inputShippingFee}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value == ".") {
                    setInputShippingFee((prev) => prev + ".");
                  }
                  let inputValue = value.replace(/[^0-9.]/g, "");
                  if (inputValue) {
                    inputValue = inputValue.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    );
                  }

                  const cleanedValue = inputValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma
                  setInputShippingFee(cleanedValue);
                }}
                min={0}
              />
            </div>
          </Modal.Body>
          <Modal.Footer style={{ border: "none" }}>
            <Button
              variant="outline-secondary"
              onClick={handleCloseShippingFee}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddShippingFee}>
              Add
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Create_invoice;
