import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import { useSort } from "../../hooks/customHook/tableSort"; // adjust path accordingly

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const validUOMS = new Map([
  ["Milligrams per kilogram (mg/kg)", "mg/kg"],
  ["Micrograms per kilogram (μg/kg)", "μg/kg"],
  ["Micrograms per gram (μg/g)", "μg/g"],
  ["Nanograms per gram (ng/g)", "ng/g"],
  ["Percentage (%)", "%"],
  ["Grams per 100 grams (g/100g)", "g/100g"],
  ["Colony-Forming Units per gram (CFU/g)", "CFU/g"],
  ["Colony-Forming Units per milliliter (CFU/mL)", "CFU/mL"],
  ["Most Probable Number per gram (MPN/g)", "MPN/g"],
  ["Most Probable Number per milliliter (MPN/mL)", "MPN/mL"],
  ["Presence in 25 grams (/25g)", "/25g"],
  ["Micrograms per liter (μg/L)", "μg/L"],
  ["Milligrams per liter (mg/L)", "mg/L"],
  ["Grams per liter (g/L)", "g/L"],
  ["International Units per gram (IU/g)", "IU/g"],
]);

const Parameters = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [validated, setValidated] = useState(false);

  const [show, setShow] = useState(false);
  const [isForCreate, setIsForCreate] = useState(false);

  const [forEditPrimary, setforEditPrimary] = useState("");
  const [specificationName, setSpecificationName] = useState("");
  const [uom, setUOM] = useState("");
  const [description, setDescription] = useState(null);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterDateCreated, setFilterDateCreated] = useState("");
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/parameters/getParameter",
  );

  const { isSortedAsc, sortColumn, toggleSort } = useSort(
    "name",
    false,
    paginationUrl,
  );

  const handleSortData = (column) => {
    toggleSort(column, (params) => {
      setPaginationUrl(params.url);
      pagination.updateParams({
        sortType: params.sortType,
        sortDBTableColumn: params.sortDBTableColumn,
      });
    });
  };

  const handleClose = () => {
    setShow(false);
    clearDataInputs();
  };
  const handleShow = (isTrue, data) => {
    if (data !== null) {
      setSpecificationName(data.name);
      setUOM(data.uom);
      setCategory(data.category || ""); // This will set to empty string if category is NULL
      setDescription(data.description);
      setStatus(data.status);
      setforEditPrimary(data.id);
      setIsForCreate(isTrue);
    }
    setShow(true);
    setIsForCreate(isTrue);
  };

  const userLoggedID = useDecodeToken();

  const pagination = useServerPagination(paginationUrl, 10);

  const clearDataInputs = () => {
    setShow(false);
    setSpecificationName("");
    setDescription("");
    setStatus("");

    // setValue("");
    setValidated(false);
    setforEditPrimary("");
    setUOM("");
    setCategory("");

    setFilterStatus("Active");
    setFilterDateCreated("");
    setSearchText("");
    setFilterColumn("all");
  };

  const handleFormCreate = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to create a new parameter.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willCreate) => {
        if (willCreate) {
          axios
            .post(BASE_URL + "/Parameters/para_create", {
              specificationName,
              uom,
              category,
              description,
              status,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Success!",
                  text: "Parameter has been added successfully.",
                  icon: "success",
                  button: false,
                  timer: 2000,
                }).then(() => {
                  setShow(false);
                  pagination.refreshData();
                  setSpecificationName("");
                  setDescription("");
                  setStatus("");
                  setCategory("");

                  // setValue("");
                  setValidated(false);
                  clearDataInputs();
                });
              } else if (response.status === 201) {
                swal({
                  title: "Parameter Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const handleFormUpdate = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to save changes.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willEdit) => {
        if (willEdit) {
          axios
            .post(BASE_URL + "/Parameters/para_edit", {
              specificationName,
              uom,
              category,
              description,
              status,
              userLoggedID,
              forEditPrimary,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Success!",
                  text: "Parameter has been updated successfully.",
                  icon: "success",
                  button: false,
                  timer: 2000,
                }).then(() => {
                  clearDataInputs();
                  pagination.refreshData();
                });
              } else if (response.status === 201) {
                swal({
                  title: "Parameter Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/Parameters/getParameterFilter");

    pagination.updateParams({ filterStatus, filterDateCreated }); // method use to pass to the router
  };
  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/Parameters/getParameter");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/Parameters/getParameter");
      pagination.updateParams({}); // Reset the filter when search text is empty
    } else {
      setPaginationUrl(BASE_URL + "/Parameters/getParameterBySearch");
      pagination.updateParams({
        searchText: value,
        filterColumn,
        filterStatus,
      });
    }
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
      ) : authrztn.includes("Parameters-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">PARAMETERS</span>
            </div>

            <div className="d-flex gap-1">
              {/* <button
            className="d-flex align-items-center title-button"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#0d6efd",
              boxShadow: "none",
              padding: "0.375rem 0.75rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.querySelector("span").style.textDecoration =
                "underline";
            }}
            onMouseOut={(e) => {
              e.currentTarget.querySelector("span").style.textDecoration =
                "none";
            }}
            onClick={() => {
              navigate("/content/parameters/physical-category");
            }}
          >
            <span style={{ color: "#0d6efd", marginLeft: 4 }}>
              Physical Category
            </span>
          </button> */}
              <button
                onClick={() => handleShow(true, null)}
                className="btn btn-primary d-flex align-items-center gap-1"
              >
                <i className="bx bx-plus"></i> Create
              </button>
            </div>
          </div>

          <div className="p-3">
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

              <div className="col-md-3">
                <label className="form-label">Date Created</label>
                <input
                  value={filterDateCreated}
                  onChange={(e) => setFilterDateCreated(e.target.value)}
                  type="date"
                  className="form-control"
                  placeholder="MM/DD/YYYY"
                />
              </div>

              <div className="col-auto">
                <button
                  onClick={handleFilter}
                  type="button"
                  className="btn btn-dark"
                >
                  Apply Filter
                </button>
              </div>

              <div className="col-auto">
                <button
                  onClick={handleClearFilter}
                  className="btn btn-light border"
                >
                  Clear Filter
                </button>
              </div>

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
                        Parameter Name
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "description" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("description")}
                      >
                        Description
                      </button>
                    </li>
                    {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "status" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("status")}
                  >
                    Status
                  </button>
                </li> */}
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
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("name")}
                    >
                      <div className="d-flex flex-row">
                        Parameter Name
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "name" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "name" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("uom")}
                    >
                      <div className="d-flex flex-row">
                        Unit of Measure
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "uom" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "uom" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("category")}
                    >
                      <div className="d-flex flex-row">
                        Category
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "category" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "category" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("description")}
                    >
                      <div className="d-flex flex-row">
                        Description
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "description" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "description" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("status")}
                    >
                      <div className="d-flex flex-row">
                        Status
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "status" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "status" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("createdAt")}
                    >
                      <div className="d-flex flex-row">
                        Date Created
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "createdAt" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "createdAt" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="6" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        onClick={() => handleShow(false, item)}
                        style={{ cursor: "pointer" }}
                        key={item.id}
                      >
                        <td>{item.name}</td>
                        <td>{item.uom ? item.uom : "--"}</td>
                        <td>{item.category}</td>
                        <td style={{ maxWidth: "400px" }}>
                          {item.description ? item.description : "--"}
                        </td>
                        <td
                          className={`fw-bold ${
                            item.status === "Active"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {item.status}
                        </td>
                        <td>
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(item.createdAt))}
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

          <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={(e) =>
                isForCreate ? handleFormCreate(e) : handleFormUpdate(e)
              }
            >
              <Modal.Header closeButton>
                <Modal.Title>Parameter Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-2">
                  <Form.Label className="form-label">
                    Parameter Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    value={specificationName}
                    required
                    onChange={(e) => setSpecificationName(e.target.value)}
                    className="form-control"
                    placeholder="Enter Name"
                  />
                </div>

                <div className="mb-2">
                  <Form.Label className="form-label">
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={category}
                    required
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                    style={{ cursor: "pointer" }}
                  >
                    <option disabled value="">
                      Select Category
                    </option>
                    <option value="Physical">Physical</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Microbiological">Microbiological</option>
                  </Form.Select>
                </div>

                {(category === "Chemical" ||
                  category === "Microbiological") && (
                  <div className="mb-2">
                    <Form.Label className="form-label">
                      Symbol <span className="text-danger">*</span>
                    </Form.Label>
                    {/* <Form.Control
                value={uom}
                onChange={(e) => setUOM(e.target.value)}
                className="form-control"
                placeholder="Enter Symbol"
              /> */}
                    <Select
                      options={Array.from(validUOMS.entries())
                        .sort(([labelA], [labelB]) =>
                          labelA.localeCompare(labelB),
                        )
                        .map(([label, value]) => ({
                          label,
                          value,
                        }))}
                      value={
                        uom
                          ? {
                              label:
                                [...validUOMS].find(
                                  ([k, v]) => v === uom,
                                )?.[0] || uom,
                              value: uom,
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setUOM(selectedOption?.value || "")
                      }
                      placeholder="Select Unit of Measure"
                      isSearchable
                      isClearable
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minHeight: "38px",
                          height: "38px",
                        }),
                        menu: (provided) => ({
                          ...provided,
                          position: "absolute",
                          zIndex: 9999,
                          width: "auto",
                          minWidth: "100%",
                        }),
                        menuPortal: (provided) => ({
                          ...provided,
                          zIndex: 9999,
                        }),
                        option: (provided) => ({
                          ...provided,
                          padding: "8px 12px",
                        }),
                      }}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuShouldBlockScroll={true}
                      required
                    />
                  </div>
                )}

                <div className="mb-2">
                  <Form.Label className="form-label">Description</Form.Label>
                  <Form.Control
                    value={description}
                    as="textarea"
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Leave a comment here"
                    style={{ minHeight: "10rem" }}
                  />
                </div>

                <div className="mb-2">
                  <Form.Label className="form-label">
                    Status <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={status}
                    required
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-select"
                    style={{ cursor: "pointer" }}
                  >
                    <option disabled value="">
                      Select Status
                    </option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                {isForCreate ? (
                  <Button type="submit" variant="primary">
                    Create
                  </Button>
                ) : (
                  <Button type="submit" variant="primary">
                    Update
                  </Button>
                )}
              </Modal.Footer>
            </Form>
          </Modal>
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

export default Parameters;
