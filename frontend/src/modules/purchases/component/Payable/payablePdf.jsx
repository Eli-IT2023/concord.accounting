import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const TAB_ORDER = ["Pending", "Approved"];

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 60,
  },
  heading: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    paddingBottom: 20,
  },
  tabTitle: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#403E92",
    marginBottom: 10,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "transparent",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "16.66%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#403E92",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    textAlign: "center",
    backgroundColor: "#403E92",
    color: "white",
  },
  tableCol: {
    width: "16.66%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 8,
  },
  footer: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    textAlign: "right",
    fontSize: 8,
  },
});

const PayablePdf = ({ data = {} }) => (
  <Document title={"Payable List"}>
    {TAB_ORDER.map((tab) => (
      <Page key={tab} size="A4" style={styles.page} orientation="landscape">
        <View style={styles.heading}>
          <Text>
            Payable - <Text style={styles.tabTitle}>{tab}</Text>
          </Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Purchase Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Transaction Number</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Receiving Warehouse</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Vendor</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Destination</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Total Amount</Text>
            </View>
          </View>
          {data[tab] && data[tab].length > 0 ? (
            data[tab].map((row, idx) => (
              <View key={row.id || idx} style={styles.tableRow} wrap={false}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.purchaseDate
                      ? new Date(row.purchaseDate).toLocaleDateString()
                      : ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.client_transaction_id || ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.warehouse?.name || ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.vendor?.company_name || ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.domestic_type === "local"
                      ? "Local"
                      : row.domestic_type === "overseas"
                      ? "Overseas"
                      : ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.currency?.currency_name
                      ? `${row.currency.currency_name} `
                      : ""}
                    {row.totalPrice !== undefined
                      ? Number(row.totalPrice).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : ""}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>No data</Text>
              </View>
            </View>
          )}
        </View>
        <View fixed>
          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    ))}
  </Document>
);

export default PayablePdf;
