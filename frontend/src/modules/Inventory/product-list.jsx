import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import productUnits from "../../assets/global/unitofmeasure";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { MultiSelect } from "react-multi-select-component";
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
import { set } from "date-fns";
import { constant_productCategory } from "../../constants/productOptions";
import { FaThLarge, FaList } from "react-icons/fa";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ProductListPdf from "./components/productListPDF";
import ProductListCsv from "./components/productListCSV";

const ProductList = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  const [searchFunction, setSearchFunction] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
  const [showChangeStatusButton, setShowChangeStatusButton] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectStatusFilter, setSelectStatusFilter] = useState("Active");
  const [filteredproductData, setFilteredProductData] = useState([]);
  const [filterColumn, setFilterColumn] = useState("all");
  const [productImages, setProductImages] = useState({});
  const [exportData, setExportData] = useState([]);

  const [productData, setProductData] = useState([]);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const handleCloseStatusModal = () => setShowChangeStatusModal(false);
  const handleShowChangeStatusModal = () => setShowChangeStatusModal(true);

  const csvLinkRef = useRef();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const [displayMode, setDisplayMode] = useState("list");

  const pagination = useServerPagination(
    `${BASE_URL}/product/getFilteredProductData`,
    10
  );

  const categoryFilterOptions = constant_productCategory.map((product) => ({
    label: product,
    value: product,
  }));

  const [seletedCategory, setSelectedCategory] = useState([
    categoryFilterOptions[0], // Raw Materials
    categoryFilterOptions[1], // Consumables
    categoryFilterOptions[2], // Finish Product
  ]);

  const handleChangeCategory = (selected) => {
    setSelectedCategory(selected);
    reloadProduct(selectStatusFilter, selected);
  };

  //fetching of product Data
  const reloadProduct = async (status, category) => {
    pagination.updateParams({
      selectStatusFilter: status,
      searchFunction,
      filterColumn,
      seletedCategory: category,
    });
    setIsLoading(false);
    // try {
    //   const res = await axios.get(
    //     `${BASE_URL}/product/getFilteredProductData`,
    //     {
    //       params: {
    //         selectStatusFilter: status,
    //         searchFunction,
    //         filterColumn,
    //       },
    //     }
    //   );
    //   setProductData(res.data);
    //   setFilteredProductData(res.data);
    //   // filterData(res.data, searchFunction, "");
    //   setIsLoading(false);
    //   console.log(res.data);
    // } catch (error) {
    //   console.error(error);
    // }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     reloadProduct();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setProductData(pagination.data);
    setFilteredProductData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    reloadProduct(selectStatusFilter, seletedCategory);
  }, [searchFunction]);

  useEffect(() => {
    setSearchFunction("");
  }, [filterColumn]);

  useEffect(() => {
    async function fetchImages() {
      if (!filteredproductData || filteredproductData.length === 0) return;
      const imagesObj = {};
      await Promise.all(
        filteredproductData.map(async (product) => {
          try {
            const res = await axios.get(
              `${BASE_URL}/product/product-images/${product.product_id}`
            );
            imagesObj[product.product_id] = res.data.map(
              (img) => img.product_image
            );
          } catch (err) {
            imagesObj[product.product_id] = [];
          }
        })
      );
      setProductImages(imagesObj);
    }
    fetchImages();
  }, [filteredproductData]);
  //end

  const handleCheckboxChange = (productId) => {
    const updatedCheckboxes = [...selectedCheckboxes];

    if (updatedCheckboxes.includes(productId)) {
      updatedCheckboxes.splice(updatedCheckboxes.indexOf(productId), 1);
    } else {
      updatedCheckboxes.push(productId);
    }

    setSelectedCheckboxes(updatedCheckboxes);
    setShowChangeStatusButton(updatedCheckboxes.length > 0);
  };

  const handleSelectAllChange = () => {
    const allProductIds = productData.map((data) => data.product_id);

    if (allProductIds.length === 0) {
      // No data, disable the checkbox
      return;
    }

    if (selectedCheckboxes.length === allProductIds.length) {
      setSelectedCheckboxes([]);
      setShowChangeStatusButton(false);
      setSelectAllChecked(false);
    } else {
      setSelectedCheckboxes(allProductIds);
      setShowChangeStatusButton(true);
      setSelectAllChecked(true);
    }
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
            reloadProduct(selectStatusFilter, seletedCategory);
            setSelectAllChecked(false);
            setSelectedCheckboxes([]);
            setShowChangeStatusButton(false);
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // const handleSearchChange = (e) => {
  //   setSearchFunction(e.target.value);
  //   // filterData(productData, e.target.value, selectStatusFilter);
  // };

  const handleStatusFilterChange = (event) => {
    setSelectStatusFilter(event.target.value);
    reloadProduct(event.target.value, seletedCategory);
  };

  // const applyFilter = () => {
  //   // filterData(productData, searchFunction, selectStatusFilter);
  // };

  const clearFilter = () => {
    setSearchFunction("");
    setSelectStatusFilter("Active");
    setSelectedCategory([
      categoryFilterOptions[0], // Raw Materials
      categoryFilterOptions[1], // Consumables
      categoryFilterOptions[2], // Finish Product
    ]);

    const ResetSeletedCategory = [
      categoryFilterOptions[0], // Raw Materials
      categoryFilterOptions[1], // Consumables
      categoryFilterOptions[2], // Finish Product
    ];
    reloadProduct("Active", ResetSeletedCategory);
  };

  const handleUpdateProductModal = (row) => {
    navigate(`/inventory/update-product/${row.product_id}`);
  };

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAllChange}
          checked={selectAllChecked}
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedCheckboxes.includes(row.product_id)}
          onChange={() => handleCheckboxChange(row.product_id)}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: "Product ID",
      selector: (row) => row.product_code,
    },
    {
      name: "Product Name",
      selector: (row) => row.product_name,
    },
    {
      name: "Product Category",
      selector: (row) => row.product_category,
    },
    {
      name: "Product Unit",
      selector: (row) => row.unit_of_measure,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;

        switch (row.status) {
          case "Active":
            color = "#32CD32";
            break;
          case "Inactive":
            color = "#FF0000";
            break;
          case "Archive":
            color = "#808080";
            break;
          default:
            color = "initial";
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: color,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {row.status}
          </div>
        );
      },
    },
  ];

  // For export props
  const props = {
    accountName: "All Account", // or your actual account name logic
    accountId: null,
    cutoffName: "All",
    dateFrom: null,
    dateTo: null,
    searchText: searchFunction,
    filterColumn,
  };

  const collectionsData = filteredproductData; // Use your filtered data for export

  // Export function for PDF
  const exportToPdf = async () => {
    swal({
      icon: "warning",
      title: "Export to PDF?",
      text: "Do you want to export this data as a PDF file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const res = await axios.get(`${BASE_URL}/product/getProductData`);
        setExportData(res.data);
        setShowPdfPreview(true);
      }
    });
  };

  const exportToCsv = async () => {
    swal({
      icon: "warning",
      title: "Export to CSV?",
      text: "Do you want to export this data as a CSV file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const res = await axios.get(`${BASE_URL}/product/getProductData`);
        setExportData(res.data);
        setTimeout(() => {
          csvLinkRef.current.link.click();
        }, 100);
      }
    });
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

              <div className="d-flex flex-row align-items-center gap-2">
                <button
                  className="btn"
                  onClick={() =>
                    setDisplayMode(displayMode === "list" ? "box" : "list")
                  }
                  title={
                    displayMode === "list"
                      ? "Switch to Box View"
                      : "Switch to List View"
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "22px",
                    outline: "none",
                    boxShadow: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <FaThLarge
                    color={displayMode === "box" ? "#4285f4" : "#bbb"}
                  />
                  <FaList color={displayMode === "list" ? "#4285f4" : "#bbb"} />
                </button>

                {/* Export Pdf and excel */}
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-success dropdown-toggle pt-2 px-3 me-2"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Export
                  </button>
                  <ul className="dropdown-menu">
                    <li
                      className="dropdown-item border-bottom"
                      style={{ cursor: "pointer" }}
                      onClick={() => exportToPdf()}
                    >
                      PDF
                    </li>
                    <li
                      className="dropdown-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => exportToCsv()}
                    >
                      CSV
                    </li>
                  </ul>
                </div>
                <ProductListCsv data={exportData} csvLinkRef={csvLinkRef} />
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
                    {/* <span>
                      <Plus size={32} color="#f2f2f2" />
                    </span> */}
                    <i className="bx bx-plus fs-5"></i>
                    Create
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="w-100 row mx-auto mt-4">
              <div className="col-sm">
                <span>Product Category</span>
                <MultiSelect
                  options={categoryFilterOptions}
                  value={seletedCategory}
                  onChange={handleChangeCategory}
                  labelledBy="Select"
                  className="w-100" // Full-width select component
                  style={{
                    maxWidth: "1000px !important",
                  }} // Apply max-width styling
                />
              </div>
              <div className="col-sm">
                <span>Product Status</span>
                <select
                  name=""
                  id=""
                  className="form-select"
                  value={selectStatusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archive">Archive</option>
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end filter-btn-container">
                {/* <button
                  className="btn d-none"
                  style={{ height: "46px" }}
                  onClick={applyFilter}
                >
                  Apply Filter
                </button> */}
                <button
                  className="btn btn-secondary"
                  // style={{ height: "46px" }}
                  onClick={clearFilter}
                >
                  Clear Filter
                </button>
              </div>
              <div className="col-sm"></div>
            </div>

            {/* <div className="w-100 mt-3 container-fluid">
              <div className="input-group">
                <span className="input-group-text bg-body" id="basic-addon2">
                  <MagnifyingGlass size={32} color="#969696" />
                </span>
                <input
                  type="text"
                  className="form-control p-2"
                  placeholder="Search"
                  onChange={handleSearchChange}
                  value={searchFunction}
                />
                <span className="input-group-text bg-body" id="basic-addon2">
                  <FadersHorizontal size={32} />
                </span>
              </div>
            </div> */}

            <div className="row mx-0 mt-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchFunction}
                  onChange={(e) => setSearchFunction(e.target.value)}
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
                    { value: "unit_of_measure", label: "Product Unit" },
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

            <div className="w-100 mt-3 container-fluid">
              {displayMode === "list" ? (
                <>
                  <DataTable
                    columns={columns}
                    data={filteredproductData}
                    customStyles={customStyles}
                    className="dataTable"
                    onRowClicked={handleUpdateProductModal}
                  />
                  <PaginationControls {...pagination} />
                </>
              ) : (
                <div className="row">
                  {filteredproductData.length === 0 ? (
                    <div className="no-data text-center py-5">
                      <h3>No Data Found</h3>
                    </div>
                  ) : (
                    filteredproductData.map((product, idx) => (
                      <div className="col-md-3 mb-4" key={product.product_id}>
                        <div
                          className="card"
                          style={{
                            borderRadius: "16px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            border: "none",
                            padding: "18px 12px",
                            background: "#fff",
                            minWidth: "260px",
                            maxWidth: "320px",
                            height: "400px",
                            margin: "auto",
                            cursor: "pointer", // Make it look clickable
                            transition: "box-shadow 0.2s",
                          }}
                          onClick={() => handleUpdateProductModal(product)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              handleUpdateProductModal(product);
                          }}
                          role="button"
                          aria-label={`Edit ${product.product_name}`}
                        >
                          {/* Header: Product Code and Status Dot */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 18,
                                letterSpacing: 2,
                              }}
                            >
                              {product.product_code}
                            </span>
                            <span
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background:
                                  product.status === "Active"
                                    ? "green"
                                    : product.status === "Inactive"
                                    ? "red"
                                    : "gray",
                                display: "inline-block",
                              }}
                            ></span>
                          </div>
                          {/* Image */}
                          <div
                            className="d-flex justify-content-center align-items-center mb-2"
                            style={{
                              height: "160px", // Set a fixed height for the image container
                              width: "100%",
                              overflow: "hidden",
                              background: "#fff",
                              borderRadius: "4px",
                              border: "1px solid #eee",
                            }}
                          >
                            <img
                              src={
                                productImages[product.product_id] &&
                                productImages[product.product_id][0]
                                  ? `data:image/jpeg;base64,${
                                      productImages[product.product_id][0]
                                    }`
                                  : "https://via.placeholder.com/160x160?text=No+Image"
                              }
                              alt="Product"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "4px",
                                background: "#fff",
                              }}
                            />
                          </div>
                          {/* Divider */}
                          <div
                            style={{
                              width: "100%",
                              height: "4px",
                              background: "#f2f2f2",
                              borderRadius: "2px",
                              margin: "12px 0 8px 0",
                            }}
                          ></div>
                          {/* Product Info */}
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 17 }}>
                                {product.product_name}
                              </div>
                              <div style={{ fontSize: 13, color: "#444" }}>
                                UOM:
                                {product.unit_of_measure ||
                                  product.product_unitMeasurement ||
                                  "N/A"}
                              </div>
                              <div style={{ fontSize: 13, color: "#444" }}>
                                DATE CREATED:
                                {product.createdAt
                                  ? new Date(
                                      product.createdAt
                                    ).toLocaleDateString("en-US")
                                  : "N/A"}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#444",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                marginLeft: "8px",
                              }}
                            >
                              {product.product_category ||
                                (product.category &&
                                  product.category.category_name) ||
                                "N/A"}
                            </div>
                          </div>
                          {/* Actions */}
                          {/* <div className="d-flex align-items-center justify-content-center gap-5 mt-2">
                            <button
                              className="btn"
                              style={{
                                background: "green",
                                color: "#fff",
                                borderRadius: "20px",
                                fontWeight: 600,
                                fontSize: "15px",
                                padding: "4px 18px",
                                border: "none",
                              }}
                              disabled
                            >
                              {product.status}
                            </button>
                            <button
                              className="btn"
                              style={{
                                background: "#6c74b6",
                                color: "#fff",
                                borderRadius: "20px",
                                fontWeight: 600,
                                fontSize: "15px",
                                padding: "4px 18px",
                                border: "none",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowChangeStatusModal(product);
                              }}
                            >
                              History
                            </button>
                          </div> */}
                        </div>
                      </div>
                    ))
                  )}
                  <PaginationControls {...pagination} />
                </div>
              )}
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
        backdrop="static"
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "24px" }}>Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="exampleForm.ControlInput2">
            <Form.Label style={{ fontSize: "20px" }}>Status</Form.Label>
            <Form.Select
              style={{ height: "40px", fontSize: "15px" }}
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
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseStatusModal}
            // style={{ fontSize: "20px" }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            // style={{ fontSize: "20px" }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Modal Preview */}
      <Modal
        show={showPdfPreview}
        size="xl"
        onHide={() => setShowPdfPreview(false)}
      >
        <div className="position-relative">
          <PDFDownloadLink
            document={<ProductListPdf data={exportData} />}
            fileName={`Product List.pdf`}
          >
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip
                  id="tooltip-right"
                  className="me-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  Download as{" "}
                  <strong className="text-danger">
                    Outstanding Receivable
                  </strong>
                </Tooltip>
              }
              delay={300}
            >
              <Button
                variant="light"
                className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
                style={{ bottom: "7rem", left: "2rem" }}
              >
                <i className="fa-solid fa-download"></i>
              </Button>
            </OverlayTrigger>
          </PDFDownloadLink>
          <PDFViewer style={{ width: "100%", height: "100vh" }}>
            <ProductListPdf data={exportData} />
          </PDFViewer>
        </div>
      </Modal>
    </>
  );
};

export default ProductList;
