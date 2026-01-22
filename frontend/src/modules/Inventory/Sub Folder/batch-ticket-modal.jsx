import React from "react";

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

const BatchTicket = ({ ticketData }) => {
  console.log(ticketData, "BATCH TICKET DATA");

  // Helper function
  const formatWeight = (weight) => {
    return parseFloat(weight || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  const ingredients = ticketData?.befmu_formulated_product_id || [];
  const mixers = ticketData?.befp_batch_entry_id?.betm_batch_entry_id || [];
  const batchEntryInfo = ticketData?.befp_batch_entry_id || {};

  // Improved instruction fetching
  const getInstruction = (material) => {
    // Try multiple possible sources for instruction
    return (
      material?.instruction || material?.befmu_product_id?.instruction || ""
    );
  };

  const getQuantity = () => {
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

  const getFormulaName = () => {
    return ticketData?.merge_quantity > 1
      ? `${ticketData?.befp_product_id?.product_name} (${ticketData?.merge_quantity} merged quantity)`
      : ticketData?.befp_product_id?.product_name || "N/A";
  };

  const getAllMixerNames = () => {
    if (!mixers || mixers.length === 0) {
      return "N/A";
    }

    const mixerNames = mixers
      .map((mixerTag) => mixerTag?.betm_mixer_id?.name)
      .filter((name) => name)
      .join(", ");

    return mixerNames || "N/A";
  };

  const getMembersList = () => {
    if (!batchEntryInfo?.members) return "N/A";

    const members = batchEntryInfo?.members;
    if (members.includes(",")) {
      return members.split(",").map((member) => member.trim());
    } else {
      return members.split(" ").map((member) => member.trim());
    }
  };

  const data = {
    batchTitle: batchEntryInfo?.batch_title || "N/A",
    batchNo: batchEntryInfo?.transaction_id || "N/A",
    formulaName: getFormulaName() || "N/A",
    quantity: getQuantity() || "N/A",
    mixer: getAllMixerNames() || "N/A",
    dateCreated: formatDateTime(batchEntryInfo?.createdAt) || "N/A",
    dateProduced: formatDateTime(batchEntryInfo?.start_date) || "N/A",
    teamLeader: batchEntryInfo?.team_leader || "N/A",
    members: getMembersList() || ["N/A"],

    ingredients:
      ingredients.map((material, index) => {
        const instruction = getInstruction(material);

        return {
          no: index + 1,
          productCode: material?.befmu_product_id?.product_code || "N/A",
          instruction: instruction,
          ingredients: material?.befmu_product_id?.product_name || "N/A",
          weight: material?.target_weight
            ? parseFloat(material.target_weight).toFixed(2)
            : "0.0000",
          lotNo:
            material?.bestm_be_material_used_id?.length > 0
              ? material.bestm_be_material_used_id
                  .map((history) => history.lot)
                  .filter((lot) => lot && lot.trim() !== "")
                  .join(", ")
              : "",
          check: "",
          load: "",
        };
      }) || [],
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        lineHeight: "1.4",
        padding: "20px",
        color: "#000",
      }}
    >
      {/* Header */}
      <div
        className="text-center"
        style={{ textAlign: "center", marginBottom: "15px" }}
      >
        <h4 style={{ fontWeight: "bold", margin: "0", fontSize: "16px" }}>
          CONCORD SCIENTIFIC AND CHEMICAL CORPORATION
        </h4>
        <h5 style={{ fontWeight: "bold", margin: "5px 0", fontSize: "14px" }}>
          BATCH TICKET
        </h5>
      </div>

      {/* Info Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <p>
            <strong>Batch No.:</strong> {data.batchNo}
          </p>
          <p>
            <strong>Batch Title:</strong> {data.batchTitle}
          </p>
          <p>
            <strong>Formula Name:</strong> {data.formulaName}
          </p>
          <p>
            <strong>Quantity:</strong> {data.quantity}
          </p>
        </div>
        <div style={{ maxWidth: "450px" }} className="">
          <p>
            <strong>Mixer:</strong> {data.mixer}
          </p>
          <p>
            <strong>Date Created:</strong> {data.dateCreated}
          </p>
          <p>
            <strong>Date Produced:</strong> {data.dateProduced}
          </p>
        </div>
        <div>
          <p>
            <strong>Team Leader:</strong> {data.teamLeader}
          </p>
          <p>
            <strong>Members:</strong>
          </p>
          <p>{data.members.join(", ")}</p>
        </div>
      </div>

      {/* Ingredients Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
          fontSize: "11px",
        }}
        border="1"
      >
        <thead>
          <tr style={{ backgroundColor: "#f9f9f9", textAlign: "center" }}>
            <th>No.</th>
            <th>Product Code</th>
            <th style={{ maxWidth: "200px" }}>Ingredients</th>
            <th>Weight (kg)</th>
            <th>Lot No.</th>
            <th>Check</th>
            <th>Load</th>
          </tr>
        </thead>
        <tbody>
          {data.ingredients && data.ingredients.length > 0 ? (
            data.ingredients.map((item, index) => (
              <tr key={index}>
                <td align="center">{item.no}</td>
                <td style={{ maxWidth: "200px" }} align="center">
                  {item.productCode}
                  <br />
                  <span style={{ color: "red", fontStyle: "italic" }}>
                    {item.instruction}
                  </span>
                </td>
                <td align="center">{item.ingredients}</td>
                <td align="center">{formatWeight(item.weight)}</td>
                <td align="center">{item.lotNo}</td>
                <td align="center">{item.check}</td>
                <td align="center">{item.load}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" align="center">
                No ingredients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bottom Measurement Table (Updated) */}
      <div style={{ marginTop: "30px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{ border: "1px solid #666", padding: "8px" }}
                rowSpan="2"
              ></th>
              <th
                style={{ border: "1px solid #666", padding: "8px" }}
                colSpan="2"
              >
                WEIGHING TIME
              </th>
              <th
                style={{ border: "1px solid #666", padding: "8px" }}
                colSpan="2"
              >
                TIME
              </th>
              <th
                style={{ border: "1px solid #666", padding: "8px" }}
                colSpan="2"
              >
                TEMPERATURE (°C)
              </th>
              <th
                style={{ border: "1px solid #666", padding: "8px" }}
                colSpan="4"
              >
                RELATIVE HUMIDITY (%)
              </th>
            </tr>
            <tr>
              <th style={{ border: "1px solid #666", padding: "4px" }}>b</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>sb</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>
                Production
              </th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>
                Mixing
              </th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>b</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>sb</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>pr</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>b</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>sb</th>
              <th style={{ border: "1px solid #666", padding: "4px" }}>pr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #666", padding: "6px" }}>
                START
              </td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #666", padding: "6px" }}>
                FINISH
              </td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
              <td style={{ border: "1px solid #666" }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
        }}
      >
        <div style={{ minWidth: "170px" }}>
          <strong>Prepared By</strong>
          <div
            style={{
              borderBottom: "1px solid #000",
              height: "20px",
              marginTop: "5px",
            }}
          ></div>
        </div>
        <div style={{ minWidth: "170px" }}>
          <strong>Bulk Weigher</strong>
          <div
            style={{
              borderBottom: "1px solid #000",
              height: "20px",
              marginTop: "5px",
            }}
          ></div>
        </div>
        <div style={{ minWidth: "170px" }}>
          <strong>Semi-Bulk Weigher</strong>
          <div
            style={{
              borderBottom: "1px solid #000",
              height: "20px",
              marginTop: "5px",
            }}
          ></div>
        </div>
        <div style={{ minWidth: "170px" }}>
          <strong>Approved for Delivery</strong>
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
  );
};

export default BatchTicket;
