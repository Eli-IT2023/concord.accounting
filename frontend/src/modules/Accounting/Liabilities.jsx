import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router";

const Liabilities = () => {
  const navigate = useNavigate();
  const [LiabilityData, setLiabilityData] = useState([]);
  const [filteredLiability, setFilteredLiability] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLiability = () => {
    axios
      .get(BASE_URL + "/liability/LiabilityData")
      .then((res) => {
        setLiabilityData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const calculateBalance = (loan) => {
    return loan.loan_payments
      .filter((payment) => payment.status === "Unpaid")
      .reduce((total, payment) => total + payment.amortization, 0)
      .toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  };

  const columns = [
    {
      name: "Liability Number",
      selector: (row) => row.reference,
    },
    {
      name: "Liability Type",
      selector: (row) => row.type,
    },
    {
      name: "Name",
      selector: (row) =>
        `${row.masterlist.fname} ${row.masterlist.mname} ${row.masterlist.lname}`,
    },
    {
      name: "Liability Amount",
      selector: (row) =>
        row.total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Interest Per (%)",
      selector: (row) => row.interest_percent,
    },
  ];

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    const filtered = LiabilityData.filter((data) => {
      const fullName =
        `${data.masterlist.fname} ${data.masterlist.mname} ${data.masterlist.lname}`.toLowerCase();
      const loanAmountString = data.total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const initialPercentString = data.interest_percent.toString();

      return (
        data.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase()) ||
        loanAmountString.includes(searchQuery) ||
        initialPercentString.includes(searchQuery)
      );
    });
    setFilteredLiability(filtered);
  }, [searchQuery, LiabilityData]);

  useEffect(() => {
    fetchLiability();
  }, []);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">LIABILITY MANAGEMENT</span>
          <span>LIABILITIES ACCOUNT</span>
        </div>
        <Link
          to="/accounting/liabilities1"
          className="btn btn-primary d-flex flex-row align-items-center title-button"
        >
          Go to Liabilities
        </Link>
        <div>
          <Link
            to="/accounting/create-liability"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </Link>
        </div>
      </div>
      <div className="container-fluid mt-4 p-0">
        <div className="row mx-auto">
          <div className="col-sm mb-2">
            <span>Loan Type</span>
            <select name="" id="" className="form-select">
              <option value="" selected disabled>
                Select Loan Type
              </option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Employee Loan">Employee Loan</option>
              <option value="Bank Loan">Bank Loan</option>
              <option value="Vendor Loan">Vendor Loan</option>
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
        <div className="input-group w-50">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={filteredLiability}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div>
    </div>
  );
};

export default Liabilities;
