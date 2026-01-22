import React, { useState, useEffect } from "react";
import { FloatingLabel, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import Select from "react-select";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
import OldProductionUpdate from "./OldProductionUpdate";
import NewProductionUpdate from "./NewProductionUpdate";

function ProductionView({ authrztn }) {
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
        <OldProductionUpdate authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewProductionUpdate authrztn={authrztn} />
      ) : null}
    </div>
  );
}

export default ProductionView;
