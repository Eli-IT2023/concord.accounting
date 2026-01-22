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
import BASE_URL from "../../../../assets/global/url";
import swal from "sweetalert";
import { getCurrencySymbol } from "../../../../utils/numberFormatter";
import NunitoSemiBold from "../../../../assets/fonts/Nunito/Nunito-SemiBold.ttf";
import { format } from "date-fns";

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

  // For Widgets
  widgetContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingBottom: 20,
  },
  titleWidget: {
    fontSize: "0.8rem",
    gap: "0.5rem",
    border: 1,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: "0.375rem",
    borderColor: "#dee2e6",
  },
  totalClaimedAmount: {
    color: "#FFA500",
    margin: "auto",
  },
  totalUnclaimedAmount: {
    color: "#008000",
    margin: "auto",
  },

  // For Filter Section
  filterSectionContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    gap: "1rem",
  },
  filterContainer: {
    flexGrow: 1,
  },
  labelFilter: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 5,
  },
  valueFilter: {
    fontSize: 10,
    borderBottom: 1,
    padding: 5,
  },

  // For Table
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
    width: "11.11111111%",
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
    width: "11.11111111%",
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

  // For Footer
  footer: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    textAlign: "right",
    fontSize: 8,
  },
});

const CollectionPdf = ({
  accountName,
  accountId,
  cutoffName,
  dateFrom,
  dateTo,
  searchText,
  filterColumn,
}) => {
  const [collections, setCollections] = useState([]);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);

  // To avoid long words in single line
  const breakOnHyphen = (text) => {
    if (!text.includes("-")) return text;

    const index = text.indexOf("-") + 1;

    return `${text.substring(0, index)}\n${text.slice(index)?.trim()}`;
  };

  // Fetch data for table
  const fetchCollections = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/outstanding/collections/pdf`, {
        params: {
          dateFrom,
          dateTo,
          searchText,
          filterColumn,
          accountId,
        },
      });
      const { data, totalClaimed, totalUnclaimed } = res.data;
      setCollections(data);
      setTotalClaimed(totalClaimed);
      setTotalUnclaimed(totalUnclaimed);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <Document title={"Outstanding Receivable"}>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Heading */}
        <View style={styles.heading}>
          <Text>Outstanding Receivable</Text>
        </View>

        {/* Widgets */}
        <View style={styles.widgetContainer}>
          <View style={styles.titleWidget}>
            <Text>Total Claimed</Text>
            <Text style={styles.totalClaimedAmount}>
              {totalClaimed.toLocaleString("en-US", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.titleWidget}>
            <Text>Total Unclaimed</Text>
            <Text style={styles.totalUnclaimedAmount}>
              {totalUnclaimed.toLocaleString("en-US", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSectionContainer}>
          <View style={styles.filterContainer}>
            <Text style={styles.labelFilter}>Account:</Text>
            <Text style={styles.valueFilter}>{accountName}</Text>
          </View>
          <View style={styles.filterContainer}>
            <Text style={styles.labelFilter}>Cutoff:</Text>
            <Text style={styles.valueFilter}>{cutoffName}</Text>
          </View>
          <View style={styles.filterContainer}>
            <Text style={styles.labelFilter}>From:</Text>
            <Text style={styles.valueFilter}>
              {format(dateFrom, "MMM/dd/yyyy")}
            </Text>
          </View>
          <View style={styles.filterContainer}>
            <Text style={styles.labelFilter}>To:</Text>
            <Text style={styles.valueFilter}>
              {format(dateTo, "MMM/dd/yyyy")}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow} fixed>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Transaction No.</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Transaction Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Issued To</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Issued Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Payment Method</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Check Number</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Reference Number</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Amount</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCell}>Status</Text>
            </View>
          </View>

          {/* Table Body */}
          {collections.map((row) => (
            <View key={row.id} style={styles.tableRow} wrap={false}>
              {/* Transaction No. */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {row.bulk_collection
                    ? row.bulk_collection?.transaction_number
                    : row.loan_mothers[0]?.transaction_number ?? "--"}
                </Text>
              </View>

              {/* Transaction Date */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {(row.bulk_collection?.collection_date &&
                    format(
                      new Date(row.bulk_collection.collection_date),
                      "MMM/dd/yyyy"
                    )) ||
                    (row.loan_mothers?.[0]?.transaction_date &&
                      format(
                        new Date(row.loan_mothers[0].transaction_date),
                        "MMM/dd/yyyy"
                      )) ||
                    (row.receiving_checks?.[0]?.transaction_date &&
                      format(
                        new Date(row.receiving_checks[0].transaction_date),
                        "MMM/dd/yyyy"
                      ))}
                </Text>
              </View>

              {/* Issued To */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {row.account_list_sub3_id
                    ? `${row.account_list_sub3?.account_list_base_sub?.subject_name} - ${row.account_list_sub3?.account_name}`
                    : "--"}
                </Text>
              </View>

              {/* Issued Date */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(row.date_issued, "MMM/dd/yyyy")}
                </Text>
              </View>

              {/* Payment Method */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{row.payment_type}</Text>
              </View>

              {/* Check Number */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {row.check_number || "---"}
                </Text>
              </View>

              {/* Reference Number */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{row.ref_number || "---"}</Text>
              </View>

              {/* Amount */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {row.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </Text>
              </View>

              {/* Status */}
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {row.status === "Claimed"
                    ? "Collected"
                    : row.account_list_sub3_id === null &&
                      row.isFromLoan === false
                    ? "Select Account"
                    : "Collect"}
                </Text>
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
};

export default CollectionPdf;
