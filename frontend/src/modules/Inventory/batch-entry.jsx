import { React, useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Card, Carousel, Spinner } from "react-bootstrap";
import swal from "sweetalert";
import axios from "axios";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useSort } from "../../hooks/customHook/tableSort"; // adjust path accordingly

import "../../assets/css/lionchem.css";

import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";
import BatchTicket from "./Sub Folder/batch-ticket-modal";

// print-agent
// 🔹 PDF generation
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// for printers
import PrintAgentRequiredModal from "../../assets/helpers/PrintAgentRequiredModal";
import {
  fetchLocalPrinters,
  sendPrintJob,
  sendPrintJobToBackend, // Add this import
  checkPrintAgentHealth,
} from "../../assets/helpers/printHelper";

export const generateBatchTicketPDF = async (batchTicketDataArray) => {
  const pdfDoc = await PDFDocument.create();

  // A4 Landscape (842 × 595)
  const pageWidth = 842;
  const pageHeight = 595;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let italicFont = font;
  try {
    italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  } catch {
    // fallback if HelveticaOblique unavailable
  }

  let currentBatchIndex = 0;

  // ==========================================
  // LOOP FOR EACH BATCH TICKET
  // ==========================================
  for (const batchTicketData of batchTicketDataArray) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 30;

    // Draw helper
    const drawAt = (
      text,
      x,
      yy,
      size = 10,
      useBold = false,
      usedFont = null,
      color = rgb(0, 0, 0)
    ) => {
      const f = usedFont ? usedFont : useBold ? boldFont : font;
      currentPage.drawText(String(text), { x, y: yy, size, font: f, color });
    };

    const checkNewPage = () => {
      if (y < 140) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 40;
      }
    };

    // ============================
    // HEADER
    // ============================
    const headerText = "CONCORD SCIENTIFIC AND CHEMICAL CORPORATION";
    const headerSize = 16;
    const headerWidth = boldFont.widthOfTextAtSize(headerText, headerSize);
    drawAt(headerText, (pageWidth - headerWidth) / 2, y, headerSize, true);
    y -= headerSize + 2;

    const subHeaderText = "BATCH TICKET";
    const subSize = 14;
    const subWidth = boldFont.widthOfTextAtSize(subHeaderText, subSize);
    drawAt(subHeaderText, (pageWidth - subWidth) / 2, y, subSize, true);
    y -= subSize + 8;
    const headerTopMargin = y;

    // ============================
    // INFO COLUMNS
    // ============================
    const marginX = 40;
    const contentWidth = pageWidth - marginX * 2;
    const colGap = 10;
    const colWidth = (contentWidth - colGap * 2) / 3;
    const leftX = marginX;
    const middleX = leftX + colWidth + colGap;
    const rightX = middleX + colWidth + colGap;
    const labelSize = 10;
    const lineSpacing = 6;

    const drawLabelValueInline = (label, value, x, yy) => {
      currentPage.drawText(label, {
        x,
        y: yy,
        size: labelSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      const lw = boldFont.widthOfTextAtSize(label, labelSize);
      currentPage.drawText(value, {
        x: x + lw,
        y: yy,
        size: labelSize,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // LEFT COLUMN
    drawLabelValueInline(
      "Batch No.: ",
      batchTicketData.batchNo || "N/A",
      leftX,
      y
    );
    y -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Batch Title: ",
      batchTicketData.batchTitle || "N/A",
      leftX,
      y
    );
    y -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Formula Name: ",
      batchTicketData.formulaName || "N/A",
      leftX,
      y
    );
    y -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Quantity: ",
      batchTicketData.quantity || "N/A",
      leftX,
      y
    );

    // MIDDLE COLUMN
    let midY = headerTopMargin;
    drawLabelValueInline(
      "Mixer: ",
      batchTicketData.mixer || "N/A",
      middleX,
      midY
    );
    midY -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Date Created: ",
      batchTicketData.dateCreated || "N/A",
      middleX,
      midY
    );
    midY -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Date Produced: ",
      batchTicketData.dateProduced || "N/A",
      middleX,
      midY
    );

    // RIGHT COLUMN
    let rightY = headerTopMargin;
    drawLabelValueInline(
      "Team Leader: ",
      batchTicketData.teamLeader || "N/A",
      rightX,
      rightY
    );
    rightY -= labelSize + lineSpacing;

    drawLabelValueInline(
      "Members: ",
      Array.isArray(batchTicketData.members)
        ? batchTicketData.members.join(", ")
        : batchTicketData.members || "N/A",
      rightX,
      rightY
    );

    // Continue below the lowest column
    y = Math.min(y, midY, rightY) - 10;

    // ====================================
    // PRODUCT TABLE (NO HEADER)
    // ====================================
    checkNewPage();

    const tableX = marginX;
    const tableWidth = pageWidth - 2 * marginX;

    const colWidths = [
      40,
      Math.floor(tableWidth * 0.28),
      Math.floor(tableWidth * 0.28),
      Math.floor(tableWidth * 0.14),
      Math.floor(tableWidth * 0.1),
      Math.floor(tableWidth * 0.1),
      Math.floor(tableWidth * 0.1),
    ];

    const diff = tableWidth - colWidths.reduce((a, b) => a + b, 0);
    colWidths[colWidths.length - 1] += diff;

    // Dynamic height calc
    let dynamicHeight = 24;

    if (batchTicketData.ingredients?.length) {
      for (const ing of batchTicketData.ingredients) {
        const instr = ing.instruction || "";
        const words = instr.split(" ");
        const maxWidth = colWidths[1] - 8;
        const instrSize = 7;

        let lines = [""];
        for (const w of words) {
          const test = lines[lines.length - 1]
            ? `${lines[lines.length - 1]} ${w}`
            : w;
          if (italicFont.widthOfTextAtSize(test, instrSize) <= maxWidth) {
            lines[lines.length - 1] = test;
          } else {
            lines.push(w);
          }
        }

        const extra = Math.max(0, (lines.length - 1) * 10);
        dynamicHeight += 38 + extra;
      }
    } else {
      dynamicHeight += 38;
    }

    const tableHeight = dynamicHeight + 6;
    const tableTopY = y;

    // ✅ ONLY OUTER BORDER - NO INTERNAL BORDERS
    currentPage.drawRectangle({
      x: tableX,
      y: tableTopY - tableHeight,
      width: tableWidth,
      height: tableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // ✅ REMOVED HEADER BACKGROUND BORDER - No separate header border
    // Header text only, no background rectangle

    const headers = [
      "No.",
      "Product Code",
      "Ingredients",
      "Weight (kg)",
      "Lot No.",
      "Check",
      "Load",
    ];

    let runningX = tableX;
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const cw = colWidths[i];
      const hw = boldFont.widthOfTextAtSize(h, 10);
      drawAt(h, runningX + (cw - hw) / 2, tableTopY - 18, 10, true);
      runningX += cw;
    }

    // ✅ REMOVED ALL VERTICAL BORDERS - No borders between columns
    // No vertical borders drawn for header or rows

    // ROWS
    let currentRowY = tableTopY - 24;

    if (batchTicketData.ingredients?.length) {
      for (let i = 0; i < batchTicketData.ingredients.length; i++) {
        const ing = batchTicketData.ingredients[i];
        let cx = tableX;

        // process instruction lines
        let instructionLines = 0;
        let lines = [];

        if (ing.instruction) {
          const words = ing.instruction.split(" ");
          const maxWidth = colWidths[1] - 8;
          const instrSize = 7;

          lines = [""];
          for (const w of words) {
            const test = lines[lines.length - 1]
              ? `${lines[lines.length - 1]} ${w}`
              : w;
            if (italicFont.widthOfTextAtSize(test, instrSize) <= maxWidth) {
              lines[lines.length - 1] = test;
            } else {
              lines.push(w);
            }
          }

          instructionLines = lines.length;
        }

        const baseRowHeight = 38;
        const lineHeight = 10;

        const rowHeightDynamic =
          baseRowHeight + Math.max(0, (instructionLines - 1) * lineHeight);

        // ✅ NO INDIVIDUAL ROW BORDERS - only outer border remains

        let textY = currentRowY - 12;
        let colX = tableX;

        // No.
        const noText = String(ing.no || i + 1);
        drawAt(
          noText,
          colX + (colWidths[0] - font.widthOfTextAtSize(noText, 10)) / 2,
          textY
        );
        colX += colWidths[0];

        // Product Code
        const prodText = ing.productCode || "N/A";
        drawAt(
          prodText,
          colX + (colWidths[1] - font.widthOfTextAtSize(prodText, 10)) / 2,
          textY
        );

        // Instructions
        lines.forEach((line, li) => {
          const lw = italicFont.widthOfTextAtSize(line, 7);
          drawAt(
            line,
            colX + (colWidths[1] - lw) / 2,
            textY - 12 - li * 10,
            7,
            false,
            italicFont,
            rgb(1, 0, 0)
          );
        });

        colX += colWidths[1];

        // Ingredients
        const ingText = ing.ingredients || "N/A";
        drawAt(
          ingText,
          colX + (colWidths[2] - font.widthOfTextAtSize(ingText, 10)) / 2,
          textY
        );
        colX += colWidths[2];

        // Weight
        const weightText = ing.weight
          ? parseFloat(ing.weight).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 5,
            })
          : "0.00";

        drawAt(
          weightText,
          colX + (colWidths[3] - font.widthOfTextAtSize(weightText, 10)) / 2,
          textY
        );
        colX += colWidths[3];

        // Lot No.
        const lotText = ing.lotNo || "";
        drawAt(
          lotText,
          colX + (colWidths[4] - font.widthOfTextAtSize(lotText, 10)) / 2,
          textY
        );

        currentRowY -= rowHeightDynamic;
      }
    } else {
      drawAt(
        "No ingredients found.",
        tableX + tableWidth / 2 - 50,
        currentRowY - 20,
        10
      );
    }

    y = tableTopY - tableHeight - 20;

    // ============================
    // MEASUREMENT TABLE
    // ============================
    checkNewPage();
    y -= 10;

    const mX = tableX;
    const mW = tableWidth;

    const firstColW = Math.round(mW * 0.1);
    const restCols = 10;

    let mCols = Array(restCols).fill(Math.floor((mW - firstColW) / restCols));
    const leftover = mW - firstColW - mCols.reduce((a, b) => a + b, 0);
    mCols[mCols.length - 1] += leftover;

    mCols = [firstColW, ...mCols];

    const mHeaderH = 28;
    const mSubH = 20;
    const mRowH = 30;
    const mRows = ["START", "FINISH"];

    const mTotalH = mHeaderH + mSubH + mRows.length * mRowH;

    // Outer border
    currentPage.drawRectangle({
      x: mX,
      y: y - mTotalH,
      width: mW,
      height: mTotalH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // ✅ FIXED MAIN HEADERS ALIGNMENT - properly centered in their cells
    let mx = mX + mCols[0];
    const mHeaders = [
      { text: "WEIGHING TIME", span: 2 },
      { text: "TIME", span: 2 },
      { text: "TEMPERATURE (°C)", span: 2 },
      { text: "RELATIVE HUMIDITY (%)", span: 4 },
    ];

    let colIndex = 1;
    for (const h of mHeaders) {
      const spanW = mCols
        .slice(colIndex, colIndex + h.span)
        .reduce((a, b) => a + b, 0);
      const hw = boldFont.widthOfTextAtSize(h.text, 9);

      // ✅ FIXED: Properly center the header text within its spanned columns
      drawAt(h.text, mx + (spanW - hw) / 2, y - 18, 9, true);

      mx += spanW;
      colIndex += h.span;
    }

    // SUBHEADERS
    const subs = [
      "",
      "b",
      "sb",
      "Production",
      "Mixing",
      "b",
      "sb",
      "pr",
      "b",
      "sb",
      "pr",
    ];

    const subTopY = y - mHeaderH;
    const subBottomY = subTopY - mSubH;

    let sx = mX;

    for (let i = 0; i < mCols.length; i++) {
      const colW = mCols[i];
      const label = subs[i] || "";

      currentPage.drawRectangle({
        x: sx,
        y: subBottomY,
        width: colW,
        height: mSubH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      if (label) {
        const lw = boldFont.widthOfTextAtSize(label, 8);
        drawAt(label, sx + (colW - lw) / 2, subBottomY + 7, 8, true);
      }

      sx += colW;
    }

    // START / FINISH ROWS
    let rY = subBottomY;

    for (const rowLabel of mRows) {
      rY -= mRowH;

      currentPage.drawLine({
        start: { x: mX, y: rY },
        end: { x: mX + mW, y: rY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      drawAt(rowLabel, mX + 8, rY + 10, 10, true);

      let bx = mX;
      for (const w of mCols) {
        currentPage.drawLine({
          start: { x: bx, y: rY },
          end: { x: bx, y: rY + mRowH },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        bx += w;
      }
    }

    y -= mTotalH + 20;

    // ====================================
    // SIGNATURES
    // ====================================
    const signY = 80;
    const labels = [
      "Prepared By",
      "Bulk Weigher",
      "Semi-Bulk Weigher",
      "Approved for Delivery",
    ];
    const sCount = labels.length;
    const sWidth = 150;
    const sGap = (contentWidth - sWidth * sCount) / (sCount - 1);

    let sigX = marginX;
    for (const label of labels) {
      drawAt(label, sigX, signY, 11, true);

      currentPage.drawLine({
        start: { x: sigX, y: signY - 28 },
        end: { x: sigX + sWidth, y: signY - 28 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      sigX += sWidth + sGap;
    }

    currentBatchIndex++;
  }

  const pdfBytes = await pdfDoc.save();
  const filename =
    batchTicketDataArray.length === 1
      ? `batch-ticket-${batchTicketDataArray[0].batchNo || "unknown"}.pdf`
      : `batch-tickets-${batchTicketDataArray.length}-batches.pdf`;

  return new File(
    [new Blob([pdfBytes], { type: "application/pdf" })],
    filename,
    {
      type: "application/pdf",
    }
  );
};

const BatchEntry2 = ({ authrztn, roleType }) => {
  // resets
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(true);
  const [validated, setValidated] = useState(false);

  // batch ticket modal
  const [showBatchTickets, setShowBatchTickets] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleCarousel = (selectedIndex) => {
    setActiveIndex(selectedIndex);
  };

  const handleClosePreview = () => {
    setShowBatchTickets(false);
    setActiveIndex(0);
  };

  // reprint modal
  const [showReprint, setShowReprint] = useState(false);
  const [remarksReprint, setRemarksReprint] = useState("");

  const handleCloseReprint = () => {
    setShowReprint(false);
    setRemarksReprint("");
  };

  const [batchTicketData, setBatchTicketData] = useState([]);

  // filters
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const handleApplyFilter = () => {
    setPaginationUrl(BASE_URL + "/BatchEntry2/fetchFilteredData");
    pagination.updateParams({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: selectedStatus || undefined,
    });
  };

  const handleClearFilter = () => {
    setSearchText("");
    setSearchCategory("all");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("");
    setPaginationUrl(BASE_URL + "/BatchEntry2/fetchData");
    pagination.updateParams({});
  };

  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    console.log("IM SEARCHING NOW");
    if (value.trim() === "") {
      setPaginationUrl(`${BASE_URL}/BatchEntry2/fetchData`);
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchCategory);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/BatchEntry2/fetchSearchData");

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

  const searchPlaceholders = {
    all: "All",
    batch_no: "Batch Number",
    batch_title: "Batch Name",
    created_by: "Created By",
  };

  const handleShowPreview = async (idsToPreview = selectedIds) => {};

  // widgets
  const [totalForPrinting, setTotalForPrinting] = useState(0);
  const [totalPrinted, setTotalPrinted] = useState(0);
  const [totalBatchTicket, setTotalBatchTicket] = useState(0);

  // total for printing count
  // total printed count
  // total batch ticket count
  useEffect(() => {
    // Fetch widget data from the server
    const fetchWidgetData = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/BatchEntry2/getBatchEntryWidgetCounts"
        );
        if (response.data.success) {
          setTotalForPrinting(response.data.totalForPrinting || 0);
          setTotalPrinted(response.data.totalPrinted || 0);
          setTotalBatchTicket(response.data.totalBatchTicket || 0);
        }
      } catch (error) {
        console.error("Error fetching widget data:", error);
      }
    };
    fetchWidgetData();
  }, []);

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/BatchEntry2/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  const reloadTable = async () => {
    setIsLoading(true);

    try {
      setPaginationUrl(`${BASE_URL}/BatchEntry2/fetchData`);
      await pagination.refreshData();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadTable();
  }, []);

  // for checkbox and buttons disabled
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // handle select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      const selectableIds =
        pagination.data
          ?.filter(
            (item) =>
              item.status !== "Pending Reprint" &&
              item.status !== "Accomplished"
          )
          .map((item, index) => item.id || index) || [];
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  // handle row checkbox
  const handleCheckboxChange = (id) => {
    if (selectedIds.includes(id)) {
      const newSelection = selectedIds.filter((sid) => sid !== id);
      setSelectedIds(newSelection);
      setSelectAll(false);
    } else {
      const newSelection = [...selectedIds, id];
      setSelectedIds(newSelection);
      const selectableIds =
        pagination.data
          ?.filter(
            (item) =>
              item.status !== "Pending Reprint" &&
              item.status !== "Accomplished"
          )
          .map((item, index) => item.id || index) || [];
      if (newSelection.length === selectableIds.length) {
        setSelectAll(true);
      }
    }
  };

  // handle row click (except checkbox)
  const handleRowClick = (e, id) => {
    if (e.target.type === "checkbox") return; // prevent checkbox click from navigating
    navigate(`/inventory/view-batch-entry/${id}`);
  };

  // Get all selected items from the current page first (for efficiency)
  const selectedItems = pagination.data.filter((item) =>
    selectedIds.includes(item.id)
  );

  // Check if ALL selected items are "For-Printing"
  const allAreForPrinting =
    selectedItems.length > 0 &&
    selectedItems.every(
      (item) =>
        item.status === "For-Printing" || item.status === "For-Reprinting"
    );
  // Check if ALL selected items are "Printed"
  const allArePrinted =
    selectedItems.length > 0 &&
    selectedItems.every((item) => item.status === "Printed");

  // Enable Print Batch ONLY if all selected are "For-Printing"
  const printBatchDisabled = !allAreForPrinting;

  // Enable Reprint ONLY if all selected are "Printed"
  const reprintDisabled = !allArePrinted;

  // button handlers
  const handleRequestReprint = () => {
    const reprintIds = pagination.data
      .filter(
        (item) => selectedIds.includes(item.id) && item.status === "Printed"
      )
      .map((item) => item.id);
    console.log("Request reprint for:", reprintIds);

    setShowReprint(true);
  };

  const handleReprintSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
        buttons: false,
        timer: 1500,
      });
    } else {
      const reprintIds = pagination.data
        .filter(
          (item) => selectedIds.includes(item.id) && item.status === "Printed"
        )
        .map((item) => item.id);

      if (reprintIds.length === 0) {
        swal(
          "Warning",
          "Please select at least one row to print batch ticket",
          "warning"
        );
        return;
      }

      try {
        const response = await axios.put(
          `${BASE_URL}/BatchEntry2/request-reprint`,
          {
            ids: reprintIds,
            remarks: remarksReprint,
            userLoggedID,
          }
        );

        const data = response?.data;

        if (data.success) {
          swal("Success", "Reprint request submitted", "success");

          // Reset selections first
          setSelectedIds([]);
          setSelectAll(false);
          setRemarksReprint("");
          setShowReprint(false);
          await reloadTable();
        } else {
          swal("Error", "No batch ticket data found", "error");
        }
      } catch (error) {
        console.error("Error fetching batch ticket data:", error);
        swal("Error", "Failed to load batch ticket data", "error");
      }
    }
    setValidated(true);
  };

  const handlePrintBatch = async () => {
    const printIds = pagination.data
      .filter(
        (item) =>
          (selectedIds.includes(item.id) && item.status === "For-Printing") ||
          item.status === "For-Reprinting"
      )
      .map((item) => item.id);

    console.log("Print batch tickets for:", printIds);

    if (printIds.length === 0) {
      swal(
        "Warning",
        "Please select at least one row to print batch ticket",
        "warning"
      );
      return;
    }

    try {
      const idsParam = printIds.join(",");
      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/getBatchTicketsData?ids=${idsParam}`
      );
      const data = response.data;

      if (data.success && data.data) {
        setBatchTicketData(data.data);

        console.log(data.data, "BATCH TICKETS DATA");
      } else {
        swal("Error", "No batch ticket data found", "error");
      }
    } catch (error) {
      console.error("Error fetching batch ticket data:", error);
      swal("Error", "Failed to load batch ticket data", "error");
    }

    setShowBatchTickets(true);
  };

  const handleConfirmPrintBatch = async () => {
    const confirm = await swal({
      title: "Confirm Action",
      text: "Are you sure you want to print these batch tickets?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (!confirm) return;

    try {
      const idsParam = selectedIds.join(",");
      const response = await axios.put(
        `${BASE_URL}/BatchEntry2/printBatchTickets?ids=${idsParam}`
      );
      const data = response.data;

      if (data.success) {
        await swal({
          title: "Success",
          text: "Batch tickets printed successfully",
          icon: "success",
          buttons: false,
          timer: 1500,
        });

        // Reset selections first
        setSelectedIds([]);
        setSelectAll(false);

        // Then reload table
        await reloadTable();

        handleClosePreview();
      } else {
        swal("Error", data.message || "No batch ticket data found", "error");
      }
    } catch (error) {
      console.error("Error printing batch tickets:", error);
      swal("Error", "Failed to print batch tickets", "error");
    }
  };

  // ----- printer
  // --- Printers state ---
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [localPrinters, setLocalPrinters] = useState([]);
  const [isFetchingPrinters, setIsFetchingPrinters] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showPrintAgentModal, setShowPrintAgentModal] = useState(false);
  const [modalType, setModalType] = useState("notInstalled");

  const generateTestPDF = async (printerName) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    page.drawText("LIONCHEM TEST PRINT", {
      x: 50,
      y: 800,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Printer info
    page.drawText(`Printer: ${printerName}`, {
      x: 50,
      y: 760,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Timestamp
    page.drawText(`Date: ${new Date().toLocaleString()}`, {
      x: 50,
      y: 740,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Test content
    page.drawText("This is a test print from LionChem System", {
      x: 50,
      y: 700,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Print Agent is working correctly", {
      x: 50,
      y: 670,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText("PDF generation is successful", {
      x: 50,
      y: 650,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Direct printing to selected printer", {
      x: 50,
      y: 630,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return new File(
      [new Blob([pdfBytes], { type: "application/pdf" })],
      `test-print-${printerName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
      {
        type: "application/pdf",
      }
    );
  };

  // /**
  //  * Generate PDF from BatchTicket data
  //  */
  // const generateBatchTicketPDF = async (batchTicketData) => {
  //   const pdfDoc = await PDFDocument.create();
  //   let page = pdfDoc.addPage([595, 842]); // A4 size
  //   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  //   const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  //   let y = 800; // Start from top

  //   // Helper function to add text with line wrapping
  //   const addText = (
  //     text,
  //     x,
  //     size = 12,
  //     isBold = false,
  //     color = rgb(0, 0, 0)
  //   ) => {
  //     const currentFont = isBold ? boldFont : font;
  //     page.drawText(text, { x, y, size, font: currentFont, color });
  //     y -= size + 4;
  //   };

  //   // Helper function to check if we need a new page
  //   const checkNewPage = () => {
  //     if (y < 100) {
  //       page = pdfDoc.addPage([595, 842]);
  //       y = 800;
  //       return true;
  //     }
  //     return false;
  //   };

  //   // Header
  //   addText("CONCORD SCIENTIFIC AND CHEMICAL CORPORATION", 50, 16, true);
  //   addText("BATCH TICKET", 50, 14, true);
  //   y -= 10;

  //   // Batch Information
  //   addText(`Batch No.: ${batchTicketData.batchNo || "N/A"}`, 50, 12);
  //   addText(`Batch Title: ${batchTicketData.batchTitle || "N/A"}`, 50, 12);
  //   addText(`Formula Name: ${batchTicketData.formulaName || "N/A"}`, 50, 12);
  //   addText(`Quantity: ${batchTicketData.quantity || "N/A"}`, 50, 12);
  //   addText(`Mixer: ${batchTicketData.mixer || "N/A"}`, 50, 12);
  //   addText(`Date Created: ${batchTicketData.dateCreated || "N/A"}`, 50, 12);
  //   addText(`Date Produced: ${batchTicketData.dateProduced || "N/A"}`, 50, 12);
  //   addText(`Team Leader: ${batchTicketData.teamLeader || "N/A"}`, 50, 12);

  //   // Handle members array
  //   const membersText = Array.isArray(batchTicketData.members)
  //     ? batchTicketData.members.join(", ")
  //     : batchTicketData.members || "N/A";
  //   addText(`Members: ${membersText}`, 50, 12);

  //   y -= 20;

  //   // Ingredients Table Header
  //   checkNewPage();
  //   addText("INGREDIENTS", 50, 14, true);
  //   y -= 10;

  //   // Table headers
  //   const tableHeaders = [
  //     "No.",
  //     "Product Code",
  //     "Ingredients",
  //     "Weight (kg)",
  //     "Lot No.",
  //   ];
  //   let tableX = 50;

  //   tableHeaders.forEach((header) => {
  //     addText(header, tableX, 10, true);
  //     tableX += 100;
  //   });

  //   y -= 15;

  //   // Ingredients data
  //   if (batchTicketData.ingredients && batchTicketData.ingredients.length > 0) {
  //     batchTicketData.ingredients.forEach((ingredient, index) => {
  //       checkNewPage();

  //       tableX = 50;
  //       addText(String(ingredient.no || index + 1), tableX, 10);
  //       tableX += 100;
  //       addText(ingredient.productCode || "N/A", tableX, 10);
  //       tableX += 100;
  //       addText(ingredient.ingredients || "N/A", tableX, 10);
  //       tableX += 100;
  //       addText(ingredient.weight || "0.0000", tableX, 10);
  //       tableX += 100;
  //       addText(ingredient.lotNo || "", tableX, 10);

  //       y -= 15;
  //     });
  //   } else {
  //     addText("No ingredients found.", 50, 10);
  //     y -= 15;
  //   }

  //   // Footer section
  //   y -= 30;
  //   checkNewPage();
  //   addText("Signatures:", 50, 12, true);
  //   y -= 20;

  //   const signatures = [
  //     "Prepared By",
  //     "Bulk Weigher",
  //     "Semi-Bulk Weigher",
  //     "Approved for Delivery",
  //   ];
  //   let signatureX = 50;

  //   signatures.forEach((signature) => {
  //     addText(signature, signatureX, 10);
  //     signatureX += 120;
  //   });

  //   const pdfBytes = await pdfDoc.save();
  //   return new File(
  //     [new Blob([pdfBytes], { type: "application/pdf" })],
  //     `batch-ticket-${batchTicketData.batchNo || "unknown"}.pdf`,
  //     { type: "application/pdf" }
  //   );
  // };

  // Update handleTestPrint to handle loading state
  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      swal({
        icon: "error",
        title: "No Printer Selected",
        text: "Please select a printer first.",
      });
      return;
    }

    setIsPrinting(true);

    try {
      console.log("=== TEST PRINT DEBUG ===");
      console.log("Selected Printer:", selectedPrinter);
      console.log("Print Agent Health:", await checkPrintAgentHealth());

      // Generate enhanced test PDF
      const pdfFile = await generateTestPDF(selectedPrinter.name);
      console.log("PDF File generated:", {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type,
      });

      // Send directly to Print Agent
      console.log("Sending to Print Agent...");
      await sendPrintJob(selectedPrinter, pdfFile, userLoggedID);
      console.log("=== TEST PRINT COMPLETE ===");
    } catch (err) {
      console.error("=== TEST PRINT FAILED ===");
      console.error("Error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  // actual print
  const handlePrint = async () => {
    if (!selectedPrinter) {
      swal({
        icon: "error",
        title: "No Printer Selected",
        text: "Please select a printer first.",
      });
      return;
    }

    setIsPrinting(true);

    try {
      console.log("🖨️ Starting batch ticket print for ALL selected tickets...");

      // Check if we have any batch tickets to print
      if (!batchTicketData || batchTicketData.length === 0) {
        throw new Error("No batch ticket data available for printing");
      }

      console.log(
        `📄 Preparing to print ${batchTicketData.length} batch tickets`
      );

      // Transform ALL batch ticket data
      const allPrintData = batchTicketData.map((currentBatchData) => ({
        batchNo: currentBatchData.befp_batch_entry_id?.transaction_id || "N/A",
        batchTitle: currentBatchData.befp_batch_entry_id?.batch_title || "N/A",
        formulaName: currentBatchData.befp_product_id?.product_name || "N/A",
        quantity: getQuantity(currentBatchData),
        mixer: getAllMixerNames(currentBatchData),
        dateCreated: formatDateTime(
          currentBatchData.befp_batch_entry_id?.createdAt
        ),
        dateProduced: formatDateTime(
          currentBatchData.befp_batch_entry_id?.start_date
        ),
        teamLeader: currentBatchData.befp_batch_entry_id?.team_leader || "N/A",
        members: getMembersList(currentBatchData.befp_batch_entry_id),
        ingredients: (currentBatchData.befmu_formulated_product_id || []).map(
          (material, index) => ({
            no: index + 1,
            productCode: material?.befmu_product_id?.product_code || "N/A",
            instruction:
              material?.instruction ||
              material?.befmu_product_id?.instruction ||
              "",
            ingredients: material?.befmu_product_id?.product_name || "N/A",
            weight: material?.target_weight
              ? parseFloat(material.target_weight).toFixed(4)
              : "0.0000",
            lotNo:
              material?.bestm_be_material_used_id?.length > 0
                ? material.bestm_be_material_used_id
                    .map((history) => history.lot)
                    .filter((lot) => lot && lot.trim() !== "")
                    .join(", ")
                : "",
          })
        ),
      }));

      console.log("📋 Transformed ALL print data:", allPrintData);

      // Generate PDF with ALL batch tickets
      const pdfFile = await generateBatchTicketPDF(allPrintData);
      console.log("📄 PDF generated with all tickets:", {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type,
      });

      // ✅ STEP 1: Download the PDF first
      // console.log("💾 Downloading PDF file...");
      // const downloadUrl = URL.createObjectURL(pdfFile);
      // const downloadLink = document.createElement("a");
      // downloadLink.href = downloadUrl;
      // downloadLink.download = pdfFile.name;
      // document.body.appendChild(downloadLink);
      // downloadLink.click();
      // document.body.removeChild(downloadLink);
      // URL.revokeObjectURL(downloadUrl);

      // console.log("✅ PDF downloaded successfully");

      // 🚫 COMMENTED OUT FOR TESTING - STEP 2: Send to Print Agent

      console.log(
        "🚀 Sending ALL batch tickets to printer:",
        selectedPrinter.name
      );
      await sendPrintJob(selectedPrinter, pdfFile, userLoggedID);

      console.log("✅ All batch tickets printed successfully");

      // Show success message
      swal({
        icon: "success",
        title: "Print Complete!",
        text: `Batch tickets PDF downloaded and sent to ${selectedPrinter.name}`,
        timer: 3000,
      });

      // // ✅ Show download success message (for testing)
      // swal({
      //   icon: "success",
      //   title: "PDF Downloaded!",
      //   text: `Batch tickets PDF has been downloaded to your device. ${batchTicketData.length} batch ticket(s) processed.`,
      //   timer: 3000,
      // });

      // ✅ STEP 3: Update the database status via axios call
      const idsParam = selectedIds.join(",");
      const response = await axios.put(
        `${BASE_URL}/BatchEntry2/printBatchTickets?ids=${idsParam}`
      );
      const data = response.data;

      if (data.success) {
        // Reset selections first
        setSelectedIds([]);
        setSelectAll(false);

        // Then reload table
        await reloadTable();

        // Close the modals after successful operation
        setShowPrinterModal(false);
        handleClosePreview();
      } else {
        swal("Error", data.message || "No batch ticket data found", "error");
      }
    } catch (error) {
      console.error("❌ Batch ticket operation failed:", error);

      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        console.error("Server error:", error.response.data);
        swal({
          icon: "error",
          title: "Operation Failed",
          text:
            error.response.data.message ||
            "Failed to update print status in database",
        });
      } else if (error.request) {
        // Network error
        console.error("Network error:", error.request);
        swal({
          icon: "error",
          title: "Network Error",
          text: "Failed to connect to server. Please check your connection.",
        });
      } else {
        // Other errors
        swal({
          icon: "error",
          title: "Operation Failed",
          text: error.message || "Failed to process batch tickets",
        });
      }
    } finally {
      setIsPrinting(false);
    }
  };

  // const handlePrintAllBatchTickets = async () => {
  //   if (!selectedPrinter) {
  //     swal({
  //       icon: "error",
  //       title: "No Printer Selected",
  //       text: "Please select a printer first.",
  //     });
  //     return;
  //   }

  //   setIsPrinting(true);

  //   try {
  //     console.log(
  //       "🖨️ Starting batch ticket printing for all selected tickets..."
  //     );

  //     // Transform all batch ticket data
  //     const allPrintData = batchTicketData.map((batchData) => ({
  //       batchNo: batchData.befp_batch_entry_id?.transaction_id || "N/A",
  //       batchTitle: batchData.befp_batch_entry_id?.batch_title || "N/A",
  //       formulaName: batchData.befp_product_id?.product_name || "N/A",
  //       quantity: getQuantity(batchData),
  //       mixer: getAllMixerNames(batchData),
  //       dateCreated: formatDateTime(batchData.befp_batch_entry_id?.createdAt),
  //       dateProduced: formatDateTime(batchData.befp_batch_entry_id?.start_date),
  //       teamLeader: batchData.befp_batch_entry_id?.team_leader || "N/A",
  //       members: getMembersList(batchData.befp_batch_entry_id),
  //       ingredients: (batchData.befmu_formulated_product_id || []).map(
  //         (material, index) => ({
  //           no: index + 1,
  //           productCode: material?.befmu_product_id?.product_code || "N/A",
  //           ingredients: material?.befmu_product_id?.product_name || "N/A",
  //           weight: material?.target_weight
  //             ? parseFloat(material.target_weight).toFixed(4)
  //             : "0.0000",
  //           lotNo:
  //             material?.bestm_be_material_used_id?.length > 0
  //               ? material.bestm_be_material_used_id
  //                   .map((history) => history.lot)
  //                   .filter((lot) => lot && lot.trim() !== "")
  //                   .join(", ")
  //               : "",
  //         })
  //       ),
  //     }));

  //     console.log(`📋 Preparing to print ${allPrintData.length} batch tickets`);

  //     // Generate single PDF with all batch tickets
  //     const pdfFile = await generateBatchTicketPDF(allPrintData);
  //     console.log("📄 Combined PDF generated:", {
  //       name: pdfFile.name,
  //       size: pdfFile.size,
  //       type: pdfFile.type,
  //     });

  //     // Send to Print Agent
  //     await sendPrintJob(selectedPrinter, pdfFile, userLoggedID);

  //     console.log("✅ All batch tickets printed successfully");

  //     swal({
  //       icon: "success",
  //       title: "Print Complete!",
  //       text: `${allPrintData.length} batch tickets sent to ${selectedPrinter.name}`,
  //       timer: 3000,
  //     });

  //     // Close the modal after printing
  //     setShowPrinterModal(false);
  //     handleClosePreview();
  //   } catch (error) {
  //     console.error("❌ Batch ticket printing failed:", error);
  //     swal({
  //       icon: "error",
  //       title: "Print Failed",
  //       text: error.message || "Failed to print batch tickets",
  //     });
  //   } finally {
  //     setIsPrinting(false);
  //   }
  // };

  // Add helper functions used in handlePrint
  const getQuantity = (ticketData) => {
    const formatNumber = (value) => {
      if (isNaN(value)) return "N/A";
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const weight = ticketData?.weight ? parseFloat(ticketData.weight) : null;
    const packagingName = ticketData?.packaging_name || "N/A";
    const packagingUnitQuantity = ticketData?.packaging_unit_quantity
      ? parseFloat(ticketData.packaging_unit_quantity)
      : null;
    const packagingUnit = ticketData?.packaging_unit || "N/A";

    const numberOfPackaging =
      packagingUnitQuantity && weight ? weight / packagingUnitQuantity : null;

    return `${
      weight !== null ? formatNumber(weight) : "N/A"
    } ${packagingUnit.toUpperCase()}/s (${
      numberOfPackaging !== null ? formatNumber(numberOfPackaging) : "N/A"
    } x ${
      packagingUnitQuantity !== null
        ? formatNumber(packagingUnitQuantity)
        : "N/A"
    } ${packagingUnit.toUpperCase()}/${packagingName.toUpperCase()})`;
  };

  const getAllMixerNames = (ticketData) => {
    const mixers = ticketData?.befp_batch_entry_id?.betm_batch_entry_id || [];
    if (!mixers || mixers.length === 0) {
      return "N/A";
    }

    const mixerNames = mixers
      .map((mixerTag) => mixerTag?.betm_mixer_id?.name)
      .filter((name) => name)
      .join(", ");

    return mixerNames || "N/A";
  };

  const getMembersList = (batchEntryInfo) => {
    if (!batchEntryInfo?.members) return ["N/A"];

    const members = batchEntryInfo.members;
    if (members.includes(",")) {
      return members.split(",").map((member) => member.trim());
    } else {
      return members.split(" ").map((member) => member.trim());
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} | ${timePart}`;
  };

  // --- Printer modal handler ---
  const handleOpenPrinterModal = async () => {
    setIsFetchingPrinters(true);
    setShowPrintAgentModal(false);

    try {
      const { printers, agentInstalled, modalType } =
        await fetchLocalPrinters();

      if (agentInstalled) {
        setLocalPrinters(printers || []);
        setShowPrinterModal(true);

        if (!printers || printers.length === 0) {
          swal({
            icon: "info",
            title: "No Printers Found",
            text: "The Print Agent is running but no printers were detected on this machine.",
          });
        }
      } else {
        setModalType(modalType);
        setShowPrintAgentModal(true);
      }
    } catch (err) {
      console.error("[CompanyProfile] Error fetching printers:", err);
      setModalType("notInstalled");
      setShowPrintAgentModal(true);
    } finally {
      setIsFetchingPrinters(false);
    }
  };

  // Add handler for closing printer modal
  const handleClosePrinterModal = () => {
    setShowPrinterModal(false);
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
      ) : authrztn.includes("BatchEntry-View") ? (
        <>
          {/* title */}
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">BATCH ENTRY</span>
              {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
            </div>

            <div className="d-flex flex-row">
              <button
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
                  navigate("/inventory/batch-tickets-reprint");
                }}
              >
                <span style={{ color: "#0d6efd", marginLeft: 4 }}>
                  Reprint List
                </span>
              </button>
              <button
                className="btn btn-primary d-flex align-items-center title-button"
                onClick={() => {
                  navigate("/inventory/create-batch-entry");
                  window.scrollTo(0, 0);
                }}
              >
                <i className="bx bx-plus fs-5"></i> Create
              </button>
            </div>
          </div>

          {/* widgets  */}
          <div className="container-fluid mt-3">
            <div className="row poOverviewCards">
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-print"></i>
                    <span className="mx-2">Total For Printing</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>{totalForPrinting}</p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-circle-check"></i>
                    <span className="mx-2">Total Printed</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>{totalPrinted}</p>
                  </div>
                </div>
              </div>
              <div className="col-sm mb-3">
                <div className="border shadow-sm rounded h-100 p-3">
                  <h5>
                    <i className="fa-solid fa-layer-group"></i>
                    <span className="mx-2">Total Batch Ticket</span>
                  </h5>
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    <p style={{ color: "#6FAB23" }}>{totalBatchTicket}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* filters */}
          <div className="container-fluid">
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <label htmlFor="select-agent">Status</label>
                <select
                  id="select-agent"
                  className="form-select"
                  aria-label="Select Agent"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="For-Printing">For-Printing</option>
                  <option value="For-Reprinting">For-Reprinting</option>
                  <option value="Pending Reprint">Pending Reprint</option>
                  <option value="Printed">Printed</option>
                  <option value="Accomplished">Accomplished</option>
                </select>
              </div>

              <div className="col-sm mb-2">
                <label htmlFor="date-created">Schedule Start Date</label>
                <input
                  type="date"
                  name="date-created"
                  id="date-created"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="date-to">Schedule End Date</label>
                <input
                  type="date"
                  name="date-to"
                  id="date-to"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button
                  type="button"
                  className="btn btn-dark w-100"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={handleApplyFilter}
                >
                  Apply Filter
                </button>
                <button
                  className="btn btn-light border w-100"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </button>
              </div>
            </div>
            <div className="row mx-auto mt-2">
              <div className="col-12">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={`Search ${searchPlaceholders[
                      searchCategory
                    ].toLowerCase()}`}
                    aria-label="Search"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fa-solid fa-sliders"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {Object.entries(searchPlaceholders).map(([key, value]) => (
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

          {/* table */}
          <div className="container-fluid mt-5">
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
                <thead className="bg-light">
                  <tr
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      fontSize: 13,
                    }}
                  >
                    <th style={{ backgroundColor: "#EBEFF4" }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="form-check-input p-2"
                      />
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BATCH NO.
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BATCH NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE START DATE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      SCHEDULE END DATE
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
                      CREATED BY
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
                  {pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-3">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          item.status === "For-Printing" ||
                          item.status === "For-Reprinting"
                            ? "table-success"
                            : item.status === "Printed"
                            ? "table-info"
                            : item.status === "Pending Reprint"
                            ? "table-warning"
                            : ""
                        }
                        onClick={(e) => handleRowClick(e, item.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleCheckboxChange(item.id)}
                            className="form-check-input p-2"
                            disabled={
                              item.status === "Pending Reprint" ||
                              item.status === "Accomplished"
                            }
                          />
                        </td>
                        <td>{item.transaction_id}</td>
                        <td>{item.batch_title}</td>
                        <td>
                          {item.start_date
                            ? (() => {
                                const date = new Date(item.start_date);
                                const datePart = date.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                  }
                                );
                                const timePart = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                );
                                return `${datePart} - ${timePart}`;
                              })()
                            : "---"}
                        </td>
                        <td>
                          {item.end_date
                            ? (() => {
                                const date = new Date(item.end_date);
                                const datePart = date.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                  }
                                );
                                const timePart = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                );
                                return `${datePart} - ${timePart}`;
                              })()
                            : "---"}
                        </td>
                        <td>
                          {item.createdAt
                            ? (() => {
                                const date = new Date(item.createdAt);
                                const datePart = date.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                  }
                                );
                                const timePart = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                );
                                return `${datePart} - ${timePart}`;
                              })()
                            : "---"}
                        </td>
                        <td>{item.be_created_by?.full_name || "---"}</td>
                        <td
                          className={`fw-semibold ${
                            item.status === "For-Printing" ||
                            item.status === "For-Reprinting"
                              ? "text-primary"
                              : item.status === "Printed"
                              ? "text-success"
                              : "text-primary"
                          }`}
                        >
                          {item.status === "Printed" && item.print_count > 0
                            ? `Printed (${item.print_count})`
                            : item.status === "For-Reprinting" &&
                              item.reprint_count > 1
                            ? `For-Reprinting (${item.reprint_count})`
                            : item.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />

            {/* Buttons */}
            <div className="row mt-3">
              <div className="col-sm d-flex flex-row gap-2">
                <button
                  className={`btn ${
                    reprintDisabled ? "btn-secondary" : "btn-primary"
                  }`}
                  type="button"
                  disabled={reprintDisabled}
                  onClick={handleRequestReprint}
                >
                  Request For Reprint
                </button>
                <button
                  className={`btn ${
                    printBatchDisabled ? "btn-secondary" : "btn-primary"
                  }`}
                  type="button"
                  disabled={printBatchDisabled}
                  onClick={handlePrintBatch}
                >
                  Print Batch Ticket
                </button>
              </div>
              <div className="col-sm"></div>
              <div className="col-sm"></div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* Remarks sa request ng reprint */}
      <Modal
        show={showReprint}
        onHide={handleCloseReprint}
        backdrop="static"
        keyboard={false}
      >
        <Form noValidate validated={validated} onSubmit={handleReprintSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Reprint Remarks</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-2">
              <h6 className="text-start">Are you sure you want to reprint?</h6>
              <Form.Label className="form-label mt-2">
                Remarks <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                value={remarksReprint}
                as="textarea"
                onChange={(e) => setRemarksReprint(e.target.value)}
                placeholder="Leave a comment here"
                style={{ minHeight: "10rem" }}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please provide remarks for the reprint request.
              </Form.Control.Feedback>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseReprint}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showBatchTickets}
        onHide={handleClosePreview}
        backdrop="static"
        dialogClassName={`receiving-pdf-custom-modal-width ${
          showPrinterModal
            ? "batch-ticket-modal-hidden"
            : "batch-ticket-modal-visible"
        }`}
      >
        <Modal.Header
          className="border-bottom p-0 p-2 px-3"
          style={{ background: "#EEEEEE" }}
          closeButton
        >
          <span className="fw-semibold" style={{ fontSize: "15px" }}>
            Batch Print Preview
            {batchTicketData.length > 1 &&
              `(${activeIndex + 1}/${batchTicketData.length})`}
          </span>
        </Modal.Header>
        <Modal.Body>
          {batchTicketData.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading report data...</p>
            </div>
          ) : (
            <Carousel
              activeIndex={activeIndex}
              onSelect={handleCarousel}
              interval={null}
              indicators={batchTicketData.length > 1}
              controls={batchTicketData.length > 1}
              prevIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-prev-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginLeft: "-150px",
                  }}
                />
              }
              nextIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-next-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginRight: "-150px",
                  }}
                />
              }
            >
              {batchTicketData.map((batchItem, index) => (
                <Carousel.Item key={index}>
                  <div className="w-100 p-2 px-5" id="contentSlide">
                    <BatchTicket ticketData={batchItem} />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          )}
          {/* <BatchTicket /> */}
        </Modal.Body>
        <Modal.Footer className="p-0 border-top p-2">
          <button
            type="button"
            className="btn btn-primary me-2 d-flex align-items-center"
            onClick={handleOpenPrinterModal}
            disabled={isFetchingPrinters}
          >
            {isFetchingPrinters ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Checking...
              </>
            ) : (
              "Print Batch Entry Tickets"
            )}
          </button>

          {/* Print All Button */}
          {/* <Button
            variant="primary"
            className="px-4"
            type="button"
            disabled={batchTicketData.length === 0}
            onClick={handlePrint}
          >
            Print All ({batchTicketData.length})
          </Button> */}
        </Modal.Footer>
      </Modal>

      {/* --- Printer Modal --- */}
      <Modal
        show={showPrinterModal}
        onHide={handleClosePrinterModal}
        centered
        backdrop="static"
        keyboard={false}
        style={{ zIndex: 2000 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Available Printers</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isFetchingPrinters ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading printers...
            </div>
          ) : (
            (() => {
              const filteredPrinters = localPrinters.filter(
                (p) =>
                  p.status === "Online" &&
                  ![
                    "OneNote (Desktop)",
                    "Microsoft XPS Document Writer",
                    "Microsoft Print to PDF",
                    "Fax",
                  ].includes(p.name)
              );

              if (filteredPrinters.length === 0) {
                return (
                  <div className="text-center text-muted">
                    No online printers found on this machine.
                  </div>
                );
              }

              return (
                <div className="w-100 printer-list-container d-flex flex-column gap-2">
                  {filteredPrinters.map((p) => (
                    <div
                      key={p.id}
                      className={`printer-list p-2 border rounded d-flex align-items-center justify-content-between ${
                        selectedPrinter?.id === p.id
                          ? "bg-light border-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedPrinter(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex flex-column">
                        <strong>{p.name}</strong>
                        <small className="text-success">{p.status}</small>
                      </div>
                      <Form.Check
                        type="radio"
                        name="selectedPrinter"
                        id={`printer-${p.id}`}
                        checked={selectedPrinter?.id === p.id}
                        onChange={() => setSelectedPrinter(p)}
                        className="me-2"
                      />
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePrinterModal}>
            Close
          </Button>

          {selectedPrinter && (
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Printing...
                </>
              ) : (
                `Print All (${batchTicketData.length})`
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* --- Print Agent Modal --- */}
      <PrintAgentRequiredModal
        show={showPrintAgentModal}
        type={modalType}
        onCancel={() => setShowPrintAgentModal(false)}
        onDownload={() => {
          const link = document.createElement("a");
          link.href = "/application/print-agent-setup.zip";
          link.download = "print-agent-setup.zip";
          link.click();
          setShowPrintAgentModal(false);
        }}
      />
    </div>
  );
};

export default BatchEntry2;
