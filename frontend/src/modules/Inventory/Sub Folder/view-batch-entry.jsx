import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Modal, Button, Form, Card, Tab, Tabs } from "react-bootstrap";
import swal from "sweetalert";
import axios from "axios";

import Select, { components } from "react-select";

import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

import "../../../assets/css/lionchem.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// collapsible container
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";

import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

const ViewBatchEntry = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [batchData, setBatchData] = useState(null);
  const [batchTitle, setBatchTitle] = useState("");

  const [batchLeader, setBatchLeader] = useState("");
  const [batchMember, setBatchMember] = useState("");
  const [batchRemarks, setBatchRemarks] = useState("");

  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchEndDate, setBatchEndDate] = useState("");
  const [minEndDate, setMinEndDate] = useState("");
  const [dateValidationErrors, setDateValidationErrors] = useState({});

  const [batchStatus, setBatchStatus] = useState("");
  const [selectedBatchStatus, setSelectedBatchStatus] = useState("");

  const { id, postProduction } = useParams();

  const isPostProduction = postProduction === "post-production";
  const location = useLocation();
  const [postProductionStatus, setPostProductionStatus] = useState(null);

  const [selectedPostStatus, setSelectedPostStatus] = useState("");
  const userLoggedID = useDecodeToken();

  // lot
  const [lotNumbers, setLotNumbers] = useState({});

  // // Handle LOT change
  // const handleLotChange = (batchEntryFormulatedProductId, value) => {
  //   setLotNumbers((prev) => ({
  //     ...prev,
  //     [batchEntryFormulatedProductId]: value,
  //   }));

  //   // Auto-validate when LOT is entered or cleared
  //   validateLot(batchEntryFormulatedProductId, value);
  // };

  // // Validate LOT function
  // const validateLot = (batchEntryFormulatedProductId, value = null) => {
  //   const lotValue =
  //     value !== null ? value : lotNumbers[batchEntryFormulatedProductId];

  //   // LOT is not required, so no validation errors needed
  //   // Just ensure any existing errors are cleared
  //   setValidationErrors((prev) => {
  //     const newErrors = { ...prev };
  //     delete newErrors[`lot-${batchEntryFormulatedProductId}`];
  //     return newErrors;
  //   });
  // };

  useEffect(() => {
    const postProductionStatus = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/PostProduction/get-status/${id}`,
        );
        if (response.data.success) {
          console.log(response.data, "THIS IS RESPONSE");
          setPostProductionStatus(response.data.status);
          setSelectedPostStatus(response.data.status);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    postProductionStatus();
  }, []);

  // onclick for navigate
  const handleGoBack = () => {
    if (isPostProduction) {
      navigate("/inventory/post-production");
      window.scrollTo(0, 0);
    } else {
      navigate("/inventory/batch-entry");
      window.scrollTo(0, 0);
    }
  };

  // collapsible
  const { toggleSection, isOpen } = useCollapsibleSections();

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        if (!id) {
          navigate("/inventory/batch-entry");
          return;
        }

        const res = await axios.get(
          `${BASE_URL}/batchEntry2/fetchDetails/${id}`,
        );

        if (res.data.success && res.data.data) {
          setBatchData(res.data.data);
          setBatchTitle(res.data.data.batch_title || "");
          setBatchMember(res.data.data.members || "");
          setBatchRemarks(res.data.data.remarks || "");
          setBatchStatus(res.data.data.status || "");
          setSelectedBatchStatus(res.data.data.status || "");
          setBatchLeader(res.data.data.team_leader || "");

          // Format dates for datetime-local input
          const startDate = res.data.data.start_date
            ? formatDateForInput(res.data.data.start_date)
            : "";
          const endDate = res.data.data.end_date
            ? formatDateForInput(res.data.data.end_date)
            : "";

          setBatchStartDate(startDate);
          setBatchEndDate(endDate);

          // Set minEndDate to match start date
          setMinEndDate(startDate);

          setIsLoading(false);
        } else {
          swal("Not Found", "Batch not found.", "warning");
          navigate("/inventory/batch-entry");
        }
      } catch (error) {
        console.error("Error fetching batch:", error);
        swal("Error", "Invalid Batch ID or server error.", "error");
        navigate("/inventory/batch-entry");
      }
    };

    fetchBatchDetails();
  }, [id, navigate]);

  const allDisabled =
    !authrztn.includes("BatchEntry-Edit") ||
    batchStatus === "Accomplished" ||
    isPostProduction;

  // Replace your current updateDisabled condition with this:
  const updateDisabled = useMemo(() => {
    // If user doesn't have edit permission, disable
    if (!authrztn.includes("BatchEntry-Edit")) {
      return true;
    }

    // If in post-production mode
    if (isPostProduction) {
      // For post-production, check specific conditions
      if (batchStatus === "Accomplished") {
        // Disable if post production is completed
        return postProductionStatus === "Completed";
      }
      return false;
    }

    // For regular batch entry view (not post-production)
    // Disable if batch is already Accomplished
    return batchStatus === "Accomplished";
  }, [authrztn, isPostProduction, batchStatus, postProductionStatus]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "";
      }

      // Format to YYYY-MM-DDTHH:mm (datetime-local format)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "";
    }
  };

  // Also add this function to handle the reverse conversion when updating
  const parseDateFromInput = (inputValue) => {
    if (!inputValue) return null;

    try {
      const date = new Date(inputValue);
      return date.toISOString(); // Or format it as needed for your backend
    } catch (error) {
      console.error("Error parsing date from input:", error);
      return null;
    }
  };

  // mixer fetch
  const [mixerOptions, setMixerOptions] = useState([]);
  const [selectedMixers, setSelectedMixers] = useState([]);
  const [isMixerLoading, setIsMixerLoading] = useState(false);

  // Dynamic Select All option
  const selectAllOption = {
    value: "SELECT_ALL",
    label:
      selectedMixers.length === mixerOptions.length
        ? "Unselect All"
        : "Select All",
  };

  const optionsWithSelectAll =
    mixerOptions.length > 0 ? [selectAllOption, ...mixerOptions] : mixerOptions;

  const handleMixerChange = (selected) => {
    const lastSelectedOption = selected[selected.length - 1];

    // Handle Select All/Unselect All
    if (lastSelectedOption?.value === "SELECT_ALL") {
      setSelectedMixers(
        selectedMixers.length === mixerOptions.length ? [] : mixerOptions,
      );
      return;
    }

    // Normal selection/deselection
    setSelectedMixers(selected);
  };

  const handleTeamLeaderChange = (e) => {
    const value = e.target.value;
    setBatchLeader(value);

    // Auto-clear validation error when user types
    if (value.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.teamLeader;
        return newErrors;
      });
    }
  };

  const handleMembersChange = (e) => {
    const value = e.target.value;
    setBatchMember(value);

    // Auto-clear validation error when user types
    if (value.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.members;
        return newErrors;
      });
    }
  };

  // Custom MultiValueRemove component with proper removal functionality
  const CustomMultiValueRemove = (props) => {
    return (
      <components.MultiValueRemove
        {...props}
        innerProps={{
          ...props.innerProps,
          onMouseDown: (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Call the original onMouseDown function from removeProps
            if (props.removeProps && props.removeProps.onMouseDown) {
              props.removeProps.onMouseDown(e);
            }
          },
          onTouchEnd: (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Call the original onTouchEnd function from removeProps
            if (props.removeProps && props.removeProps.onTouchEnd) {
              props.removeProps.onTouchEnd(e);
            }
          },
        }}
      >
        <i className="bx bx-x" />
      </components.MultiValueRemove>
    );
  };

  const CustomOption = ({ children, ...props }) => {
    // Determine which options and selected values to use based on the select type
    let allSelected;
    let isSelectAll;

    return (
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={isSelectAll ? allSelected : props.isSelected}
          onChange={() => {}}
          style={{
            marginRight: 8,
            cursor: "pointer",
          }}
        />
        {children}
      </components.Option>
    );
  };

  // Custom DropdownIndicator with validation state awareness
  const CustomDropdownIndicator = (props) => {
    const { selectProps } = props;
    const isOpen = selectProps.menuIsOpen;
    const hasError = selectProps.className?.includes("border-danger");

    return (
      <components.DropdownIndicator {...props}>
        <FaChevronDown
          className={hasError ? "text-danger" : "text-muted"}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease-in-out",
            fontSize: "0.8rem",
          }}
        />
      </components.DropdownIndicator>
    );
  };

  // Fetch mixer data
  const fetchMixerData = async () => {
    setIsMixerLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchMixerData/${id}`,
      );

      if (res.data.success && res.data.data) {
        const options = res.data.data.allMixers.map((mixer) => ({
          value: mixer.id,
          label: mixer.name,
          ...mixer,
        }));

        setMixerOptions(options);

        // Set the selected mixers (those already tagged to the batch)
        const taggedMixerIds = res.data.data.taggedMixers.map(
          (mixer) => mixer.id,
        );
        const selected = options.filter((option) =>
          taggedMixerIds.includes(option.value),
        );

        setSelectedMixers(selected);
      }
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load mixers", "error");
    } finally {
      setIsMixerLoading(false);
    }
  };

  // delivery receipt fetch
  const [invoiceListData, setInvoiceListData] = useState([]);
  const fetchInvoiceListData = async (deliveryReceiptIds) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/BatchEntry2/fetchSalesInvoiceFromDeliveryReceiptData`,
        {
          params: {
            sales_invoice_ids: deliveryReceiptIds.join(","),
          },
        },
      );
      setInvoiceListData(res.data);
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load invoice list data", "error");
    }
  };

  // Fetch Delivery Receipt Data
  const [deliveryReceiptOptions, setDeliveryReceiptOptions] = useState([]);
  const [selectedDeliveryReceipts, setSelectedDeliveryReceipts] = useState([]);
  const [isDeliveryReceiptLoading, setIsDeliveryReceiptLoading] =
    useState(false);

  // finished products fetch
  const [finishedProductOptions, setFinishedProductOptions] = useState([]);
  const [selectedFinishedProducts, setSelectedFinishedProducts] = useState([]);
  const [isFinishedProductLoading, setIsFinishedProductLoading] =
    useState(false);

  // Dynamic Select All option for delivery receipts
  const deliveryReceiptSelectAllOption = {
    value: "SELECT_ALL_DR",
    label:
      selectedDeliveryReceipts.length === deliveryReceiptOptions.length
        ? "Unselect All"
        : "Select All",
  };

  const deliveryReceiptOptionsWithSelectAll =
    deliveryReceiptOptions.length > 0
      ? [deliveryReceiptSelectAllOption, ...deliveryReceiptOptions]
      : deliveryReceiptOptions;

  // Dynamic Select All option for finished products
  const finishedProductSelectAllOption = {
    value: "SELECT_ALL_FP",
    label:
      selectedFinishedProducts.length === finishedProductOptions.length
        ? "Unselect All"
        : "Select All",
  };

  const finishedProductOptionsWithSelectAll =
    finishedProductOptions.length > 0
      ? [finishedProductSelectAllOption, ...finishedProductOptions]
      : finishedProductOptions;

  // Handle delivery receipt selection change
  const handleDeliveryReceiptChange = async (selected) => {
    const lastSelectedOption = selected[selected.length - 1];

    // Handle Select All/Unselect All
    if (lastSelectedOption?.value === "SELECT_ALL_DR") {
      if (selectedDeliveryReceipts.length === deliveryReceiptOptions.length) {
        // Unselect all
        setSelectedDeliveryReceipts([]);
        setSelectedFinishedProducts([]);
        setFinishedProductOptions([]);
        setInvoiceListData([]); // Clear invoice list data
      } else {
        // Select all
        setSelectedDeliveryReceipts(deliveryReceiptOptions);
        await fetchFinishedProducts(
          deliveryReceiptOptions.map((dr) => dr.value),
        );
        await fetchInvoiceListData(
          deliveryReceiptOptions.map((dr) => dr.value),
        );
      }
      return;
    }

    // Normal selection/deselection
    setSelectedDeliveryReceipts(selected);

    // Fetch products and invoice list for selected delivery receipts
    if (selected.length > 0) {
      await fetchFinishedProducts(selected.map((dr) => dr.value));
      await fetchInvoiceListData(selected.map((dr) => dr.value));
    } else {
      setSelectedFinishedProducts([]);
      setFinishedProductOptions([]);
      setInvoiceListData([]); // Clear invoice list data
    }
  };

  // Handle finished product selection change
  const handleFinishedProductChange = (selected) => {
    const lastSelectedOption = selected[selected.length - 1];

    // Handle Select All/Unselect All
    if (lastSelectedOption?.value === "SELECT_ALL_FP") {
      setSelectedFinishedProducts(
        selectedFinishedProducts.length === finishedProductOptions.length
          ? [] // Unselect all
          : finishedProductOptions, // Select all
      );
      return;
    }

    // Normal selection/deselection
    setSelectedFinishedProducts(selected);
  };

  // Fetch delivery receipt data
  const fetchDeliveryReceiptData = async () => {
    setIsDeliveryReceiptLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchDeliveryReceiptData/${id}`,
      );

      if (res.data.success && res.data.data) {
        const options = res.data.data.allInvoices.map((invoice) => ({
          value: invoice.sales_invoice_id,
          label: invoice.delivery_number,
          ...invoice,
        }));

        setDeliveryReceiptOptions(options);

        // Set the selected delivery receipts (those already tagged to the batch)
        const taggedInvoiceIds = res.data.data.taggedInvoice.map(
          (invoice) => invoice.sales_invoice_id,
        );
        const selected = options.filter((option) =>
          taggedInvoiceIds.includes(option.value),
        );

        setSelectedDeliveryReceipts(selected);

        // Automatically fetch formulated products for the tagged delivery receipts
        if (selected.length > 0) {
          await fetchFinishedProducts(selected.map((dr) => dr.value));
          await fetchInvoiceListData(selected.map((dr) => dr.value));
        }
      }
    } catch (error) {
      console.error(error);
      // swal("Error", "Failed to load delivery receipts", "error");
    } finally {
      setIsDeliveryReceiptLoading(false);
    }
  };

  // Fetch finished products based on selected delivery receipts
  const fetchFinishedProducts = async (deliveryReceiptIds) => {
    setIsFinishedProductLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchProductFromDeliveryReceiptData/${id}`,
        {
          params: {
            sales_invoice_ids: deliveryReceiptIds.join(","),
          },
        },
      );

      if (res.data.success && res.data.data) {
        const options = res.data.data.allSalesTagProduct.map((product) => ({
          value: product.id,
          label: `${product.sales_invoice?.delivery_number || "N/A"} - ${
            product.product_list?.product_name || "Unknown Product"
          }`,
          ...product,
        }));

        setFinishedProductOptions(options);

        // Set the selected formulated products (those already tagged to the batch)
        const taggedProductIds = res.data.data.taggedFormulatedProducts.map(
          (product) => product.id,
        );
        const selected = options.filter((option) =>
          taggedProductIds.includes(option.value),
        );

        setSelectedFinishedProducts(selected);
      }
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load finished products", "error");
    } finally {
      setIsFinishedProductLoading(false);
    }
  };

  // Add this function near your other helper functions
  const handleExpiryDateClick = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the row
  };

  //   for validation
  // Handle start date change
  const handleStartDateChange = (e) => {
    const selectedDate = e.target.value;
    setBatchStartDate(selectedDate);

    // Set minimum end date to be the same as start date
    setMinEndDate(selectedDate);

    // Clear start date validation error
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.batchStartDate;
      return newErrors;
    });

    // If end date is earlier than start date, clear it and set error
    if (batchEndDate && batchEndDate < selectedDate) {
      setBatchEndDate("");
      setValidationErrors((prev) => ({
        ...prev,
        batchEndDate: "End date must be on or after start date",
      }));
    } else {
      // Clear end date error if valid
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.batchEndDate;
        return newErrors;
      });
    }

    // Update the form's selected status if dates are filled
    if (selectedDate && batchEndDate) {
      validateDates();
    }
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const selectedDate = e.target.value;
    setBatchEndDate(selectedDate);

    // Clear end date validation error
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.batchEndDate;
      return newErrors;
    });

    // Validate if end date is after start date
    if (batchStartDate && selectedDate && selectedDate < batchStartDate) {
      setValidationErrors((prev) => ({
        ...prev,
        batchEndDate: "End date must be on or after start date",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.batchEndDate;
        return newErrors;
      });
    }

    // Update the form's selected status if dates are filled
    if (batchStartDate && selectedDate) {
      validateDates();
    }
  };

  const validateDates = () => {
    const errors = {};

    // Check if start date is provided
    if (!batchStartDate) {
      errors.batchStartDate = "Start Date is required";
    }

    // Check if end date is provided
    if (!batchEndDate) {
      errors.batchEndDate = "End Date is required";
    }

    // Check if end date is after start date
    if (batchStartDate && batchEndDate && batchEndDate < batchStartDate) {
      errors.batchEndDate = "End date must be on or after start date";
    }

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const [validationErrors, setValidationErrors] = useState({});

  const hasError = (fieldName) => {
    return validationErrors[fieldName] !== undefined;
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!batchTitle.trim()) errors.batchTitle = "Batch title is required";
    if (!batchLeader.trim()) errors.teamLeader = "Team leader is required";
    if (!batchMember.trim()) errors.members = "Members are required";
    if (!batchStartDate) errors.batchStartDate = "Start date is required";
    if (!batchEndDate) errors.batchEndDate = "End date is required";
    if (selectedMixers.length === 0) errors.mixers = "Mixer is required";

    // Check if end date is after start date
    if (batchStartDate && batchEndDate && batchEndDate < batchStartDate) {
      errors.batchEndDate = "End date must be on or after start date";
    }

    // Validate Best Befores and LOT numbers
    materialFormulatedProduct.forEach((item) => {
      const productId = item.id;

      if (!item.expiry_date) {
        errors[`expiryDate-${productId}`] = "Best Before is required";
      }
    });

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // const validateExpiryDatesAndLOT = () => {
  //   const errors = {};
  //   let isValid = true;

  //   materialFormulatedProduct.forEach((item) => {
  //     const productId = item.id;

  //     if (!item.expiry_date) {
  //       errors[`expiryDate-${productId}`] = "Best Before is required";
  //       isValid = false;
  //     }

  //     // const lotValue = lotNumbers[productId] || "";
  //     // if (!lotValue.trim()) {
  //     //   errors[`lot-${productId}`] = "LOT is required";
  //     //   isValid = false;
  //     // }
  //   });

  //   setValidationErrors((prev) => ({ ...prev, ...errors }));
  //   return isValid;
  // };

  const validateExpiryDate = (
    batchEntryFormulatedProductId,
    dateValue = null,
  ) => {
    const item = materialFormulatedProduct.find(
      (item) => item.id === batchEntryFormulatedProductId,
    );

    // Use the provided dateValue or get from the item
    const expiryDate =
      dateValue !== null ? dateValue : item?.expiry_date || null;

    if (expiryDate) {
      // Remove error if date has value
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`expiryDate-${batchEntryFormulatedProductId}`];
        return newErrors;
      });
    } else {
      // Add error if date is empty
      setValidationErrors((prev) => ({
        ...prev,
        [`expiryDate-${batchEntryFormulatedProductId}`]:
          "Best Before is required",
      }));
    }
  };

  // invoice list data
  const [invoiceListDataTable, setInvoiceListDataTable] = useState([]);

  // ### invoice list ###
  useEffect(() => {
    const fetchInvoiceList = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/BatchEntry2/getInvoiceListData/${id}`,
        );

        if (response.data.success) {
          setInvoiceListDataTable(response.data.data || []);
        } else {
          swal(
            "Error",
            response.data.message || "Failed to fetch products",
            "error",
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching invoice list:", error);
        swal("Error", "Failed to fetch invoice list", "error");
        setIsLoading(false);
      }
    };

    fetchInvoiceList();
  }, [id]);

  // for invoice list collapsible
  const [expandedRows, setExpandedRows] = useState([]);
  const [invoiceProducts, setInvoiceProducts] = useState({});
  const [expandedFormulatedProducts, setExpandedFormulatedProducts] = useState(
    [],
  );
  const [formulatedProductRawMaterials, setFormulatedProductRawMaterials] =
    useState({});

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "---";
    }
  };

  // Format amount helper function
  const formatAmount = (value) => {
    if (value === null || value === undefined) return "";
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return ""; // default to empty if 0
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  // Toggle invoice row expansion
  const toggleRowExpand = async (invoiceId) => {
    setExpandedRows((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId],
    );

    // Fetch products when expanding
    if (!expandedRows.includes(invoiceId)) {
      try {
        const res = await axios.get(
          `${BASE_URL}/BatchEntry2/fetchViewProductFromDeliveryReceiptData`,
          {
            params: {
              sales_invoice_ids: invoiceId,
              id,
            },
          },
        );

        // REMOVE THE FILTERING - Show ALL products regardless of selection
        // const filteredProducts = res.data.filter((product) =>
        //   selectedFinishedProducts.some(
        //     (selected) => selected.value === product.id
        //   )
        // );

        // Set all products without filtering
        setInvoiceProducts((prev) => ({
          ...prev,
          [invoiceId]: res.data, // Use the full response data without filtering
        }));
      } catch (error) {
        console.error(error);
        swal("Error", "Failed to load products for this invoice", "error");
      }
    }
  };

  // Toggle formulated product expansion
  const toggleFormulatedProductExpand = async (
    productId,
    salesProductTagId,
  ) => {
    const productKey = `${productId}-${salesProductTagId}`;

    setExpandedFormulatedProducts((prev) =>
      prev.includes(productKey)
        ? prev.filter((key) => key !== productKey)
        : [...prev, productKey],
    );

    // Fetch raw materials when expanding
    if (!expandedFormulatedProducts.includes(productKey)) {
      try {
        const res = await axios.get(
          `${BASE_URL}/BatchEntry2/fetchRawProductFromFormulatedProduct`,
          {
            params: {
              product_ids: productId,
              sales_product_tag_ids: salesProductTagId,
            },
          },
        );

        setFormulatedProductRawMaterials((prev) => ({
          ...prev,
          [productKey]: res.data,
        }));
      } catch (error) {
        console.error(error);
        swal("Error", "Failed to load materials for this product", "error");
      }
    }
  };

  // material list collapsible
  const [materialExpandedRows, setMaterialExpandedRows] = useState([]);
  const [materialFormulatedProduct, setMaterialFormulatedProduct] = useState(
    [],
  );
  const [materialExpandUsedMaterial, setMaterialExpandUsedMaterial] = useState(
    {},
  );
  const [materialLoading, setMaterialLoading] = useState({});

  // Fetch formulated data
  const fetchFormulatedProduct = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchFormulatedProduct/${id}`,
      );

      if (response.data.success) {
        setMaterialFormulatedProduct(response.data.data);
      }
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load formulated product", "error");
    }
  };

  // fetch material used when clicking the formulated product
  const fetchMaterialUsedFromFormulatedProduct = async (
    formulatedProductId,
  ) => {
    try {
      setMaterialLoading((prev) => ({ ...prev, [formulatedProductId]: true }));

      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchMaterialUsedFromFormulatedProduct/${id}/${formulatedProductId}`,
      );

      if (response.data.success && response.data.data) {
        setMaterialExpandUsedMaterial((prev) => ({
          ...prev,
          [formulatedProductId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error(error);
      swal(
        "Error",
        "Failed to load materials for this formulated product",
        "error",
      );
    } finally {
      setMaterialLoading((prev) => ({ ...prev, [formulatedProductId]: false }));
    }
  };

  // Toggle material row expansion
  const toggleMaterialRowExpand = async (formulatedProductId) => {
    // Toggle expansion state
    setMaterialExpandedRows((prev) =>
      prev.includes(formulatedProductId)
        ? prev.filter((id) => id !== formulatedProductId)
        : [...prev, formulatedProductId],
    );

    // Fetch materials if expanding and not already loaded
    if (
      !materialExpandedRows.includes(formulatedProductId) &&
      !materialExpandUsedMaterial[formulatedProductId]
    ) {
      await fetchMaterialUsedFromFormulatedProduct(formulatedProductId);
    }
  };

  // for toggle material used to see the replacement history
  const [materialUsedExpandedRows, setMaterialUsedExpandedRows] = useState([]);
  const [materialUsedReplacementHistory, setMaterialUsedReplacementHistory] =
    useState({});
  const [materialUsedLoading, setMaterialUsedLoading] = useState({});

  // Replace your existing fetchMaterialUsedReplaced function with this:
  const fetchMaterialUsedReplaced = async (materialUsedId) => {
    try {
      setMaterialUsedLoading((prev) => ({
        ...prev,
        [materialUsedId]: true,
      }));

      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewFetchReplacedMaterialFromFormulatedProduct/${id}/${materialUsedId}`,
      );

      if (response.data.success && response.data.data) {
        setMaterialUsedReplacementHistory((prev) => ({
          ...prev,
          [materialUsedId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error(error);
      swal(
        "Error",
        "Failed to load replaced materials for this used material",
        "error",
      );
    } finally {
      setMaterialUsedLoading((prev) => ({
        ...prev,
        [materialUsedId]: false,
      }));
    }
  };

  // Add this function to toggle material used expansion
  const toggleMaterialUsedExpand = async (
    materialUsedId,
    formulatedProductId,
  ) => {
    const materialKey = `${formulatedProductId}-${materialUsedId}`;

    setMaterialUsedExpandedRows((prev) =>
      prev.includes(materialKey)
        ? prev.filter((key) => key !== materialKey)
        : [...prev, materialKey],
    );

    // Fetch replacement history if expanding and not already loaded
    if (
      !materialUsedExpandedRows.includes(materialKey) &&
      !materialUsedReplacementHistory[materialUsedId]
    ) {
      await fetchMaterialUsedReplaced(materialUsedId);
    }
  };

  // costing details collapsible
  // Add these state declarations near your other state declarations
  const [costItems, setCostItems] = useState([]);
  const [deletedCostItems, setDeletedCostItems] = useState([]);
  const [costItemErrors, setCostItemErrors] = useState({});

  // Fetch costing data
  const fetchCostingData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/batchViewCostingData/${id}`,
      );

      if (response.data.success) {
        const itemsWithState = response.data.data.map((item) => ({
          ...item,
          isNew: false, // Mark as fetched data
          isDeleted: false, // Initially not deleted
          rawAmount: item.amount, // Keep raw numeric for save
          amount: formatAmount(item.amount), // formatted for display
        }));
        setCostItems(itemsWithState);
      }
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load costing data", "error");
    }
  };

  // Add new cost item function
  const addCostItem = () => {
    const newItem = {
      id: Date.now(), // Temporary ID for new items
      name: "",
      remarks: "",
      amount: "",
      isNew: true, // Mark as new item
      isDeleted: false,
      originalAmount: "",
    };
    setCostItems([...costItems, newItem]);
  };

  // Remove cost item function with confirmation for fetched items
  const removeCostItem = (id, isNew) => {
    if (isNew) {
      // No confirmation needed for new items
      setCostItems(costItems.filter((item) => item.id !== id));
      // Remove any validation errors for this item
      setCostItemErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`name-${id}`];
        delete newErrors[`amount-${id}`];
        return newErrors;
      });
    } else {
      // Confirmation for fetched items
      swal({
        title: "Are you sure?",
        text: "This cost item will be marked for deletion. Submit changes to confirm deletion.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          // Mark as deleted in UI but don't remove from array
          setCostItems(
            costItems.map((item) =>
              item.id === id ? { ...item, isDeleted: true } : item,
            ),
          );

          // Add to deleted items list for submission
          setDeletedCostItems([...deletedCostItems, id]);
        }
      });
    }
  };

  // Undo delete function
  const undoDeleteCostItem = (id) => {
    setCostItems(
      costItems.map((item) =>
        item.id === id ? { ...item, isDeleted: false } : item,
      ),
    );

    // Remove from deleted items list
    setDeletedCostItems(deletedCostItems.filter((itemId) => itemId !== id));
  };

  // Handle cost item changes
  const handleCostItemChange = (id, field, value) => {
    setCostItems(
      costItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );

    // Auto-clear validation error when user starts typing
    if (field === "name" && value.trim()) {
      setCostItemErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`name-${id}`];
        return newErrors;
      });
    }

    if (field === "amount" && value !== "0.00" && value !== "") {
      // Remove commas and check if valid number
      const cleanAmount = value.replace(/,/g, "");
      const amountValue = parseFloat(cleanAmount);

      if (!isNaN(amountValue) && amountValue > 0) {
        setCostItemErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`amount-${id}`];
          return newErrors;
        });
      }
    }
  };

  // Validate cost items
  const validateCostItems = () => {
    const errors = {};
    let isValid = true;

    costItems.forEach((item) => {
      if (!item.isDeleted) {
        // Check name
        if (!item.name.trim()) {
          errors[`name-${item.id}`] = "Cost name is required";
          isValid = false;
        } else {
          // Remove error if field now has value
          setCostItemErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`name-${item.id}`];
            return newErrors;
          });
        }

        // Check amount
        if (!item.amount || item.amount === "") {
          errors[`amount-${item.id}`] = "Amount is required";
          isValid = false;
        } else {
          // Remove commas and check if valid number
          const cleanAmount = item.amount.replace(/,/g, "");
          const amountValue = parseFloat(cleanAmount);

          if (isNaN(amountValue) || amountValue <= 0) {
            errors[`amount-${item.id}`] = "Valid amount is required";
            isValid = false;
          } else {
            // Remove error if field now has valid value
            setCostItemErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[`amount-${item.id}`];
              return newErrors;
            });
          }
        }
      }
    });

    setCostItemErrors((prev) => ({ ...prev, ...errors }));
    return isValid;
  };

  const handleBatchTitleChange = (e) => {
    const value = e.target.value;
    setBatchTitle(value);

    // Auto-clear validation error when user types
    if (value.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.batchTitle;
        return newErrors;
      });
    }
  };

  // Format amount for display
  const formatAmountDisplay = (amount) => {
    if (amount === null || amount === undefined) return "0.00";

    // Remove commas first if it's a string with commas
    const cleanAmount =
      typeof amount === "string" ? amount.replace(/,/g, "") : amount;

    const numValue = parseFloat(cleanAmount);
    if (isNaN(numValue)) return "0.00";

    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2, // force exactly 2 decimals
    });
  };

  // Parse amount input
  const parseAmountInput = (value) => {
    // Remove non-digit except .
    let cleaned = value.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");

    // Limit decimals to 5
    if (parts[1] && parts[1].length > 5) {
      parts[1] = parts[1].slice(0, 5);
    }

    // Format integer part with commas while typing
    let intPart = parts[0] || "";
    let decPart = parts[1] !== undefined ? "." + parts[1] : "";

    if (intPart) {
      intPart = parseInt(intPart, 10).toLocaleString("en-US");
    }

    return intPart + decPart;
  };

  // Calculate total cost
  const totalCost = useMemo(() => {
    return costItems
      .filter((item) => !item.isDeleted)
      .reduce((sum, item) => {
        // Handle empty or invalid amounts
        if (!item.amount || item.amount === "") return sum;

        // Remove commas and parse as float
        const cleanAmount =
          typeof item.amount === "string"
            ? item.amount.replace(/,/g, "")
            : String(item.amount);

        const amountValue = parseFloat(cleanAmount);

        // Return sum if amount is NaN
        if (isNaN(amountValue)) return sum;

        return sum + amountValue;
      }, 0);
  }, [costItems]);

  // Add this formatter function near your other helper functions
  const formatAmountInput = (value) => {
    // Convert to string if it's a number
    const stringValue =
      typeof value === "number" ? value.toString() : String(value || "");

    // Remove all non-digit characters except decimal point
    let cleanedValue = stringValue.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const decimalParts = cleanedValue.split(".");
    if (decimalParts.length > 2) {
      cleanedValue = decimalParts[0] + "." + decimalParts.slice(1).join("");
    }

    // Limit to 5 decimal places
    if (decimalParts.length === 2) {
      cleanedValue = decimalParts[0] + "." + decimalParts[1].slice(0, 5);
    }

    // Add commas for thousands
    const parts = cleanedValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return parts.join(".");
  };

  // Add this near your other helper functions
  const formatDateTime = (dateString) => {
    if (!dateString) return "---";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "---";
    }
  };

  const handleExpiryDateChange = (batchEntryFormulatedProductId, newDate) => {
    setMaterialFormulatedProduct((prev) =>
      prev.map((item) =>
        item.id === batchEntryFormulatedProductId
          ? { ...item, expiry_date: newDate }
          : item,
      ),
    );

    // Auto-validate when date is selected or cleared
    validateExpiryDate(batchEntryFormulatedProductId, newDate);
  };

  const validateExpiryDates = () => {
    const errors = {};
    let isValid = true;

    materialFormulatedProduct.forEach((item) => {
      if (!item.expiry_date) {
        errors[`expiryDate-${item.id}`] = "Best Before is required";
        isValid = false;
      } else {
        // Remove error if field now has value
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`expiryDate-${item.id}`];
          return newErrors;
        });
      }
    });

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return isValid;
  };

  // Update your handleUpdate function to include cost items validation
  const handlePostProductionUpdate = async () => {
    setIsUpdating(true);

    if (selectedPostStatus === postProductionStatus) {
      swal({
        title: "No Changes!",
        text: "You haven't made any changes.",
        icon: "warning",
        buttons: false,
        timer: 1500,
      });
      setIsUpdating(false);
      return;
    }

    try {
      const confirmed = await swal({
        title: "Are you sure?",
        text: "Do you want to update the Post Production status?",
        icon: "warning",
        buttons: {
          cancel: { text: "Cancel", value: false, visible: true },
          confirm: { text: "Yes", value: true, visible: true },
        },
        dangerMode: true,
      });

      if (!confirmed) {
        setIsUpdating(false);
        return;
      }

      // Fix: Use POST method and include batch_id
      const response = await axios.post(
        `${BASE_URL}/PostProduction/update-status`, // Remove /${id}
        {
          newStatus: selectedPostStatus,
          batch_id: id, // Add the batch_id that backend expects
        },
      );

      if (response.data.success) {
        swal({
          title: "Success",
          text: "Post Production status updated successfully!",
          icon: "success",
          buttons: false,
          timer: 2000,
        });
        navigate("/inventory/post-production");
        window.scrollTo(0, 0);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to update status",
          "error",
        );
      }
    } catch (error) {
      console.error("Update error:", error);
      swal("Error", "An error occurred while updating the status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchEntryUpdate = async () => {
    // setIsUpdating(true);

    swal({
      title: "Are you sure?",
      text: "Do you want to update this batch entry?",
      icon: "warning",
      buttons: {
        cancel: {
          text: "Cancel",
          value: false,
          visible: true,
        },
        confirm: {
          text: "Yes",
          value: true,
          visible: true,
        },
      },
      dangerMode: true,
    }).then(async (willUpdate) => {
      if (!willUpdate) {
        setIsUpdating(false);
        return;
      }

      // validate dates first
      if (!validateDates()) {
        swal(
          "Validation Error",
          "Please fix all date validation errors before submitting.",
          "error",
        );
        setIsUpdating(false);
        return;
      }

      // Validation checks
      if (!validateForm()) {
        swal(
          "Validation Error",
          "Please fix all validation errors before submitting.",
          "error",
        );
        setIsUpdating(false);
        return;
      }

      if (!validateCostItems()) {
        swal(
          "Validation Error",
          "Please fix all cost item errors before submitting.",
          "error",
        );
        setIsUpdating(false);
        return;
      }

      // Only validate Best Befores (LOT validation is conditional)
      if (!validateExpiryDatesAndLOT()) {
        swal(
          "Validation Error",
          "Please fill in all required fields before submitting.",
          "error",
        );
        setIsUpdating(false);
        return;
      }

      // Check if any LOT validation is in progress (only for Accomplished)
      if (selectedBatchStatus === "Accomplished") {
        const isAnyLOTChecking = Object.values(isCheckingLOT).some(
          (checking) => checking,
        );
        if (isAnyLOTChecking) {
          swal({
            title: "Please Wait",
            text: "LOT validation is still in progress. Please wait a moment.",
            icon: "warning",
            button: "OK",
          });
          setIsUpdating(false);
          return;
        }

        // Check if any LOT has validation errors (only for Accomplished)
        const hasLOTErrors = Object.values(lotValidation).some(
          (validation) => validation?.isValid === false,
        );

        if (hasLOTErrors) {
          swal({
            title: "Invalid LOT Numbers",
            text: "Please fix the duplicate LOT numbers before submitting.",
            icon: "error",
            button: "OK",
          });
          setIsUpdating(false);
          return;
        }
      }
      try {
        // Collect Best Befores from materialFormulatedProduct
        const expiryDates = materialFormulatedProduct.map((item) => ({
          batchEntryFormulatedProductId: item.id,
          expiryDate: item.expiry_date || null,
        }));

        // Collect LOT numbers from lotNumbers state
        const lotNumbersData = materialFormulatedProduct.map((item) => ({
          batchEntryFormulatedProductId: item.id,
          lot: lotNumbers[item.id] || null,
        }));

        // Prepare mixer data for submission
        const mixerData = selectedMixers.map((mixer) => ({
          id: mixer.value,
          name: mixer.label,
        }));

        const updateData = {
          batch_title: batchTitle,
          team_leader: batchLeader,
          members: batchMember,
          remarks: batchRemarks,
          status: selectedBatchStatus,
          start_date: parseDateFromInput(batchStartDate),
          end_date: parseDateFromInput(batchEndDate),
          mixers: mixerData,
          cost_items: costItems
            .filter((item) => !item.isDeleted)
            .map((item) => ({
              id: item.isNew ? null : item.id,
              name: item.name,
              remarks: item.remarks,
              amount: item.amount,
            })),
          deleted_cost_items: deletedCostItems,
          expiry_dates: expiryDates,
          lot_numbers: lotNumbersData, // Updated field name to match backend expectation
          userLoggedID,
        };

        console.log(
          "UPDATE DATA BEING SUBMITTED:",
          JSON.stringify(updateData, null, 2),
        );

        const response = await axios.put(
          `${BASE_URL}/batchEntry2/update/${id}`,
          updateData,
        );

        if (response.data.success) {
          swal({
            title: "Success",
            text: "Batch updated successfully!",
            icon: "success",
            buttons: false,
            timer: 2000,
          });
          navigate("/inventory/batch-entry");
          window.scrollTo(0, 0);
        } else {
          swal(
            "Error",
            response.data.message || "Failed to update batch",
            "error",
          );
        }
      } catch (error) {
        console.error("Error updating batch:", error);
        swal("Error", "An error occurred while updating the batch", "error");
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Prevent multiple simultaneous updates
    if (isUpdating) return;

    if (isPostProduction && batchStatus === "Accomplished") {
      await handlePostProductionUpdate();
    } else {
      await handleBatchEntryUpdate();
    }
  };

  // lot validation
  // Add these state variables near your other state declarations
  const [lotValidation, setLotValidation] = useState({});
  const [lotDebounceTimers, setLotDebounceTimers] = useState({});
  const [isCheckingLOT, setIsCheckingLOT] = useState({});

  // Replace your existing validateLOTNumber function with this updated version
  const validateLOTNumber = async (
    batchEntryFormulatedProductId,
    lotValue,
    excludeBatchEntryFormulatedProductId = null,
  ) => {
    // Skip validation if status is not "Accomplished"
    if (selectedBatchStatus !== "Accomplished") {
      setLotValidation((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: {
          isValid: true,
          message: "",
          isChecking: false,
        },
      }));
      setIsCheckingLOT((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: false,
      }));
      return;
    }

    if (!lotValue || lotValue.trim() === "") {
      // Reset validation if empty
      setLotValidation((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: {
          isValid: true,
          message: "",
          isChecking: false,
        },
      }));
      setIsCheckingLOT((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: false,
      }));
      return;
    }

    // Set checking state
    setLotValidation((prev) => ({
      ...prev,
      [batchEntryFormulatedProductId]: {
        ...prev[batchEntryFormulatedProductId],
        isChecking: true,
      },
    }));
    setIsCheckingLOT((prev) => ({
      ...prev,
      [batchEntryFormulatedProductId]: true,
    }));

    try {
      const params = {
        lot: lotValue,
        batchId: id, // Send batch ID to check within the same batch
      };

      // If we have a batchEntryFormulatedProductId to exclude (current item)
      if (batchEntryFormulatedProductId) {
        params.excludeBatchEntryFormulatedProductId =
          batchEntryFormulatedProductId;
      }

      // Use the batch-specific validation endpoint
      const response = await axios.get(
        `${BASE_URL}/BatchEntry2/validateLotForBatch`,
        {
          params: params,
        },
      );

      if (response.data.exists) {
        setLotValidation((prev) => ({
          ...prev,
          [batchEntryFormulatedProductId]: {
            isValid: false,
            message: response.data.message,
            isChecking: false,
          },
        }));

        if (selectedBatchStatus !== "Accomplished") {
          // Show swal alert
          swal({
            title: "Duplicate LOT Number",
            text: response.data.message,
            icon: "error",
            button: "OK",
          }).then(() => {
            // Clear the LOT input field
            setLotNumbers((prev) => ({
              ...prev,
              [batchEntryFormulatedProductId]: "",
            }));
          });
        }
      } else {
        // Also check in StockManagement for global duplicates
        const globalCheck = await axios.get(
          `${BASE_URL}/BatchEntry2/validateLot`,
          {
            params: {
              lot: lotValue,
              whatModule: "Update",
              // Don't exclude anything for StockManagement check since it's global
            },
          },
        );

        if (globalCheck.data.exists) {
          setLotValidation((prev) => ({
            ...prev,
            [batchEntryFormulatedProductId]: {
              isValid: false,
              message: globalCheck.data.message,
              isChecking: false,
            },
          }));

          // Show swal alert
          if (selectedBatchStatus !== "Accomplished") {
            swal({
              title: "Duplicate LOT Number",
              text: globalCheck.data.message,
              icon: "error",
              button: "OK",
            }).then(() => {
              // Clear the LOT input field
              setLotNumbers((prev) => ({
                ...prev,
                [batchEntryFormulatedProductId]: "",
              }));
            });
          }
        } else {
          setLotValidation((prev) => ({
            ...prev,
            [batchEntryFormulatedProductId]: {
              isValid: true,
              message: "",
              isChecking: false,
            },
          }));
        }
      }
    } catch (error) {
      console.error("LOT validation error:", error);
      setLotValidation((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: {
          isValid: true,
          message: "Error checking LOT. Please try again.",
          isChecking: false,
        },
      }));
    } finally {
      setIsCheckingLOT((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: false,
      }));
    }
  };

  const handleLotChange = (batchEntryFormulatedProductId, value) => {
    // Clear validation error when user starts typing
    if (validationErrors[`lot-${batchEntryFormulatedProductId}`]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`lot-${batchEntryFormulatedProductId}`];
        return newErrors;
      });
    }

    // Clear existing timer for this product
    if (lotDebounceTimers[batchEntryFormulatedProductId]) {
      clearTimeout(lotDebounceTimers[batchEntryFormulatedProductId]);
    }

    // Update the LOT value immediately
    setLotNumbers((prev) => ({
      ...prev,
      [batchEntryFormulatedProductId]: value,
    }));

    // Only validate if status is "Accomplished"
    if (selectedBatchStatus === "Accomplished") {
      // Set new timer for debounce
      const timer = setTimeout(() => {
        // For batch entries, we exclude the current batchEntryFormulatedProductId
        // This allows the same LOT to be kept if unchanged
        validateLOTNumber(
          batchEntryFormulatedProductId,
          value,
          batchEntryFormulatedProductId,
        );
      }, 800);

      // Store the timer reference
      setLotDebounceTimers((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: timer,
      }));
    } else {
      // If not Accomplished, clear any existing validation
      setLotValidation((prev) => ({
        ...prev,
        [batchEntryFormulatedProductId]: {
          isValid: true,
          message: "",
          isChecking: false,
        },
      }));
    }
  };

  // Add this function to handle initial LOT validation when component loads
  const validateAllExistingLOTs = async () => {
    // Skip validation if status is not "Accomplished"
    if (selectedBatchStatus !== "Accomplished") {
      return;
    }

    if (materialFormulatedProduct.length === 0) return;

    const validationPromises = materialFormulatedProduct.map(async (item) => {
      const batchEntryFormulatedProductId = item.id;
      const currentLot =
        lotNumbers[batchEntryFormulatedProductId] || item.lot || "";

      if (currentLot && currentLot.trim()) {
        await validateLOTNumber(
          batchEntryFormulatedProductId,
          currentLot,
          batchEntryFormulatedProductId,
        );
      }
    });

    await Promise.all(validationPromises);
  };

  // Update your useEffect that initializes LOT numbers
  useEffect(() => {
    if (materialFormulatedProduct.length > 0) {
      const initialLotNumbers = {};
      materialFormulatedProduct.forEach((item) => {
        if (item.lot) {
          initialLotNumbers[item.id] = item.lot;
        }
      });
      setLotNumbers(initialLotNumbers);

      // Validate all existing LOTs after they're loaded
      setTimeout(() => {
        validateAllExistingLOTs();
      }, 1000);
    }
  }, [materialFormulatedProduct]);

  // Update your validateExpiryDatesAndLOT function
  const validateExpiryDatesAndLOT = () => {
    const errors = {};
    let isValid = true;

    materialFormulatedProduct.forEach((item) => {
      const batchEntryFormulatedProductId = item.id;

      if (!item.expiry_date) {
        errors[`expiryDate-${batchEntryFormulatedProductId}`] =
          "Best Before is required";
        isValid = false;
      }

      // Only validate LOT if status is "Accomplished"
      if (selectedBatchStatus === "Accomplished") {
        // Check LOT validation status
        const lotValue = lotNumbers[batchEntryFormulatedProductId] || "";
        const validationStatus = lotValidation[batchEntryFormulatedProductId];

        // Only validate if LOT has a value
        if (lotValue.trim()) {
          if (validationStatus?.isValid === false) {
            errors[`lot-${batchEntryFormulatedProductId}`] =
              validationStatus.message || "Invalid LOT number";
            isValid = false;
          }
        } else {
          // LOT is required for Accomplished status
          errors[`lot-${batchEntryFormulatedProductId}`] = "LOT is required";
          isValid = false;
        }
      }
      // If status is not Accomplished, LOT is not required and not validated
    });

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return isValid;
  };

  // Cleanup timers on component unmount
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

  // Update your existing validateLot function to use the new validation
  const validateLot = (batchEntryFormulatedProductId, value = null) => {
    // Skip validation if status is not "Accomplished"
    if (selectedBatchStatus !== "Accomplished") {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`lot-${batchEntryFormulatedProductId}`];
        return newErrors;
      });
      return true;
    }

    const lotValue =
      value !== null ? value : lotNumbers[batchEntryFormulatedProductId];

    // Only validate if LOT has a value
    if (lotValue && lotValue.trim()) {
      const validationStatus = lotValidation[batchEntryFormulatedProductId];
      if (validationStatus?.isValid === false) {
        setValidationErrors((prev) => ({
          ...prev,
          [`lot-${batchEntryFormulatedProductId}`]: validationStatus.message,
        }));
        return false;
      }
    }

    // Clear error if no LOT or validation passes
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`lot-${batchEntryFormulatedProductId}`];
      return newErrors;
    });
    return true;
  };

  // global use effect
  // use effect for on load fetch
  useEffect(() => {
    fetchMixerData();
    fetchDeliveryReceiptData();
    fetchFormulatedProduct();
    fetchCostingData();
  }, []);

  // Add useEffect to initialize LOT numbers from fetched data
  useEffect(() => {
    if (materialFormulatedProduct.length > 0) {
      const initialLotNumbers = {};
      materialFormulatedProduct.forEach((item) => {
        if (item.lot) {
          initialLotNumbers[item.id] = item.lot;
        }
      });
      setLotNumbers(initialLotNumbers);
    }
  }, [materialFormulatedProduct]);

  // Add this useEffect near your other useEffects
  useEffect(() => {
    // When status changes to/from "Accomplished", revalidate LOTs
    if (materialFormulatedProduct.length > 0) {
      if (selectedBatchStatus === "Accomplished") {
        // If status becomes Accomplished, validate all LOTs
        validateAllExistingLOTs();
      } else {
        // If status is not Accomplished, clear all LOT validations
        setLotValidation({});
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          // Remove all LOT errors
          Object.keys(newErrors).forEach((key) => {
            if (key.startsWith("lot-")) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
      }
    }
  }, [selectedBatchStatus, materialFormulatedProduct]);

  useEffect(() => {
    if (batchStartDate) {
      setMinEndDate(batchStartDate);
    }
  }, [batchStartDate]);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
          />
        </div>
      ) : authrztn.includes("BatchEntry-View") ? (
        <>
          {/* title */}
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex justify-content-between w-100 title-custom2">
              <div>
                <span className="fs-3">
                  <button
                    onClick={handleGoBack}
                    className="text-dark border-0"
                    style={{ background: "none" }}
                  >
                    <i className="bx bx-arrow-back"></i>
                  </button>
                  <span className="mx-2"> VIEW BATCH ENTRY</span>
                </span>
                <div
                  className="d-flex badge fw-medium "
                  style={{ fontSize: "15px" }}
                >
                  <span className="px-2 py-1 bg-primary text-white ">
                    BATCH NO
                  </span>
                  <span className="px-2 py-1 bg-secondary text-white ">
                    {batchData?.transaction_id || "---"}
                  </span>
                </div>
              </div>
              {isPostProduction && (
                <button
                  className="btn btn-primary px-3 py-2 mx-2"
                  style={{ maxHeight: "45px", alignSelf: "center" }}
                  onClick={() => {
                    navigate(`/inventory/production-loss/${id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  Preview Losses
                </button>
              )}
            </div>
          </div>

          {/* form fields */}
          <div className="container-fluid mt-4">
            <div className="row">
              <div className="col-sm mb-3">
                <label htmlFor="batchName">
                  Batch Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="batchTitle"
                  id="batchName"
                  className={`form-control p-3 ${
                    hasError("batchTitle") ? "border border-danger" : ""
                  }`}
                  placeholder="Enter Title"
                  value={batchTitle}
                  onChange={handleBatchTitleChange} // Use the new handler
                  required
                  disabled={allDisabled}
                />
                {hasError("batchTitle") && (
                  <div className="text-danger small">
                    {validationErrors.batchTitle}
                  </div>
                )}
              </div>

              <div className="col-sm mb-3">
                <label htmlFor="team-leader">
                  Team Leader <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="team-leader"
                  id="team-leader"
                  className={`form-control p-3 ${
                    hasError("teamLeader") ? "border border-danger" : ""
                  }`}
                  placeholder="Enter Team Leader"
                  value={batchLeader}
                  onChange={handleTeamLeaderChange}
                  required
                  disabled={allDisabled}
                />
                {hasError("teamLeader") && (
                  <div className="text-danger small">
                    {validationErrors.teamLeader}
                  </div>
                )}
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="members">
                  Members <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="members"
                  id="members"
                  className={`form-control p-3 ${
                    hasError("members") ? "border border-danger" : ""
                  }`}
                  placeholder="Enter Members"
                  value={batchMember}
                  onChange={handleMembersChange}
                  required
                  disabled={allDisabled}
                />
                {hasError("members") && (
                  <div className="text-danger small">
                    {validationErrors.members}
                  </div>
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-sm mb-3">
                <label htmlFor="mixer">
                  Mixer <span className="text-danger">*</span>
                </label>
                <Select
                  id="mixer"
                  isMulti
                  isDisabled={allDisabled}
                  options={optionsWithSelectAll}
                  value={selectedMixers}
                  required
                  onChange={handleMixerChange}
                  isLoading={isMixerLoading}
                  placeholder="Select Mixer"
                  closeMenuOnSelect={false}
                  className={hasError("mixers") ? "border-danger rounded" : ""}
                  components={{
                    Option: CustomOption,
                    MultiValueRemove: CustomMultiValueRemove,
                    DropdownIndicator: CustomDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: "59px",
                      borderColor: hasError("mixers") ? "#dc3545" : "#ced4da",
                    }),
                    option: (base) => ({
                      ...base,
                      padding: "8px 12px",
                    }),
                  }}
                />
                {hasError("mixers") && (
                  <div className="text-danger small">
                    {validationErrors.mixers}
                  </div>
                )}
              </div>
              {/* Delivery Receipt Select */}
              <div className="col-sm mb-3">
                <label htmlFor="deliveryReceipt">
                  Delivery Receipt <span className="text-danger">*</span>
                </label>
                <Select
                  id="deliveryReceipt"
                  isMulti
                  options={deliveryReceiptOptions}
                  value={selectedDeliveryReceipts}
                  onChange={() => {}} // Empty function to prevent changes
                  isLoading={isDeliveryReceiptLoading}
                  placeholder="Delivery Receipt(s)"
                  isDisabled={true} // Disable the select
                  className="border-secondary rounded"
                  components={{
                    MultiValueRemove: () => null, // Remove the X button
                    DropdownIndicator: () => null, // Remove the dropdown arrow
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "59px",
                      backgroundColor: "#f8f9fa", // Light gray background to indicate disabled state
                      cursor: "not-allowed",
                    }),
                    option: (base) => ({
                      ...base,
                      padding: "8px 12px",
                    }),
                  }}
                />
              </div>
              {/* Formulated Products Select */}
              <div className="col-sm mb-3">
                <label htmlFor="finishedProduct">
                  Formulated Products <span className="text-danger">*</span>
                </label>
                <Select
                  id="finishedProduct"
                  isMulti
                  options={finishedProductOptions}
                  value={selectedFinishedProducts}
                  onChange={() => {}} // Empty function to prevent changes
                  isLoading={isFinishedProductLoading}
                  placeholder="Product(s)"
                  isDisabled={true} // Disable the select
                  className="border-secondary rounded"
                  components={{
                    MultiValueRemove: () => null, // Remove the X button
                    DropdownIndicator: () => null, // Remove the dropdown arrow
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "59px",
                      backgroundColor: "#f8f9fa", // Light gray background to indicate disabled state
                      cursor: "not-allowed",
                    }),
                    option: (base) => ({
                      ...base,
                      padding: "8px 12px",
                    }),
                  }}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm">
                <label htmlFor="status">
                  Status <span className="text-danger">*</span>
                </label>
                <select
                  id="status"
                  className="form-select p-3"
                  value={selectedBatchStatus || ""}
                  disabled={batchStatus !== "Printed"} // Use original status for disabling
                  onChange={(e) => setSelectedBatchStatus(e.target.value)} // Update selected status
                >
                  <option value={batchStatus || ""}>
                    {batchStatus || "Select Status"}
                  </option>
                  <option value="Accomplished">Accomplished</option>
                </select>
              </div>
              <div className={isPostProduction ? "col-sm" : "d-none"}>
                <label htmlFor="status">
                  Post Production Status <span className="text-danger">*</span>
                </label>
                <select
                  id="status"
                  className="form-select p-3"
                  value={selectedPostStatus || ""}
                  disabled={
                    !isPostProduction || postProductionStatus === "Completed"
                  }
                  onChange={(e) => setSelectedPostStatus(e.target.value)}
                >
                  <option value={postProductionStatus || ""}>
                    {postProductionStatus || "Select Status"}
                  </option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-sm">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  name=""
                  id="batchRemarks"
                  className="form-control"
                  cols="3"
                  rows="3"
                  placeholder="Enter Remarks"
                  value={batchRemarks}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                  disabled={allDisabled}
                ></textarea>
              </div>
            </div>
          </div>

          {/* schedule container */}
          <CollapsibleContainer
            title="Set Schedule"
            toggleSection={toggleSection}
            isOpen={isOpen}
          >
            <div
              className="row mx-auto scrollable-contents py-2"
              style={{
                maxHeight: isOpen ? "1000px" : "0px",
                overflowX: "hidden",
                overflowY: "auto",
                transition:
                  "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="col-sm">
                <label htmlFor="batchStartDate">
                  Start Date <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  name=""
                  id="batchStartDate"
                  className={`form-control p-3 ${
                    hasError("batchStartDate") ? "border border-danger" : ""
                  }`}
                  value={batchStartDate}
                  onChange={handleStartDateChange}
                  required
                  disabled={allDisabled}
                />
                {hasError("batchStartDate") && (
                  <div className="text-danger small">
                    {validationErrors.batchStartDate}
                  </div>
                )}
              </div>
              <div className="col-sm">
                <label htmlFor="batchEndDate">
                  End Date <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  name=""
                  id="batchEndDate"
                  className={`form-control p-3 ${
                    hasError("batchEndDate") ? "border border-danger" : ""
                  }`}
                  value={batchEndDate}
                  onChange={handleEndDateChange}
                  min={minEndDate} // This sets the minimum selectable date
                  disabled={!batchStartDate || allDisabled} // Disable if no start date
                  required
                />
                {hasError("batchEndDate") && (
                  <div className="text-danger small">
                    {validationErrors.batchEndDate}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContainer>

          <CollapsibleContainer
            title="Invoice List"
            toggleSection={toggleSection}
            isOpen={isOpen}
          >
            <div
              className="row mx-auto scrollable-contents py-2"
              style={{
                maxHeight: isOpen ? "1000px" : "0px",
                overflowX: "hidden",
                overflowY: "auto",
                transition:
                  "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="mt-3 table-responsive batch-creation-invoice-list">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Transaction ID
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Delivery Receipt
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Customer
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Invoice Date
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Invoice Amount
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        {/* Empty header for chevron */}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceListData.length > 0 ? (
                      invoiceListData.map((invoice) => {
                        const isExpanded = expandedRows.includes(
                          invoice.sales_invoice_id,
                        );

                        return (
                          <React.Fragment key={invoice.sales_invoice_id}>
                            <tr
                              className={`cursor-pointer ${
                                isExpanded ? "table-success" : "table-info"
                              }`}
                              onClick={() =>
                                toggleRowExpand(invoice.sales_invoice_id)
                              }
                            >
                              <td className="text-center">
                                {invoice.transaction_id || "---"}
                              </td>
                              <td className="text-center">
                                {invoice.delivery_number || "---"}
                              </td>
                              <td className="text-center">
                                {invoice.customer?.company_name || "---"}
                              </td>
                              <td className="text-center">
                                {formatDate(invoice.invoice_date)}
                              </td>
                              <td className="text-center">
                                {formatAmount(invoice.net_amount)}
                              </td>
                              <td className="text-center">
                                {isExpanded ? (
                                  <FaChevronUp className="text-primary" />
                                ) : (
                                  <FaChevronDown className="text-primary" />
                                )}
                              </td>
                            </tr>

                            {/* Expanded row with products */}
                            {isExpanded && (
                              <tr className="table-collapse">
                                <td colSpan="6" className="p-0">
                                  <div className="p-3 bg-light">
                                    <h6>Formulated Products</h6>
                                    {invoiceProducts[
                                      invoice.sales_invoice_id
                                    ] ? (
                                      invoiceProducts[invoice.sales_invoice_id]
                                        .length > 0 ? (
                                        <table className="table table-sm table-bordered table-nested table-hover">
                                          <thead>
                                            <tr>
                                              <th>Product Code</th>
                                              <th>Product Name</th>
                                              <th>Unit of Measure</th>
                                              <th>Ordered Weight (kg)</th>
                                              <th>Discount</th>
                                              <th>Price</th>
                                              <th></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {invoiceProducts[
                                              invoice.sales_invoice_id
                                            ].map((product) => {
                                              const productKey = `${product.product_id}-${product.id}`;
                                              const isProductExpanded =
                                                expandedFormulatedProducts.includes(
                                                  productKey,
                                                );
                                              const isSelected =
                                                selectedFinishedProducts.some(
                                                  (selected) =>
                                                    selected.value ===
                                                    product.id,
                                                );

                                              return (
                                                <React.Fragment
                                                  key={product.id}
                                                >
                                                  <tr
                                                    className={`cursor-pointer ${
                                                      isProductExpanded
                                                        ? "table-success"
                                                        : isSelected
                                                          ? ""
                                                          : ""
                                                    }`}
                                                    onClick={() =>
                                                      toggleFormulatedProductExpand(
                                                        product.product_id,
                                                        product.id,
                                                      )
                                                    }
                                                  >
                                                    <td>
                                                      {product.product_list
                                                        ?.product_code || "N/A"}
                                                    </td>
                                                    <td>
                                                      {product.product_list
                                                        ?.product_name || "N/A"}
                                                    </td>
                                                    <td>
                                                      {product.product_list
                                                        ?.prod_packaging
                                                        ? `${
                                                            product.product_list
                                                              .prod_packaging
                                                              .packaging_name
                                                          } - (${product.product_list.prod_packaging.unit_quantity.toLocaleString(
                                                            "en-US",
                                                          )} ${
                                                            product.product_list
                                                              .prod_packaging
                                                              .unit
                                                          })`
                                                        : "N/A"}
                                                    </td>

                                                    <td>
                                                      {product.quantity &&
                                                      product.packaging_unit_quantity
                                                        ? (
                                                            product.quantity *
                                                            product.packaging_unit_quantity
                                                          ).toLocaleString(
                                                            "en-US",
                                                            {
                                                              minimumFractionDigits: 2,
                                                              maximumFractionDigits: 5,
                                                            },
                                                          )
                                                        : "0.00"}
                                                    </td>

                                                    <td>
                                                      {product.discount_item ||
                                                        0}
                                                      %
                                                    </td>
                                                    <td>
                                                      {product.subtotal
                                                        ? parseFloat(
                                                            product.subtotal,
                                                          ).toLocaleString(
                                                            "en-US",
                                                            {
                                                              minimumFractionDigits: 2,
                                                              maximumFractionDigits: 5,
                                                            },
                                                          )
                                                        : "0.00"}
                                                    </td>
                                                    <td className="text-center">
                                                      {isProductExpanded ? (
                                                        <FaChevronUp className="text-primary" />
                                                      ) : (
                                                        <FaChevronDown className="text-primary" />
                                                      )}
                                                    </td>
                                                  </tr>

                                                  {/* Expanded row with materials used for formulated product*/}
                                                  {isProductExpanded && (
                                                    <tr className="table-collapse">
                                                      <td
                                                        colSpan="7"
                                                        className="p-0"
                                                      >
                                                        <div className="p-3 bg-light">
                                                          <h6>
                                                            Materials Used
                                                          </h6>
                                                          {formulatedProductRawMaterials[
                                                            productKey
                                                          ] ? (
                                                            Array.isArray(
                                                              formulatedProductRawMaterials[
                                                                productKey
                                                              ],
                                                            ) &&
                                                            formulatedProductRawMaterials[
                                                              productKey
                                                            ].length > 0 ? (
                                                              <table className="table table-sm table-bordered table-nested">
                                                                <thead>
                                                                  <tr>
                                                                    <th>
                                                                      Product
                                                                      Code
                                                                    </th>
                                                                    <th>
                                                                      Product
                                                                      Name
                                                                    </th>
                                                                    <th>
                                                                      Unit of
                                                                      Measure
                                                                    </th>
                                                                    <th>
                                                                      Category
                                                                    </th>
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {formulatedProductRawMaterials[
                                                                    productKey
                                                                  ].map(
                                                                    (
                                                                      material,
                                                                    ) => (
                                                                      <tr
                                                                        key={
                                                                          material.id
                                                                        }
                                                                      >
                                                                        <td>
                                                                          {material
                                                                            .fpu_product_id
                                                                            ?.product_code ||
                                                                            "N/A"}
                                                                        </td>
                                                                        <td>
                                                                          {material
                                                                            .fpu_product_id
                                                                            ?.product_name ||
                                                                            "N/A"}
                                                                        </td>
                                                                        <td>
                                                                          {material
                                                                            .fpu_product_id
                                                                            ?.prod_packaging
                                                                            ? `${
                                                                                material
                                                                                  .fpu_product_id
                                                                                  .prod_packaging
                                                                                  .packaging_name
                                                                              } - (${material.fpu_product_id.prod_packaging.unit_quantity.toLocaleString(
                                                                                "en-US",
                                                                              )} ${
                                                                                material
                                                                                  .fpu_product_id
                                                                                  .prod_packaging
                                                                                  .unit
                                                                              })`
                                                                            : "N/A"}
                                                                        </td>

                                                                        <td>
                                                                          <span
                                                                            className={`py-2 badge bg-${
                                                                              material.category ===
                                                                              "Vendor Product"
                                                                                ? "primary"
                                                                                : material.category ===
                                                                                    "Raw Product"
                                                                                  ? "warning text-dark"
                                                                                  : "success"
                                                                            }`}
                                                                          >
                                                                            {
                                                                              material.category
                                                                            }
                                                                          </span>
                                                                        </td>
                                                                      </tr>
                                                                    ),
                                                                  )}
                                                                </tbody>
                                                              </table>
                                                            ) : (
                                                              <div className="text-center py-3">
                                                                No materials
                                                                found
                                                              </div>
                                                            )
                                                          ) : (
                                                            <div className="text-center py-3">
                                                              Loading
                                                              materials...
                                                            </div>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="text-center py-3">
                                          No formulated products selected for
                                          this invoice
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-center py-3">
                                        Loading products...
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          {selectedDeliveryReceipts.length === 0
                            ? "Please select delivery receipts first"
                            : "No data available for selected delivery receipts"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleContainer>

          <CollapsibleContainer
            title="Material List"
            toggleSection={toggleSection}
            isOpen={isOpen}
          >
            <div
              className="container-fluid scrollable-contents pb-2"
              style={{
                minHeight: isOpen ? "300px" : "0px",
                maxHeight: isOpen ? "1000px" : "0px",
                overflowX: "hidden",
                overflowY: "auto",
                transition:
                  "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="mt-3 table-responsive">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Product Code
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Name
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Unit of Measure
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Ordered Weight (kg)
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                      >
                        Best Before
                        {selectedBatchStatus !== "Accomplished" && (
                          <span className="text-danger">*</span>
                        )}
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", width: "200px" }}
                      >
                        LOT{" "}
                        {selectedBatchStatus !== "Accomplished" && (
                          <span className="text-danger">*</span>
                        )}
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        {/* Empty header for chevron */}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialFormulatedProduct.length > 0 ? (
                      materialFormulatedProduct.map((item) => {
                        const batchEntryFormulatedProductId = item.id;
                        const isExpanded = materialExpandedRows.includes(
                          batchEntryFormulatedProductId,
                        );
                        const hasExpiryError = hasError(
                          `expiryDate-${batchEntryFormulatedProductId}`,
                        );
                        const materials =
                          materialExpandUsedMaterial[
                            batchEntryFormulatedProductId
                          ] || [];

                        // FIX: Check if lotNumbers has an entry for this product (even if empty string)
                        // If it exists in lotNumbers state, use that value, otherwise use the original item.lot
                        const currentLot =
                          batchEntryFormulatedProductId in lotNumbers
                            ? lotNumbers[batchEntryFormulatedProductId]
                            : item.lot || "";

                        return (
                          <React.Fragment key={batchEntryFormulatedProductId}>
                            <tr
                              className={`cursor-pointer ${
                                isExpanded ? "table-success" : ""
                              }`}
                              onClick={() =>
                                toggleMaterialRowExpand(
                                  batchEntryFormulatedProductId,
                                )
                              }
                            >
                              <td className="text-center">
                                {item.befp_product_id?.product_code}
                              </td>
                              <td className="text-center">
                                <div className="d-flex flex-column">
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
                              <td className="text-center">
                                {item.befp_product_id?.prod_packaging
                                  ? `${
                                      item.befp_product_id.prod_packaging
                                        .packaging_name
                                    } - (${item.befp_product_id.prod_packaging.unit_quantity.toLocaleString(
                                      "en-US",
                                    )} ${
                                      item.befp_product_id.prod_packaging.unit
                                    })`
                                  : "N/A"}
                              </td>

                              <td className="text-center">
                                {item.weight !== undefined &&
                                item.weight !== null
                                  ? Number(item.weight).toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 5,
                                      },
                                    )
                                  : "0.00"}
                              </td>

                              <td className="text-center">
                                <input
                                  type="date"
                                  name=""
                                  title="Best Before"
                                  value={item.expiry_date || ""}
                                  data-product-key={
                                    batchEntryFormulatedProductId
                                  }
                                  className={`form-control form-control-sm ${
                                    hasError(
                                      `expiryDate-${batchEntryFormulatedProductId}`,
                                    )
                                      ? "border border-danger"
                                      : ""
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    handleExpiryDateChange(
                                      batchEntryFormulatedProductId,
                                      e.target.value,
                                    );
                                  }}
                                  onBlur={(e) => {
                                    validateExpiryDate(
                                      batchEntryFormulatedProductId,
                                      e.target.value,
                                    );
                                  }}
                                  required
                                  disabled={allDisabled}
                                />
                                {hasError(
                                  `expiryDate-${batchEntryFormulatedProductId}`,
                                ) && (
                                  <div className="text-danger small">
                                    {
                                      validationErrors[
                                        `expiryDate-${batchEntryFormulatedProductId}`
                                      ]
                                    }
                                  </div>
                                )}
                              </td>

                              <td className="text-center">
                                <div className="position-relative">
                                  <input
                                    type="text"
                                    name=""
                                    title="LOT"
                                    placeholder="Enter LOT"
                                    value={currentLot}
                                    data-lot-key={batchEntryFormulatedProductId}
                                    className={`form-control form-control-sm ${
                                      // Only apply border-danger if status is NOT "Accomplished"
                                      selectedBatchStatus !== "Accomplished" &&
                                      hasError(
                                        `lot-${batchEntryFormulatedProductId}`,
                                      )
                                        ? "border border-danger"
                                        : selectedBatchStatus !==
                                              "Accomplished" &&
                                            lotValidation[
                                              batchEntryFormulatedProductId
                                            ]?.isValid === false
                                          ? "is-invalid"
                                          : ""
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      handleLotChange(
                                        batchEntryFormulatedProductId,
                                        e.target.value,
                                      );
                                    }}
                                    onKeyDown={(e) => {
                                      // Allow select all (Ctrl+A or Cmd+A)
                                      if (
                                        (e.ctrlKey || e.metaKey) &&
                                        e.key === "a"
                                      ) {
                                        return; // Allow default behavior
                                      }

                                      // Allow common navigation and editing keys
                                      const allowedKeys = [
                                        "Backspace",
                                        "Delete",
                                        "ArrowLeft",
                                        "ArrowRight",
                                        "ArrowUp",
                                        "ArrowDown",
                                        "Home",
                                        "End",
                                        "Tab",
                                      ];

                                      if (allowedKeys.includes(e.key)) {
                                        return; // Allow these keys
                                      }
                                    }}
                                    onBlur={(e) => {
                                      validateLot(
                                        batchEntryFormulatedProductId,
                                        e.target.value,
                                      );
                                    }}
                                    maxLength={50}
                                    disabled={allDisabled}
                                  />

                                  {isCheckingLOT[
                                    batchEntryFormulatedProductId
                                  ] && (
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

                                  {/* Condition 1: Only show error icon if status is NOT "Accomplished" */}
                                  {selectedBatchStatus !== "Accomplished" &&
                                    lotValidation[batchEntryFormulatedProductId]
                                      ?.isValid === false &&
                                    !isCheckingLOT[
                                      batchEntryFormulatedProductId
                                    ] && (
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

                                  {/* Checkmark should still show even for "Accomplished" status */}
                                  {lotValidation[batchEntryFormulatedProductId]
                                    ?.isValid === true &&
                                    currentLot &&
                                    !isCheckingLOT[
                                      batchEntryFormulatedProductId
                                    ] && (
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

                                {/* Condition 2: Only show hasError validation message if status is NOT "Accomplished" */}
                                {selectedBatchStatus !== "Accomplished" &&
                                  hasError(
                                    `lot-${batchEntryFormulatedProductId}`,
                                  ) && (
                                    <div className="text-danger small">
                                      {
                                        validationErrors[
                                          `lot-${batchEntryFormulatedProductId}`
                                        ]
                                      }
                                    </div>
                                  )}

                                {/* Condition 3: Only show lotValidation error message if status is NOT "Accomplished" */}
                                {selectedBatchStatus !== "Accomplished" &&
                                  lotValidation[batchEntryFormulatedProductId]
                                    ?.isValid === false && (
                                    <div
                                      className="invalid-feedback d-block"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      {
                                        lotValidation[
                                          batchEntryFormulatedProductId
                                        ]?.message
                                      }
                                    </div>
                                  )}
                              </td>
                              <td className="text-center">
                                {isExpanded ? (
                                  <FaChevronUp className="text-primary" />
                                ) : (
                                  <FaChevronDown className="text-primary" />
                                )}
                              </td>
                            </tr>

                            {/* Expanded row with materials used */}
                            {isExpanded && (
                              <tr className="table-collapse">
                                <td colSpan="7" className="p-0">
                                  <div className="p-3 bg-light">
                                    <h6>Materials Used</h6>
                                    {materials.length > 0 ? (
                                      <table
                                        className="table table-sm table-bordered"
                                        style={{
                                          fontSize: "15px",
                                        }}
                                      >
                                        <thead>
                                          <tr>
                                            <th>Material Code</th>
                                            <th>Material Name</th>
                                            <th>Unit of Measure</th>
                                            <th>Category</th>
                                            <th>Current Stock (kg)</th>
                                            <th>Target Weight (kg)</th>
                                            <th>Status</th>
                                            <th className="text-center">
                                              Action
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {materials.map((material) => {
                                            const packaging =
                                              material.befmu_product_id
                                                ?.prod_packaging;
                                            const unitQuantity =
                                              packaging?.unit_quantity || 0;
                                            const totalStockValue =
                                              (packaging?.total_stock || 0) *
                                              (packaging?.unit_quantity || 0);
                                            const materialKey = `${batchEntryFormulatedProductId}-${material.id}`;
                                            const isMaterialExpanded =
                                              materialUsedExpandedRows.includes(
                                                materialKey,
                                              );
                                            const replacementHistory =
                                              materialUsedReplacementHistory[
                                                material.id
                                              ] || [];
                                            const isLoading =
                                              materialUsedLoading[material.id];

                                            return (
                                              <React.Fragment key={material.id}>
                                                <tr>
                                                  <td>
                                                    {material.befmu_product_id
                                                      ?.product_code || "N/A"}
                                                  </td>
                                                  <td>
                                                    {material.befmu_product_id
                                                      ?.product_name || "N/A"}
                                                  </td>
                                                  <td>
                                                    {packaging
                                                      ? `${
                                                          packaging.packaging_name
                                                        } - (${unitQuantity.toLocaleString(
                                                          "en-US",
                                                        )} ${packaging.unit})`
                                                      : "N/A"}
                                                  </td>
                                                  <td>
                                                    <span
                                                      className={`badge bg-${
                                                        material.category ===
                                                        "Vendor Product"
                                                          ? "primary"
                                                          : material.category ===
                                                              "Raw Product"
                                                            ? "warning text-dark"
                                                            : "success"
                                                      }`}
                                                    >
                                                      {material.category}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    {totalStockValue.toLocaleString(
                                                      "en-US",
                                                      {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 5,
                                                      },
                                                    )}
                                                  </td>
                                                  <td>
                                                    {(
                                                      material.target_weight ||
                                                      0
                                                    ).toLocaleString("en-US", {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 5,
                                                    })}
                                                  </td>
                                                  <td
                                                    className={`fw-semibold ${
                                                      material.status ===
                                                      "Original"
                                                        ? "text-primary"
                                                        : material.status ===
                                                            "Replaced"
                                                          ? "text-danger"
                                                          : material.status ===
                                                              "Additional"
                                                            ? "text-success"
                                                            : "text-primary"
                                                    }`}
                                                  >
                                                    {material.status ||
                                                      "Original"}
                                                  </td>
                                                  <td className="text-center">
                                                    <button
                                                      className="btn btn-sm btn-outline-primary me-2"
                                                      disabled
                                                    >
                                                      <i className="fa-solid fa-arrow-right-arrow-left"></i>
                                                    </button>
                                                    {/* Chevron button for replacement history */}
                                                    {material.isReplaced ===
                                                      true && (
                                                      <button
                                                        className={`btn btn-sm ${
                                                          isMaterialExpanded
                                                            ? "btn-secondary"
                                                            : "btn-outline-secondary"
                                                        }`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleMaterialUsedExpand(
                                                            material.id,
                                                            batchEntryFormulatedProductId,
                                                          );
                                                        }}
                                                        disabled={isLoading}
                                                      >
                                                        {isLoading ? (
                                                          <div
                                                            className="spinner-border spinner-border-sm"
                                                            role="status"
                                                          >
                                                            <span className="visually-hidden">
                                                              Loading...
                                                            </span>
                                                          </div>
                                                        ) : isMaterialExpanded ? (
                                                          <FaChevronUp />
                                                        ) : (
                                                          <FaChevronDown />
                                                        )}
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>

                                                {/* Replacement history row */}
                                                {isMaterialExpanded &&
                                                  material.isReplaced ===
                                                    true && (
                                                    <tr className="table-collapse">
                                                      <td
                                                        colSpan="8"
                                                        className="p-0"
                                                      >
                                                        <div className="p-3 bg-light">
                                                          <h6>
                                                            Replacement History
                                                          </h6>
                                                          {replacementHistory.length >
                                                          0 ? (
                                                            <table
                                                              className="table table-sm table-bordered"
                                                              style={{
                                                                fontSize:
                                                                  "14px",
                                                              }}
                                                            >
                                                              <thead>
                                                                <tr>
                                                                  <th>
                                                                    Product Code
                                                                  </th>
                                                                  <th>
                                                                    Product Name
                                                                    Name
                                                                  </th>

                                                                  <th>
                                                                    Category
                                                                  </th>

                                                                  <th>
                                                                    Status
                                                                  </th>
                                                                </tr>
                                                              </thead>
                                                              <tbody>
                                                                {replacementHistory.map(
                                                                  (
                                                                    replacement,
                                                                  ) => (
                                                                    <tr
                                                                      key={
                                                                        replacement.id
                                                                      }
                                                                      className="table-warning"
                                                                    >
                                                                      <td>
                                                                        {replacement
                                                                          .befrm_product_id
                                                                          ?.product_code ||
                                                                          "N/A"}
                                                                      </td>
                                                                      <td>
                                                                        {replacement
                                                                          .befrm_product_id
                                                                          ?.product_name ||
                                                                          "N/A"}
                                                                      </td>

                                                                      <td>
                                                                        {replacement
                                                                          .befrm_product_id
                                                                          ?.product_category ||
                                                                          "N/A"}
                                                                      </td>

                                                                      <td>
                                                                        <span className="badge bg-secondary">
                                                                          Replaced
                                                                        </span>
                                                                      </td>
                                                                    </tr>
                                                                  ),
                                                                )}
                                                              </tbody>
                                                            </table>
                                                          ) : (
                                                            <div className="text-center py-3">
                                                              {isLoading
                                                                ? "Loading replacement history..."
                                                                : "No replacement history found"}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="text-center py-3">
                                        Loading materials...
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleContainer>

          <CollapsibleContainer
            title="Costing"
            toggleSection={toggleSection}
            isOpen={isOpen}
          >
            <div
              className="container-fluid scrollable-contents pb-2"
              style={{
                minHeight: isOpen ? "300px" : "0px",
                maxHeight: isOpen ? "1000px" : "0px",
                overflowX: "hidden",
                overflowY: "auto",
                transition:
                  "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="mt-3 table-responsive">
                <table className="table">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Cost Name <span className="text-danger">*</span>
                      </th>
                      <th
                        className="text-muted"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Remarks
                      </th>
                      <th
                        className="text-muted"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        Cost Amount <span className="text-danger">*</span>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", width: "140px" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {costItems.length > 0 ? (
                      costItems.map((item) => {
                        const isDeleted = item.isDeleted;
                        const nameError = costItemErrors[`name-${item.id}`];
                        const amountError = costItemErrors[`amount-${item.id}`];

                        return (
                          <tr
                            key={item.id}
                            style={{
                              textDecoration: isDeleted
                                ? "line-through"
                                : "none",
                              opacity: isDeleted ? 0.6 : 1,
                            }}
                          >
                            <td>
                              <input
                                type="text"
                                className={`form-control ${
                                  nameError ? "border-danger" : ""
                                }`}
                                value={item.name}
                                onChange={(e) =>
                                  handleCostItemChange(
                                    item.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                disabled={isDeleted || allDisabled}
                                placeholder="Enter cost name"
                              />
                              {nameError && (
                                <div className="text-danger small mt-1">
                                  {nameError}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={item.remarks}
                                onChange={(e) =>
                                  handleCostItemChange(
                                    item.id,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                                disabled={isDeleted || allDisabled}
                                placeholder="Enter remarks"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={`form-control ${
                                  amountError ? "border-danger" : ""
                                }`}
                                value={item.amount ?? ""} // default new item = empty
                                onFocus={(e) => {
                                  // don’t clear if it’s already empty
                                  if (e.target.value === "0.00") {
                                    handleCostItemChange(item.id, "amount", "");
                                  }
                                  handleCostItemChange(
                                    item.id,
                                    "isEditing",
                                    true,
                                  );
                                }}
                                onChange={(e) => {
                                  const parsed = parseAmountInput(
                                    e.target.value,
                                  );
                                  handleCostItemChange(
                                    item.id,
                                    "amount",
                                    parsed,
                                  );
                                }}
                                onBlur={(e) => {
                                  // Remove commas before parsing
                                  const cleanValue = e.target.value.replace(
                                    /,/g,
                                    "",
                                  );
                                  let numValue = parseFloat(cleanValue);

                                  // If empty or invalid, set to empty string
                                  if (isNaN(numValue)) {
                                    handleCostItemChange(item.id, "amount", "");
                                  } else {
                                    const formatted = formatAmount(numValue);
                                    handleCostItemChange(
                                      item.id,
                                      "amount",
                                      formatted,
                                    );
                                  }

                                  handleCostItemChange(
                                    item.id,
                                    "isEditing",
                                    false,
                                  );
                                }}
                                disabled={isDeleted || allDisabled}
                                placeholder="Enter Amount"
                                maxLength={20}
                              />
                              {amountError && (
                                <div className="text-danger small mt-1">
                                  {amountError}
                                </div>
                              )}
                            </td>

                            <td className="text-center">
                              {isDeleted ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => undoDeleteCostItem(item.id)}
                                  title="Undo delete"
                                >
                                  <i className="fa-solid fa-undo"></i>
                                </Button>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    removeCostItem(item.id, item.isNew)
                                  }
                                  title="Delete item"
                                  disabled={allDisabled}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No cost items added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="text-end fw-bold">
                        Total Cost:
                      </td>
                      <td className="fw-bold px-3">
                        {formatAmountDisplay(totalCost)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <div className="text-end mt-3">
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={addCostItem}
                    disabled={allDisabled}
                  >
                    <i className="fa-solid fa-plus me-1"></i> New Item
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleContainer>

          <div className="container-fluid mt-4">
            <div className="row mx-auto">
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm d-flex flex-row gap-3">
                <button
                  className="btn btn-outline-secondary w-100"
                  // onClick={() => {
                  //   navigate("/inventory/batch-entry");
                  //   window.scrollTo(0, 0);
                  // }}
                  onClick={handleGoBack}
                >
                  Cancel
                </button>
                {/* Update Button - Only show if user has edit permission */}
                {authrztn.includes("BatchEntry-Edit") && (
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleUpdate}
                    disabled={
                      isUpdating ||
                      updateDisabled ||
                      (isUpdating
                        ? false
                        : Object.keys(validationErrors).length > 0)
                    }
                  >
                    {isUpdating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Updating...
                      </>
                    ) : (
                      <>Update</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
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

export default ViewBatchEntry;
