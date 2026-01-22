import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import { getCurrencySymbol } from "../../../utils/numberFormatter";
import NunitoSemiBold from "../../../assets/fonts/Nunito/Nunito-SemiBold.ttf";

Font.register({
  family: "Nunito",
  src: NunitoSemiBold,
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  currencySymbol: {
    fontSize: 10,
    fontFamily: "Nunito",
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "8.33333%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
    textAlign: "center",
  },
  totalTableCol: {
    padding: 5,
    width: "58.33331%",
  },
  totalTableCell: {
    paddingTop: 5,
    paddingBottom: 5,
    fontSize: 10,
    paddingLeft: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  column: {
    // flex: 1,
    marginRight: 20,
  },
  label: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    padding: 8,
    borderBottom: "1px solid black",
  },
  summaryColumn: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryValue: {
    fontSize: 10,
    width: 85,
    textAlign: "center",
    borderBottom: "1px solid black",
  },
  totalCard: {
    width: "11rem",
    padding: "10px",
    gap: "0.5rem",
  },
  totalContainer: {
    marginTop: "20px",
    flexDirection: "row",
  },
  totalCardSecond: {
    width: "45%",
    padding: "10px",
  },
  totalCardSecondBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalCardSecondBetweenTotalAmount: {
    backgroundColor: "#0A9CBC",
    borderRadius: "5px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    paddingLeft: 8,
    paddingRight: 8,
    marginTop: "5px",
  },
  labelSpecial: {
    fontSize: 10,
    color: "#fff",
    marginBottom: 4,
    fontWeight: 600,
  },
  tableHead: {
    backgroundColor: "#E9ECEF",
    padding: 5,
  },
  footer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  footerText: {
    fontSize: 8,
    color: "#000",
  },
});

