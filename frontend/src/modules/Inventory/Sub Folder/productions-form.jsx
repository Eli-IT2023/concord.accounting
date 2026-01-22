import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import { Form, FloatingLabel } from "react-bootstrap";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
import NewProductionCreate from "./NewProductionCreate";
import OldProductionCreate from "./OldProductionCreate";
const ProductionsForm = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const [selectedValue, setSelectedValue] = useState("NEW");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {/* {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
        <div className="d-flex flex-row ">
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
        </div>
      )} */}

      {selectedValue === "OLD" ? (
        <OldProductionCreate authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewProductionCreate authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default ProductionsForm;
