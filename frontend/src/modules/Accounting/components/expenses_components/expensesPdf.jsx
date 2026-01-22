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
    width: "12.5%",
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
    width: "12.5%",
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

const ExpensesPdf = ({ data = {} }) => (
  <Document title={"Expenses List"}>
    {TAB_ORDER.map((tab) => (
      <Page key={tab} size="A4" style={styles.page} orientation="landscape">
        <View style={styles.heading}>
          <Text>
            Expenses - <Text style={styles.tabTitle}>{tab}</Text>
          </Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Transaction ID</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Expenses Type</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Foreign Type</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Amount</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Date Approved</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Expenses Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Status</Text>
            </View>
          </View>
          {data[tab] && data[tab].length > 0 ? (
            data[tab].map((row, idx) => (
              <View key={row.id || idx} style={styles.tableRow} wrap={false}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.client_transaction_id}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.expenses2_id === null
                      ? "NA"
                      : `${row.expenses2.sub_type} (${row.expenses2.expenses_one.expenses_type_one})`}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{row.foreign || "NA"}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.currency?.currency_name || ""}{" "}
                    {row.totalAmount?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{row.desc || "NA"}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.date_approved
                      ? new Date(row.date_approved).toLocaleString("en-US")
                      : "n/a"}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.expenses_date
                      ? new Date(row.expenses_date).toLocaleDateString("en-US")
                      : "n/a"}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{row.status}</Text>
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

export default ExpensesPdf;