const InvoicePDF = ({ id }) => {
  const [validated, setValidated] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [customerData, setCustomerData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [cutOffData, setCutOffData] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState("");

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

  const handleCloseTransactionDiscount = () =>
    setTransactionDiscountModal(false);
  const handleShowTransactionDiscount = () => setTransactionDiscountModal(true);

  const handleCloseShippingFee = () => setShippingFeeModal(false);
  const handleShowShippingFee = () => setShippingFeeModal(true);

  const [editIndex, setEditIndex] = useState(null);

  const [transactionId, setTransactionId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [inputPaymentTerms, setInputPaymentTerms] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [pier, setPier] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalNetWeight, setTotalNetWeight] = useState(0);
  const [totalWeightedAmount, setTotalWeightedAmount] = useState(0);
  const [totalMoistureAmount, setTotalMoistureAmount] = useState(0);
  const [totalNetWeightAmount, setTotalNetWeightAmount] = useState(0);
  const [subTotal, setSubtotal] = useState(0);

  const [returnedAmount, setReturnedAmount] = useState(0);
  const [status, setStatus] = useState("");

  const [items, setItems] = useState([
    {
      productCode: "",
      productName: "",
      remaining: "",
      averagePrice: "",
      quantity: "",
      unitPrice: "",
      sales_profit: "",
      discount: "",
      subtotal: 0,
      discountType: "percentage",
    },
  ]);
  const [totalItemDiscount, setTotalItemDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [containerNumber, setContainerNumber] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  const [currencyList, setCurrencyList] = useState([]);
  const [currencyId, setCurrencyId] = useState("");

  const currencySymbol = getCurrencySymbol(currencyList, selectedCurrency);

  // Fetch all currency
  const getCurrencyList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setCurrencyList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    try {
      const [productRes, currencyRes, customerRes] = await Promise.all([
        axios.get(`${BASE_URL}/invoice/getProductInventoryInvoice`),
        axios.get(`${BASE_URL}/currency/fetchCurrency`),
        axios.get(`${BASE_URL}/invoice/getCustomersDataPDF`),
      ]);

      setProductData(productRes.data);
      setCurrencyData(currencyRes.data);

      console.log(`customerRes.data`, customerRes.data);

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

  useEffect(() => {
    fetchData();
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
    fetchCutOff();
    getCurrencyList();
  }, []);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/invoice/getSpecificInvoice`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const { data: SalesInvoiceData, result: ProductTagInvoice } =
            res.data;
          setTransactionId(SalesInvoiceData.transaction_id);
          setSelectedCustomer(SalesInvoiceData.customer_id);
          setSelectedMethod(SalesInvoiceData.payment_method);
          setSelectedDueDate(SalesInvoiceData.due_date);
          setSelectedInvoiceDate(SalesInvoiceData.invoice_date);
          setInputPaymentTerms(SalesInvoiceData.payment_terms);
          setSelectedDestination(SalesInvoiceData.destination);
          setSelectedCurrency(SalesInvoiceData.currency_id);
          setTotalAmount(SalesInvoiceData.total_amount);
          setTotalItemDiscount(SalesInvoiceData.item_discount);
          setDisplayShippingFee(SalesInvoiceData.shipping_fee);
          setDisplayDiscount(SalesInvoiceData.transaction_discount);
          setInvoiceStatus(SalesInvoiceData.status);
          setContainerNumber(SalesInvoiceData.container_number);
          setWarehouseName(SalesInvoiceData.warehouse.name);
          setPier(SalesInvoiceData.pier);
          setStatus(SalesInvoiceData.status);

          console.log(SalesInvoiceData);

          const transformedItems = ProductTagInvoice.map((item) => ({
            productCode: item.product_code,
            productName: item.product_id.toString(),
            remaining: item.remaining,
            averagePrice: item.average_price,
            unitPrice: item.unit_price,
            quantity: item.quantity,
            moisture: item.moisture,
            netWeight: item.net_weight,
            discount: item.discount_item,
            staticNetWeight: item.static_net_weight,
            subtotal: item.subtotal,
            discountType: item.discount_type,
            sales_profit: item.sales_profit,
            unitOfMeasure: item.unit_of_measure,
          }));

          setItems(transformedItems);
          setSubtotal(
            transformedItems.reduce((acc, value) => {
              return acc + value.subtotal;
            }, 0)
          );
          console.log(ProductTagInvoice);
          console.log(transformedItems);

          calculateTotal(transformedItems, true);
        }
      })
      .catch((err) => console.log(err));
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

  // Enhanced product filtering function
  const getFilteredProductData = (index, items, productData) => {
    const currentRowProduct = items[index].productName;
    const currentProductCode = items[index].productCode;

    return productData.filter((product) => {
      const productId = product.product_id.toString();

      // Only return the product that matches both the ID and product code
      return (
        productId === currentRowProduct &&
        product.product_code === currentProductCode
      );
    });
  };

  // Modified handleProductChange function
  const handleProductChange = (index, value, items, setItems) => {
    const selectedProduct = productData.find(
      (product) => product.product_id.toString() === value
    );

    if (selectedProduct) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        productCode: selectedProduct.product_code,
        productName: value,
        remaining: selectedProduct.stock,
        averagePrice: selectedProduct.average_price,
        unitPrice: selectedProduct.unit_price || "",
      };
      setItems(updatedItems);
    } else {
      // Reset the productName field for the current row
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        productName: "",
      };
      setItems(updatedItems);
    }
  };

  const handleInputQTY = (index, field, value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === "quantity") {
      const quantity = parseFloat(value);
      const remaining = parseFloat(updatedItems[index].remaining);

      if (quantity > remaining) {
        swal({
          icon: "error",
          title: "Invalid Quantity",
          text: `The qty inputted must not exceed the available stock (${remaining}).`,
        });
        updatedItems[index].quantity = 0;
      }
    }

    const quantity = parseFloat(updatedItems[index].quantity) || 0;
    const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
    const averagePrices = parseFloat(updatedItems[index].averagePrice) || 0;
    let discount = parseFloat(updatedItems[index].discount) || 0;

    if (field === "unitPrice" || field === "averagePrice") {
      const averagePrices = parseFloat(updatedItems[index].averagePrice) || 0;
      const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
      updatedItems[index].sales_profit = averagePrices - unitPrice;
    }

    let subtotal = quantity * unitPrice;

    if (updatedItems[index].discountType === "percentage") {
      discount = (discount / 100) * subtotal;
    }

    if (!isNaN(discount)) {
      if (discount > subtotal) {
        swal({
          icon: "error",
          title: "Invalid Discount",
          text: "The discount should not exceed the total of the subtotal.",
        });
        updatedItems[index].discount = 0;
        discount = 0;
      }
      subtotal -= discount;
    }

    updatedItems[index].subtotal = subtotal;

    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    let totalDiscount = 0;
    let totalAmount = 0;

    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      let discount = parseFloat(item.discount) || 0;

      let subtotal = quantity * unitPrice;

      if (item.discountType === "percentage") {
        discount = (discount / 100) * subtotal;
      }

      if (!isNaN(discount)) {
        if (discount > subtotal) {
          discount = 0;
        }
        subtotal -= discount;
      }

      totalDiscount += discount;
      totalAmount += parseFloat(item.subtotal);
    });

    setTotalItemDiscount(totalDiscount.toFixed(2));
    setTotalAmount(totalAmount);
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

  const calculateTotal = (items, isInitialLoad = false) => {
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
      totalMoist += (moisture * quantity) / items.length;
      totalNetW += netWeight;

      // Calculate weighted amounts
      totalWeightedAmt += quantity * unitPrice;
      totalMoistureAmt += ((quantity * moisture) / 100) * unitPrice;
      totalNetWeightAmt += netWeight * unitPrice;
    });

    setTotalQuantity(totalQty);
    setTotalMoisture(totalMoist);
    setTotalNetWeight(totalNetW);
    setTotalWeightedAmount(totalWeightedAmt);
    setTotalMoistureAmount(totalMoistureAmt);
    setTotalNetWeightAmount(totalNetWeightAmt);
    console.log(totalNetWeightAmt);
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
    const discount = parseFloat(inputDiscount) || 0;
    const discountType = modalDiscountType;

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (discount / 100) * totalAmount;
    } else {
      discountAmount = discount;
    }

    const newTotalAmount = totalAmount - discountAmount;
    setTotalAmount(newTotalAmount);
    setDisplayDiscount(inputDiscount);
    setTransactionDiscountModal(false);
  };

  const handleAddShippingFee = () => {
    const shippingFee = parseFloat(inputShippingFee) || 0;
    const currentTotalAmount = parseFloat(totalAmount) || 0;

    const newTotalAmount = currentTotalAmount + shippingFee;
    setTotalAmount(newTotalAmount);
    setDisplayShippingFee(inputShippingFee);
    setShippingFeeModal(false);
  };

  const handleRemoveDiscount = (e) => {
    const discountValue = parseFloat(displayDiscount) || 0;
    const discountType = modalDiscountType;

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (discountValue / 100) * totalAmount;
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

  const handleDueDateChange = (e) => {
    const dueDate = e.target.value;
    setSelectedDueDate(dueDate);

    // Check if the dueDate is within any cutoff range
    const isWithinCutoff = cutOffData.some((cutoff) => {
      const fromDate = new Date(cutoff.from);
      const toDate = new Date(cutoff.to);
      const selectedDate = new Date(dueDate);

      return selectedDate >= fromDate && selectedDate <= toDate;
    });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Due Date Conflict",
        text: "The due date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setSelectedDueDate("");
      });
    }
  };

  const handleDueInvoiceDate = (e) => {
    const invoiceDate = e.target.value;
    setSelectedInvoiceDate(invoiceDate);

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
      swal({
        title: "Update this invoice?",
        text: "Please confirm to update this invoice",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const payload = {
            items: items.map((item) => ({
              product_id: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              discountType: item.discountType,
              subtotal: item.subtotal,
              averagePrice: item.averagePrice,
              salesProfit: item.sales_profit,
            })),
          };
          axios
            .post(`${BASE_URL}/invoice/update`, {
              transactionId,
              selectedCustomer,
              selectedCurrency,
              selectedMethod,
              selectedDueDate,
              selectedInvoiceDate,
              inputPaymentTerms,
              selectedDestination,
              totalAmount,
              transactionDiscount: displayDiscount,
              transactionDiscountType: modalDiscountType,
              shippingFee: displayShippingFee,
              totalItemDiscount,
              payload,
              id,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Invoice updated successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
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

  const isTableDisabled =
    invoiceStatus === "Approved" || invoiceStatus === "Rejected";

  const today = new Date().toLocaleDateString();

  const customer = customerData.find(
    (data) => data.customer_id === selectedCustomer
  );

  console.log(`customer`, customer);

  const customerName = customer?.company_name
    ? customer?.company_name
    : `${customer?.first_name} ${customer?.last_name}`;

  // Calculate Returned Quantity
  const calculateReturnedQuantity = (
    staticNetWeight,
    currentQuantity,
    moisture
  ) => {
    const moistureDecimal = moisture / 100;
    const originalWeight = staticNetWeight / (1 - moistureDecimal);
    const returnedQuantity = originalWeight - currentQuantity;

    return returnedQuantity;
  };

  return (
    <Document title={`Sales Invoice - ${transactionId}`}>
      <Page size="A4" style={styles.page} orientation="landscape">
        <Text style={styles.header}>Sales Invoice</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={{ ...styles.column }}>
              <Text style={styles.label}>CUSTOMER NO: </Text>
              <Text style={styles.value}>{selectedCustomer}</Text>
            </View>
            <View style={{ ...styles.column }}>
              <Text style={styles.label}>CUSTOMER: </Text>
              <Text style={styles.value}>{customerName || ""}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Invoice Date: </Text>
              <Text style={styles.value}>{selectedInvoiceDate}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Order Number: </Text>
              <Text style={styles.value}>{transactionId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow]}>
            {/* <View
              style={[
                styles.tableCol,
                styles.tableHead,
                { borderLeftWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Container Number
              </Text>
            </View> */}

            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                { borderLeftWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Warehouse
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Product Name
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Product Code
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Unit
              </Text>
            </View>

            {/* <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                PKG
              </Text>
            </View> */}

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                QTY
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Weighing
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Moisture
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                N.W.
              </Text>
            </View>

            {/*Returned Quantity*/}
            {status === "Approved" && (
              <View style={[styles.tableCol, styles.tableHead]}>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 600, textAlign: "left" },
                  ]}
                >
                  Returned Qty
                </Text>
              </View>
            )}

            {status === "Approved" && (
              <View style={[styles.tableCol, styles.tableHead]}>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 600, textAlign: "left" },
                  ]}
                >
                  T.N.W
                </Text>
              </View>
            )}

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Price
              </Text>
            </View>

            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Subtotal
              </Text>
            </View>
          </View>

          {items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              {/* Container Number */}
              {/* <View style={{ ...styles.tableCol, borderLeftWidth: 1 }}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {containerNumber || "TBA"}
                </Text>
              </View> */}
              {/* Warehouse */}
              <View style={{ ...styles.tableCol, borderLeftWidth: 1 }}>
                {" "}
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {warehouseName}
                </Text>
              </View>
              {/* Product Name */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {getFilteredProductData(index, items, productData).map(
                    (data) => (
                      <Text style={[styles.tableCell, { textAlign: "left" }]}>
                        {data.product_name}
                      </Text>
                    )
                  )}
                </Text>
              </View>
              {/* Product Code */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.productCode}
                </Text>
              </View>
              {/* Unit */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.unitOfMeasure}
                </Text>
              </View>
              {/* PKG */}
              {/* <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  TBA
                </Text>
              </View> */}
              {/* QTY */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.quantity?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              {/* Weighing */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  TBA
                </Text>
              </View>
              {/* Moisture */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.moisture?.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                  %
                </Text>
              </View>

              {/* N.W */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.netWeight?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* Returned Qty - only show if status is Approved */}
              {status === "Approved" && (
                <View style={styles.tableCol}>
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    {calculateReturnedQuantity(
                      item.staticNetWeight || 0,
                      item.quantity || 0,
                      item.moisture || 0
                    )?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </Text>
                </View>
              )}

              {/* T.N.W (Total Net Weight) - only show if status is Approved */}
              {status === "Approved" && (
                <View style={styles.tableCol}>
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    {item.netWeight?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </Text>
                </View>
              )}
              {/* Price (Peso/kg) */}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                  {item.unitPrice.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              {/* Subtotal (Peso/kg)*/}
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.subtotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={styles.tableRow}>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                {
                  borderLeftWidth: 1,
                  width: "33.33332%",
                },
              ]}
            >
              <Text style={[styles.totalTableCell, { fontWeight: 600 }]}>
                Total:
              </Text>
            </View>

            {/* Total QTY */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                {totalQuantity.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Total Weighing */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                TBA
              </Text>
            </View>

            {/* Total Moisture */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                {totalMoisture?.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
                %
              </Text>
            </View>

            {/* Total Net Weight */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                {totalNetWeight.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Total Returned Qty - only show if status is Approved */}
            {status === "Approved" && (
              <View style={[styles.tableCol, styles.tableHead]}>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 600, textAlign: "left" },
                  ]}
                >
                  {items
                    .reduce((total, item) => {
                      const returned = calculateReturnedQuantity(
                        item.staticNetWeight || 0,
                        item.quantity || 0,
                        item.moisture || 0
                      );
                      return total + returned;
                    }, 0)
                    .toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Text>
              </View>
            )}

            {/* Total T.N.W - only show if status is Approved */}
            {status === "Approved" && (
              <View style={[styles.tableCol, styles.tableHead]}>
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 600, textAlign: "left" },
                  ]}
                >
                  {totalNetWeight.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}

            {/* Total Price - empty */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              ></Text>
            </View>

            {/* Total Subtotal */}
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {subTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{ ...styles.totalContainer, justifyContent: "space-between" }}
        >
          <View style={styles.totalCard}>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Container Number: </Text>
              <Text style={styles.summaryValue}>
                {containerNumber || "TBA"}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Pier: </Text>
              <Text style={styles.summaryValue}>{pier || "TBA"}</Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Discount: </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {displayDiscount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Shipping Fee: </Text>
              <Text style={styles.summaryValue}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {displayShippingFee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          <View
            style={{
              gap: "0.5rem",
              flexDirection: "column",
              alignItems: "flex-end",
              padding: "10px",
              marginLeft: "auto",
            }}
          >
            <View style={styles.summaryColumn}>
              <Text style={[styles.label, { color: "red" }]}>Subtotal: </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {subTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={[styles.label, { color: "red" }]}>
                Total Amount:{" "}
              </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Payment Method: </Text>
              <Text style={styles.summaryValue}>{selectedMethod}</Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Due Date: </Text>
              <Text style={styles.summaryValue}>
                {selectedDueDate || "TBA"}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Payment Terms: </Text>
              <Text style={styles.summaryValue}>
                {inputPaymentTerms || "TBA"}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Destination: </Text>
              <Text style={styles.summaryValue}>{selectedDestination}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{transactionId}</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
