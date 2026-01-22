import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import { NumericFormat } from "react-number-format";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import productUnits from "../../assets/global/unitofmeasure";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import {
  Plus,
  FadersHorizontal,
  MagnifyingGlass,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const ProductList = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchFunction, setSearchFunction] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
  const [showChangeStatusButton, setShowChangeStatusButton] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectStatusFilter, setSelectStatusFilter] = useState("All");
  const [filterColumn, setFilterColumn] = useState("all");
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/product/getProductDataLio"
  );
  const [packaging_data, setPackagingData] = useState([]);
  const [filterPackage, setFilterPackage] = useState("All");
  const [filterPriceMin, setFilterPriceMin] = useState("0");
  const [filterPriceMax, setFilterPriceMax] = useState("0");

  const pagination = useServerPagination(paginationUrl, 10);

  // Calculate if all items on current page are selected
  const selectAllChecked = useMemo(() => {
    if (!pagination.data || pagination.data.length === 0) return false;

    const currentPageIds = pagination.data.map((item) => item.product_id);
    return currentPageIds.every((id) => selectedCheckboxes.includes(id));
  }, [pagination.data, selectedCheckboxes]);

  // Calculate if some items on current page are selected (indeterminate state)
  const isIndeterminate = useMemo(() => {
    if (!pagination.data || pagination.data.length === 0) return false;

    const currentPageIds = pagination.data.map((item) => item.product_id);
    const selectedOnPage = currentPageIds.filter((id) =>
      selectedCheckboxes.includes(id)
    );
    return (
      selectedOnPage.length > 0 && selectedOnPage.length < currentPageIds.length
    );
  }, [pagination.data, selectedCheckboxes]);

  const handleCloseStatusModal = () => {
    setShowChangeStatusModal(false);
    setSelectedStatus("");
  };
  const handleShowChangeStatusModal = () => setShowChangeStatusModal(true);

  //fetching of product Data
  const reloadProduct = async () => {
    setPaginationUrl(BASE_URL + "/product/getProductDataLio");
    pagination.updateParams({});
    setIsLoading(false);
  };

  const reloadPackaging = async () => {
    const res = await axios.get(`${BASE_URL}/product/getPackagingData`);
    setPackagingData(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadPackaging();
      reloadProduct();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Clear selections when page changes or data changes
  useEffect(() => {
    // Optional: You can decide whether to keep selections across pages
    // If you want to clear selections when pagination changes, uncomment:
    // setSelectedCheckboxes([]);
    // setShowChangeStatusButton(false);
  }, [pagination.currentPage]);

  const handleCheckboxChange = (productId) => {
    setSelectedCheckboxes((prev) => {
      let updated;
      if (prev.includes(productId)) {
        updated = prev.filter((id) => id !== productId);
      } else {
        updated = [...prev, productId];
      }

      // Update button visibility
      setShowChangeStatusButton(updated.length > 0);

      return updated;
    });
  };

  const handleSelectAllChange = () => {
    const currentPageIds = pagination.data.map((item) => item.product_id);

    if (currentPageIds.length === 0) return;

    if (selectAllChecked) {
      // Unselect all items on current page
      setSelectedCheckboxes((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      // Select all items on current page
      const newSelections = [...selectedCheckboxes];
      currentPageIds.forEach((id) => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      setSelectedCheckboxes(newSelections);
    }

    const updatedSelections = selectAllChecked
      ? selectedCheckboxes.filter((id) => !currentPageIds.includes(id))
      : [...new Set([...selectedCheckboxes, ...currentPageIds])];

    setShowChangeStatusButton(updatedSelections.length > 0);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleSave = () => {
    axios
      .put(BASE_URL + "/product/statusupdate", {
        productIds: selectedCheckboxes,
        status: selectedStatus,
      })
      .then((res) => {
        if (res.status === 200) {
          swal({
            title: "Product Status Update!",
            text: "The product status has been updated successfully.",
            icon: "success",
            button: "OK",
          }).then(() => {
            handleCloseStatusModal();
            reloadProduct(selectStatusFilter);
            setSelectedCheckboxes([]);
            setShowChangeStatusButton(false);
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchFunction(value);
    setPaginationUrl(BASE_URL + "/product/getProductDataSearchBarLio");
    pagination.updateParams({ filterColumn, searchFunction: value });
  };

  const applyFilter = () => {
    setSearchFunction("");
    setPaginationUrl(BASE_URL + "/product/getProductDataFilterLio");
    pagination.updateParams({
      filterPackage,
      selectStatusFilter,
      filterPriceMin,
      filterPriceMax,
    });
  };

  const clearFilter = () => {
    setSearchFunction("");
    setSelectStatusFilter("All");
    setFilterPackage("All");
    setFilterPriceMin("0");
    setFilterPriceMax("0");
    setSelectedCheckboxes([]);
    setShowChangeStatusButton(false);
    reloadProduct();
  };

  const handleUpdateProductModal = (row) => {
    navigate(`/inventory/update-product/${row.product_id}`);
  };

  return (
    <>
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
        ) : authrztn.includes("ProductList-View") ? (
          <>
            <div className="w-100 p-2 d-flex flex-row justify-content-between">
              <div className="d-flex flex-column title-custom">
                <span className="fs-3">PRODUCT LIST</span>
              </div>

              <div>
                {authrztn.includes("ProductList-Edit") &&
                showChangeStatusButton ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleShowChangeStatusModal}
                  >
                    <ArrowsClockwise size={32} color="#f2f2f2" /> Change Status
                  </button>
                ) : authrztn.includes("ProductList-Add") ? (
                  <Link
                    to="/inventory/create-product"
                    className="btn btn-primary d-flex align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i>
                    Create
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="row g-3 align-items-end">
              {/* Package */}
              <div className="col-md-2">
                <label className="form-label fw-semibold">Package</label>
                <select
                  className="form-select"
                  value={filterPackage}
                  onChange={(e) => setFilterPackage(e.target.value)}
                >
                  <option value="" disabled>
                    Select Package
                  </option>
                  <option value="All">All Package</option>
                  {packaging_data.map((prod_packaging) => {
                    const uomString = `${prod_packaging.packaging_name} - (${prod_packaging.unit_quantity}${prod_packaging.unit})`;

                    return (
                      <option key={prod_packaging.id} value={prod_packaging.id}>
                        {uomString}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status */}
              <div className="col-md-2">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={selectStatusFilter}
                  onChange={(e) => setSelectStatusFilter(e.target.value)}
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archive">Archive</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="col-md-3 d-flex gap-2">
                <button className="btn btn-dark w-100" onClick={applyFilter}>
                  Apply Filter
                </button>
                <button
                  className="btn btn-light border mx-2 w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button>
              </div>

              {/* Search with Filter */}
              <div className="col-sm">
                <label className="form-label fw-semibold"></label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchFunction}
                    onChange={handleSearchChange}
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
                    {[
                      { value: "product_code", label: "Product ID" },
                      { value: "product_name", label: "Product Name" },
                      { value: "product_category", label: "Product Category" },
                    ].map(({ value, label }) => (
                      <li key={value}>
                        <button
                          className={`dropdown-item ${
                            filterColumn === value ? "active" : ""
                          }`}
                          onClick={() => setFilterColumn(value)}
                        >
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="w-100 mt-3 container-fluid">
              <div className="table-responsive data-table scrollable-contents">
                <table
                  className="table table-hover table-responsive"
                  id="productListTable"
                >
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        <input
                          className="form-check-input p-2 border-secondary cursor-pointer"
                          type="checkbox"
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isIndeterminate;
                            }
                          }}
                          onChange={handleSelectAllChange}
                          checked={selectAllChecked}
                          disabled={
                            !pagination.data || pagination.data.length === 0
                          }
                        />
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT CODE
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT NAME
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PRODUCT CATEGORY
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        PACKAGING
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          fontSize: "0.9rem",
                        }}
                      >
                        STATUS
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="d-flex justify-content-center align-items-center">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <span className="ms-2">Loading data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pagination.error ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-danger py-4"
                        >
                          <div className="d-flex flex-column align-items-center">
                            <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                            <span>Error loading data</span>
                            <small className="text-muted mt-1">
                              {pagination.error.message}
                            </small>
                          </div>
                        </td>
                      </tr>
                    ) : pagination.data.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span>No data available</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagination.data.map((item, index) => {
                        const uom = item.prod_packaging;
                        const uomString = uom
                          ? `${uom.packaging_name} - (${uom.unit_quantity}${uom.unit})`
                          : "--";

                        return (
                          <tr
                            onClick={() => handleUpdateProductModal(item)}
                            style={{ cursor: "pointer" }}
                            key={item.product_id || item.id}
                          >
                            <td
                              className="text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                className="form-check-input p-2 border-secondary"
                                style={{ cursor: "pointer" }}
                                type="checkbox"
                                checked={selectedCheckboxes.includes(
                                  item.product_id
                                )}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxChange(item.product_id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="text-center">
                              {item.product_code || "--"}
                            </td>
                            <td className="text-center">
                              {item.product_name || "--"}
                            </td>
                            <td className="text-center">
                              {item.product_category || "--"}
                            </td>
                            <td className="text-center">{uomString}</td>
                            <td
                              className="text-center"
                              style={{
                                padding: "5px 10px",
                                borderRadius: "5px",
                                color:
                                  item.status === "Active"
                                    ? "#32CD32"
                                    : item.status === "Inactive"
                                    ? "#FF0000"
                                    : item.status === "Archive"
                                    ? "#808080"
                                    : "#initial",
                                textTransform: "uppercase",
                                fontWeight: "bold",
                              }}
                            >
                              {item.status}
                            </td>
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
          <div className="no-access">
            <img src={NoAccess} alt="NoAccess" className="no-access-img" />
            <h3>You don't have access to this function.</h3>
          </div>
        )}
      </div>

      {/* status update  */}
      <Modal
        size="md"
        show={showChangeStatusModal}
        onHide={handleCloseStatusModal}
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "24px" }}>Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group
            controlId="exampleForm.ControlInput2"
            className="d-flex gap-3"
          >
            <Form.Label
              style={{ fontSize: "18px", height: "inherit", marginBottom: 0 }}
              className="d-flex justify-content-center align-items-center"
            >
              Status
            </Form.Label>
            <Form.Select
              style={{ height: "40px", fontSize: "18px" }}
              onChange={handleStatusChange}
              value={selectedStatus}
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archive">Archive</option>
            </Form.Select>
            <Button
              variant="outline-primary"
              onClick={handleSave}
              style={{ fontSize: "18px" }}
            >
              Save
            </Button>
          </Form.Group>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductList;
