import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Card, Tab, Tabs } from "react-bootstrap";
import swal from "sweetalert";
import axios from "axios";

import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { useSort } from "../../../hooks/customHook/tableSort"; // adjust path accordingly

import Select, { components } from "react-select";
import AsyncSelect from "react-select/async";

import { v4 as uuidv4 } from "uuid";

// collapsible container
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";

import "../../../assets/css/lionchem.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CreateBatchEntry = ({ authrztn, roleType }) => {
  // resets
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // for form fields
  // form values
  const userLoggedID = useDecodeToken();
  const [batchTitle, setBatchTitle] = useState("");
  const [status, setStatus] = useState("For-Printing");
  const [remarks, setRemarks] = useState("");
  const [selectedDeliveryReceipt, setSelectedDeliveryReceipt] = useState([]);
  const [selectedFinishedProduct, setSelectedFinishedProduct] = useState([]);

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

  // Custom Option component
  const CustomOption = ({ children, ...props }) => {
    // Determine which options and selected values to use based on the select type
    let allSelected;
    let isSelectAll;

    // Check if this is for delivery receipts
    if (props.selectProps.id === "deliveryReceipt") {
      isSelectAll = props.data.value === "SELECT_ALL_DR";
      allSelected =
        selectedDeliveryReceipts.length === deliveryReceiptOptions.length;
    }
    // Check if this is for finished products
    else if (props.selectProps.id === "finishedProduct") {
      isSelectAll = props.data.value === "SELECT_ALL_FP";
      allSelected =
        selectedFinishedProducts.length === finishedProductOptions.length;
    }
    // Default case (for mixers)
    else {
      isSelectAll = props.data.value === "SELECT_ALL";
      allSelected = selectedMixers.length === mixerOptions.length;
    }

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

  // Fetch mixer data
  const fetchMixerData = async () => {
    setIsMixerLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/BatchEntry2/fetchMixerData`);
      const options = res.data.map((mixer) => ({
        value: mixer.id,
        label: mixer.name,
        ...mixer,
      }));
      setMixerOptions(options);
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load mixers", "error");
    } finally {
      setIsMixerLoading(false);
    }
  };

  // delivery receipt fetch
  const [deliveryReceiptOptions, setDeliveryReceiptOptions] = useState([]); // Changed from deliveryReceiptData
  const [selectedDeliveryReceipts, setSelectedDeliveryReceipts] = useState([]); // Changed from selectedDeliveryReceipt
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
  // Fetch delivery receipt data - updated version
  const fetchDeliveryReceiptData = async () => {
    setIsDeliveryReceiptLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/BatchEntry2/fetchDeliveryReceiptData`,
      );

      // Get used products to filter DRs
      const usedProductsRes = await axios.get(
        `${BASE_URL}/BatchEntry2/fetchProductFromDeliveryReceiptData`,
        {
          params: {
            sales_invoice_ids: res.data
              .map((dr) => dr.sales_invoice_id)
              .join(","),
          },
        },
      );

      // Get invoices that have available products
      const availableInvoiceIds = [
        ...new Set(
          usedProductsRes.data.map((product) => product.sales_invoice_id),
        ),
      ];

      // Filter DRs to only show those with available products
      const availableDRs = res.data.filter((dr) =>
        availableInvoiceIds.includes(dr.sales_invoice_id),
      );

      const options = availableDRs.map((dr) => ({
        value: dr.sales_invoice_id,
        label: dr.delivery_number,
        ...dr,
      }));

      setDeliveryReceiptOptions(options);
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
        `${BASE_URL}/BatchEntry2/fetchProductFromDeliveryReceiptData`,
        {
          params: {
            sales_invoice_ids: deliveryReceiptIds.join(","),
          },
        },
      );

      const options = res.data.map((product) => ({
        value: product.id,
        label: `${product.sales_invoice.delivery_number || "N/A"} - ${
          product.product_list?.product_name || "Unknown Product"
        }`,
        ...product,
      }));

      setFinishedProductOptions(options);
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load finished products", "error");
    } finally {
      setIsFinishedProductLoading(false);
    }
  };

  // collapsible
  const { toggleSection, isOpen } = useCollapsibleSections();

  // filter
  // invoice list
  // const [invoicePaginationUrl, setInvoicePaginationUrl] = useState(
  //   BASE_URL + "/BatchEntry2/fetchInvoiceData"
  // );
  // const invoicePagination = useServerPagination(invoicePaginationUrl, 10);

  // const [invoiceSearchText, setInvoiceSearchText] = useState("");
  // const [invoiceSearchCategory, setInvoiceSearchCategory] = useState("all");

  // const invoiceHandleSearch = (value) => {
  //   setInvoiceSearchText(value);
  //   console.log("Invoice Search Text:", value); // Added console.log
  //   invoiceUpdateSearchParams(value, invoiceSearchCategory);
  // };

  // const invoiceUpdateSearchParams = (text, category) => {
  //   // Keep the URL setting but comment out the actual pagination update
  //   setInvoicePaginationUrl(BASE_URL + "/BatchEntry2/fetchInvoiceDataFiltered");

  //   const params = {};

  //   if (text) {
  //     params.invoiceSearchText = text;
  //   }

  //   if (category && category !== "all") {
  //     params.invoiceSearchCategory = category;
  //   }

  //   console.log("Invoice Search Params:", params); // Log params instead of using them
  //   // invoicePagination.updateParams(params); // Commented out
  // };

  // material list
  // const [materialPaginationUrl, setMaterialPaginationUrl] = useState(
  //   BASE_URL + "/BatchEntry2/fetchMaterialData"
  // );
  // const materialPagination = useServerPagination(materialPaginationUrl, 10);

  // const [materialSearchText, setMaterialSearchText] = useState("");
  // const [materialSearchCategory, setMaterialSearchCategory] = useState("all");

  // const materialHandleSearch = (value) => {
  //   setMaterialSearchText(value); // Fixed: was setInvoiceSearchText
  //   console.log("Material Search Text:", value); // Added console.log
  //   materialUpdateSearchParams(value, materialSearchCategory);
  // };

  // const materialUpdateSearchParams = (text, category) => {
  //   // Keep the URL setting but comment out the actual pagination update
  //   setMaterialPaginationUrl(
  //     BASE_URL + "/BatchEntry2/fetchMaterialDataFiltered"
  //   );

  //   const params = {};

  //   if (text) {
  //     params.materialSearchText = text;
  //   }

  //   if (category && category !== "all") {
  //     params.materialSearchCategory = category;
  //   }

  //   console.log("Material Search Params:", params); // Log params instead of using them
  //   // materialPagination.updateParams(params); // Commented out
  // };

  // for invoice list container
  const [invoiceListData, setInvoiceListData] = useState([]);

  // Function to fetch invoice list data
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

  // for invoice list collapsible
  // finished product
  // Track expanded invoice rows
  const [expandedRows, setExpandedRows] = useState([]);
  const [invoiceProducts, setInvoiceProducts] = useState({});

  // Toggle row expansion
  const toggleRowExpand = async (invoiceId) => {
    // Toggle expansion state
    setExpandedRows((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId],
    );

    // Always fetch fresh data when expanding to ensure it's up-to-date
    if (!expandedRows.includes(invoiceId)) {
      // Only fetch if we're expanding (not collapsing)
      try {
        const res = await axios.get(
          `${BASE_URL}/BatchEntry2/fetchProductFromDeliveryReceiptData`,
          {
            params: {
              sales_invoice_ids: invoiceId,
            },
          },
        );

        // Filter products based on selected finished products
        const filteredProducts = res.data.filter((product) =>
          selectedFinishedProducts.some(
            (selected) => selected.value === product.id,
          ),
        );

        setInvoiceProducts((prev) => ({
          ...prev,
          [invoiceId]: filteredProducts,
        }));
      } catch (error) {
        console.error(error);
        swal("Error", "Failed to load products for this invoice", "error");
      }
    }
  };

  // lot data
  const validateLot = (productKey) => {
    const lotInput = document.querySelector(
      `input[data-lot-key="${productKey}"]`,
    );
    if (lotInput?.value?.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`lot-${productKey}`];
        return newErrors;
      });
    }
  };

  const [lotNumbers, setLotNumbers] = useState({});

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Format amount helper
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // used finished product
  const [expandedFormulatedProducts, setExpandedFormulatedProducts] = useState(
    [],
  );
  const [formulatedProductRawMaterials, setFormulatedProductRawMaterials] =
    useState({});

  const fetchRawMaterialsForFormulatedProduct = async (
    productId,
    salesProductTagId,
  ) => {
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

      // Add UUID to each material for unique identification
      const materialsWithUUID = (res.data || []).map((material) => ({
        ...material,
        uuid: uuidv4(), // Add unique identifier
        originalUUID: uuidv4(), // Store original UUID for tracking
      }));

      return materialsWithUUID;
    } catch (error) {
      console.error(error);
      swal("Error", "Failed to load raw materials for this product", "error");
      return [];
    }
  };

  const toggleFormulatedProductExpand = async (
    productId,
    salesProductTagId,
  ) => {
    // Create a unique key combining both IDs
    const productKey = `${productId}-${salesProductTagId}`;

    // Toggle expansion state
    setExpandedFormulatedProducts((prev) =>
      prev.includes(productKey)
        ? prev.filter((id) => id !== productKey)
        : [...prev, productKey],
    );

    // If not already fetched, get raw materials for this product
    if (!formulatedProductRawMaterials[productKey]) {
      const rawMaterials = await fetchRawMaterialsForFormulatedProduct(
        productId,
        salesProductTagId,
      );
      setFormulatedProductRawMaterials((prev) => ({
        ...prev,
        [productKey]: rawMaterials,
      }));
    }
  };

  // material list container
  // function for fetching formulated products
  const [materialListData, setMaterialListData] = useState([]);
  const [expandedMaterialProducts, setExpandedMaterialProducts] = useState([]);
  const [materialProductRawMaterials, setMaterialProductRawMaterials] =
    useState({});

  // target weight
  const [targetWeights, setTargetWeights] = useState({});

  const formatTargetWeight = (value, occurrences = 1) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Handle multiple decimal points - keep only the first one
    const decimalIndex = cleanValue.indexOf(".");
    let processedValue = cleanValue;

    if (decimalIndex !== -1) {
      const beforeDecimal = cleanValue.substring(0, decimalIndex + 1);
      const afterDecimal = cleanValue
        .substring(decimalIndex + 1)
        .replace(/\./g, "");
      processedValue = beforeDecimal + afterDecimal;
    }

    // Split into integer and decimal parts
    const parts = processedValue.split(".");
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : "";

    // Add commas to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Limit decimal to 5 places
    const limitedDecimal = decimalPart.slice(0, 5);

    // Combine parts
    let result =
      decimalPart !== "" || processedValue.includes(".")
        ? `${integerPart}.${limitedDecimal}`
        : integerPart;

    // Multiply by occurrences for display
    if (result && occurrences > 1) {
      const numericValue = parseFloat(result.replace(/,/g, ""));
      if (!isNaN(numericValue)) {
        result = (numericValue * occurrences).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 5,
        });
      }
    }

    return result;
  };

  // Add this function to handle target weight changes
  const handleTargetWeightChange = (uniqueKey, value, occurrences = 1) => {
    const formattedValue = formatTargetWeight(value);

    // Calculate the base weight (divided by occurrences for editing)
    const baseWeight = formattedValue
      ? (parseFloat(formattedValue.replace(/,/g, "")) / occurrences).toString()
      : "0";

    setTargetWeights((prev) => ({
      ...prev,
      [uniqueKey]: {
        baseValue: baseWeight,
        displayValue: formattedValue,
        occurrences: occurrences,
      },
    }));
  };

  // Add this function to process and merge formulated products
  const processFormulatedProducts = (products) => {
    const mergedProducts = {};

    products.forEach((product) => {
      const productId = product.product_id;

      if (!mergedProducts[productId]) {
        // First occurrence of this product
        mergedProducts[productId] = {
          ...product,
          totalWeight: calculateProductWeight(product),
          occurrences: 1,
        };
      } else {
        // Merge with existing product
        const existing = mergedProducts[productId];
        mergedProducts[productId] = {
          ...existing,
          totalWeight: existing.totalWeight + calculateProductWeight(product),
          occurrences: existing.occurrences + 1,
        };
      }
    });

    return Object.values(mergedProducts);
  };

  // Helper function to calculate product weight
  const calculateProductWeight = (product) => {
    if (
      product.quantity &&
      product.product_list?.prod_packaging?.unit_quantity
    ) {
      return (
        product.quantity * product.product_list.prod_packaging.unit_quantity
      );
    }
    return 0;
  };

  // Add this function to calculate the multiplied target weight
  const calculateMultipliedTargetWeight = (material, occurrences) => {
    const uniqueKey = material.vendor_id
      ? `${material.vendor_id}-${material.product_id}`
      : material.product_id;

    const targetWeightData = targetWeights[uniqueKey];

    if (targetWeightData) {
      const baseValue =
        parseFloat(targetWeightData.baseValue.replace(/,/g, "")) || 0;
      return baseValue * occurrences;
    }

    // Fallback to original target_weight if no custom value set
    const targetWeight = parseFloat(material.target_weight) || 0;
    return targetWeight * occurrences;
  };

  const toggleMaterialProductExpand = async (productId, salesProductTagId) => {
    // Create a unique key combining both IDs
    const productKey = `${productId}-${salesProductTagId}`;

    // Toggle expansion state
    setExpandedMaterialProducts((prev) =>
      prev.includes(productKey)
        ? prev.filter((id) => id !== productKey)
        : [...prev, productKey],
    );

    // If not already fetched, get raw materials for this product
    if (!materialProductRawMaterials[productKey]) {
      const rawMaterials = await fetchRawMaterialsForFormulatedProduct(
        productId,
        salesProductTagId,
      );
      setMaterialProductRawMaterials((prev) => ({
        ...prev,
        [productKey]: rawMaterials,
      }));
    }
  };

  // material list modal for adding with fetching
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  const [selectedFormulatedProduct, setSelectedFormulatedProduct] =
    useState(null);
  const [vendorMaterials, setVendorMaterials] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedMaterials, setFinishedMaterials] = useState([]);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [isRawLoading, setIsRawLoading] = useState(false);
  const [isFinishedLoading, setIsFinishedLoading] = useState(false);

  // Vendor materials pagination
  // const [vendorPaginationUrl, setVendorPaginationUrl] = useState(
  //   BASE_URL + "/BatchEntry2/fetchVendorMaterial"
  // );
  // const vendorPagination = useServerPagination(vendorPaginationUrl, 10);

  // Raw materials pagination
  const [rawPaginationUrl, setRawPaginationUrl] = useState(
    BASE_URL + "/BatchEntry2/fetchRawMaterial",
  );
  const rawPagination = useServerPagination(rawPaginationUrl, 10);

  // Finished materials pagination
  const [finishedPaginationUrl, setFinishedPaginationUrl] = useState(
    BASE_URL + "/BatchEntry2/fetchFinishedMaterial",
  );
  const finishedPagination = useServerPagination(finishedPaginationUrl, 10);

  // Update the handleAddMaterialModalShow function
  const handleAddMaterialModalShow = async (product) => {
    setSelectedFormulatedProduct(product);
    setShowAddMaterialModal(true);

    // Fetch materials when modal opens
    // await fetchVendorMaterials(product.product_id);
    await fetchRawMaterials(product.product_id);
    await fetchFinishedMaterials(product.product_id);

    // Identify already selected materials for this product
    const productKey = `${product.product_id}-${product.id}`;
    const currentMaterials = materialProductRawMaterials[productKey] || [];

    // Create sets of already selected items
    const vendorSelected = {};
    const rawSelected = {};
    const finishedSelected = {};

    currentMaterials.forEach((material) => {
      if (material.category === "Vendor Product") {
        const uniqueKey = `${material.vendor_id}-${material.product_id}`;
        vendorSelected[uniqueKey] = true;
      } else if (material.category === "Raw Product") {
        const uniqueKey = `${material.product_id}`;
        rawSelected[uniqueKey] = true;
      } else if (material.category === "Finished Product") {
        const uniqueKey = `${material.product_id}`;
        finishedSelected[uniqueKey] = true;
      }
    });

    setAlreadySelectedVendorItems(vendorSelected);
    setAlreadySelectedRawItems(rawSelected);
    setAlreadySelectedFinishedItems(finishedSelected);

    // Initialize selection state with already selected items
    setVendorSelectedItems(vendorSelected);
    setRawSelectedItems(rawSelected);
    setFinishedSelectedItems(finishedSelected);
  };

  // Add these fetch functions
  // const fetchVendorMaterials = async (productId) => {
  //   setIsVendorLoading(true);
  //   setVendorPaginationUrl(
  //     `${BASE_URL}/BatchEntry2/fetchVendorMaterial?formulatedProductId=${productId}`
  //   );
  //   await vendorPagination.updateParams({ formulatedProductId: productId });
  //   setIsVendorLoading(false);
  // };

  const fetchRawMaterials = async (productId) => {
    setIsRawLoading(true);
    setRawPaginationUrl(
      `${BASE_URL}/BatchEntry2/fetchRawMaterial?formulatedProductId=${productId}`,
    );
    await rawPagination.updateParams({ formulatedProductId: productId });
    setIsRawLoading(false);
  };

  const fetchFinishedMaterials = async (productId) => {
    setIsFinishedLoading(true);
    setFinishedPaginationUrl(
      `${BASE_URL}/BatchEntry2/fetchFinishedMaterial?formulatedProductId=${productId}`,
    );
    await finishedPagination.updateParams({ formulatedProductId: productId });
    setIsFinishedLoading(false);
  };

  // material list for additional product
  const [vendorSelectedItems, setVendorSelectedItems] = useState({});
  const [rawSelectedItems, setRawSelectedItems] = useState({});
  const [finishedSelectedItems, setFinishedSelectedItems] = useState({});
  const [vendorSelectAll, setVendorSelectAll] = useState(false);
  const [rawSelectAll, setRawSelectAll] = useState(false);
  const [finishedSelectAll, setFinishedSelectAll] = useState(false);

  // Add this state to track replacement history
  const [replacementHistory, setReplacementHistory] = useState({});

  // Add state to track which items are already selected in the formulation
  const [alreadySelectedVendorItems, setAlreadySelectedVendorItems] = useState(
    {},
  );
  const [alreadySelectedRawItems, setAlreadySelectedRawItems] = useState({});
  const [alreadySelectedFinishedItems, setAlreadySelectedFinishedItems] =
    useState({});

  // Add these functions for handling selection
  const handleVendorSelectAll = (currentPageData) => {
    const newSelected = { ...vendorSelectedItems };
    let allSelected = true;

    // First check current state to determine what to do
    currentPageData.forEach((item) => {
      const uniqueKey = `${item.vendor_id}-${item.product_id}`;

      if (alreadySelectedVendorItems[uniqueKey]) {
        // For already selected items, check if any are not marked for removal
        if (newSelected[uniqueKey] !== false) {
          allSelected = false;
        }
      } else {
        // For new items, check if any are not selected
        if (!newSelected[uniqueKey]) {
          allSelected = false;
        }
      }
    });

    // Toggle based on current state
    const shouldSelectAll = !allSelected;

    currentPageData.forEach((item) => {
      const uniqueKey = `${item.vendor_id}-${item.product_id}`;

      if (alreadySelectedVendorItems[uniqueKey]) {
        // For already selected items, mark for removal if unselecting all
        newSelected[uniqueKey] = shouldSelectAll ? false : true;
      } else {
        // For new items, select/deselect normally
        newSelected[uniqueKey] = shouldSelectAll;
      }
    });

    setVendorSelectedItems(newSelected);
    setVendorSelectAll(shouldSelectAll);
  };

  const handleVendorItemSelect = (uniqueKey) => {
    setVendorSelectedItems((prev) => {
      const newState = { ...prev };

      if (alreadySelectedVendorItems[uniqueKey]) {
        // Toggle removal state for already selected items
        newState[uniqueKey] = newState[uniqueKey] === false ? true : false;
      } else {
        // Toggle selection for new items
        newState[uniqueKey] = !prev[uniqueKey];
      }

      return newState;
    });
  };

  // Similar functions for raw and finished materials
  const handleRawSelectAll = (currentPageData) => {
    const newSelected = { ...rawSelectedItems };
    let allSelected = true;

    currentPageData.forEach((item) => {
      const uniqueKey = `${item.product_id}`;

      if (alreadySelectedRawItems[uniqueKey]) {
        if (newSelected[uniqueKey] !== false) {
          allSelected = false;
        }
      } else {
        if (!newSelected[uniqueKey]) {
          allSelected = false;
        }
      }
    });

    const shouldSelectAll = !allSelected;

    currentPageData.forEach((item) => {
      const uniqueKey = `${item.product_id}`;

      if (alreadySelectedRawItems[uniqueKey]) {
        newSelected[uniqueKey] = shouldSelectAll ? false : true;
      } else {
        newSelected[uniqueKey] = shouldSelectAll;
      }
    });

    setRawSelectedItems(newSelected);
    setRawSelectAll(shouldSelectAll);
  };

  const handleRawItemSelect = (uniqueKey) => {
    setRawSelectedItems((prev) => {
      const newState = { ...prev };

      if (alreadySelectedRawItems[uniqueKey]) {
        newState[uniqueKey] = newState[uniqueKey] === false ? true : false;
      } else {
        newState[uniqueKey] = !prev[uniqueKey];
      }

      return newState;
    });
  };

  const handleFinishedItemSelect = (uniqueKey) => {
    setFinishedSelectedItems((prev) => {
      const newState = { ...prev };

      if (alreadySelectedFinishedItems[uniqueKey]) {
        newState[uniqueKey] = newState[uniqueKey] === false ? true : false;
      } else {
        newState[uniqueKey] = !prev[uniqueKey];
      }

      return newState;
    });
  };

  const handleFinishedSelectAll = (currentPageData) => {
    const newSelected = { ...finishedSelectedItems };
    let allSelected = true;

    currentPageData.forEach((item) => {
      const uniqueKey = `${item.product_id}`;

      if (alreadySelectedFinishedItems[uniqueKey]) {
        if (newSelected[uniqueKey] !== false) {
          allSelected = false;
        }
      } else {
        if (!newSelected[uniqueKey]) {
          allSelected = false;
        }
      }
    });

    const shouldSelectAll = !allSelected;

    currentPageData.forEach((item) => {
      const uniqueKey = `${item.product_id}`;

      if (alreadySelectedFinishedItems[uniqueKey]) {
        newSelected[uniqueKey] = shouldSelectAll ? false : true;
      } else {
        newSelected[uniqueKey] = shouldSelectAll;
      }
    });

    setFinishedSelectedItems(newSelected);
    setFinishedSelectAll(shouldSelectAll);
  };

  const handleAddMaterialsSubmit = () => {
    if (!selectedFormulatedProduct) return;

    const productKey = `${selectedFormulatedProduct.product_id}-${selectedFormulatedProduct.id}`;
    const currentMaterials = materialProductRawMaterials[productKey] || [];

    // Process removals for all material types
    const materialsToRemove = [];

    // Vendor materials to remove
    Object.keys(alreadySelectedVendorItems).forEach((key) => {
      if (alreadySelectedVendorItems[key] && !vendorSelectedItems[key]) {
        materialsToRemove.push({ type: "vendor", key });
      }
    });

    // Raw materials to remove
    Object.keys(alreadySelectedRawItems).forEach((key) => {
      if (alreadySelectedRawItems[key] && !rawSelectedItems[key]) {
        materialsToRemove.push({ type: "raw", key });
      }
    });

    // Finished materials to remove
    Object.keys(alreadySelectedFinishedItems).forEach((key) => {
      if (alreadySelectedFinishedItems[key] && !finishedSelectedItems[key]) {
        materialsToRemove.push({ type: "finished", key });
      }
    });

    // Process additions (newly selected items)
    // const selectedVendorMaterials = vendorPagination.data.filter((material) => {
    //   const uniqueKey = `${material.vendor_id}-${material.product_id}`;
    //   return (
    //     vendorSelectedItems[uniqueKey] && !alreadySelectedVendorItems[uniqueKey]
    //   );
    // });

    const selectedRawMaterials = rawPagination.data.filter((material) => {
      const uniqueKey = `${material.product_id}`;
      return rawSelectedItems[uniqueKey] && !alreadySelectedRawItems[uniqueKey];
    });

    const selectedFinishedMaterials = finishedPagination.data.filter(
      (material) => {
        const uniqueKey = `${material.product_id}`;
        return (
          finishedSelectedItems[uniqueKey] &&
          !alreadySelectedFinishedItems[uniqueKey]
        );
      },
    );

    // Filter out materials that are marked for removal
    const remainingMaterials = currentMaterials.filter((material) => {
      if (material.category === "Vendor Product") {
        const uniqueKey = `${material.vendor_id}-${material.product_id}`;
        return !materialsToRemove.some(
          (removal) => removal.type === "vendor" && removal.key === uniqueKey,
        );
      } else if (material.category === "Raw Product") {
        const uniqueKey = `${material.product_id}`;
        return !materialsToRemove.some(
          (removal) => removal.type === "raw" && removal.key === uniqueKey,
        );
      } else if (material.category === "Finished Product") {
        const uniqueKey = `${material.product_id}`;
        return !materialsToRemove.some(
          (removal) => removal.type === "finished" && removal.key === uniqueKey,
        );
      }
      return true;
    });

    // Transform new materials to match the format with UUIDs
    // const additionalVendorMaterials = selectedVendorMaterials.map(
    //   (material) => ({
    //     ...material,
    //     uuid: uuidv4(), // Add UUID for new materials
    //     originalUUID: uuidv4(),
    //     status: "Additional",
    //     isAdditional: true,
    //     target_weight: material.targetWeight || 0,
    //     category: "Vendor Product",
    //     formulated_product_id: selectedFormulatedProduct.product_id,
    //     instruction: material.instruction || null,
    //   })
    // );

    const additionalRawMaterials = selectedRawMaterials.map((material) => ({
      ...material,
      uuid: uuidv4(), // Add UUID for new materials
      originalUUID: uuidv4(),
      status: "Additional",
      isAdditional: true,
      target_weight: material.targetWeight || 0,
      category: "Raw Product",
      formulated_product_id: selectedFormulatedProduct.product_id,
      instruction: material.instruction || null,
    }));

    const additionalFinishedMaterials = selectedFinishedMaterials.map(
      (material) => ({
        ...material,
        uuid: uuidv4(), // Add UUID for new materials
        originalUUID: uuidv4(),
        status: "Additional",
        isAdditional: true,
        target_weight: material.targetWeight || 0,
        category: "Finished Product",
        formulated_product_id: selectedFormulatedProduct.product_id,
        instruction: material.instruction || null,
      }),
    );

    // Combine all additional materials
    const allAdditionalMaterials = [
      // ...additionalVendorMaterials,
      ...additionalRawMaterials,
      ...additionalFinishedMaterials,
    ];

    // Update the material list
    setMaterialProductRawMaterials((prev) => ({
      ...prev,
      [productKey]: [...remainingMaterials, ...allAdditionalMaterials],
    }));

    handleAddMaterialModalClose();
    resetSelections();
  };

  const resetSelections = () => {
    setVendorSelectedItems({});
    setRawSelectedItems({});
    setFinishedSelectedItems({});
    setVendorSelectAll(false);
    setRawSelectAll(false);
    setFinishedSelectAll(false);
    setAlreadySelectedVendorItems({});
    setAlreadySelectedRawItems({});
    setAlreadySelectedFinishedItems({});
  };

  const handleAddMaterialModalClose = () => {
    setShowAddMaterialModal(false);
  };

  // for changing modal

  const [showChangeMaterialModal, setShowChangeMaterialModal] = useState(false);
  const [selectedMaterialToReplace, setSelectedMaterialToReplace] =
    useState(null);
  const [replacementVendorMaterials, setReplacementVendorMaterials] = useState(
    [],
  );
  const [replacementRawMaterials, setReplacementRawMaterials] = useState([]);
  const [replacementFinishedMaterials, setReplacementFinishedMaterials] =
    useState([]);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [isReplacementVendorLoading, setIsReplacementVendorLoading] =
    useState(false);
  const [isReplacementRawLoading, setIsReplacementRawLoading] = useState(false);
  const [isReplacementFinishedLoading, setIsReplacementFinishedLoading] =
    useState(false);

  // Pagination for replacement materials
  const [replacementVendorPaginationUrl, setReplacementVendorPaginationUrl] =
    useState(BASE_URL + "/BatchEntry2/fetchVendorMaterialReplace");
  const replacementVendorPagination = useServerPagination(
    replacementVendorPaginationUrl,
    10,
  );

  const [replacementRawPaginationUrl, setReplacementRawPaginationUrl] =
    useState(BASE_URL + "/BatchEntry2/fetchRawMaterialReplace");
  const replacementRawPagination = useServerPagination(
    replacementRawPaginationUrl,
    10,
  );

  const [
    replacementFinishedPaginationUrl,
    setReplacementFinishedPaginationUrl,
  ] = useState(BASE_URL + "/BatchEntry2/fetchFinishedMaterialReplace");
  const replacementFinishedPagination = useServerPagination(
    replacementFinishedPaginationUrl,
    10,
  );

  // Fetch replacement materials
  const fetchReplacementMaterials = async (material) => {
    setSelectedMaterialToReplace(material);

    // Set the current material as the initially selected replacement
    setSelectedReplacement({
      ...material,
      replacementCategory: material.category,
      isCurrentMaterial: true,
    });

    // Fetch vendor materials
    setIsReplacementVendorLoading(true);
    try {
      const vendorParams = {
        productId: material.product_id,
        category: material.category,
      };

      if (material.vendor_id) {
        vendorParams.vendorId = material.vendor_id;
      }

      setReplacementVendorPaginationUrl(
        `${BASE_URL}/BatchEntry2/fetchVendorMaterialReplace`,
      );
      // Wait for the data to be fetched
      await replacementVendorPagination.updateParams(vendorParams);
      setReplacementVendorMaterials(replacementVendorPagination.data);
    } catch (error) {
      console.error("Error fetching vendor replacement materials:", error);
    } finally {
      setIsReplacementVendorLoading(false);
    }

    // Fetch raw materials
    setIsReplacementRawLoading(true);
    try {
      const rawParams = {
        productId: material.product_id,
        category: material.category,
      };

      setReplacementRawPaginationUrl(
        `${BASE_URL}/BatchEntry2/fetchRawMaterialReplace`,
      );
      // Wait for the data to be fetched
      await replacementRawPagination.updateParams(rawParams);
      setReplacementRawMaterials(replacementRawPagination.data);
    } catch (error) {
      console.error("Error fetching raw replacement materials:", error);
    } finally {
      setIsReplacementRawLoading(false);
    }

    // Fetch finished materials
    setIsReplacementFinishedLoading(true);
    try {
      const finishedParams = {
        productId: material.product_id,
        category: material.category,
      };

      setReplacementFinishedPaginationUrl(
        `${BASE_URL}/BatchEntry2/fetchFinishedMaterialReplace`,
      );
      // Wait for the data to be fetched
      await replacementFinishedPagination.updateParams(finishedParams);
      setReplacementFinishedMaterials(replacementFinishedPagination.data);
    } catch (error) {
      console.error("Error fetching finished replacement materials:", error);
    } finally {
      setIsReplacementFinishedLoading(false);
    }
  };

  // onclick changing modal
  const handleChangeMaterialModalShow = async (product, material) => {
    setShowChangeMaterialModal(true);
    await fetchReplacementMaterials(material);
  };

  const handleReplacementSelect = (material, category) => {
    setSelectedReplacement({
      ...material,
      replacementCategory: category,
    });
  };

  const handleReplaceMaterial = () => {
    if (!selectedReplacement || !selectedMaterialToReplace) {
      console.log("Missing selectedReplacement or selectedMaterialToReplace");
      console.log("selectedReplacement:", selectedReplacement);
      console.log("selectedMaterialToReplace:", selectedMaterialToReplace);
      return;
    }

    console.log("=== STARTING REPLACEMENT PROCESS ===");
    console.log("Selected material to replace:", selectedMaterialToReplace);
    console.log("Selected replacement:", selectedReplacement);

    // Find the correct product key using UUID
    const allProductKeys = Object.keys(materialProductRawMaterials);
    console.log("All product keys:", allProductKeys);

    let correctProductKey = null;
    let foundMaterialDetails = null;

    for (const key of allProductKeys) {
      const materials = materialProductRawMaterials[key];
      console.log(`Checking key ${key}:`, materials);

      if (Array.isArray(materials)) {
        // Use UUID to find the exact material
        const foundMaterial = materials.find(
          (material) => material.uuid === selectedMaterialToReplace.uuid,
        );

        if (foundMaterial) {
          correctProductKey = key;
          foundMaterialDetails = foundMaterial;
          console.log("FOUND MATERIAL in key:", key, foundMaterial);
          break;
        }
      }
    }

    if (!correctProductKey) {
      console.error("Could not find the material in any product key");
      console.log(
        "Searching for material with UUID:",
        selectedMaterialToReplace.uuid,
      );
      swal("Error", "Could not find the material to replace", "error");
      return;
    }

    console.log("Found correct product key:", correctProductKey);
    console.log("Found material details:", foundMaterialDetails);

    // Get the current target weight for the material being replaced
    const originalUniqueKey = selectedMaterialToReplace.vendor_id
      ? `${selectedMaterialToReplace.vendor_id}-${selectedMaterialToReplace.product_id}`
      : selectedMaterialToReplace.product_id;

    const currentTargetWeight = targetWeights[originalUniqueKey] || "0";

    // Update the state
    setMaterialProductRawMaterials((prev) => {
      console.log("Previous state:", prev);
      const currentMaterials = prev[correctProductKey] || [];
      console.log("Current materials for this product:", currentMaterials);

      // Map through materials and replace the target one using UUID
      const updatedMaterials = currentMaterials.map((material) => {
        // Check if this is the material we want to replace using UUID
        const isTargetMaterial =
          material.uuid === selectedMaterialToReplace.uuid;

        console.log(
          "Checking material:",
          material.uuid,
          "vs target:",
          selectedMaterialToReplace.uuid,
          "isTarget:",
          isTargetMaterial,
        );

        if (isTargetMaterial) {
          console.log("REPLACING THIS MATERIAL:", material);

          // Build replacement history - include all previous history plus current material
          const replacementHistory = [
            ...(material.replacementHistory || []),
            // Add the current material to history
            {
              ...material, // Store the complete original material data
              replacedAt: new Date().toISOString(),
              replacedBy: userLoggedID,
            },
          ];

          console.log("Replacement history:", replacementHistory);

          // Create the replacement material with the NEW material's data
          const replacementMaterial = {
            // Use the REPLACEMENT material's data for the main properties
            ...selectedReplacement,

            // Preserve the UUID to maintain the reference in the list
            uuid: material.uuid, // Keep the same UUID
            originalUUID: material.originalUUID, // Keep original UUID

            // Preserve some important properties from the original
            id: material.id, // Keep the same ID to maintain reference
            status: "Replaced",
            instruction:
              selectedReplacement.instruction || material.instruction || null,
            isReplaced: true,

            // Store the original material data for history
            originalMaterial: material.originalMaterial || material,
            replacementHistory: replacementHistory,

            // Set replacement-specific properties
            target_weight: 0, // Set target weight to 0 for replaced materials

            // Ensure category is properly set
            category:
              selectedReplacement.replacementCategory ||
              selectedReplacement.category,

            // Make sure we have the essential product information
            product_code: selectedReplacement.product_code,
            product_name: selectedReplacement.product_name,
            product_id: selectedReplacement.product_id,

            // Vendor information if applicable
            vendor_id: selectedReplacement.vendor_id,
            company_name: selectedReplacement.company_name,

            // Packaging information
            packaging_name: selectedReplacement.packaging_name,
            packaging_unit: selectedReplacement.packaging_unit,
            packaging_unit_quantity:
              selectedReplacement.packaging_unit_quantity,

            // Stock information
            total_stock: selectedReplacement.total_stock,
          };

          console.log("Created replacement material:", replacementMaterial);
          return replacementMaterial;
        }

        return material;
      });

      console.log("Updated materials:", updatedMaterials);

      const newState = {
        ...prev,
        [correctProductKey]: updatedMaterials,
      };

      console.log("New state to be set:", newState);
      return newState;
    });

    // Initialize target weight for the replacement material (set to 0)
    const replacementUniqueKey = selectedReplacement.vendor_id
      ? `${selectedReplacement.vendor_id}-${selectedReplacement.product_id}`
      : selectedReplacement.product_id;

    console.log("Setting target weight for key:", replacementUniqueKey, "to 0");

    setTargetWeights((prev) => {
      const newWeights = {
        ...prev,
        [replacementUniqueKey]: "0", // Set to 0 as string for the input field
      };
      console.log("New target weights:", newWeights);
      return newWeights;
    });

    console.log("=== REPLACEMENT PROCESS COMPLETE ===");
    swal({
      title: "Success",
      text: "Material replaced successfully",
      icon: "success",
      buttons: false,
      timer: 2000,
    });

    handleChangeMaterialModalClose();
  };

  // Add this state to track which replacement history rows are expanded
  const [expandedReplacementRows, setExpandedReplacementRows] = useState([]);

  // Toggle replacement row expansion
  const toggleReplacementRow = (materialKey) => {
    setExpandedReplacementRows((prev) =>
      prev.includes(materialKey)
        ? prev.filter((key) => key !== materialKey)
        : [...prev, materialKey],
    );
  };

  // close changing modal
  const handleChangeMaterialModalClose = () => {
    setShowChangeMaterialModal(false);
    setSelectedMaterialToReplace(null);
    setSelectedReplacement(null);
    setReplacementVendorMaterials([]);
    setReplacementRawMaterials([]);
    setReplacementFinishedMaterials([]);
  };

  // costing container
  const [costItems, setCostItems] = useState([
    { id: 1, name: "", amount: "", remarks: "" },
  ]);

  // Add new cost item
  const addCostItem = () => {
    const newId =
      costItems.length > 0
        ? Math.max(...costItems.map((item) => item.id)) + 1
        : 1;
    setCostItems([
      ...costItems,
      { id: newId, name: "", amount: "", remarks: "" },
    ]);
  };

  // Remove cost item
  const removeCostItem = (id) => {
    if (costItems.length <= 1) {
      swal("Cannot Delete", "At least one cost item is required", "warning");
      return;
    }
    setCostItems(costItems.filter((item) => item.id !== id));
  };

  // Handle cost item change
  const handleCostItemChange = (id, field, value) => {
    setCostItems(
      costItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  // total cost
  const [totalCost, setTotalCost] = useState(0);
  const calculateTotalCost = () => {
    const total = costItems.reduce((sum, item) => {
      // Remove commas and convert to number
      const amount = parseFloat(item.amount.replace(/,/g, "")) || 0;
      return sum + amount;
    }, 0);
    setTotalCost(total);
  };

  // formatter
  const formatAmountWithCommas = (value) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Handle multiple decimal points - keep only the first one
    const decimalIndex = cleanValue.indexOf(".");
    let processedValue = cleanValue;

    if (decimalIndex !== -1) {
      // Keep everything up to and including the first decimal point
      // and remove any additional decimal points from the rest
      const beforeDecimal = cleanValue.substring(0, decimalIndex + 1);
      const afterDecimal = cleanValue
        .substring(decimalIndex + 1)
        .replace(/\./g, "");
      processedValue = beforeDecimal + afterDecimal;
    }

    // Split into integer and decimal parts
    const parts = processedValue.split(".");
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : "";

    // Add commas to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Limit decimal to 5 places
    const limitedDecimal = decimalPart.slice(0, 5);

    // Combine parts
    return decimalPart !== "" || processedValue.includes(".")
      ? `${integerPart}.${limitedDecimal}`
      : integerPart;
  };

  // Add this function to handle amount input changes
  const handleAmountChange = (id, value) => {
    const formattedValue = formatAmountWithCommas(value);
    handleCostItemChange(id, "amount", formattedValue);
  };

  // Add this function to prevent non-numeric input
  const handleAmountKeyPress = (e) => {
    const { key, target } = e;
    const currentValue = target.value;
    const cursorPosition = target.selectionStart;

    // Handle Alt+A for select all
    if (e.altKey && key.toLowerCase() === "a") {
      target.select();
      e.preventDefault();
      return;
    }

    // Allow control keys
    const controlKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (controlKeys.includes(key)) {
      return;
    }

    // Allow Ctrl+A for select all (standard shortcut)
    if (e.ctrlKey && key.toLowerCase() === "a") {
      return;
    }

    // Allow numbers
    if (/[0-9]/.test(key)) {
      return;
    }

    // Handle decimal point
    if (key === ".") {
      // Allow decimal point if:
      // 1. There's no decimal point in the current value, OR
      // 2. There's a decimal point but it's selected (will be replaced), OR
      // 3. The cursor is before an existing decimal point (will be replaced)
      const hasDecimal = currentValue.includes(".");
      const selectedText = target.value.substring(
        target.selectionStart,
        target.selectionEnd,
      );
      const isDecimalSelected = selectedText.includes(".");

      if (
        !hasDecimal ||
        isDecimalSelected ||
        target.selectionStart !== target.selectionEnd
      ) {
        return; // Allow the decimal point
      }

      // Prevent if there's already a decimal and nothing is selected
      e.preventDefault();
      return;
    }

    // Block all other keys
    e.preventDefault();
  };

  const handleAmountKeyPressPermissive = (e) => {
    const { key } = e;

    // Allow control keys and numbers and decimal point
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      ".",
    ];

    if (allowedKeys.includes(key) || /[0-9]/.test(key)) {
      return; // Allow the key
    }

    // Block everything else
    e.preventDefault();
  };

  // onclick for navigate
  const handleGoBack = () => {
    navigate("/inventory/batch-entry");
    window.scrollTo(0, 0);
  };

  // Add this function near your other helper functions
  const handleExpiryDateClick = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the row
  };

  // validation
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // for lot
  const [lotValidation, setLotValidation] = useState({});
  const [lotDebounceTimers, setLotDebounceTimers] = useState({});
  const [isCheckingLOT, setIsCheckingLOT] = useState({});

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!batchTitle.trim()) errors.batchTitle = "Batch Title is required";
    if (selectedMixers.length === 0) errors.mixers = "Mixer is required";
    if (selectedDeliveryReceipts.length === 0)
      errors.deliveryReceipts = "Delivery Receipt is required";
    if (selectedFinishedProducts.length === 0)
      errors.finishedProducts = "Formulated Products are required";

    const teamLeader = document.getElementById("team-leader")?.value;
    const members = document.getElementById("members")?.value;

    if (!teamLeader?.trim()) errors.teamLeader = "Team Leader is required";
    if (!members?.trim()) errors.members = "Members are required";

    const startDate = document.getElementById("scheduleStartDate")?.value;
    const endDate = document.getElementById("scheduleEndDate")?.value;
    if (!startDate) errors.startDate = "Start Date is required";
    if (!endDate) errors.endDate = "End Date is required";

    // Expiry date and LOT validation for material list
    materialListData.forEach((product) => {
      const productKey = `${product.product_id}-${product.id}`;
      const expiryDateInput = document.querySelector(
        `input[data-product-key="${productKey}"]`,
      );
      const lotInput = document.querySelector(
        `input[data-lot-key="${productKey}"]`,
      );

      if (!lotInput?.value?.trim()) {
        errors[`lot-${productKey}`] = "LOT is required";
      } else if (lotValidation[productKey]?.isValid === false) {
        errors[`lot-${productKey}`] =
          lotValidation[productKey]?.message || "Invalid LOT number";
      }

      if (!expiryDateInput?.value) {
        errors[`expiryDate-${productKey}`] = "Best Before is required";
      }

      if (!lotInput?.value?.trim()) {
        errors[`lot-${productKey}`] = "LOT is required";
      }
    });

    // Conditional cost validation
    costItems.forEach((item, index) => {
      if (item.name.trim() && !item.amount) {
        errors[`costAmount-${item.id}`] =
          "Cost Amount is required when Cost Name is provided";
      }
    });

    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);

    return Object.keys(errors).length === 0;
  };

  const validateExpiryDate = (productKey) => {
    const expiryDateInput = document.querySelector(
      `input[data-product-key="${productKey}"]`,
    );
    if (expiryDateInput?.value) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`expiryDate-${productKey}`];
        return newErrors;
      });
    }
  };

  // Individual validation functions
  const validateBatchTitle = () => {
    if (batchTitle.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.batchTitle;
        return newErrors;
      });
    }
  };

  // Add these validation functions near your other validation functions
  const validateTeamLeader = () => {
    const teamLeader = document.getElementById("team-leader")?.value;
    if (teamLeader && teamLeader.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.teamLeader;
        return newErrors;
      });
    }
  };

  const validateMembers = () => {
    const members = document.getElementById("members")?.value;
    if (members && members.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.members;
        return newErrors;
      });
    }
  };

  const validateMixers = () => {
    if (selectedMixers.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.mixers;
        return newErrors;
      });
    }
  };

  const validateDeliveryReceipts = () => {
    if (selectedDeliveryReceipts.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.deliveryReceipts;
        return newErrors;
      });
    }
  };

  const validateFinishedProducts = () => {
    if (selectedFinishedProducts.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.finishedProducts;
        return newErrors;
      });
    }
  };

  // states for start and end date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minEndDate, setMinEndDate] = useState("");

  const handleStartDateChange = (e) => {
    const selectedDate = e.target.value;
    setStartDate(selectedDate);

    // Set minimum end date to be the same as start date
    setMinEndDate(selectedDate);

    // If end date is earlier than start date, clear it
    if (endDate && endDate < selectedDate) {
      setEndDate("");
    }

    // Run validation
    validateDates();
  };

  const handleEndDateChange = (e) => {
    const selectedDate = e.target.value;
    setEndDate(selectedDate);
    validateDates();
  };

  // Update your existing validateDates function
  const validateDates = () => {
    const startDateInput = document.getElementById("scheduleStartDate")?.value;
    const endDateInput = document.getElementById("scheduleEndDate")?.value;

    if (startDateInput) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        return newErrors;
      });
    }

    if (endDateInput) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }

    // Additional validation for end date being after start date
    if (startDateInput && endDateInput && endDateInput < startDateInput) {
      setValidationErrors((prev) => ({
        ...prev,
        endDate: "End date must be on or after start date",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  // Add this validation function for LOT
  const validateLOTNumber = async (productKey, lotValue, productId) => {
    if (!lotValue || lotValue.trim() === "") {
      // Reset validation if empty
      setLotValidation((prev) => ({
        ...prev,
        [productKey]: { isValid: true, message: "", isChecking: false },
      }));
      setIsCheckingLOT((prev) => ({ ...prev, [productKey]: false }));
      return;
    }

    // Set checking state
    setLotValidation((prev) => ({
      ...prev,
      [productKey]: { ...prev[productKey], isChecking: true },
    }));
    setIsCheckingLOT((prev) => ({ ...prev, [productKey]: true }));

    try {
      const response = await axios.get(`${BASE_URL}/BatchEntry2/validateLot`, {
        params: {
          lot: lotValue,
          productId: productId, // Send productId
          whatModule: "Create",
        },
      });

      if (response.data.exists) {
        setLotValidation((prev) => ({
          ...prev,
          [productKey]: {
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
          setLotNumbers((prev) => ({
            ...prev,
            [productKey]: "",
          }));
        });
      } else {
        setLotValidation((prev) => ({
          ...prev,
          [productKey]: {
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
        [productKey]: {
          isValid: true,
          message: "Error checking LOT. Please try again.",
          isChecking: false,
        },
      }));
    } finally {
      setIsCheckingLOT((prev) => ({ ...prev, [productKey]: false }));
    }
  };

  // Debounced LOT change handler
  const handleLotChange = (productKey, value, materialId = null) => {
    // Clear validation error when user starts typing
    if (validationErrors[`lot-${productKey}`]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`lot-${productKey}`];
        return newErrors;
      });
    }

    // Clear existing timer for this product
    if (lotDebounceTimers[productKey]) {
      clearTimeout(lotDebounceTimers[productKey]);
    }

    // Update the LOT value immediately
    setLotNumbers((prev) => ({
      ...prev,
      [productKey]: value,
    }));

    // Set new timer for debounce
    const timer = setTimeout(() => {
      validateLOTNumber(productKey, value, materialId); // <-- FIXED: use materialId instead of productId
    }, 800);

    // Store the timer reference
    setLotDebounceTimers((prev) => ({
      ...prev,
      [productKey]: timer,
    }));
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

  const validateCostItem = (itemId) => {
    const item = costItems.find((item) => item.id === itemId);
    if (item && (!item.name.trim() || item.amount)) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`costAmount-${itemId}`];
        return newErrors;
      });
    }
  };

  // submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if any LOT validation is in progress
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
      setIsSubmitting(false);
      return;
    }

    // Check if any LOT has validation errors
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
      setIsSubmitting(false);
      return;
    }

    // Show confirmation dialog first
    const confirmResult = await swal({
      title: "Are you sure?",
      text: "Do you want to submit this batch entry?",
      icon: "warning",
      buttons: {
        cancel: "Cancel",
        confirm: "Yes",
      },
      dangerMode: true,
    });

    // If user pressed Cancel
    if (!confirmResult) {
      setIsSubmitting(false);
      return;
    }

    // Run validation
    if (!validateForm()) {
      swal(
        "Validation Error",
        "Please enter required fields before submitting.",
        "error",
      );
      setIsSubmitting(false);
      return;
    }

    // Gather all form data
    const formData = {
      batchTitle: document.getElementById("batchName").value,
      mixers: selectedMixers.map((mixer) => mixer.value),
      status: status,
      teamLeader: document.getElementById("team-leader").value,
      members: document.getElementById("members").value,
      deliveryReceipts: selectedDeliveryReceipts.map((dr) => dr.value),
      formulatedProducts: selectedFinishedProducts.map((fp) => fp.value),
      batchRemarks: document.getElementById("batchRemarks").value,
      startDate: startDate,
      endDate: endDate,
      formulatedProductsData: [],
      materials: [],
      costs: costItems.map((item) => ({
        name: item.name,
        amount: parseFloat(item.amount.replace(/,/g, "")) || 0,
        remarks: item.remarks,
      })),
      totalCost: totalCost,
      createdBy: userLoggedID,
    };

    // Process formulated products with expiry dates and LOT numbers
    materialListData.forEach((product) => {
      const productKey = `${product.product_id}-${product.id}`;
      const expiryDateInput = document.querySelector(
        `input[data-product-key="${productKey}"]`,
      );
      const lotInput = document.querySelector(
        `input[data-lot-key="${productKey}"]`,
      );

      formData.formulatedProductsData.push({
        product_id: product.product_id,
        sales_product_tag_id: product.id,
        vendor_id: product.vendor_id || null,
        expiry_date: expiryDateInput ? expiryDateInput.value : null,
        lot_number: lotInput ? lotInput.value.trim() : null,
        occurrences: product.occurrences || 1,
        total_weight: product.totalWeight || 0,
        category: product.category,
        packaging_name:
          product.product_list.prod_packaging.packaging_name || null,
        packaging_unit: product.product_list.prod_packaging.unit || null,
        packaging_unit_quantity:
          product.product_list.prod_packaging.unit_quantity || 0,
      });
    });

    // Process materials with target weights
    Object.keys(materialProductRawMaterials).forEach((productKey) => {
      const materials = materialProductRawMaterials[productKey];

      // Get the occurrences for this product from materialListData
      const [productId, salesProductTagId] = productKey.split("-");
      const formulatedProduct = materialListData.find(
        (product) =>
          product.product_id.toString() === productId &&
          product.id.toString() === salesProductTagId,
      );
      const occurrences = formulatedProduct
        ? formulatedProduct.occurrences || 1
        : 1;

      materials.forEach((material) => {
        // Find the target weight data using the material's UUID
        const targetWeightData = targetWeights[material.uuid];
        let baseTargetWeight = 0;
        let mergedTargetWeight = 0;

        if (targetWeightData) {
          baseTargetWeight =
            parseFloat(targetWeightData.baseValue.replace(/,/g, "")) || 0;
          mergedTargetWeight =
            baseTargetWeight * (targetWeightData.occurrences || 1);
        } else {
          // Fallback to original target_weight if no custom value set
          baseTargetWeight = parseFloat(material.target_weight) || 0;
          mergedTargetWeight = baseTargetWeight * (material.occurrences || 1);
        }

        // Get the product_id and sales_product_tag_id from the material's context
        const [productId, salesProductTagId] = productKey.split("-");

        // Get the formulated product ID - handle all material types
        let formulatedProductId;

        // For original materials (from formulation)
        if (material.fpu_formulation_id?.f_product_id?.product_id) {
          formulatedProductId =
            material.fpu_formulation_id.f_product_id.product_id;
        }
        // For replaced materials (from replacement process)
        else if (material.formulated_product_id) {
          formulatedProductId = material.formulated_product_id;
        }
        // For additional materials (manually added)
        else if (material.isAdditional && material.formulated_product_id) {
          formulatedProductId = material.formulated_product_id;
        }
        // Fallback - use the product ID from the productKey
        else {
          formulatedProductId = productId;
        }

        formData.materials.push({
          product_id: material.product_id,
          vendor_id: material.vendor_id || null,
          sales_product_tag_id: salesProductTagId,
          material_id: material.id,
          material_product_id: material.product_id,
          material_vendor_id: material.vendor_id || null,
          material_category: material.category,
          material_status: material.status || "Original",
          base_target_weight: baseTargetWeight,
          merged_target_weight: mergedTargetWeight,
          occurrences: material.occurrencesNumber,
          is_additional: material.isAdditional || false,
          is_replaced: material.isReplaced || false,
          replacement_history: material.replacementHistory || [],
          original_material: material.originalMaterial || null,
          material_uuid: material.uuid,
          original_uuid: material.originalUUID,
          category: material.category,
          formulated_product_id: formulatedProductId,
          // ADDED: Include instruction field
          instruction: material.instruction || null,
        });
      });
    });

    // Log the complete form data for debugging
    console.log("Form Data to be submitted:", formData);

    try {
      const response = await axios.post(
        `${BASE_URL}/BatchEntry2/create`,
        formData,
      );
      if (response.data.success) {
        swal({
          title: "Success",
          text: "Batch created successfully",
          icon: "success",
          buttons: false,
          timer: 2000,
        });

        navigate("/inventory/batch-entry");
        window.scrollTo(0, 0);

        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        swal("Error", response.data.message, "error");
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error creating batch:", error);

      // Enhanced error handling
      if (error.response) {
        // Server responded with error status
        console.error("Server error response:", error.response.data);
        swal(
          "Error",
          `Failed to create batch: ${
            error.response.data.message || "Unknown server error"
          }`,
          "error",
        );
      } else if (error.request) {
        // Network error
        console.error("Network error:", error.request);
        swal(
          "Error",
          "Network error: Please check your connection and try again",
          "error",
        );
      } else {
        // Other error
        console.error("Error:", error.message);
        swal("Error", `Failed to create batch: ${error.message}`, "error");
      }
    }
  };

  const hasError = (fieldName) => {
    return validationErrors[fieldName] !== undefined;
  };

  // Add function to get error message
  const getErrorMessage = (fieldName) => {
    return validationErrors[fieldName];
  };

  // global use effect
  // use effect for on load fetch
  useEffect(() => {
    fetchMixerData();
    fetchDeliveryReceiptData();
  }, []);

  // Validate batch title on change
  useEffect(() => {
    validateBatchTitle();
  }, [batchTitle]);

  // Validate mixers on change
  useEffect(() => {
    validateMixers();
  }, [selectedMixers]);

  // Validate delivery receipts on change
  useEffect(() => {
    validateDeliveryReceipts();
  }, [selectedDeliveryReceipts]);

  // Validate finished products on change
  useEffect(() => {
    validateFinishedProducts();
  }, [selectedFinishedProducts]);

  // Validate dates on change (you'll need to add onChange handlers to date inputs)
  useEffect(() => {
    validateDates();
  }, []); // This will need to be triggered by date input changes

  // Validate cost items on change
  useEffect(() => {
    costItems.forEach((item) => {
      validateCostItem(item.id);
    });
  }, [costItems]);

  // for invoice list container use effect
  // Refresh invoice products when selected finished products change
  useEffect(() => {
    const refreshExpandedRows = async () => {
      const updatedInvoiceProducts = { ...invoiceProducts };

      console.log("gumana ang useeffect");

      for (const invoiceId of expandedRows) {
        try {
          const res = await axios.get(
            `${BASE_URL}/BatchEntry2/fetchProductFromDeliveryReceiptData`,
            {
              params: {
                sales_invoice_ids: invoiceId,
              },
            },
          );

          // Filter products based on current selection
          const filteredProducts = res.data.filter((product) =>
            selectedFinishedProducts.some(
              (selected) => selected.value === product.id,
            ),
          );

          updatedInvoiceProducts[invoiceId] = filteredProducts;
        } catch (error) {
          console.error(error);
          // Keep existing data on error
        }
      }

      setInvoiceProducts(updatedInvoiceProducts);
    };

    if (expandedRows.length > 0) {
      refreshExpandedRows();
    }
  }, [selectedFinishedProducts]);

  // // for selection of dr
  // useEffect(() => {
  //   const fetchDRDropdown = async () => {
  //     const updatedInvoiceProducts = { ...invoiceProducts };

  //     console.log("Running on component load");

  //     for (const invoiceId of expandedRows) {
  //       try {
  //         const res = await axios.get(
  //           `${BASE_URL}/BatchEntry2/fetchProductFromDeliveryReceiptData`,
  //           {
  //             params: {
  //               sales_invoice_ids: invoiceId,
  //             },
  //           }
  //         );

  //         const filteredProducts = res.data.filter((product) =>
  //           selectedFinishedProducts.some(
  //             (selected) => selected.value === product.id
  //           )
  //         );

  //         updatedInvoiceProducts[invoiceId] = filteredProducts;
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     }

  //     setInvoiceProducts(updatedInvoiceProducts);
  //   };

  //   // Remove the condition to run even if expandedRows is empty
  //   fetchDRDropdown();
  // }, []); // Empty dependency array = run only on mount

  // for material list
  useEffect(() => {
    const processSelectedFormulatedProducts = async () => {
      if (selectedFinishedProducts.length > 0) {
        try {
          // Extract product data from selected options
          const productData = selectedFinishedProducts.map((option) => option);

          // Process and merge the products
          const mergedProducts = processFormulatedProducts(productData);

          // Update material list data
          setMaterialListData(mergedProducts);

          // Automatically expand all formulated products and fetch their materials
          const newExpandedProducts = [];
          const newMaterialProductRawMaterials = {
            ...materialProductRawMaterials,
          };

          for (const product of mergedProducts) {
            const productKey = `${product.product_id}-${product.id}`;
            newExpandedProducts.push(productKey);

            // If materials haven't been fetched yet, fetch them
            if (!newMaterialProductRawMaterials[productKey]) {
              const rawMaterials = await fetchRawMaterialsForFormulatedProduct(
                product.product_id,
                product.id,
              );
              newMaterialProductRawMaterials[productKey] = rawMaterials;
            }
          }

          setExpandedMaterialProducts(newExpandedProducts);
          setMaterialProductRawMaterials(newMaterialProductRawMaterials);
        } catch (error) {
          console.error("Error processing formulated products:", error);
          swal("Error", "Failed to process formulated products", "error");
        }
      } else {
        // Clear material list if no products are selected
        setMaterialListData([]);
        setExpandedMaterialProducts([]);
      }
    };

    processSelectedFormulatedProducts();
  }, [selectedFinishedProducts]);

  // for material list modal
  // useEffect(() => {
  //   setVendorSelectAll(false);
  //   setVendorSelectedItems({});
  // }, [vendorPagination.currentPage]);

  useEffect(() => {
    setRawSelectAll(false);
    setRawSelectedItems({});
  }, [rawPagination.currentPage]);

  useEffect(() => {
    setFinishedSelectAll(false);
    setFinishedSelectedItems({});
  }, [finishedPagination.currentPage]);

  // Monitor vendor selection state and update select all
  // useEffect(() => {
  //   if (vendorPagination.data.length === 0) {
  //     setVendorSelectAll(false);
  //     return;
  //   }

  //   const allSelected = vendorPagination.data.every((material) => {
  //     const uniqueKey = `${material.vendor_id}-${material.product_id}`;

  //     // For already selected items, check if they're NOT marked for removal
  //     if (alreadySelectedVendorItems[uniqueKey]) {
  //       return vendorSelectedItems[uniqueKey] !== false;
  //     }
  //     // For new items, check if they're selected
  //     return vendorSelectedItems[uniqueKey] === true;
  //   });

  //   setVendorSelectAll(allSelected);
  // }, [vendorSelectedItems, vendorPagination.data, alreadySelectedVendorItems]);

  // Monitor raw selection state and update select all
  useEffect(() => {
    if (rawPagination.data.length === 0) {
      setRawSelectAll(false);
      return;
    }

    const allSelected = rawPagination.data.every((material) => {
      const uniqueKey = `${material.product_id}`;

      if (alreadySelectedRawItems[uniqueKey]) {
        return rawSelectedItems[uniqueKey] !== false;
      }
      return rawSelectedItems[uniqueKey] === true;
    });

    setRawSelectAll(allSelected);
  }, [rawSelectedItems, rawPagination.data, alreadySelectedRawItems]);

  // Monitor finished selection state and update select all
  useEffect(() => {
    if (finishedPagination.data.length === 0) {
      setFinishedSelectAll(false);
      return;
    }

    const allSelected = finishedPagination.data.every((material) => {
      const uniqueKey = `${material.product_id}`;

      if (alreadySelectedFinishedItems[uniqueKey]) {
        return finishedSelectedItems[uniqueKey] !== false;
      }
      return finishedSelectedItems[uniqueKey] === true;
    });

    setFinishedSelectAll(allSelected);
  }, [
    finishedSelectedItems,
    finishedPagination.data,
    alreadySelectedFinishedItems,
  ]);

  // use effect for cost
  useEffect(() => {
    calculateTotalCost();
  }, [costItems]);

  // Add useEffect to validate LOT numbers when they change
  useEffect(() => {
    materialListData.forEach((product) => {
      const productKey = `${product.product_id}-${product.id}`;
      validateLot(productKey);
    });
  }, [lotNumbers, materialListData]);

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

  // Add this useEffect near your other validation useEffects
  useEffect(() => {
    if (startDate) {
      // Clear any end date validation errors when start date changes
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  }, [startDate]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {/* title */}
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <button
              // onClick={() => {
              //   navigate("/inventory/batch-entry");
              //   window.scrollTo(0, 0);
              // }}
              onClick={handleGoBack}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            CREATE BATCH ENTRY
          </span>
          {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
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
              name=""
              id="batchName"
              className={`form-control p-3 ${
                hasError("batchTitle") ? "border border-danger" : ""
              }`}
              placeholder="Enter Title"
              value={batchTitle}
              onChange={(e) => setBatchTitle(e.target.value)}
              required
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
              name=""
              id="team-leader"
              className={`form-control p-3 ${
                hasError("teamLeader") ? "border border-danger" : ""
              }`}
              placeholder="Enter Team Leader"
              onChange={validateTeamLeader} // Add onChange handler
              required
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
              name=""
              id="members"
              className={`form-control p-3 ${
                hasError("members") ? "border border-danger" : ""
              }`}
              placeholder="Enter Members"
              onChange={validateMembers} // Add onChange handler
              required
            />
            {hasError("members") && (
              <div className="text-danger small">
                {validationErrors.members}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row" style={{ paddingInline: "0.8325rem" }}>
        <div className="col-sm mb-3">
          <label htmlFor="mixer">
            Mixer <span className="text-danger">*</span>
          </label>
          <Select
            id="mixer"
            isMulti
            options={optionsWithSelectAll}
            value={selectedMixers}
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
            <div className="text-danger small">{validationErrors.mixers}</div>
          )}
        </div>
        <div className="col-sm mb-3">
          <label htmlFor="deliveryReceipt">
            Delivery Receipt <span className="text-danger">*</span>
          </label>
          <Select
            id="deliveryReceipt"
            isMulti
            options={deliveryReceiptOptionsWithSelectAll}
            value={selectedDeliveryReceipts}
            onChange={handleDeliveryReceiptChange}
            isLoading={isDeliveryReceiptLoading}
            placeholder="Select Delivery Receipt(s)"
            closeMenuOnSelect={false}
            className={
              hasError("deliveryReceipts") ? " border-danger rounded" : ""
            }
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
                borderColor: hasError("deliveryReceipts")
                  ? "#dc3545"
                  : "#ced4da",
              }),
              option: (base) => ({
                ...base,
                padding: "8px 12px",
              }),
            }}
          />
          {hasError("deliveryReceipts") && (
            <div className="text-danger small">
              {validationErrors.deliveryReceipts}
            </div>
          )}
        </div>
        <div className="col-sm mb-3">
          <label htmlFor="finishedProduct">
            Formulated Products <span className="text-danger">*</span>
          </label>
          <Select
            id="finishedProduct"
            isMulti
            options={finishedProductOptionsWithSelectAll}
            value={selectedFinishedProducts}
            onChange={handleFinishedProductChange}
            isLoading={isFinishedProductLoading}
            placeholder={
              selectedDeliveryReceipts.length === 0
                ? "Select Delivery Receipt first"
                : "Select Product(s)"
            }
            isDisabled={selectedDeliveryReceipts.length === 0}
            closeMenuOnSelect={false}
            className={
              hasError("finishedProducts") ? " border-danger rounded" : ""
            }
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
                borderColor: hasError("finishedProducts")
                  ? "#dc3545"
                  : "#ced4da",
              }),
              option: (base) => ({
                ...base,
                padding: "8px 12px",
              }),
            }}
          />
          {hasError("finishedProducts") && (
            <div className="text-danger small">
              {validationErrors.finishedProducts}
            </div>
          )}
        </div>
      </div>
      <div className="row" style={{ paddingInline: "0.8325rem" }}>
        <div className="col-sm-4">
          <label htmlFor="status">
            Status <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name=""
            id="status"
            className="form-control p-3"
            readOnly
            value={status}
          />
        </div>
        <div className="col-sm-8">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            name=""
            id="batchRemarks"
            className="form-control"
            cols="3"
            rows="3"
            placeholder="Enter Remarks"
          ></textarea>
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
            transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="col-sm">
            <label htmlFor="scheduleStartDate">
              Start Date <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              name=""
              id="scheduleStartDate"
              className={`form-control p-3 ${
                hasError("startDate") ? "border border-danger" : ""
              }`}
              value={startDate}
              onChange={handleStartDateChange}
              required
            />
            {hasError("startDate") && (
              <div className="text-danger small">
                {validationErrors.startDate}
              </div>
            )}
          </div>
          <div className="col-sm">
            <label htmlFor="scheduleEndDate">
              End Date <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              name=""
              id="scheduleEndDate"
              className={`form-control p-3 ${
                hasError("endDate") ? "border border-danger" : ""
              }`}
              value={endDate}
              onChange={handleEndDateChange}
              min={minEndDate} // This sets the minimum selectable date
              disabled={!startDate} // Disable if no start date
              required
            />
            {hasError("endDate") && (
              <div className="text-danger small">
                {validationErrors.endDate}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContainer>

      {/* invoice list */}
      <CollapsibleContainer
        title="Invoice List"
        toggleSection={toggleSection}
        isOpen={isOpen}
      >
        <div
          className="container-fluid scrollable-contents "
          style={{
            minHeight: isOpen ? "200px" : "0px",
            maxHeight: isOpen ? "1000px" : "0px",
            overflowX: "hidden",
            overflowY: "auto",
            transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
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
                {invoiceListData.map((invoice) => {
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
                          {invoice.transaction_id}
                        </td>
                        <td className="text-center">
                          {invoice.delivery_number}
                        </td>
                        <td className="text-center">
                          {invoice.customer?.company_name}
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
                              {invoiceProducts[invoice.sales_invoice_id] ? (
                                invoiceProducts[invoice.sales_invoice_id]
                                  .length > 0 ? (
                                  <table className="table table-sm table-bordered table-nested table-hover">
                                    <thead>
                                      <tr>
                                        <th>Product Code</th>
                                        <th>Product Name</th>
                                        <th>Unit of Measure</th>
                                        <th>Weight (kg)</th>
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

                                        return (
                                          <React.Fragment key={product.id}>
                                            <tr
                                              className={`cursor-pointer ${
                                                isProductExpanded
                                                  ? "table-success"
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
                                                  ? `${product.product_list.prod_packaging.packaging_name} - (${product.product_list.prod_packaging.unit_quantity} ${product.product_list.prod_packaging.unit})`
                                                  : "N/A"}
                                              </td>
                                              <td>
                                                {product.quantity &&
                                                product.product_list
                                                  ?.prod_packaging
                                                  ?.unit_quantity
                                                  ? (
                                                      product.quantity *
                                                      product.product_list
                                                        .prod_packaging
                                                        .unit_quantity
                                                    ).toLocaleString("en-US", {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 5,
                                                    })
                                                  : "0.00"}
                                              </td>
                                              <td>
                                                {product.discount_item || 0}%
                                              </td>
                                              <td>
                                                {product.subtotal
                                                  ? parseFloat(
                                                      product.subtotal,
                                                    ).toLocaleString("en-US", {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 5,
                                                    })
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
                                                <td colSpan="7" className="p-0">
                                                  <div className="p-3 bg-light">
                                                    <h6>Materials Used</h6>
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
                                                                Product Code
                                                              </th>
                                                              <th>
                                                                Product Name
                                                              </th>
                                                              <th>
                                                                Unit of Measure
                                                              </th>
                                                              <th>Category</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            {formulatedProductRawMaterials[
                                                              productKey
                                                            ].map(
                                                              (material) => (
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
                                                                      ? `${material.fpu_product_id.prod_packaging.packaging_name} - (${material.fpu_product_id.prod_packaging.unit_quantity} ${product.product_list.prod_packaging.unit})`
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
                                                          No materials found
                                                        </div>
                                                      )
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
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="text-center py-3">
                                    No formulated products selected for this
                                    invoice
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
                })}

                {invoiceListData.length === 0 && (
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

      {/* material list */}
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
            transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
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
                    Weight (kg)
                  </th>
                  <th
                    className="text-muted text-center"
                    style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                  >
                    Best Before <span className=" text-danger">*</span>
                  </th>
                  <th
                    className="text-muted text-center"
                    style={{ backgroundColor: "#EBEFF4", width: "200px" }}
                  >
                    LOT <span className=" text-danger">*</span>
                  </th>
                  <th
                    className="text-muted text-center"
                    style={{ backgroundColor: "#EBEFF4" }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {materialListData.map((product) => {
                  const productKey = `${product.product_id}-${product.id}`;
                  const isProductExpanded =
                    expandedMaterialProducts.includes(productKey);
                  const hasExpiryError = hasError(`expiryDate-${productKey}`);
                  const hasLotError = hasError(`lot-${productKey}`);

                  return (
                    <React.Fragment key={product.product_id}>
                      <tr
                        className={
                          isProductExpanded
                            ? "table-success cursor-pointer"
                            : " cursor-pointer"
                        }
                        onClick={() =>
                          toggleMaterialProductExpand(
                            product.product_id,
                            product.id,
                          )
                        }
                      >
                        <td className="text-center">
                          {product.product_list?.product_code || "N/A"}
                        </td>
                        <td className="text-center">
                          <div className="d-flex flex-column">
                            <span>
                              {product.product_list?.product_name || "N/A"}
                            </span>
                            <span style={{ fontSize: "12px" }}>
                              {product.occurrences > 1 && (
                                <span className="text-muted ms-1">
                                  ({product.occurrences} material merged)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          {product.product_list?.prod_packaging
                            ? `${product.product_list.prod_packaging.packaging_name} - (${product.product_list.prod_packaging.unit_quantity} ${product.product_list.prod_packaging.unit})`
                            : "N/A"}
                        </td>
                        <td className="text-center">
                          {product.totalWeight.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center" style={{ width: "50px" }}>
                          <input
                            type="date"
                            name=""
                            title="Best Before"
                            data-product-key={productKey}
                            className={`form-control form-control-sm ${
                              hasExpiryError ? "border border-danger" : ""
                            }`}
                            onClick={handleExpiryDateClick}
                            onFocus={handleExpiryDateClick}
                            onChange={() => validateExpiryDate(productKey)} // Add this
                          />
                          {hasExpiryError && (
                            <div className="text-danger small">
                              {validationErrors[`expiryDate-${productKey}`]}
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
                              data-lot-key={productKey}
                              value={lotNumbers[productKey] || ""}
                              onChange={(e) =>
                                handleLotChange(
                                  productKey,
                                  e.target.value,
                                  product.product_id, // This is passed as materialId parameter
                                )
                              }
                              className={`form-control form-control-sm ${
                                hasLotError
                                  ? "border border-danger"
                                  : lotValidation[productKey]?.isValid === false
                                    ? "is-invalid"
                                    : ""
                              }`}
                              onClick={handleExpiryDateClick}
                              onFocus={handleExpiryDateClick}
                              maxLength={50}
                            />
                            {isCheckingLOT[productKey] && (
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
                            {lotValidation[productKey]?.isValid === false &&
                              !isCheckingLOT[productKey] && (
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
                            {lotValidation[productKey]?.isValid === true &&
                              lotNumbers[productKey] &&
                              !isCheckingLOT[productKey] && (
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
                          {hasLotError && (
                            <div className="text-danger small">
                              {validationErrors[`lot-${productKey}`]}
                            </div>
                          )}
                          {lotValidation[productKey]?.isValid === false && (
                            <div
                              className="invalid-feedback d-block"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {lotValidation[productKey]?.message}
                            </div>
                          )}
                        </td>
                        <td className="text-center">
                          {isProductExpanded ? (
                            <FaChevronUp className="text-primary" />
                          ) : (
                            <FaChevronDown className="text-primary" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded row with materials used for formulated product */}
                      {isProductExpanded && (
                        <tr className="table-collapse">
                          <td colSpan="7" className="p-0">
                            <div className="p-3 bg-light">
                              <div className="d-flex flex-row justify-content-between">
                                <h6>Materials Used</h6>
                                <div
                                  className="btn btn-sm btn-outline-primary cursor-pointer"
                                  title="Add Material"
                                  onClick={() =>
                                    handleAddMaterialModalShow(product)
                                  }
                                >
                                  <i className="fa-solid fa-plus  "></i>
                                </div>
                              </div>
                              {materialProductRawMaterials[productKey] ? (
                                materialProductRawMaterials[productKey].length >
                                0 ? (
                                  <table className="table table-sm table-bordered table-nested mt-2">
                                    <thead>
                                      <tr>
                                        <th>Product Code</th>
                                        <th>Product Name</th>
                                        <th>Unit of Measure</th>
                                        <th>Category</th>
                                        <th>Current Stock (kg)</th>
                                        <th>Target Weight (kg)</th>
                                        <th>Status</th>
                                        <th className="text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {materialProductRawMaterials[
                                        productKey
                                      ].map((material) => {
                                        const uniqueKey = material.uuid;
                                        const materialKey = material.uuid;
                                        const hasReplacementHistory =
                                          material.replacementHistory &&
                                          material.replacementHistory.length >
                                            0;
                                        const isReplacementExpanded =
                                          expandedReplacementRows.includes(
                                            materialKey,
                                          );

                                        material.occurrencesNumber = 0;

                                        return (
                                          <React.Fragment key={material.uuid}>
                                            <tr>
                                              <td style={{ maxWidth: "250px" }}>
                                                <div className="d-flex flex-column">
                                                  <span className="mb-2">
                                                    {material.fpu_product_id
                                                      ?.product_code ||
                                                      material.product_code ||
                                                      "N/A"}
                                                  </span>

                                                  {/* Show instruction if it exists, with appropriate label based on material status */}
                                                  {material.instruction && (
                                                    <span
                                                      className="text-muted border-top"
                                                      style={{
                                                        fontSize: "13px",
                                                      }}
                                                    >
                                                      {/* Show status-specific prefix for replaced and additional materials */}
                                                      {material.isReplaced &&
                                                        "Replaced: "}
                                                      {material.isAdditional &&
                                                        "Additional: "}
                                                      {material.instruction}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td>
                                                {material.fpu_product_id
                                                  ?.product_name ||
                                                  material.product_name ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {material.fpu_product_id
                                                  ?.prod_packaging
                                                  ? `${material.fpu_product_id.prod_packaging.packaging_name} - (${material.fpu_product_id.prod_packaging.unit_quantity} ${material.fpu_product_id.prod_packaging.unit})`
                                                  : material.packaging_name
                                                    ? `${material.packaging_name} - (${material.packaging_unit_quantity} ${material.packaging_unit})`
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
                                                  {material.category || "---"}
                                                </span>
                                              </td>
                                              <td>
                                                {Number(
                                                  (material.fpu_product_id
                                                    ?.total_stock ?? 0) *
                                                    (material.fpu_product_id
                                                      ?.prod_packaging
                                                      ?.unit_quantity ?? 1) ||
                                                    (material.total_stock ??
                                                      0) *
                                                      (material.packaging_unit_quantity ??
                                                        1) ||
                                                    0,
                                                ).toLocaleString("en-US", {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 5,
                                                })}
                                              </td>

                                              <td>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  maxLength={20}
                                                  value={
                                                    targetWeights[uniqueKey] !==
                                                    undefined
                                                      ? targetWeights[uniqueKey]
                                                          .displayValue
                                                      : formatTargetWeight(
                                                          (
                                                            material.target_weight ||
                                                            0
                                                          ).toString(),
                                                          product.occurrences ||
                                                            1,
                                                        )
                                                  }
                                                  onChange={(e) => {
                                                    handleTargetWeightChange(
                                                      uniqueKey, // Use UUID here
                                                      e.target.value,
                                                      product.occurrences || 1,
                                                    );
                                                  }}
                                                  onKeyDown={
                                                    handleAmountKeyPress
                                                  }
                                                  onFocus={(e) =>
                                                    e.target.select()
                                                  }
                                                />
                                                {product.occurrences > 1 &&
                                                  ((material.occurrencesNumber =
                                                    product.occurrences),
                                                  (
                                                    <small className="text-muted d-block">
                                                      Base:{" "}
                                                      {(
                                                        parseFloat(
                                                          (
                                                            targetWeights[
                                                              uniqueKey
                                                            ]?.baseValue ||
                                                            material.target_weight ||
                                                            0
                                                          )
                                                            .toString()
                                                            .replace(/,/g, ""),
                                                        ) || 0
                                                      ).toLocaleString(
                                                        "en-US",
                                                        {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 5,
                                                        },
                                                      )}{" "}
                                                      × {product.occurrences}
                                                    </small>
                                                  ))}
                                              </td>

                                              <td
                                                className={`fw-semibold ${
                                                  material.status === "Original"
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
                                                {material.status || "Original"}
                                              </td>
                                              <td className="text-center">
                                                <button
                                                  className="btn btn-sm btn-outline-primary me-2"
                                                  disabled={
                                                    material.isAdditional
                                                  }
                                                  onClick={() =>
                                                    handleChangeMaterialModalShow(
                                                      product,
                                                      material,
                                                    )
                                                  }
                                                >
                                                  <i className="fa-solid fa-arrow-right-arrow-left"></i>
                                                </button>

                                                {/* Chevron button for replacement history */}
                                                {hasReplacementHistory && (
                                                  <button
                                                    className={`btn btn-sm ${
                                                      isReplacementExpanded
                                                        ? "btn-secondary"
                                                        : "btn-outline-secondary"
                                                    }`}
                                                    onClick={() =>
                                                      toggleReplacementRow(
                                                        materialKey,
                                                      )
                                                    }
                                                  >
                                                    {isReplacementExpanded ? (
                                                      <FaChevronUp />
                                                    ) : (
                                                      <FaChevronDown />
                                                    )}
                                                  </button>
                                                )}
                                              </td>
                                            </tr>

                                            {/* Replacement History Row */}
                                            {hasReplacementHistory &&
                                              isReplacementExpanded && (
                                                <tr className="bg-light">
                                                  <td
                                                    colSpan="8"
                                                    className="p-0"
                                                  >
                                                    <div className="p-3">
                                                      <h6 className="mb-2">
                                                        Replacement History
                                                      </h6>
                                                      <table className="table table-sm table-bordered">
                                                        <thead>
                                                          <tr>
                                                            <th>
                                                              Product Code
                                                            </th>
                                                            <th>
                                                              Product Name
                                                            </th>
                                                            <th>Category</th>
                                                            <th className="d-none">
                                                              Replaced On
                                                            </th>
                                                            <th>Status</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {/* Show all replacement history items */}
                                                          {material.replacementHistory.map(
                                                            (
                                                              oldMaterial,
                                                              index,
                                                            ) => (
                                                              <tr
                                                                key={index}
                                                                className="table-warning"
                                                              >
                                                                <td>
                                                                  <div className="d-flex flex-column">
                                                                    <span className="mb-2">
                                                                      {oldMaterial.product_code ||
                                                                        oldMaterial
                                                                          .fpu_product_id
                                                                          ?.product_code ||
                                                                        "N/A"}
                                                                    </span>

                                                                    {/* Show instruction for replacement history items */}
                                                                    {oldMaterial.instruction && (
                                                                      <span
                                                                        className="text-muted border-top"
                                                                        style={{
                                                                          fontSize:
                                                                            "13px",
                                                                        }}
                                                                      >
                                                                        {
                                                                          oldMaterial.instruction
                                                                        }
                                                                      </span>
                                                                    )}
                                                                  </div>
                                                                </td>
                                                                <td>
                                                                  {oldMaterial.product_name ||
                                                                    oldMaterial
                                                                      .fpu_product_id
                                                                      ?.product_name ||
                                                                    "N/A"}
                                                                </td>
                                                                <td>
                                                                  {oldMaterial.category ||
                                                                    "N/A"}
                                                                </td>
                                                                <td className="d-none">
                                                                  {oldMaterial.replacedAt
                                                                    ? new Date(
                                                                        oldMaterial.replacedAt,
                                                                      ).toLocaleDateString()
                                                                    : "N/A"}
                                                                </td>
                                                                <td>
                                                                  <span className="badge bg-secondary">
                                                                    Replaced
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            ),
                                                          )}

                                                          {/* Show the very original material at the bottom */}
                                                          {material.originalMaterial && (
                                                            <tr className="table-info d-none">
                                                              <td>
                                                                <div className="d-flex flex-column">
                                                                  <span className="mb-2">
                                                                    {material
                                                                      .originalMaterial
                                                                      .product_code ||
                                                                      material
                                                                        .originalMaterial
                                                                        .fpu_product_id
                                                                        ?.product_code ||
                                                                      "N/A"}
                                                                  </span>

                                                                  {/* Show instruction for original material */}
                                                                  {material
                                                                    .originalMaterial
                                                                    .instruction && (
                                                                    <span
                                                                      className="text-muted border-top"
                                                                      style={{
                                                                        fontSize:
                                                                          "13px",
                                                                      }}
                                                                    >
                                                                      {
                                                                        material
                                                                          .originalMaterial
                                                                          .instruction
                                                                      }
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </td>
                                                              <td>
                                                                {material
                                                                  .originalMaterial
                                                                  .product_name ||
                                                                  material
                                                                    .originalMaterial
                                                                    .fpu_product_id
                                                                    ?.product_name ||
                                                                  "N/A"}
                                                              </td>
                                                              <td>
                                                                {material
                                                                  .originalMaterial
                                                                  .category ||
                                                                  "N/A"}
                                                              </td>
                                                              <td className="d-none">
                                                                Original
                                                              </td>
                                                              <td>
                                                                <span className="badge bg-primary">
                                                                  Original
                                                                </span>
                                                              </td>
                                                            </tr>
                                                          )}
                                                        </tbody>
                                                      </table>
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
                                    No materials found
                                  </div>
                                )
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
                })}
                {materialListData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-3">
                      {selectedFinishedProducts.length === 0
                        ? "Please select formulated products first"
                        : "No formulated products to display"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleContainer>

      {/* cost list */}
      <CollapsibleContainer
        title="Costing"
        toggleSection={toggleSection}
        isOpen={isOpen}
      >
        <div
          className="container-fluid scrollable-contents"
          style={{
            minHeight: isOpen ? "300px" : "0px",
            maxHeight: isOpen ? "1000px" : "0px",
            overflowX: "hidden",
            overflowY: "auto",
            transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="mt-3 table-resposnive">
            <table className="table ">
              <thead className="bg-light">
                <tr>
                  <th
                    className="text-muted "
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    Cost Name
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                  <th
                    className="text-muted "
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    Remarks
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                  <th
                    className="text-muted "
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    Cost Amount
                    <i className="fas fa-sort ms-1"></i>
                  </th>

                  <th
                    className="text-muted text-center "
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    Action
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                {costItems.map((item) => {
                  const hasCostError = hasError(`costAmount-${item.id}`);
                  return (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter Name"
                          value={item.name}
                          onChange={(e) =>
                            handleCostItemChange(
                              item.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="form-control"
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          placeholder="Enter Remarks"
                          value={item.remarks}
                          onChange={(e) =>
                            handleCostItemChange(
                              item.id,
                              "remarks",
                              e.target.value,
                            )
                          }
                          className="form-control"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter Amount"
                          maxLength={20}
                          value={item.amount}
                          onChange={(e) =>
                            handleAmountChange(item.id, e.target.value)
                          }
                          onKeyDown={handleAmountKeyPress}
                          className={`form-control ${
                            hasCostError ? "border border-danger" : ""
                          }`}
                        />
                        {hasCostError && (
                          <div className="text-danger small">
                            {validationErrors[`costAmount-${item.id}`]}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="danger"
                          onClick={() => removeCostItem(item.id)}
                          disabled={costItems.length <= 1}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tbody>
                <tr>
                  <td colSpan="2"></td>
                  <td className="px-4 fw-semibold">
                    Total Cost:{" "}
                    {totalCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="text-end mt-3">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={addCostItem}
              >
                New Item
              </button>
            </div>
          </div>
        </div>
      </CollapsibleContainer>
      <div className="row mx-auto">
        <div className="col-sm"></div>
        <div className="col-sm"></div>
        <div className="col-sm"></div>
        <div className="col-sm d-flex flex-row gap-3">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={handleGoBack}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary w-100"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Submitting...
              </>
            ) : (
              <>Submit</>
            )}
          </button>
        </div>
      </div>

      {/* material list modal */}
      <Modal
        show={showAddMaterialModal}
        onHide={handleAddMaterialModalClose}
        backdrop="static"
        size="xl"
      >
        <Modal.Header>
          <Modal.Title>
            Add Material for:{" "}
            {selectedFormulatedProduct?.product_list?.product_code} -{" "}
            {selectedFormulatedProduct?.product_list?.product_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid">
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Materials that already selected in the finished materials list are
              hidden to prevent duplicates.
            </div>

            <Tabs
              defaultActiveKey="rawMaterial"
              id="material-tabs"
              className="mb-3 w-100"
            >
              {/* Vendor Products Tab */}
              {/* <Tab eventKey="vendorMaterial" title="Vendor Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          <div
                            className="d-flex justify-content-center align-items-center"
                            style={{ marginTop: "-25px" }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input p-2"
                              checked={vendorSelectAll}
                              onChange={() =>
                                handleVendorSelectAll(vendorPagination.data)
                              }
                            />
                          </div>
                        </th>
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
                          Vendor
                        </th>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isVendorLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            Loading vendor materials...
                          </td>
                        </tr>
                      ) : vendorPagination.data.length > 0 ? (
                        vendorPagination.data.map((material) => {
                          const uniqueKey = `${material.vendor_id}-${material.product_id}`;
                          const isAlreadySelected =
                            alreadySelectedVendorItems[uniqueKey];
                          const isCurrentlySelected =
                            vendorSelectedItems[uniqueKey] !== undefined
                              ? vendorSelectedItems[uniqueKey]
                              : isAlreadySelected;
                          const isMarkedForRemoval =
                            isAlreadySelected &&
                            vendorSelectedItems[uniqueKey] === false;

                          return (
                            <tr
                              key={material.id || uniqueKey}
                              className={
                                isAlreadySelected
                                  ? isMarkedForRemoval
                                    ? "removed-selected"
                                    : "already-selected"
                                  : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isCurrentlySelected}
                                  onChange={() =>
                                    handleVendorItemSelect(uniqueKey)
                                  }
                                  style={{
                                    backgroundColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                    borderColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                  }}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {material.company_name || "---"}
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            No vendor materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...vendorPagination} />
                </div>
              </Tab> */}
              {/* Raw Products Tab */}
              <Tab eventKey="rawMaterial" title="Raw Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          <div
                            className="d-flex justify-content-center align-items-center"
                            style={{ marginTop: "-25px" }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input p-2"
                              checked={rawSelectAll}
                              onChange={() =>
                                handleRawSelectAll(rawPagination.data)
                              }
                            />
                          </div>
                        </th>
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
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isRawLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            Loading raw materials...
                          </td>
                        </tr>
                      ) : rawPagination.data.length > 0 ? (
                        rawPagination.data.map((material) => {
                          const uniqueKey = `${material.product_id}`;
                          const isAlreadySelected =
                            alreadySelectedRawItems[uniqueKey];
                          const isCurrentlySelected =
                            rawSelectedItems[uniqueKey] !== undefined
                              ? rawSelectedItems[uniqueKey]
                              : isAlreadySelected;
                          const isMarkedForRemoval =
                            isAlreadySelected &&
                            rawSelectedItems[uniqueKey] === false;

                          return (
                            <tr
                              key={material.id || uniqueKey}
                              className={
                                isAlreadySelected
                                  ? isMarkedForRemoval
                                    ? "removed-selected"
                                    : "already-selected"
                                  : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isCurrentlySelected}
                                  onChange={() =>
                                    handleRawItemSelect(uniqueKey)
                                  }
                                  style={{
                                    backgroundColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                    borderColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                  }}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No raw materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...rawPagination} />
                </div>
              </Tab>
              {/* Finished Products Tab */}
              <Tab eventKey="finishedMaterial" title="Finished Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          <div
                            className="d-flex justify-content-center align-items-center"
                            style={{ marginTop: "-25px" }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input p-2"
                              checked={finishedSelectAll}
                              onChange={() =>
                                handleFinishedSelectAll(finishedPagination.data)
                              }
                            />
                          </div>
                        </th>
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
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFinishedLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            Loading finished materials...
                          </td>
                        </tr>
                      ) : finishedPagination.data.length > 0 ? (
                        finishedPagination.data.map((material) => {
                          const uniqueKey = `${material.product_id}`;
                          const isAlreadySelected =
                            alreadySelectedFinishedItems[uniqueKey];
                          const isCurrentlySelected =
                            finishedSelectedItems[uniqueKey] !== undefined
                              ? finishedSelectedItems[uniqueKey]
                              : isAlreadySelected;
                          const isMarkedForRemoval =
                            isAlreadySelected &&
                            finishedSelectedItems[uniqueKey] === false;

                          return (
                            <tr
                              key={material.id || uniqueKey}
                              className={
                                isAlreadySelected
                                  ? isMarkedForRemoval
                                    ? "removed-selected"
                                    : "already-selected"
                                  : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isCurrentlySelected}
                                  onChange={() =>
                                    handleFinishedItemSelect(uniqueKey)
                                  }
                                  style={{
                                    backgroundColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                    borderColor: isAlreadySelected
                                      ? "#28a745"
                                      : "",
                                  }}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No finished materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...finishedPagination} />
                </div>
              </Tab>
            </Tabs>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={handleAddMaterialModalClose}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleAddMaterialsSubmit}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* changing material list modal */}
      <Modal
        show={showChangeMaterialModal}
        onHide={handleChangeMaterialModalClose}
        backdrop="static"
        size="xl"
      >
        <Modal.Header>
          <Modal.Title>
            Replace Material:{" "}
            {selectedMaterialToReplace?.product_name || "Material"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid">
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Select one material to replace the current one. Only one selection
              is allowed.
            </div>

            <Tabs
              defaultActiveKey="rawMaterial"
              id="replacement-material-tabs"
              className="mb-3 w-100"
            >
              {/* Vendor Products Tab */}
              {/* <Tab eventKey="vendorMaterial" title="Vendor Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          Select
                        </th>
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
                          Vendor
                        </th>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isReplacementVendorLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            Loading vendor materials...
                          </td>
                        </tr>
                      ) : replacementVendorPagination.data.length > 0 ? (
                        replacementVendorPagination.data.map((material) => {
                          const isCurrentMaterial =
                            selectedMaterialToReplace &&
                            selectedMaterialToReplace.product_id ===
                              material.product_id &&
                            selectedMaterialToReplace.vendor_id ===
                              material.vendor_id &&
                            selectedMaterialToReplace.category ===
                              "Vendor Product";

                          const isSelected =
                            selectedReplacement &&
                            selectedReplacement.product_id ===
                              material.product_id &&
                            selectedReplacement.vendor_id ===
                              material.vendor_id &&
                            selectedReplacement.replacementCategory ===
                              "Vendor Product";

                          return (
                            <tr
                              key={`vendor-${material.vendor_id}-${material.product_id}`}
                              className={
                                isCurrentMaterial ? "table-active" : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected || isCurrentMaterial}
                                  onChange={() =>
                                    !isCurrentMaterial &&
                                    handleReplacementSelect(
                                      material,
                                      "Vendor Product"
                                    )
                                  }
                                  disabled={isCurrentMaterial}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                                {isCurrentMaterial && (
                                  <span
                                    className="text-muted ms-1"
                                    style={{ fontSize: "12px" }}
                                  >
                                    (Current)
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {material.company_name || "---"}
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            No vendor materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...replacementVendorPagination} />
                </div>
              </Tab> */}

              {/* Raw Products Tab */}
              <Tab eventKey="rawMaterial" title="Raw Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          Select
                        </th>
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
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isReplacementRawLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            Loading raw materials...
                          </td>
                        </tr>
                      ) : replacementRawPagination.data.length > 0 ? (
                        replacementRawPagination.data.map((material) => {
                          const isCurrentMaterial =
                            selectedMaterialToReplace &&
                            selectedMaterialToReplace.product_id ===
                              material.product_id &&
                            selectedMaterialToReplace.category ===
                              "Raw Product";

                          const isSelected =
                            selectedReplacement &&
                            selectedReplacement.product_id ===
                              material.product_id &&
                            selectedReplacement.replacementCategory ===
                              "Raw Product";

                          return (
                            <tr
                              key={`raw-${material.product_id}`}
                              className={
                                isCurrentMaterial ? "table-active" : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected || isCurrentMaterial}
                                  onChange={() =>
                                    !isCurrentMaterial &&
                                    handleReplacementSelect(
                                      material,
                                      "Raw Product",
                                    )
                                  }
                                  disabled={isCurrentMaterial}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                                {isCurrentMaterial && (
                                  <span
                                    className="text-muted ms-1"
                                    style={{ fontSize: "12px" }}
                                  >
                                    (Current)
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No raw materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...replacementRawPagination} />
                </div>
              </Tab>

              {/* Finished Products Tab */}
              <Tab eventKey="finishedMaterial" title="Finished Products">
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4", width: "50px" }}
                        >
                          Select
                        </th>
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
                          Current Stock (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isReplacementFinishedLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            Loading finished materials...
                          </td>
                        </tr>
                      ) : replacementFinishedPagination.data.length > 0 ? (
                        replacementFinishedPagination.data.map((material) => {
                          const isCurrentMaterial =
                            selectedMaterialToReplace &&
                            selectedMaterialToReplace.product_id ===
                              material.product_id &&
                            selectedMaterialToReplace.category ===
                              "Finished Product";

                          const isSelected =
                            selectedReplacement &&
                            selectedReplacement.product_id ===
                              material.product_id &&
                            selectedReplacement.replacementCategory ===
                              "Finished Product";

                          return (
                            <tr
                              key={`finished-${material.product_id}`}
                              className={
                                isCurrentMaterial ? "table-active" : ""
                              }
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected || isCurrentMaterial}
                                  onChange={() =>
                                    !isCurrentMaterial &&
                                    handleReplacementSelect(
                                      material,
                                      "Finished Product",
                                    )
                                  }
                                  disabled={isCurrentMaterial}
                                />
                              </td>
                              <td className="text-center">
                                {material.product_code}
                                {isCurrentMaterial && (
                                  <span
                                    className="text-muted ms-1"
                                    style={{ fontSize: "12px" }}
                                  >
                                    (Current)
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {material.product_name}
                              </td>
                              <td className="text-center">
                                {material.packaging_name} - (
                                {material.packaging_unit_quantity}{" "}
                                {material.packaging_unit})
                              </td>
                              <td className="text-center">
                                {(
                                  material.total_stock *
                                  material.packaging_unit_quantity
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 5,
                                })}{" "}
                                kg
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No finished materials available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls {...replacementFinishedPagination} />
                </div>
              </Tab>
            </Tabs>

            {selectedReplacement && (
              <div className="alert alert-success mt-3">
                <strong>Selected Replacement:</strong>{" "}
                {selectedReplacement.product_code} -{" "}
                {selectedReplacement.product_name}
                {/* {selectedReplacement.company_name &&
                  ` (Vendor: ${selectedReplacement.company_name})`} */}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={handleChangeMaterialModalClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleReplaceMaterial}
            disabled={!selectedReplacement}
          >
            Replace
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateBatchEntry;
