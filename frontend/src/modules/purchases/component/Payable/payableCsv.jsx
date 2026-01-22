import React from "react";
import { CSVLink } from "react-csv";

const TAB_ORDER = ["Pending", "Approved"];

const tableColumn = [
  "Purchase Date",
  "Transaction Number",
  "Receiving Warehouse",
  "Vendor",
  "Destination",
  "Total Amount",
];

function getRows(tabData) {
  return tabData && tabData.length > 0
    ? tabData.map((row) => [
        row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : "",
        row.client_transaction_id || "",
        row.warehouse?.name || "",
        row.vendor?.company_name || "",
        row.domestic_type === "local"
          ? "Local"
          : row.domestic_type === "overseas"
          ? "Overseas"
          : "",
        row.currency?.currency_name
          ? `${row.currency.currency_name} `
          : "" +
            (row.totalPrice !== undefined
              ? Number(row.totalPrice).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : ""),
      ])
    : [["No data"]];
}

const PayableCsv = ({ data, csvLinkRef }) => {
  let csvData = [];
  TAB_ORDER.forEach((tab) => {
    csvData.push([`PAYABLE - ${tab}`]);
    csvData.push([]);
    csvData.push(tableColumn);
    csvData = csvData.concat(getRows(data[tab]));
    csvData.push([]);
  });

  return (
    <div>
      <CSVLink
        data={csvData}
        filename={"Payable.csv"}
        className="text-decoration-none text-reset"
        target="_blank"
        ref={csvLinkRef}
      ></CSVLink>
    </div>
  );
};

export default PayableCsv;
