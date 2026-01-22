import React from "react";
import { CSVLink } from "react-csv";

const TAB_ORDER = ["Pending", "Approved", "Returned"];

const tableColumn = [
  "Transaction ID",
  "Destination",
  "Customer",
  "Invoice Date",
  "Date Approved",
  "Total Amount",
];

function getRows(tabData) {
  return tabData && tabData.length > 0
    ? tabData.map((row) => [
        row.client_transaction_id || "",
        row.destination || "",
        row.customer?.first_name
          ? `${row.customer.first_name} ${row.customer.last_name}`
          : row.customer?.company_name || "",
        row.invoice_date ? String(row.invoice_date) : "",
        row.date_approved ? String(row.date_approved) : "",
        row.total_amount !== undefined
          ? Number(row.total_amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "",
      ])
    : [["No data"]];
}

const InvoiceCsv = ({ data, csvLinkRef }) => {
  let csvData = [];
  TAB_ORDER.forEach((tab) => {
    csvData.push([`INVOICE - ${tab}`]);
    csvData.push([]);
    csvData.push(tableColumn);
    csvData = csvData.concat(getRows(data[tab]));
    csvData.push([]);
  });

  return (
    <div>
      <CSVLink
        data={csvData}
        filename={"Invoice.csv"}
        className="text-decoration-none text-reset"
        target="_blank"
        ref={csvLinkRef}
      ></CSVLink>
    </div>
  );
};

export default InvoiceCsv;
