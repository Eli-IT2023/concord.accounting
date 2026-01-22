import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";

const JournalListReport = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      name: "John Doe",
      account: "1001",
      label: "Sales Revenue",
      debit: 0,
      credit: 5000,
      taxes: 500,
      tax_grid: "A1",
    },
    {
      name: "Jane Smith",
      account: "1002",
      label: "Purchase Expense",
      debit: 3000,
      credit: 0,
      taxes: 300,
      tax_grid: "B2",
    },
    {
      name: "Alice Johnson",
      account: "1003",
      label: "Consulting Fee",
      debit: 0,
      credit: 7000,
      taxes: 700,
      tax_grid: "A2",
    },
    {
      name: "Bob Brown",
      account: "1004",
      label: "Office Supplies",
      debit: 1500,
      credit: 0,
      taxes: 150,
      tax_grid: "B1",
    },
    {
      name: "Carol White",
      account: "1005",
      label: "Interest Income",
      debit: 0,
      credit: 2000,
      taxes: 200,
      tax_grid: "A3",
    },
    {
      name: "David Green",
      account: "1006",
      label: "Utilities Expense",
      debit: 1000,
      credit: 0,
      taxes: 100,
      tax_grid: "B3",
    },
    {
      name: "Eve Black",
      account: "1007",
      label: "Advertising",
      debit: 2500,
      credit: 0,
      taxes: 250,
      tax_grid: "B4",
    },
    {
      name: "Frank Blue",
      account: "1008",
      label: "Commission Income",
      debit: 0,
      credit: 4500,
      taxes: 450,
      tax_grid: "A4",
    },
    {
      name: "Grace Gold",
      account: "1009",
      label: "Rent Expense",
      debit: 4000,
      credit: 0,
      taxes: 400,
      tax_grid: "B5",
    },
    {
      name: "Henry Silver",
      account: "1010",
      label: "Miscellaneous Income",
      debit: 0,
      credit: 3000,
      taxes: 300,
      tax_grid: "A5",
    },
    {
      name: "Ivy Red",
      account: "1011",
      label: "Salaries Expense",
      debit: 6000,
      credit: 0,
      taxes: 600,
      tax_grid: "B6",
    },
    {
      name: "Jack White",
      account: "1012",
      label: "Professional Fees",
      debit: 3500,
      credit: 0,
      taxes: 350,
      tax_grid: "B7",
    },
    {
      name: "Kate Purple",
      account: "1013",
      label: "Dividend Income",
      debit: 0,
      credit: 2500,
      taxes: 250,
      tax_grid: "A6",
    },
    {
      name: "Leo Orange",
      account: "1014",
      label: "Insurance Expense",
      debit: 2000,
      credit: 0,
      taxes: 200,
      tax_grid: "B8",
    },
    {
      name: "Mia Yellow",
      account: "1015",
      label: "Travel Expense",
      debit: 3000,
      credit: 0,
      taxes: 300,
      tax_grid: "B9",
    },
  ];

  const columns = [
    {
      name: "Name",
      selector: (row) => row.name,
    },
    {
      name: "Account",
      selector: (row) => row.account,
    },
    {
      name: "Label",
      selector: (row) => row.label,
    },
    {
      name: "Debit",
      selector: (row) => row.debit,
    },
    {
      name: "Credit",
      selector: (row) => row.credit,
    },
    {
      name: "Taxes",
      selector: (row) => row.taxes,
    },
    {
      name: "Tax Grids",
      selector: (row) => row.tax_grid,
    },
  ];

  //   filter
  // search
  const filteredItems = sampleData.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    // const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

    switch (filterColumn) {
      case "transaction_no":
        return item.transaction_no.toLowerCase().includes(searchLower);
      case "receiving_warehouse":
        return item.receiving_warehouse.toLowerCase().includes(searchLower);
      case "date_created":
        return item.date_created.toLowerCase().includes(searchLower);
      case "payment_method":
        return item.payment_method.toLowerCase().includes(searchLower);
      case "vendor_id":
        return item.vendor_id.toLowerCase().includes(searchLower);
      case "due_date":
        return item.due_date.toLowerCase().includes(searchLower);
      case "amount":
        return item.amount.toLowerCase().includes(searchLower);
      case "status":
        return item.status.toLowerCase().includes(searchLower);
      default:
        return (
          item.transaction_no.toLowerCase().includes(searchLower) ||
          item.receiving_warehouse.toLowerCase().includes(searchLower) ||
          item.date_created.toLowerCase().includes(searchLower) ||
          item.payment_method.toLowerCase().includes(searchLower) ||
          item.vendor_id.toLowerCase().includes(searchLower) ||
          item.due_date.toLowerCase().includes(searchLower) ||
          item.amount.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
        );
    }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">JOURNAL LIST REPORT</span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
        <div>
          {/* <Link
            to="/sales/local-bulk-collection"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            Bulk Collection
          </Link> */}
        </div>
      </div>
      <div className="container-fluid mt-4 p-0">
        <div className="row mx-auto">
          <div className="col-sm mb-2">
            <span>From</span>
            <input type="date" name="" id="" className="form-control" />
          </div>
          <div className="col-sm mb-2">
            <span>From</span>
            <input type="date" name="" id="" className="form-control" />
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
            <button className="btn w-100">Apply Filter</button>
            <button className="btn btn-secondary w-100">Clear Filter</button>
          </div>
          <div className="col-sm"></div>
        </div>
      </div>
      <div className="w-100 mt-4 mb-2 container-fluid">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchText}
            // onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-secondary dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "transaction_no" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("transaction_no")}
              >
                Transaction No.
              </button>
            </li>
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "receiving_warehouse" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("receiving_warehouse")}
              >
                Receiving Warehouse
              </button>
            </li>
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "date_created" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("date_created")}
              >
                Date Created
              </button>
            </li>
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "vendor_id" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("vendor_id")}
              >
                Vendor
              </button>
            </li>
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "due_date" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("due_date")}
              >
                Due Date
              </button>
            </li>
          </ul>
        </div>
      </div>
      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={filteredItems}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div>
    </div>
  );
};

export default JournalListReport;
