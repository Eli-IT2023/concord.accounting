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
    // margin: "auto",
    // marginTop: 5,
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
    width: "16rem",
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

const LocalOverseasPDF = ({ id, module, currencyId }) => {
  const [payableBulk, setPayableBulk] = useState([]);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [vendor, setVendor] = useState(null);
  const [balance, setBalance] = useState(0);
  const [payableDate, setPayableDate] = useState(null);
  const [status, setStatus] = useState("");

  const [vendorMap, setVendorMap] = useState([]);
  const [availablePayables, setAvailablePayables] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [allCurrency, setAllCurrency] = useState([]);
  const [isAmountDisabled, setIsAmountDisabled] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [payableList, setPayableList] = useState([
    {
      id: "",
      transactionId: "",
      invoiceDate: "",
      dueDate: "",
      amount: "",
      discount: "",
    },
  ]);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [removePaymentListId, setRemovePaymentListId] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [storePreviousAvailablePayable, setStorePreviousAvailablePayable] =
    useState([]);
  const [withIsAddedPayable, setWithIsAddedPayable] = useState([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [selectedRowTransactions, setSelectedRowTransactions] = useState([]);
  const [transactionToGetBack, setTransactionToGetBack] = useState([]);
  const [print, setPrint] = useState(false);
  const [dataTable, setDataTable] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [currencyList, setCurrencyList] = useState([]);

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

  const fetchExistingData = () => {
    axios
      .get(`${BASE_URL}/payable/getPayableBulk/${id}`)
      .then((res) => {
        const { data, dataTransaction, dataPayment, isPosted } = res.data;
        setPayableBulk(data);
        setTransactionNumber(data?.transaction_number);

        const modifiedTransaction = dataTransaction.map((item) => {
          let unitPrice = 0;
          // row.payable_products.forEach((data) => {
          //   unitPrice += data.product_tag_vendor.product_price * data.weight;
          // });
          item.payable.payable_products.forEach((data) => {
            unitPrice += data.unitPrice * data.weight;
          });

          const moisture = item.payable.payable_products?.reduce(
            (acc, data) => {
              if (data.moisture_type === "%") {
                return (
                  acc +
                  parseFloat(
                    (data.moisture / 100) * data.unitPrice * data.weight || 0
                  )
                );
              } else {
                return acc + parseFloat(data.moisture || 0);
              }
            },
            0
          );

          const totalOtherFees =
            item.payable.payable_other_fees?.reduce(
              (acc, data) => acc + parseFloat(data.fee_amount || 0),
              0
            ) || 0;

          const calculateDiscount =
            item.payable.isPercent_Discount === true
              ? (item.payable.discount_value / 100) *
                parseFloat(
                  unitPrice -
                    moisture -
                    item.payable.weighing_fee -
                    totalOtherFees
                )
              : item.payable.discount_value;

          const totalAmountPrice =
            unitPrice -
            moisture -
            item.payable.weighing_fee -
            totalOtherFees -
            calculateDiscount;

          return {
            ...item,
            totalAmount: totalAmountPrice,
          };
        });

        setPayableList(modifiedTransaction);
        console.log(dataTransaction, "datatransaction");

        const vendorId = data.vendor_id;

        const selectedTransactionIds = dataTransaction.map(
          (item) => item.transactionId
        );

        console.log(selectedTransactionId, "transactionid");

        setSelectedRowTransactions(
          dataTransaction.map((item) => item.payable.id)
        );

        setStatus(data.status);
        setPayableDate(
          data.payable_date
            ? new Date(data.payable_date).toISOString().split("T")[0]
            : ""
        );

        setIsCutoffPosted(isPosted);
      })
      .catch((error) => {
        console.error("Error fetching PayableBulk:", error);
      });
  };

  const fetchLocalOverseasPdf = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/payable/local-overseas-pdf`, {
        params: {
          id,
        },
      });

      const { pdfData, totalPrice } = res.data;

      if (res.status === 200) {
        console.log(totalPrice);
        setDataTable(pdfData);
        console.log(pdfData);
        setTotalAmount(totalPrice);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    fetchLocalOverseasPdf();
    fetchExistingData();
    getCurrencyList();
  }, []);

  return (
    <Document
      title={`${
        module.charAt(0).toUpperCase() + module.slice(1)
      } Purchase - ${transactionNumber}`}
    >
      <Page size="A4" style={styles.page} orientation="landscape">
        <Text style={styles.header}>Payment Order</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Payment: </Text>
              <Text style={styles.value}>TBA</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Name: </Text>
              <Text style={styles.value}>TBA</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Date: </Text>
              <Text style={styles.value}>{payableDate}</Text>
            </View>
            <View style={{ ...styles.column, flex: 1 }}>
              <Text style={styles.label}>Number: </Text>
              <Text style={styles.value}>{transactionNumber}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow]}>
            <View style={[styles.tableCol, styles.tableHead, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  {
                    fontWeight: 600,
                  },
                ]}
              >
                Description
              </Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead, { width: "25%" }]}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>TBA</Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>Name</Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>QTY</Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>Price</Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text style={[styles.tableCell, { fontWeight: 600 }]}>Total</Text>
            </View>
          </View>

          {/* Table Cell */}
          {dataTable.map((item) => {
            return (
              <View style={styles.tableRow} key={item.id}>
                {/* Description */}
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={styles.tableCell}>
                    {item.payable.description}
                  </Text>
                </View>

                {/* TBA */}
                <View
                  style={[
                    styles.tableCol,
                    {
                      width: "25%",
                      margin: 0,
                      padding: 0,
                      flexDirection: "row",
                    },
                  ]}
                >
                  <View
                    style={{
                      ...styles.tableCol,
                      borderRight: 1,
                      borderBottom: 0,
                      margin: 0,
                      width: "50%",
                    }}
                  >
                    <Text style={styles.tableCell}>TBA</Text>
                  </View>
                  <View
                    style={{
                      ...styles.tableCol,
                      borderWidth: 0,
                      margin: 0,
                      width: "50%",
                    }}
                  >
                    <Text style={styles.tableCell}>TBA</Text>
                  </View>
                </View>

                {/* Name */}
                <View style={[styles.tableCol]}>
                  <Text style={styles.tableCell}>
                    {item.product_tag_vendor.product_list.product_name}
                  </Text>
                </View>

                {/* QTY */}
                <View style={[styles.tableCol]}>
                  <Text style={styles.tableCell}>
                    {item.weight.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                {/* Price */}
                <View style={[styles.tableCol]}>
                  <Text style={styles.tableCell}>
                    <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                    {item.unitPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                {/* Total */}
                <View style={[styles.tableCol]}>
                  <Text style={styles.tableCell}>
                    {item.payable.totalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Table Footer */}
          <View style={styles.tableRow}>
            <View
              style={[styles.tableCol, styles.tableHead, { width: "87.5%" }]}
            >
              <Text
                style={{
                  ...styles.tableCell,
                  textAlign: "left",
                }}
              >
                Total:
              </Text>
            </View>
            <View style={[styles.tableCol, styles.tableHead]}>
              <Text style={styles.tableCell}>
                <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                {totalAmount.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ ...styles.totalContainer, flexDirection: "column" }}>
          <View style={styles.totalCardRightSide}>
            <View style={{ ...styles.subCard }}>
              <View style={styles.summaryColumn}>
                <Text style={{ ...styles.label, color: "red" }}>Amount: </Text>
                <Text style={styles.summaryValue}>TBA</Text>
              </View>
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>Cash Payment: </Text>
                <Text style={styles.summaryValue}>TBA</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalCardRightSide}>
            <View
              style={{
                ...styles.subCard,
                width: "30rem",
                justifyContent: "space-between",
              }}
            >
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>C/A: </Text>
                <Text style={{ ...styles.summaryValue }}>TBA</Text>
              </View>

              <View style={{ ...styles.subCard, width: "16.5rem" }}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.label}>Difference: </Text>
                  <Text
                    style={{
                      ...styles.summaryValue,
                      color: "red",
                      borderBottomColor: "red",
                    }}
                  >
                    TBA
                  </Text>
                </View>
                <View style={{ ...styles.summaryColumn, position: "relative" }}>
                  <Text
                    style={{
                      ...styles.label,
                      position: "absolute",
                      left: 25,
                      top: -18,
                    }}
                  >
                    OR
                  </Text>
                  <Text style={styles.label}>Check Payment: </Text>
                  <Text style={styles.summaryValue}>TBA</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.totalCardRightSide}>
            <View style={{ ...styles.subCard, width: "18.8rem" }}>
              <View style={{ ...styles.summaryColumn, marginRight: "auto" }}>
                <Text style={styles.label}>Method of Payment: </Text>
                <Text style={{ ...styles.summaryValue }}>TBA</Text>
              </View>
              <View style={styles.summaryColumn}>
                <Text style={styles.label}>Check No. </Text>
                <Text style={styles.summaryValue}>TBA</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalCardRightSide}>
            <View style={{ ...styles.subCard, width: "18.8rem" }}>
              <View style={{ ...styles.summaryColumn, marginLeft: "auto" }}>
                <Text style={styles.label}>Date for Check paying: </Text>
                <Text style={{ ...styles.summaryValue }}>TBA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{transactionNumber}</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default LocalOverseasPDF;
