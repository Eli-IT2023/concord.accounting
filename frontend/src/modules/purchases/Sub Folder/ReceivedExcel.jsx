import * as XLSX from "xlsx";

const generateExcel = (historyItem, settings) => {
  const wb = XLSX.utils.book_new();
  const wsData = [];

  // Header Section
  wsData.push([settings?.company_name || "E-Logic Innovations"]);
  wsData.push([]);

  // Company Info
  wsData.push(["Address:", settings?.company_address || ""]);
  wsData.push(["Telephone:", settings?.landline || ""]);
  wsData.push(["Email:", settings?.email || ""]);
  wsData.push([]);

  // Date Information
  const receivingDate = historyItem.details.createdAt
    ? new Date(historyItem.details.createdAt).toLocaleDateString("en-US")
    : "N/A";

  const poRequestDate = historyItem.details.rh_receiving_id?.receiving_po_id
    ?.po_pr_id?.createdAt
    ? new Date(
        historyItem.details.rh_receiving_id.receiving_po_id.po_pr_id.createdAt
      ).toLocaleDateString("en-US")
    : "N/A";

  wsData.push(["Date Received:", receivingDate]);
  wsData.push(["P.O Request Date:", poRequestDate]);
  wsData.push([]);

  // Report Title
  wsData.push(["P.O RECEIVING REPORT"]);
  wsData.push([]);

  // Vendor Information
  const vendor =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_vendor;
  const vendorName =
    vendor?.fname && vendor?.lname
      ? `${vendor.fname} ${vendor.lname}`
      : vendor?.company_name || "N/A";

  const receivedBy = historyItem.details.rh_received_by;
  const receivedByName =
    receivedBy?.fname && receivedBy?.lname
      ? `${receivedBy.fname} ${receivedBy.lname}`
      : "N/A";

  const requestor =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_pr_id?.requestor;
  const requestorName =
    requestor?.fname && requestor?.lname
      ? `${requestor.fname} ${requestor.lname}`
      : "N/A";

  wsData.push(["Vendor Name:", vendorName]);
  wsData.push([
    "P.O Number:",
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_number || "N/A",
  ]);
  wsData.push([
    "Duty & Customs:",
    (parseFloat(historyItem.details.duty_custom) || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  ]);
  wsData.push([
    "Shipping Fee:",
    (parseFloat(historyItem.details.shipping_fee) || 0).toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    ),
  ]);
  wsData.push(["Received By:", receivedByName]);
  wsData.push(["Requestor:", requestorName]);
  wsData.push([]);

  // Products Table
  wsData.push(["PRODUCTS RECEIVED"]);
  wsData.push([]);
  wsData.push([
    "PRODUCT CODE",
    "PRODUCT NAME",
    "QUANTITY",
    "UOM",
    "UNIT PRICE",
    "BEST BEFORE",
    "REMARKS",
  ]);

  if (historyItem.details?.rh_receiving_history_id?.length > 0) {
    historyItem.details.rh_receiving_history_id.forEach((product) => {
      wsData.push([
        product.rpo_vendor_product_id?.po_vendor_product_id?.product_code ||
          "N/A",
        product.rpo_vendor_product_id?.po_vendor_product_id?.product_name ||
          "N/A",
        (parseFloat(product.quantity_received) || 0).toLocaleString(),
        `${product.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging.packaging_name} - (${product.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging.unit_quantity}${product.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging.unit})`,
        (parseFloat(product.rpo_vendor_product_id?.price) || 0).toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        ),
        product.expiry_date
          ? new Date(product.expiry_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "---",
        // (
        //   parseFloat(product.quantity_received - product.rejected_quantity) || 0
        // ).toLocaleString("en-US", {
        //   minimumFractionDigits: 2,
        //   maximumFractionDigits: 2,
        // }),
        // (parseFloat(product.rejected_quantity) || 0).toLocaleString("en-US", {
        //   minimumFractionDigits: 2,
        //   maximumFractionDigits: 2,
        // }),
        product.rpo_vendor_product_id?.remarks || "",
      ]);
    });
  } else {
    wsData.push(["No products received", "", "", "", "", ""]);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Receiving Report");

  // Generate filename
  const poNumber =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_number || "report";
  const fileName = `${poNumber}-${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-")}-Receiving-Report.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export default generateExcel;
