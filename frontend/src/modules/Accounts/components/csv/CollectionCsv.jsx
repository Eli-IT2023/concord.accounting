import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../../../../assets/global/url";
import swal from "sweetalert";
import { getCurrencySymbol } from "../../../../utils/numberFormatter";
import NunitoSemiBold from "../../../../assets/fonts/Nunito/Nunito-SemiBold.ttf";
import { format } from "date-fns";
import { CSVLink } from "react-csv";

const CollectionCsv = ({
  accountName,
  accountId,
  cutoffName,
  dateFrom,
  dateTo,
  searchText,
  filterColumn,
  csvLinkRef,
  refreshKey,
}) => {
  const [collections, setCollections] = useState([]);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);

  const formatCell = (text) => {
    return String(text).replace(/^/, "'");
  };

  const tableColumn = [
    "Transaction No.",
    "Transaction Date",
    "Issued To",
    "Issued Date",
    "Payment Method",
    "Check Number",
    "Reference Number",
    "Amount",
    "Status",
  ];

  const tableRow = collections?.map((row) => [
    // Transaction No.
    row.bulk_collection
      ? row.bulk_collection?.transaction_number
      : row.loan_mothers[0]?.transaction_number ?? "--",
    // Transaction Date
    (row.bulk_collection?.collection_date &&
      format(new Date(row.bulk_collection.collection_date), "MMM/dd/yyyy")) ||
      (row.loan_mothers?.[0]?.transaction_date &&
        format(
          new Date(row.loan_mothers[0].transaction_date),
          "MMM/dd/yyyy"
        )) ||
      (row.receiving_checks?.[0]?.transaction_date &&
        format(
          new Date(row.receiving_checks[0].transaction_date),
          "MMM/dd/yyyy"
        )),
    // Issued To
    row.account_list_sub3_id
      ? `${row.account_list_sub3?.account_list_base_sub?.subject_name} - ${row.account_list_sub3?.account_name}`
      : "--",
    // Issued Date
    row.date_issued ? format(row.date_issued, "MMM/dd/yyyy") : "--",
    // Payment Method
    row.payment_type,
    // Check Number
    row.check_number ? formatCell(row.check_number) : "---",
    // Reference Number
    row.ref_number || "---",
    // Amount
    row.amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || "0.00",
    // Status
    row.status === "Claimed"
      ? "Collected"
      : row.account_list_sub3_id === null && row.isFromLoan === false
      ? "Select Account"
      : "Collect",
  ]);

  // For CSV Data
  const data = [
    ["OUTSTANDING RECEIVABLE"],
    [],
    [
      "Total Claimed:",
      totalClaimed?.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    ],
    [
      "Total Unclaimed",
      totalUnclaimed?.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    ],
    [],
    ["Account", "Cutoff", "From", "To"],
    [
      accountName,
      formatCell(cutoffName),
      dateFrom ? format(dateFrom, "MMM/dd/yyyy") : "--",
      dateTo ? format(dateTo, "MMM/dd/yyyy") : "--",
    ],
    [],
    tableColumn,
    ...tableRow,
  ];

  // Fetch data for table
  const fetchCollections = async () => {
    try {
      if (!dateFrom || !dateTo) throw new Error("Date not found.");

      const res = await axios.get(`${BASE_URL}/outstanding/collections/pdf`, {
        params: { dateFrom, dateTo, searchText, filterColumn, accountId },
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
  }, [dateFrom, searchText, accountId, refreshKey]);

  return (
    <div>
      <CSVLink
        data={data}
        filename={"Outstanding Receivable.csv"}
        className="text-decoration-none text-reset"
        target="_blank"
        ref={csvLinkRef}
      ></CSVLink>
    </div>
  );
};

export default CollectionCsv;
