import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import Logo from "../../../assets/img/logo.jpg";

// 🆕 Use Inter fonts instead of Poppins
import "../../../assets/fonts/Inter/static/Inter_18pt-Regular";
import "../../../assets/fonts/Inter/static/Inter_18pt-Bold";

const Purchase_order_pdf = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poId = params.get("po_id");
    const roleType = params.get("role_type") || "";

    if (poId) {
      fetchSettingsAndData(poId, roleType);
    }
  }, []);

  const fetchSettingsAndData = async (poId, roleType) => {
    try {
      setLoading(true);

      // Fetch settings first
      const settingsResponse = await axios.get(
        `${BASE_URL}/CompanyProfile/fetchData`
      );

      if (settingsResponse.data.success) {
        setSettings(settingsResponse.data.data);
      }

      // Then fetch PO data
      const [poResponse, productsResponse] = await Promise.all([
        axios.get(`${BASE_URL}/PurchaseOrder/getVendorPO/${poId}`),
        axios.get(`${BASE_URL}/PurchaseOrder/getVendorProduct/${poId}`),
      ]);

      const vendorPO = poResponse.data?.[0];
      const vendorProducts = productsResponse.data || [];

      if (!vendorPO) {
        throw new Error("Purchase order not found");
      }

      generatePDF(
        vendorPO,
        vendorProducts,
        roleType,
        settingsResponse.data.data
      );
    } catch (error) {
      console.error("Error:", error);
      swal("Error", "Failed to generate PDF", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getVendorName = (vendor) => {
    if (vendor?.fname && vendor?.lname) {
      return `${vendor.fname} ${vendor.lname}`;
    }
    return vendor?.company_name || "N/A";
  };

  const getPersonName = (person) => {
    if (person?.fname && person?.lname) {
      return `${person.fname} ${person.lname}`;
    }
    return "";
  };

  const generatePDF = (vendorPO, vendorProducts, roleType, settings) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 🆕 Set default font to Inter
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.setFontSize(10);

    // ===== HEADER SECTION =====
    const companyName =
      settings?.company_name?.toUpperCase() || "E-LOGIC INNOVATIONS";

    doc.setFontSize(14);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(companyName, 20, 20);

    doc.setFontSize(18);
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("PURCHASE ORDER", 20, 30);

    // Logo on right
    const logoImg = settings?.logo || Logo;
    const logoWidth = 33;
    const logoHeight = 30;
    doc.addImage(logoImg, "JPEG", 195 - logoWidth, 5, logoWidth, logoHeight);

    // ===== PO DETAILS SECTION =====
    let yPosition = 45;
    const lineHeight = 6;

    doc.setFontSize(10);

    // === LEFT COLUMN CONFIG ===
    const leftX = 20;
    const labelGap = 2;

    // === RIGHT COLUMN CONFIG ===
    const rightX = 110;

    // === GROUP 1: PO No. + Date Issued ===
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("PO No:", leftX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(vendorPO.po_number || "N/A", leftX + 30, yPosition);

    // Deliver To (solo, right side, multi-line friendly)
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Deliver To:", rightX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    const deliverTo = vendorPO.po_warehouse_id?.name || "N/A";
    const deliverToLines = doc.splitTextToSize(deliverTo, 80);
    doc.text(deliverToLines, rightX + 35, yPosition);

    yPosition += lineHeight;

    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Date Issued:", leftX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(formatDate(vendorPO.createdAt), leftX + 30, yPosition);

    yPosition += lineHeight * 1.5; // gap between groups

    // === GROUP 2: Supplier Info (left) + Delivery Info (right)
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Supplier:", leftX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(getVendorName(vendorPO.po_vendor), leftX + 30, yPosition);

    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Delivery Date:", rightX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(formatDate(vendorPO.delivery_date), rightX + 35, yPosition);

    yPosition += lineHeight;

    // === Supplier Address (multi-line friendly)
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Address:", leftX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    const address = vendorPO.po_vendor?.company_address || "N/A";
    const addressLines = doc.splitTextToSize(address, 80);
    doc.text(addressLines, leftX + 30, yPosition);

    // === Shipping Method
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Shipping Method:", rightX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(vendorPO.shipping_method || "N/A", rightX + 35, yPosition);

    yPosition += lineHeight;

    // === Payment Terms
    doc.setFont("Inter_18pt-Bold", "normal");
    doc.text("Payment Terms:", rightX, yPosition);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text(vendorPO.payment_term || "N/A", rightX + 35, yPosition);

    yPosition += 15;

    // ===== PRODUCTS TABLE =====
    const tableColumns = [
      { header: "QUANTITY", dataKey: "quantity" },
      { header: "UNIT OF MEASURE", dataKey: "uom" },
      { header: "PRODUCT NAME", dataKey: "productName" },
      { header: "UNIT PRICE", dataKey: "unitPrice" },
      { header: "AMOUNT", dataKey: "total" },
    ];

    const tableData = vendorProducts.map((product) => {
      const uom = product.po_vendor_product_id?.prod_packaging || {};
      const uomString = uom.packaging_name
        ? `${uom.packaging_name} - (${uom.unit_quantity || ""}${
            uom.unit || ""
          })`
        : "";

      const rowData = {
        quantity: parseFloat(product.quantity).toLocaleString(undefined),
        uom: uomString,
        productName:
          product.po_vendor_product_id?.product_name ||
          product.po_vendor_product_id?.product_code ||
          "N/A",
      };
      rowData.unitPrice = formatNumber(product.price || 0);
      rowData.total = formatNumber(product.quantity * product.price || 0);
      return rowData;
    });

    doc.autoTable({
      startY: yPosition,
      head: [tableColumns.map((col) => col.header)],
      body: tableData.map((row) => tableColumns.map((col) => row[col.dataKey])),
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        font: "Inter_18pt-Bold",
        fontStyle: "normal",
        fontSize: 12,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
      },
      styles: {
        fontSize: 11,
        cellPadding: 2,
        font: "Inter_18pt-Regular",
        valign: "middle",
        halign: "center",
        textColor: [0, 0, 0], //  Pure black text
        lineColor: [255, 255, 255], //  Invisible borders
        lineWidth: 0, //  No border thickness
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Black text for data
        lineWidth: 0, // No lines
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray background for readability
        textColor: [0, 0, 0],
        lineWidth: 0,
      },
      tableLineWidth: 0, //  removes outer border
      margin: { left: 14, right: 14 },
    });

    // ===== TOTALS SECTION =====
    const lastTableY = doc.lastAutoTable.finalY + 15;
    let totalsY = lastTableY;

    const addTotalLine = (label, value, isBold = false) => {
      doc.setFontSize(9);
      doc.setFont(isBold ? "Inter_18pt-Bold" : "Inter_18pt-Regular", "normal");

      const valueText = `${formatNumber(value)}`;
      const valueWidth = doc.getTextWidth(valueText);

      doc.text(label, 140, totalsY);
      doc.text(valueText, 195 - valueWidth, totalsY);

      totalsY += 5;
    };

    addTotalLine("SUBTOTAL ORDER:", vendorPO.subtotal);
    addTotalLine(`TOTAL VAT (${vendorPO.vat_rate}%):`, vendorPO.vat_amount);
    addTotalLine(
      `WITHHOLDING TAX (${vendorPO.tax_rate}%):`,
      vendorPO.tax_amount
    );
    addTotalLine("TOTAL AMOUNT:", vendorPO.total_amount, true);

    // ===== NOTHING FOLLOWS SECTION =====
    const nothingFollowsY = totalsY + 10;
    doc.setFontSize(10);
    doc.setFont("Inter_18pt-Regular", "normal");
    doc.text("---------- NOTHING FOLLOWS ----------", 105, nothingFollowsY, {
      align: "center",
    });

    // ===== SIGNATURES SECTION =====
    const signaturesY = nothingFollowsY + 15;
    const signatureBox = {
      width: 45,
      spacing: 69,
      startX: 15,
      lineLength: 40,
      labelToLine: 14,
      lineToName: -2,
      nameToLabel: 5,
    };

    const addSignatureBlock = (label, name, x) => {
      const centerX = x + signatureBox.width / 2;
      const lineX = centerX - signatureBox.lineLength / 2;

      doc.setFontSize(10);
      doc.text(label, centerX, signaturesY, { align: "center" });

      const lineY = signaturesY + signatureBox.labelToLine;
      doc.line(lineX, lineY, lineX + signatureBox.lineLength, lineY);

      if (name) {
        doc.setFontSize(9);
        doc.text(name, centerX, lineY + signatureBox.lineToName, {
          align: "center",
        });
      }

      doc.setFontSize(8);
      doc.text("NAME", centerX, lineY + signatureBox.nameToLabel, {
        align: "center",
      });
    };

    addSignatureBlock(
      "Requested By",
      getPersonName(vendorPO.po_pr_id?.requestor),
      signatureBox.startX
    );

    addSignatureBlock(
      "Prepared By",
      getPersonName(vendorPO.po_prepared),
      signatureBox.startX + signatureBox.spacing
    );

    addSignatureBlock(
      "Approved By",
      getPersonName(vendorPO.po_approver),
      signatureBox.startX + signatureBox.spacing * 2
    );

    // ===== FOOTER =====
    const footerY = Math.min(signaturesY + 35, 275);
    const companyAddress =
      settings?.company_address ||
      "2nd Floor Unit B ARCA Corporate Center, 150 F. Dela Cruz Street Cor. Maysan Road, Brgy Maysan, Valenzuela, Philippines";
    const companyAddressLines = doc.splitTextToSize(companyAddress, 45);
    doc.setFontSize(9);
    doc.text(companyAddressLines, 15, footerY);

    const pageWidth = 210;
    const rightMargin = 15;
    doc.text(settings?.email || "N/A", pageWidth - rightMargin, footerY, {
      align: "right",
    });
    doc.text(
      `VAT Reg. TIN: ${settings?.tin || "N/A"}`,
      pageWidth - rightMargin,
      footerY + 4,
      { align: "right" }
    );
    doc.text(
      `Telephone No: ${settings?.landline || "(02) 8659 8685"}`,
      pageWidth - rightMargin,
      footerY + 8,
      { align: "right" }
    );

    doc.save(`${vendorPO.po_number}.pdf`);
    window.close();
  };

  return (
    <div style={{ padding: "20px" }}>
      {loading ? (
        <div>Generating PDF... Please wait</div>
      ) : (
        <div>
          PDF generation complete. If download didn't start, check your browser
          settings.
        </div>
      )}
    </div>
  );
};

export default Purchase_order_pdf;
