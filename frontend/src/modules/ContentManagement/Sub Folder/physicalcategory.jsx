import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import "../../../assets/css/lionchem.css";
import moment from "moment";

import dayjs from "dayjs";

const PhysicalCategory = ({ authrztn }) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const userLoggedID = useDecodeToken();

  // DATA
  const [attribute, setAttribute] = useState("");
  const [status, setStatus] = useState("");
  const [updateID, setUpdateID] = useState("");
  const [validated, setValidated] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isForCreate, setIsForCreate] = useState(false);

  // data for filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [searchText, setSearchText] = useState("");

  const clearDataInputs = () => {
    setAttribute("");
    setStatus("");
    setValidated(false);
    setUpdateID("");
    setShowModal(false);
  };

  // filters
  const handleFilter = () => {
    setPaginationUrl(`${BASE_URL}/physical-category/getPhysicalCategoryFilter`);
    pagination.updateParams({
      filterStatus,
      filterColumn,
    });
  };

  const handleClearFilter = () => {
    setFilterStatus("");
    setSearchText("");
    setFilterColumn("all");
    setPaginationUrl(BASE_URL + "/physical-category/getPhysicalCategory");
    pagination.updateParams({});
  };

  const handleShow = (isForCreate, data) => {
    if (data !== null) {
      setAttribute(data.attribute);
      setStatus(data.status);
      setUpdateID(data.physical_id);
    }
    setShowModal(true);
    setIsForCreate(isForCreate);
  };

  const handleClose = () => {
    setShowModal(false);
    setEnableEdit(false);
    clearDataInputs();
  };

  const handleEdit = () => {
    setEnableEdit(true);
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
        text: "You are about to create a new physical category.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willCreate) => {
        if (willCreate) {
          axios
            .post(BASE_URL + "/physical-category/create", {
              attribute,
              status,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Physical Category Added Successfully!",
                  text: "Physical Category has been added successfully.",
                  icon: "success",
                  button: false,
                  timer: 2000,
                }).then(() => {
                  setShowModal(false);
                  pagination.refreshData();
                  setAttribute("");

                  // setValue("");
                  setValidated(false);
                });
              } else if (response.status === 201) {
                swal({
                  title: "Physical Category Attribute already Exists",
                  text: "Please input other attribute name.",
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
            .post(BASE_URL + "/physical-category/update", {
              attribute,
              status,
              updateID,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Physical Category Updated Successfully!",
                  text: "Physical Category has been updated successfully.",
                  icon: "success",
                  button: false,
                  timer: 2000,
                }).then(() => {
                  pagination.refreshData();
                  clearDataInputs();
                });
              } else if (response.status === 201) {
                swal({
                  title: "Physical Category Name Exists",
                  text: "Please input other attrbute name.",
                  icon: "error",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/physical-category/getPhysicalCategory"
  );

  const pagination = useServerPagination(paginationUrl, 10);

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/physical-category/getPhysicalCategory");
      pagination.updateParams({});
    } else {
      setPaginationUrl(
        BASE_URL + "/physical-category/getPhysicalCategoryBySearch"
      );
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all  ",
        filterStatus: filterStatus || "Active", // Ensure default value
      });
    }
  };

  useEffect(() => {
    setSearchText("");
    setPaginationUrl(BASE_URL + "/physical-category/getPhysicalCategory");
    pagination.updateParams({});
  }, [filterColumn]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/content/parameters")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">PHYSICAL CATEGORY</span>
          </span>
        </div>
        <button
          onClick={() => handleShow(true, null)}
          className="btn btn-primary d-flex align-items-center gap-1"
        >
          <i className="bx bx-plus"></i> Create
        </button>
      </div>
      <div className="container-fluid mt-3">
        <div className="row align-items-end">
          <div className="col-sm mb-3">
            <label htmlFor="status">Status</label>
            <select
              name="status"
              id="status"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-sm mb-3 d-flex align-items-end gap-2">
            <button
              type="button"
              className="btn btn-dark"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleFilter}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-light border"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
          <div className="col-sm mb-3">
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
                      filterColumn === "attribute" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("attribute")}
                  >
                    Attribute
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "status" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("status")}
                  >
                    Status
                  </button>
                </li>
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
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                >
                  <div className="d-flex flex-row">
                    Name
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up `}
                        style={{ fontSize: 10 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down `}
                        style={{ fontSize: 10 }}
                      ></i>
                    </span>
                  </div>
                </th>

                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                >
                  <div className="d-flex flex-row">
                    Status
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up `}
                        style={{ fontSize: 10 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down `}
                        style={{ fontSize: 10 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                >
                  <div className="d-flex flex-row">
                    Date Created
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up `}
                        style={{ fontSize: 10 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down `}
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
                    key={item.physical_id}
                  >
                    <td>{item.attribute}</td>
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
        show={showModal}
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
            <Modal.Title>Physical Category Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-2">
              <Form.Label className="form-label">
                Attribute Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                value={attribute}
                required
                onChange={(e) => setAttribute(e.target.value)}
                className="form-control"
                placeholder="Enter Name"
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
    </div>
  );
};

export default PhysicalCategory;
