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

const ReceivingReport = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [vendors_db, setVendors_db] = useState([]);
  const fetchVendorsData = () => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((res) => {
        setVendors_db(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchVendorsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sampleData = [
    {
      vendor: "Vendor A",
      on_hand: 120,
      last_transaction: "2024-07-15",
      total_costing: "₱ 150,000.00",
    },
    {
      vendor: "Vendor B",
      on_hand: 85,
      last_transaction: "2024-07-20",
      total_costing: "₱ 95,000.00",
    },
    {
      vendor: "Vendor C",
      on_hand: 200,
      last_transaction: "2024-07-22",
      total_costing: "₱ 300,000.00",
    },
    {
      vendor: "Vendor D",
      on_hand: 45,
      last_transaction: "2024-07-18",
      total_costing: "₱ 50,000.00",
    },
    {
      vendor: "Vendor E",
      on_hand: 300,
      last_transaction: "2024-07-25",
      total_costing: "₱ 450,000.00",
    },
    {
      vendor: "Vendor F",
      on_hand: 75,
      last_transaction: "2024-07-19",
      total_costing: "₱ 80,000.00",
    },
    {
      vendor: "Vendor G",
      on_hand: 150,
      last_transaction: "2024-07-21",
      total_costing: "₱ 175,000.00",
    },
    {
      vendor: "Vendor H",
      on_hand: 95,
      last_transaction: "2024-07-16",
      total_costing: "₱ 110,000.00",
    },
    {
      vendor: "Vendor I",
      on_hand: 60,
      last_transaction: "2024-07-17",
      total_costing: "₱ 70,000.00",
    },
    {
      vendor: "Vendor J",
      on_hand: 220,
      last_transaction: "2024-07-24",
      total_costing: "₱ 275,000.00",
    },
    {
      vendor: "Vendor K",
      on_hand: 130,
      last_transaction: "2024-07-23",
      total_costing: "₱ 160,000.00",
    },
    {
      vendor: "Vendor L",
      on_hand: 180,
      last_transaction: "2024-07-26",
      total_costing: "₱ 225,000.00",
    },
    {
      vendor: "Vendor M",
      on_hand: 110,
      last_transaction: "2024-07-28",
      total_costing: "₱ 135,000.00",
    },
    {
      vendor: "Vendor N",
      on_hand: 95,
      last_transaction: "2024-07-29",
      total_costing: "₱ 115,000.00",
    },
    {
      vendor: "Vendor O",
      on_hand: 160,
      last_transaction: "2024-07-30",
      total_costing: "₱ 200,000.00",
    },
  ];

  const columns = [
    {
      name: "Vendor",
      selector: (row) => row.vendor,
    },
    {
      name: "On Hand",
      selector: (row) => row.on_hand,
    },
    {
      name: "Last Transaction",
      selector: (row) => row.last_transaction,
    },
    {
      name: "Total Costing",
      selector: (row) => row.total_costing,
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
          <span className="fs-3">RECEIVING REPORT</span>
          {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
        </div>
        <div>
          <Link
            to=""
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            Create
          </Link>
        </div>
      </div>
      <div className="container-fluid mt-4 p-0">
        <div className="row mx-auto">
          <div className="col-sm mb-2">
            <span>Vendor</span>
            <select name="" id="" className="form-select">
              <option value="" selected disabled>
                Select Vendor
              </option>
              {vendors_db.map((data) => (
                <option key={data.id} value={data.id}>
                  {data.company_name
                    ? data.company_name
                    : `${data.fname} ${data.lname}`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm mb-2">
            <span>From</span>
            <input type="date" name="" id="" className="form-control" />
          </div>
          <div className="col-sm mb-2">
            <span>To</span>
            <input type="date" name="" id="" className="form-control" />
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

export default ReceivingReport;
