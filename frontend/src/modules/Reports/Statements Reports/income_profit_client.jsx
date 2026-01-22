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

const IncomeProfitClient = () => {
  // modal
  // add show modal
  const [showModal, setShowModal] = useState(false);
  const handleShow = () => {
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  // filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      year: 2021,
      metro_huafei: 5000,
      self_produced: 3000,
      outsourcing: 2500,
      sotanghon: 1500,
      lawang_bato: 4500,
      batangas: 3200,
      iloilo: 2800,
    },
    {
      year: 2022,
      metro_huafei: 4500,
      self_produced: 2000,
      outsourcing: -1200,
      sotanghon: 3500,
      lawang_bato: 4200,
      batangas: 3100,
      iloilo: 2700,
    },
    {
      year: 2023,
      metro_huafei: 7000,
      self_produced: -500,
      outsourcing: 2300,
      sotanghon: 1500,
      lawang_bato: 4100,
      batangas: 2900,
      iloilo: 2500,
    },
    {
      year: 2024,
      metro_huafei: -3000,
      self_produced: 2500,
      outsourcing: 1000,
      sotanghon: 2000,
      lawang_bato: 3800,
      batangas: 3000,
      iloilo: 2600,
    },
    {
      year: 2025,
      metro_huafei: 6000,
      self_produced: 4000,
      outsourcing: 2700,
      sotanghon: 3200,
      lawang_bato: 4900,
      batangas: 3300,
      iloilo: 2900,
    },
    {
      year: 2026,
      metro_huafei: 5500,
      self_produced: 3000,
      outsourcing: 1200,
      sotanghon: 2500,
      lawang_bato: 4600,
      batangas: 2800,
      iloilo: 2600,
    },
    {
      year: 2027,
      metro_huafei: 5200,
      self_produced: 3500,
      outsourcing: 1600,
      sotanghon: 2700,
      lawang_bato: 4200,
      batangas: 2900,
      iloilo: 2500,
    },
    {
      year: 2028,
      metro_huafei: -2000,
      self_produced: 3000,
      outsourcing: 1800,
      sotanghon: 2400,
      lawang_bato: 4000,
      batangas: 2600,
      iloilo: 2700,
    },
    {
      year: 2029,
      metro_huafei: 5700,
      self_produced: 3200,
      outsourcing: 2100,
      sotanghon: 3000,
      lawang_bato: 4500,
      batangas: 3500,
      iloilo: 2900,
    },
    {
      year: 2030,
      metro_huafei: 5300,
      self_produced: 4000,
      outsourcing: 2500,
      sotanghon: 3500,
      lawang_bato: 4700,
      batangas: 3300,
      iloilo: 2800,
    },
    {
      year: 2031,
      metro_huafei: 5600,
      self_produced: 3100,
      outsourcing: 2200,
      sotanghon: 3300,
      lawang_bato: 4600,
      batangas: 3400,
      iloilo: 2500,
    },
    {
      year: 2032,
      metro_huafei: 5100,
      self_produced: -1000,
      outsourcing: 2000,
      sotanghon: 3100,
      lawang_bato: 4200,
      batangas: 2900,
      iloilo: 2300,
    },
    {
      year: 2033,
      metro_huafei: 6000,
      self_produced: 3500,
      outsourcing: 2800,
      sotanghon: 3300,
      lawang_bato: 4900,
      batangas: 3600,
      iloilo: 3000,
    },
    {
      year: 2034,
      metro_huafei: 5400,
      self_produced: 2800,
      outsourcing: 2100,
      sotanghon: 3200,
      lawang_bato: 4700,
      batangas: 3100,
      iloilo: 2500,
    },
    {
      year: 2035,
      metro_huafei: 5900,
      self_produced: 3700,
      outsourcing: 2600,
      sotanghon: 3400,
      lawang_bato: 4600,
      batangas: 3300,
      iloilo: 2700,
    },
  ];

  const columns = [
    {
      name: "Year/Branches",
      selector: (row) => row.year,
    },
    {
      name: "Metro Huafei",
      selector: (row) => row.metro_huafei,
    },
    {
      name: "自产",
      selector: (row) => row.self_produced,
    },
    {
      name: "外购",
      selector: (row) => row.outsourcing,
    },
    {
      name: "Sotanghon",
      selector: (row) => row.sotanghon,
    },
    {
      name: "Lawang Bato",
      selector: (row) => row.lawang_bato,
    },
    {
      name: "Batangas",
      selector: (row) => row.batangas,
    },

    {
      name: "Iloilo",
      selector: (row) => row.iloilo,
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

  const modalColumns = [
    {
      name: "Day",
      selector: (row) => row.day,
    },
    {
      name: "January",
      selector: (row) => row.january,
    },
    {
      name: "February",
      selector: (row) => row.february,
    },
    {
      name: "March",
      selector: (row) => row.march,
    },
    {
      name: "April",
      selector: (row) => row.april,
    },
    {
      name: "May",
      selector: (row) => row.may,
    },
    {
      name: "June",
      selector: (row) => row.june,
    },

    {
      name: "July",
      selector: (row) => row.july,
    },
    {
      name: "August",
      selector: (row) => row.august,
    },
    {
      name: "September",
      selector: (row) => row.september,
    },
    {
      name: "October",
      selector: (row) => row.october,
    },
    {
      name: "November",
      selector: (row) => row.november,
    },
    {
      name: "December",
      selector: (row) => row.december,
    },
  ];

  const modalSampleData = [
    {
      day: 1,
      january: 50000,
      february: 45000,
      march: 47000,
      april: 52000,
      may: 48000,
      june: 53000,
      july: 49000,
      august: 51000,
      september: 46000,
      october: 54000,
      november: 50000,
      december: 55000,
    },
    {
      day: 2,
      january: 52000,
      february: 43000,
      march: 46000,
      april: 50000,
      may: 47000,
      june: 54000,
      july: 51000,
      august: 52000,
      september: 48000,
      october: 53000,
      november: 49000,
      december: 56000,
    },
    {
      day: 3,
      january: 54000,
      february: 44000,
      march: 48000,
      april: 51000,
      may: 46000,
      june: 55000,
      july: 50000,
      august: 53000,
      september: 47000,
      october: 52000,
      november: 51000,
      december: 57000,
    },
    {
      day: 4,
      january: 53000,
      february: 45000,
      march: 47000,
      april: 53000,
      may: 49000,
      june: 54000,
      july: 52000,
      august: 51000,
      september: 46000,
      october: 55000,
      november: 50000,
      december: 58000,
    },
    {
      day: 5,
      january: 55000,
      february: 47000,
      march: 49000,
      april: 52000,
      may: 48000,
      june: 56000,
      july: 53000,
      august: 50000,
      september: 45000,
      october: 54000,
      november: 52000,
      december: 59000,
    },
    {
      day: 6,
      january: 54000,
      february: 46000,
      march: 48000,
      april: 54000,
      may: 47000,
      june: 55000,
      july: 52000,
      august: 53000,
      september: 49000,
      october: 56000,
      november: 51000,
      december: 60000,
    },
    {
      day: 7,
      january: 56000,
      february: 45000,
      march: 47000,
      april: 53000,
      may: 46000,
      june: 57000,
      july: 54000,
      august: 52000,
      september: 48000,
      october: 55000,
      november: 50000,
      december: 61000,
    },
    {
      day: 8,
      january: 55000,
      february: 48000,
      march: 49000,
      april: 52000,
      may: 50000,
      june: 56000,
      july: 53000,
      august: 54000,
      september: 47000,
      october: 54000,
      november: 52000,
      december: 62000,
    },
    {
      day: 9,
      january: 57000,
      february: 47000,
      march: 48000,
      april: 51000,
      may: 49000,
      june: 58000,
      july: 55000,
      august: 53000,
      september: 46000,
      october: 53000,
      november: 51000,
      december: 63000,
    },
    {
      day: 10,
      january: 56000,
      february: 46000,
      march: 47000,
      april: 54000,
      may: 48000,
      june: 57000,
      july: 54000,
      august: 52000,
      september: 45000,
      october: 55000,
      november: 50000,
      december: 64000,
    },
    {
      day: 11,
      january: 58000,
      february: 49000,
      march: 50000,
      april: 53000,
      may: 51000,
      june: 59000,
      july: 55000,
      august: 54000,
      september: 48000,
      october: 56000,
      november: 53000,
      december: 65000,
    },
    {
      day: 12,
      january: 57000,
      february: 48000,
      march: 49000,
      april: 52000,
      may: 50000,
      june: 58000,
      july: 54000,
      august: 53000,
      september: 47000,
      october: 55000,
      november: 52000,
      december: 66000,
    },
    {
      day: 13,
      january: 59000,
      february: 47000,
      march: 48000,
      april: 54000,
      may: 49000,
      june: 60000,
      july: 56000,
      august: 52000,
      september: 46000,
      october: 54000,
      november: 51000,
      december: 67000,
    },
    {
      day: 14,
      january: 58000,
      february: 46000,
      march: 47000,
      april: 53000,
      may: 48000,
      june: 59000,
      july: 55000,
      august: 51000,
      september: 45000,
      october: 53000,
      november: 50000,
      december: 68000,
    },
    {
      day: 15,
      january: 60000,
      february: 49000,
      march: 50000,
      april: 52000,
      may: 51000,
      june: 61000,
      july: 57000,
      august: 54000,
      september: 48000,
      october: 56000,
      november: 53000,
      december: 69000,
    },
  ];

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            SALES INCOME PROFIT BY CLIENT (销售量---单位)
          </span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
        <div>
          {/* <Link
            to="/sales/local-bulk-collection"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            Bulk Collection
          </Link> */}
          <button className="btn btn-primary" onClick={handleShow}>
            Modal
          </button>
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
        {/* <span className="text-dark text-start fs-2 border-bottom">
          YI LU JIA 公司销售利润报表
        </span> */}
        <DataTable
          columns={columns}
          data={filteredItems}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div>
      <Modal show={showModal} onHide={handleClose} size="xl" backdrop="static">
        <Modal.Header closeButton className="border-0">
          <Modal.Title>2021 Metro Huafei</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <div className="row">
              <div className="col-sm mb-2">
                <span>Branch</span>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Branch
                  </option>
                </select>
              </div>
              <div className="col-sm mb-2 d-flex align-items-end">
                <button className="btn btn-outline-success w-100">
                  {" "}
                  <i className="fa-solid fa-upload me-1"></i> Export
                </button>
              </div>
              <div className="col-sm"></div>

              <div className="col-sm mb-2 d-flex align-items-end">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  // onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className="w-100 mt-3 container-fluid">
              {/* <span className="text-dark text-start fs-2 border-bottom">
          YI LU JIA 公司销售利润报表
        </span> */}
              <DataTable
                columns={modalColumns}
                data={modalSampleData}
                customStyles={customStyles}
                pagination
                className="dataTable"
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default IncomeProfitClient;
