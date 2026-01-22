import React, { useState, useEffect, useRef } from "react";
import { Form, Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import {
  useNavigate,
  useParams,
  Link,
  useSearchParams,
} from "react-router-dom";
import swal from "sweetalert";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF2 from "./InvoicePDF2";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { PDFViewer } from "@react-pdf/renderer";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { format } from "date-fns";
import { getCurrencySymbol } from "../../../utils/numberFormatter";
import CustomDatePicker from "../../../components/CustomDatePicker";

const UpdateInvoice = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [validated, setValidated] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [customerData, setCustomerData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [cutOffData, setCutOffData] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [subject3Data, setSubject3Data] = useState([]);

  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState("");
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true); // Add this new state

  const [currencyRate, setCurrencyRate] = useState("");
  const [transactionDiscountModal, setTransactionDiscountModal] =
    useState(false);
  const [edit, setEdit] = useState(false);

  const [shippingFeeModal, setShippingFeeModal] = useState(false);
  const [displayDiscount, setDisplayDiscount] = useState(0);
  const [displayShippingFee, setDisplayShippingFee] = useState(0);
  const [inputDiscount, setInputDiscount] = useState("");
  const [inputShippingFee, setInputShippingFee] = useState("");
  const [modalDiscount, setModalDiscount] = useState(true);
  const [modalDiscountType, setModalDiscountType] = useState("");
  const [modalDiscountValue, setModalDiscountValue] = useState("");
  const [editableCurrencyRate, setEditableCurrencyRate] =
    useState(currencyRate);

  const [print, setPrint] = useState(false);

  const handleCloseTransactionDiscount = () =>
    setTransactionDiscountModal(false);
  const handleShowTransactionDiscount = () => setTransactionDiscountModal(true);

  const handleCloseShippingFee = () => setShippingFeeModal(false);
  const handleShowShippingFee = () => setShippingFeeModal(true);

  const [editIndex, setEditIndex] = useState(null);

  const [transactionId, setTransactionId] = useState("");
  const [clientTransactionId, setClientTransactionId] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [inputPaymentTerms, setInputPaymentTerms] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [remarks, setRemarks] = useState("");
  const [drNumber, setDrNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [pier, setPier] = useState("");
  const [selectedSubject3, setSelectedSubject3] = useState("");
  const [shipmentFee, setShipmentFee] = useState("");
  const [inputQuantities, setInputQuantities] = useState({});
  const [items, setItems] = useState([
    {
      productId: "",
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

  const currencySymbol = getCurrencySymbol(currencyData, selectedCurrency);

  const fetchSpecificInvoice = () => {
    axios
      .get(`${BASE_URL}/invoice/getSpecificInvoice`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const {
            data: SalesInvoiceData,
            result: ProductTagInvoice,
            isPosted,
            cutoffExists,
          } = res.data;
          setTransactionId(SalesInvoiceData.transaction_id);
          setClientTransactionId(SalesInvoiceData.client_transaction_id);
          setSelectedWarehouse(SalesInvoiceData.warehouse_id);
          setSelectedCustomer({
            value: SalesInvoiceData.customer_id,
            label:
              // SalesInvoiceData.customer.type === "company"
              //   ? SalesInvoiceData.customer.company_name
              //   : `${SalesInvoiceData.customer.first_name} ${SalesInvoiceData.customer.last_name}`,

              SalesInvoiceData.customer.company_name
                ? SalesInvoiceData.customer.company_name
                : `${SalesInvoiceData.customer.first_name} ${SalesInvoiceData.customer.last_name}`,
          });
          setSelectedMethod(SalesInvoiceData.payment_method);
          setSelectedDueDate(SalesInvoiceData.due_date);
          setSelectedInvoiceDate(SalesInvoiceData.invoice_date);
          setInputPaymentTerms(SalesInvoiceData.payment_terms);
          setRemarks(SalesInvoiceData.remarks);
          setDrNumber(SalesInvoiceData.dr_number);
          setPoNumber(SalesInvoiceData.po_number);
          setContainerNumber(SalesInvoiceData.container_number);
          setPier(SalesInvoiceData.pier);
          setSelectedDestination(SalesInvoiceData.destination);
          setSelectedCurrency(SalesInvoiceData.currency_id);
          setTotalAmount(SalesInvoiceData.total_amount);
          // Store the initial total amount for reference
          totalAmountUseRef.current = SalesInvoiceData.total_amount;
          setTotalItemDiscount(SalesInvoiceData.item_discount);
          setDisplayShippingFee(SalesInvoiceData.shipping_fee);
          setDisplayDiscount(SalesInvoiceData.transaction_discount);
          // setInputDiscount(SalesInvoiceData.transaction_discount);
          setInvoiceStatus(SalesInvoiceData.status);
          setModalDiscountType(SalesInvoiceData.discount_type);
          setIsCutoffPosted(isPosted);
          setIsCutoffExists(cutoffExists);
          setCurrencyRate(SalesInvoiceData.rate);
          setSelectedSubject3(SalesInvoiceData.account_list_sub3_id);
          setShipmentFee(SalesInvoiceData.liability_amount);
          setAmount(SalesInvoiceData.amount);
          setQty(SalesInvoiceData.quantity);
          setCurrencyRate(SalesInvoiceData.rate);
          setEditableCurrencyRate(SalesInvoiceData.rate);

          const transformedItems = ProductTagInvoice.map((item) => ({
            stock_management_id: item.stock_management_id,
            productId: item.product_id,
            productCode: item.product_code,
            productName: { value: item.product_id, label: item.product_name },
            // item.product_id.toString(),
            remaining: item.remaining,
            averagePrice: item.average_price,
            unitPrice: item.unit_price,
            quantity: item.quantity,
            moisture: item.moisture,
            netWeight: item.net_weight,
            discount: item.discount_item,
            subtotal: item.subtotal,
            discountType: item.discount_type,
            sales_profit: item.sales_profit,
          }));

          console.log(transformedItems);

          setItems(transformedItems);
          const initialQuantities = {};
          transformedItems.forEach((item, index) => {
            initialQuantities[index] = item.quantity;
          });
          setInputQuantities(initialQuantities);

          if (SalesInvoiceData.discount_type === "percentage") {
            const subtotalSum = transformedItems.reduce((total, value) => {
              return total + value.subtotal;
            }, 0);
            const newDiscount =
              (SalesInvoiceData.transaction_discount / 100) * subtotalSum;
            discountAmountPhp.current = newDiscount;
          } else {
            discountAmountPhp.current = SalesInvoiceData.transaction_discount;
          }
          // if (edit) {
          calculateTotals(transformedItems, true);
          // }
        }
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

  console.log(productData);

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
    fetchCustomerCurrency();
    fetchWarehouse();
    fetchCutOff();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchDataProduct(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedCurrency) {
      fetchLiabilitySub3();
    }
  }, [selectedCurrency]);

  useEffect(() => {
    fetchSpecificInvoice();
  }, [id]);

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

  const isProductSelected = (productId, items, currentIndex) => {
    return items.some(
      (item, index) =>
        index !== currentIndex && item.productName === productId.toString()
    );
  };

  // const getFilteredProductData = (index) => {
  //   const selectedProductIds = items
  //     .map((item) => item.productName?.value)
  //     .filter((id) => id);
  //   return productData.filter(
  //     (product) =>
  //       !selectedProductIds.includes(product.product_id.toString()) ||
  //       items[index].productName === product.product_id.toString()
  //   );
  // };

  const getFilteredProductData = (index) => {
    return productData;
  };

  const handleProductChange = (index, selectedOption, items, setItems) => {
    const selectedProduct = productData.find(
      (product) => product.product_id.toString() === selectedOption?.value
    );

    if (selectedProduct) {
      const updatedItems = [...items];

      updatedItems[index] = {
        ...updatedItems[index],
        productCode: selectedProduct.product_code,
        productName: selectedOption,
        remaining: selectedProduct.total_stock,
        averagePrice: selectedProduct.average_price,
        unitPrice: selectedProduct.unit_price || "",
        stockDetails: selectedProduct.stock_details,
        moisture: 0,
        netWeight: 0,
        subtotal: 0,
      };

      setInputQuantities((prev) => ({
        ...prev,
        [index]: 0,
      }));

      setItems(updatedItems);
    } else {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        productName: "",
      };
      setItems(updatedItems);
    }

    if (selectedProduct.total_stock === 0) {
      swal({
        icon: "warning",
        title: "Out of Stock",
        text: "The remaining quantity of this product is zero.",
      });
    }
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

  const handleInputQTY = (index, field, value) => {
    // if (value == ".") {
    //   setInputQuantities((prev) => ({
    //     ...prev,
    //     [index]: prev[index] + ".",
    //   }));
    // }

    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    const updatedItems = [...items];

    if (field === "quantity") {
      setInputQuantities((prev) => ({
        ...prev,
        [index]:
          value.length > 1 && !value.includes(".")
            ? cleanedValue
            : formattedValue,
      }));

      const originalQuantity = parseFloat(updatedItems[index].quantity) || 0;
      const remainingQuantity = parseFloat(updatedItems[index].remaining) || 0;
      const inputQuantity =
        parseFloat(String(formattedValue).replace(/,/g, "")) || 0;

      if (inputQuantity > originalQuantity + remainingQuantity) {
        swal(
          "Insufficient stock!",
          "The requested quantity exceeds available stock.",
          "error"
        );
        setInputQuantities((prev) => ({
          ...prev,
          [index]: 0,
        }));
        return;
      } else {
        updatedItems[index].quantity = inputQuantity;
      }
    } else {
      updatedItems[index][field] =
        value.length > 1 && !value.includes(".")
          ? cleanedValue
          : formattedValue;
    }

    const quantity =
      parseFloat(String(updatedItems[index].quantity).replace(/,/g, "")) || 0;
    let moisture =
      parseFloat(String(updatedItems[index].moisture).replace(/,/g, "")) || 0;
    const unitPrice =
      parseFloat(String(updatedItems[index].unitPrice).replace(/,/g, "")) || 0;
    let netWeight =
      parseFloat(String(updatedItems[index].netWeight).replace(/,/g, "")) || 0;

    if (field === "moisture") {
      // Validation for not exceeding 100%
      if (
        parseFloat(String(updatedItems[index].moisture).replace(/,/g, "")) > 100
      ) {
        swal({
          icon: "error",
          title: "Invalid Moisture",
          text: "Moisture cannot exceed 100%.",
        });
        updatedItems[index].moisture = "0";
        moisture = 0;
      }
    }

    if (field !== "netWeight") {
      netWeight = quantity * (1 - moisture / 100);
      const [integer, decimal] = String(netWeight).split(".");
      updatedItems[index].netWeight =
        integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        (decimal ? "." + decimal : "");
    }

    // Allow zero unit price - calculate subtotal normally
    let subtotal = netWeight * unitPrice; // This will be 0 if unitPrice is 0, which is now allowed

    let discount =
      parseFloat(String(updatedItems[index].discount).replace(/,/g, "")) || 0;

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
        // Don't allow discount to exceed subtotal
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

    // Calculate effective discount
    let effectiveDiscount = 0;
    if (updatedItems[index].discountType === "percentage") {
      effectiveDiscount = (discount / 100) * subtotal;
    } else {
      effectiveDiscount = discount;
    }

    updatedItems[index].subtotal = Math.max(0, subtotal - effectiveDiscount);

    setItems(updatedItems);

    // Always calculate new totals when items change
    // Pass false to ensure we update the total amount
    calculateTotals(updatedItems, false);
  };

  const calculateTotals = (items, isInitialLoad = false) => {
    let totalDiscount = 0;
    let totalAmount = 0;
    let totalQty = 0;
    let totalMoist = 0;
    let totalNetW = 0;
    let totalWeightedAmt = 0;
    let totalMoistureAmt = 0;
    let totalNetWeightAmt = 0;

    items.forEach((item) => {
      const quantity = parseFloat(String(item.quantity).replace(/,/g, "")) || 0;
      const unitPrice =
        parseFloat(String(item.unitPrice).replace(/,/g, "")) || 0;
      const moisture = parseFloat(String(item.moisture).replace(/,/g, "")) || 0;
      const netWeight =
        parseFloat(String(item.netWeight).replace(/,/g, "")) || 0;
      let discount = parseFloat(String(item.discount).replace(/,/g, "")) || 0;

      let subtotal = netWeight * unitPrice;

      if (item.discountType === "percentage") {
        discount = (discount / 100) * subtotal;
      }

      if (!isNaN(discount)) {
        if (discount > subtotal) {
          discount = 0;
        }
        subtotal -= discount;
      }

      // Add to totals
      totalDiscount += discount;
      totalAmount += parseFloat(item.subtotal);
      totalQty += quantity;
      totalMoist += quantity * (moisture / 100);
      totalNetW += netWeight;

      // Calculate weighted amounts
      totalWeightedAmt += quantity * unitPrice;
      totalMoistureAmt += ((quantity * moisture) / 100) * unitPrice;
      totalNetWeightAmt += netWeight * unitPrice;
    });

    setTotalItemDiscount(totalDiscount);
    setTotalQuantity(totalQty);
    setTotalMoisture(totalMoist);
    setTotalNetWeight(totalNetW);
    setTotalWeightedAmount(totalWeightedAmt);
    setTotalMoistureAmount(totalMoistureAmt);
    setTotalNetWeightAmount(totalNetWeightAmt);

    // Calculate the subtotal before transaction discount
    const subtotalBeforeTransactionDiscount = totalNetWeightAmt - totalDiscount;

    // Store the subtotal for reference
    totalAmountUseRef.current = subtotalBeforeTransactionDiscount;

    // Skip updating the total amount if this is the initial load
    // This ensures we keep the database value initially
    if (!isInitialLoad) {
      // Apply transaction discount if any
      if (displayDiscount > 0) {
        let transactionDiscountValue = 0;
        if (modalDiscountType === "percentage") {
          transactionDiscountValue = parseFloat(
            (displayDiscount / 100) * subtotalBeforeTransactionDiscount
          );
        } else {
          transactionDiscountValue = parseFloat(displayDiscount);
        }
        discountAmountPhp.current = parseFloat(
          transactionDiscountValue.toFixed(2)
        );
        setTotalAmount(
          subtotalBeforeTransactionDiscount - transactionDiscountValue
        );
      } else {
        setTotalAmount(subtotalBeforeTransactionDiscount);
      }
    }
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

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  //for modal section
  const handleDiscountIcon = () => {
    setModalDiscount(!modalDiscount);
    setModalDiscountType(!modalDiscount ? "percentage" : "fixed");
  };

  const handleAddDiscount = () => {
    const discountValue = inputDiscount.replace(/,/g, ""); // Remove commas
    const discount = parseFloat(discountValue) || 0; // Convert to number
    const discountType = modalDiscountType;
    const currentTotalAmount = totalAmountUseRef.current;

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
    setDisplayShippingFee(inputShippingFee.replace(/,/g, ""));
    setShippingFeeModal(false);
  };

  const handleRemoveDiscount = (e) => {
    const discountValue = parseFloat(displayDiscount) || 0;
    const discountType = modalDiscountType;

    let discountAmount = 0;
    if (discountType === "percentage") {
      // discountAmount = (discountValue / 100) * totalAmount;
      discountAmount = discountAmountPhp.current || 0;
    } else {
      discountAmount = discountValue;
    }

    const newTotalAmount = parseFloat(totalAmount) + discountAmount;
    setTotalAmount(newTotalAmount);
    setDisplayDiscount(0);
    e.stopPropagation();
  };

  const handleRemoveShippingFee = (e) => {
    const shippingFeeValue = parseFloat(displayShippingFee) || 0;
    const newTotalAmount = parseFloat(totalAmount) - shippingFeeValue;
    setTotalAmount(newTotalAmount);
    setDisplayShippingFee(0);
    e.stopPropagation();
  };

  const validateDueDateGreaterThanInvoiceDate = (dueDate, invoiceDate) => {
    if (!dueDate || !invoiceDate) return true;

    const due = new Date(dueDate);
    const invoice = new Date(invoiceDate);

    if (due <= invoice) {
      swal({
        icon: "error",
        title: "Invalid Due Date",
        text: "Due Date must be greater than Invoice Date",
      }).then(() => {
        setSelectedDueDate("");
      });
      return false;
    }
    return true;
  };

  const handleDueDateChange = (date) => {
    if (validateDueDateGreaterThanInvoiceDate(date, selectedInvoiceDate)) {
      setSelectedDueDate(date);
    }

    // const dueDate = date;
    // setSelectedDueDate(dueDate);
    // if (dueDate) {
    //   dateValidation(e.target.value, setSelectedDueDate);
    // }

    // // Check if the dueDate is within any cutoff range
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
      dateValidation(date, setSelectedInvoiceDate, "Invoice Date");
    }

    // Check if the invoice date is within any cutoff range
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

  const updateInvoice = async (e) => {
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
      // Check if there are any valid items (products with quantity > 0)
      const validItems = items.filter(
        (item) =>
          item.productName &&
          item.productName.value &&
          item.quantity &&
          !isNaN(parseFloat(item.quantity)) &&
          parseFloat(item.quantity) > 0
      );

      // Validation for no valid items
      if (validItems.length === 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "center-swal-text";
        wrapper.innerHTML =
          "Please add at least one item with a quantity greater than zero.";
        swal({
          icon: "error",
          title: "No Valid Items",
          content: wrapper,
        });
        return;
      }

      // Check if all items have zero unit price (which would result in zero total)
      const hasNonZeroUnitPrice = validItems.some((item) => {
        const unitPrice =
          parseFloat(String(item.unitPrice).replace(/,/g, "")) || 0;
        return unitPrice > 0;
      });

      // Only validate total amount > 0 if there are items with non-zero unit prices
      if (hasNonZeroUnitPrice && totalAmount <= 0) {
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

      // Validation for negative Total Amount
      if (totalAmount < 0) {
        swal({
          icon: "error",
          title: "Invalid Total Amount",
          text: "The Total Amount cannot be less than 0",
        });
        return;
      }

      swal({
        title: "Update this invoice?",
        text: "Please confirm to update this invoice",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          // Before preparing the payload, update the item quantities from inputQuantities
          const updatedItems = items.map((item, index) => ({
            ...item,
            quantity: inputQuantities[index] || item.quantity,
          }));

          const itemsToSend = updatedItems
            .filter(
              (item) =>
                item.productName &&
                item.productName.value &&
                item.quantity &&
                !isNaN(parseFloat(item.quantity)) &&
                parseFloat(item.quantity) > 0
            )
            .map((item) => ({
              stock_management_id:
                item.stock_management_id ||
                item.stockDetails?.[0]?.stock_management_id ||
                "",
              product_id: item.productName?.value,
              quantity:
                parseFloat(String(item.quantity).replace(/,/g, "")) || 0,
              moisture:
                parseFloat(String(item.moisture).replace(/,/g, "")) || 0,
              netWeight:
                parseFloat(String(item.netWeight).replace(/,/g, "")) || 0,
              unitPrice:
                parseFloat(String(item.unitPrice).replace(/,/g, "")) || 0,
              discount:
                parseFloat(String(item.discount).replace(/,/g, "")) || 0,
              discountType: item.discountType || "percentage",
              subtotal: item.subtotal || 0,
              averagePrice: item.averagePrice || 0,
              salesProfit: item.sales_profit || 0,
            }));

          const payload = {
            items: itemsToSend,
          };

          console.log(itemsToSend);
          const shipAmountFormat =
            parseFloat(String(shipmentFee).replace(/,/g, "")) || 0;
          axios
            .post(`${BASE_URL}/invoice/update`, {
              transactionId,
              clientTransactionId,
              selectedCustomer: selectedCustomer?.value,
              selectedCurrency,
              selectedMethod,
              selectedDueDate,
              selectedInvoiceDate,
              inputPaymentTerms,
              remarks,
              drNumber,
              poNumber,
              containerNumber,
              pier,
              selectedDestination,
              totalAmount,
              transactionDiscount: displayDiscount,
              transactionDiscountType: modalDiscountType,
              shippingFee: displayShippingFee,
              totalItemDiscount,
              payload,
              currencyRate: editableCurrencyRate,
              id,
              userLoggedID,
              selectedSubject3,
              shipAmountFormat,
              amount,
              qty,
            })
            .then((res) => {
              console.log("API Response:", res); // <-- Log response
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Invoice updated successfully",
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
              //     text: "Cutoff already posted for this date",
              //     icon: "warning",
              //     buttons: false,
              //     timer: 2000,
              //     dangerMode: true,
              //   });
              // }
              else if (res.status === 203) {
                swal({
                  title: "Insufficient Stock",
                  text: res.data.message, // Show actual message
                  icon: "warning",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text:
                    res.data.message ||
                    "Please contact your support immediately",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                });
              }
            })
            .catch((err) => {
              console.error("API Error:", err); // <-- Log error

              if (err.response && err.response.status === 409) {
                swal({
                  icon: "error",
                  title: "Transaction ID Conflict",
                  text: "The transaction ID you entered already exists in the system. Please use a unique identifier.",
                });
                return;
              }

              swal({
                title: "Something Went Wrong",
                text: "Server error, please contact support",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              });
            });
        }
      });
    }
    setValidated(true);
  };

  const invoiceApproveReject = async (e, action) => {
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
      // Determine the actual status based on total amount
      let actualStatus;
      if (action === "approve") {
        // If total amount is 0, set status to "Paid", otherwise "Approved"
        actualStatus = totalAmount === 0 ? "Paid" : "Approved";
      } else {
        actualStatus = "Rejected";
      }

      const message =
        action === "approve"
          ? totalAmount === 0
            ? "Mark this invoice as Paid?"
            : "Approve this invoice?"
          : "Reject this invoice?";

      swal({
        title: message,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        // prettier-ignore
        // For sales journal
        const {currency, totalQuantity, averageUnitPrice} = (() => {
        const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""))
        const currency = currencyData.find((c) => c.id === selectedCurrency);
        const totalQuantity = items.reduce((acc, value) => acc + parseNumber(value.netWeight), 0)
        const totalUnitPrice = items.reduce((acc, value) => acc + parseNumber(value.unitPrice), 0)
        const averageUnitPrice = totalUnitPrice / items?.length

        return {currency, totalQuantity, averageUnitPrice}
      })()

        if (confirmed) {
          axios
            .post(`${BASE_URL}/invoice/approveRejectInvoice`, {
              id,
              status: actualStatus, // Use the determined status
              selectedInvoiceDate,
              selectedWarehouse,
              userLoggedID,
              shipmentFee,
              items,
              transactionId,
              salesJournal: {
                customerId: selectedCustomer?.value,
                date: selectedInvoiceDate,
                totalAmount,
                totalQuantity,
                averageUnitPrice,
                paymentType: "Debit",
                currencyName: currency.currency_name,
                currencyRate: currency.currency_rate,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                const successMessage =
                  actualStatus === "Paid"
                    ? "Sales invoice has been marked as paid"
                    : actualStatus === "Approved"
                    ? "Sales invoice has been approved"
                    : "Sales invoice has been rejected";

                swal({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  fetchSpecificInvoice();
                });
              } else if (res.status === 202) {
                const { invoiceDate, CutoffName, status } = res.data;
                let invoiceStatus;
                if (status == "Approved" || status == "Paid") {
                  invoiceStatus = "Approval";
                } else {
                  invoiceStatus = "Rejection";
                }
                swal({
                  title: `${invoiceStatus} Declined`,
                  text: `Invoice cannot be ${status} as its invoice date (${invoiceDate}) falls within the posted cutoff period named "${CutoffName}".`,
                  icon: "warning",
                  button: "OK",
                });
              }
            })
            .catch((error) => {
              if (error.response) {
                if (error.response.status === 400) {
                  swal({
                    icon: "error",
                    title: "Approval/Reject Failed",
                    text:
                      error.response.data.message || "Please check your input.",
                  });
                } else {
                  swal({
                    icon: "error",
                    title: "Something Went Wrong",
                    text: "Please contact your support immediately.",
                  });
                }
              } else {
                console.error("Error", error.message);
                swal({
                  icon: "error",
                  title: "Network Error",
                  text: "Please check your internet connection.",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const isTableDisabled =
    invoiceStatus === "Approved" || invoiceStatus === "Rejected";

  const dateValidation = async (selectedDate, clearField, dateLabel) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      // if (res.data == false) {
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
      //     clearField("");
      //   });
      // }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeCurrency = (value) => {
    const curr = currencyData.find((data) => String(data.id) === String(value));
    setSelectedCurrency(curr.id);
    if (!edit) {
      setCurrencyRate(curr.currency_rate);
      setEditableCurrencyRate(curr.currency_rate);
    }
  };

  const openPDFPreview = () => {
    // window.open(`/invoice-pdf-view?id=${id}`, "_blank");
    setPrint(true);
  };

  // Customer options for dropdown select
  const customerOptions = customerData.map((data) => ({
    value: data.customer_id,
    label:
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`
        : data.company_name,
    // data.type === "company"
    //   ? data.company_name
    //   : `${data.first_name} ${data.last_name}`,
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
    ({ value, onClick, generateYears, isRequired }, ref) => (
      <input
        type="text"
        className="form-control custom-form-height w-100"
        style={{ cursor: "pointer", caretColor: "transparent" }}
        onClick={() => {
          onClick();

          const date = new Date(value).getFullYear();

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        required={isRequired}
        placeholder="Select Date"
        disabled={isTableDisabled || !edit}
      />
    )
  );

  // For Item list input select width
  const selectProductWidth = Math.max(
    ...items.map((item) => item.productName.label?.length || 0)
  );

  const getPriceIndicator = (unitPrice, averagePrice) => {
    if (!unitPrice || !averagePrice) return null;

    const unitPriceNum = parseFloat(String(unitPrice).replace(/,/g, "")) || 0;
    const avgPriceNum = parseFloat(String(averagePrice).replace(/,/g, "")) || 0;

    if (unitPriceNum === avgPriceNum) {
      return { label: "Same Price", color: "text-success", srp: avgPriceNum };
    } else if (unitPriceNum > avgPriceNum) {
      return {
        label: "Above SRP",
        color: "text-danger",
        srp: avgPriceNum,
        symbol: currencySymbol,
      };
    } else {
      return {
        label: "Below SRP",
        color: "text-info",
        srp: avgPriceNum,
        symbol: currencySymbol,
      };
    }
  };

  // useEffect to sync the currency rate when it changes
  useEffect(() => {
    if (currencyRate !== undefined && currencyRate !== null) {
      setEditableCurrencyRate(currencyRate);
    }
  }, [currencyRate]);

  // function to handle currency rate changes
  const handleEditableCurrencyRateChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setEditableCurrencyRate(formattedValue);
    setCurrencyRate(formattedValue);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form noValidate validated={validated} onSubmit={updateInvoice}>
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">
              <button
                type="button"
                className="border-0 bg-transparent d-inline-block"
                onClick={() => {
                  if (edit) {
                    swal({
                      icon: "warning",
                      title: "Discard Unsaved Changes?",
                      text: "Going back now will remove any changes you've made.",
                      buttons: true,
                      dangerMode: true,
                    }).then((confirm) => {
                      if (confirm) navigate("/sales/invoices");
                    });
                    return;
                  }
                  navigate("/sales/invoices");
                }}
              >
                <i className="fa-solid fa-arrow-left text-dark"></i>
              </button>
              SALES INVOICE OVERVIEW
            </span>
            <p className="fs-6">
              Status:{" "}
              <span
                style={{
                  color:
                    invoiceStatus === "Approved" || invoiceStatus === "Paid"
                      ? "green"
                      : invoiceStatus === "Pending"
                      ? "orange"
                      : "red",
                  textTransform: "uppercase",
                }}
              >
                {invoiceStatus}
              </span>
            </p>
          </div>
          {/* <button
            className="btn btn-outline-danger h-100 px-5 p-2"
            type="button"
            id="exportInvoice"
            value={{ id }}
            onClick={() => console.log("Export button clicked, id:", id)}
            style={{
              display: invoiceStatus === "Approved" ? "" : "none",
            }}
          >
            Export as PDF
          </button> */}
          <div className="d-flex gap-2">
            {(invoiceStatus === "Approved" || invoiceStatus === "Collected") &&
              authrztn.includes("Invoices-Print") && (
                <div>
                  <button
                    className="btn btn-outline-danger"
                    type="button"
                    onClick={openPDFPreview}
                  >
                    Preview PDF
                  </button>
                </div>
              )}
          </div>
        </div>
        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="d-none col-sm mb-3">
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
            <div className="col-sm mb-3">
              <span>Transaction ID</span> <span className="text-danger">*</span>
              <Form.Control
                type="text"
                name=""
                id=""
                className="form-control custom-form-height"
                value={clientTransactionId}
                onChange={(e) => setClientTransactionId(e.target.value)}
                disabled={isTableDisabled || !edit}
                required
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
                disabled={isTableDisabled || !edit}
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
              <span>Customer</span>
              {/* <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedCustomer(e.target.value)}
                value={selectedCustomer}
                disabled={isTableDisabled || !edit}
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {customerData.map((data, i) => (
                  <option key={i} value={data.customer_id}>
                    {`${data.first_name} ${data.last_name}`}
                  </option>
                ))}
              </Form.Select> */}
              <Select
                options={customerOptions}
                value={selectedCustomer}
                onChange={(selectedOption) => {
                  const findCustomerDestination = customerData.find(
                    (item) => item.customer_id === selectedOption?.value
                  ).destination;
                  setSelectedCustomer(selectedOption);
                  setSelectedDestination(findCustomerDestination);
                }}
                placeholder={`Select Customer`}
                styles={selectCustomStyles(
                  selectedCustomer,
                  validated,
                  "0.3rem"
                )}
                isDisabled={isTableDisabled || !edit}
                required
                isSearchable
              />
            </div>
            <div className="col-sm mb-3">
              <span>Payment Method</span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedMethod(e.target.value)}
                value={selectedMethod}
                disabled={isTableDisabled || !edit}
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
            {" "}
            <div className="col-sm mb-3">
              <span>Invoice Date</span>
              {/* <Form.Control
                type="date"
                name=""
                id=""
                className="form-control custom-form-height"
                required
                onChange={handleDueInvoiceDate}
                value={selectedInvoiceDate}
                disabled={isTableDisabled || !edit}
              /> */}
              <CustomDatePicker
                label={"Invoice Date"}
                selected={
                  selectedInvoiceDate ? new Date(selectedInvoiceDate) : ""
                }
                handleDateChange={handleDueInvoiceDate}
                setter={setSelectedInvoiceDate}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1rem"}
              />
            </div>
            <div className="col-sm mb-3">
              <span>Due Date</span>
              {/* <Form.Control
                type="date"
                name=""
                id=""
                className="form-control custom-form-height"
                required
                onChange={handleDueDateChange}
                value={selectedDueDate}
                // min={currentDate}
                disabled={isTableDisabled || !edit}
              /> */}
              <CustomDatePicker
                label={"Due Date"}
                selected={selectedDueDate ? new Date(selectedDueDate) : ""}
                handleDateChange={handleDueDateChange}
                setter={setSelectedDueDate}
                CustomInput={CustomInput}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1rem"}
              />
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
                  disabled={isTableDisabled || !edit}
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
                  disabled={isTableDisabled || !edit}
                >
                  <option value="" selected disabled>
                    Select Currency
                  </option>
                  {currencyData.map((data, i) => (
                    <option key={i} value={data.id}>
                      {data.currency_name} - {currencyList[data.currency_name]}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              {selectedCurrency &&
              selectedCurrency != "11111111-1111-1111-1111-111111111111" ? (
                <div className="w-50 me-3 d-none">
                  <>
                    <span>
                      Currency Rate<span className="text-danger">*</span>
                    </span>
                    {edit ? (
                      <Form.Control
                        type="text"
                        name=""
                        id=""
                        className="form-control custom-form-height"
                        required
                        onChange={handleEditableCurrencyRateChange}
                        value={editableCurrencyRate}
                        disabled={isTableDisabled}
                        readOnly
                      />
                    ) : (
                      <Form.Control
                        type="text"
                        name=""
                        id=""
                        className="form-control custom-form-height"
                        value={parseFloat(currencyRate || 1).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }
                        )}
                        readOnly
                      />
                    )}
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
                <span>Payment Terms</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  // required
                  onChange={(e) => setInputPaymentTerms(e.target.value)}
                  value={inputPaymentTerms}
                  disabled={isTableDisabled || !edit}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
              <div className="w-50 me-3">
                <span>DR Number</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => setDrNumber(e.target.value)}
                  value={drNumber}
                  disabled={isTableDisabled || !edit}
                />
              </div>
              <div className="w-50">
                <span>PO Number</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={(e) => setPoNumber(e.target.value)}
                  value={poNumber}
                  disabled={isTableDisabled || !edit}
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
                  disabled={isTableDisabled || !edit}
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
                  disabled={isTableDisabled || !edit}
                />
              </div>
            </div>
            {/* <div className="col-sm  mb-3 d-flex flex-row justify-content-between">
              <div className="w-50">
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
                  disabled={isTableDisabled || !edit}
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
            <div className="col-sm mb-3">
              <span>Remarks</span>
              <Form.Control
                as="textarea"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                rows={3}
                maxLength={250}
                disabled={isTableDisabled || !edit}
              />
            </div>
            <div className="col-sm mb-3 d-flex flex-row justify-content-between">
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
                  disabled={isTableDisabled || !edit}
                  // readOnly={!selectedSubject3 && isAmountQtyDisabled}
                  required={selectedSubject3}
                />
              </div>
              <span className="align-self-center mb-2 mx-2">*</span>
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
                  disabled={isTableDisabled || !edit}
                  // readOnly={!selectedSubject3 && isAmountQtyDisabled}
                  required={selectedSubject3}
                />
              </div>
              <span className="align-self-center mb-2 mx-2">=</span>
              <div className="w-50">
                <span>Shipment Amount</span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  onChange={shipmentAmount}
                  value={
                    isNaN(removeComma(shipmentFee?.toLocaleString("en-US")))
                      ? ""
                      : shipmentFee?.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })
                  }
                  disabled={isTableDisabled || !edit}
                  readOnly={true}
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
              <table className="table table-bordered table-hover item-list-table">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-2 text-nowrap">Product Code</th>
                    <th className="px-4 py-2 text-nowrap">Product Name</th>
                    <th className="px-4 py-2 text-nowrap">Remaining</th>
                    <th className="px-4 py-2 text-nowrap">SRP</th>
                    <th className="px-4 py-2 text-nowrap">Unit Price</th>
                    <th className="px-4 py-2 text-nowrap">Qty</th>
                    <th className="px-4 py-2 text-nowrap">Moisture</th>
                    <th className="px-4 py-2 text-nowrap">Net Qty</th>
                    <th className="px-4 py-2 text-nowrap">Discount</th>
                    <th className="px-4 py-2 text-nowrap">Subtotal</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const priceIndicator = getPriceIndicator(
                      item.unitPrice,
                      item.averagePrice
                    );

                    return (
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
                          {/* <Form.Select
                          value={item.productName}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              e.target.value,
                              items,
                              setItems
                            )
                          }
                          required
                          disabled={isTableDisabled || !edit}
                        >
                          <option value="" disabled>
                            Select Product
                          </option>
                          {getFilteredProductData(
                            index,
                            items,
                            productData
                          ).map((data) => (
                            <option
                              key={data.product_id}
                              value={data.product_id}
                              disabled={data.stock <= 0}
                            >
                              {data.product_name}
                              {data.stock <= 0 ? " (Out of Stock)" : ""}
                            </option>
                          ))}
                        </Form.Select> */}
                          <Select
                            options={getFilteredProductData(index).map(
                              (data) => ({
                                value: data.product_id,
                                label: `${data.product_name}${
                                  data.stock <= 0 ? " (Out of Stock)" : ""
                                }`,
                                isDisabled: data.stock <= 0,
                              })
                            )}
                            classNamePrefix="item-list-table-select"
                            value={item.productName}
                            onChange={(selectedOption) =>
                              handleProductChange(
                                index,
                                selectedOption,
                                items,
                                setItems
                              )
                            }
                            placeholder={`Select Product`}
                            styles={selectCustomStyles(
                              item.productName,
                              validated,
                              "0",
                              selectProductWidth
                            )}
                            isDisabled={isTableDisabled || !edit}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            required
                            isSearchable
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm p-2"
                            value={item?.remaining?.toLocaleString("en-US", {
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
                            value={item?.averagePrice?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            readOnly
                          />
                        </td>
                        <td>
                          <div className="unit-price-wrapper">
                            <input
                              type="text"
                              className="form-control form-control-sm p-2"
                              value={item?.unitPrice?.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              placeholder="0"
                              onChange={(e) =>
                                handleInputQTY(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              disabled={isTableDisabled || !edit}
                            />
                            {priceIndicator && (
                              <small
                                className={`price-indicator ${priceIndicator.color}`}
                              >
                                {priceIndicator.label} ({priceIndicator.symbol}
                                {priceIndicator.srp.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                )
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            className="form-control form-control-sm p-2"
                            placeholder="Input QTY"
                            value={inputQuantities[index] || ""}
                            onChange={(e) =>
                              handleInputQTY(index, "quantity", e.target.value)
                            }
                            required
                            disabled={isTableDisabled || !edit}
                          />
                        </td>
                        <td>
                          <div className="input-group">
                            <Form.Control
                              type="text"
                              className="form-control form-control-sm p-2"
                              placeholder="Input Moisture"
                              value={item.moisture}
                              onChange={(e) =>
                                handleInputQTY(
                                  index,
                                  "moisture",
                                  e.target.value
                                )
                              }
                              required
                              disabled={isTableDisabled || !edit}
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            className="form-control form-control-sm p-2"
                            placeholder="Input Net Qty"
                            value={item.netWeight}
                            onChange={(e) =>
                              handleInputQTY(index, "netWeight", e.target.value)
                            }
                            required
                            disabled={isTableDisabled || !edit}
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
                                  : `Discount (${currencySymbol})`
                              }
                              value={item.discount}
                              onChange={(e) =>
                                handleInputQTY(
                                  index,
                                  "discount",
                                  e.target.value
                                )
                              }
                              disabled={isTableDisabled || !edit}
                            />
                            <div className="input-group-prepend">
                              <button
                                className="input-group-text bg-white custom-discount-btn"
                                type="button"
                                onClick={() => handleDiscountButton(index)}
                                disabled={isTableDisabled || !edit}
                              >
                                {item.discountType === "percentage"
                                  ? "%"
                                  : currencySymbol}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm p-2"
                            value={item?.subtotal?.toLocaleString("en-US", {
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
                              disabled={isTableDisabled || !edit}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-100 d-flex justify-content-end mt-2">
            {invoiceStatus === "Pending" && (
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={addNewItem}
                disabled={isTableDisabled || !edit}
              >
                New Item
              </button>
            )}
          </div>
        </div>

        <div className="row mx-auto p-2 mt-4 mb-4">
          <div className="col-sm"></div>
          <div className="col-sm border-end">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total (QTY)</span>
              <span className="text-secondary">
                {totalQuantity?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Moisture (QTY)</span>
              <span className="text-danger">{totalMoisture}</span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net (QTY)</span>
              <span className="text-danger">
                {totalNetWeight.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="col-sm">
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total (Amount)</span>
              <span className="text-secondary">
                <span className="text-secondary">
                  {currencySymbol}
                  {totalWeightedAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Moisture (Amount)</span>
              <span className="text-danger">
                <span className="text-danger">
                  {currencySymbol}
                  {totalMoistureAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Net (Amount)</span>
              <span className="text-danger">
                <span className="text-danger">
                  {currencySymbol}
                  {totalNetWeightAmount?.toLocaleString("en-US", {
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
                onClick={
                  !isTableDisabled && edit
                    ? handleShowTransactionDiscount
                    : undefined
                }
                style={{
                  cursor: !isTableDisabled && edit ? "pointer" : "not-allowed",
                  color: !isTableDisabled && edit ? "blue" : "gray",
                }}
              >
                {displayDiscount > 0 ? (
                  <>
                    {modalDiscountType === "percentage"
                      ? `${displayDiscount?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}%`
                      : `${currencySymbol}${displayDiscount?.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`}
                    <span
                      size="sm"
                      className="ms-2"
                      style={{
                        color: !isTableDisabled && edit ? "red" : "gray",
                        textDecoration:
                          !isTableDisabled && edit ? "underline" : "none",
                        cursor:
                          !isTableDisabled && edit ? "pointer" : "not-allowed",
                      }}
                      onClick={
                        !isTableDisabled && edit ? handleRemoveDiscount : null
                      }
                    >
                      {!isTableDisabled && edit ? "Remove" : "Disabled"}
                    </span>
                  </>
                ) : (
                  invoiceStatus === "Pending" &&
                  (!isTableDisabled && edit ? "Add" : "Disabled")
                )}
              </span>
            </div>
            {/*              <div className="w-100 d-flex flex-row justify-content-between p-2">
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
                    invoiceStatus === "Pending" && "Add"
                  )}
                </span>
              </div> */}
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Item Discount</span>
              <span className="text-secondary">
                {currencySymbol}
                {totalItemDiscount?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Subtotal</span>
              <span className="text-secondary">
                <span className="text-secondary">
                  {currencySymbol}
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
                {currencySymbol}
                {totalAmount?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2">
              {/* {authrztn.includes("Invoices-Edit") &&
                invoiceStatus === "Pending" && (
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
                            type="submit"
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
                )} */}
            </div>
            <div className="col-sm"></div>

            <div className="col-sm">
              {invoiceStatus === "Pending" && !edit && (
                <div className="row">
                  <div className="col-sm" />
                  <div className="col-sm text-end">
                    {authrztn.includes("Invoices-Edit") && (
                      <button
                        className="btn btn-primary w-100"
                        type="button"
                        // disabled={isCutoffPosted}
                        onClick={(e) => {
                          e.preventDefault();
                          setEdit(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {authrztn.includes("Invoices-Approve") && (
                    <>
                      <div className="d-none col-sm mb-2">
                        <button
                          className="btn btn-danger w-100"
                          type="button"
                          onClick={(e) => invoiceApproveReject(e, "reject")}
                          disabled={isCutoffPosted}
                        >
                          Reject
                        </button>
                      </div>
                      <div className="d-none col-sm">
                        <button
                          className="btn btn-success w-100"
                          type="button"
                          onClick={(e) => invoiceApproveReject(e, "approve")}
                          disabled={isCutoffPosted}
                        >
                          Approve
                        </button>
                      </div>

                      <div className="col-sm h-75">
                        <button
                          className="btn btn-outline-danger h-100 w-100"
                          type="button"
                          onClick={openPDFPreview}
                          disabled={isCutoffPosted || !isCutoffExists}
                        >
                          Preview PDF
                        </button>
                      </div>

                      {(authrztn.includes("Invoices-Edit") ||
                        authrztn.includes("Invoices-Approve")) &&
                        isCutoffPosted && (
                          <div>
                            <p className="text-danger">
                              Action is prohibited as the Invoice date has
                              already been posted.
                            </p>
                          </div>
                        )}

                      {(authrztn.includes("Invoices-Edit") ||
                        authrztn.includes("Invoices-Approve")) &&
                        !isCutoffExists && (
                          <div>
                            <p className="text-danger">
                              Action is prohibited as the Invoice date has not
                              been created.
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
              {authrztn.includes("Invoices-Edit") &&
                invoiceStatus === "Pending" && (
                  <>
                    {edit && (
                      <div className="row">
                        <div className="col-sm"></div>
                        <div className="col-sm mb-2">
                          <button
                            className="btn btn-secondary w-100"
                            type="button"
                            onClick={() => {
                              swal({
                                icon: "warning",
                                title: "Are you sure?",
                                text: "Your changes will not be saved.",
                                dangerMode: true,
                                buttons: true,
                              }).then((confirm) => {
                                if (confirm) {
                                  fetchSpecificInvoice();
                                  setEdit(false);
                                }
                              });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="col-sm">
                          <button
                            className="btn btn-primary w-100"
                            type="submit"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
                    : `Discount (${currencySymbol})`
                }
              />
              <div className="input-group-prepend">
                <div
                  className="input-group-text bg-white custom-discount-btn"
                  onClick={handleDiscountIcon}
                >
                  {modalDiscountType === "percentage" ? "%" : currencySymbol}
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

      {/* PDF Modal */}
      <Modal show={print} size="xl" onHide={() => setPrint(false)}>
        <div className="position-relative">
          <PDFDownloadLink
            document={<InvoicePDF2 id={id} />}
            fileName={`Sales Invoice - ${transactionId}.pdf`}
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
                    "Sales Invoice - {transactionId}.pdf"
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
            {authrztn.includes("Invoices-Approve") &&
            invoiceStatus === "Pending" ? (
              <div className="d-flex gap-1">
                <div>
                  <button
                    className="btn btn-sm btn-danger px-3"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      invoiceApproveReject(e, "reject");
                    }}
                    disabled={isCutoffPosted || !isCutoffExists}
                  >
                    Reject
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-success"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      invoiceApproveReject(e, "approve");
                    }}
                    disabled={isCutoffPosted || !isCutoffExists}
                  >
                    {totalAmount === 0 ? "Mark as Paid" : "Approve"}
                  </button>
                </div>
              </div>
            ) : (
              <span
                className={`badge px-3 py-2 fs-6 ${
                  invoiceStatus === "Approved" || invoiceStatus === "Paid"
                    ? "bg-success-subtle text-success border border-success-subtle"
                    : "bg-danger-subtle text-danger border border-danger-subtle"
                }`}
              >
                {invoiceStatus}
              </span>
            )}
          </div>
          <PDFViewer style={{ width: "100%", height: "90vh" }}>
            <InvoicePDF2 id={id} />
          </PDFViewer>
        </div>
      </Modal>
    </div>
  );
};

export default UpdateInvoice;
