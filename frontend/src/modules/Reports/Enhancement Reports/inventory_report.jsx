import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../assets/css/style.css";
import DatePicker from "react-datepicker";
import NoAccess from "../../../assets/img/NoAccess.png";

import OldInventoryReport from "./components/inventory_report_old";
import NewInventoryReport from "./components/inventory_report_new";
const InventoryReport1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          {/* <div className="d-flex flex-row ">
            <div className="">
              <input
                type="radio"
                id="old"
                name=""
                value="OLD"
                checked={selectedValue === "OLD"}
                onChange={handleChange}
              />
              <label htmlFor="old">OLD</label>
            </div>
            <div className="mx-4">
              <input
                type="radio"
                id="new"
                name=""
                value="NEW"
                checked={selectedValue === "NEW"}
                onChange={handleChange}
              />
              <label htmlFor="new">NEW</label>
            </div>
          </div> */}

          {selectedValue === "OLD" ? (
            <OldInventoryReport />
          ) : selectedValue === "NEW" ? (
            <NewInventoryReport />
          ) : null}
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default InventoryReport1;
