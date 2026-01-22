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

const InventoryReport = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [warehouse_db, setWarehouse_db] = useState([]);

  const fetchWarehouseData = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setWarehouse_db(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchWarehouseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sampleData = [
    {
      transaction_id: "TXN1001",
      date_created: "2024-08-01",
      vendor: "Vendor A",
      quantity: 10,
      total_value: "₱50,000.00",
    },
    {
      transaction_id: "TXN1002",
      date_created: "2024-08-02",
      vendor: "Vendor B",
      quantity: 15,
      total_value: "₱75,000.00",
    },
    {
      transaction_id: "TXN1003",
      date_created: "2024-08-03",
      vendor: "Vendor C",
      quantity: 8,
      total_value: "₱40,000.00",
    },
    {
      transaction_id: "TXN1004",
      date_created: "2024-08-04",
      vendor: "Vendor D",
      quantity: 20,
      total_value: "₱100,000.00",
    },
    {
      transaction_id: "TXN1005",
      date_created: "2024-08-05",
      vendor: "Vendor E",
      quantity: 12,
      total_value: "₱60,000.00",
    },
    {
      transaction_id: "TXN1006",
      date_created: "2024-08-06",
      vendor: "Vendor F",
      quantity: 25,
      total_value: "₱125,000.00",
    },
    {
      transaction_id: "TXN1007",
      date_created: "2024-08-07",
      vendor: "Vendor G",
      quantity: 18,
      total_value: "₱90,000.00",
    },
    {
      transaction_id: "TXN1008",
      date_created: "2024-08-08",
      vendor: "Vendor H",
      quantity: 14,
      total_value: "₱70,000.00",
    },
    {
      transaction_id: "TXN1009",
      date_created: "2024-08-09",
      vendor: "Vendor I",
      quantity: 30,
      total_value: "₱150,000.00",
    },
    {
      transaction_id: "TXN1010",
      date_created: "2024-08-10",
      vendor: "Vendor J",
      quantity: 22,
      total_value: "₱110,000.00",
    },
    {
      transaction_id: "TXN1011",
      date_created: "2024-08-11",
      vendor: "Vendor K",
      quantity: 17,
      total_value: "₱85,000.00",
    },
    {
      transaction_id: "TXN1012",
      date_created: "2024-08-12",
      vendor: "Vendor L",
      quantity: 28,
      total_value: "₱140,000.00",
    },
    {
      transaction_id: "TXN1013",
      date_created: "2024-08-13",
      vendor: "Vendor M",
      quantity: 11,
      total_value: "₱55,000.00",
    },
    {
      transaction_id: "TXN1014",
      date_created: "2024-08-14",
      vendor: "Vendor N",
      quantity: 19,
      total_value: "₱95,000.00",
    },
    {
      transaction_id: "TXN1015",
      date_created: "2024-08-15",
      vendor: "Vendor O",
      quantity: 16,
      total_value: "₱80,000.00",
    },
  ];

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Date Created",
      selector: (row) => row.date_created,
    },
    {
      name: "Vendor",
      selector: (row) => row.vendor,
    },
    {
      name: "Quantity",
      selector: (row) => row.quantity,
    },
    {
      name: "Total Value",
      selector: (row) => row.total_value,
    },
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= 2000; i--) {
    years.push(i);
  }
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
          <span className="fs-3">INVENTORY REPORT</span>
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
            <span>Branch</span>
            <select name="" id="" className="form-select">
              <option value="" selected disabled>
                Select Branch
              </option>
              {warehouse_db.map((data) => (
                <option value={data.warehouse_id}>{data.name}</option>
              ))}
            </select>
          </div>
          <div className="col-sm mb-2">
            <span>Year</span>
            <select name="year" id="year" className="form-select">
              <option value="" selected disabled>
                Select Year
              </option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm mb-2">
            <span>Month</span>
            <select name="month" id="month" className="form-select">
              <option value="" selected disabled>
                Select Month
              </option>
              {months.map((month, index) => (
                <option key={index} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
            <button className="btn w-100">Apply Filter</button>
            <button className="btn btn-secondary w-100">Clear Filter</button>
          </div>
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

export default InventoryReport;
