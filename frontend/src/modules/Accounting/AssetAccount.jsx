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

const AssetAccount = () => {
  const navigate = useNavigate();
  const [assetAccountData, setAssetAccountData] = useState([]);
  const [filteredAssetAccount, setFilteredAssetAccount] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAssetAccount = () => {
    axios
      .get(BASE_URL + "/assetAccount/dataAssetAccount")
      .then((res) => {
        setAssetAccountData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // const calculateBalance = (lend) => {
  //   return lend.lend_payments
  //     .filter((payment) => payment.status === "Unpaid")
  //     .reduce((total, payment) => total + payment.amortization, 0)
  //     .toLocaleString("en-US", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     });
  // };

  const columns = [
    {
      name: "Asset Account Number",
      selector: (row) => row.reference,
    },
    {
      name: "Name",
      selector: (row) =>
        `${row.masterlist.fname} ${row.masterlist.mname} ${row.masterlist.lname}`,
    },
    {
      name: "Amount",
      selector: (row) =>
        row.total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Release Date",
      selector: (row) => {
        const date = new Date(row.release_date);
        return new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
        }).format(date);
      },
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
    const filtered = assetAccountData.filter((data) => {
      const fullName =
        `${data.masterlist.fname} ${data.masterlist.mname} ${data.masterlist.lname}`.toLowerCase();
      const loanAmountString = data.total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const initialPercentString = data.interest_percent.toString();

      return (
        data.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase()) ||
        loanAmountString.includes(searchQuery) ||
        initialPercentString.includes(searchQuery)
      );
    });
    setFilteredAssetAccount(filtered);
  }, [searchQuery, assetAccountData]);

  // const handlePayLending = (row) => {
  //   navigate(`/accounting/payLend/${row.lend_id}`);
  // };

  useEffect(() => {
    fetchAssetAccount();
  }, []);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">ASSET ACCOUNT</span>
          <span>Asset</span>
        </div>
        <div>
          <Link
            to="/accounting/create-asset-account"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </Link>
        </div>
      </div>
      <div className="container-fluid mt-4 p-0">
        <div className="row mx-auto">
          <div className="col-sm mb-2">
            <span>Asset Account Type</span>
            <select name="" id="" className="form-select">
              <option value="" selected disabled>
                Select Type
              </option>
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
          data={filteredAssetAccount}
          customStyles={customStyles}
          pagination
          className="dataTable"
          // onRowClicked={handlePayLending}
        />
      </div>
    </div>
  );
};

export default AssetAccount;
