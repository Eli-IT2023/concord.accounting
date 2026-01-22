import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const Formulation = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChemist, setSelectedChemist] = useState("");
  const [chemistData, setChemistData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/formulation/getFinishProduct"
  );

  const pagination = useServerPagination(paginationUrl, 10);

  useEffect(() => {
    // Reset pagination when search parameters change
    if (searchText || statusFilter) {
      pagination.goToPage(1);
    }
  }, [searchText, statusFilter]);

  const fetchChemistData = () => {
    axios
      .get(BASE_URL + "/formulation/getChemist")
      .then((res) => {
        setChemistData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const renderStatus = (status, color) => {
    return <span className={color}>{status}</span>;
  };

  const handleRowClick = (id) => {
    navigate(`/inventory/create-update-formulation/${id}`);
  };

  const handleStatusFilterChange = (event) => {
    if (event.target.value !== "") {
      setStatusFilter(event.target.value);
      updateSearchParams(searchText, event.target.value, searchCategory);
    } else {
      setStatusFilter(""); // Add this line
      // clearFilters();
    }
  };

  const searchFieldOptions = {
    all: "All Fields",
    product_code: "Product Code",
    product_name: "Product Name",
    suffix: "Suffix",
    packaging: "Packaging",
  };

  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim() === "") {
      setPaginationUrl(BASE_URL + "/formulation/getFinishProduct");
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchCategory);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/formulation/getFinishProductSearch");

    const params = {
      searchText: text,
    };

    if (category && category !== "all") {
      params.searchField = category;
    }

    if (category === "all") {
      params.searchField = undefined;
    }

    pagination.updateParams(params);
  };

  const handleApplyFilter = () => {
    setPaginationUrl(BASE_URL + "/formulation/getFilteredFinishProduct");
    pagination.updateParams({
      chemistID: selectedChemist,
    });
  };

  const handleClearFilter = () => {
    setSearchText("");
    setSelectedChemist("");
    setSearchCategory("all");
    setPaginationUrl(BASE_URL + "/formulation/getFinishProduct");
    pagination.updateParams({});
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">FORMULATION</span>
            </div>
            <div>
              {authrztn.includes("Productions-Add") && (
                <Link
                  to="/inventory/create-update-formulation"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>

          <div className="container-fluid mt-4">
            <div className="row">
              <div className="col-sm">
                <label htmlFor="select-agchemistent">Select Chemist</label>
                <select
                  id="select-chemist"
                  className="form-select"
                  value={selectedChemist}
                  onClick={() => {
                    if (chemistData.length === 0) fetchChemistData();
                  }}
                  onChange={(e) => setSelectedChemist(e.target.value)}
                  aria-label="Select Agent"
                >
                  <option value="">All Chemists</option>
                  {chemistData.map((chemist) => (
                    <option key={chemist.id} value={chemist.id}>
                      {chemist.fname} {chemist.lname}
                    </option>
                  ))}
                </select>
                {/* <label htmlFor="cutoff">Status</label>
                <select
                  className="form-select"
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="">All</option>
                  <option value="Closed">Closed</option>
                  <option value="Quality Checking">Quality Checking</option>
                  <option value="Not Yet Qualified">Not Yet Qualified</option>
                </select> */}
              </div>
              <div className="col-sm d-flex align-items-end filter-btn-container w-100">
                <button
                  type="button"
                  className="btn btn-dark me-2"
                  onClick={handleApplyFilter}
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </button>
              </div>
              <div className="col-sm d-flex align-items-end w-100">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Search by ${searchFieldOptions[
                      searchCategory
                    ].toLowerCase()}`}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fa-solid fa-sliders"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {Object.entries(searchFieldOptions).map(([key, value]) => (
                      <li key={key}>
                        <button
                          className={`dropdown-item ${
                            searchCategory === key ? "active" : ""
                          }`}
                          onClick={() => {
                            handleSearchCategoryChange(key);
                          }}
                        >
                          {value}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT CODE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {/* <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DESCRIPTION
                      <i className="fas fa-sort ms-1"></i>
                    </th> */}
                    {/* <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SUFFIX
                      <i className="fas fa-sort ms-1"></i>
                    </th> */}
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PACKAGING
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CHEMIST NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DATE CREATED
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center d-none"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item.product_id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center">
                          {item.product_code}
                          {item.suffix && ` - ${item.suffix}`}
                        </td>
                        <td className="text-center">{item.product_name}</td>
                        {/* <td className="text-center">{item.suffix}</td> */}

                        {/* <td>{item.description}</td> */}
                        <td className="text-center">{item.packagingInfo}</td>
                        <td className="text-center">{item.chemistName}</td>
                        <td className="text-center">
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          }).format(new Date(item.createdAt))}
                        </td>
                        <td className="text-center d-none">
                          {renderStatus(
                            item.qualificationStatus,
                            item.statusColor
                          )}
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

export default Formulation;
