import { React, useState } from "react";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component
import { useNavigate, useParams } from "react-router-dom"; // Import the useNavigate hook
import BASE_URL from "../../../assets/global/url";
function TaxSettings() {
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/tax_settings/getTaxSettings"
  );

  const pagination = useServerPagination(paginationUrl, 10);

  // const clearDataInputs = () => {
  //   setShow(false);
  //   setSpecificationName("");
  //   setDescription("");
  //   setStatus("Active");
  //   setValidated(false);
  //   setforEditPrimary("");
  //   setFilterStatus("Active");
  //   setFilterDateCreated("");
  //   setSearchText("");
  //   setFilterColumn("all");
  // };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/tax_settings/getTaxSettings");
      pagination.updateParams({}); // Reset the filter when search text is empty
    } else {
      setPaginationUrl(BASE_URL + "/tax_settings/getTaxSettingsBySearch");
      pagination.updateParams({
        searchText: value,
        filterColumn,
      });
    }
  };

  return (
    <div className="h-100 w-100 bg-white">
      <div className="w-100 d-flex flex-row justify-content-between align-items-center p-3">
        <h4 className="m-0">TAX RULES</h4>
        <button
          onClick={() => navigate("/taxmngnt/tax-settings-add/create")}
          className="btn btn-primary d-flex align-items-center gap-1"
        >
          <i className="bx bx-plus"></i> Add Tax Rule
        </button>
      </div>

      <div className="p-3">
        <div className="row g-3 align-items-end">
          <div className="col-md ms-auto">
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
                      filterColumn === "name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("name")}
                  >
                    Tax Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "rate" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("rate")}
                  >
                    Rate
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "threshold_amount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("threshold_amount")}
                  >
                    Threshold Amount
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "applicability" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("applicability")}
                  >
                    Applicability
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "transaction_type" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_type")}
                  >
                    Transaction Type
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Table  */}
      <div className="p-3">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  TAX NAME
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  RATE (%)
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  THRESHOLD AMOUNT
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  APPPLICABILITY
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  TRANSACTION TYPE
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="5" className="text-center text-danger">
                    Error loading data
                  </td>
                </tr>
              ) : pagination.data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No data available
                  </td>
                </tr>
              ) : (
                pagination.data.map((item) => (
                  <tr style={{ cursor: "pointer" }} key={item.id}>
                    <td style={{ maxWidth: "300px" }}>{item.name}</td>
                    <td>{item.rate}</td>
                    <td>{item.threshold_amount}</td>
                    <td>{item.applicability}</td>
                    <td>{item.transaction_type}</td>
                    <td>
                      <button
                        onClick={() =>
                          navigate(`/taxmngnt/tax-settings-add/${item.id}`)
                        }
                        className="badge btn-primary"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Use the pagination controls with server pagination */}
        <PaginationControls {...pagination} />
      </div>
    </div>
  );
}

export default TaxSettings;
