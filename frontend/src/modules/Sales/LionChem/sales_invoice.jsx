import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import "react-datepicker/dist/react-datepicker.css";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import swal from "sweetalert";
import { Modal, Button, Form, Card, Carousel, Spinner } from "react-bootstrap";

import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../../utils/CustomerDateInput";
import "../../../assets/css/style.css";

// for rbac
import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

// print-agent
// 🔹 PDF generation
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// for printers
import PrintAgentRequiredModal from "../../../assets/helpers/PrintAgentRequiredModal";
import {
  fetchLocalPrinters,
  sendPrintJob,
  sendPrintJobToBackend, // Add this import
  checkPrintAgentHealth,
} from "../../../assets/helpers/printHelper";

const Invoice = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [agentData, setAgentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/sales_invoice/getSalesData",
  );
  const pagination = useServerPagination(paginationUrl, 10, {
    rbacUserRole: rbacUserRole,
    userLoggedID: userLoggedID,
  });

  // Create a wrapper function that always includes rbacUserRole and userLoggedID
  const updatePaginationParams = (newParams) => {
    const paramsWithUserInfo = {
      ...newParams,
      rbacUserRole: rbacUserRole,
      userLoggedID: userLoggedID,
    };
    pagination.updateParams(paramsWithUserInfo);
  };

  const fetchAgentData = () => {
    axios
      .get(BASE_URL + "/sales_invoice/getAgent")
      .then((res) => {
        setAgentData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const maskCurrency = (value) => {
    return Number(value)
      .toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/[0-9]/g, "*");
  };

  const handleClearFilter = () => {
    setSearchText("");
    setSearchField("all");
    setSelectedAgent("");
    setSelectedType("");
    setFromDate("");
    setToDate("");
    setPaginationUrl(BASE_URL + "/sales_invoice/getSalesData");
    updatePaginationParams({}); // Use wrapper function
  };

  const handleSearchCategoryChange = (category) => {
    setSearchField(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim() === "") {
      setPaginationUrl(BASE_URL + "/sales_invoice/getSalesData");
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchField);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/sales_invoice/getSalesDataSearch");

    const params = {
      searchText: text,
    };

    if (category && category !== "all") {
      params.searchField = category;
    }

    if (category === "all") {
      params.searchField = undefined;
    }

    updatePaginationParams(params); // Use wrapper function
  };

  const handleApplyFilter = () => {
    setPaginationUrl(BASE_URL + "/sales_invoice/getFilteredSalesInvoice");
    updatePaginationParams({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      agentId: selectedAgent,
      invoiceType: selectedType,
    }); // Use wrapper function
  };

  const isRowSelectable = (item) => {
    const { sales_invoice, is_only_deliver_number, delivery_number } = item;

    if (is_only_deliver_number && delivery_number && !sales_invoice) {
      return true;
    } else if (sales_invoice && delivery_number) {
      return true;
    }

    return false;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const selectableIds = pagination.data
        .filter((item) => isRowSelectable(item))
        .map((item) => item.sales_invoice_id);
      setSelectedRows(selectableIds);
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (id, item) => {
    if (!isRowSelectable(item)) return;

    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const selectableRowsCount =
    pagination.data?.filter((item) => isRowSelectable(item)).length || 0;
  const isIndeterminate =
    selectedRows.length > 0 && selectedRows.length < selectableRowsCount;

  const handleRowClick = (id, event) => {
    // Check if the click was on the Action button or its parent td
    if (
      event &&
      (event.target.closest("button") ||
        event.target.closest("td:nth-child(2)"))
    ) {
      return; // Don't navigate if clicking on Action column
    }
    navigate(`/sales/create-invoice-update/${id}`);
  };

  // Search field options for better UX
  const searchFieldOptions = [
    { value: "all", label: "All Fields" },
    { value: "transaction_id", label: "Transaction ID" },
    { value: "customer", label: "Customer" },
    { value: "invoice_date", label: "Invoice Date" },
    { value: "date_created", label: "Date Created" },
    ...(roleType?.includes("Management")
      ? [{ value: "gross_amount", label: "Gross Amount" }]
      : []),
  ];

  const getPlaceholderText = () => {
    const selectedOption = searchFieldOptions.find(
      (option) => option.value === searchField,
    );
    return `Search ${
      selectedOption ? selectedOption.label.toLowerCase() : "all fields"
    }`;
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
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // ==========================================
  // PDF GENERATION FUNCTIONS
  // ==========================================

  // 1. Sales Invoice PDF (returns PDFDocument, not File)
  const generateSalesInvoicePDFDoc = async (invoiceData) => {
    // Set custom page size: 20cm width, 23cm height
    // Convert cm to points (1cm = 28.35 points)
    const pageWidth = 20 * 28.35; // 20cm = 567 points
    const pageHeight = 23 * 28.35; // 23cm = 651.05 points

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Convert cm to points for positioning
    const cmToPoints = (cm) => cm * 28.35;

    // Starting positions
    const leftMargin = cmToPoints(0.2); // 3cm from left
    const headerLeft = cmToPoints(0.2); // First header starts at 3cm
    const headerRight = cmToPoints(14.8); // Second header aligned at 16cm
    const topMargin = cmToPoints(2.15); // 3.33cm from top for SOLD TO header
    const dataStartY = cmToPoints(4.9); // 6cm from top for data table

    // Max width for SOLD TO section (10cm)
    const maxLeftWidth = cmToPoints(9.5);

    // Column positions
    const qtyLeft = cmToPoints(0.3); // QTY/UNIT at 1cm
    const descLeft = cmToPoints(4); // Articles and Description at 6cm
    const unitPriceLeft = cmToPoints(12.8); // Unit Price at 13cm
    const amountLeft = cmToPoints(16); // Amount at 17cm

    let y = pageHeight - cmToPoints(0.1); // Start from top with 1cm margin

    const addText = (
      text,
      x,
      yPos,
      size = 7,
      isBold = false,
      color = rgb(0, 0, 0),
      maxWidth = null,
    ) => {
      const currentFont = isBold ? boldFont : font;

      if (maxWidth) {
        // If text exceeds max width, split into multiple lines
        const words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + " " + word;
          const testWidth = currentFont.widthOfTextAtSize(testLine, size);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);

        // Draw each line
        lines.forEach((line, index) => {
          page.drawText(line, {
            x,
            y: yPos - index * (size + 2),
            size,
            font: currentFont,
            color,
          });
        });

        return lines.length; // Return number of lines created
      } else {
        page.drawText(text, { x, y: yPos, size, font: currentFont, color });
        return 1;
      }
    };

    // SOLD TO section - positioned 5cm from top
    const soldToY = pageHeight - topMargin;

    // Customer data with max width constraint
    const customerDataLeft = cmToPoints(2.9);

    // Calculate total height needed for customer data first
    const calculateTextHeight = (text, size, maxWidth) => {
      const words = text.split(" ");
      let lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + " " + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines.length * (size + 1); // Return total height needed
    };

    // Calculate total height for customer data section
    const companyNameHeight = calculateTextHeight(
      `${invoiceData.customer?.company_name || "---"}`,
      8,
      maxLeftWidth,
    );
    const addressHeight = calculateTextHeight(
      `${invoiceData.customer?.company_address || "---"}`,
      7,
      maxLeftWidth,
    );
    const otherFieldsHeight = 12 * 3; // 3 fields * 12pt each

    const totalCustomerHeight =
      companyNameHeight + addressHeight + otherFieldsHeight;

    // Start customer data higher up to maintain alignment with right side
    const customerStartY = soldToY + (totalCustomerHeight - 12 * 5); // Adjust based on actual vs expected height

    let currentY = customerStartY;

    // Add customer data with wrapping - moving upwards
    const lines1 = addText(
      `${invoiceData.customer?.company_name || "---"}`,
      customerDataLeft,
      currentY,
      8,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines1 * 13; // Adjust spacing based on number of lines

    const lines2 = addText(
      `${invoiceData.customer?.company_address || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines2 * 12;

    addText(
      `${invoiceData.customer?.tin || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 14;

    addText(
      `${invoiceData.customer?.company_nature || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 10;

    addText("---", customerDataLeft, currentY, 7, false);

    // Invoice details - Right aligned at 16cm, aligned with the START of customer data
    const rightHeaderStartY = customerStartY;

    addText(
      `${
        invoiceData.invoice_date
          ? format(new Date(invoiceData.invoice_date), "MMM dd, yyyy")
          : "---"
      }`,
      headerRight,
      rightHeaderStartY - 1,
      7, // Specific size: 7
      false,
    );
    addText(
      `${invoiceData.sales_invoice || "---"}`,
      headerRight,
      rightHeaderStartY - 13,
      7, // Specific size: 7
      false,
    );
    addText(
      `${invoiceData.delivery_number || "---"}`,
      headerRight,
      rightHeaderStartY - 25,
      7, // Specific size: 7
      false,
    );

    // PAYMENT TERMS (Right Header)
    let paymentText = "";

    if (invoiceData.payment_terms === "Other") {
      // Use the custom user-entered value
      paymentText = invoiceData.other_payment_terms || "";
    } else {
      // Use normal format WITH " Days"
      const termsValue = invoiceData.payment_terms || "---";
      paymentText = `${termsValue} Days`;
    }

    addText(paymentText, headerRight, rightHeaderStartY - 37, 7, false);

    // Table Headers - starting at 8cm from top
    const tableStartY = pageHeight - dataStartY;

    let currentDataY = tableStartY - 1;

    // Dynamic product list from invoiceData
    const productList = (invoiceData.sales_invoice_tag_products || []).map(
      (p) => {
        // 1. Check customer-specific override code
        const overrideCode = p.product_tag_customer?.customer_product_code;

        // 2. Default product code
        const defaultCode = p.product_list?.product_code || "";

        // 3. Final code selection
        const finalCode = overrideCode || defaultCode;

        // 4. Build description
        const description = `${finalCode} - ${
          p.product_list?.product_name || ""
        }`;

        return {
          qty: formatAmount(p.quantity),
          description,
          unitPrice: formatAmount(p.unit_price),
          amount: formatAmount(p.subtotal),
        };
      },
    );

    // Add product rows
    productList.forEach((p) => {
      addText(p.qty, qtyLeft, currentDataY, 8);
      addText(p.description, descLeft, currentDataY, 8);
      addText(p.unitPrice, unitPriceLeft, currentDataY, 8);
      addText(p.amount, amountLeft, currentDataY, 8);

      currentDataY -= 14;
    });

    // vatables section
    currentDataY -= 138;

    function formatAmount(value) {
      const num = parseFloat(value || 0);
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    addText(
      formatAmount(invoiceData.total_gross),
      descLeft + 120,
      currentDataY,
      7,
      false,
    );
    currentDataY -= 10;
    addText(formatAmount(0), descLeft + 120, currentDataY, 7, false);
    currentDataY -= 10;
    addText(formatAmount(0), descLeft + 120, currentDataY, 7, false);
    currentDataY -= 10;
    addText(
      formatAmount(invoiceData.vat_amount),
      descLeft + 120,
      currentDataY,
      7,
      false,
    );
    currentDataY -= 10;

    let amountCurrentData = currentDataY + 72;

    addText(
      formatAmount(invoiceData.net_amount),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    addText(
      formatAmount(invoiceData.vat_amount),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    addText(
      formatAmount(invoiceData.total_gross),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    addText(formatAmount(0), amountLeft, amountCurrentData, 7, false);
    amountCurrentData -= 10.5;

    addText(
      formatAmount(invoiceData.total_gross),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    addText(
      formatAmount(invoiceData.vat_amount),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    addText(
      formatAmount(invoiceData.net_amount),
      amountLeft,
      amountCurrentData,
      7,
      false,
    );
    amountCurrentData -= 10.5;

    return pdfDoc;
  };

  // 2. Delivery Receipt PDF (returns PDFDocument, not File)
  const generateDeliveryReceiptPDFDoc = async (invoiceData) => {
    // formatter

    function formatAmount(value) {
      const num = parseFloat(value || 0);
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Set custom page size: 20cm width, 23cm height
    // Convert cm to points (1cm = 28.35 points)
    const pageWidth = 20 * 28.35; // 20cm = 567 points
    const pageHeight = 23 * 28.35; // 23cm = 651.05 points

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Convert cm to points for positioning
    const cmToPoints = (cm) => cm * 28.35;

    // Starting positions
    const leftMargin = cmToPoints(0.8); // 3cm from left
    const headerLeft = cmToPoints(0.2); // First header starts at 3cm
    const headerRight = cmToPoints(14.9); // Second header aligned at 16cm
    const topMargin = cmToPoints(2.6); // 3.33cm from top for SOLD TO header
    const dataStartY = cmToPoints(5.9); // 6cm from top for data table

    // Max width for SOLD TO section (10cm)
    const maxLeftWidth = cmToPoints(9.5);

    // Column positions
    const qtyLeft = cmToPoints(0.8); // QTY/UNIT at 1cm
    const descLeft = cmToPoints(7.2); // Articles and Description at 6cm

    let y = pageHeight - cmToPoints(0.1); // Start from top with 1cm margin

    const addText = (
      text,
      x,
      yPos,
      size = 7,
      isBold = false,
      color = rgb(0, 0, 0),
      maxWidth = null,
    ) => {
      const currentFont = isBold ? boldFont : font;

      if (maxWidth) {
        // If text exceeds max width, split into multiple lines
        const words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + " " + word;
          const testWidth = currentFont.widthOfTextAtSize(testLine, size);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);

        // Draw each line
        lines.forEach((line, index) => {
          page.drawText(line, {
            x,
            y: yPos - index * (size + 2),
            size,
            font: currentFont,
            color,
          });
        });

        return lines.length; // Return number of lines created
      } else {
        page.drawText(text, { x, y: yPos, size, font: currentFont, color });
        return 1;
      }
    };

    // SOLD TO section - positioned 5cm from top
    const soldToY = pageHeight - topMargin;

    // Customer data with max width constraint
    const customerDataLeft = cmToPoints(2.5);

    // Calculate total height needed for customer data first
    const calculateTextHeight = (text, size, maxWidth) => {
      const words = text.split(" ");
      let lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + " " + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines.length * (size + 1); // Return total height needed
    };

    // Calculate total height for customer data section
    const companyNameHeight = calculateTextHeight(
      `${invoiceData.customer?.company_name || "---"}`,
      8,
      maxLeftWidth,
    );

    const addressHeight = calculateTextHeight(
      `${invoiceData.customer?.company_address || "---"}`,
      7,
      maxLeftWidth,
    );
    const otherFieldsHeight = 12 * 3; // 3 fields * 12pt each

    const totalCustomerHeight =
      companyNameHeight + addressHeight + otherFieldsHeight;

    // Start customer data higher up to maintain alignment with right side
    const customerStartY = soldToY + (totalCustomerHeight - 12 * 5); // Adjust based on actual vs expected height

    let currentY = customerStartY;

    // Add customer data with wrapping - moving upwards
    const lines1 = addText(
      `${invoiceData.customer?.company_name || "---"}`,
      customerDataLeft,
      currentY,
      8,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines1 * 13; // Adjust spacing based on number of lines

    const lines2 = addText(
      `${invoiceData.customer?.company_address || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines2 * 12;

    addText(
      `${invoiceData.customer?.tin || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 14;

    addText(
      `${invoiceData.customer?.company_nature || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 10;

    // Invoice details - Right aligned at 16cm, aligned with the START of customer data
    const rightHeaderStartY = customerStartY;

    addText(
      `${
        invoiceData.invoice_date
          ? format(new Date(invoiceData.invoice_date), "MMM dd, yyyy")
          : "---"
      }`,
      headerRight,
      rightHeaderStartY - 1,
      7, // Specific size: 7
      false,
    );
    addText(
      `${invoiceData.sales_invoice || "---"}`,
      headerRight,
      rightHeaderStartY - 13,
      7, // Specific size: 7
      false,
    );
    addText(
      "",
      headerRight,
      rightHeaderStartY - 25,
      7, // Specific size: 7
      false,
    );

    // PAYMENT TERMS (Right Header)
    let paymentText = "";

    if (invoiceData.payment_terms === "Other") {
      // Use the custom user-entered value
      paymentText = invoiceData.other_payment_terms || "";
    } else {
      // Use normal format WITH " Days"
      const termsValue = invoiceData.payment_terms || "---";
      paymentText = `${termsValue} Days`;
    }

    addText(paymentText, headerRight, rightHeaderStartY - 37, 7, false);

    // Table Headers - starting at 8cm from top
    const tableStartY = pageHeight - dataStartY;

    let currentDataY = tableStartY - 1;

    // Dynamic product list from invoiceData
    const productList = (invoiceData.sales_invoice_tag_products || []).map(
      (p) => {
        // 1. Check customer-specific override code
        const overrideCode = p.product_tag_customer?.customer_product_code;

        // 2. Default product code
        const defaultCode = p.product_list?.product_code || "";

        // 3. Final code selection
        const finalCode = overrideCode || defaultCode;

        // 4. Build description
        const description = `${finalCode} - ${
          p.product_list?.product_name || ""
        }`;

        return {
          qty: formatAmount(p.quantity),
          description,
        };
      },
    );

    // Add product rows
    productList.forEach((p) => {
      addText(p.qty, qtyLeft, currentDataY, 8);
      addText(p.description, descLeft, currentDataY, 8);

      currentDataY -= 14;
    });

    return pdfDoc;
  };

  // 3. Delivery Confirmation PDF (returns PDFDocument, not File)
  const generateDeliveryConfirmationPDFDoc = async (invoiceData) => {
    // formatter

    function formatAmount(value) {
      const num = parseFloat(value || 0);
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Set custom page size: 20cm width, 23cm height
    // Convert cm to points (1cm = 28.35 points)
    const pageWidth = 20 * 28.35; // 20cm = 567 points
    const pageHeight = 23 * 28.35; // 23cm = 651.05 points

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Convert cm to points for positioning
    const cmToPoints = (cm) => cm * 28.35;

    // Starting positions
    const leftMargin = cmToPoints(0.8); // 3cm from left
    const headerLeft = cmToPoints(0.2); // First header starts at 3cm
    const headerRight = cmToPoints(14.9); // Second header aligned at 16cm
    const topMargin = cmToPoints(2.9); // 3.33cm from top for SOLD TO header
    const dataStartY = cmToPoints(6.2); // 6cm from top for data table

    // Max width for SOLD TO section (10cm)
    const maxLeftWidth = cmToPoints(9.5);

    // Column positions
    const qtyLeft = cmToPoints(0.8); // QTY/UNIT at 1cm
    const descLeft = cmToPoints(7.2); // Articles and Description at 6cm

    let y = pageHeight - cmToPoints(0.1); // Start from top with 1cm margin

    const addText = (
      text,
      x,
      yPos,
      size = 7,
      isBold = false,
      color = rgb(0, 0, 0),
      maxWidth = null,
    ) => {
      const currentFont = isBold ? boldFont : font;

      if (maxWidth) {
        // If text exceeds max width, split into multiple lines
        const words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + " " + word;
          const testWidth = currentFont.widthOfTextAtSize(testLine, size);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);

        // Draw each line
        lines.forEach((line, index) => {
          page.drawText(line, {
            x,
            y: yPos - index * (size + 2),
            size,
            font: currentFont,
            color,
          });
        });

        return lines.length; // Return number of lines created
      } else {
        page.drawText(text, { x, y: yPos, size, font: currentFont, color });
        return 1;
      }
    };

    // SOLD TO section - positioned 5cm from top
    const soldToY = pageHeight - topMargin;

    // Customer data with max width constraint
    const customerDataLeft = cmToPoints(2.5);

    // Calculate total height needed for customer data first
    const calculateTextHeight = (text, size, maxWidth) => {
      const words = text.split(" ");
      let lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + " " + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines.length * (size + 1); // Return total height needed
    };

    // Calculate total height for customer data section
    const companyNameHeight = calculateTextHeight(
      `${invoiceData.customer?.company_name || "---"}`,
      8,
      maxLeftWidth,
    );

    const addressHeight = calculateTextHeight(
      `${invoiceData.customer?.company_address || "---"}`,
      7,
      maxLeftWidth,
    );
    const otherFieldsHeight = 12 * 3; // 3 fields * 12pt each

    const totalCustomerHeight =
      companyNameHeight + addressHeight + otherFieldsHeight;

    // Start customer data higher up to maintain alignment with right side
    const customerStartY = soldToY + (totalCustomerHeight - 12 * 5); // Adjust based on actual vs expected height

    let currentY = customerStartY;

    // Add customer data with wrapping - moving upwards
    const lines1 = addText(
      `${invoiceData.customer?.company_name || "---"}`,
      customerDataLeft,
      currentY,
      8,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines1 * 13; // Adjust spacing based on number of lines

    const lines2 = addText(
      `${invoiceData.customer?.company_address || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
      rgb(0, 0, 0),
      maxLeftWidth,
    );
    currentY -= lines2 * 12;

    addText(
      `${invoiceData.customer?.tin || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 14;

    addText(
      `${invoiceData.customer?.company_nature || "---"}`,
      customerDataLeft,
      currentY,
      7,
      false,
    );
    currentY -= 10;

    // Invoice details - Right aligned at 16cm, aligned with the START of customer data
    const rightHeaderStartY = customerStartY;

    addText(
      `${
        invoiceData.invoice_date
          ? format(new Date(invoiceData.invoice_date), "MMM dd, yyyy")
          : "---"
      }`,
      headerRight,
      rightHeaderStartY - 1,
      7, // Specific size: 7
      false,
    );
    addText(
      `${invoiceData.sales_invoice || "---"}`,
      headerRight,
      rightHeaderStartY - 13,
      7, // Specific size: 7
      false,
    );
    addText(
      "",
      headerRight,
      rightHeaderStartY - 25,
      7, // Specific size: 7
      false,
    );

    // PAYMENT TERMS (Right Header)
    let paymentText = "";

    if (invoiceData.payment_terms === "Other") {
      // Use the custom user-entered value
      paymentText = invoiceData.other_payment_terms || "";
    } else {
      // Use normal format WITH " Days"
      const termsValue = invoiceData.payment_terms || "---";
      paymentText = `${termsValue} Days`;
    }

    addText(paymentText, headerRight, rightHeaderStartY - 37, 7, false);

    // Table Headers - starting at 8cm from top
    const tableStartY = pageHeight - dataStartY;

    let currentDataY = tableStartY - 1;

    // Dynamic product list from invoiceData
    const productList = (invoiceData.sales_invoice_tag_products || []).map(
      (p) => {
        // 1. Check customer-specific override code
        const overrideCode = p.product_tag_customer?.customer_product_code;

        // 2. Default product code
        const defaultCode = p.product_list?.product_code || "";

        // 3. Final code selection
        const finalCode = overrideCode || defaultCode;

        // 4. Build description
        const description = `${finalCode} - ${
          p.product_list?.product_name || ""
        }`;

        return {
          qty: formatAmount(p.quantity),
          description,
        };
      },
    );

    // Add product rows
    productList.forEach((p) => {
      addText(p.qty, qtyLeft, currentDataY, 8);
      addText(p.description, descLeft, currentDataY, 8);

      currentDataY -= 14;
    });

    return pdfDoc;
  };

  // Helper function to combine multiple PDF documents into one
  const combinePDFs = async (pdfDocs, filename) => {
    const combinedPdf = await PDFDocument.create();

    for (const pdfDoc of pdfDocs) {
      const pages = await combinedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices(),
      );
      pages.forEach((page) => combinedPdf.addPage(page));
    }

    const pdfBytes = await combinedPdf.save();
    return new File(
      [new Blob([pdfBytes], { type: "application/pdf" })],
      filename,
      { type: "application/pdf" },
    );
  };

  // Main function to determine which PDFs to generate based on invoice type
  const generateInvoicePDFs = async (invoiceData) => {
    const { sales_invoice, is_only_deliver_number, delivery_number } =
      invoiceData;

    let pdfDocs = [];
    let filename = "";

    // Determine the type and generate appropriate PDFs
    if (is_only_deliver_number && delivery_number) {
      // DC Only - Generate Delivery Confirmation only
      console.log("🟡 Generating Delivery Confirmation (DC Only)");
      const dcPDF = await generateDeliveryConfirmationPDFDoc(invoiceData);
      pdfDocs.push(dcPDF);
      filename = `delivery-confirmation-${
        invoiceData.delivery_number || "unknown"
      }.pdf`;
    } else if (sales_invoice && delivery_number) {
      // With SI & DR - Generate both Sales Invoice and Delivery Receipt and COMBINE them
      console.log(
        "🟢 Generating combined Sales Invoice and Delivery Receipt (With SI & DR)",
      );
      const siPDF = await generateSalesInvoicePDFDoc(invoiceData);
      const drPDF = await generateDeliveryReceiptPDFDoc(invoiceData);

      // for both
      pdfDocs.push(siPDF, drPDF);
      filename = `invoice-package-${
        invoiceData.sales_invoice || "unknown"
      }.pdf`;

      // // for siPDF (testing)
      // pdfDocs.push(siPDF);
      // filename = `invoice-package-${
      //   invoiceData.sales_invoice || "unknown"
      // }.pdf`;
    }
    // else if (sales_invoice && !delivery_number) {
    //   // With SI only - Generate Sales Invoice only
    //   console.log("🔵 Generating Sales Invoice only (With SI)");
    //   const siPDF = await generateSalesInvoicePDFDoc(invoiceData);
    //   pdfDocs.push(siPDF);
    //   filename = `sales-invoice-${invoiceData.sales_invoice || "unknown"}.pdf`;
    // }
    else {
      // Unknown type - Generate a generic document
      console.log("⚫ Generating generic document (Unknown type)");
      const genericPDF = await generateSalesInvoicePDFDoc(invoiceData);
      pdfDocs.push(genericPDF);
      filename = `document-${invoiceData.sales_invoice || "unknown"}.pdf`;
    }

    // If there's only one PDF, return it directly
    if (pdfDocs.length === 1) {
      const pdfBytes = await pdfDocs[0].save();
      return [
        new File(
          [new Blob([pdfBytes], { type: "application/pdf" })],
          filename,
          { type: "application/pdf" },
        ),
      ];
    }

    // If multiple PDFs, combine them into one
    const combinedFile = await combinePDFs(pdfDocs, filename);
    return [combinedFile];
  };

  // --- Printer modal handler ---
  const handleOpenPrinterModal = async (invoiceItem = null) => {
    setSelectedInvoice(invoiceItem); // Store the selected invoice
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
      console.error("[SalesInvoice] Error fetching printers:", err);
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

  const handlePrint = async (invoiceItem) => {
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
      console.log("🖨️ Starting invoice printing...");

      // Determine which PDFs to generate based on invoice type
      const pdfFiles = await generateInvoicePDFs(invoiceItem);

      // console.log(
      //   `📄 Generated ${pdfFiles.length} PDF file(s):`,
      //   pdfFiles.map((f) => f.name)
      // );

      // // ✅ Download all generated PDFs for testing
      // for (const pdfFile of pdfFiles) {
      //   console.log(`💾 Downloading ${pdfFile.name}...`);
      //   const downloadUrl = URL.createObjectURL(pdfFile);
      //   const downloadLink = document.createElement("a");
      //   downloadLink.href = downloadUrl;
      //   downloadLink.download = pdfFile.name;
      //   document.body.appendChild(downloadLink);
      //   downloadLink.click();
      //   document.body.removeChild(downloadLink);
      //   URL.revokeObjectURL(downloadUrl);
      // }

      // console.log("✅ All PDFs downloaded successfully");
      // 🚫 COMMENTED OUT FOR TESTING - STEP 2: Send to Print Agent
      console.log("🚀 Sending to printer:", selectedPrinter.name);
      for (const pdfFile of pdfFiles) {
        await sendPrintJob(selectedPrinter, pdfFile, userLoggedID);
      }

      console.log("✅ All documents printed successfully");

      // Show success message
      swal({
        icon: "success",
        title: "Print Complete!",
        text: `${pdfFiles.length} document(s) sent to ${selectedPrinter.name}`,
        timer: 3000,
      });

      // // ✅ Show download success message (for testing)
      // const documentNames = pdfFiles
      //   .map((f) => f.name.replace(".pdf", ""))
      //   .join(", ");
      // swal({
      //   icon: "success",
      //   title: "PDF Downloaded!",
      //   text: `${pdfFiles.length} document(s) have been downloaded: ${documentNames}`,
      //   timer: 3000,
      // });
    } catch (error) {
      console.error("❌ Invoice printing failed:", error);
      swal({
        icon: "error",
        title: "Print Failed",
        text: error.message || "Failed to generate PDF documents",
      });
    } finally {
      setIsPrinting(false);
      handleClosePrinterModal();
    }
  };

  // Update params when rbacUserRole or userLoggedID changes
  useEffect(() => {
    if (rbacUserRole && userLoggedID) {
      pagination.updateParams({
        rbacUserRole: rbacUserRole,
        userLoggedID: userLoggedID,
      });
    }
  }, [rbacUserRole, userLoggedID]);

  return (
    <div className="h-100 w-100 border bg-white main-container-custom-max-width">
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
      ) : authrztn.includes("Invoices-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom w-100">
              <span className="fs-3">SALES | INVOICE {rbacUserRole}</span>
            </div>

            <div className=" w-100 row">
              <div className="col-12 col-md-8 d-flex flex-row align-items-center mb-2"></div>
              <div className="col-12 col-md-4 d-flex justify-content-end mb-2">
                {authrztn.includes("Invoices-Add") && (
                  <Link
                    to="/sales/create-invoice-update"
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> Create
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="container-fluid">
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i className="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3 style={{ fontSize: "1.3rem" }}>Current Sales Total</h3>
                  </div>
                  <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                    <p
                      className="payable-amount text-primary"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {roleType?.includes("Management") ? (
                        ` ${parseFloat(0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      ) : (
                        <span
                          className="masked-value"
                          style={{ fontSize: "2rem", fontWeight: "bold" }}
                        >
                          {maskCurrency(100)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i className="bx bxs-discount fs-3 h-100"></i>
                    <h3 style={{ fontSize: "1.3rem" }}>Total Discount</h3>
                  </div>
                  <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                    <p
                      className="payable-amount text-warning"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {" "}
                      {roleType?.includes("Management") ? (
                        ` ${parseFloat(0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      ) : (
                        <span
                          className="masked-value"
                          style={{ fontSize: "2rem", fontWeight: "bold" }}
                        >
                          {maskCurrency(100)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i className="bx bx-money fs-3 h-100"></i>
                    <h3 style={{ fontSize: "1.3rem" }}>Collection</h3>
                  </div>
                  <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                    <p
                      className="payable-amount text-success"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {" "}
                      {roleType?.includes("Management") ? (
                        ` ${parseFloat(0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      ) : (
                        <span
                          className="masked-value"
                          style={{ fontSize: "2rem", fontWeight: "bold" }}
                        >
                          {maskCurrency(100)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mx-auto mt-2">
              <div
                className={
                  roleType?.includes("Management") ? "col-sm mb-2" : "d-none"
                }
              >
                <label htmlFor="select-agent">Select Agent</label>
                <select
                  id="select-agent"
                  className="form-select"
                  value={selectedAgent}
                  onClick={() => {
                    if (agentData.length === 0) fetchAgentData();
                  }}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  aria-label="Select Agent"
                >
                  <option value="">All Agents</option>
                  {agentData.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fname} {agent.lname}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={
                  roleType?.includes("Management") ? "col-sm mb-2" : "d-none"
                }
              >
                <label htmlFor="select-agent">Select Invoice Type</label>
                <select
                  id="select-invoice-type"
                  className="form-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  aria-label="Select Invoice Type"
                >
                  <option value="">All Types</option>
                  <option value="DR">DR Only</option>
                  <option value="SI">With SI</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-sm mb-2">
                <label htmlFor="date-created">Invoice Date From</label>
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  className="form-control"
                  id="date-created"
                  name="date-created"
                  customInput={<CustomDatePickerInput />}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="date-to">Invoice Date To</label>
                <DatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  name="date-to"
                  id="date-to"
                  customInput={<CustomDatePickerInput />}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
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
            </div>

            <div className="row mx-auto mt-2">
              <div className="col-12">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={getPlaceholderText()}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
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
                    {searchFieldOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          className={`dropdown-item ${
                            searchField === option.value ? "active" : ""
                          }`}
                          onClick={() =>
                            handleSearchCategoryChange(option.value)
                          }
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-3">
            <div
              className="table-responsive"
              style={{
                overflowX: "auto",
                maxWidth: "100%",
                border: "1px solid #dee2e6",
                borderRadius: "0.375rem",
              }}
            >
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ backgroundColor: "#EBEFF4" }}>
                    <th
                      className="text-muted fw-semibold text-uppercase sticky-column d-none"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "0.75rem",
                        padding: "12px 8px",
                        width: "50px",
                        position: "sticky",
                        left: "0",
                        zIndex: "10",
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ height: "18px", width: "18px" }}
                        checked={
                          selectableRowsCount > 0 &&
                          selectedRows.length === selectableRowsCount
                        }
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        disabled={selectableRowsCount === 0}
                      />
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "140px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Action
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "140px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sales Invoice
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "140px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Deliver Receipt
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Invoice Title
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Invoice Date
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sales Agent
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "100px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Type
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "150px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Customer
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "110px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Date Created
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "110px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Delivery Date
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "110px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Days Past Due
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className={
                        roleType?.includes("Management")
                          ? "text-muted fw-semibold text-uppercase"
                          : "d-none"
                      }
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Gross Amount
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Receivables
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Payment Status
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                    <th
                      className="text-muted fw-semibold text-uppercase"
                      style={{
                        backgroundColor: "#EBEFF4",
                        borderBottom: "2px solid #dee2e6",
                        fontSize: "1rem",
                        padding: "12px 8px",
                        width: "120px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Delivery Status
                      <i
                        className="fas fa-sort ms-1 text-muted"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="14" className="text-center py-4">
                        <div className="d-flex justify-content-center align-items-center">
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="14" className="text-center text-danger py-4">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="text-center py-4 text-muted">
                        <i className="fas fa-inbox me-2"></i>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr
                        key={item.sales_invoice_id}
                        onClick={(e) =>
                          handleRowClick(item.sales_invoice_id, e)
                        }
                        className="table-row-hover"
                        style={{
                          cursor: "pointer",
                          borderBottom: "1px solid #f1f3f4",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        <td
                          className="sticky-column d-none"
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            position: "sticky",
                            left: "0",
                            backgroundColor: "white",
                            zIndex: "5",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(
                              item.sales_invoice_id,
                            )}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() =>
                              handleRowSelect(item.sales_invoice_id, item)
                            }
                            style={{
                              height: "16px",
                              width: "16px",
                              opacity: isRowSelectable(item) ? 1 : 0.3,
                              cursor: isRowSelectable(item)
                                ? "pointer"
                                : "not-allowed",
                            }}
                            disabled={!isRowSelectable(item)}
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            cursor: "default",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="btn btn-primary me-2 d-flex align-items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrinterModal(item);
                            }}
                            disabled={isFetchingPrinters}
                          >
                            {isFetchingPrinters ? <>Print</> : "Print"}
                          </button>
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.sales_invoice || "---"}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.delivery_number || "---"}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.invoice_title || "---"}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {format(item.invoice_date, "MMM dd, yyyy")}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {`${item.sales_created_masterlist?.fname ?? ""} ${
                            item.sales_created_masterlist?.mname ?? ""
                          } ${item.sales_created_masterlist?.lname ?? ""}`.trim()}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(() => {
                            const {
                              sales_invoice,
                              is_only_deliver_number,
                              delivery_number,
                            } = item;

                            if (is_only_deliver_number) {
                              return (
                                <span
                                  className="text-success"
                                  style={{ fontSize: "bold" }}
                                >
                                  DC Only
                                </span>
                              );
                            } else if (
                              !is_only_deliver_number &&
                              !delivery_number &&
                              sales_invoice
                            ) {
                              return (
                                <span
                                  className="text-success"
                                  style={{ fontSize: "bold" }}
                                >
                                  With SI & DR
                                </span>
                              );
                            } else if (
                              !is_only_deliver_number &&
                              delivery_number &&
                              !sales_invoice
                            ) {
                              return (
                                <span
                                  className="text-success"
                                  style={{ fontSize: "bold" }}
                                >
                                  With SI & DR
                                </span>
                              );
                            } else if (
                              !is_only_deliver_number &&
                              delivery_number &&
                              sales_invoice
                            ) {
                              return (
                                <span
                                  className="text-success"
                                  style={{ fontSize: "bold" }}
                                >
                                  With SI & DR
                                </span>
                              );
                            } else if (
                              !is_only_deliver_number &&
                              !delivery_number &&
                              !sales_invoice
                            ) {
                              return (
                                <span
                                  className="text-secondary"
                                  style={{ fontSize: "bold" }}
                                >
                                  ---
                                </span>
                              );
                            } else {
                              return (
                                <span
                                  className="text-secondary"
                                  style={{ fontSize: "bold" }}
                                >
                                  Unknown
                                </span>
                              );
                            }
                          })()}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "140px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.customer.company_name}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            },
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(item.due_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            color:
                              new Date().setHours(0, 0, 0, 0) >
                              new Date(item.due_date).setHours(0, 0, 0, 0)
                                ? "#dc3545"
                                : "#198754",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(() => {
                            const today = new Date().setHours(0, 0, 0, 0);
                            const due = new Date(item.due_date).setHours(
                              0,
                              0,
                              0,
                            );
                            const diff = today - due;
                            const daysPast =
                              diff > 0
                                ? Math.floor(diff / (1000 * 60 * 60 * 24))
                                : 0;
                            return `${daysPast} day(s)`;
                          })()}
                        </td>
                        <td
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₱
                          {item.total_gross.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className=""
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span className="text-muted">Soon</span>
                        </td>
                        <td
                          className=""
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            className="text-warning"
                            style={{ fontSize: "bold" }}
                          ></span>
                        </td>
                        <td
                          className=""
                          style={{
                            padding: "12px 8px",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            className="text-info"
                            style={{ fontSize: "bold" }}
                          ></span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls {...pagination} />
          </div>

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
                      ].includes(p.name),
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
                  onClick={() => handlePrint(selectedInvoice)}
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Printing...
                    </>
                  ) : (
                    `Print`
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
export default Invoice;
