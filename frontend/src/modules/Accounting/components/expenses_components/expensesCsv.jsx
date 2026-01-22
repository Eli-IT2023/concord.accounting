import React from "react";
import { CSVLink } from "react-csv";

const TAB_ORDER = ["Pending", "Approved"];

const tableColumn = [
  "Transaction ID",
  "Expenses Type",
  "Foreign Type",
  "Amount",
  "Description",
  "Date Approved",
  "Expenses Date",
  "Status",
];

function getRows(tabData) {
  return tabData && tabData.length > 0
    ? tabData.map((row) => [
        row.client_transaction_id,
        row.expenses2_id === null
          ? "NA"
          : `${row.expenses2.sub_type} (${row.expenses2.expenses_one.expenses_type_one})`,
        row.foreign || "NA",
        `${row.currency?.currency_name || ""} ${
          row.totalAmount?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`,
        row.desc || "NA",
        row.date_approved
          ? new Date(row.date_approved).toLocaleString("en-US")
          : "n/a",
        row.expenses_date
          ? new Date(row.expenses_date).toLocaleDateString("en-US")
          : "n/a",
        row.status,
      ])
    : [["No data"]];
}

const ExpensesCsv = ({ data, csvLinkRef }) => {
  let csvData = [];
  TAB_ORDER.forEach((tab) => {
    csvData.push([`EXPENSES - ${tab}`]);
    csvData.push([]);
    csvData.push(tableColumn);
    csvData = csvData.concat(getRows(data[tab]));
    csvData.push([]);
  });

  return (
    <div>
      <CSVLink
        data={csvData}
        filename={"Expenses List.csv"}
        className="text-decoration-none text-reset"
        target="_blank"
        ref={csvLinkRef}
      ></CSVLink>
    </div>
  );
};

export default ExpensesCsv;
