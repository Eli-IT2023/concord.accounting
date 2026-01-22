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

const PayableReport = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      aged_payable: "ELI Company",
      total: "50,000.00",
    },
  ];

  const columns = [
    {
      name: "Current Aged Payable",
      selector: (row) => row.aged_payable,
    },
    {
      name: "50,000.00",
      selector: (row) => row.total,
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) =>
        row.code === "#001" ||
        row.code === "#002" ||
        row.code === "#005" ||
        row.code === "#006",
      style: {
        backgroundColor: "#C3DCFE",
        fontWeight: "bold",
        fontSize: "1rem",
        "&:hover": {
          backgroundColor: "#C3DCFE", // Same background color on hover
        },
      },
    },
    {
      when: (row) =>
        row.beginning_total === "Trial Balance" || row.addition === "Unbalance",
      style: {
        color: "red",
        fontWeight: "bold",
      },
    },
  ];

  //   filter

  const clearFilter = () => {
    setFilterColumn("");
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">TRIAL BALANCE</span>
          <div
            className="fs-5 text-secondary"
            style={{ textDecoration: "Underline" }}
          >
            As of 08/15/2024
          </div>
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
            <input type="date" name="" id="" className="form-control" />
          </div>
          <div className="col-sm mb-2">
            <span>Month</span>

            <input type="date" name="" id="" className="form-control" />
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

      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <div className="d-flex flex-row justify-content-between">
          <span className="fs-5 text-secondary">Aged Payable</span>
          <span className="fs-5 text-secondary">As of 08/15/2024</span>
        </div>
        <DataTable
          columns={columns}
          data={sampleData}
          customStyles={customStyles}
          conditionalRowStyles={conditionalRowStyles} // Apply conditional row styles
          className="dataTable"
        />
      </div>
    </div>
  );
};

export default PayableReport;
