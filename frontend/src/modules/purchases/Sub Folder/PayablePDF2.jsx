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
import { set } from "date-fns";

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
    borderRightWidth: 0,
    borderBottomWidth: 0,
    // backgroundColor: "#ff0808ff",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    // width: "16.66666666666667%",
    width: "9.09%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableColWide: {
    width: "11.11%",
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
    // flex: 1,
    marginRight: 20,
    // flexDirection: "row",
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
  totalContainer: {
    marginTop: "20px",
    flexDirection: "row",
  },
  totalCard: {
    width: "9.5rem",
    padding: "10px",
    gap: "0.5rem",
  },
  subCard: {
    flexDirection: "row",
    width: "20.5rem",
    // padding: "10px",
    gap: "0.5rem",
  },
  totalCardRightSide: {
    padding: "10px",
    marginLeft: "auto",
    gap: "0.5rem",
  },
  totalCardSecond: {
    width: "50%",
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
    // backgroundColor: "#CBCBCB",
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
const PayablePDF = ({ id }) => {
  const [transaction_id, setTransactionId] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [currency_name, setCurrencyName] = useState("");
  const [domestic_type, setDomesticType] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [due_date, setDueDate] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorId, setVendorId] = useState("");

  const [email, setEmail] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  const [discountValue, setDiscountValue] = useState(0);
  const [weighingFee, setWeighingFee] = useState(0);
  const today = new Date().toLocaleDateString();

  const [fetchPayable, setFetchPayable] = useState([]);
  const [payableDiscountType, setPayableDiscountType] = useState(null);
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [totalUnitPrice, setTotalUnitPrice] = useState(0);

  const [currencyList, setCurrencyList] = useState([]);
  const [currencyId, setCurrencyId] = useState("");
  const [status, setStatus] = useState("");

  const currencySymbol = getCurrencySymbol(currencyList, currencyId);

  // Fetch all currency
  const getCurrencyList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setCurrencyList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPayableData = () => {
    axios
      .get(BASE_URL + "/payablePDF/fetch", {
        params: {
          id,
        },
      })
      .then((res) => {
        const data = res.data.isFetch[0];
        setFetchPayable(data);
        setTransactionId(data.transaction_id);
        setTotalPrice(data.totalPrice || 0);
        setDomesticType(data.domestic_type);
        setPurchaseDate(data.purchaseDate);
        setDueDate(data.due_date);

        setVendorName(data.vendor.company_name);
        setVendorId(data.vendor.id);
        setEmail(data.vendor.company_email);
        setWarehouseName(data.warehouse.name);
        setCurrencyName(data.currency.currency_name);

        setWeighingFee(data.weighing_fee || 0);

        // discount
        setDiscountValue(data.discount_value || 0);
        setPayableDiscountType(res.data.payableDiscountType);
        setModeOfPayment(data.MOP);
        setCurrencyId(data.currency.id);
        setStatus(data.status);

        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchPayableData();
  }, [id]);

  const [totalWeighted, setTotalWeighted] = useState(0);
  const [totalMoisture, setTotalMoisture] = useState(0);
  const [totalNetWeight, setTotalNetWeight] = useState(0);
  const [totalReturnedAmount, setTotalReturnedAmount] = useState(0);
  const [totalReturnedQty, setTotalReturnedQty] = useState(0);
  const [totalWeightInKilo, setTotalWeightInKilo] = useState(0);
  const [totalMoistureInKilo, setTotalMoistureInKilo] = useState(0);
  const [totalNetWeightInKilo, setTotalNetWeightInKilo] = useState(0);
  const [payableProducts, setPayableProducts] = useState([]);

  // const fetchPayableProduct = () => {
  //   axios
  //     .get(BASE_URL + "/payablePDF/payableProduct", {
  //       params: {
  //         id,
  //       },
  //     })
  //     .then((res) => {
  //       console.log("Payable Products:", res.data);
  //       setPayableProducts(res.data);

  //       // Calculate total weighted
  //       const total = res.data.reduce(
  //         (sum, item) => sum + (item.weighted || 0),
  //         0
  //       );
  //       setTotalWeighted(total);

  //       // Calculate total weighted in kilo
  //       const totalWeightInKilo = res.data.reduce(
  //         (sum, item) => sum + (item.weight || 0),
  //         0
  //       );
  //       setTotalWeightInKilo(totalWeightInKilo);

  //       // Calculate total moisture
  //       const totalMoisture = res.data.reduce((acc, data) => {
  //         if (data.moisture_type === "%") {
  //           return (
  //             acc +
  //             parseFloat(
  //               (data.moisture / 100) *
  //                 (data.unitPrice || 0) *
  //                 (data.weight || 0)
  //             )
  //           );
  //         } else {
  //           return acc + parseFloat(data.moisture || 0);
  //         }
  //       }, 0);
  //       setTotalMoisture(totalMoisture);

  //       // Calculate total moisture in kilo
  //       const calculateTotalMoistureInKilo = res.data.reduce((total, value) => {
  //         // Get Moisture in pese
  //         const moistureInPeso = isNaN(
  //           parseFloat(
  //             String(value.moisture).replace(/,/g, "") / value.unitPrice
  //           ) * parseFloat(String(value.weight).replace(/,/g, ""))
  //         )
  //           ? 0
  //           : parseFloat(
  //               String(value.moisture).replace(/,/g, "") / value.unitPrice
  //             ) * parseFloat(String(value.weight).replace(/,/g, ""));

  //         // Get Moisture in percentage
  //         const moistureInPercentage = isNaN(
  //           (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
  //             parseFloat(String(value.weighted).replace(/,/g, ""))
  //         )
  //           ? 0
  //           : (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
  //             parseFloat(String(value.weight).replace(/,/g, ""));

  //         return value.moisture_type === "%"
  //           ? total + moistureInPercentage
  //           : total + moistureInPeso;
  //       }, 0);
  //       setTotalMoistureInKilo(calculateTotalMoistureInKilo);

  //       // Calculate total net weight
  //       setTotalNetWeight(total - totalMoisture);

  //       // Calculate total net weight in kilo
  //       const calculateTotalNetWeightInKilo = res.data.reduce(
  //         (total, value) => {
  //           const weight =
  //             parseFloat(String(value.weight).replace(/,/g, "")) || 0;
  //           const moisture =
  //             parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
  //           const unitPrice =
  //             parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;
  //           const netWeightInPeso = Math.trunc(weight - moisture / unitPrice);
  //           const netWeightInPercentage = Math.trunc(
  //             weight * (1 - moisture / 100)
  //           );

  //           return value.moisture_type === "%"
  //             ? total + netWeightInPercentage
  //             : total + netWeightInPeso;
  //         },
  //         0
  //       );
  //       setTotalNetWeightInKilo(calculateTotalNetWeightInKilo);

  //       const totalUnitPrice = res.data.reduce((acc, value) => {
  //         return acc + value.unitPrice;
  //       }, 0);

  //       setTotalUnitPrice(totalUnitPrice);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // };
  const fetchPayableProduct = () => {
    axios
      .get(BASE_URL + "/payablePDF/payableProduct", {
        params: {
          id,
        },
      })
      .then((res) => {
        console.log("Payable Products:", res.data);
        setPayableProducts(res.data);

        // Calculate total weighted
        const total = res.data.reduce(
          (sum, item) => sum + (item.weighted || 0),
          0
        );
        setTotalWeighted(total);

        // Calculate total weighted in kilo
        const totalWeightInKilo = res.data.reduce(
          (sum, item) => sum + (item.weight || 0),
          0
        );
        setTotalWeightInKilo(totalWeightInKilo);

        // Calculate total moisture IN PESO
        // const totalMoisture = res.data.reduce((acc, data) => {
        //   const weight = parseFloat(data.weight || 0);
        //   const moisture = parseFloat(data.moisture || 0);
        //   const unitPrice = parseFloat(data.unitPrice || 0);
        //   const net_weight = parseFloat(data.net_weight || 0);
        //   const static_net_weight = parseFloat(data.static_net_weight || 0);
        //   const returnedWeight = static_net_weight - net_weight;
        //   console.log("Returned Weight:", returnedWeight * unitPrice);
        //   setTotalReturnedAmount(returnedWeight * unitPrice);

        //   if (data.moisture_type === "%") {
        //     // Calculate net weight after moisture removal (truncated)
        //     const netWeight = Math.floor(weight * (1 - moisture / 100));

        //     // Moisture amount in peso = (Original Weight - Net Weight) × Unit Price
        //     const moistureAmount = (weight - netWeight) * unitPrice;

        //     return acc + moistureAmount;
        //   } else {
        //     // Moisture is already in peso
        //     return acc + moisture;
        //   }
        // }, 0);
        const { totalReturnedAmount, totalMoisture, totalReturnedQty } =
          res.data.reduce(
            (acc, data) => {
              const weight = parseFloat(data.weight || 0);
              const moisture = parseFloat(data.moisture || 0);
              const unitPrice = parseFloat(data.unitPrice || 0);
              const net_weight = parseFloat(data.net_weight || 0);
              const static_net_weight = parseFloat(data.static_net_weight || 0);
              const returnedWeight = static_net_weight - net_weight;

              console.log("Returned Weight:", returnedWeight * unitPrice);

              // Accumulate returned amount
              acc.totalReturnedAmount += returnedWeight * unitPrice;
              acc.totalReturnedQty += returnedWeight;

              // Accumulate moisture amount
              if (data.moisture_type === "%") {
                const netWeight = Math.floor(weight * (1 - moisture / 100));
                const moistureAmount = (weight - netWeight) * unitPrice;
                acc.totalMoisture += moistureAmount;
              } else {
                acc.totalMoisture += moisture;
              }

              return acc;
            },
            { totalReturnedAmount: 0, totalMoisture: 0, totalReturnedQty: 0 }
          );

        setTotalReturnedAmount(totalReturnedAmount);
        setTotalMoisture(totalMoisture);
        setTotalReturnedQty(totalReturnedQty);
        // Calculate total moisture IN KILO
        const calculateTotalMoistureInKilo = res.data.reduce((total, value) => {
          const weight =
            parseFloat(String(value.weight).replace(/,/g, "")) || 0;
          const moisture =
            parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
          const unitPrice =
            parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;

          if (value.moisture_type === "%") {
            // Calculate net weight after moisture removal (truncated)
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
        setTotalMoistureInKilo(calculateTotalMoistureInKilo);

        // Calculate total net weight IN KILO
        const calculateTotalNetWeightInKilo = res.data.reduce(
          (total, value) => {
            const weight =
              parseFloat(String(value.weight).replace(/,/g, "")) || 0;
            const moisture =
              parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
            const unitPrice =
              parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;

            if (value.moisture_type === "%") {
              // Calculate net weight with truncation
              const netWeightInPercentage = Math.floor(
                weight * (1 - moisture / 100)
              );
              return total + netWeightInPercentage;
            } else {
              // Moisture in peso: convert to kg and subtract from weight
              const moistureInKg = unitPrice > 0 ? moisture / unitPrice : 0;
              const netWeightInPeso = Math.floor(weight - moistureInKg);
              return total + netWeightInPeso;
            }
          },
          0
        );
        setTotalNetWeightInKilo(calculateTotalNetWeightInKilo);

        // Calculate total net weight IN PESO
        // This should be: total weighted - total moisture
        setTotalNetWeight(total - totalMoisture);

        const totalUnitPrice = res.data.reduce((acc, value) => {
          return acc + value.unitPrice;
        }, 0);

        setTotalUnitPrice(totalUnitPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    fetchPayableProduct();
  }, [id]);

  // payable fees
  const [fetchPayableFees, setFetchPayableFees] = useState([]);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);

  const fetchFees = () => {
    axios
      .get(BASE_URL + "/payablePDF/payableFees", {
        params: {
          id,
        },
      })
      .then((res) => {
        setFetchPayableFees(res.data);
        const total = res.data.reduce(
          (sum, item) => sum + (item.fee_amount || 0),
          0
        );
        setTotalFeeAmount(total);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchFees();
  }, [id]);

  // subtotal
  const subtotal = totalWeighted - totalMoisture - weighingFee - totalFeeAmount;

  const [discountBackend, setDiscountBackend] = useState(0);
  const calculateDiscount = () => {
    const numValue = parseFloat(discountValue);
    // if (isNaN(numValue)) return "0.00";

    if (payableDiscountType === "percent") {
      setDiscountBackend(
        (numValue / 100) *
          parseFloat(
            totalWeighted - totalMoisture - weighingFee - totalFeeAmount
          )
      );
    } else {
      setDiscountBackend(numValue);
    }
  };

  useEffect(() => {
    calculateDiscount();
    getCurrencyList();
  }, []);

  // total
  const totalAmount =
    totalWeighted -
    totalMoisture -
    weighingFee -
    totalFeeAmount -
    discountBackend;

  return (
    <Document title={`Payable - ${transaction_id}`}>
      <Page size="A4" style={styles.page} orientation="landscape">
        <Text style={styles.header}>Payment Overview</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Supplier No: </Text>
              <Text style={styles.value}>{vendorId}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Supplier name: </Text>
              <Text style={styles.value}>{vendorName}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Date: </Text>
              <Text style={styles.value}>{purchaseDate}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Number: </Text>
              <Text style={styles.value}>{transaction_id}</Text>
            </View>
          </View>
        </View>

        {/* <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{transaction_id}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Amount to Pay </Text>
              <Text style={styles.value}>
                {totalPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Currency</Text>
              <Text style={styles.value}>{currency_name}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Foreign Type</Text>
              <Text style={styles.value}>
                {domestic_type ? `${domestic_type.toUpperCase()} OVERSEAS` : ""}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Purchase Date</Text>
              <Text style={styles.value}>{purchaseDate}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{due_date}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Vendor</Text>
              <Text style={styles.value}>{vendorName}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Receiving Warehouse</Text>
              <Text style={styles.value}>{warehouseName}</Text>
            </View>
          </View>
        </View> */}

        <View style={styles.table}>
          <View style={[styles.tableRow]}>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  {
                    fontWeight: 600,
                    textAlign: "left",
                  },
                ]}
              >
                Receiving {"\n"}Warehouse
              </Text>
            </View>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Product Name
              </Text>
            </View>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Product Code
              </Text>
            </View>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Unit
              </Text>
            </View>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Weighed QTY
              </Text>
            </View>

            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Moisture
              </Text>
            </View>
            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                N.W.
              </Text>
            </View>
            {status === "Approved" && (
              <View
                style={[
                  styles.tableCol,
                  styles.tableHead,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text
                  style={[
                    styles.tableCell,
                    { fontWeight: 600, textAlign: "left" },
                  ]}
                >
                  Returned Qty.
                </Text>
              </View>
            )}

            {status === "Approved" && (
              <View
                style={[
                  styles.tableCol,
                  styles.tableHead,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
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

            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Unit Price
              </Text>
            </View>

            <View
              style={[
                styles.tableCol,
                styles.tableHead,
                !status || status !== "Approved" ? styles.tableColWide : {},
              ]}
            >
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

          {payableProducts.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {warehouseName}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.product_name || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.product_code || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.unit_of_measure || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.weight?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.moisture?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                  %
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.weight !== undefined && item.weight !== null
                    ? Math.trunc(
                        item.weight * (1 - (item.moisture || 0) / 100)
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </Text>
              </View>
              {/* returned qty */}
              {status === "Approved" && (
                <View
                  style={[
                    styles.tableCol,
                    !status || status !== "Approved" ? styles.tableColWide : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    {(item.static_net_weight - item.net_weight)?.toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    ) || ""}
                  </Text>
                </View>
              )}

              {/* total net weight (net weght - returned qty) */}
              {status === "Approved" && (
                <View
                  style={[
                    styles.tableCol,
                    !status || status !== "Approved" ? styles.tableColWide : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { textAlign: "left" }]}>
                    {item.net_weight?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || ""}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                  {item.unitPrice?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  !status || status !== "Approved" ? styles.tableColWide : {},
                ]}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {/* {item.weight !== undefined && item.weight !== null
                    ? (
                        Math.trunc(
                          item.weight * (1 - (item.moisture || 0) / 100)
                        ) * item.unitPrice
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""} */}
                  {(item.net_weight * item.unitPrice).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>
            </View>
          ))}

          {/* TOTALS ROW */}

          <View style={styles.tableRow}>
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                width: "36.36%",
                ...(!status || status !== "Approved"
                  ? { width: "44.44%" }
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>TLL</Text>
            </View>
            {/* Total Weight */}
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                ...(!status || status !== "Approved"
                  ? styles.tableColWide
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>
                {totalWeightInKilo.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {/* Total Moisture */}
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                ...(!status || status !== "Approved"
                  ? styles.tableColWide
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>
                {/* {totalMoistureInKilo.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} */}
              </Text>
            </View>
            {/* Total Net Weight */}
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                ...(!status || status !== "Approved"
                  ? styles.tableColWide
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>
                {totalNetWeightInKilo.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {/* Total Returned Qty */}
            {status === "Approved" && (
              <View
                style={{
                  ...styles.tableCol,
                  ...styles.tableHead,
                }}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {totalReturnedQty.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
            {/* Total T.N.W */}
            {status === "Approved" && (
              <View
                style={{
                  ...styles.tableCol,
                  ...styles.tableHead,
                }}
              >
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {(totalNetWeightInKilo - totalReturnedQty).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </Text>
              </View>
            )}
            {/* Total Unit Price */}
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                ...(!status || status !== "Approved"
                  ? styles.tableColWide
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>
                {/* {totalUnitPrice} */}
              </Text>
            </View>
            {/* Total of Subtotal */}
            <View
              style={{
                ...styles.tableCol,
                ...styles.tableHead,
                ...(!status || status !== "Approved"
                  ? styles.tableColWide
                  : {}),
              }}
            >
              <Text style={[styles.tableCell, { textAlign: "left" }]}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {/* {totalNetWeight.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} */}
                {(totalNetWeight - totalReturnedAmount).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.totalCard}>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Weighing Fee: </Text>
              <Text
                style={{
                  ...styles.summaryValue,
                  color: "red",
                }}
              >
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {weighingFee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Deduction: </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {discountValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={styles.totalCardRightSide}>
            <View style={styles.summaryColumn}>
              <Text style={[styles.label, { color: "red" }]}>Amount: </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {totalNetWeight.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {status === "Approved" && (
              <View style={styles.summaryColumn}>
                <Text style={[styles.label, { color: "red" }]}>
                  Returned Amount:{" "}
                </Text>
                <Text style={{ ...styles.summaryValue, color: "red" }}>
                  <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                  {totalReturnedAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
            <View style={styles.summaryColumn}>
              <Text style={[styles.label, { color: "red" }]}>
                Payable Amount:{" "}
              </Text>
              <Text style={{ ...styles.summaryValue, color: "red" }}>
                <Text style={styles.currencySymbol}>{currencySymbol} </Text>
                {(
                  totalNetWeight -
                  totalReturnedAmount -
                  weighingFee
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.subCard}>
              <View style={{ ...styles.summaryColumn, marginRight: "auto" }}>
                <Text style={styles.label}>C/A: </Text>
                <Text style={{ ...styles.summaryValue, color: "red" }}>
                  TBA
                </Text>
              </View>
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>Cash Payment: </Text>
                <Text style={styles.summaryValue}>TBA</Text>
              </View>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Check Payment: </Text>
              <Text style={styles.summaryValue}>TBA</Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.label}>Check No. </Text>
              <Text style={styles.summaryValue}>TBA</Text>
            </View>
            <View style={styles.subCard}>
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>Method of Payment: </Text>
                <Text style={styles.summaryValue}>{modeOfPayment}</Text>
              </View>
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>Date for Check paying: </Text>
                <Text style={styles.summaryValue}>TBA</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{transaction_id}</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayablePDF;
