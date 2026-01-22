import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { useNavigate } from "react-router-dom";

const ReportsSupplier = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [payable, setPayable] = useState([]);
  function formatDatetime(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  const sampleData = [
    {
      transaction_id: "TXN2001",
      mode_of_payment: "Credit Card",
      invoice_date: "2024-08-01",
      vendor: "Vendor A",
      due_date: "2024-09-01",
      quantity: 10,
      total_value: "₱50,000.00",
    },
    {
      transaction_id: "TXN2002",
      mode_of_payment: "Bank Transfer",
      invoice_date: "2024-08-02",
      vendor: "Vendor B",
      due_date: "2024-09-02",
      quantity: 15,
      total_value: "₱75,000.00",
    },
    {
      transaction_id: "TXN2003",
      mode_of_payment: "Cash",
      invoice_date: "2024-08-03",
      vendor: "Vendor C",
      due_date: "2024-09-03",
      quantity: 8,
      total_value: "₱40,000.00",
    },
    {
      transaction_id: "TXN2004",
      mode_of_payment: "Credit Card",
      invoice_date: "2024-08-04",
      vendor: "Vendor D",
      due_date: "2024-09-04",
      quantity: 20,
      total_value: "₱100,000.00",
    },
    {
      transaction_id: "TXN2005",
      mode_of_payment: "Bank Transfer",
      invoice_date: "2024-08-05",
      vendor: "Vendor E",
      due_date: "2024-09-05",
      quantity: 12,
      total_value: "₱60,000.00",
    },
    {
      transaction_id: "TXN2006",
      mode_of_payment: "Cash",
      invoice_date: "2024-08-06",
      vendor: "Vendor F",
      due_date: "2024-09-06",
      quantity: 25,
      total_value: "₱125,000.00",
    },
    {
      transaction_id: "TXN2007",
      mode_of_payment: "Credit Card",
      invoice_date: "2024-08-07",
      vendor: "Vendor G",
      due_date: "2024-09-07",
      quantity: 18,
      total_value: "₱90,000.00",
    },
    {
      transaction_id: "TXN2008",
      mode_of_payment: "Bank Transfer",
      invoice_date: "2024-08-08",
      vendor: "Vendor H",
      due_date: "2024-09-08",
      quantity: 14,
      total_value: "₱70,000.00",
    },
    {
      transaction_id: "TXN2009",
      mode_of_payment: "Cash",
      invoice_date: "2024-08-09",
      vendor: "Vendor I",
      due_date: "2024-09-09",
      quantity: 30,
      total_value: "₱150,000.00",
    },
    {
      transaction_id: "TXN2010",
      mode_of_payment: "Credit Card",
      invoice_date: "2024-08-10",
      vendor: "Vendor J",
      due_date: "2024-09-10",
      quantity: 22,
      total_value: "₱110,000.00",
    },
    {
      transaction_id: "TXN2011",
      mode_of_payment: "Bank Transfer",
      invoice_date: "2024-08-11",
      vendor: "Vendor K",
      due_date: "2024-09-11",
      quantity: 17,
      total_value: "₱85,000.00",
    },
    {
      transaction_id: "TXN2012",
      mode_of_payment: "Cash",
      invoice_date: "2024-08-12",
      vendor: "Vendor L",
      due_date: "2024-09-12",
      quantity: 28,
      total_value: "₱140,000.00",
    },
    {
      transaction_id: "TXN2013",
      mode_of_payment: "Credit Card",
      invoice_date: "2024-08-13",
      vendor: "Vendor M",
      due_date: "2024-09-13",
      quantity: 11,
      total_value: "₱55,000.00",
    },
    {
      transaction_id: "TXN2014",
      mode_of_payment: "Bank Transfer",
      invoice_date: "2024-08-14",
      vendor: "Vendor N",
      due_date: "2024-09-14",
      quantity: 19,
      total_value: "₱95,000.00",
    },
    {
      transaction_id: "TXN2015",
      mode_of_payment: "Cash",
      invoice_date: "2024-08-15",
      vendor: "Vendor O",
      due_date: "2024-09-15",
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
      name: "Mode of Payment",
      selector: (row) => row.mode_of_payment,
    },
    {
      name: "Invoice Date",
      selector: (row) => row.invoice_date,
    },

    {
      name: "Vendor",
      selector: (row) => row.vendor,
    },
    {
      name: "Due Date",
      selector: (row) => row.due_date,
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

  //   filter
  // search
  const filteredItems = sampleData.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();

    switch (filterColumn) {
      case "transaction_no":
        return item.transaction_id?.toLowerCase().includes(searchLower);
      case "tracking_no":
        return item.tracking_number?.toLowerCase().includes(searchLower);
      case "receiving_warehouse":
        return item.warehouse?.name?.toLowerCase().includes(searchLower);
      case "date_created":
        return formatDatetime(item.createdAt)
          ?.toLowerCase()
          .includes(searchLower);
      case "payment_method":
        return item.MOP?.toLowerCase().includes(searchLower);
      case "vendor_id":
        return item.vendor?.company_name?.toLowerCase().includes(searchLower);
      case "due_date":
        return item.due_date?.toLowerCase().includes(searchLower);
      // case "amount":
      //   return item.amount?.toLowerCase().includes(searchLower);
      case "status":
        return item.status?.toLowerCase().includes(searchLower);
      default:
        return (
          item.transaction_id?.toLowerCase().includes(searchLower) ||
          item.warehouse?.name?.toLowerCase().includes(searchLower) ||
          item.createdAt?.toLowerCase().includes(searchLower) ||
          item.MOP?.toLowerCase().includes(searchLower) ||
          item.vendor?.company_name?.toLowerCase().includes(searchLower) ||
          item.due_date?.toLowerCase().includes(searchLower) ||
          // item.amount?.toLowerCase().includes(searchLower) ||
          item.status?.toLowerCase().includes(searchLower)
        );
    }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

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
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">PURCHASE ORDER REPORT BY SUPPLIER</span>
          {/* <span>OVERSEAS ACCOUNTS PAYABLE</span> */}
        </div>
      </div>
      <div className="container-fluid mt-3 p-0">
        <div className="row p-2 mx-auto">
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3>Total Payable</h3>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount text-danger">9,000</h1>
                <span className="text-secondary ">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3>Total Paid</h3>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount text-primary">85,000</h1>
                <span className="text-secondary ">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3>Total Value</h3>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount">94,000</h1>
                <span className="text-secondary ">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="row mx-auto">
          <div className="col-sm mb-2">
            <label htmlFor="">Mode of Payment</label>
            <select name="" id="" className="form-select p-2">
              <option value="" selected disabled>
                Select Mode of Payment
              </option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Account">Account</option>
            </select>
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="">Due Date</label>
            <select name="" id="" className="form-select p-2">
              <option value="" selected disabled>
                Select Due Date
              </option>
              <option value="Paid">Paid</option>
              <option value="Between 5-10 days">Between 5-10 days</option>
              <option value="Above 10 days">Above 10 days</option>
            </select>
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="">Year</label>
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
            <label htmlFor="">Month</label>
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
            <button className="btn btn-secondary w-100" onClick={clearFilter}>
              Clear Filter
            </button>
          </div>
        </div>
      </div>
      <div className="w-100 mt-3 container-fluid">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
                  filterColumn === "tracking_no" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("tracking_no")}
              >
                Tracking No.
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

export default ReportsSupplier;
