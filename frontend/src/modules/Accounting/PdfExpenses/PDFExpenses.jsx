import React, { useEffect, useState } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import BASE_URL from "../../../assets/global/url";
import axios from "axios";
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
const PDFExpenses = ({ id }) => {
  const today = new Date().toLocaleDateString();

  const [pdfData, setPdfData] = useState({});

  const handleFetchPDF = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/pdfExpense`, {
        params: {
          id,
        },
      });

      setPdfData(res.data);

      console.log("Reeeees", res.data[0].transaction_id);

      console.log(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchPDF();
  }, [id]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Expenses Overview</Text>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{pdfData?.transaction_id}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Foreign Type</Text>
              <Text style={styles.value}>{pdfData?.foreign}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Expenses Type 1</Text>
              <Text style={styles.value}>
                {pdfData?.expenses2?.expenses_one.expenses_type_one}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Expenses Type 2</Text>
              <Text style={styles.value}>{pdfData?.expenses2?.sub_type}</Text>
            </View>
          </View>

          {pdfData?.product_name != null ? (
            <>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Product Name</Text>
                  <Text style={styles.value}>
                    {pdfData?.product_name || ""}
                  </Text>
                </View>

                <View style={styles.column}>
                  <Text style={styles.label}>Unit Price</Text>
                  <Text style={styles.value}>{pdfData?.unitPrice || ""}</Text>
                </View>

                <View style={styles.column}>
                  <Text style={styles.label}>Quantity</Text>
                  <Text style={styles.value}>{pdfData?.assetQuantity}</Text>
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{pdfData?.due_date}</Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Expenses Date</Text>
              <Text style={styles.value}>{pdfData?.expenses_date}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>
                {pdfData?.totalAmount} {pdfData?.currency?.currency_name}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{pdfData?.desc}</Text>
            </View>
          </View>

          {pdfData?.currency?.currency_name !== "PHP" ? (
            <>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Rate</Text>
                  <Text style={styles.value}>{pdfData?.rate}</Text>
                </View>

                <View style={styles.column}></View>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{pdfData?.transaction_id}</Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFExpenses;
