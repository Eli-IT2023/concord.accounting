import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";

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
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "14.28%",
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
  infoSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  column: {
    flex: 1,
    marginRight: 20,
  },
  label: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    padding: 8,
    borderBottom: "1px solid gray",
  },
  totalContainer: {
    marginTop: "20px",
    flexDirection: "row",
  },
  totalCard: {
    width: "55%",
    padding: "10px",
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
    bottom: 5,
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

  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalNetWeight, setTotalNetWeight] = useState(0);
  const [totalWeightedAmount, setTotalWeightedAmount] = useState(0);
  const [totalMoistureAmount, setTotalMoistureAmount] = useState(0);
  const [totalNetWeightAmount, setTotalNetWeightAmount] = useState(0);
  const [subTotal, setSubtotal] = useState(0);

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

  const fetchData = async () => {
    try {
      const [productRes, currencyRes, customerRes] = await Promise.all([
        axios.get(`${BASE_URL}/invoice/getProductInventoryInvoice`),
        axios.get(`${BASE_URL}/currency/fetchCurrency`),
        axios.get(`${BASE_URL}/invoice/getCustomersData`),
      ]);

      setProductData(productRes.data);
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

  useEffect(() => {
    fetchData();
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
    fetchCutOff();
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
            subtotal: item.subtotal,
            discountType: item.discount_type,
            sales_profit: item.sales_profit,
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
      const message =
        action === "approve" ? "Approve this invoice?" : "Reject this invoice?";
      const status = action === "approve" ? "Approved" : "Rejected";
      swal({
        title: message,
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/invoice/approveRejectInvoice`, {
              id,
              status,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text:
                    action === "approve"
                      ? "Sales invoice has been approved"
                      : "Sales invoice has been rejected",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
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

  const today = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Sales Invoice</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{transactionId}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{selectedMethod}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>
                <Text style={styles.value}>
                  {customerData.find(
                    (data) => data.customer_id === selectedCustomer
                  )
                    ? `${
                        customerData.find(
                          (data) => data.customer_id === selectedCustomer
                        ).first_name
                      } ${
                        customerData.find(
                          (data) => data.customer_id === selectedCustomer
                        ).last_name
                      }`
                    : ""}
                </Text>
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Destination</Text>
              <Text style={styles.value}>{selectedDestination}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Currency</Text>
              {currencyData
                .filter((data) => data.id === selectedCurrency)
                .map((data, i) => (
                  <Text style={styles.value} key={i} value={data.id}>
                    {data.currency_name}
                  </Text>
                ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{selectedDueDate}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{selectedInvoiceDate}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Payment Terms</Text>
              <Text style={styles.value}>{inputPaymentTerms}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow]}>
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
                Unit Price
              </Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Quantity
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
                Discount
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
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.productCode}
                </Text>
              </View>
              <View style={styles.tableCol}>
                {getFilteredProductData(index, items, productData).map(
                  (data) => (
                    <Text style={[styles.tableCell, { textAlign: "left" }]}>
                      {data.product_name}
                    </Text>
                  )
                )}
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.unitPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.quantity}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.moisture}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.discountType === "percentage"
                    ? `${item.discount}%`
                    : item.discount.toFixed(2)}
                </Text>
              </View>
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
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.totalCard}>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Quantity</Text>
              <Text style={styles.label}>
                {totalQuantity.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {/* <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Amount of Moisture</Text>
              <Text style={styles.label}>
                {totalMoistureInKilo.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View> */}
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Net Weight</Text>
              <Text style={styles.label}>
                {totalNetWeight.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={styles.totalCardSecond}>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Quantity Amount</Text>
              <Text style={styles.label}>
                {totalWeightedAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Net Weight Amount</Text>
              <Text style={styles.label}>
                {totalNetWeightAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Transaction Discount</Text>
              <Text style={styles.label}>
                {displayDiscount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {modalDiscount ? "%" : ""}
              </Text>
            </View>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Shipping</Text>
              <Text style={styles.label}>
                {displayShippingFee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Item Discount</Text>
              <Text style={styles.label}>
                {totalItemDiscount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.label}>
                {subTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.totalCardSecondBetweenTotalAmount}>
              <Text style={styles.labelSpecial}>Total Amount</Text>
              <Text style={styles.labelSpecial}>
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
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
