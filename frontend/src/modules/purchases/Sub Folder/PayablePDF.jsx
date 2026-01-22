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
    // width: "16.66666666666667%",
    width: "12.5%",
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
    width: "50%",
    padding: "10px",
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
const PayablePDF = ({ id }) => {
  const [transaction_id, setTransactionId] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [currency_name, setCurrencyName] = useState("");
  const [domestic_type, setDomesticType] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [due_date, setDueDate] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [email, setEmail] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  const [discountValue, setDiscountValue] = useState(0);
  const [weighingFee, setWeighingFee] = useState(0);
  const today = new Date().toLocaleDateString();

  const [fetchPayable, setFetchPayable] = useState([]);
  const [payableDiscountType, setPayableDiscountType] = useState(null);

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
        setEmail(data.vendor.company_email);
        setWarehouseName(data.warehouse.name);
        setCurrencyName(data.currency.currency_name);

        setWeighingFee(data.weighing_fee || 0);

        // discount
        setDiscountValue(data.discount_value || 0);
        setPayableDiscountType(res.data.payableDiscountType);
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

  const [totalWeightInKilo, setTotalWeightInKilo] = useState(0);
  const [totalMoistureInKilo, setTotalMoistureInKilo] = useState(0);
  const [totalNetWeightInKilo, setTotalNetWeightInKilo] = useState(0);

  const [payableProducts, setPayableProducts] = useState([]);
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

        // Calculate total moisture
        const totalMoisture = res.data.reduce((acc, data) => {
          if (data.moisture_type === "%") {
            return (
              acc +
              parseFloat(
                (data.moisture / 100) *
                  (data.unitPrice || 0) *
                  (data.weight || 0)
              )
            );
          } else {
            return acc + parseFloat(data.moisture || 0);
          }
        }, 0);
        setTotalMoisture(totalMoisture);

        // Calculate total moisture in kilo
        const calculateTotalMoistureInKilo = res.data.reduce((total, value) => {
          // Get Moisture in pese
          const moistureInPeso = isNaN(
            parseFloat(
              String(value.moisture).replace(/,/g, "") / value.unitPrice
            ) * parseFloat(String(value.weight).replace(/,/g, ""))
          )
            ? 0
            : parseFloat(
                String(value.moisture).replace(/,/g, "") / value.unitPrice
              ) * parseFloat(String(value.weight).replace(/,/g, ""));

          // Get Moisture in percentage
          const moistureInPercentage = isNaN(
            (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
              parseFloat(String(value.weighted).replace(/,/g, ""))
          )
            ? 0
            : (parseFloat(String(value.moisture).replace(/,/g, "")) / 100) *
              parseFloat(String(value.weight).replace(/,/g, ""));

          return value.moisture_type == "%"
            ? total + moistureInPercentage
            : total + moistureInPeso;
        }, 0);
        setTotalMoistureInKilo(calculateTotalMoistureInKilo);

        // Calculate total net weight
        setTotalNetWeight(total - totalMoisture);

        // Calculate total net weight in kilo
        const calculateTotalNetWeightInKilo = res.data.reduce(
          (total, value) => {
            const weight =
              parseFloat(String(value.weight).replace(/,/g, "")) || 0;
            const moisture =
              parseFloat(String(value.moisture).replace(/,/g, "")) || 0;
            const unitPrice =
              parseFloat(String(value.unitPrice).replace(/,/g, "")) || 0;
            const netWeightInPeso = weight - moisture / unitPrice;
            const netWeightInPercentage = weight * (1 - moisture / 100);

            return value.moisture_type === "%"
              ? total + netWeightInPercentage
              : total + netWeightInPeso;
          },
          0
        );
        setTotalNetWeightInKilo(calculateTotalNetWeightInKilo);
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
  });

  // total
  const totalAmount =
    totalWeighted -
    totalMoisture -
    weighingFee -
    totalFeeAmount -
    discountBackend;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Payment Overview</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{transaction_id}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Purchase Date</Text>
              <Text style={styles.value}>{purchaseDate}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Vendor</Text>
              <Text style={styles.value}>{vendorName}</Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Receiving Warehouse</Text>
              <Text style={styles.value}>{warehouseName}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Amount to Pay </Text>
              <Text style={styles.value}>
                {totalPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.column}></View>
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
                UOM
              </Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text
                style={[
                  styles.tableCell,
                  { fontWeight: 600, textAlign: "left" },
                ]}
              >
                Weight
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
                Net Weight
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
                Subtotal
              </Text>
            </View>
          </View>

          {payableProducts.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.product_code || ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.product_name || ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.product_tag_vendor?.product_list?.unit_of_measure || ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.weight?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.moisture?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>

              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.weight !== undefined && item.weight !== null
                    ? (
                        item.weight *
                        (1 - (item.moisture || 0) / 100)
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.unitPrice?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, { textAlign: "left" }]}>
                  {item.weight !== undefined && item.weight !== null
                    ? (
                        item.weight *
                        (1 - (item.moisture || 0) / 100) *
                        item.unitPrice
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.totalCard}>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Weighted Amount</Text>
              <Text style={styles.label}>
                {totalWeightInKilo.toLocaleString("en-US", {
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
              <Text style={styles.label}>Total Net Weight Amount</Text>
              <Text style={styles.label}>
                {totalNetWeightInKilo.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={styles.totalCardSecond}>
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Weighted</Text>
              <Text style={styles.label}>
                {totalWeighted.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {/* <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Total Moisture</Text>
              <Text style={styles.label}>
                {totalMoisture.toLocaleString("en-US", {
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
            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Weighing Fee</Text>
              <Text style={styles.label}>
                {weighingFee.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {fetchPayableFees.length > 0 &&
              fetchPayableFees.map((fee) => (
                <View style={styles.totalCardSecondBetween} key={fee.id}>
                  <Text style={styles.label}>{fee.fee_name}</Text>
                  <Text style={styles.label}>
                    {fee.fee_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}

            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.label}>
                {subtotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.totalCardSecondBetween}>
              <Text style={styles.label}>
                Discount ( {payableDiscountType === "percent" ? "%" : "Amount"}{" "}
                )
              </Text>
              <Text style={styles.label}>
                {discountValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* total */}
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
          <Text style={styles.footerText}>{transaction_id}</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayablePDF;
