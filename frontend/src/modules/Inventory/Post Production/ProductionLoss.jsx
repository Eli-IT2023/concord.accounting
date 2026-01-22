import React, { useEffect, useState } from "react";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate, useParams } from "react-router-dom";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// collapsible container
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";

const ProductionLoss = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const [exportType, setExportType] = useState(null); // 'pdf' or 'excel'

  // State declarations
  const [showModal, setShowModal] = useState(false);
  const [quantitiesProduced, setQuantitiesProduced] = useState({});
  const [usedQuantities, setUsedQuantities] = useState({});
  const [actualWeight, setActualWeight] = useState({});
  const [totalQuantityProduced, setTotalQuantityProduced] = useState(0);
  const [totalWeightOut, setTotalWeightOut] = useState(0);
  const [totalQuantityUsed, setTotalQuantityUsed] = useState(0);
  const [totalQuantityOrdered, setTotalQuantityOrdered] = useState(0);
  const [totalWeightIn, setTotalWeightIn] = useState(0);
  const [totalQuantityRequired, setTotalQuantityRequired] = useState(0);

  const [quantitiesProducedFormatted, setQuantitiesProducedFormatted] =
    useState({});
  const [usedQuantitiesFormatted, setUsedQuantitiesFormatted] = useState({});
  const [actualWeightFormatted, setActualWeightFormatted] = useState({});

  // Store all data across all pages
  const [allActualProductionData, setAllActualProductionData] = useState([]);
  const [allRawMaterialData, setAllRawMaterialData] = useState([]);

  // Store all initial values to prevent reset on page change
  const [actualProdInitialized, setActualProdInitialized] = useState(false);
  const [rawMaterialsInitialized, setRawMaterialsInitialized] = useState(false);
  const [postProductionStatus, setPostProductionStatus] = useState("");

  // fetch batch list
  const [fetchBatchEntry, setFetchBatchEntry] = useState(null);

  useEffect(() => {
    const postProductionStatus = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/PostProduction/get-status/${id}`
        );
        if (response.data.success) {
          console.log(response.data, "THIS IS RESPONSE");
          setPostProductionStatus(response.data.status);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    postProductionStatus();
  }, []);

  const isCompleted = postProductionStatus === "Completed";

  useEffect(() => {
    const batchEntryData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/PostProduction/fetchBatchEntry/${id}`
        );
        if (response.data.success) {
          setFetchBatchEntry(response.data.data);
          console.log(response.data.data, "WHAT IS THE DATA");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    batchEntryData();
  }, []);

  // modal
  const showApproveModal = () => setShowModal(true);
  const handleClose = () => {
    setShowModal(false);
    setExportType(null); // Reset export type
  };

  // format on change
  const handleFormattedInputChange = (e, id, setter, setterFormatted) => {
    let raw = e.target.value.replace(/,/g, "");

    // Allow empty value
    if (raw === "") {
      setter((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      setterFormatted((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      return;
    }

    // Validate number format
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;

    // Store raw value (without formatting)
    setter((prev) => ({
      ...prev,
      [id]: raw,
    }));

    // Create formatted version for display using our custom formatter
    setterFormatted((prev) => ({
      ...prev,
      [id]: formatNumber(raw),
    }));
  };

  // new format if no decimal
  const formatNumber = (value) => {
    if (value === undefined || value === null) return "";

    const num = parseFloat(value);
    if (isNaN(num)) return "";

    // Check if the number is an integer or has .00
    if (num % 1 === 0) {
      return new Intl.NumberFormat("en-US").format(num);
    }

    // For numbers with decimal places
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Pagination hooks next
  // before production
  const [beforeProductionPaginationUrl, setBeforeProductionPaginationUrl] =
    useState(BASE_URL + `/PostProduction/beforeProductionFetch/${id}`);
  const paginationBeforeProductionData = useServerPagination(
    beforeProductionPaginationUrl,
    10
  );

  // actual production
  const [actualProductionPaginationUrl, setActualProductionPaginationUrl] =
    useState(BASE_URL + `/PostProduction/actualProductionFetch/${id}`);
  const paginationActualProductionData = useServerPagination(
    actualProductionPaginationUrl,
    10
  );

  // raw mats used
  const [rawMaterialPaginationUrl, setRawMaterialPaginationUrl] = useState(
    BASE_URL + `/PostProduction/rawMaterialFetch/${id}`
  );
  const paginationRawMaterialData = useServerPagination(
    rawMaterialPaginationUrl,
    10
  );
  // Store all data when new pages are fetched - ACTUAL PRODUCTION
  useEffect(() => {
    if (paginationActualProductionData.data.length > 0) {
      setAllActualProductionData((prev) => {
        const newData = [...prev];
        paginationActualProductionData.data.forEach((item) => {
          if (!newData.some((existing) => existing.id === item.id)) {
            newData.push(item);
          }
        });
        return newData;
      });

      // Only set initial values once for actual production
      if (!actualProdInitialized) {
        const initialUsedQuantities = {};
        const initialUsedQuantitiesFormatted = {};
        const initialActualWeights = {};
        const initialActualWeightsFormatted = {};

        paginationActualProductionData.data.forEach((item) => {
          if (
            item.befmu_pp_formulated_product_id?.actual_weight !== undefined &&
            item.befmu_pp_formulated_product_id?.actual_weight !== null
          ) {
            const val =
              item.befmu_pp_formulated_product_id?.actual_weight.toString();
            initialActualWeights[item.id] = val;
            initialActualWeightsFormatted[item.id] = formatNumber(val);
          }
        });

        setUsedQuantities((prev) => ({ ...prev, ...initialUsedQuantities }));
        setUsedQuantitiesFormatted((prev) => ({
          ...prev,
          ...initialUsedQuantitiesFormatted,
        }));
        setActualWeight((prev) => ({ ...prev, ...initialActualWeights }));
        setActualWeightFormatted((prev) => ({
          ...prev,
          ...initialActualWeightsFormatted,
        }));

        setActualProdInitialized(true);
      }
    }
  }, [paginationActualProductionData.data]);

  // Store all data when new pages are fetched - RAW MATERIALS
  useEffect(() => {
    if (paginationRawMaterialData.data.length > 0) {
      setAllRawMaterialData((prev) => {
        const newData = [...prev];
        paginationRawMaterialData.data.forEach((item) => {
          if (!newData.some((existing) => existing.id === item.id)) {
            newData.push(item);
          }
        });
        return newData;
      });

      // Only set initial values once for raw materials
      if (!rawMaterialsInitialized) {
        const initialQuantitiesProduced = {};
        const initialQuantitiesProducedFormatted = {};

        paginationRawMaterialData.data.forEach((item) => {
          // Only set initial value if there's no existing value
          if (
            !quantitiesProduced[item.id] &&
            item.target_weight !== undefined &&
            item.target_weight !== null
          ) {
            const val = item.target_weight.toString();
            initialQuantitiesProduced[item.id] = val;
            initialQuantitiesProducedFormatted[item.id] = formatNumber(val);
          }
        });

        setQuantitiesProduced((prev) => ({
          ...prev,
          ...initialQuantitiesProduced,
        }));
        setQuantitiesProducedFormatted((prev) => ({
          ...prev,
          ...initialQuantitiesProducedFormatted,
        }));

        setRawMaterialsInitialized(true);
      }
    }
  }, [paginationRawMaterialData.data]);

  // onchange calculation - now uses all data
  const calculateTotals = () => {
    const qtyTotal = allActualProductionData.reduce((sum, item) => {
      const value = usedQuantities[item.id];
      return sum + (value ? parseFloat(value) : 0);
    }, 0);

    const weightTotal = allActualProductionData.reduce((sum, item) => {
      const value = actualWeight[item.id];
      return sum + (value ? parseFloat(value) : 0);
    }, 0);

    const quantityUsed = allRawMaterialData.reduce((sum, item) => {
      const value = quantitiesProduced[item.id];
      // Allow empty values (0 or null) to account for loss
      return sum + (value ? parseFloat(value) : 0);
    }, 0);

    setTotalQuantityProduced(qtyTotal);
    setTotalWeightOut(weightTotal);
    setTotalQuantityUsed(quantityUsed);
  };

  // for total cost break down
  const [openSections, setOpenSections] = useState([]);

  const toggleSection = (section) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // // Add this function to check if a section is open
  // const isSectionOpen = (section) => openSections.includes(section);

  // const isBatchCostOpen = openSections.includes("batchCost");

  const [fetchCostList, setFetchCostList] = useState(null);

  useEffect(() => {
    const costListData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/PostProduction/fetchCostList/${id}`
        );
        if (response.data.success) {
          setFetchCostList(response.data.data);
          console.log(response.data.data, "WHAT IS THE DATA");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    costListData();
  }, []);

  const batchTotal = fetchCostList
    ? fetchCostList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : 0;

  useEffect(() => {
    calculateTotals();
  }, [
    usedQuantities,
    actualWeight,
    quantitiesProduced,
    allActualProductionData,
    allRawMaterialData,
  ]);

  // useEffect(() => {
  //   const weightIn = paginationBeforeProductionData.data.reduce((sum, item) => {
  //     const value = item.weight ?? 0;
  //     return sum + (value ? parseFloat(value) : 0);
  //   }, 0);

  //   setTotalWeightIn(weightIn);
  // }, [paginationBeforeProductionData.data]);

  // totals for overview
  // total quantity ordered
  useEffect(() => {
    const fetchTotalQuantity = async () => {
      try {
        const response = await axios.get(
          BASE_URL + `/PostProduction/totalQuantityOrdered/${id}`
        );
        setTotalQuantityOrdered(response.data.total_quantity);
      } catch (error) {
        console.error("Error fetching total quantity ordered:", error);
      }
    };

    fetchTotalQuantity();
  }, []);

  // total Weight in
  useEffect(() => {
    const fetchTotalWeight = async () => {
      try {
        const response = await axios.get(
          BASE_URL + `/PostProduction/totalWeightIn/${id}`
        );
        setTotalWeightIn(response.data.total_weight_in);
      } catch (error) {
        console.error("Error fetching total weight in:", error);
      }
    };

    fetchTotalWeight();
  }, []);

  // TARGET WEIGHT OF RAW
  useEffect(() => {
    const fetchTotalQtyRequired = async () => {
      try {
        const response = await axios.get(
          BASE_URL + `/PostProduction/totalRawTargetWeight/${id}`
        );
        setTotalQuantityRequired(response.data.total_target_weight_raw);
      } catch (error) {
        console.error("Error fetching total quantity required:", error);
      }
    };

    fetchTotalQtyRequired();
  }, []);

  // Set initial values when data loads
  useEffect(() => {
    if (paginationActualProductionData.data.length > 0) {
      setAllActualProductionData((prev) => {
        const newData = [...prev];
        paginationActualProductionData.data.forEach((item) => {
          if (!newData.some((existing) => existing.id === item.id)) {
            newData.push(item);
          }
        });
        return newData;
      });

      // Only set initial values if they haven't been set yet for these items
      const newInitialUsedQuantities = {};
      const newInitialUsedQuantitiesFormatted = {};
      const newInitialActualWeights = {};
      const newInitialActualWeightsFormatted = {};

      paginationActualProductionData.data.forEach((item) => {
        if (!(item.id in usedQuantities)) {
          if (
            item.actual_quantity !== undefined &&
            item.actual_quantity !== null
          ) {
            const val = item.actual_quantity.toString();
            newInitialUsedQuantities[item.id] = val;
            newInitialUsedQuantitiesFormatted[item.id] = formatNumber(val);
          }
          if (
            item.product_list?.ppp_product_id?.actual_weight !== undefined &&
            item.product_list?.ppp_product_id?.actual_weight !== null
          ) {
            const val =
              item.product_list.ppp_product_id.actual_weight.toString();
            newInitialActualWeights[item.id] = val;
            newInitialActualWeightsFormatted[item.id] = formatNumber(val);
          }
        }
      });

      if (Object.keys(newInitialUsedQuantities).length > 0) {
        setUsedQuantities((prev) => ({ ...prev, ...newInitialUsedQuantities }));
        setUsedQuantitiesFormatted((prev) => ({
          ...prev,
          ...newInitialUsedQuantitiesFormatted,
        }));
      }

      if (Object.keys(newInitialActualWeights).length > 0) {
        setActualWeight((prev) => ({ ...prev, ...newInitialActualWeights }));
        setActualWeightFormatted((prev) => ({
          ...prev,
          ...newInitialActualWeightsFormatted,
        }));
      }
    }
  }, [paginationActualProductionData.data]);

  // useEffect(() => {
  //   console.log(allActualProductionData, `THIS ALL ACTUAL PRODUCTION DATA`);
  // }, [allActualProductionData]);

  useEffect(() => {
    console.log(allRawMaterialData, `THIS ALL RAW MATERIAL DATA`);
  }, [allRawMaterialData]);

  useEffect(() => {
    console.log(actualWeight, `THIS ALL ACTUAL ACTUAL WEIGHT`);
  }, [actualWeight]);

  useEffect(() => {
    if (paginationRawMaterialData.data.length > 0) {
      setAllRawMaterialData((prev) => {
        const newData = [...prev];
        paginationRawMaterialData.data.forEach((item) => {
          if (!newData.some((existing) => existing.id === item.id)) {
            newData.push(item);
          }
        });
        return newData;
      });

      // Only set initial values if they haven't been set yet for these items
      const newInitialQuantitiesProduced = {};
      const newInitialQuantitiesProducedFormatted = {};

      paginationRawMaterialData.data.forEach((item) => {
        if (!(item.id in quantitiesProduced)) {
          if (item.quantity_used !== undefined && item.quantity_used !== null) {
            const val = item.quantity_used.toString();
            newInitialQuantitiesProduced[item.id] = val;
            newInitialQuantitiesProducedFormatted[item.id] = formatNumber(val);
          }
        }
      });

      if (Object.keys(newInitialQuantitiesProduced).length > 0) {
        setQuantitiesProduced((prev) => ({
          ...prev,
          ...newInitialQuantitiesProduced,
        }));
        setQuantitiesProducedFormatted((prev) => ({
          ...prev,
          ...newInitialQuantitiesProducedFormatted,
        }));
      }
    }
  }, [paginationRawMaterialData.data]);

  // handle update - now uses all data

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const confirmed = await swal({
        title: "Confirm changes?",
        text: "Do you want to save these updates?",
        icon: "warning",
        buttons: ["Cancel", "Save"],
        dangerMode: false,
      });

      if (confirmed) {
        const actualProductionData = allActualProductionData.map((item) => ({
          batch_entry_product_id: item.id,
          batch_entry_id: item?.batch_entry_id,
          product_id: item?.befp_product_id?.product_id,
          // quantity_produced: usedQuantities[item.id]
          //   ? parseFloat(usedQuantities[item.id].replace(/,/g, ""))
          //   : null,
          target_weight: item?.weight,
          actual_weight: actualWeight[item.id]
            ? parseFloat(actualWeight[item.id].replace(/,/g, ""))
            : null,
          // unit_price: item.befp_sales_product_tag_id?.unit_price,
        }));

        // const rawMaterialsData = allRawMaterialData.map((item) => {
        //   // const tag = item.resolved_product_tag || {};
        //   const product = item?.befmu_product_id || {};

        //   return {
        //     batch_entry_raw_id: item.id,
        //     product_id: product.product_id,
        //     batch_entry_id: item.batch_entry_id,
        //     // product_code: product.product_code || "-",
        //     // product_name: product.product_name || "-",
        //     target_weight: item.target_weight,
        //     actual_weight: quantitiesProduced[item.id]
        //       ? parseFloat(quantitiesProduced[item.id])
        //       : null,
        //     // unit_cost: tag.product_price || 0,
        //   };
        // });

        const rawMaterialsData = allRawMaterialData.map((item) => {
          const product = item?.befmu_product_id || {};

          return {
            batch_entry_raw_id: item.id,
            product_id: product.product_id,
            batch_entry_id: item.batch_entry_id,
            target_weight: item.target_weight,
            actual_weight: quantitiesProduced[item.id]
              ? parseFloat(quantitiesProduced[item.id])
              : 0, // Set to 0 if empty to account for loss
          };
        });

        // Prepare Summary Data
        const summaryData = {
          weight_in: totalWeightIn,
          weight_out: totalWeightOut,
          quantity_required: totalQuantityRequired,
          quantity_used: totalQuantityUsed,
          quantity_ordered: totalQuantityOrdered,
          quantity_produced: totalQuantityProduced,
          loss: Math.max(0, totalWeightIn - totalWeightOut),
          loss_percentage:
            totalWeightOut > 0
              ? (
                  ((totalWeightIn - totalWeightOut) / totalWeightIn) *
                  100
                ).toFixed(2)
              : "0.00",
        };

        console.log("=== PRODUCTION DATA TO BE SAVED ===");
        console.log("Batch ID:", id);
        console.log("--- Actual Production Data ---");
        console.log(actualProductionData);
        console.log("--- Raw Materials Data ---");
        console.log(rawMaterialsData);
        console.log("--- Summary Data ---");
        console.log(summaryData);

        // API call would go here
        const response = await axios.post(
          BASE_URL + "/PostProduction/updateProductionLoss",
          {
            batch_id: id,
            actual_production: actualProductionData,
            raw_materials: rawMaterialsData,
            summary: summaryData,
          }
        );

        if (response.data.success) {
          swal({
            title: "Success!",
            text: "Changes saved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
          }).then(() => {
            // Optionally refresh data here
          });
        } else {
          throw new Error(response.data.message || "Failed to save changes");
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
      swal({
        title: "Error",
        text: error.response?.data?.message || "Failed to save changes",
        icon: "error",
      });
    }
  };

  // Clear data when component unmounts or id changes
  useEffect(() => {
    return () => {
      setAllActualProductionData([]);
      setAllRawMaterialData([]);
    };
  }, []);

  useEffect(() => {
    setAllActualProductionData([]);
    setAllRawMaterialData([]);
  }, [id]);

  // for totals
  const [totalMaterialCost, setTotalMaterialCost] = useState(0);

  // Calculate total material cost
  useEffect(() => {
    const totalCost = allRawMaterialData.reduce((sum, item) => {
      const costAmount = item.cost_amount;
      if (costAmount != null) {
        const cost = parseFloat(costAmount);
        return sum + (isNaN(cost) ? 0 : cost);
      }
      return sum;
    }, 0);

    setTotalMaterialCost(totalCost);
  }, [allRawMaterialData]);

  // export
  // Add this function to fetch fresh saved data
  const fetchSavedProductionData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PostProduction/getSavedProductionData/${id}`
      );

      if (response.data.success) {
        return {
          beforeProduction: response.data.beforeProduction || [],
          actualProduction: response.data.actualProduction || [],
          rawMaterials: response.data.rawMaterials || [],
          totals: response.data.totals || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching saved data:", error);
      return null;
    }
  };

  const exportToPDF = async () => {
    // Show loading indicator
    setIsLoading(true);

    try {
      // Fetch saved data from server
      const savedData = await fetchSavedProductionData();

      if (!savedData) {
        swal({
          title: "Error",
          text: "Failed to fetch saved production data",
          icon: "error",
          button: "OK",
        });
        return;
      }

      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text("Production Loss Report", 14, 10);
      doc.setFontSize(12);
      doc.text(`Batch Title: ${fetchBatchEntry?.batch_title || "-"}`, 14, 17);
      doc.text(
        `Batch Transaction: ${fetchBatchEntry?.transaction_id || "-"}`,
        14,
        24
      );

      // Before Production Table - Use SAVED data
      doc.text("Before Production", 14, 40);
      doc.autoTable({
        startY: 45,
        head: [
          ["Product Code", "Product Name", "Ordered Weight (kg)", "Unit Price"],
        ],
        body: savedData.beforeProduction.map((item) => [
          item.product_code || "-",
          item.product_name || "-",
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            item.weight || 0
          ),
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            item.unit_price || 0
          ),
        ]),
      });

      // Actual Production Table - Use SAVED data
      doc.text("Actual Production", 14, doc.lastAutoTable.finalY + 15);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [
          ["Product Code", "Product Name", "Actual Weight (kg)", "Unit Price"],
        ],
        body: savedData.actualProduction.map((item) => [
          item.product_code || "-",
          item.product_name || "-",
          // Use saved actual_weight, not current input value
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            item.actual_weight || 0
          ),
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            item.unit_price || 0
          ),
        ]),
      });

      // Raw Materials Table - Use SAVED data
      doc.text("Raw Materials Used", 14, doc.lastAutoTable.finalY + 15);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [
          [
            "Product Code",
            "Product Name",
            "UOM",
            "Weight Required (kg)",
            "Weight Used (kg)",
          ],
        ],
        body: savedData.rawMaterials.map((item) => {
          // Use saved actual_weight, not current input value
          const actualWeightValue = item.actual_weight || 0;

          return [
            item.product_code || "-",
            item.product_name || "-",
            item.uom_string || "-",
            new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
              item.target_weight || 0
            ),
            new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
              actualWeightValue
            ),
          ];
        }),
      });

      // Summary Section - Use SAVED totals
      doc.text("Summary", 14, doc.lastAutoTable.finalY + 15);
      const summaryData = [
        [
          "Weight In",
          `${new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
          }).format(savedData.totals.weight_in || 0)} (kg)`,
        ],
        [
          "Weight Out",
          `${new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
          }).format(savedData.totals.weight_out || 0)} (kg)`,
        ],
        [
          "Material Weight Required",
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            savedData.totals.quantity_required || 0
          ),
        ],
        [
          "Actual Material Weight",
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            savedData.totals.quantity_used || 0
          ),
        ],
        [
          "Loss",
          new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
            Math.max(
              0,
              (savedData.totals.weight_in || 0) -
                (savedData.totals.weight_out || 0)
            )
          ),
        ],
        [
          "Production Loss %",
          (savedData.totals.weight_in || 0) > 0
            ? `${Math.max(
                0,
                (
                  ((savedData.totals.weight_in - savedData.totals.weight_out) /
                    savedData.totals.weight_in) *
                  100
                ).toFixed(2)
              )}%`
            : "0.00%",
        ],
      ];

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Metric", "Value"]],
        body: summaryData,
        styles: {
          cellPadding: 5,
          fontSize: 10,
          valign: "middle",
        },
        columnStyles: {
          0: { fontStyle: "bold" },
        },
      });

      doc.save(
        `ProductionLoss_${fetchBatchEntry?.batch_title || id}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Export to PDF failed:", error);
      swal({
        title: "Export Failed",
        text: "Failed to export PDF. Please try again.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    // Show loading indicator
    setIsLoading(true);

    try {
      // Fetch saved data from server
      const savedData = await fetchSavedProductionData();

      if (!savedData) {
        swal({
          title: "Error",
          text: "Failed to fetch saved production data",
          icon: "error",
          button: "OK",
        });
        return;
      }

      const sheetData = [];

      // === Header ===
      sheetData.push(["Production Loss Report"]);
      sheetData.push([`Batch Title #: ${fetchBatchEntry?.batch_title || "-"}`]);
      sheetData.push([
        `Batch Transaction #: ${fetchBatchEntry?.transaction_id || "-"}`,
      ]);
      sheetData.push([]);

      // === Section: Before Production - Use SAVED data ===
      sheetData.push(["Before Production"]);
      sheetData.push([
        "Product Code",
        "Product Name",
        "Ordered Weight (kg)",
        "Unit Price",
      ]);
      savedData.beforeProduction.forEach((item) => {
        sheetData.push([
          item.product_code || "-",
          item.product_name || "-",
          item.weight || 0,
          item.unit_price || 0,
        ]);
      });

      sheetData.push([]);

      // === Section: Actual Production - Use SAVED data ===
      sheetData.push(["Actual Production"]);
      sheetData.push([
        "Product Code",
        "Product Name",
        "Actual Weight (kg)",
        "Unit Price",
      ]);
      savedData.actualProduction.forEach((item) => {
        sheetData.push([
          item.product_code || "-",
          item.product_name || "-",
          item.actual_weight || 0, // Use saved actual_weight
          item.unit_price || 0,
        ]);
      });

      sheetData.push([]);

      // === Section: Raw Materials - Use SAVED data ===
      sheetData.push(["Raw Materials Used"]);
      sheetData.push([
        "Product Code",
        "Product Name",
        "UOM",
        "Weight Required (kg)",
        "Weight Used (kg)",
      ]);
      savedData.rawMaterials.forEach((item) => {
        // Use saved actual_weight
        const actualWeightValue = item.actual_weight || 0;

        sheetData.push([
          item.product_code || "-",
          item.product_name || "-",
          item.uom_string || "-",
          item.target_weight || 0,
          actualWeightValue,
        ]);
      });

      sheetData.push([]);

      // === Section: Summary - Use SAVED totals ===
      const loss = Math.max(
        0,
        (savedData.totals.weight_in || 0) - (savedData.totals.weight_out || 0)
      );
      const lossPercentage =
        (savedData.totals.weight_in || 0) > 0
          ? ((loss / (savedData.totals.weight_in || 1)) * 100).toFixed(2)
          : 0;

      sheetData.push(["Summary"]);
      sheetData.push(["Metric", "Value"]);
      sheetData.push(["Weight In", `${savedData.totals.weight_in || 0} (kg)`]);
      sheetData.push([
        "Weight Out",
        `${savedData.totals.weight_out || 0} (kg)`,
      ]);
      sheetData.push([
        "Material Weight Required",
        savedData.totals.quantity_required || 0,
      ]);
      sheetData.push([
        "Actual Material Weight",
        savedData.totals.quantity_used || 0,
      ]);
      sheetData.push(["Loss", loss]);
      sheetData.push(["Production Loss %", `${lossPercentage}%`]);

      // === Create Worksheet ===
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // === Apply column width spacing ===
      const colWidths = [
        { wch: 20 }, // Product Code
        { wch: 30 }, // Product Name
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
      ];
      ws["!cols"] = colWidths;

      // === Style the header (manually for A1) ===
      if (!ws["A1"]) ws["A1"] = {};
      ws["A1"].s = {
        font: { bold: true, sz: 20 },
      };

      // === Create and export workbook ===
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Production Summary");

      XLSX.writeFile(
        wb,
        `Production Loss - ${fetchBatchEntry?.transaction_id || id}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
    } catch (error) {
      console.error("Export to Excel failed:", error);
      swal({
        title: "Export Failed",
        text: "Failed to export Excel. Please try again.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setIsLoading(false);
    }
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
      ) : authrztn && authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom2">
              <span className="fs-3">
                <Link
                  to={`/inventory/view-batch-entry/${id}/post-production`}
                  className="text-dark mx-2"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </Link>
                PRODUCTION LOSS
              </span>
            </div>
            <div className="d-flex flex-row gap-2">
              <button
                className="btn btn-danger"
                onClick={() => {
                  setExportType("pdf");
                  setShowModal(true);
                }}
                disabled={isLoading}
              >
                {isLoading ? "Exporting..." : "Export PDF"}
              </button>

              <button
                className="btn btn-success"
                onClick={() => {
                  setExportType("excel");
                  setShowModal(true);
                }}
                disabled={isLoading}
              >
                {isLoading ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>

          <div className="container-fluid mt-3">
            <div className="row">
              <div
                className="col-sm px-2 py-2"
                style={{ minHeight: "350px", borderRight: "1px solid #C7C8C9" }}
              >
                <label htmlFor="" className="mb-2">
                  Before Production
                </label>

                {/* Scrollable container for table body */}
                <div
                  className="scrollable-contents"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <table
                    className="table table-hover table-responsive"
                    id="beforeProductionLossTable"
                  >
                    <thead
                      className="bg-light"
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#EBEFF4",
                        zIndex: 1,
                      }}
                    >
                      <tr>
                        <th
                          className="text-muted"
                          style={{
                            fontSize: "14px",
                            backgroundColor: "#EBEFF4",
                          }}
                        >
                          Product Code <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted"
                          style={{
                            fontSize: "14px",
                            backgroundColor: "#EBEFF4",
                          }}
                        >
                          Product Name <i className="fas fa-sort ms-1"></i>
                        </th>
                        {/* <th
                            className="text-muted"
                            style={{
                              fontSize: "14px",
                              backgroundColor: "#EBEFF4",
                            }}
                          >
                            Quantity Ordered <i className="fas fa-sort ms-1"></i>
                          </th> */}
                        <th
                          className="text-muted"
                          style={{
                            fontSize: "14px",
                            backgroundColor: "#EBEFF4",
                          }}
                        >
                          Ordered Weight (kg)
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted"
                          style={{
                            fontSize: "14px",
                            backgroundColor: "#EBEFF4",
                          }}
                        >
                          Unit Price <i className="fas fa-sort ms-1"></i>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginationBeforeProductionData.loading ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : paginationBeforeProductionData.error ? (
                        <tr>
                          <td colSpan="4" className="text-center text-danger">
                            Error loading data
                          </td>
                        </tr>
                      ) : paginationBeforeProductionData.data.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        paginationBeforeProductionData.data.map(
                          (item, index) => (
                            <tr
                              key={index}
                              className="paginationProductionLossTableRowBefore"
                            >
                              <td style={{ fontSize: "14px" }}>
                                {item.befp_product_id?.product_code}
                              </td>
                              <td style={{ fontSize: "14px" }}>
                                <div className="d-flex flex-column w-100 h-100">
                                  <span>
                                    {item.befp_product_id?.product_name}
                                  </span>
                                  <span style={{ fontSize: "12px" }}>
                                    {item.merge_quantity > 1 && (
                                      <span className="text-muted ms-1">
                                        ({item.merge_quantity} material merged)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              {/* <td>
                                  <input
                                    type="text"
                                    value={new Intl.NumberFormat("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }).format(item.quantity)}
                                    className="form-control form-control-sm border-0"
                                    style={{
                                      background: "inherit",
                                      pointerEvents: "none",
                                      fontSize: "14px",
                                    }}
                                  />
                                </td> */}
                              <td>
                                <input
                                  type="text"
                                  value={new Intl.NumberFormat("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(item?.weight ?? 0)}
                                  className="form-control form-control-sm border-0"
                                  style={{
                                    background: "inherit",
                                    pointerEvents: "none",
                                    fontSize: "14px",
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={new Intl.NumberFormat("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(
                                    item.befp_sales_product_tag_id?.unit_price
                                  )}
                                  className="form-control form-control-sm border-0"
                                  style={{
                                    background: "inherit",
                                    pointerEvents: "none",
                                    fontSize: "14px",
                                  }}
                                />
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <PaginationControls {...paginationBeforeProductionData} />
              </div>
              <div className="col-sm px-2 py-2" style={{ minHeight: "350px" }}>
                <label htmlFor="" className="mb-2">
                  Actual Production
                </label>
                <div
                  className="scrollable-contents"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <table
                    className="table table-hover table-responsive"
                    id="actualProductionLossTable"
                  >
                    <thead
                      className="bg-light"
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#EBEFF4",
                        zIndex: 1,
                      }}
                    >
                      <tr>
                        <th
                          className="text-muted"
                          style={{
                            backgroundColor: "#EBEFF4",
                            fontSize: "14px",
                          }}
                        >
                          Product Code
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted"
                          style={{
                            backgroundColor: "#EBEFF4",
                            fontSize: "14px",
                          }}
                        >
                          Product Name
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        {/* <th
                            className="text-muted"
                            style={{
                              backgroundColor: "#EBEFF4",
                              fontSize: "14px",
                            }}
                          >
                            Actual Produced
                            <i className="fas fa-sort ms-1"></i>
                          </th> */}
                        <th
                          className="text-muted"
                          style={{
                            backgroundColor: "#EBEFF4",
                            fontSize: "14px",
                          }}
                        >
                          Actual Weight (kg)
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted"
                          style={{
                            backgroundColor: "#EBEFF4",
                            fontSize: "14px",
                          }}
                        >
                          Unit Price
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationActualProductionData.loading ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : paginationActualProductionData.error ? (
                        <tr>
                          <td colSpan="4" className="text-center text-danger">
                            Error loading data
                          </td>
                        </tr>
                      ) : paginationActualProductionData.data.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        paginationActualProductionData.data.map(
                          (item, index) => (
                            <tr
                              key={index}
                              className="paginationProductionLossTableRowAfter"
                            >
                              <td style={{ fontSize: "14px" }}>
                                {item.befp_product_id?.product_code}
                              </td>
                              <td style={{ fontSize: "14px" }}>
                                <div className="d-flex flex-column w-100 h-100">
                                  <span>
                                    {item.befp_product_id?.product_name}
                                  </span>
                                  <span style={{ fontSize: "12px" }}>
                                    {item.merge_quantity > 1 && (
                                      <span className="text-muted ms-1">
                                        ({item.merge_quantity} material merged)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              {/* <td>
                                  <input
                                    type="text"
                                    pattern="\d{0,10}"
                                    maxLength={12}
                                    value={usedQuantitiesFormatted[item.id] ?? ""}
                                    placeholder="0"
                                    className="form-control form-control-sm"
                                    onChange={(e) =>
                                      handleFormattedInputChange(
                                        e,
                                        item.id,
                                        setUsedQuantities,
                                        setUsedQuantitiesFormatted
                                      )
                                    }
                                    style={{ fontSize: "14px" }}
                                  />
                                </td> */}
                              <td>
                                <input
                                  type="text"
                                  pattern="\d{0,10}"
                                  maxLength={12}
                                  value={actualWeightFormatted[item.id] ?? ""}
                                  placeholder="0"
                                  disabled={isCompleted}
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    handleFormattedInputChange(
                                      e,
                                      item.id,
                                      setActualWeight,
                                      setActualWeightFormatted
                                    )
                                  }
                                  style={{ fontSize: "14px" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  name=""
                                  id=""
                                  value={new Intl.NumberFormat("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(
                                    item.befp_sales_product_tag_id?.unit_price
                                  )}
                                  className="form-control form-control-sm border-0 inputUnitPrice"
                                  style={{
                                    background: "inherit",
                                    pointerEvents: "none",
                                    fontSize: "14px",
                                  }}
                                />
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <PaginationControls {...paginationActualProductionData} />
              </div>
            </div>

            <div className="w-100 d-flex align-items-center mt-5">
              <span>Material Used</span>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div>
              <table
                className="table table-hover table-responsive w-100"
                id="rawProductionLossTable"
                style={{ maxWidth: "100% !important" }}
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Product Code <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Product Name <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      UOM <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Weight Used (kg)<i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Cost <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Actual Weight (kg)<i className="fas fa-sort ms-1"></i>
                    </th>
                    {/* <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                    >
                      Unit Cost <i className="fas fa-sort ms-1"></i>
                    </th> */}
                  </tr>
                </thead>

                <tbody>
                  {paginationRawMaterialData.loading ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : paginationRawMaterialData.error ? (
                    <tr>
                      <td colSpan="6" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : paginationRawMaterialData.data.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginationRawMaterialData.data.map((item, index) => {
                      // const tag = item.resolved_product_tag || {};
                      const product = item?.befmu_product_id || {};
                      const uom = item?.befmu_product_id?.prod_packaging;
                      const uomString = `${uom.packaging_name} - (${uom.unit_quantity}${uom.unit})`;

                      const costAmount = item?.cost_amount || {};

                      return (
                        <tr
                          key={index}
                          className="paginationProductionLossTableRowRow"
                        >
                          <td
                            className="text-center"
                            style={{ fontSize: "15px" }}
                          >
                            {product.product_code || "-"}
                          </td>
                          <td
                            className="text-center"
                            style={{ fontSize: "15px" }}
                          >
                            {product.product_name || "-"}
                          </td>
                          <td
                            className="text-center"
                            style={{ fontSize: "15px" }}
                          >
                            {uomString || "-"}
                          </td>
                          <td className="text-center">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.target_weight ?? 0)}
                          </td>
                          <td
                            className="text-center"
                            style={{ fontSize: "15px" }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(costAmount)}
                          </td>
                          <td className="text-center">
                            <input
                              type="text"
                              maxLength={15}
                              disabled={isCompleted}
                              value={quantitiesProducedFormatted[item.id] || ""}
                              placeholder="0"
                              className="form-control form-control-sm"
                              onChange={(e) =>
                                handleFormattedInputChange(
                                  e,
                                  item.id,
                                  setQuantitiesProduced,
                                  setQuantitiesProducedFormatted
                                )
                              }
                              style={{ fontSize: "15px" }}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <PaginationControls {...paginationRawMaterialData} />
            </div>

            {/* total summary */}
            <div className="w-100" style={{ marginTop: "3rem" }}>
              <div className="row production-loss-summary">
                <div className="col-sm-4 p-0">
                  <table className="w-100">
                    <thead>
                      <tr>
                        <th></th>
                        <th className="text-start" style={{ fontWeight: 400 }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Material Cost</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalMaterialCost)}
                          </div>
                        </td>
                      </tr>

                      {/* Batch Cost collapsible trigger */}
                      <tr
                        style={{ background: "#F0F9FF" }}
                        className="cursor-pointer"
                        onClick={() => toggleSection("batchCost")}
                      >
                        <td>Batch Cost</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-between"
                            style={{ fontWeight: 500 }}
                          >
                            {fetchCostList
                              ? fetchCostList
                                  .reduce(
                                    (sum, item) =>
                                      sum + Number(item.amount || 0),
                                    0
                                  )
                                  .toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                              : "0.00"}
                            <i
                              className={`fa-solid ${
                                openSections.includes("batchCost")
                                  ? "fa-chevron-up"
                                  : "fa-chevron-down"
                              } text-muted`}
                            ></i>
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible content */}
                      {openSections.includes("batchCost") &&
                        (fetchCostList && fetchCostList.length > 0 ? (
                          fetchCostList.map((item, index) => (
                            <tr
                              key={index}
                              style={{
                                background: "#f9f9f9",
                                transition: "all 0.3s ease",
                                animation: "slideDown 0.3s ease-out",
                              }}
                            >
                              <td
                                style={{
                                  height: "0.5rem",
                                  paddingLeft: "2rem",
                                  fontSize: "0.9rem",
                                  color: "#666",
                                }}
                              >
                                {item.name}
                              </td>
                              <td
                                style={{
                                  height: "0.5rem",
                                  fontSize: "0.9rem",
                                  color: "#666",
                                }}
                              >
                                {Number(item.amount).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr
                            style={{
                              background: "#f9f9f9",
                              transition: "all 0.3s ease",
                              animation: "slideDown 0.3s ease-out",
                            }}
                          >
                            <td
                              colSpan="2"
                              style={{
                                height: "0.5rem",
                                paddingLeft: "2rem",
                                fontSize: "0.9rem",
                                color: "#666",
                                fontStyle: "italic",
                              }}
                            >
                              No Batch Cost Records
                            </td>
                          </tr>
                        ))}

                      {/* Total Cost - This row will move down automatically */}
                      <tr
                        style={{
                          background: "#F0F9FF",
                          transition: "all 0.3s ease",
                        }}
                        className="total-cost-row"
                      >
                        <td className="text-success">Total Cost</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(
                              totalMaterialCost +
                                (fetchCostList
                                  ? fetchCostList.reduce(
                                      (sum, item) =>
                                        sum + Number(item.amount || 0),
                                      0
                                    )
                                  : 0)
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="col-sm-4"></div>
                <div className="col-sm-4 p-0">
                  <table className="w-100">
                    <thead>
                      <th></th>
                      <th className="text-start" style={{ fontWeight: 400 }}>
                        Total
                      </th>
                    </thead>
                    <tbody>
                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Weight In</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalWeightIn)}{" "}
                            (kg/s)
                          </div>
                        </td>
                      </tr>
                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Weight Out</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalWeightOut)}{" "}
                            (kg/s)
                          </div>
                        </td>
                      </tr>
                      <div className="p-2 w-100"></div>

                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Material Weight Required</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalQuantityRequired)}
                          </div>
                        </td>
                      </tr>
                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Actual Material Weight</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalQuantityUsed)}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <div className="p-2 w-100"></div>
                    <tbody>
                      {/* <tr style={{ background: "#F0F9FF" }}>
                          <td>Quantity Ordered</td>
                          <td>
                            <div
                              className="d-flex flex-row justify-content-start"
                              style={{ fontWeight: 500 }}
                            >
                              {new Intl.NumberFormat("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(totalQuantityOrdered)}
                            </div>
                          </td>
                        </tr>
                        <tr style={{ background: "#F0F9FF" }}>
                          <td>Quantity Produced</td>
                          <td>
                            <div
                              className="d-flex flex-row justify-content-start"
                              style={{ fontWeight: 500 }}
                            >
                              {new Intl.NumberFormat("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(totalQuantityProduced)}
                            </div>
                          </td>
                        </tr> */}
                      <tr style={{ background: "#F0F9FF" }}>
                        <td className="text-danger">Loss</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(
                              Math.max(0, totalWeightIn - totalWeightOut)
                            )}
                          </div>
                        </td>
                      </tr>

                      <tr style={{ background: "#F0F9FF" }}>
                        <td>Production Loss %</td>
                        <td>
                          <div
                            className="d-flex flex-row justify-content-start"
                            style={{ fontWeight: 500 }}
                          >
                            {totalWeightIn > 0
                              ? `${Math.max(
                                  0,
                                  (
                                    ((totalWeightIn - totalWeightOut) /
                                      totalWeightIn) *
                                    100
                                  ).toFixed(2)
                                )}%`
                              : "0.00%"}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-100" style={{ marginTop: "3rem" }}>
              <div className="row">
                <div className="col-sm-8"></div>
                <div className="col-sm-4 p-0 d-flex flex-row gap-2">
                  <button
                    className="btn btn-outline-secondary w-100 p-2 "
                    onClick={() => {
                      navigate(
                        `/inventory/view-batch-entry/${id}/post-production`
                      );
                      window.scrollTo(0, 0);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isCompleted}
                    className="btn btn-primary w-100 p-2 "
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Modal show={showModal} onHide={handleClose} backdrop="static">
            <Modal.Header className="border-0" closeButton>
              <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body className="">
              <div className="w-100 ">
                <h6>
                  Are you sure you want to export{" "}
                  {exportType === "pdf" ? "PDF" : "Excel"}?
                </h6>
              </div>
            </Modal.Body>
            <Modal.Footer className=" border-0 p-0 p-1">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                type="button"
                onClick={async () => {
                  if (exportType === "pdf") {
                    await exportToPDF();
                  } else if (exportType === "excel") {
                    await exportToExcel();
                  }
                  handleClose();
                }}
                disabled={isLoading}
              >
                {isLoading ? "Exporting..." : "Confirm Export"}
              </Button>
            </Modal.Footer>
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

export default ProductionLoss;
