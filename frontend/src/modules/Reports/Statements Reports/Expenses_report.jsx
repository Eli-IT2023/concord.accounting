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

const ExpensesReport = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      costing_subject: "原材料 Raw Materials",
      materials: "面粉 Flour",
      sotanghon: 1250000,
      changlong: 1350000,
      batangas: 1150000,
      iloilo: 1200000,
      metro_huafei: 1300000,
    },
    {
      costing_subject: "原材料 Raw Materials",
      materials: "油 Oil",
      sotanghon: 980000,
      changlong: 1050000,
      batangas: 920000,
      iloilo: 950000,
      metro_huafei: 1000000,
    },
    {
      costing_subject: "原材料 Raw Materials",
      materials: "糖 Sugar",
      sotanghon: 750000,
      changlong: 800000,
      batangas: 720000,
      iloilo: 730000,
      metro_huafei: 780000,
    },
    {
      costing_subject: "包装 Packaging",
      materials: "包装袋 Plastic bags",
      sotanghon: 450000,
      changlong: 480000,
      batangas: 430000,
      iloilo: 440000,
      metro_huafei: 470000,
    },
    {
      costing_subject: "包装 Packaging",
      materials: "纸箱 Cartons",
      sotanghon: 680000,
      changlong: 720000,
      batangas: 650000,
      iloilo: 670000,
      metro_huafei: 700000,
    },
    {
      costing_subject: "劳动力 Labor",
      materials: "工资 Wages",
      sotanghon: 2500000,
      changlong: 2700000,
      batangas: 2400000,
      iloilo: 2450000,
      metro_huafei: 2600000,
    },
    {
      costing_subject: "劳动力 Labor",
      materials: "福利 Benefits",
      sotanghon: 850000,
      changlong: 900000,
      batangas: 820000,
      iloilo: 830000,
      metro_huafei: 880000,
    },
    {
      costing_subject: "能源 Energy",
      materials: "电费 Electricity",
      sotanghon: 1800000,
      changlong: 1950000,
      batangas: 1750000,
      iloilo: 1780000,
      metro_huafei: 1900000,
    },
    {
      costing_subject: "能源 Energy",
      materials: "水费 Water",
      sotanghon: 520000,
      changlong: 550000,
      batangas: 500000,
      iloilo: 510000,
      metro_huafei: 540000,
    },
    {
      costing_subject: "维护 Maintenance",
      materials: "设备维修 Equipment Repair",
      sotanghon: 930000,
      changlong: 980000,
      batangas: 900000,
      iloilo: 920000,
      metro_huafei: 950000,
    },
    {
      costing_subject: "维护 Maintenance",
      materials: "清洁 Cleaning",
      sotanghon: 380000,
      changlong: 400000,
      batangas: 360000,
      iloilo: 370000,
      metro_huafei: 390000,
    },
    {
      costing_subject: "运输 Transportation",
      materials: "运费 Shipping",
      sotanghon: 1450000,
      changlong: 1550000,
      batangas: 1400000,
      iloilo: 1420000,
      metro_huafei: 1500000,
    },
    {
      costing_subject: "运输 Transportation",
      materials: "燃料 Fuel",
      sotanghon: 780000,
      changlong: 830000,
      batangas: 750000,
      iloilo: 760000,
      metro_huafei: 810000,
    },
    {
      costing_subject: "管理 Administration",
      materials: "办公用品 Office Supplies",
      sotanghon: 320000,
      changlong: 340000,
      batangas: 310000,
      iloilo: 315000,
      metro_huafei: 330000,
    },
    {
      costing_subject: "管理 Administration",
      materials: "软件许可 Software Licenses",
      sotanghon: 650000,
      changlong: 690000,
      batangas: 630000,
      iloilo: 640000,
      metro_huafei: 670000,
    },
  ];

  const columns = [
    {
      name: "成本类别 Costing Subject ",
      selector: (row) => row.costing_subject,
    },
    {
      name: "成本名称 Expenses",
      selector: (row) => row.materials,
    },
    {
      name: "Sotanghon",
      selector: (row) => row.sotanghon,
    },
    {
      name: "Changlong",
      selector: (row) => row.changlong,
    },
    {
      name: "Batangas",
      selector: (row) => row.batangas,
    },
    {
      name: "Iloilo",
      selector: (row) => row.iloilo,
    },
    {
      name: "Metro Haufei",
      selector: (row) => row.metro_huafei,
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
            <span>Expenses Type</span>
            <select name="" id="" className="form-select">
              <option value="" selected disabled>
                Select Expenses Type
              </option>
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

export default ExpensesReport;
