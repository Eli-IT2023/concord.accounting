import swal from "sweetalert";
import * as XLSX from "xlsx";

export const handleExportToExcel = async (batchTicketData, setIsExporting) => {
  if (batchTicketData.length === 0) return;

  setIsExporting(true);

  try {
    const workbook = XLSX.utils.book_new();

    batchTicketData.forEach((ticketData, index) => {
      // Format data for Excel
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

      // Prepare main data
      const mainData = [
        ["CONCORD SCIENTIFIC AND CHEMICAL CORPORATE"],
        ["BATCH TICKET"],
        [""],
        ["Batch No.", ticketData?.batch_transaction_number || "N/A"],
        [
          "Formula Name",
          ticketData?.batch_name ||
            ticketData?.current_product?.product_name ||
            "N/A",
        ],
        ["Product Code", ticketData?.current_product?.product_code || "N/A"],
        ["Quantity", ticketData?.product_quantity || "N/A"],
        [
          "Mixer",
          ticketData?.batch_entry_tag_mixers?.[0]?.mixer?.name || "N/A",
        ],
        ["Batch Date", formatDateTime(ticketData?.start_date)],
        ["Production Date", formatDateTime(ticketData?.end_date)],
        [
          "Delivery Code",
          ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice
            ?.delivery_number || "N/A",
        ],
        [
          "Sales Invoice #",
          ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice
            ?.sales_invoice || "N/A",
        ],
        [
          "Purchase Order #",
          ticketData?.batch_entry_tag_invoices?.[0]?.sales_invoice?.po_number ||
            "N/A",
        ],
        [""],
        ["INGREDIENTS"],
        [
          "NO.",
          "PRODUCT CODE",
          "INGREDIENTS",
          "WEIGHT",
          "LOT NO.",
          "CHECK",
          "LOAD",
        ],
      ];

      // Add ingredients data
      const ingredients =
        ticketData?.batch_entry_tag_raw_materials?.map((material, idx) => {
          const materialData =
            material.is_replacement && material.replacement_material
              ? material.replacement_material
              : material.original_material;

          return [
            idx + 1,
            materialData?.product_list?.product_code || "N/A",
            materialData?.product_list?.product_name || "N/A",
            material.quantity_required
              ? parseFloat(material.quantity_required).toFixed(4)
              : "0.0000",
            "", // LOT NO.
            "", // CHECK
            "", // LOAD
          ];
        }) || [];

      ingredients.forEach((ingredient) => {
        mainData.push(ingredient);
      });

      // Add total weight
      const totalWeight = ingredients
        .reduce((sum, item) => sum + parseFloat(item[3] || 0), 0)
        .toFixed(4);
      mainData.push(["", "", "TOTAL WEIGHT:", totalWeight, "", "", ""]);

      // Add additional sections
      mainData.push([""]);
      mainData.push([
        "WEIGHING TIME",
        "",
        "TIME",
        "",
        "TEMPERATURE (c°)",
        "",
        "",
        "RELATIVE HUMIDITY (%)",
        "",
        "",
      ]);
      mainData.push([
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
      ]);
      mainData.push(["START", "", "", "", "", "", "", "", "", "", ""]);
      mainData.push(["FINISH", "", "", "", "", "", "", "", "", "", ""]);
      mainData.push([""]);
      mainData.push([
        "Date:",
        formatDate(new Date()),
        "Time:",
        formatTime(new Date()),
      ]);
      mainData.push([""]);
      mainData.push([
        "Prepared By:",
        "",
        "Bulked Weigher:",
        "",
        "Semi-Bulked Weigher:",
        "",
        "Approved For Delivery:",
        "",
      ]);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(mainData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
      ];

      // Add worksheet to workbook
      const sheetName = `Batch_${index + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `batch-tickets-${timestamp}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);

    swal("Success", "Excel file exported successfully!", "success");
  } catch (error) {
    console.error("Error exporting Excel:", error);
    swal("Error", "Failed to export Excel file", "error");
  } finally {
    setIsExporting(false);
  }
};
