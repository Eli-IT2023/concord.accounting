import React, { useState, useEffect } from "react";
import { ToggleButton } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import {
  useNavigate,
  useParams,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import swal from "sweetalert";
import BulkPayable from "./BulkPayable";
import { customStyles } from "../../../assets/table-style";
import DataTable from "react-data-table-component";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";

// import old_view_bulk_payable from "../component/old_view_bulk_payable";

import OldViewBulkPayable from "../component/old_view_bulk_payable";
import NewViewBulkPayable from "../component/new_view_bulk_payable";

const ViewBulkPayable = ({
  authrztn,
  setId,
  setIdToAdd,
  setEdit, // To determine if user is still editing then suddenly navigates to other page
  setRoute,
}) => {
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
        <OldViewBulkPayable
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : selectedValue === "NEW" ? (
        <NewViewBulkPayable
          authrztn={authrztn}
          setId={setId}
          setIdToAdd={setIdToAdd}
          setEdit={setEdit} // To determine if user is still editing then suddenly navigates to other page
          setRoute={setRoute}
        />
      ) : null}
    </div>
  );
};

export default ViewBulkPayable;
