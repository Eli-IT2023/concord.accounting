import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { useParams, useNavigate } from "react-router-dom";

const LoanInformation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loanData, setLoanData] = useState([]);
  const [filteredLoanData, setFilteredLoanData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLoanData = () => {
    axios
      .get(BASE_URL + "/loan/LoanDataInformation", {
        params: {
          id,
        },
      })
      .then((res) => {
        setLoanData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // const calculateBalance = (loan) => {
  //   return loan.loan_payments
  //     .filter((payment) => payment.status === "Unpaid")
  //     .reduce((total, payment) => total + payment.amortization, 0)
  //     .toLocaleString("en-US", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     });
  // };

  const columns = [
    {
      name: "Loan Number",
      selector: (row) => row.reference,
    },
    {
      name: "Loan Type",
      selector: (row) => row.type,
    },
    {
      name: "Name",
      selector: (row) =>
        `${row.masterlist.fname} ${row.masterlist.mname} ${row.masterlist.lname}`,
    },
    {
      name: "Loan Amount",
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
    // {
    //   name: "Balance",
    //   selector: (row) => calculateBalance(row),
    // },
  ];

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    const filtered = loanData.filter((data) => {
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
    setFilteredLoanData(filtered);
  }, [searchQuery, loanData]);

  const handlePayLoan = (row) => {
    navigate(`/accounting/payloan/${row.loan_id}`);
  };

  useEffect(() => {
    fetchLoanData();
  }, []);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          {loanData.length > 0 && loanData[0].loan_label_mother && (
            <>
              <span className="fs-3">{`Subject: ${loanData[0].loan_label_mother.label.label_name} - ${loanData[0].loan_label_mother.label.sub_label_name}`}</span>
              <span>{`Account: ${loanData[0].loan_label_mother.account_list.bank_name} - ${loanData[0].loan_label_mother.account_list.account_name}`}</span>
            </>
          )}
        </div>
        <div>
          {/* <Link
            to="/accounting/create-loan"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </Link> */}
        </div>
      </div>
      {/* <div className="container-fluid mt-4 p-0">
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
      </div> */}
      <div className="w-100 mt-4 mb-2 container-fluid">
        <div className="input-group w-100">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {/* <button
            type="button"
            className="btn btn-outline-secondary dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa-solid fa-sliders"></i>
          </button> */}
          {/* <ul className="dropdown-menu dropdown-menu-end">
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
          </ul> */}
        </div>
      </div>
      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={filteredLoanData}
          customStyles={customStyles}
          pagination
          className="dataTable"
          onRowClicked={handlePayLoan}
        />
      </div>
    </div>
  );
};

export default LoanInformation;
