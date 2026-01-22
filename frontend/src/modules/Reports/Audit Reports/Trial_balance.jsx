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

const TrialBalance = () => {
  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const sampleData = [
    {
      code: "#001",
      subject: "(一、资产类) Current Assets",
      beginning_total: "",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "#001-1",
      subject: "(现金) Cash Account",
      beginning_total: "₱ 10,000.00",
      addition: "₱ 20,000.00",
      deduction: "--",
      end_of_total: "₱ 30,000.00",
    },
    {
      code: "#001-2",
      subject: "(银行存款) Bank Account",
      beginning_total: "₱ 20,000.00",
      addition: "₱ 5,000.00",
      deduction: "--",
      end_of_total: "₱ 25,000.00",
    },
    {
      code: "#001-3",
      subject: "(收款支票) Collection Check",
      beginning_total: "₱ 50,000.00",
      addition: "--",
      deduction: "₱ 5,000.00",
      end_of_total: "₱ 45,000.00",
    },
    {
      code: "",
      subject: "",
      beginning_total: "₱ 80,000.00",
      addition: "₱ 25,000.00",
      deduction: "₱ 5,000.00",
      end_of_total: "₱ 100,000.00",
    },
    {
      code: "#002",
      subject: "(二、负债类) Current Liabilities",
      beginning_total: "",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "#002-1",
      subject: "(应付票据) Posted Payable Check",
      beginning_total: "₱ 45,000.00",
      addition: "--",
      deduction: "--",
      end_of_total: "₱ 45,000.00",
    },
    {
      code: "#002-2",
      subject: "(主营业务应付) Main-Business Payable",
      beginning_total: "₱ 50,000.00",
      addition: "--",
      deduction: "--",
      end_of_total: "₱ 50,000.00",
    },
    {
      code: "#002-3",
      subject: "(其他应付) Other Payable",
      beginning_total: "₱ 12,000.00",
      addition: "--",
      deduction: "--",
      end_of_total: "₱ 12,000.00",
    },
    {
      code: "",
      subject: "",
      beginning_total: "₱ 107,000.00",
      addition: "--",
      deduction: "--",
      end_of_total: "₱ 107,000.00",
    },
    {
      code: "#005",
      subject: "(五、成本类) Operating Costs",
      beginning_total: "",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "#005-1",
      subject: "(添加固定资产) Addition Fix Assets",
      beginning_total: "--",
      addition: "--",
      deduction: "--",
      end_of_total: "--",
    },
    {
      code: "#005-2",
      subject: "(主营业务应付) Main-Business Payable",
      beginning_total: "--",
      addition: "--",
      deduction: "--",
      end_of_total: "--",
    },
    {
      code: "#005-3",
      subject: "(费用) Expenses",
      beginning_total: "--",
      addition: "--",
      deduction: "--",
      end_of_total: "--",
    },
    {
      code: "",
      subject: "",
      beginning_total: "--",
      addition: "--",
      deduction: "--",
      end_of_total: "--",
    },
    {
      code: "#006",
      subject: "(六、损益类) Profit and Loss",
      beginning_total: "",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "#006-1",
      subject: "(添加固定资产) Main-Business Income",
      beginning_total: "--",
      addition: "₱ 20,000.00",
      deduction: "--",
      end_of_total: "₱ 20,000.00",
    },
    {
      code: "#006-2",
      subject: "(其他业务收入) Other Income",
      beginning_total: "--",
      addition: "--",
      deduction: "--",
      end_of_total: "--",
    },

    {
      code: "",
      subject: "",
      beginning_total: "--",
      addition: "₱ 20,000.00",
      deduction: "--",
      end_of_total: "₱ 20,000.00",
    },
    {
      code: "",
      subject: "",
      beginning_total: "",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "",
      subject: "",
      beginning_total: "(₱ 27,000.00)",
      addition: "",
      deduction: "",
      end_of_total: "",
    },
    {
      code: "",
      subject: "",
      beginning_total: "Trial Balance",
      addition: "Unbalance",
      deduction: "",
      end_of_total: "",
    },
  ];

  const columns = [
    {
      name: "Code",
      selector: (row) => row.code,
    },
    {
      name: "Subject",
      selector: (row) => row.subject,
    },
    {
      name: "Beginning Total",
      selector: (row) => row.beginning_total,
    },
    {
      name: "Addition",
      selector: (row) => row.addition,
    },
    {
      name: "Dededuction",
      selector: (row) => row.deduction,
    },
    {
      name: "End of Total",
      selector: (row) => row.end_of_total,
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

      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
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

export default TrialBalance;
