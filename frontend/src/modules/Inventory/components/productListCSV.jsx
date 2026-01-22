import React from "react";
import { CSVLink } from "react-csv";

const ProductListCSV = ({ data, csvLinkRef }) => {
  const tableColumn = [
    "Product ID",
    "Product Name",
    "Product Category",
    "Product Unit",
    "Status",
  ];

  const tableRow = data?.map((row) => [
    `${row.product_code}`,
    row.product_name,
    row.product_category,
    row.unit_of_measure,
    row.status,
  ]);

  // For CSV Data
  const csvData = [["PRODUCT LIST"], [], tableColumn, ...tableRow];

  return (
    <div>
      <CSVLink
        data={csvData}
        filename={"Product List.csv"}
        className="text-decoration-none text-reset"
        target="_blank"
        ref={csvLinkRef}
      ></CSVLink>
    </div>
  );
};

export default ProductListCSV;
