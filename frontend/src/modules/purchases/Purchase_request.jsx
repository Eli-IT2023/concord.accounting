import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import "../../assets/css/lionchem.css";

const Purchase_request = () => {
  // ### resets ###
  const navigate = useNavigate();
  // ### reset ends ###

  // ### Filter ###
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterStatus, setFilterStatus] = useState("Active");

  const handleFilter = () => {};

  const handleClearFilter = () => {};

  const handleSearch = (value) => {};

  // ### Filter end ###

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">PURCHASE REQUEST</span>
          {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
        </div>

        <div>
          <button
            onClick={() => navigate("/purchases/create-purchase-request")}
            className="btn btn-primary d-flex align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </button>
        </div>
      </div>

      <div className="container-fluid mt-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
            >
              <option disabled value="">
                Select Status
              </option>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-auto ">
            <button
              //   onClick={handleFilter}
              type="button"
              className="btn btn-dark"
            >
              Apply Filter
            </button>
          </div>

          <div className="col-auto ">
            <button
              onClick={handleClearFilter}
              className="btn btn-light border"
            >
              Clear Filter
            </button>
          </div>

          <div className="col-md-3 ms-auto">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
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
                      filterColumn === "all" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("all")}
                  >
                    All
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "pr_no" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("pr_no")}
                  >
                    PR NO.
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "requestor" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("requestor")}
                  >
                    Requestor
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_needed" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_needed")}
                  >
                    Date Needed
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchase_request;
