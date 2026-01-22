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

const IncomeProfit = () => {
  const sampleData = [
    {
      income_profit: "Sales",
      amount: "2492042",
    },
  ];
  const columns = [
    {
      name: "Income Profit (收入利润)",
      selector: (row) => row.income_profit,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
    },
  ];

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">INCOME PROFIT REPORT (收入利润)</span>
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
      <div className="w-100 mt-5 container-fluid">
        <p className="text-end text-secondary">As of 08/12/2024</p>
      </div>
      {/* data table */}
      <div className="w-100 container-fluid">
        <DataTable
          columns={columns}
          data={sampleData}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div>
    </div>
  );
};

export default IncomeProfit;
