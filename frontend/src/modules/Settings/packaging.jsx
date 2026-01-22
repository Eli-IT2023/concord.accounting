import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useSort } from "../../hooks/customHook/tableSort"; // adjust path accordingly

import "../../assets/css/lionchem.css";

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const Packaging = ({ authrztn, roleType, rbacUserRole }) => {
  // MAX IMAGES FOR UPLOADING
  const MAX_IMAGES = 3; // Set max limit to 3 images

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/Packaging/fetchData",
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // ✅ Format number with commas and up to 5 decimals
  const formatNumber = (value) => {
    if (value === "" || value === null || isNaN(value)) return "";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  // ##### variables ######
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [unitQuantity, setUnitQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [packagingImage, setPackagingImage] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [status, setStatus] = useState("");
  const userLoggedID = useDecodeToken();
  const [forEditPrimary, setforEditPrimary] = useState("");
  const [isQuantityValid, setIsQuantityValid] = useState(true); // Add quantity validation state

  // ##### variables end #####

  // ##### add modal #####
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isForCreate, setIsForCreate] = useState(false);

  const { isSortedAsc, sortColumn, toggleSort } = useSort(
    "packaging_name",
    false,
    paginationUrl,
  );

  const handleRemoveImage = (indexToRemove) => {
    // Check if this is an existing image (has an ID)
    if (packagingImage[indexToRemove].id) {
      setDeletedImageIds([
        ...deletedImageIds,
        packagingImage[indexToRemove].id,
      ]);
    }

    setPackagingImage(
      packagingImage.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Check if adding these files would exceed the limit
      if (packagingImage.length + e.dataTransfer.files.length > MAX_IMAGES) {
        swal({
          icon: "error",
          title: "Maximum images exceeded",
          text: `You can upload a maximum of ${MAX_IMAGES} images.`,
        });
        return;
      }
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleSortData = (column) => {
    toggleSort(column, (params) => {
      setPaginationUrl(params.url);
      pagination.updateParams({
        sortType: params.sortType,
        sortDBTableColumn: params.sortDBTableColumn,
      });
    });
  };

  const handleShow = (isTrue, data) => {
    if (data !== null) {
      setPackageName(data.packaging_name);
      setDescription(data.description);
      setStatus(data.status);
      setforEditPrimary(data.id);
      setIsForCreate(isTrue);
      setUnitQuantity(formatNumber(data.unit_quantity)); // Format it on load
      setUnit(data.unit);
      setIsQuantityValid(true);

      // Set existing images with their IDs
      if (data.images && data.images.length > 0) {
        setPackagingImage(
          data.images.map((img) => ({
            id: img.id,
            data: img.packaging_image || null, // already has mime prefix
            isSelected: img.isSelected,
          })),
        );

        // Find and set the selected image
        const selected = data.images.find((img) => img.isSelected === 1);
        setSelectedImg(selected ? selected.id : null);
      } else {
        setPackagingImage([]);
        setSelectedImg(null);
      }
    } else {
      setPackagingImage([]);
      setSelectedImg(null);
      setIsQuantityValid(true); // Reset validation when creating new
    }

    setShow(true);
    setIsForCreate(isTrue);
    setDeletedImageIds([]);
  };
  const [selectedImg, setSelectedImg] = useState(null);

  const handleSelectImg = (id) => {
    setSelectedImg(id === selectedImg ? null : id);

    // Update local state for immediate UI feedback
    setPackagingImage(
      packagingImage.map((img) => ({
        ...img,
        isSelected: img.id === id || img.tempId === id ? true : false,
      })),
    );
  };

  const clearDataInputs = () => {
    setShow(false);
    setPackageName("");
    setDescription("");
    setPackagingImage([]);
    setUnit("kg");
    setUnitQuantity("");
    setValidated(false);
    setforEditPrimary("");
    setIsQuantityValid(true); // Reset validation

    setFilterDateCreated("");
    setSearchText("");
    setFilterColumn("all");
    setFilterStatus("Active");
    setStatus("");
    setSelectedImg(null);
  };

  // Validate quantity field
  const validateQuantity = (value) => {
    // Convert to string if it's not already
    const stringValue = String(value || "");

    // Check if value is empty after trimming
    if (!stringValue.trim()) {
      return false;
    }

    // Remove commas and parse the numeric value
    const numericValue = parseFloat(stringValue.replace(/,/g, ""));

    // Validate numeric value
    return !isNaN(numericValue) && numericValue > 0 && numericValue >= 0.01;
  };

  // Handle quantity input change with validation
  const handleQuantityChange = (value) => {
    // Convert to string if it's not already
    let val = String(value || "");

    // Allow only digits and one decimal point
    val = val.replace(/[^0-9.]/g, "");

    // Keep only one decimal point
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");

    // Limit decimal places to 5
    if (parts[1]?.length > 5) {
      parts[1] = parts[1].substring(0, 5);
      val = parts.join(".");
    }

    // Parse and format with commas (but don't break typing mid-decimal)
    const numericValue = parseFloat(val.replace(/,/g, ""));
    if (!isNaN(numericValue)) {
      const [intPart, decPart] = val.split(".");
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      val = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    }

    setUnitQuantity(val);

    // Validate quantity in real-time
    if (validated) {
      setIsQuantityValid(validateQuantity(val));
    }
  };

  // Validate all form fields
  const validateForm = () => {
    const isPackageNameValid = packageName.trim() !== "";
    const isQuantityValid = validateQuantity(unitQuantity); // This should now work
    const isStatusValid = status !== "";

    setIsQuantityValid(isQuantityValid);

    return isPackageNameValid && isQuantityValid && isStatusValid;
  };

  // modal create
  const handleFormCreate = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    // First validate using our custom validation
    const isFormValid = validateForm();

    // Then check HTML5 validation
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "warning",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
      return;
    }

    if (!isFormValid) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "warning",
        title: "Validation",
        text: "Quantity must be greater than 0",
      });
      return;
    }

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
            unit,
            unitQuantity: unitQuantity
              ? parseFloat(unitQuantity.replace(/,/g, "")) || 0
              : 0,
            description,
            packagingImage: packagingImage.map((img) => ({
              data: img.data || img,
              tempId: img.tempId || null,
            })),
            status,
            userLoggedID,
            selectedImg, // Send the selected image ID/tempId
          })
          .then((response) => {
            if (response.status === 200) {
              swal({
                title: "Success!",
                text: "Unit of Measure has been added successfully.",
                icon: "success",
                button: false,
                timer: 2500,
              }).then(() => {
                setShow(false);
                pagination.refreshData();
                setPackageName("");
                setDescription("");
                setUnit("kg");
                setUnitQuantity("");
                setPackagingImage([]);
                setStatus("");
                setValidated(false);
                setIsQuantityValid(true);
                setSelectedImg(null);
              });
            } else if (response.status === 201) {
              swal({
                title: "Unit of Measure Name Exists with same Quantity",
                icon: "error",
                button: true,
              });
            }
          });
      }
    });
    setValidated(true);
  };

  // ##### add modal end #####

  // ##### table #####

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

    // First validate using our custom validation
    const isFormValid = validateForm();

    if (!isFormValid) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Validation Error",
        text: "Please check all required fields. Quantity must be greater than 0.",
      });
      return;
    }

    // Then check HTML5 validation
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
      return;
    }

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
            unit,
            unitQuantity: unitQuantity
              ? parseFloat(unitQuantity.replace(/,/g, "")) || 0
              : 0,
            userLoggedID,
            forEditPrimary,
            selectedImg,
            deletedImageIds,
            packagingImage: packagingImage.map((img) => {
              if (img.id) return { id: img.id };
              return {
                data: img.data,
                tempId: img.tempId,
              };
            }),
          })
          .then((response) => {
            if (response.status === 200) {
              swal({
                title: "Success!",
                text: "Unit of Measure has been updated successfully.",
                icon: "success",
                button: false,
                timer: 2500,
              }).then(() => {
                clearDataInputs();
                handleClearFilter();
                setStatus("");
                setDeletedImageIds([]);
                setIsQuantityValid(true);
              });
            } else if (response.status === 201) {
              swal({
                title: "Unit of Measure Name Exists with same Quantity",
                icon: "error",
                button: true,
              });
            }
          });
      }
    });
    setValidated(true);
  };

  const handleClose = () => {
    setShow(false);
    clearDataInputs();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (packagingImage.length + files.length > MAX_IMAGES) {
        swal({
          icon: "error",
          title: "Maximum images exceeded",
          text: `You can upload a maximum of ${MAX_IMAGES} images.`,
        });
        event.target.value = "";
        return;
      }

      const newImages = [];
      let imagesProcessed = 0;

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const tempId = `temp-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            newImages.push({
              data: e.target.result,
              tempId: tempId,
            });
            imagesProcessed++;

            if (
              imagesProcessed ===
              Math.min(files.length, MAX_IMAGES - packagingImage.length)
            ) {
              setPackagingImage([...packagingImage, ...newImages]);
              event.target.value = "";
            }
          };
          reader.readAsDataURL(file);
        } else {
          swal({
            icon: "error",
            title: "Invalid file type",
            text: `${file.name} is not an image file. Only image files are allowed.`,
          });
        }
      });
    }
  };
  // ##### update modal end #####

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
      ) : authrztn.includes("UnitOfMeasure-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">UNIT OF MEASURE</span>
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
                          filterColumn === "packaging_name" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("packaging_name")}
                      >
                        Type
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
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid mt-5">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("packaging_name")}
                    >
                      <div className="d-flex flex-row">
                        Type
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "packaging_name" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "packaging_name" && isSortedAsc
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
                      onClick={() => handleSortData("unit_quantity")}
                    >
                      <div className="d-flex flex-row">
                        Quantity
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "unit_quantity" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "unit_quantity" && isSortedAsc
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
                      onClick={() => handleSortData("unit")}
                    >
                      <div className="d-flex flex-row">
                        Unit
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "unit" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "unit" && isSortedAsc
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
                        <td>{formatNumber(item.unit_quantity)}</td>
                        <td>{item.unit}</td>
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
            {/* REMOVED validated={validated} from Form to prevent green checkmarks */}
            <Form
              noValidate
              onSubmit={(e) =>
                isForCreate ? handleFormCreate(e) : handleFormUpdate(e)
              }
            >
              <Modal.Header className="border-0" closeButton>
                <Modal.Title>Packaging</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="col-sm w-100 p-3 flex-column justify-content-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <div
                      className="mb-3"
                      style={{
                        width: "100px",
                        height: "100px",
                        border: "2px dashed #ddd",
                        overflow: "hidden",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {selectedImg ? (
                        (() => {
                          // Find the selected image in the packagingImage array
                          const selectedImage = packagingImage.find(
                            (img) =>
                              img.id === selectedImg ||
                              img.tempId === selectedImg,
                          );

                          return (
                            <img
                              src={selectedImage?.data || selectedImage}
                              className="d-flex h-100 w-100 align-items-center justify-content-center"
                              alt="Selected Packaging Preview"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "cover",
                              }}
                            />
                          );
                        })()
                      ) : (
                        <div
                          className="d-flex flex-column h-100 w-100 align-items-center justify-content-center"
                          style={{
                            color: "#6c757d",
                            textAlign: "center",
                            fontSize: "14px",
                          }}
                        >
                          <div>No image selected</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label" htmlFor="packageName">
                    Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    id="packageName"
                    value={packageName}
                    placeholder="Enter Type"
                    required
                    onChange={(e) => setPackageName(e.target.value)}
                    className={
                      validated && !packageName.trim() ? "is-invalid" : ""
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label" htmlFor="unit">
                    Quantity & Unit <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="row">
                    <div className="col-sm-8">
                      <input
                        type="text"
                        id="unitQuantity"
                        value={unitQuantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className={`form-control ${
                          validated && !isQuantityValid ? "is-invalid" : ""
                        }`}
                        placeholder="Enter Quantity"
                        required
                      />
                      {/* {validated && !isQuantityValid && (
                    <div className="invalid-feedback d-block">
                      Quantity must be greater than 0
                    </div>
                  )} */}
                    </div>
                    <div className="col-sm-4">
                      <select
                        name=""
                        id=""
                        className="form-select"
                        required
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label" htmlFor="description">
                    Description
                  </Form.Label>
                  <Form.Control
                    id="description"
                    value={description}
                    as="textarea"
                    rows={6}
                    cols={6}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label" htmlFor="packageImage">
                    Packaging Images
                  </Form.Label>

                  {/* Drag and drop area */}
                  <div
                    className={`border rounded p-1 text-center ${
                      dragActive
                        ? "border-primary bg-light"
                        : "border-secondary"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("packageImage").click()
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bx bx-cloud-upload fs-1 text-muted mb-1"></i>
                      <p className="mb-1">
                        Drag & drop images here or click to browse
                      </p>
                      <small className="text-muted">
                        Supports JPG, PNG (Max 3 images)
                      </small>
                    </div>
                    <Form.Control
                      id="packageImage"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="d-none"
                    />
                  </div>

                  {/* Image previews with remove buttons */}
                  {packagingImage.length > 0 && (
                    <div className="mt-3">
                      <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {packagingImage.map((img, index) => (
                          <div
                            key={img.id || img.tempId || index}
                            className="position-relative"
                            onClick={() =>
                              handleSelectImg(img.id || img.tempId)
                            }
                            style={{
                              cursor: "pointer",
                              width: "100px",
                              height: "100px",
                              border:
                                img.id === selectedImg ||
                                img.tempId === selectedImg
                                  ? "2px solid blue"
                                  : "none",
                            }}
                          >
                            <img
                              src={img.data || img}
                              alt={`Preview ${index + 1}`}
                              className="img-thumbnail h-100 w-100 object-fit-cover"
                            />
                            <button
                              type="button"
                              className="position-absolute top-0 start-100 translate-middle btn btn-sm btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                              style={{ width: "24px", height: "24px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                            >
                              <i className="bx bx-x fs-6 lh-1"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      <small className="text-muted d-block mt-2 d-flex justify-content-center">
                        {packagingImage.length} of {MAX_IMAGES} images selected.
                        Click on the X to remove.
                      </small>
                    </div>
                  )}
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
                    className={`form-select ${
                      validated && !status ? "is-invalid" : ""
                    }`}
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

export default Packaging;
