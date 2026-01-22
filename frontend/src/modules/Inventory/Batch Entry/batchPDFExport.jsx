import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";

export const handleExportToPDF = async (
  batchTicketData,
  setIsExporting,
  selectedRows,
  pagination,
  apiParams,
  handleClosePreview,
  setSelectedRows,
  setSelectAll
) => {
  if (batchTicketData.length === 0) return;

  setIsExporting(true);

  try {
    const statusUpdateResponse = await axios.post(
      `${BASE_URL}/batchEntry/updateBatchStatus`,
      {
        ids: selectedRows,
      }
    );

    if (statusUpdateResponse.status !== 200) {
      const errorMessage =
        statusUpdateResponse.data?.message || "Failed to update batch status";
      swal("Error", errorMessage, "error");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "800px";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.id = "temp-export-container";
    document.body.appendChild(tempContainer);

    for (let i = 0; i < batchTicketData.length; i++) {
      const ticketData = batchTicketData[i];

      const ticketDiv = document.createElement("div");
      ticketDiv.className = "w-100 p-2 px-5";
      ticketDiv.style.fontFamily = "Arial, sans-serif";
      ticketDiv.style.fontSize = "12px";
      ticketDiv.style.lineHeight = "1.2";

      const ticketHTML = generateBatchTicketHTML(ticketData);
      ticketDiv.innerHTML = ticketHTML;

      tempContainer.innerHTML = "";
      tempContainer.appendChild(ticketDiv);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    document.body.removeChild(tempContainer);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `batch-tickets-${timestamp}.pdf`;

    pdf.save(filename);

    swal("Success", `PDF exported successfully!`, "success");

    if (pagination && apiParams) {
      pagination.updateParams(apiParams);
      setSelectedRows([]);
      setSelectAll(false);
    }
    if (handleClosePreview) {
      handleClosePreview();
    }
  } catch (error) {
    console.error("Error in batch processing:", error);

    if (error.response) {
      const errorMessage =
        error.response.data?.message || "Server error occurred";
      swal("Error", errorMessage, "error");
    } else if (error.request) {
      swal("Error", "Network error: Unable to connect to server", "error");
    } else {
      swal("Error", "Failed to process batch operation", "error");
    }
  } finally {
    setIsExporting(false);
  }
};

export const generateBatchTicketHTML = (ticketData) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return `${formatDate(dateString)} | ${formatTime(dateString)}`;
  };

  const getAllMixerNames = () => {
    if (
      !ticketData?.batch_entry_tag_mixers ||
      ticketData.batch_entry_tag_mixers.length === 0
    ) {
      return "N/A";
    }

    const mixerNames = ticketData.batch_entry_tag_mixers
      .map((mixerTag) => mixerTag?.mixer?.name)
      .filter((name) => name)
      .join(", ");

    return mixerNames || "N/A";
  };

  const data = {
    batchNo: ticketData?.batch_transaction_number || "N/A",
    formulaName:
      ticketData?.batch_name ||
      ticketData?.current_product?.product_name ||
      "N/A",
    quantity: ticketData?.product_quantity || "N/A",
    mixer: getAllMixerNames() || "N/A",
    batchDate: formatDateTime(ticketData?.start_date),
    productionDate: formatDateTime(ticketData?.end_date),
    deliveryCode:
      ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice
        ?.delivery_number || "N/A",
    salesInvoice:
      ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice?.sales_invoice ||
      "N/A",
    purchaseOrder:
      ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice?.po_number ||
      "N/A",
    productCode: ticketData?.current_product?.product_code || "N/A",
    productName: ticketData?.current_product?.product_name || "N/A",
    productCategory: ticketData?.current_product?.product_category || "N/A",
    productQuantity: ticketData?.product_quantity || "N/A",
    productUnitPrice:
      ticketData?.product_unit_price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "N/A",
    productSubtotal:
      ticketData?.product_subtotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "N/A",
    ingredients:
      ticketData?.batch_entry_tag_raw_materials?.map((material, index) => {
        const materialData =
          material.is_replacement && material.replacement_material
            ? material.replacement_material
            : material.original_material;

        return {
          no: index + 1,
          productCode: materialData?.product_list?.product_code || "N/A",
          ingredients: materialData?.product_list?.product_name || "N/A",
          weightDisplay: material.quantity_required
            ? parseFloat(material.quantity_required).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00",
          weight: material.quantity_required
            ? parseFloat(material.quantity_required)
            : "0.0000",
          packaging:
            materialData?.product_list?.prod_packaging?.packaging_name || "",
          vendor: materialData?.vendor?.company_name || "",
          category: materialData?.product_list?.product_category || "",
        };
      }) || [],
    date: formatDate(new Date()),
    time: formatTime(new Date()),
  };

  const totalWeight = data.ingredients
    ?.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0)
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const ingredientsRows =
    data.ingredients
      ?.map(
        (item) => `
    <tr style="border: 1px solid #DEE2E6;">
      <td style="border: 1px solid #DEE2E6; text-align: center; padding: 6px 4px;">${
        item.no
      }</td>
      <td style="border: 1px solid #DEE2E6; text-align: center; padding: 6px 4px;">
        <div>${item.productCode}</div>
        ${
          item.category
            ? `<div style="color: red; font-size: 9px; font-style: italic;">Category: ${item.category}</div>`
            : ""
        }
      </td>
      <td style="border: 1px solid #DEE2E6; text-align: center; padding: 6px 4px;">
        <div>${item.ingredients}</div>
        ${
          item.packaging
            ? `<div style="font-size: 9px; color: #666;">(${item.packaging})</div>`
            : ""
        }
        ${
          item.vendor
            ? `<div style="font-size: 9px; color: #666;">Vendor: ${item.vendor}</div>`
            : ""
        }
      </td>
      <td style="border: 1px solid #DEE2E6; text-align: center; padding: 6px 4px;">${
        item.weightDisplay
      }</td>
      <td style="border: 1px solid #DEE2E6; padding: 6px 4px;"></td>
      <td style="border: 1px solid #DEE2E6; padding: 6px 4px;"></td>
      <td style="border: 1px solid #DEE2E6; padding: 6px 4px;"></td>
    </tr>
  `
      )
      .join("") || "";

  return `
    <div style="background-color: #1f4e79; height: 20px; margin-bottom: 10px;"></div>
    
    <div style="text-align: center; margin-bottom: 15px;">
      <h4 style="font-weight: bold; margin: 0; font-size: 16px;">Concord Scientific and Chemical Corporate</h4>
      <h5 style="font-weight: bold; margin: 5px 0; font-size: 14px;">BATCH TICKET</h5>
    </div>

    <div style="display: flex; margin-bottom: 15px; font-size: 11px;">
      <div style="flex: 1;">
        <div style=" margin-bottom: 5px;"><strong>Batch No.:</strong> <span style="margin-left: 20px;">${data.batchNo}</span></div>
        <div style="margin-bottom: 5px;"><strong>Formula Name:</strong> <span>${data.formulaName}</span></div>
        <div style="margin-bottom: 5px;"><strong>Product Code:</strong> <span style="margin-left: 10px;">${data.productCode}</span></div>
        <div style="margin-bottom: 5px;"><strong>Quantity:</strong> <span style="margin-left: 25px;">${data.productQuantity}</span></div>
      </div>
      <div style="flex: 1;">
        <div style="margin-bottom: 5px;"><strong>Mixer:</strong> <span style="margin-left: 50px;">${data.mixer}</span></div>
        <div style="margin-bottom: 5px;"><strong>Batch Date:</strong> <span style="margin-left: 20px;">${data.batchDate}</span></div>
        <div style="margin-bottom: 5px;"><strong>Production Date:</strong> <span>${data.productionDate}</span></div>
      </div>
      <div style="flex: 1;">
        <div style="margin-bottom: 5px;"><strong>Delivery Code:</strong> <span style="margin-left: 10px;">${data.deliveryCode}</span></div>
        <div style="margin-bottom: 5px;"><strong>Sales Invoice #:</strong> <span style="margin-left: 8px;">${data.salesInvoice}</span></div>
        <div style="margin-bottom: 5px;"><strong>Purchase Order #:</strong> <span>${data.purchaseOrder}</span></div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 8%; padding: 6px 4px;">NO.</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 20%; padding: 6px 4px;">PRODUCT CODE</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 35%; padding: 6px 4px;">INGREDIENTS</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 15%; padding: 6px 4px;">WEIGHT</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 12%; padding: 6px 4px;">LOT NO.</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 5%; padding: 6px 4px;">CHECK</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; width: 5%; padding: 6px 4px;">LOAD</th>
        </tr>
      </thead>
      <tbody>
        ${ingredientsRows}
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <td colspan="3" style="border: 1px solid #DEE2E6; text-align: right; padding: 6px 4px;">TOTAL WEIGHT:</td>
          <td style="border: 1px solid #DEE2E6; text-align: center; padding: 6px 4px;">${totalWeight}</td>
          <td colspan="3" style="border: 1px solid #DEE2E6; padding: 6px 4px;"></td>
        </tr>
      </tbody>
    </table>

    <table style="width: 100%; font-size: 10px; margin-bottom: 15px;">
      <thead>
        <tr style="background-color: #e9ecef;">
          <th rowspan="2" style="border: 1px solid #DEE2E6; width: 12%; padding: 6px 4px; vertical-align: middle;"></th>
          <th colspan="2" style="border: 1px solid #DEE2E6; text-align: center; padding: 4px;">WEIGHING TIME</th>
          <th colspan="2" style="border: 1px solid #DEE2E6; text-align: center; padding: 4px;">TIME</th>
          <th colspan="3" style="border: 1px solid #DEE2E6; text-align: center; padding: 4px;">TEMPERATURE (c°)</th>
          <th colspan="3" style="border: 1px solid #DEE2E6; text-align: center; padding: 4px;">RELATIVE HUMIDITY (%)</th>
        </tr>
        <tr style="background-color: #e9ecef;">
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">b</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">sb</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">Production</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">Mixing</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">b</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">sb</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">pr</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">b</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">sb</th>
          <th style="border: 1px solid #DEE2E6; text-align: center; padding: 4px; font-size: 9px;">pr</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px; font-weight: bold;">START</td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px; font-weight: bold;">FINISH</td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
          <td style="border: 1px solid #DEE2E6; padding: 12px 4px;"></td>
        </tr>
      </tbody>
    </table>

    <div style="margin-bottom: 20px; font-size: 11px;">
      <strong>Date:</strong> ${data.date} | <strong>Time:</strong> ${data.time}
    </div>

    <div style="display: flex; font-size: 11px;">
      <div style="flex: 1;">
        <div><strong>Prepared By:</strong></div>
        <div style="border-bottom: 1px solid #000; height: 20px; margin-top: 5px;"></div>
      </div>
      <div style="flex: 1; margin-left: 10px;">
        <div><strong>Bulked Weigher:</strong></div>
        <div style="border-bottom: 1px solid #000; height: 20px; margin-top: 5px;"></div>
      </div>
      <div style="flex: 1; margin-left: 10px;">
        <div><strong>Semi-Bulked Weigher:</strong></div>
        <div style="border-bottom: 1px solid #000; height: 20px; margin-top: 5px;"></div>
      </div>
      <div style="flex: 1; margin-left: 10px;">
        <div><strong>Approved For Delivery:</strong></div>
        <div style="border-bottom: 1px solid #000; height: 20px; margin-top: 5px;"></div>
      </div>
    </div>
  `;
};
