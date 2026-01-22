import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import NunitoSemiBold from "../../../assets/fonts/Nunito/Nunito-SemiBold.ttf";

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
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    paddingBottom: 20,
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
    width: "20%",
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
    width: "20%",
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

const ProductListPDF = ({ data = [] }) => (
  <Document title={"Product List"}>
    <Page size="A4" style={styles.page} orientation="landscape">
      {/* Heading */}
      <View style={styles.heading}>
        <Text>Product List</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow} fixed>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Product ID</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Product Name</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Product Category</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Product Unit</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Status</Text>
          </View>
        </View>

        {/* Table Body */}
        {data.map((row) => (
          <View key={row.product_id} style={styles.tableRow} wrap={false}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.product_code}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.product_name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.product_category}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.unit_of_measure}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{row.status}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View fixed>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

export default ProductListPDF;
