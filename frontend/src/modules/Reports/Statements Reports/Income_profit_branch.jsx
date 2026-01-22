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

const IncomeProfitBranches = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      year: 2021,
      metro_huafei: 5000,
      sotanghon: 3000,
      muntinlupa: 2500,
      muntinlupa_2: 1500,
      batangas: 4500,
      batangas_2: 3200,
      iloilo: 2800,
      iloilo_2: 3600,
      total: 26100,
    },
    {
      year: 2022,
      metro_huafei: 4500,
      sotanghon: 2000,
      muntinlupa: -1200,
      muntinlupa_2: 3500,
      batangas: 4200,
      batangas_2: 3100,
      iloilo: 2700,
      iloilo_2: 3700,
      total: 22500,
    },
    {
      year: 2023,
      metro_huafei: 7000,
      sotanghon: -500,
      muntinlupa: 2300,
      muntinlupa_2: 1500,
      batangas: 4100,
      batangas_2: 2900,
      iloilo: 2500,
      iloilo_2: 3300,
      total: 24100,
    },
    {
      year: 2024,
      metro_huafei: -3000,
      sotanghon: 2500,
      muntinlupa: 1000,
      muntinlupa_2: 2000,
      batangas: 3800,
      batangas_2: 3000,
      iloilo: 2600,
      iloilo_2: 3500,
      total: 15400,
    },
    {
      year: 2025,
      metro_huafei: 6000,
      sotanghon: 4000,
      muntinlupa: 2700,
      muntinlupa_2: 3200,
      batangas: 4900,
      batangas_2: 3300,
      iloilo: 2900,
      iloilo_2: 4000,
      total: 31000,
    },
    {
      year: 2026,
      metro_huafei: 5500,
      sotanghon: 3000,
      muntinlupa: 1200,
      muntinlupa_2: 2500,
      batangas: 4600,
      batangas_2: 2800,
      iloilo: 2600,
      iloilo_2: 3800,
      total: 26000,
    },
    {
      year: 2027,
      metro_huafei: 5200,
      sotanghon: 3500,
      muntinlupa: 1600,
      muntinlupa_2: 2700,
      batangas: 4200,
      batangas_2: 2900,
      iloilo: 2500,
      iloilo_2: 3900,
      total: 26500,
    },
    {
      year: 2028,
      metro_huafei: -2000,
      sotanghon: 3000,
      muntinlupa: 1800,
      muntinlupa_2: 2400,
      batangas: 4000,
      batangas_2: 2600,
      iloilo: 2700,
      iloilo_2: 3700,
      total: 18200,
    },
    {
      year: 2029,
      metro_huafei: 5700,
      sotanghon: 3200,
      muntinlupa: 2100,
      muntinlupa_2: 3000,
      batangas: 4500,
      batangas_2: 3500,
      iloilo: 2900,
      iloilo_2: 3600,
      total: 28500,
    },
    {
      year: 2030,
      metro_huafei: 5300,
      sotanghon: 4000,
      muntinlupa: 2500,
      muntinlupa_2: 3500,
      batangas: 4700,
      batangas_2: 3300,
      iloilo: 2800,
      iloilo_2: 4200,
      total: 30300,
    },
    {
      year: 2031,
      metro_huafei: 5600,
      sotanghon: 3100,
      muntinlupa: 2200,
      muntinlupa_2: 3300,
      batangas: 4600,
      batangas_2: 3400,
      iloilo: 2500,
      iloilo_2: 3900,
      total: 28600,
    },
    {
      year: 2032,
      metro_huafei: 5100,
      sotanghon: -1000,
      muntinlupa: 2000,
      muntinlupa_2: 3100,
      batangas: 4200,
      batangas_2: 2900,
      iloilo: 2300,
      iloilo_2: 3700,
      total: 22300,
    },
    {
      year: 2033,
      metro_huafei: 6000,
      sotanghon: 3500,
      muntinlupa: 2800,
      muntinlupa_2: 3300,
      batangas: 4900,
      batangas_2: 3600,
      iloilo: 3000,
      iloilo_2: 4200,
      total: 31300,
    },
    {
      year: 2034,
      metro_huafei: 5400,
      sotanghon: 2800,
      muntinlupa: 2100,
      muntinlupa_2: 3200,
      batangas: 4700,
      batangas_2: 3100,
      iloilo: 2500,
      iloilo_2: 4000,
      total: 27800,
    },
    {
      year: 2035,
      metro_huafei: 5900,
      sotanghon: 3700,
      muntinlupa: 2600,
      muntinlupa_2: 3400,
      batangas: 4600,
      batangas_2: 3300,
      iloilo: 2700,
      iloilo_2: 4100,
      total: 30300,
    },
  ];

  const columns = [
    {
      name: "Year",
      selector: (row) => row.year,
    },
    {
      name: "Metro Huafei",
      selector: (row) => row.metro_huafei,
    },
    {
      name: "Sotanghon",
      selector: (row) => row.sotanghon,
    },
    {
      name: "Muntinlupa",
      selector: (row) => row.muntinlupa,
    },
    {
      name: "Muntinlupa II",
      selector: (row) => row.muntinlupa_2,
    },
    {
      name: "Batangas",
      selector: (row) => row.batangas,
    },
    {
      name: "Batangas II",
      selector: (row) => row.batangas_2,
    },
    {
      name: "Iloilo",
      selector: (row) => row.iloilo,
    },
    {
      name: "Iloilo II",
      selector: (row) => row.iloilo_2,
    },
    {
      name: "合计 Total",
      selector: (row) => row.total,
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
          <span className="fs-3">EXPENSES REPORT (费用报表)</span>
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
          <div className="col-sm mb-2"></div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
            <button className="btn btn-outline-success w-100">
              {" "}
              <i className="fa-solid fa-upload me-1"></i> Export
            </button>
            <button className="btn btn-outline-secondary w-100 mx-2">
              <i className="fa-solid fa-download me-1"></i> Import
            </button>
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
        <span className="text-dark text-start fs-2 border-bottom">
          YI LU JIA 公司销售利润报表
        </span>
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

export default IncomeProfitBranches;
