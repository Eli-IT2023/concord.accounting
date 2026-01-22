import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import NunitoSemiBold from "../../../../assets/fonts/Nunito/Nunito-SemiBold.ttf";

Font.register({
  family: "Nunito",
  src: NunitoSemiBold,
});

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 60,
  },
  heading: {
    textAlign: "center",
    fontSize: 20, // bigger heading
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    paddingBottom: 30, // more space below heading
  },
  tabTitle: {
    textAlign: "center",
    fontSize: 16, // bigger tab title
    fontFamily: "Helvetica-Bold",
    color: "#403E92",
    marginBottom: 16,
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
    minHeight: 28, // taller rows
  },
  tableColHeader: {
    width: "16.66%", // wider columns (6 columns)
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#403E92",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8, // more padding
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
    padding: 8, // more padding
    textAlign: "center",
  },
  tableCell: {
    fontSize: 12, // bigger font
  },
  footer: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    textAlign: "right",
    fontSize: 10,
  },
});

const TAB_ORDER = ["Pending", "Approved", "Returned"];

const InvoicePdf = ({ data = {} }) => (
  <Document title={"Invoice"}>
    {TAB_ORDER.map((tab) => (
      <Page key={tab} size="A4" style={styles.page} orientation="landscape">
        <View style={styles.heading}>
          <Text>
            Invoice - <Text style={styles.tabTitle}>{tab}</Text>
          </Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Transaction ID</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Destination</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Customer</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Invoice Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Date Approved</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Total Amount</Text>
            </View>
          </View>
          {data[tab] && data[tab].length > 0 ? (
            data[tab].map((row, idx) => (
              <View
                key={row.sales_invoice_id || idx}
                style={styles.tableRow}
                wrap={false}
              >
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.client_transaction_id || ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{row.destination || ""}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.customer?.first_name
                      ? `${row.customer.first_name} ${row.customer.last_name}`
                      : row.customer?.company_name || ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.invoice_date ? String(row.invoice_date) : ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.date_approved ? String(row.date_approved) : ""}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {row.total_amount !== undefined
                      ? Number(row.total_amount).toLocaleString("en-US", {
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

export default InvoicePdf;
