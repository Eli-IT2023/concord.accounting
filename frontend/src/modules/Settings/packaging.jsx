import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import "../../assets/css/lionchem.css";

const Packaging = () => {
  // ##### variables ######
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const userLoggedID = useDecodeToken();
  const [forEditPrimary, setforEditPrimary] = useState("");

  // ##### variables end #####

  // ##### add modal #####
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isForCreate, setIsForCreate] = useState(false);

  const handleShow = (isTrue, data) => {
    if (data !== null) {
      setPackageName(data.packaging_name);
      setDescription(data.description);
      setStatus(data.status);
      setforEditPrimary(data.id);
      setIsForCreate(isTrue);
    }
    setShow(true);
    setIsForCreate(isTrue);
  };

  const clearDataInputs = () => {
    setShow(false);
    setPackageName("");
    setDescription("");
    setStatus("Active");
    setValidated(false);
    setforEditPrimary("");
    setFilterStatus("Active");
    setFilterDateCreated("");
    setSearchText("");
    setFilterColumn("all");
  };

  // modal create
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
        text: "You are about to create a new data.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willCreate) => {
        if (willCreate) {
          axios
            .post(BASE_URL + "/Packaging/create", {
              packageName,
              description,
              status,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Success!",
                  text: "Packaging has been added successfully.",
                  icon: "success",
                  button: false,
                  timer: 2500,
                }).then(() => {
                  setShow(false);
                  pagination.refreshData();
                  setPackageName("");
                  setDescription("");
                  setStatus("");
                  setValidated(false);
                });
              } else if (response.status === 201) {
                swal({
                  title: "Packaging Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                  button: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  // ##### add modal end #####

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/Packaging/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ##### filter #####
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterDateCreated, setFilterDateCreated] = useState("");

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/Packaging/fetchFilteredData");
    pagination.updateParams({ filterStatus, filterDateCreated }); // method use to pass to the router
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/Packaging/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/Packaging/fetchData");
      pagination.updateParams({}); // Reset the filter when search text is empty
    } else {
      setPaginationUrl(BASE_URL + "/Packaging/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn,
        filterStatus,
      });
    }
  };
  // ##### filter end #####

  // ##### update modal #####
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
        text: "You are about to update a data.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willEdit) => {
        if (willEdit) {
          axios
            .post(BASE_URL + "/Packaging/update", {
              packageName,
              description,
              status,
              userLoggedID,
              forEditPrimary,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Success!",
                  text: "Packaging has been updated successfully.",
                  icon: "success",
                  button: false,
                  timer: 2500,
                }).then(() => {
                  clearDataInputs();
                  handleClearFilter();
                });
              } else if (response.status === 201) {
                swal({
                  title: "Packaging Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                  button: true,
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const handleClose = () => {
    setShow(false);
    clearDataInputs();
  };
  // ##### update modal end #####

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">PACKAGING</span>
          <span>PRODUCT LIST PACKAGING TYPES</span>
        </div>

        <div>
          <button
            className="btn btn-primary d-flex align-items-center title-button"
            onClick={() => handleShow(true, null)}
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

          <div className="col-auto ">
            <button
              onClick={handleFilter}
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
                      filterColumn === "packageName" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("packageName")}
                  >
                    Packaging Type
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

      <div className="container-fluid mt-3">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PACKAGING TYPE
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  DESCRIPTION
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  STATUS
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  DATE CREATED
                  <i className="fas fa-sort ms-1"></i>
                </th>
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
                  <tr
                    onClick={() => handleShow(false, item)}
                    style={{ cursor: "pointer" }}
                    key={item.id}
                  >
                    <td>{item.packaging_name}</td>
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
          <Modal.Header className="border-0" closeButton>
            <Modal.Title>Packaging</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="form-label" htmlFor="packageName">
                Packaging Name
                <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                id="packageName" // Added id to match htmlFor
                value={packageName}
                placeholder="Enter Packaging Name"
                required
                onChange={(e) => setPackageName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label" htmlFor="description">
                Description
              </Form.Label>
              <Form.Control
                id="description"
                value={description}
                as="textarea"
                rows={6} // Sets the number of visible text lines
                cols={6} // Sets the width in character columns
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: "vertical" }} // Optional: controls resizing behavior
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label" htmlFor="status">
                Status
                <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                id="status"
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
            </Form.Group>
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
    </div>
  );
};

export default Packaging;
