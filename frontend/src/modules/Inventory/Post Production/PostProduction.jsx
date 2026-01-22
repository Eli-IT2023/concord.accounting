import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";

// pdf
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const PostProduction = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // State for search/filters
  const [searchText, setSearchText] = useState("");

  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  const [filterStatus, setFilterStatus] = useState("All");

  // fetch overview
  const [fetchOverviewCount, setFetchOverviewCount] = useState({
    inProgress: 0,
    postProduction: 0,
    reProduction: 0,
  });

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/PostProduction/fetchOverviewCounts`
      );

      if (!response.data.counts) {
        throw new Error("Counts object missing in response");
      }

      setFetchOverviewCount({
        inProgress: response.data.counts.inProgress ?? 0,
        postProduction: response.data.counts.postProduction ?? 0,
        reProduction: response.data.counts.reProduction ?? 0,
      });
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH TABLE
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/PostProduction/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // modal state
  const [showQAForm, setShowQAForm] = useState(false);
  const [validated, setValidated] = useState(false);

  // Handle checkbox selection
  const handleCheckboxChange = (e, id) => {
    e.stopPropagation();
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      // Only select items with status "In Progress"
      const inProgressIds = pagination.data
        .filter(
          (item) => item?.pp_batch_entry_id?.[0]?.status === "In Progress"
        )
        .map((item) => item.id);
      setSelectedItems(inProgressIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Add this useEffect to sync the selectAll state:
  useEffect(() => {
    // Get all "In Progress" items
    const inProgressItems = pagination.data.filter(
      (item) => item?.pp_batch_entry_id?.[0]?.status === "In Progress"
    );

    // Check if all "In Progress" items are selected
    const allInProgressSelected =
      inProgressItems.length > 0 &&
      inProgressItems.every((item) => selectedItems.includes(item.id));

    setSelectAll(allInProgressSelected);
  }, [selectedItems, pagination.data]);

  // Handle modal show/hide
  const handleShow = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }
    setShowQAForm(true);
  };

  const handleClose = () => {
    setShowQAForm(false);
    setValidated(false);
  };

  const [filterColumn, setFilterColumn] = useState("all");

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/PostProduction/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/PostProduction/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (selectedItems.length === 0) {
        alert("Please select at least one item");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/PostProduction/generateQcForms?ids=${selectedItems.join(
          ","
        )}`
      );
      if (response.data.success) {
        const batchData = response.data.data;

        const pdfResponse = await generateSingleQcPdf(batchData);
        const downloadLink = document.createElement("a");
        downloadLink.href = pdfResponse.pdfUrl;
        downloadLink.download = "Batch Entry QA Forms.pdf";
        downloadLink.click();
      } else {
        alert("Error fetching batch data: " + response.data.message);
      }
    } catch (error) {
      console.error("Error generating QC forms:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // pdf form
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const generateSingleQcPdf = async (batchData) => {
    console.log("Received batch data:", batchData);

    try {
      // Create a single PDF document
      const doc = new jsPDF();

      let firstPage = true;

      for (const batch of batchData) {
        if (batch.products?.length > 0) {
          // Generate PDF page for each product
          for (const product of batch.products) {
            try {
              if (!firstPage) {
                doc.addPage(); // Add new page for each product
              }

              // Generate the QC form content for this product
              generateQcPage(doc, batch, product);
              firstPage = false;
            } catch (error) {
              console.error(
                `PDF generation error for ${product.product_code}:`,
                error
              );
              // Add error page if needed
              if (!firstPage) doc.addPage();
              addErrorPage(doc, batch, product, error);
              firstPage = false;
            }
          }
        } else {
          // Add empty batch notice page
          if (!firstPage) doc.addPage();
          addEmptyBatchPage(doc, batch);
          firstPage = false;
        }
      }

      // If no products were processed, add a default message
      if (firstPage) {
        addNoDataPage(doc);
      }

      // Generate the single PDF file
      const pdfBlob = doc.output("blob");
      return { pdfUrl: URL.createObjectURL(pdfBlob) };
    } catch (error) {
      console.error("PDF generation failed:", error);
      throw error;
    }
  };

  // Helper function to add an error page
  const addErrorPage = (doc, batch, product, error) => {
    doc.setFontSize(18);
    doc.text("ERROR GENERATING QC FORM", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Product: ${product.product_code || "Unknown"}`, 20, 80);
    doc.text(`Batch: ${batch.batch_name || batch.batch_id}`, 20, 95);
    doc.text(`Error: ${error.message}`, 20, 110);
  };

  // Helper function to add empty batch page
  const addEmptyBatchPage = (doc, batch) => {
    doc.setFontSize(18);
    doc.text("NO PRODUCTS FOUND", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Batch: ${batch.batch_name || batch.batch_id}`, 20, 80);
    doc.text(`No products were found for this batch`, 20, 95);
  };

  // Helper function to add no data page
  const addNoDataPage = (doc) => {
    doc.setFontSize(18);
    doc.text("NO DATA AVAILABLE", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text(`No batch data was provided for PDF generation`, 20, 80);
  };

  const generateQcPage = (doc, batch, product) => {
    try {
      let y = 5;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- HEADER (company name, title, optional logo) ---
      // Logo (optional)
      const logoImage = settings?.logo || "";
      const logoWidth = 37;
      const logoHeight = 37;
      if (logoImage) {
        doc.addImage(
          logoImage,
          "PNG",
          pageWidth - logoWidth - 20,
          y,
          logoWidth,
          logoHeight
        );
      }

      // Report title (centered)
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("QUALITY CONTROL REPORT", 20, y + 35, {});
      y = 55;

      // --- PRODUCT / BATCH INFO (two columns) ---
      doc.setFontSize(12);

      // left column
      const leftX = 20;
      doc.text("Product Code", leftX, y);
      doc.setFont("helvetica", "normal");
      doc.text(product?.product_code || "XXXX", leftX + 37, y);

      doc.setFont("helvetica", "bold");
      doc.text("Batch Number", leftX, y + 8);
      doc.setFont("helvetica", "normal");
      doc.text(batch?.batch_name || "Batch 2", leftX + 37, y + 8);

      doc.setFont("helvetica", "bold");
      doc.text("Mixer Number", leftX, y + 16);
      doc.setFont("helvetica", "normal");
      doc.text(batch?.mixer_number?.toString() || "2", leftX + 37, y + 16);

      doc.setFont("helvetica", "bold");
      doc.text("Quantity", leftX, y + 24);
      doc.setFont("helvetica", "normal");
      const formattedQty = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(product?.weight ?? 0);
      doc.text(`${formattedQty} KG/s`, leftX + 37, y + 24);

      // right column
      const rightX = 116;
      doc.setFont("helvetica", "bold");
      doc.text("Date", rightX, y);
      doc.setFont("helvetica", "normal");
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(formattedDate, rightX + 37, y);

      doc.setFont("helvetica", "bold");
      doc.text("Team Leader", rightX, y + 8);
      doc.setFont("helvetica", "normal");
      doc.text(batch?.team_leader || "XXXX", rightX + 37, y + 8);

      doc.setFont("helvetica", "bold");
      doc.text("Team Members", rightX, y + 16);
      doc.setFont("helvetica", "normal");
      if (Array.isArray(batch?.members) && batch.members.length > 0) {
        // print each member on its own line under Team Members (keeps layout tidy)
        batch.members.forEach((m, i) => {
          doc.text(m, rightX + 37, y + 16 + i * 7);
        });
      } else {
        doc.text("XXXX", rightX + 37, y + 16);
      }

      // --- TABLE (no grid lines, alternating row colors) ---
      // layout
      y += 40; // move down to table start
      const startX = 20;
      const colWidths = [92, 40, 40]; // sum 172 (fits within right edge ~192)
      const totalTableWidth = colWidths[0] + colWidths[1] + colWidths[2];
      const headerHeight = 12;
      const rowHeight = 12;
      const tests = [
        "COLOR",
        "FLAVOR / AROMA",
        "MOISTURE (%)",
        "FOREIGN MATERIAL",
        "STD. PLATE COUNT",
        "COLIFORM",
        "E. COLI",
        "SALMONELLA",
        "OTHERS:",
      ];

      // header background (light gray)
      doc.setFillColor(255, 255, 255);
      doc.rect(startX, y, totalTableWidth, headerHeight, "F");

      // header text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("TEST PARAMETERS", startX + 3, y + 9);
      doc.text("RESULT", startX + colWidths[0] + 3, y + 9);
      doc.text("ACCEPTANCE", startX + colWidths[0] + colWidths[1] + 3, y + 9);

      // rows (alternating background)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      let rowY = y + headerHeight;
      tests.forEach((param, idx) => {
        // fill alternate row
        if (idx % 2 !== 0) {
          // white: we can skip filling white (page default), but to be safe we fill white
          doc.setFillColor(255, 255, 255);
          doc.rect(startX, rowY, totalTableWidth, rowHeight, "F");
        } else {
          // light gray row
          doc.setFillColor(245, 245, 245);
          doc.rect(startX, rowY, totalTableWidth, rowHeight, "F");
        }

        // text for the row (no borders drawn)
        doc.setTextColor(0);
        doc.text(param, startX + 3, rowY + 8);

        // leave RESULT and ACCEPTANCE columns empty (for manual filling) but draw placeholders (optional small underline)
        // If you want underlines instead of boxes, uncomment the lines below:
        // doc.setDrawColor(170);
        // doc.line(startX + colWidths[0] + 6, rowY + rowHeight - 3, startX + colWidths[0] + colWidths[1] - 6, rowY + rowHeight - 3); // result underline
        // doc.line(startX + colWidths[0] + colWidths[1] + 6, rowY + rowHeight - 3, startX + totalTableWidth - 6, rowY + rowHeight - 3); // acceptance underline

        rowY += rowHeight;
      });

      // --- SIGNATURE / APPROVAL ---
      const signY = rowY + 22;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Prepared By:", startX, signY);
      doc.text("Evaluated By:", startX + 70, signY);
      doc.text("Approved By:", startX + 140, signY);

      // signature lines
      const sigLineY = signY + 14;
      doc.setDrawColor(0);
      doc.line(startX, sigLineY, startX + 40, sigLineY);
      doc.line(startX + 70, sigLineY, startX + 110, sigLineY);
      doc.line(startX + 140, sigLineY, startX + 180, sigLineY);

      // role labels
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("TEAM LEADER", startX + 5, sigLineY + 6);
      doc.text("Q.C. HEAD", startX + 80, sigLineY + 6);
      doc.text("PLANT MANAGER", startX + 143, sigLineY + 6);

      // --- footer page number ---
      // const pageCount = doc.internal.getNumberOfPages();
      // doc.setFontSize(8);
      // doc.setFont("helvetica", "normal");
      // doc.text(`Page ${pageCount}`, pageWidth - 20, pageHeight - 10, {
      //   align: "right",
      // });
    } catch (error) {
      console.error("Error in PDF page generation:", error);
      throw error;
    }
  };

  // table click

  const handleRowClick = (id, status) => {
    navigate(`/inventory/view-batch-entry/${id}/post-production`, {
      state: {
        postProductionStatus: status,
      },
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("All");
    setFromFilter("");
    setToFilter("");
    setSearchCategory("all");
    setPaginationUrl(BASE_URL + "/PostProduction/fetchData");
    pagination.updateParams({});
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/PostProduction/fetchFilteredData");
    pagination.updateParams({
      filterStatus,
      fromFilter,
      toFilter,
    });
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
              <span className="fs-3">POST PRODUCTION</span>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={handleShow}
                disabled={selectedItems.length === 0}
              >
                Quality Control Form
              </button>
            </div>
          </div>

          <div className="container-fluid mt-3">
            <div className="row poOverviewCards justify-content-center">
              {/* Added justify-content-center */}
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Batch New</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {fetchOverviewCount.inProgress}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Post-Production</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {" "}
                      {fetchOverviewCount.postProduction}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="mx-2">Total Re-Production</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>
                      {" "}
                      {fetchOverviewCount.reProduction}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid ">
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
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="All">All</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="from">Schedule From</label>
                <input
                  type="date"
                  name="from"
                  id="from"
                  className="form-control"
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                />
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="from">Schedule To</label>
                <input
                  type="date"
                  name="to"
                  id="to"
                  className="form-control"
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                />
              </div>
              <div className="col-sm mb-3 d-flex flex-row ">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>

                <button
                  className="btn btn-light border mx-2"
                  onClick={clearFilters}
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
                          filterColumn === "batch_no" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("batch_no")}
                      >
                        Batch No.
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "batch_title" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("batch_title")}
                      >
                        Batch Title
                      </button>
                    </li>
                    {/* <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "mixer" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("mixer")}
                      >
                        Mixer
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "schedule_start" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("schedule_start")}
                      >
                        Schedule Start
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "schedule_end" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("schedule_end")}
                      >
                        Schedule End
                      </button>
                    </li> */}
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "date_created" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("date_created")}
                      >
                        Date Created
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

          <div className="container-fluid mt-3">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive "
                id="postProductionTable"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ height: "1.3rem", width: "1.3rem" }}
                        />
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BATCH NO
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BATCH TITLE
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE START
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE END
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DATE CREATED
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PROCCESSED BY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
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
                      <td colSpan="8" className="text-center py-4">
                        <div className="d-flex justify-content-center align-items-center">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="8" className="text-center text-danger py-4">
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
                      <td colSpan="8" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      const formattedDate = item?.createdAt
                        ? new Date(item.createdAt)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const sched_start_date = item?.start_date
                        ? new Date(item.start_date)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const sched_end_date = item?.end_date
                        ? new Date(item.end_date)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";

                      const isInProgress =
                        item?.pp_batch_entry_id?.[0]?.status === "In Progress";
                      const isChecked = selectedItems.includes(item.id);

                      return (
                        <tr
                          key={item.id || index}
                          onClick={(e) => {
                            if (!e.target.closest('input[type="checkbox"]')) {
                              const status =
                                item?.pp_batch_entry_id?.[0]?.status || "---";
                              handleRowClick(item.id, status);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(e, item.id)}
                              disabled={!isInProgress}
                              style={{ height: "1.3rem", width: "1.3rem" }}
                            />
                          </td>
                          <td>{item?.transaction_id || "---"}</td>
                          <td>{item?.batch_title || "---"}</td>
                          <td>{sched_start_date}</td>
                          <td>{sched_end_date}</td>
                          <td>{formattedDate}</td>
                          <td>Ako nalang muna siguro</td>
                          <td style={{ color: "#1E73BE" }}>
                            {item?.pp_batch_entry_id?.[0]?.status || "---"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Only show pagination controls when there's data */}
            {!pagination.loading &&
              !pagination.error &&
              pagination.data.length > 0 && (
                <PaginationControls {...pagination} />
              )}
          </div>

          <Modal
            show={showQAForm}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
          >
            <Form noValidate validated={validated} className="needs-validation">
              <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h6>Are you sure you want to download Quality Control Form?</h6>

                <h6>
                  <strong>Selected Items: </strong>
                  {selectedItems.length}
                </h6>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Confirm
                </Button>
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

export default PostProduction;
