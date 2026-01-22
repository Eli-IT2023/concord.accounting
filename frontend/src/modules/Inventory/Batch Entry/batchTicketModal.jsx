import React from "react";

const BatchTicketModal = ({ ticketData }) => {
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
    productUnitPrice: ticketData?.product_unit_price || "N/A",
    productSubtotal: ticketData?.product_subtotal || "N/A",

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
          weight: material.quantity_required
            ? parseFloat(material.quantity_required).toFixed(4)
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
    .toFixed(4);

  return (
    <div
      className="batch-ticket"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        lineHeight: "1.2",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#1f4e79",
          height: "20px",
          marginBottom: "10px",
        }}
      ></div>

      <div className="text-center mb-3">
        <h4 style={{ fontWeight: "bold", margin: "0", fontSize: "16px" }}>
          Concord Scientific and Chemical Corporate
        </h4>
        <h5 style={{ fontWeight: "bold", margin: "5px 0", fontSize: "14px" }}>
          BATCH TICKET
        </h5>
      </div>

      {/* Main Info Section */}
      <div className="row mb-3" style={{ fontSize: "11px" }}>
        <div className="col-4">
          <div className="mb-1">
            <strong>Batch No.:</strong>{" "}
            <span style={{ marginLeft: "20px" }}>{data.batchNo}</span>
          </div>
          <div className="mb-1">
            <strong>Formula Name:</strong> <span>{data.formulaName}</span>
          </div>
          <div className="mb-1">
            <strong>Product Code:</strong>{" "}
            <span style={{ marginLeft: "10px" }}>{data.productCode}</span>
          </div>
          <div className="mb-1">
            <strong>Quantity:</strong>{" "}
            <span style={{ marginLeft: "25px" }}>{data.productQuantity}</span>
          </div>
        </div>
        <div className="col-4">
          <div className="mb-1">
            <strong>Mixer:</strong>{" "}
            <span style={{ marginLeft: "50px" }}>{data.mixer}</span>
          </div>
          <div className="mb-1">
            <strong>Batch Date:</strong>{" "}
            <span style={{ marginLeft: "20px" }}>{data.batchDate}</span>
          </div>
          <div className="mb-1">
            <strong>Production Date:</strong> <span>{data.productionDate}</span>
          </div>
          <div className="mb-1">
            {/* <strong>Product Qty:</strong>{" "}
            <span style={{ marginLeft: "15px" }}>{data.productQuantity}</span> */}
          </div>
        </div>
        <div className="col-4">
          <div className="mb-1">
            <strong>Delivery Code:</strong>{" "}
            <span style={{ marginLeft: "10px" }}>{data.deliveryCode}</span>
          </div>
          <div className="mb-1">
            <strong>Sales Invoice #:</strong>{" "}
            <span style={{ marginLeft: "8px" }}>{data.salesInvoice}</span>
          </div>
          <div className="mb-1">
            <strong>Purchase Order #:</strong> <span>{data.purchaseOrder}</span>
          </div>
          <div className="mb-1">
            {/* <strong>Category:</strong>{" "}
            <span style={{ marginLeft: "25px" }}>{data.productCategory}</span> */}
          </div>
        </div>
      </div>

      {/* <div
        className="mb-3 p-2 text-center"
        style={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #1976d2",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "bold",
          color: "#1976d2",
        }}
      >
        PRODUCT: {data.productName} | CODE: {data.productCode} | CATEGORY:{" "}
        {data.productCategory}
      </div> */}

      {/* Ingredients Table */}
      <table
        className="table table-bordered"
        style={{ fontSize: "10px", marginBottom: "15px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th
              className="text-center"
              style={{ width: "8%", padding: "6px 4px" }}
            >
              NO.
            </th>
            <th
              className="text-center"
              style={{ width: "20%", padding: "6px 4px" }}
            >
              PRODUCT CODE
            </th>
            <th
              className="text-center"
              style={{ width: "35%", padding: "6px 4px" }}
            >
              INGREDIENTS
            </th>
            <th
              className="text-center"
              style={{ width: "15%", padding: "6px 4px" }}
            >
              WEIGHT
            </th>
            <th
              className="text-center"
              style={{ width: "12%", padding: "6px 4px" }}
            >
              LOT NO.
            </th>
            <th
              className="text-center"
              style={{ width: "5%", padding: "6px 4px" }}
            >
              CHECK
            </th>
            <th
              className="text-center"
              style={{ width: "5%", padding: "6px 4px" }}
            >
              LOAD
            </th>
          </tr>
        </thead>
        <tbody>
          {data.ingredients?.map((item) => (
            <tr key={item.no}>
              <td className="text-center" style={{ padding: "6px 4px" }}>
                {item.no}
              </td>
              <td className="text-center" style={{ padding: "6px 4px" }}>
                <div>{item.productCode}</div>
                <div
                  style={{ color: "red", fontSize: "9px", fontStyle: "italic" }}
                >
                  {item.category && `Category: ${item.category}`}
                </div>
              </td>
              <td className="text-center" style={{ padding: "6px 4px" }}>
                <div>{item.ingredients}</div>
                {item.packaging && (
                  <div style={{ fontSize: "9px", color: "#666" }}>
                    ({item.packaging})
                  </div>
                )}
                {item.vendor && (
                  <div style={{ fontSize: "9px", color: "#666" }}>
                    Vendor: {item.vendor}
                  </div>
                )}
              </td>
              <td className="text-center" style={{ padding: "6px 4px" }}>
                {item.weight}
              </td>
              <td style={{ padding: "6px 4px" }}></td>
              <td style={{ padding: "6px 4px" }}></td>
              <td style={{ padding: "6px 4px" }}></td>
            </tr>
          ))}
          {/* Total Weight Row */}
          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan="3" className="text-end" style={{ padding: "6px 4px" }}>
              TOTAL WEIGHT:
            </td>
            <td className="text-center" style={{ padding: "6px 4px" }}>
              {totalWeight}
            </td>
            <td colSpan="3" style={{ padding: "6px 4px" }}></td>
          </tr>
        </tbody>
      </table>

      {/* Bottom Table */}
      <table
        className="table table-bordered"
        style={{ fontSize: "10px", marginBottom: "15px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#e9ecef" }}>
            <th
              rowSpan="2"
              style={{
                width: "12%",
                padding: "6px 4px",
                verticalAlign: "middle",
              }}
            ></th>
            <th colSpan="2" className="text-center" style={{ padding: "4px" }}>
              WEIGHING TIME
            </th>
            <th colSpan="2" className="text-center" style={{ padding: "4px" }}>
              TIME
            </th>
            <th colSpan="3" className="text-center" style={{ padding: "4px" }}>
              TEMPERATURE (c°)
            </th>
            <th colSpan="3" className="text-center" style={{ padding: "4px" }}>
              RELATIVE HUMIDITY (%)
            </th>
          </tr>
          <tr style={{ backgroundColor: "#e9ecef" }}>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              b
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              sb
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              Production
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              Mixing
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              b
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              sb
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              pr
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              b
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              sb
            </th>
            <th
              className="text-center"
              style={{ padding: "4px", fontSize: "9px" }}
            >
              pr
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "12px 4px", fontWeight: "bold" }}>START</td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
          </tr>
          <tr>
            <td style={{ padding: "12px 4px", fontWeight: "bold" }}>FINISH</td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
            <td style={{ padding: "12px 4px" }}></td>
          </tr>
        </tbody>
      </table>

      {/* Date and Time */}
      <div style={{ marginBottom: "20px", fontSize: "11px" }}>
        <strong>Date:</strong> {data.date} | <strong>Time:</strong> {data.time}
      </div>

      {/* Signature Section */}
      <div className="row" style={{ fontSize: "11px" }}>
        <div className="col-3">
          <div>
            <strong>Prepared By:</strong>
            <div
              style={{
                borderBottom: "1px solid #000",
                height: "20px",
                marginTop: "5px",
              }}
            ></div>
          </div>
        </div>
        <div className="col-3">
          <div>
            <strong>Bulked Weigher:</strong>
            <div
              style={{
                borderBottom: "1px solid #000",
                height: "20px",
                marginTop: "5px",
              }}
            ></div>
          </div>
        </div>
        <div className="col-3">
          <div>
            <strong>Semi-Bulked Weigher:</strong>
            <div
              style={{
                borderBottom: "1px solid #000",
                height: "20px",
                marginTop: "5px",
              }}
            ></div>
          </div>
        </div>
        <div className="col-3">
          <div>
            <strong>Approved For Delivery:</strong>
            <div
              style={{
                borderBottom: "1px solid #000",
                height: "20px",
                marginTop: "5px",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchTicketModal;
