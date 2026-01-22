import jsPDF from "jspdf";
import ELI from "../../../assets/img/ELI LOGO.png";

const generatePDF = (historyItem, settings) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableWidth = pageWidth - margin * 2;

  // ========================
  // LOGO (top right)
  // ========================
  const logoImage = settings?.logo || ELI;
  if (logoImage) {
    doc.addImage(logoImage, "PNG", 155, 8, 45, 40); // top right
  }

  // ========================
  // TITLE (left-aligned)
  // ========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("PURCHASE ORDER", 20, 25);
  doc.text("RECEIVING REPORT", 20, 36);

  // Report Number
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${historyItem.details?.rr_no || "N/A"}`, 20, 46);

  // ========================
  // SOURCE SHORTCUTS (match your working structure)
  // ========================
  const po =
    historyItem?.details?.rh_receiving_id?.receiving_po_id || undefined;
  const vendor = po?.po_vendor;

  const vendorName =
    vendor?.fname && vendor?.lname
      ? `${vendor.fname} ${vendor.lname}`
      : vendor?.company_name || "N/A";

  const poNumber = po?.po_number || "N/A";

  const requestor = po?.po_pr_id?.requestor;
  const requestorName =
    requestor?.fname && requestor?.lname
      ? `${requestor.fname} ${requestor.lname}`
      : "N/A";

  const receivedBy = historyItem?.details?.rh_received_by;
  const receivedByName =
    receivedBy?.fname && receivedBy?.lname
      ? `${receivedBy.fname} ${receivedBy.lname}`
      : "N/A";

  // ========================
  // INFO BLOCKS
  // ========================
  doc.setFontSize(11);
  let leftY = 55;
  let rightY = 55;

  // LEFT SIDE (Vendor, PO, Duty, Shipping) — uses your working paths
  const leftFields = [
    ["Vendor Name", vendorName],
    ["P.O. Number", poNumber],
    [
      "Duty & Customs",
      historyItem.details?.duty_custom !== undefined
        ? (Number(historyItem.details.duty_custom) || 0).toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )
        : "N/A",
    ],
    [
      "Shipping Fee",
      historyItem.details?.shipping_fee !== undefined
        ? (Number(historyItem.details.shipping_fee) || 0).toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )
        : "N/A",
    ],
  ];

  leftFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, leftY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 55, leftY);
    leftY += 7;
  });

  // RIGHT SIDE (Dates, Receiver, Requestor) — uses your working paths
  const rightFields = [
    [
      "Date Received",
      historyItem.details?.createdAt
        ? new Date(historyItem.details.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
    [
      "Date Requested",
      po?.po_pr_id?.createdAt
        ? new Date(po.po_pr_id.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Received By", receivedByName],
    ["Requestor", requestorName],
  ];

  rightFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 120, rightY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 155, rightY);
    rightY += 7;
  });

  // ========================
  // TABLE - UPDATED LAYOUT
  // ========================
  const tableData =
    historyItem.details?.rh_receiving_history_id?.length > 0
      ? historyItem.details.rh_receiving_history_id.map((product, i) => {
          const vp = product?.rpo_vendor_product_id?.po_vendor_product_id;
          const packaging = vp?.prod_packaging;
          const uom = packaging?.packaging_name
            ? `${packaging?.packaging_name} - (${
                packaging?.unit_quantity || ""
              }${packaging?.unit || ""})`
            : "";

          const code = vp?.product_code || `PR-${i + 1}`;
          const name = vp?.product_name || `Product ${i + 1}`;
          const qty = Number(product?.quantity_received) || 0;
          const unitQuantity =
            product.rpo_vendor_product_id?.unit_quantity || 1;

          const totalWeight = qty * unitQuantity;

          const unitPrice = Number(product?.rpo_vendor_product_id?.price) || 0;
          const bestBefore = product.expiry_date
            ? new Date(product.expiry_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "---";

          // Truncate remarks if too long
          const remarks = product?.rpo_vendor_product_id?.remarks || "";
          const truncatedRemarks =
            remarks.length > 30 ? remarks.substring(0, 27) + "..." : remarks;

          return [
            code,
            name,
            totalWeight.toLocaleString("en-US"),
            uom,
            unitPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            bestBefore,
            truncatedRemarks, // Use truncated remarks
          ];
        })
      : [["", "No Products", "", "", "", "", ""]];

  // Calculate column widths to fit page
  const columnWidths = [
    18, // CODE
    35, // PRODUCT NAME
    20, // QUANTITY
    30, // UOM
    25, // UNIT PRICE
    30, // BEST BEFORE
    32, // REMARKS (reduced width)
  ];

  doc.autoTable({
    startY: 90,
    head: [
      [
        "CODE",
        "ITEM",
        "WEIGHT",
        "PACKAGING",
        "UNIT PRICE",
        "BEST BEFORE",
        "REMARKS",
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "left", // ✅ Left align header text
      valign: "middle",
      fontSize: 10,
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 2,
      overflow: "linebreak",
      halign: "left", // ✅ Left align body text globally
    },
    columnStyles: {
      0: { cellWidth: columnWidths[0], halign: "left" },
      1: { cellWidth: columnWidths[1], halign: "left" },
      2: { cellWidth: columnWidths[2], halign: "left" },
      3: { cellWidth: columnWidths[3], halign: "left" }, // UOM column
      4: { cellWidth: columnWidths[4], halign: "left" },
      5: { cellWidth: columnWidths[5], halign: "left" },
      6: { cellWidth: columnWidths[6], halign: "left", fontStyle: "italic" },
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { left: margin, right: margin },
    tableWidth: "auto",

    // 🔑 Hook for custom drawing
    didDrawCell: (data) => {
      if (
        data.row.section === "body" &&
        data.column.index === 3 &&
        data.cell.raw
      ) {
        const rowIndex = data.row.index;
        const product =
          historyItem.details?.rh_receiving_history_id?.[rowIndex];

        const img =
          product?.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging
            ?.images?.[0]?.packaging_image;

        if (img) {
          const imgSize = 6; // height in mm (~17px)
          const x = data.cell.x + data.cell.width - imgSize - 1;
          const y = data.cell.y + 1;

          try {
            const mime =
              product?.rpo_vendor_product_id?.po_vendor_product_id
                ?.prod_packaging?.images?.[0]?.mime;
            const format =
              mime && mime.toLowerCase().includes("jpg") ? "JPEG" : "PNG";

            doc.addImage(img, format, x, y, imgSize, imgSize);
          } catch (err) {
            console.warn("Image skipped (invalid data)", err);
          }
        }
      }
    },
  });

  // ========================
  // SAVE
  // ========================
  const filePONumber = poNumber !== "N/A" ? poNumber : "report";
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  doc.save(`${filePONumber}-${date}-Receiving-Report.pdf`);
};

export default generatePDF;
