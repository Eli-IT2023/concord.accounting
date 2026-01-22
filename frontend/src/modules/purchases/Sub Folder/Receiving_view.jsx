import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component
import { NumericFormat } from "react-number-format";

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

const Receiving_view = ({ authrztn, roleType }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  // ### formats
  const formatCurrencyInput = (value, isBlur = false) => {
    // Remove all non-digit and non-dot characters
    let numericValue = value.replace(/[^0-9.]/g, "");

    // Handle multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      numericValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Format the whole number part with commas
    if (parts[0]) {
      const wholeNumber = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      // Handle decimal part
      if (parts[1] !== undefined) {
        // On blur, ensure exactly 2 decimal places
        if (isBlur) {
          const decimalPart = parts[1].padEnd(2, "0").slice(0, 2);
          return `${wholeNumber}.${decimalPart}`;
        }
        return `${wholeNumber}.${parts[1].slice(0, 2)}`;
      }

      // On blur, add .00 if no decimal
      if (isBlur && !numericValue.includes(".")) {
        return `${wholeNumber}.00`;
      }
      return wholeNumber;
    }

    // Handle cases where user starts with decimal point
    if (numericValue.startsWith(".")) {
      const decimalPart = numericValue.slice(1).replace(/[^0-9]/g, "");
      return `0.${decimalPart.slice(0, 2)}`;
    }

    return numericValue;
  };

  // ### format end

  //   fetch data
  const [fetchPO, setFetchPO] = useState(null);
  const [fetchReceiving, setFetchReceiving] = useState(null);

  useEffect(() => {
    if (id) {
      // Ensure id exists before making API calls
      fetchPOData();
      fetchReceivingData();
    }
  }, [id]);

  const fetchReceivingData = async () => {
    try {
      if (!id) {
        console.warn("No ID provided for fetchReceivingData");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchReceivingData/${id}`
      );
      if (response.data.success) {
        setFetchReceiving(response.data.data);
      } else {
        console.warn("Failed to fetch receiving data:", response.data.message);
        // Don't show error for 404 - it might be expected
        if (response.status !== 404) {
          swal(
            "Error",
            response.data.message || "Failed to fetch purchase request",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // Only show error for non-404 responses
      if (error.response?.status !== 404) {
        swal("Error", "Failed to fetch purchase request details", "error");
      }
    }
  };

  const fetchPOData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/Receiving/fetchPO/${id}`);
      if (response.data.success) {
        setFetchPO(response.data.data);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error"
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
    }
  };

  const receivingStatus = fetchReceiving?.status;
  const isForReceiving = receivingStatus === "For-Receiving";
  const isReceivingClosed = fetchReceiving?.isClosed;
  // console.log(isReceivingClosed, "IS RECEIVING");

  const vendor = fetchPO?.po_vendor;
  const vendorName =
    vendor?.fname && vendor?.lname
      ? `${vendor.fname} ${vendor.lname}`
      : vendor?.company_name || "N/A";

  const requestor = fetchPO?.po_pr_id?.requestor;
  const requestorName =
    requestor?.fname && requestor?.lname
      ? `${requestor.fname} ${requestor.lname}`
      : "N/A";

  const approver = fetchPO?.po_approver;
  const approverName =
    approver?.fname && approver?.lname
      ? `${approver.fname} ${approver.lname}`
      : "N/A";

  const formattedDate = fetchPO?.po_pr_id?.date_needed
    ? new Date(fetchPO?.po_pr_id?.date_needed).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "N/A";

  // fetch data end

  // fetch products

  // ##### table #####
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [receivedLOT, setReceivedLOT] = useState({});

  const [expiryDates, setExpiryDates] = useState({});

  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/Receiving/fetchPOList/${id}`
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // Add this useEffect to initialize rejectedQuantities with existing data
  // useEffect(() => {
  //   if (pagination.data && pagination.data.length > 0) {
  //     const initialRejectedQuantities = {};
  //     pagination.data.forEach((item) => {
  //       if (item.rejected_quantity) {
  //         initialRejectedQuantities[item.id] = parseFloat(
  //           item.rejected_quantity
  //         );
  //       }
  //     });
  //     setRejectedQuantities(initialRejectedQuantities);
  //   }
  // }, [pagination.data]);

  // ##### table end #####

  // ### received status
  const [dutyCustom, setDutyCustom] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showRejectProductsModal, setShowRejectProductsModal] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  const [validationErrors, setValidationErrors] = useState({
    quantities: {},
    dates: {},
    lots: {},
  });

  // Complete handleSubmit function with LOT validation
  const handleSubmit = () => {
    // Check if any LOT validation is in progress
    const isAnyLOTChecking = Object.values(isCheckingLOT).some(
      (checking) => checking
    );
    if (isAnyLOTChecking) {
      swal({
        title: "Please Wait",
        text: "LOT validation is still in progress. Please wait a moment.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    // Check if any LOT has validation errors
    const hasLOTErrors = Object.values(lotValidation).some(
      (validation) => validation?.isValid === false
    );
    if (hasLOTErrors) {
      swal({
        title: "Invalid LOT Numbers",
        text: "Please fix the duplicate LOT numbers before submitting.",
        icon: "error",
        button: "OK",
      });
      return;
    }

    // Validate quantities, dates, and LOT based on the new logic
    const newQuantityErrors = {};
    const newDateErrors = {};
    const newLotErrors = {};
    let isValid = true;
    let hasExceededQuantity = false;
    let validationMessages = [];

    pagination.data.forEach((item) => {
      const receivedQty =
        parseFloat(receivedQuantities[item.id]?.replace(/,/g, "") || 0) /
        parseFloat(item.unit_quantity || 1);

      const totalReceived = parseFloat(item.total_received || 0);
      const orderedQty = parseFloat(item.quantity || 0);

      const combinedQty = totalReceived + receivedQty;

      // Check if item is already fully received
      if (totalReceived >= orderedQty) {
        newQuantityErrors[item.id] = "disabled";
        newDateErrors[item.id] = "disabled";
        newLotErrors[item.id] = "disabled";
      } else {
        // Check if at least one field has data
        const hasWeightData =
          receivedQuantities[item.id] &&
          receivedQuantities[item.id].trim() !== "";
        const hasExpiryData =
          expiryDates[item.id] && expiryDates[item.id].trim() !== "";
        const hasLOTData =
          receivedLOT[item.id] && receivedLOT[item.id].trim() !== "";

        // Check if any field has data
        if (hasWeightData || hasExpiryData || hasLOTData) {
          // Track missing fields for this product
          const missingFields = [];

          // If weight is entered, require best before and LOT
          if (hasWeightData) {
            if (!hasExpiryData) {
              newDateErrors[item.id] = true;
              missingFields.push("best before");
            }
            if (!hasLOTData) {
              newLotErrors[item.id] = true;
              missingFields.push("LOT number");
            }
          }

          // If LOT is entered, require weight and best before
          if (hasLOTData) {
            if (!hasWeightData) {
              newQuantityErrors[item.id] = true;
              missingFields.push("weight delivered");
            }
            if (!hasExpiryData) {
              newDateErrors[item.id] = true;
              missingFields.push("best before");
            }
          }

          // If there are missing fields for this product, add to validation messages
          if (missingFields.length > 0) {
            isValid = false;
            validationMessages.push({
              productName:
                item.po_vendor_product_id?.product_name || "Unknown Product",
              missingFields: missingFields,
            });
          }
        }

        // Check if LOT has validation errors (duplicate check)
        if (hasLOTData && lotValidation[item.id]?.isValid === false) {
          newLotErrors[item.id] = true;
          isValid = false;
          validationMessages.push({
            productName:
              item.po_vendor_product_id?.product_name || "Unknown Product",
            missingFields: ["valid LOT number (duplicate detected)"],
          });
        }

        // Check if combined quantity exceeds ordered quantity
        if (hasWeightData && combinedQty > orderedQty) {
          hasExceededQuantity = true;
          newQuantityErrors[item.id] = true;
          isValid = false;
        }
      }
    });

    // Update validation errors state
    setValidationErrors({
      quantities: newQuantityErrors,
      dates: newDateErrors,
      lots: newLotErrors, // Add LOT errors to state
    });

    // Show appropriate error messages
    if (!isValid) {
      if (hasExceededQuantity) {
        swal({
          title: "Quantity Exceeded",
          text: "The combined received quantity exceeds the ordered quantity for some items",
          icon: "warning",
        });
      } else if (validationMessages.length > 0) {
        // Format validation messages for display
        const errorMessage = validationMessages
          .map((msg) => {
            const fields = msg.missingFields.join(", ");
            return `• ${msg.productName}: ${fields}`;
          })
          .join("\n");

        swal({
          title: "Missing Required Fields",
          text: `Please fill in the following required fields.`,
          icon: "warning",
          button: "OK",
        });
      } else {
        swal(
          "Fill All Required Fields",
          "Please fill all required fields when entering data in any field",
          "warning"
        );
      }
      return;
    }

    // Prepare the data structure with LOT validation
    const data = {
      po_id: id,
      userLoggedID: userLoggedID,
      duty_custom: parseFloat(dutyCustom.replace(/,/g, "") || 0),
      shipping_fee: parseFloat(shippingFee.replace(/,/g, "") || 0),
      receivedBy: userLoggedID,
      product_list: pagination.data
        .map((item) => {
          const existingRejected = parseFloat(item.rejected_quantity || 0);
          const newRejected = parseFloat(rejectedQuantities[item.id] || 0);
          const totalRejected = existingRejected + newRejected;
          const remarks = rejectedRemarks[item.id] || "";
          const lot = receivedLOT[item.id] || "";
          const weightReceived = parseFloat(
            receivedQuantities[item.id]?.replace(/,/g, "") || 0
          );

          // Only include products that have data in at least one field
          const hasWeightData = weightReceived > 0;
          const hasExpiryData =
            expiryDates[item.id] && expiryDates[item.id].trim() !== "";
          const hasLOTData = lot && lot.trim() !== "";

          if (!hasWeightData && !hasExpiryData && !hasLOTData) {
            // Skip this product if no data is entered
            return null;
          }

          // Final LOT validation check before submission
          if (lot && lotValidation[item.id]?.isValid === false) {
            swal({
              title: "Invalid LOT",
              text: `Product "${item.po_vendor_product_id?.product_name}" has an invalid LOT number. Please fix it before submitting.`,
              icon: "error",
              button: "OK",
            });
            throw new Error(`Invalid LOT for product ${item.id}`);
          }

          return {
            id: item.id,
            ordered_quantity: parseFloat(item.quantity || 0),
            total_received: parseFloat(item.total_received || 0),
            quantity_received: weightReceived,
            new_rejected_quantity: newRejected,
            existing_rejected_quantity: existingRejected,
            rejected_quantity: totalRejected,
            expiry_date: expiryDates[item.id] || "",
            lot: lot,
            remarks: remarks,
            unit_quantity: item.unit_quantity || 1,
          };
        })
        .filter((product) => product !== null), // Filter out null products
    };

    // Check if there are any products to submit
    if (data.product_list.length === 0) {
      swal({
        title: "No Data to Submit",
        text: "Please enter data for at least one product",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    setSubmissionData(data);
    setShowConfirmationModal(true);
  };
  // Complete handleConfirmSubmit function
  const handleConfirmSubmit = async () => {
    try {
      if (!submissionData) {
        swal({
          title: "Error",
          text: "No submission data found. Please try again.",
          icon: "error",
          button: "OK",
        });
        return;
      }

      // Double-check LOT validations before final submission
      const hasInvalidLOT = submissionData.product_list.some((product) => {
        const lot = receivedLOT[product.id];
        return lot && lotValidation[product.id]?.isValid === false;
      });

      if (hasInvalidLOT) {
        swal({
          title: "Invalid LOT Numbers",
          text: "Some products have invalid LOT numbers. Please fix them before submitting.",
          icon: "error",
          button: "OK",
        });
        return;
      }

      // Prepare data with LOT included
      const dataWithLOT = {
        ...submissionData,
        product_list: submissionData.product_list.map((product) => ({
          ...product,
          lot: receivedLOT[product.id] || "",
        })),
      };

      console.log("Submitting data:", dataWithLOT);

      const response = await axios.post(
        `${BASE_URL}/Receiving/updateReceive`,
        dataWithLOT
      );

      if (response.data.success) {
        swal({
          title: "Success!",
          text: "Receiving updated successfully",
          icon: "success",
          button: false,
          timer: 2500,
        }).then(() => {
          // Reset all states
          fetchPOData();
          fetchReceivingData();
          fetchReceivedData();
          setPaginationUrl(
            `${BASE_URL}/Receiving/fetchPOList/${id}?t=${Date.now()}`
          );
          pagination.refreshData();
          setReceivedQuantities({});
          setRejectedQuantities({});
          setRejectedRows([
            {
              id: 1,
              productId: "",
              productCode: "",
              productName: "",
              quantity: "",
              remarks: "",
              isProductSelected: false,
            },
          ]);
          setExpiryDates({});
          setReceivedLOT({});
          setLotValidation({});
          setIsCheckingLOT({});
          setDutyCustom("");
          setShippingFee("");
          setShowConfirmationModal(false);
          setSubmissionData(null);
        });
      } else {
        throw new Error(
          response.data.message || "Failed to update receiving data"
        );
      }
    } catch (error) {
      console.error("Submission error:", error);

      // Handle specific LOT validation errors
      if (error.message.includes("Invalid LOT for product")) {
        swal({
          title: "Invalid LOT",
          text: "One or more products have duplicate LOT numbers. Please fix them and try again.",
          icon: "error",
          button: "OK",
        });
        return;
      }

      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = Object.values(error.response.data.errors)
          .map((err) => err.message)
          .join("\n\n");

        swal({
          title: "Fields are required!",
          text: errorMessages,
          icon: "warning",
          buttons: {
            confirm: {
              text: "OK",
              value: true,
              visible: true,
              closeModal: true,
            },
          },
        });
      } else {
        swal({
          title: "Error",
          text: error.message || "Failed to submit receiving data",
          icon: "error",
          buttons: {
            confirm: {
              text: "OK",
              value: true,
              visible: true,
              closeModal: true,
            },
          },
        });
      }
    } finally {
      // Don't close modal here, only on success
      // setShowConfirmationModal(false);
    }
  };

  // ### received status end

  // ### received history
  const [fetchReceivedHistory, setFetchReceivedHistory] = useState(null);

  // UseEffect triggers when fetchPO changes
  useEffect(() => {
    if (fetchPO?.receiving_po_id?.id) {
      fetchReceivedData(fetchPO.receiving_po_id.id);
    }
  }, [fetchPO]);

  const fetchReceivedData = async (receivingId) => {
    console.log(receivingId);
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchPOReportCard/${receivingId}`
      );
      if (response.data.success) {
        setFetchReceivedHistory(response.data.data);
      } else {
        // swal(
        //   "Error",
        //   response.data.message || "Failed to fetch received history",
        //   "error"
        // );
        console.log("No History Yet");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // swal("Error", "Failed to fetch received historys", "error");
    }
  };

  // Add this state for rejected rows
  const [rejectedRows, setRejectedRows] = useState([
    {
      id: 1,
      productId: "",
      productCode: "",
      productName: "",
      quantity: "",
      remarks: "",
      isProductSelected: false,
    },
  ]);

  const [rejectedQuantities, setRejectedQuantities] = useState({});
  const [rejectedRemarks, setRejectedRemarks] = useState({}); // Add this for remarks

  // Function to add a new rejected row
  const addNewRejectedRow = () => {
    if (pagination.data.length === rejectedRows.length) {
      swal({
        title: "Warning!",
        text: "Rows are enough for the amount of ordered items!",
        icon: "warning",
        button: false,
        timer: 1250,
      });

      return;
    }

    const newId =
      rejectedRows.length > 0
        ? Math.max(...rejectedRows.map((row) => row.id)) + 1
        : 1;
    setRejectedRows([
      ...rejectedRows,
      {
        id: newId,
        productId: "",
        productCode: "",
        productName: "",
        quantity: "",
        remarks: "",
        isProductSelected: false,
      },
    ]);
  };

  // Function to delete a rejected row
  const deleteRejectedRow = (id) => {
    if (rejectedRows.length <= 1) {
      swal("Warning", "You must have at least one item", "warning");
      return;
    }
    setRejectedRows(rejectedRows.filter((row) => row.id !== id));
  };

  // Handle rejected product selection change
  const handleRejectedProductChange = (id, productId) => {
    const selectedProduct = pagination.data.find(
      (product) => product.id === productId
    );

    setRejectedRows(
      rejectedRows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            productId: productId,
            productCode:
              selectedProduct?.po_vendor_product_id?.product_code || "",
            productName:
              selectedProduct?.po_vendor_product_id?.product_name || "",
            isProductSelected: !!selectedProduct,
          };
        }
        return row;
      })
    );
  };

  // Handle rejected quantity change
  const handleRejectedQuantityChange = (id, quantity) => {
    // quantity will be a number (float) from NumericFormat, or undefined if empty
    const numericValue = quantity !== undefined ? quantity : 0;

    setRejectedRows(
      rejectedRows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            quantity: numericValue, // Store as number directly
          };
        }
        return row;
      })
    );
  };
  // Handle rejected input change for remarks
  const handleRejectedInputChange = (id, field, value) => {
    setRejectedRows(
      rejectedRows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            [field]: value,
          };
        }
        return row;
      })
    );
  };

  // Filter available products for rejected rows
  const getAvailableProducts = (currentRowId) => {
    // Get all product IDs that are selected in other rows
    const selectedProductIds = rejectedRows
      .filter((row) => row.id !== currentRowId && row.productId)
      .map((row) => row.productId);

    // Filter out products that are already selected in other rows
    return pagination.data.filter(
      (product) => !selectedProductIds.includes(product.id)
    );
  };

  // Handle reject submit
  const handleRejectSubmit = () => {
    // Validate the form
    let hasErrors = false;
    let hasExceededQuantity = false;
    const rejectedProductsWithRemarks = {};

    rejectedRows.forEach((row) => {
      if (row.isProductSelected) {
        // Check if quantity is filled
        if (!row.quantity || parseFloat(row.quantity) <= 0) {
          hasErrors = true;
          return;
        }

        // Get the product to check remaining quantity and unit_quantity
        const product = pagination.data.find((p) => p.id === row.productId);
        const totalReceived = parseFloat(product?.total_received || 0);
        const orderedQty = parseFloat(product?.quantity || 0);
        const unitQuantity = parseFloat(product?.unit_quantity || 1);

        // Convert weight to quantity for validation
        const rejectedWeight = parseFloat(row.quantity);
        const rejectedQuantity = rejectedWeight / unitQuantity;

        const remaining = orderedQty - totalReceived;

        // Check if rejected quantity exceeds remaining quantity
        if (rejectedQuantity > remaining) {
          hasExceededQuantity = true;
          return;
        }

        // Store the converted quantity (not weight) for backend
        rejectedProductsWithRemarks[row.productId] = {
          quantity: rejectedQuantity, // Store as quantity (weight / unit_quantity)
          weight: rejectedWeight, // Keep the original weight for reference if needed
          remarks: row.remarks || "",
          unit_quantity: unitQuantity, // Include unit_quantity for reference
        };
      }
    });

    if (hasErrors) {
      swal(
        "Error",
        "Please fill all required fields with valid values",
        "error"
      );
      return;
    }

    if (hasExceededQuantity) {
      swal({
        title: "Warning!",
        text: "Products cannot be rejected if there is no remaining quantity or if the rejection exceeds the available amount.",
        icon: "warning",
      });
      return;
    }

    const newRejectedQuantities = { ...rejectedQuantities };
    const newRejectedRemarks = { ...rejectedRemarks };

    console.log(rejectedProductsWithRemarks, "Rejected Products Data");

    Object.entries(rejectedProductsWithRemarks).forEach(([productId, data]) => {
      // Store the converted quantity for backend processing
      newRejectedQuantities[productId] = data.quantity;
      newRejectedRemarks[productId] = data.remarks; // Store remarks
    });

    setRejectedQuantities(newRejectedQuantities);
    setRejectedRemarks(newRejectedRemarks);
    setShowRejectProductsModal(false);
  };

  const handleCloseRejectModal = () => {
    setShowRejectProductsModal(false);
    setRejectedQuantities({});
    setRejectedRemarks({}); // Reset remarks too
    setRejectedRows([
      {
        id: 1,
        productId: "",
        productCode: "",
        productName: "",
        quantity: "",
        remarks: "",
        isProductSelected: false,
      },
    ]);
  };

  const [showRejectProductsHistory, setShowRejectProductsHistory] =
    useState(false);

  const [rejectedProductHistoryData, setRejectedProductHistoryData] = useState(
    []
  );

  const [selectedRejectedHistory, setSelectedRejectedHistory] = useState({});

  const handleShowHistory = (
    totalRejectedQuantity = 0,
    productName,
    poVendorProductID
  ) => {
    // Fetch the price history
    fetchRejectedProductHistory(poVendorProductID); // id is from useParams()
    setSelectedRejectedHistory({
      productName,
      totalRejectedQuantity,
    });
    setShowRejectProductsHistory(true);
  };

  const fetchRejectedProductHistory = (poVendorProductID) => {
    axios
      .get(BASE_URL + "/Receiving/getRejectedProductHistory", {
        params: {
          po_vendor_prod_id: poVendorProductID,
        },
      })
      .then((res) => {
        if (res.data) {
          setRejectedProductHistoryData(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching vendors history:", error);
      });
  };

  const handleCloseHistory = () => {
    setShowRejectProductsHistory(false);
  };

  const [closeModal, setCloseModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [closeRemarks, setCloseRemarks] = useState("");

  const handleCloseModal = () => {
    setCloseModal(false);
    setCloseRemarks("");
    setIsCancelling(false);
  };

  const handleCancelReceiving = async (e) => {
    e.preventDefault();
    setIsCancelling(true);

    try {
      const isClosed = true;
      const response = await axios.put(
        `${BASE_URL}/Receiving/cancelReceiving/${id}`,
        { userLoggedID, closeRemarks, isClosed, status: receivingStatus }
      );

      if (response.data.success) {
        swal({
          title: "Cancelled!",
          text: response.data.message,
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          handleCloseModal(); // Close the modal
          navigate("/purchases/receiving");
        });
      } else {
        // This will handle cases where success is false
        swal({
          title: "Failed to cancel!",
          text: response.data.message,
          icon: "warning",
          buttons: "true",
        }).then(() => {
          handleCloseModal(); // Close the modal
        });
      }
    } catch (error) {
      console.log(id, "ID PO");
      console.error("Decline error:", error);

      if (error.response && error.response.status === 201) {
        // Handle the case where status is 400 but success is false
        swal({
          title: "Cannot Cancel",
          text: "Purchase Order is already received",
          icon: "warning",
          buttons: false,
          timer: 2000,
        });
      } else {
        // Other errors
        swal(
          "Failed to cancel!",
          error.response?.data?.message || "Failed to cancel Purchase Order",
          "warning"
        );
      }
    } finally {
      setCloseModal(false);
      setIsCancelling(false);
      setCloseRemarks("");
    }
  };

  // validation for LOT duplicate onchange
  // Add state for LOT validation
  const [lotValidation, setLotValidation] = useState({});
  const [lotDebounceTimers, setLotDebounceTimers] = useState({});
  const [isCheckingLOT, setIsCheckingLOT] = useState({});

  // Add validation function for LOT
  const validateLOTNumber = async (productId, lotValue) => {
    if (!lotValue || lotValue.trim() === "") {
      // Reset validation if empty
      setLotValidation((prev) => ({
        ...prev,
        [productId]: { isValid: true, message: "", isChecking: false },
      }));
      setIsCheckingLOT((prev) => ({ ...prev, [productId]: false }));
      return;
    }

    // Set checking state
    setLotValidation((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], isChecking: true },
    }));
    setIsCheckingLOT((prev) => ({ ...prev, [productId]: true }));

    try {
      const response = await axios.get(`${BASE_URL}/Receiving/validateLot`, {
        params: {
          lot: lotValue,
          productId: productId,
          receivingId: id,
        },
      });

      if (response.data.exists) {
        setLotValidation((prev) => ({
          ...prev,
          [productId]: {
            isValid: false,
            message: response.data.message,
            isChecking: false,
          },
        }));

        // Show swal alert
        swal({
          title: "Duplicate LOT Number",
          text: response.data.message,
          icon: "error",
          button: "OK",
        }).then(() => {
          // Clear the LOT input field
          setReceivedLOT((prev) => ({
            ...prev,
            [productId]: "",
          }));
        });
      } else {
        setLotValidation((prev) => ({
          ...prev,
          [productId]: {
            isValid: true,
            message: "",
            isChecking: false,
          },
        }));
      }
    } catch (error) {
      console.error("LOT validation error:", error);
      setLotValidation((prev) => ({
        ...prev,
        [productId]: {
          isValid: true,
          message: "Error checking LOT. Please try again.",
          isChecking: false,
        },
      }));
    } finally {
      setIsCheckingLOT((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Debounced LOT change handler
  const handleLOTChange = (productId, value) => {
    // Clear existing timer for this product
    if (lotDebounceTimers[productId]) {
      clearTimeout(lotDebounceTimers[productId]);
    }

    // Update the LOT value immediately
    setReceivedLOT((prev) => ({
      ...prev,
      [productId]: value,
    }));

    // Set new timer for debounce
    const timer = setTimeout(() => {
      validateLOTNumber(productId, value);
    }, 800); // 800ms debounce

    // Store the timer reference
    setLotDebounceTimers((prev) => ({
      ...prev,
      [productId]: timer,
    }));
  };

  // Cleanup timers on component unmount
  // Add this to your existing useEffect for cleanup
  useEffect(() => {
    return () => {
      // Clear all LOT validation timers
      Object.values(lotDebounceTimers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      // Clear validation states
      setLotValidation({});
      setIsCheckingLOT({});
    };
  }, []);

  // Add this function to clear validation errors
  const clearValidationError = (field, itemId) => {
    setValidationErrors((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [itemId]: false,
      },
    }));
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/receiving")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">RECEIVING</span>
          </span>
        </div>

        <div className="">
          <button
            onClick={() => setCloseModal(true)}
            className="btn btn-outline-danger d-flex align-items-center justify-content-center title-button"
            disabled={
              fetchPO?.receiving_po_id?.status === "Received" ||
              Object.values(isCheckingLOT).some((checking) => checking)
            }
          >
            <i className="bx bx-x fs-5"></i>{" "}
            <span>{isForReceiving ? "Cancel" : "Close"} Order</span>
          </button>
        </div>
      </div>
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-sm">
            <label htmlFor="">Purchase Order ID</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={fetchPO?.po_number}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Vendor</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={vendorName}
            />
          </div>
        </div>
        <div className="row ">
          <div className="col-sm">
            <label htmlFor="">Approver</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={approverName}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Requestor</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={requestorName}
            />
          </div>
        </div>
        <div className="row ">
          <div className="col-sm">
            <label htmlFor="">Remarks</label>
            <textarea
              name=""
              id=""
              cols="5"
              rows="5"
              className="form-control mb-2"
              readOnly
              value={fetchPO?.po_pr_id?.remarks}
            ></textarea>
          </div>
          <div className="col-sm">
            <label htmlFor="">Date Needed</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={formattedDate}
            />
          </div>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Receiving Information</span>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="row p-2">
          <div className="col-sm">
            <label htmlFor="">Duty & Customs</label>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="0.00"
              value={dutyCustom}
              onChange={(e) => {
                const formattedValue = formatCurrencyInput(e.target.value);
                setDutyCustom(formattedValue);
              }}
              onBlur={(e) => {
                const formattedValue = formatCurrencyInput(
                  e.target.value,
                  true
                );
                setDutyCustom(formattedValue);
              }}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Shipping Fee</label>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="0.00"
              value={shippingFee}
              onChange={(e) => {
                const formattedValue = formatCurrencyInput(e.target.value);
                setShippingFee(formattedValue);
              }}
              onBlur={(e) => {
                const formattedValue = formatCurrencyInput(
                  e.target.value,
                  true
                );
                setShippingFee(formattedValue);
              }}
            />
          </div>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Order Items</span>
          <hr className="flex-grow-1 mx-4" />
          <Button
            variant="danger"
            style={{ padding: "0.25rem 2.5rem" }}
            onClick={() => setShowRejectProductsModal(true)}
          >
            Reject Products
          </Button>
        </div>

        <div className="table-responsive data-table scrollable-contents mt-3">
          <table
            className="table table-hover table-responsive"
            id="receivingPOListTable"
          >
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  PRODUCT ID <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  ITEM <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  UOM <i className="fas fa-sort ms-1"></i>
                </th>

                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  WEIGHT TO RECEIVE <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  ACCEPTED PRODUCTS <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  REJECTED PRODUCTS <i className="fas fa-sort ms-1"></i>
                </th>

                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  TOTAL RECEIVED <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  REMAINING <i className="fas fa-sort ms-1"></i>
                </th>

                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  WEIGHT DELIVERED <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",

                    fontSize: "12px",
                  }}
                >
                  BEST BEFORE <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    fontSize: "12px",
                  }}
                >
                  LOT <i className="fas fa-sort ms-1"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="10" className="text-center text-danger py-4">
                    <div className="d-flex flex-column align-items-center">
                      <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                      <span>Error loading data</span>
                      <small className="text-muted mt-1">
                        {pagination.error.message}
                      </small>
                    </div>
                  </td>
                </tr>
              ) : pagination.data.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <div className="d-flex flex-column align-items-center">
                      <i className="fas fa-database fs-4 mb-2 text-muted"></i>
                      <span>No data available</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.data.map((item) => {
                  const quantityReceived = receivedQuantities[item.id] || "";
                  const expiryDate = expiryDates[item.id] || "";
                  const rejectedQuantity = rejectedQuantities[item.id] || 0;

                  const totalReceived = parseFloat(item.total_received || 0);
                  const orderedQty = parseFloat(item.quantity || 0);
                  const isCompleted = totalReceived >= orderedQty;

                  // Calculate remaining by subtracting both total received and rejected quantity from ordered
                  // This shows how much more can be received (both accepted and rejected)
                  // const existingRejected = parseFloat(
                  //   item.rejected_quantity || 0
                  // );
                  // const newRejected = parseFloat(
                  //   rejectedQuantities[item.id] || 0
                  // );

                  // const totalRejected = existingRejected + newRejected;

                  // const remaining = orderedQty - totalReceived - totalRejected;

                  // di na need iminus total rejected, kasi na add sa backend
                  // console.log(
                  //   "this is the product_code ",
                  //   item.po_vendor_product_id?.product_code
                  // );
                  // console.log(
                  //   "this is the product_name ",
                  //   item.po_vendor_product_id?.product_name
                  // );
                  // console.log("this is the orderedQTY ", orderedQty);
                  // console.log("this is the totalReceived ", totalReceived);
                  // console.log("###########################################");
                  const remaining = orderedQty - totalReceived;

                  const uomString = `${item.po_vendor_product_id?.prod_packaging?.packaging_name} - (${item.po_vendor_product_id?.prod_packaging?.unit_quantity}${item.po_vendor_product_id?.prod_packaging?.unit})`;

                  const existingRejected = parseFloat(
                    item.rejected_quantity || 0
                  );
                  const newRejected = parseFloat(
                    rejectedQuantities[item.id] || 0
                  );
                  const totalRejected = existingRejected + newRejected;

                  const unitQuantity = item.unit_quantity || 1;
                  // return totalRejected > 0
                  //   ? Number(totalRejected).toLocaleString("en-US")
                  //   : "0";
                  return (
                    <tr key={item.id}>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {item.po_vendor_product_id?.product_code || "-"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {item.po_vendor_product_id?.product_name || "-"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {uomString || "-"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {item.quantity !== undefined && item.quantity !== null
                          ? Number(item.quantity * unitQuantity).toLocaleString(
                              "en-US"
                            )
                          : "0"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {item.total_received !== undefined &&
                        item.total_received !== null
                          ? Number(
                              item.total_received * unitQuantity -
                                existingRejected * unitQuantity
                            ).toLocaleString("en-US")
                          : "0"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        <div className="w-100 d-flex flex-column justify-content-center align-items-center">
                          <div className="w-100 d-flex align-items-center justify-content-center">
                            <div
                              style={
                                existingRejected !== totalRejected
                                  ? {
                                      fontWeight: "bolder",
                                      textDecoration: "underline",
                                    }
                                  : {
                                      fontWeight: "normal",
                                      textDecoration: "none",
                                    }
                              }
                            >
                              {(totalRejected * unitQuantity).toLocaleString(
                                "en-US"
                              )}
                            </div>
                            <i
                              className="fa-solid fa-circle-info ms-2"
                              onClick={() =>
                                handleShowHistory(
                                  totalRejected * unitQuantity, // Multiply by unitQuantity here
                                  item.po_vendor_product_id?.product_name,
                                  item.id
                                )
                              }
                              style={{
                                cursor: "pointer",
                                color: "#3590ae",
                                fontSize: "1.125rem",
                              }}
                            ></i>
                          </div>
                          {existingRejected !== totalRejected && (
                            <span
                              style={{
                                textAlign: "center",
                                fontSize: "11px",
                                color: "red",
                                fontStyle: "italic",
                                fontWeight: "500",
                              }}
                            >
                              +{" "}
                              {(
                                (totalRejected - existingRejected) *
                                unitQuantity
                              ) // Multiply the difference by unitQuantity
                                .toLocaleString("en-US")}{" "}
                              Rejected
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {item.total_received !== undefined &&
                        item.total_received !== null
                          ? Number(
                              item.total_received * unitQuantity
                            ).toLocaleString("en-US")
                          : "0"}
                      </td>
                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {remaining !== undefined && remaining !== null
                          ? Number(remaining * unitQuantity).toLocaleString(
                              "en-US"
                            )
                          : "0"}
                      </td>

                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        <input
                          type="text"
                          className={`form-control form-control-sm ${
                            validationErrors.quantities[item.id] === true
                              ? isCompleted
                                ? ""
                                : "is-invalid"
                              : ""
                          }`}
                          value={receivedQuantities[item.id] || ""}
                          onChange={(e) => {
                            if (isCompleted) return;

                            let value = e.target.value.replace(/[^0-9.]/g, "");

                            // Clear quantity error when user starts typing
                            if (validationErrors.quantities[item.id]) {
                              clearValidationError("quantities", item.id);
                            }

                            const parts = value.split(".");
                            if (parts.length > 2) {
                              value = parts[0] + "." + parts.slice(1).join("");
                            }

                            // 🔹 Convert input quantity → weight via unit_quantity
                            const numericValue =
                              (parseFloat(value.replace(/,/g, "")) || 0) /
                              parseFloat(item.unit_quantity || 1);

                            // 🔹 Calculate remaining quantity (still in quantity units)
                            const remainingQty = orderedQty - totalReceived;

                            // 🔹 Validation: prevent exceeding remaining quantity
                            if (numericValue > remainingQty) {
                              const maxAllowed =
                                remainingQty * (item.unit_quantity || 1);
                              swal({
                                title: "Weight Exceeded",
                                text: `You can only receive up to ${maxAllowed.toLocaleString(
                                  "en-US"
                                )} more ${
                                  item.unit_name || "units"
                                } for this item.`,
                                icon: "warning",
                              }).then(() => {
                                const formatted = (
                                  remainingQty * (item.unit_quantity || 1)
                                ).toLocaleString("en-US");
                                setReceivedQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: formatted,
                                }));
                              });
                              return;
                            }

                            // 🔹 Format input nicely (with commas and decimals preserved)
                            let formattedValue = value;
                            if (parts.length > 1) {
                              const integerPart = parts[0].replace(
                                /^0+(?=\d)/,
                                ""
                              );
                              const decimalPart = parts[1];
                              formattedValue = `${Number(
                                integerPart
                              ).toLocaleString("en-US")}.${decimalPart}`;
                            } else if (value) {
                              formattedValue =
                                Number(value).toLocaleString("en-US");
                            }

                            setReceivedQuantities((prev) => ({
                              ...prev,
                              [item.id]: formattedValue,
                            }));
                          }}
                          onFocus={(e) => {
                            if (isCompleted) return;
                            const raw = e.target.value.replace(/,/g, "");
                            setReceivedQuantities((prev) => ({
                              ...prev,
                              [item.id]: raw,
                            }));
                          }}
                          onBlur={(e) => {
                            if (isCompleted) return;
                            const raw = e.target.value.replace(/,/g, "");
                            const parts = raw.split(".");
                            if (!isNaN(parseFloat(raw))) {
                              const formatted =
                                parts.length > 1
                                  ? `${Number(parts[0]).toLocaleString(
                                      "en-US"
                                    )}.${parts[1]}`
                                  : Number(raw).toLocaleString("en-US");
                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [item.id]: formatted,
                              }));
                            }
                          }}
                          disabled={
                            isCompleted ||
                            validationErrors.quantities[item.id] === "disabled"
                          }
                        />
                      </td>

                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        <input
                          type="date"
                          className={`form-control form-control-sm ${
                            validationErrors.dates[item.id] === true
                              ? isCompleted
                                ? ""
                                : "is-invalid"
                              : ""
                          }`}
                          value={expiryDates[item.id] || ""}
                          onChange={(e) => {
                            if (isCompleted) return;

                            // Clear date error when user starts typing
                            if (validationErrors.dates[item.id]) {
                              clearValidationError("dates", item.id);
                            }

                            setExpiryDates((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }));
                          }}
                          disabled={
                            isCompleted ||
                            validationErrors.dates[item.id] === "disabled"
                          }
                        />
                      </td>

                      <td
                        className="text-center"
                        style={{ fontSize: "0.9rem" }}
                      >
                        <div className="position-relative">
                          <input
                            type="text"
                            className={`form-control form-control-sm ${
                              validationErrors.lots[item.id] === true
                                ? "is-invalid"
                                : lotValidation[item.id]?.isValid === false
                                ? "is-invalid"
                                : ""
                            }`}
                            value={receivedLOT[item.id] || ""}
                            onChange={(e) => {
                              if (isCompleted) return;

                              // Clear LOT error when user starts typing
                              if (validationErrors.lots[item.id]) {
                                clearValidationError("lots", item.id);
                              }

                              handleLOTChange(item.id, e.target.value);

                              // Clear LOT validation error when user starts typing
                              if (validationErrors.lots[item.id]) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  lots: {
                                    ...prev.lots,
                                    [item.id]: false,
                                  },
                                }));
                              }
                            }}
                            disabled={
                              isCompleted ||
                              validationErrors.lots[item.id] === "disabled"
                            }
                            placeholder="Enter LOT"
                          />
                          {isCheckingLOT[item.id] && (
                            <div
                              className="position-absolute"
                              style={{
                                top: "50%",
                                right: "8px",
                                transform: "translateY(-50%)",
                              }}
                            >
                              <i
                                className="fas fa-spinner fa-spin text-muted"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </div>
                          )}
                          {lotValidation[item.id]?.isValid === false &&
                            !isCheckingLOT[item.id] && (
                              <div
                                className="position-absolute"
                                style={{
                                  top: "50%",
                                  right: "8px",
                                  transform: "translateY(-50%)",
                                }}
                              >
                                <i
                                  className="fas fa-exclamation-circle text-danger"
                                  style={{ fontSize: "0.8rem" }}
                                ></i>
                              </div>
                            )}
                          {lotValidation[item.id]?.isValid === true &&
                            receivedLOT[item.id] &&
                            !isCheckingLOT[item.id] && (
                              <div
                                className="position-absolute"
                                style={{
                                  top: "50%",
                                  right: "8px",
                                  transform: "translateY(-50%)",
                                }}
                              >
                                <i
                                  className="fas fa-check-circle text-success"
                                  style={{ fontSize: "0.8rem" }}
                                ></i>
                              </div>
                            )}
                        </div>
                        {/* {validationErrors.lots[item.id] === true && (
                          <div
                            className="invalid-feedback d-block"
                            style={{ fontSize: "0.75rem" }}
                          >
                            LOT number is required
                          </div>
                        )} */}
                        {lotValidation[item.id]?.isValid === false && (
                          <div
                            className="invalid-feedback d-block"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {lotValidation[item.id]?.message}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls {...pagination} />

        <div className="row mt-5">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm d-flex flex-row gap-3">
            <button
              className="btn btn-outline-secondary w-100"
              style={{ padding: "0.7rem 1.7rem" }}
              onClick={() => {
                navigate(`/purchases/receiving/`);
                window.scrollTo(0, 0);
              }}
            >
              Cancel
            </button>

            {authrztn?.includes("Receiving-Approve") && (
              <>
                <button
                  className="btn btn-primary w-100"
                  style={{ padding: "0.7rem 1.7rem" }}
                  onClick={handleSubmit}
                  disabled={
                    fetchPO?.receiving_po_id?.status === "Received" ||
                    Object.values(isCheckingLOT).some((checking) => checking)
                  }
                >
                  {Object.values(isCheckingLOT).some((checking) => checking)
                    ? "Validating..."
                    : "Receive"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="contriner-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Received History</span>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 row mt-3">
          {fetchReceivedHistory?.map((historyItem, index) => (
            <div
              className="col-md-6 mb-4 position-relative"
              key={historyItem.id}
            >
              <div className="card h-100 border shadow-sm">
                <div className="card-body p-0 p-3" style={{ fontSize: "13px" }}>
                  <span className="" style={{ fontSize: "16px" }}>
                    <strong>Receiving Report No : </strong>
                    {historyItem.rr_no || "N/A"}
                  </span>
                  <div className="w-100 d-flex flex-row justify-content-between mt-2">
                    <div className="d-flex flex-column">
                      <span>
                        <strong>Duty & Customs: </strong>
                        {parseFloat(
                          historyItem.duty_custom || 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span>
                        <strong>Shipping Fee: </strong>
                        {parseFloat(
                          historyItem.shipping_fee || 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="d-flex flex-column text-end">
                      <span>
                        <strong>Received By: </strong>
                        {historyItem.rh_received_by?.fname
                          ? `${historyItem.rh_received_by.fname} ${historyItem.rh_received_by.lname}`
                          : "N/A"}
                      </span>
                      <span>
                        <strong>Date Received: </strong>
                        {historyItem.createdAt
                          ? new Date(historyItem.createdAt).toLocaleDateString(
                              "en-US"
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="w-100 mt-3">
                    <table className="table">
                      <thead>
                        <tr>
                          <th
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            LOT
                          </th>
                          <th
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            PRODUCT CODE
                          </th>
                          <th
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            ITEM
                          </th>
                          <th
                            className="text-center"
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            UOM
                          </th>
                          <th
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            WEIGHT RECEIVED
                          </th>
                          <th
                            style={{ background: "#DBDFE4", color: "#29292A" }}
                          >
                            BEST BEFORE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyItem.rh_receiving_history_id?.map((product) => {
                          const uom =
                            product.rpo_vendor_product_id?.po_vendor_product_id
                              ?.prod_packaging;
                          const uomString = uom.packaging_name
                            ? `${uom.packaging_name} - (${
                                uom.unit_quantity || ""
                              }${uom.unit || ""})`
                            : "";

                          const unitQuantity =
                            product?.rpo_vendor_product_id?.unit_quantity || 1;

                          return (
                            <tr key={product.id}>
                              <td>{product.lot || "N/A"}</td>
                              <td className="text-center">
                                {product.rpo_vendor_product_id
                                  ?.po_vendor_product_id?.product_code || "N/A"}
                              </td>
                              <td>
                                {product.rpo_vendor_product_id
                                  ?.po_vendor_product_id?.product_name || "N/A"}
                              </td>
                              <td>{uomString || "N/A"}</td>
                              <td className="text-center">
                                {parseFloat(
                                  product.quantity_received * unitQuantity || 0
                                ).toLocaleString("en-US")}
                              </td>
                              <td>
                                {product.expiry_date
                                  ? new Date(
                                      product.expiry_date
                                    ).toLocaleDateString("en-US")
                                  : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        backdrop="static"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please confirm: All received items cleared quality check?</p>
          <div className="mt-3 d-none">
            <strong>Duty & Customs:</strong> {dutyCustom || "0.00"}
            <br />
            <strong>Shipping Fee:</strong> {shippingFee || "0.00"}
            <br />
            <strong>Total Items:</strong> {pagination.data.length}
          </div>
          <Modal.Footer className="p-0 border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowConfirmationModal(false)}
            >
              No
            </Button>
            <Button variant="primary" onClick={handleConfirmSubmit}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>

      {/* REJECT PRODUCTS MODAL */}
      <Modal
        size="xl"
        show={showRejectProductsModal}
        onHide={handleCloseRejectModal}
        backdrop="static"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Reject Products</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <table
              className="table table-hover table-responsive"
              id="receivingPOListModalTable"
            >
              <thead className="bg-light">
                <tr>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    PRODUCT ID
                  </th>
                  <th
                    className="text-muted text-center"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    ITEM
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    REMAINING
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    WEIGHT TO REJECT
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    REMARKS
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                  >
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {rejectedRows.map((row) => {
                  const availableProducts = getAvailableProducts(row.id);
                  const selectedProduct = pagination.data.find(
                    (product) => product.id === row.productId
                  );

                  const totalReceived = parseFloat(
                    selectedProduct?.total_received || 0
                  );
                  const orderedQty = parseFloat(selectedProduct?.quantity || 0);
                  const existingRejected = parseFloat(
                    selectedProduct?.rejected_quantity || 0
                  );
                  const newRejectedFromOtherRows = rejectedRows
                    .filter(
                      (r) =>
                        r.id !== row.id && r.productId === selectedProduct?.id
                    )
                    .reduce((sum, r) => sum + parseFloat(r.quantity || 0), 0);

                  const remaining = orderedQty - totalReceived;

                  const unitQuantity = selectedProduct?.unit_quantity || 1;
                  // existingRejected -
                  // newRejectedFromOtherRows;

                  return (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={row.productCode}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={row.productId}
                          required
                          onChange={(e) =>
                            handleRejectedProductChange(row.id, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Product
                          </option>
                          {availableProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.po_vendor_product_id?.product_name}
                            </option>
                          ))}
                          {/* Show currently selected product even if it's selected elsewhere */}
                          {row.productId &&
                            !availableProducts.some(
                              (p) => p.id === row.productId
                            ) && (
                              <option value={row.productId} disabled>
                                {
                                  selectedProduct?.po_vendor_product_id
                                    ?.product_name
                                }
                              </option>
                            )}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={
                            row.isProductSelected
                              ? (remaining * unitQuantity).toLocaleString(
                                  "en-US"
                                )
                              : "0"
                          }
                        />
                      </td>

                      <td>
                        <NumericFormat
                          type="text"
                          className="form-control"
                          placeholder="0.0"
                          value={row.quantity}
                          thousandSeparator={true}
                          allowNegative={false}
                          required
                          readOnly={!row.isProductSelected}
                          onValueChange={(values) => {
                            const rawValue = values.floatValue;
                            handleRejectedQuantityChange(row.id, rawValue);
                          }}
                          isAllowed={(values) => {
                            const { floatValue } = values;
                            return (
                              floatValue === undefined ||
                              (floatValue >= 0 && floatValue <= 9999999999)
                            );
                          }}
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control"
                          cols="1"
                          rows="1"
                          value={row.remarks}
                          readOnly={!row.isProductSelected}
                          onChange={(e) =>
                            handleRejectedInputChange(
                              row.id,
                              "remarks",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="text-center" style={{ width: "50px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteRejectedRow(row.id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={addNewRejectedRow}
            >
              New Item
            </button>
          </div>
          <Modal.Footer className="p-0 border-0 mt-3">
            <Button
              variant="outline-secondary"
              onClick={handleCloseRejectModal}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRejectSubmit}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>

      {/* REJECTED PRODUCTS HISTORY */}
      <Modal
        show={showRejectProductsHistory}
        onHide={handleCloseHistory}
        backdrop="static"
        size="lg"
      >
        <Modal.Header
          className="border-0"
          style={{
            padding: "0.75rem 1rem",
          }}
          closeButton
        >
          <Modal.Title>Rejected Product History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="w-100">
            <div className="mt-1">
              <div className="table-responsive data-table scrollable-contents">
                <div className="w-100 d-flex flex-column gap-1 justify-content-between">
                  <span>
                    <strong className="fw-semibold">Product Name: </strong>
                    {selectedRejectedHistory?.productName || ""}
                  </span>
                  <span className="mb-3">
                    <strong className="fw-semibold">
                      Total Rejected WEIGHT:{" "}
                    </strong>
                    {selectedRejectedHistory?.totalRejectedQuantity?.toLocaleString(
                      "en-US"
                    ) || "0"}
                  </span>
                </div>
                <table className="table table-hover table-responsive">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ backgroundColor: "#EBEFF4" }}>
                        <div className="text-center">Rejected Quantity</div>
                      </th>
                      <th style={{ backgroundColor: "#EBEFF4" }}>
                        <div className="text-center">Remarks</div>
                      </th>
                      <th style={{ backgroundColor: "#EBEFF4" }}>
                        <div className="text-center">Date Received</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedProductHistoryData.length > 0 ? (
                      rejectedProductHistoryData.map((history, index) => {
                        const unitQuantity =
                          history?.rrp_po_vendor_prod_id?.unit_quantity || 1;

                        return (
                          <tr key={index}>
                            <td className="text-center">
                              {parseFloat(
                                history.rejected_quantity * unitQuantity
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-center">
                              {history?.remarks || "---"}
                            </td>
                            <td className="text-center">
                              {new Date(history.createdAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )}
                              {" - "}
                              {new Date(history.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-3">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Modal.Footer className="border-0 p-0">
            <Button variant="outline-secondary" onClick={handleCloseHistory}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>

      {/* cancel modal */}
      <Modal show={closeModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>
            {isForReceiving ? "Cancellation" : "Closing"} of Receiving
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCancelReceiving}>
            <h6 className="mb-3">
              Are you sure you want to {isForReceiving ? "cancel" : "close"}{" "}
              this receiving order?
            </h6>

            <textarea
              placeholder="Remarks"
              name="closeRemarks"
              id="closeRemarks"
              value={closeRemarks}
              cols="5"
              rows="5"
              className="form-control"
              onChange={(e) => setCloseRemarks(e.target.value)}
            ></textarea>

            <Modal.Footer className="p-0 border-0 mt-3">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleCloseModal}
                disabled={isCancelling}
              >
                No
              </Button>

              <Button variant="primary" type="submit" disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Yes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Receiving_view;
