import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../../assets/css/style.css";
import "../../../assets/css/lionchem.css";

import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";
import Select from "react-select";
import dayjs from "dayjs";

import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const StockReturnList = ({ authrztn }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [year, setYear] = useState(dayjs().format("YYYY"));
  const [dateFilterType, setDateFilterType] = useState("month");
  const [productCategory, setProductCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  // pagination
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/StockReturnHistory/fetchData`
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // Debounced search text
  const debouncedSearchText = useDebounce(searchText, 500); // 500ms delay

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedSearchText === "") {
      // If search is empty, revert to normal data
      setPaginationUrl(BASE_URL + "/StockReturnHistory/fetchData");
      pagination.updateParams({});
    } else {
      console.log("this is the search value", debouncedSearchText);
      console.log("this is the filter column", filterColumn);

      // Set search URL and update params for search
      setPaginationUrl(BASE_URL + "/StockReturnHistory/searchData");
      pagination.updateParams({
        search: debouncedSearchText,
        filterColumn: filterColumn,
        month: dateFilterType === "month" ? month : null,
        year: dateFilterType === "year" ? year : null,
        dateFilterType: dateFilterType,
        productCategory: productCategory,
      });
    }
  }, [
    debouncedSearchText,
    filterColumn,
    month,
    year,
    dateFilterType,
    productCategory,
  ]);

  // Helper function to format weight with commas and 2 decimal places
  const formatWeight = (weight) => {
    if (!weight && weight !== 0) return "0.00";

    const num = parseFloat(weight);
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = dayjs(dateString);
    if (!date.isValid()) return "";

    return date.format("MMM. DD, YYYY - hh:mm A");
  };

  const formatDate2 = (dateString) => {
    if (!dateString) return "";

    const date = dayjs(dateString);
    if (!date.isValid()) return "";

    return date.format("MMM. DD, YYYY");
  };

  // Filter functions
  const clearDataInputs = () => {
    setMonth(dayjs().format("YYYY-MM"));
    setYear(dayjs().format("YYYY"));
    setDateFilterType("month");
    setProductCategory("All");
    setSearchText("");
    setFilterColumn("all");
  };

  const handleFilter = () => {
    setPaginationUrl(`${BASE_URL}/StockReturnHistory/getFilteredData`);
    pagination.updateParams({
      month: dateFilterType === "month" ? month : null,
      year: dateFilterType === "year" ? year : null,
      dateFilterType,
      productCategory,
    });
  };

  const handleClearFilter = () => {
    setPaginationUrl(`${BASE_URL}/StockReturnHistory/fetchData`);
    pagination.updateParams({});
    clearDataInputs();
  };

  // Generate years for dropdown
  const generateYearOptions = () => {
    const currentYear = dayjs().year();
    const years = [];

    // Add current year first
    years.push({
      value: currentYear.toString(),
      label: `${currentYear} (Current)`,
      isCurrent: true,
    });

    // Add future year
    years.push({
      value: (currentYear + 1).toString(),
      label: (currentYear + 1).toString(),
      isCurrent: false,
    });

    // Add past years in descending order
    for (let i = currentYear - 1; i >= currentYear - 15; i--) {
      years.push({
        value: i.toString(),
        label: i.toString(),
        isCurrent: false,
      });
    }

    return years;
  };

  const yearOptions = generateYearOptions();

  const handleYearChange = (selectedOption) => {
    setYear(selectedOption ? selectedOption.value : dayjs().format("YYYY"));
  };

  const getSelectedYearOption = () => {
    return yearOptions.find((option) => option.value === year) || null;
  };

  // Custom styles for React Select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#80bdff" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(0, 123, 255, 0.25)"
        : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#80bdff" : "#adb5bd",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#007bff"
        : state.isFocused
        ? "#f8f9fa"
        : "white",
      color: state.isSelected ? "white" : "black",
      fontWeight: state.data.isCurrent ? "bold" : "normal",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#495057",
    }),
  };

  // Get category badge color
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "Finish Product":
        return "badge bg-primary";
      case "Finished Product":
        return "badge bg-primary";
      case "Raw Materials":
        return "badge bg-warning text-dark";
      default:
        return "badge bg-success";
    }
  };

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
      ) : authrztn.includes("StockManagement-View") ? (
        <>
          {/* Header */}
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">
                <Link to="/inventory/stock-management" className="text-dark">
                  <i className="fa-solid fa-arrow-left me-2"></i>
                </Link>
                STOCK RETURN LIST
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="container-fluid mt-4">
            <div className="row align-items-end">
              {/* Date Filter Type */}
              <div className="col-md-2 col-sm-6 mb-3">
                <label htmlFor="dateFilterType" className="form-label">
                  Rate Date
                </label>
                <select
                  id="dateFilterType"
                  className="form-select"
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                >
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </select>
              </div>

              {/* Month/Year Selector */}
              <div className="col-md-2 col-sm-6 mb-3">
                <label className="form-label">
                  {dateFilterType === "month" ? "Month" : "Year"}
                </label>
                {dateFilterType === "month" ? (
                  <input
                    type="month"
                    className="form-control"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                ) : (
                  <Select
                    value={getSelectedYearOption()}
                    onChange={handleYearChange}
                    options={yearOptions}
                    styles={customStyles}
                    placeholder="Select Year"
                    isSearchable
                    isClearable
                    classNamePrefix="react-select"
                  />
                )}
              </div>

              {/* Product Category */}
              <div className="col-md-2 col-sm-6 mb-3">
                <label htmlFor="productCategory" className="form-label">
                  Product Category
                </label>
                <select
                  id="productCategory"
                  className="form-select"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Finished Product">Finished Product</option>
                </select>
              </div>

              {/* Filter Buttons */}
              <div className="col-md-3 col-sm-6 mb-3 d-flex justify-content-start align-items-end gap-2">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="row">
              <div className="col-12">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
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
                          filterColumn === "productCode" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("productCode")}
                      >
                        Product Code
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "productName" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("productName")}
                      >
                        Product Name
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "lot" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("lot")}
                      >
                        LOT
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="container-fluid mt-3">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Product Code
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Product Name
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Product Category
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Weight Returned (kg)
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        LOT
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Expiry Date
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted sortable-header"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        Date Returned
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger py-3">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => {
                      const product =
                        item.rsh_stock_management_id?.product_list || {};
                      const returnData =
                        item.rsh_return_product_list_id
                          ?.rpl_schedule_product_list_id || {};
                      const weightReturned =
                        (item.return_quantity || 0) *
                        (returnData.packaging_unit_quantity || 1);

                      return (
                        <tr key={item.id}>
                          <td>
                            {product.product_code || ""}
                            {product.suffix && ` - ${product.suffix}`}
                          </td>
                          <td>{product.product_name || ""}</td>
                          <td>
                            <span
                              className={getCategoryBadgeClass(
                                product.product_category
                              )}
                            >
                              {product.product_category || ""}
                            </span>
                          </td>
                          <td>{formatWeight(weightReturned)}</td>
                          <td>{item.lot || "N/A"}</td>
                          <td>
                            {item.expiry_date
                              ? formatDate2(item.expiry_date)
                              : "N/A"}
                          </td>
                          <td>{formatDate(item.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>
        </>
      ) : (
        <div className="no-access d-flex flex-column align-items-center justify-content-center h-100">
          <img src={NoAccess} alt="No Access" className="no-access-img mb-3" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default StockReturnList;
