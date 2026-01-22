import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NumericFormat } from "react-number-format";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

const Create_invoice_update = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);

  // Add state to store original data for comparison
  const [originalData, setOriginalData] = useState(null);
  const [originalItems, setOriginalItems] = useState([]);

  // state the discount and vat
  const [scaDiscountPercentage, setScaDiscount] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0);

  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return manilaTime;
  };

  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [customerData, setCustomerData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [cutOffData, setCutOffData] = useState([]);
  const [taxSettingsData, setTaxSettingsData] = useState([]);
  const [selectedInvoiceDate, setSelectedInvoiceDate] =
    useState(getManilaDate());
  const [searchTerm, setSearchTerm] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    "11111111-1111-1111-1111-111111111111",
  );
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState("");
  const [selectedOtherTerms, setSelectedOtherTerms] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  // const [inputPaymentTerms, setInputPaymentTerms] = useState("");
  // const [otherPaymentTerms, setOtherPaymentTerms] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("Local");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [sales_invoiceText, setSales_invoiceText] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  const [remarks, setRemarks] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [taxSelectedID, setTaxSelectedID] = useState("");
  const [salesStatus, setSalesStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const [isCheckedDelivery, setIsCheckedDelivery] = useState(false);
  const [isCheckedTax, setIsCheckedTax] = useState(false);
  const [isZeroRated, setIsZeroRated] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // submit load
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paginationUrlProduct, setPaginationUrlProduct] = useState(
    BASE_URL + "/sales_invoice/getStockmanagement",
  );
  const [show, setShow] = useState(false);

  const paginationProduct = useServerPagination(paginationUrlProduct, 10);

  // Add weight validation state
  const [weightValidations, setWeightValidations] = useState({});

  // Helper function to check if data has changed
  const hasDataChanged = () => {
    if (!originalData || !isUpdate) return true;

    // Check main form fields
    const currentFormData = {
      transactionId,
      sales_invoiceText,
      deliveryText,
      selectedCustomer,
      poNumber,
      selectedDueDate: selectedDueDate?.toISOString?.() || selectedDueDate,
      selectedInvoiceDate:
        selectedInvoiceDate?.toISOString?.() || selectedInvoiceDate,
      selectedMethod,
      selectedPaymentTerms,
      selectedOtherTerms,
      // inputPaymentTerms,
      // otherPaymentTerms,
      selectedDestination,
      selectedCurrency,
      currencyRate,
      isCheckedDelivery,
      isCheckedTax,
      isZeroRated,
      taxSelectedID,
      remarks,
      scaDiscountPercentage,
      vatPercentage,
    };

    const originalFormData = {
      transactionId: originalData.transaction_id,
      sales_invoiceText: originalData.sales_invoice,
      deliveryText: originalData.delivery_number,
      selectedCustomer: originalData.customer?.customer_id,
      poNumber: originalData.po_number,
      selectedDueDate: originalData.due_date,
      selectedInvoiceDate: originalData.invoice_date,
      selectedMethod: originalData.payment_method,
      selectedPaymentTerms: originalData.payment_terms,
      selectedOtherTerms: originalData.other_payment_terms,
      // inputPaymentTerms: originalData.payment_terms,
      // otherPaymentTerms: originalData.other_payment_terms,
      selectedDestination: originalData.destination,
      selectedCurrency: originalData.currency?.id,
      currencyRate: originalData.rate,
      isCheckedDelivery: originalData.is_only_deliver_number,
      isCheckedTax: originalData.is_tax_applied,
      isZeroRated: originalData.isZeroRated,
      taxSelectedID: originalData.tax_setting?.id,
      remarks: originalData.remarks,
      scaDiscountPercentage: originalData.sca_discount_percentage,
      vatPercentage: originalData.vat_percentage,
    };

    // Check if form data changed
    for (const key in currentFormData) {
      if (currentFormData[key] !== originalFormData[key]) {
        console.log(`Form field changed: ${key}`, {
          current: currentFormData[key],
          original: originalFormData[key],
        });
        return true;
      }
    }

    // Check if items changed
    const currentActiveItems = selectedItems.filter((item) => !item.isDeleted);
    const originalActiveItems = originalItems.filter((item) => !item.isDeleted);

    if (currentActiveItems.length !== originalActiveItems.length) {
      console.log("Items count changed");
      return true;
    }

    // Check each item for changes
    for (const currentItem of currentActiveItems) {
      const originalItem = originalActiveItems.find(
        (orig) => orig.product_id === currentItem.product_id,
      );

      if (!originalItem) {
        console.log("New item added:", currentItem.product_id);
        return true;
      }

      // Check if quantity, unit price, or discount changed
      if (
        Number(currentItem.quantity) !== Number(originalItem.quantity) ||
        Number(currentItem.unitPrice) !== Number(originalItem.unitPrice) ||
        Number(currentItem.discount) !== Number(originalItem.discount)
      ) {
        console.log("Item data changed:", currentItem.product_id, {
          current: {
            quantity: currentItem.quantity,
            unitPrice: currentItem.unitPrice,
            discount: currentItem.discount,
          },
          original: {
            quantity: originalItem.quantity,
            unitPrice: originalItem.unitPrice,
            discount: originalItem.discount,
          },
        });
        return true;
      }
    }

    return false;
  };

  // Helper function to get original quantity for an item
  const getOriginalQuantity = (productId) => {
    const originalItem = originalItems.find(
      (item) => item.product_id === productId,
    );
    return originalItem ? Number(originalItem.quantity) : 0;
  };

  // Helper function to calculate new stock for update mode
  const calculateNewStockForUpdate = (item) => {
    if (!isUpdate) {
      // For create mode, calculate normally
      return item.quantity && item.quantity > 0
        ? item.current_stock - item.quantity
        : null;
    }

    // For update mode:
    // 1. Find the original quantity
    const originalItem = originalItems.find(
      (origItem) => origItem.product_id === item.product_id,
    );
    const originalQuantity = originalItem ? Number(originalItem.quantity) : 0;
    const currentQuantity = Number(item.quantity) || 0;

    if (currentQuantity === originalQuantity) {
      // Quantity hasn't changed from original, don't show new stock calculation
      // return null;
    }

    // Calculate new stock:
    // current_stock + original_quantity (undo previous deduction) - new_quantity
    return item.current_stock + originalQuantity - currentQuantity;
  };

  const handleShow = async () => {
    try {
      const baseUrl = BASE_URL + "/sales_invoice/getStockmanagement";
      setPaginationUrlProduct(baseUrl);

      await paginationProduct.updateParams({
        selectedWarehouse: selectedWarehouse,
        page: 1,
      });

      setShow(true);
    } catch (error) {
      console.error("Failed to load products:", error);
      // Show error to user if needed
    }
  };

  const handleSearchProduct = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    setPaginationUrlProduct(
      BASE_URL + "/sales_invoice/getStockmanagent_Search",
    );

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      paginationProduct.updateParams({
        searchTerm: value,
        selectedWarehouse: selectedWarehouse,
      });
    }, 500);

    setDebounceTimer(timer);
  };

  const handleCheckBoxTax = (e) => {
    setIsCheckedTax(e.target.checked);

    if (e.target.checked === true) {
      fetchTaxSettings();
    } else {
      setTaxSettingsData([]);
      setTaxSelectedID("");
    }
  };

  const handleCheckBoxZeroRated = (e) => {
    setIsZeroRated(e.target.checked);
  };

  const fetchTaxSettings = () => {
    axios
      .get(BASE_URL + "/sales_invoice/getTaxSettings")
      .then((res) => {
        setTaxSettingsData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchTransactionCode = (isDeliveryChecked) => {
    const now = new Date();
    const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const formattedDateTime = manilaTime
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const randomTwoDigits = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");

    if (!identifier) {
      setIdentifier(`${formattedDateTime}${randomTwoDigits}`);
    }

    const prefix = isDeliveryChecked ? "DC" : "SI";
    const customTransactionId = identifier
      ? `${prefix}-${identifier}`
      : `${prefix}-${formattedDateTime}${randomTwoDigits}`;
    setTransactionId(customTransactionId);
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/invoice/getCutoffPosted")
      .then((res) => {
        setCutOffData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCustomerCurrency = async () => {
    try {
      const [currencyRes, customerRes] = await Promise.all([
        axios.get(`${BASE_URL}/currency/fetchCurrency`),
        axios.get(`${BASE_URL}/invoice/getCustomersData`),
      ]);

      setCurrencyData(currencyRes.data);

      const sortedCustomerList = customerRes.data.sort(
        (a, b) => b.customer_id - a.customer_id,
      );
      setCustomerData(sortedCustomerList);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalesSpecificData = async (salesId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/sales_invoice/getSpecificSalesData`,
        {
          params: { id: salesId },
        },
      );

      if (response.data) {
        const data = response.data;

        // Store original data for comparison
        setOriginalData(data);

        setInvoiceTitle(data.invoice_title);
        setTransactionId(data.transaction_id);
        setSelectedDestination(data.destination);
        setSales_invoiceText(data.sales_invoice);
        setIsCheckedDelivery(data.is_only_deliver_number);
        setDeliveryText(data.delivery_number);
        setSelectedCustomer(data.customer?.customer_id);
        setPoNumber(data.po_number);
        setSelectedDueDate(data.due_date);
        setSelectedInvoiceDate(data.invoice_date);
        setSelectedMethod(data.payment_method);
        setSelectedPaymentTerms(data.payment_terms);
        setSelectedOtherTerms(data.other_payment_terms);
        // setInputPaymentTerms(data.payment_terms);
        setIsCheckedTax(data.is_tax_applied);
        setIsZeroRated(data.isZeroRated);
        setTaxSelectedID(data.tax_setting?.id);
        setSelectedCurrency(data.currency?.id);
        setRemarks(data.remarks);
        setSalesStatus(data.status);
        setScaDiscount(data.sca_discount_percentage || 0);
        setVatPercentage(data.vat_percentage || 0);

        if (
          data.products &&
          Array.isArray(data.products) &&
          data.products.length > 0
        ) {
          const formattedItems = data.products.map((item) => ({
            salesTagProductId: item.salesTagProductId,
            product_id: item.product_id,
            product_code: item.product_code || "",
            product_name: item.product_name || "",
            quantity: parseFloat(item.quantity) || 0,
            unitPrice:
              parseFloat(item.unitPrice) ||
              parseFloat(item.product_srp_amount) ||
              0,
            discount: parseFloat(item.discount) || 0,
            subtotal: parseFloat(item.subtotal) || 0,
            isDeleted: false,
            srp_amount: parseFloat(item.product_srp_amount) || 0,
            current_stock: item.current_stock || 0,
            packaging_name: item.packaging_name || "",
            unit_quantity: item.unit_quantity || 0,
            unit: item.unit || "",
          }));

          setSelectedItems(formattedItems);
          // Store original items for comparison
          setOriginalItems(JSON.parse(JSON.stringify(formattedItems)));

          // Initialize weight validations
          const initialValidations = {};
          formattedItems.forEach((item) => {
            initialValidations[item.product_id] = true;
          });
          setWeightValidations(initialValidations);
        } else {
          console.warn("No products found in response data:", data);
          setSelectedItems([]);
          setOriginalItems([]);
          setWeightValidations({});
        }
      } else {
        console.error("No data received from API");
        setSelectedItems([]);
        setOriginalItems([]);
        setWeightValidations({});
      }
    } catch (error) {
      console.error("Error fetching sales invoice:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      swal({
        title: "Error",
        text:
          "Failed to fetch sales invoice data: " +
          (error.response?.data?.message || error.message),
        icon: "error",
        buttons: false,
        timer: 3000,
      });

      setSelectedItems([]);
      setOriginalItems([]);
      setWeightValidations({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = async (customerID) => {
    setSelectedCustomer(customerID);

    try {
      const [customerRes, productsRes] = await Promise.all([
        axios.get(`${BASE_URL}/customer/getCustomerDetails`, {
          params: { customerId: customerID },
        }),
        axios.get(`${BASE_URL}/customer/fetchProduct`, {
          params: { id: customerID },
        }),
      ]);

      const customerDetails = customerRes.data;
      setSelectedMethod(customerDetails.payment_method);
      setSelectedPaymentTerms(customerDetails.payment_terms);
      setSelectedOtherTerms(customerDetails.other_payment_terms);
      setSelectedCurrency(customerDetails.currency_id);
      setScaDiscount(customerDetails.discount_percentage || 0);
      setVatPercentage(customerDetails.vat_percentage || 0);
      // if currency has conversion rate, set it here
      const curr = currencyData.find(
        (data) => String(data.id) === String(customerDetails.currency_id),
      );
      setCurrencyRate(curr ? curr.currency_rate : null);

      if (
        productsRes.data &&
        Array.isArray(productsRes.data) &&
        productsRes.data.length > 0
      ) {
        // Extract product IDs to fetch their current stock
        const productIds = productsRes.data
          .map(
            (item) => item.ptc_product_id?.product_id || item.product_id || "",
          )
          .filter(Boolean);

        // Fetch current stock for these products
        let stockMap = {};
        if (productIds.length > 0) {
          const stockResponse = await axios.get(
            `${BASE_URL}/sales_invoice/getStockmanagement`,
            {
              params: {
                selectedWarehouse: selectedWarehouse,
                productIds: productIds.join(","),
              },
            },
          );

          // Create a map of product_id to current_stock
          stockMap = stockResponse.data.data.reduce((map, item) => {
            map[item.product_id] = item.current_stock || 0;
            return map;
          }, {});
        }

        const formattedItems = productsRes.data.map((item) => {
          const productId =
            item.ptc_product_id?.product_id || item.product_id || "";
          return {
            product_id: productId,
            product_code: item.ptc_product_id?.product_code || "",
            product_name: item.ptc_product_id?.product_name || "",
            quantity: null,
            unitPrice:
              parseFloat(item.product_price) ||
              parseFloat(item.ptc_product_id?.srp_amount) ||
              0,
            discount: 0,
            subtotal: 0,
            isDeleted: false,
            srp_amount: parseFloat(item.ptc_product_id?.srp_amount) || 0,
            current_stock: stockMap[productId] || 0, // Use the fetched stock or 0 if not found
            packaging_name:
              item.ptc_product_id?.prod_packaging?.packaging_name || "",
            unit_quantity:
              item.ptc_product_id?.prod_packaging?.unit_quantity || 0,
            unit: item.ptc_product_id?.prod_packaging?.unit || "",
          };
        });

        setSelectedItems(formattedItems);

        // Initialize weight validations for new items
        const initialValidations = {};
        formattedItems.forEach((item) => {
          initialValidations[item.product_id] = true;
        });
        setWeightValidations(initialValidations);
      } else {
        setSelectedItems([]);
        setWeightValidations({});
      }
    } catch (error) {
      console.error("Error in handleSelectCustomer:", error);
      swal({
        title: "Error",
        text: "Failed to load customer products",
        icon: "error",
      });
    }
  };

  const handleEditTransaction = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (id) {
      fetchSalesSpecificData(id);
      setIsUpdate(true);
      setIsEditing(true);
      setIsDisabled(true);
    } else {
      fetchTransactionCode(isCheckedDelivery);
      fetchCutOff();
      fetchSeriesNumbers();
      setIsEditing(false);
      setIsUpdate(false);
    }
    fetchCustomerCurrency();
    fetchTaxSettings();
  }, [id]);

  const fetchSeriesNumbers = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/general-settings/get-series-numbers`,
      );

      if (response.status === 200) {
        const { salesInvoice, deliveryConfirmation, deliveryReceipt } =
          response.data;

        // Helper function to format series number with alphabetical prefix
        const formatSeriesNumber = (data) => {
          if (!data.value) return "";

          let formatted = data.value;

          // Check if alphabetical value exists
          if (data.alphabeticalValue && data.alphabeticalValue.trim() !== "") {
            formatted = `${data.alphabeticalValue.toUpperCase()}-${formatted}`;
          }

          return formatted;
        };

        // For Sales Invoice
        if (!isCheckedDelivery && salesInvoice.value && salesInvoice.isActive) {
          const formattedSI = formatSeriesNumber(salesInvoice);
          setSales_invoiceText(formattedSI);

          // For Delivery Receipt (when SI is active)
          if (deliveryReceipt.value && deliveryReceipt.isActive) {
            const formattedDR = formatSeriesNumber(deliveryReceipt);
            setDeliveryText(formattedDR);
          }
        }

        // For Delivery Confirmation
        if (
          isCheckedDelivery &&
          deliveryConfirmation.value &&
          deliveryConfirmation.isActive
        ) {
          const formattedDC = formatSeriesNumber(deliveryConfirmation);
          setDeliveryText(formattedDC);
        }
      }
    } catch (error) {
      console.error("Error fetching series numbers:", error);
      await swal({
        title: "Error!",
        text: "Failed to load series numbers. Please try again.",
        icon: "error",
        button: "OK",
      });
    }
  };

  // Helper function to parse series number into components
  const parseSeriesNumber = (formattedNumber) => {
    if (!formattedNumber) return { alphabetical: "", numeric: "" };

    // Check if there's a dash in the format
    const dashIndex = formattedNumber.indexOf("-");

    if (dashIndex !== -1) {
      // Format: AAA-00001
      const alphabetical = formattedNumber.substring(0, dashIndex);
      const numeric = formattedNumber.substring(dashIndex + 1);
      return { alphabetical, numeric };
    } else {
      // Format: 00001 (no alphabetical prefix)
      return { alphabetical: "", numeric: formattedNumber };
    }
  };

  useEffect(() => {
    fetchTransactionCode(isCheckedDelivery);
    if (!id) {
      fetchSeriesNumbers();
    }
  }, [isCheckedDelivery]);

  // validate if duplicate sales invoice, delivery receipt or delivery confirmation

  // Add validation states
  const [salesInvoiceValidation, setSalesInvoiceValidation] = useState({
    isValid: true,
    message: "",
    isChecking: false,
    isDuplicate: false,
    lastCheckedValue: "",
  });

  const [deliveryValidation, setDeliveryValidation] = useState({
    isValid: true,
    message: "",
    isChecking: false,
    isDuplicate: false,
    lastCheckedValue: "",
  });

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Add debounce timer for validation
  const [validationDebounceTimer, setValidationDebounceTimer] = useState(null);

  // Validation function for series numbers
  // Validation function for series numbers
  const validateSeriesNumber = async (type, value) => {
    // Skip validation for update mode if value hasn't changed from original
    if (isUpdate && id && originalData) {
      const originalValue =
        type === "sales_invoice"
          ? originalData.sales_invoice
          : originalData.delivery_number;

      if (value === originalValue) {
        // Value hasn't changed, no need to validate
        if (type === "sales_invoice") {
          setSalesInvoiceValidation({
            isValid: true,
            message: "",
            isChecking: false,
            isDuplicate: false,
            lastCheckedValue: value,
          });
        } else {
          setDeliveryValidation({
            isValid: true,
            message: "",
            isChecking: false,
            isDuplicate: false,
            lastCheckedValue: value,
          });
        }
        checkOverallValidation();
        return;
      }
    }

    if (!value || value.trim() === "") {
      // Reset validation if empty
      if (type === "sales_invoice") {
        setSalesInvoiceValidation({
          isValid: true,
          message: "",
          isChecking: false,
        });
      } else {
        setDeliveryValidation({
          isValid: true,
          message: "",
          isChecking: false,
        });
      }
      setIsButtonDisabled(false);
      return;
    }

    // Set checking state
    if (type === "sales_invoice") {
      setSalesInvoiceValidation((prev) => ({ ...prev, isChecking: true }));
    } else {
      setDeliveryValidation((prev) => ({ ...prev, isChecking: true }));
    }

    try {
      const params = {};

      // Send the FULL formatted text for validation
      if (type === "sales_invoice") {
        params.salesInvoice = value;
      } else {
        params.deliveryNumber = value;
        params.isOnlyDelivery = isCheckedDelivery.toString();
      }

      const response = await axios.get(
        `${BASE_URL}/sales_invoice/seriesNumberValidation`,
        { params },
      );

      if (response.data.exists) {
        // Check which specific field has the duplicate
        let message = "";
        let isSalesInvoiceDuplicate = false;
        let isDeliveryDuplicate = false;

        if (
          type === "sales_invoice" &&
          response.data.details?.salesInvoice?.exists
        ) {
          message = "Sales Invoice number already exists!";
          isSalesInvoiceDuplicate = true;
        } else if (
          type === "delivery" &&
          response.data.details?.deliveryNumber?.exists
        ) {
          message = isCheckedDelivery
            ? "Delivery Confirmation number already exists!"
            : "Delivery Receipt number already exists!";
          isDeliveryDuplicate = true;
        } else {
          message = "Series number already exists!";
        }

        if (type === "sales_invoice") {
          setSalesInvoiceValidation({
            isValid: false,
            message,
            isChecking: false,
            isDuplicate: isSalesInvoiceDuplicate,
          });
        } else {
          setDeliveryValidation({
            isValid: false,
            message,
            isChecking: false,
            isDuplicate: isDeliveryDuplicate,
          });
        }

        setIsButtonDisabled(true);
      } else {
        if (type === "sales_invoice") {
          setSalesInvoiceValidation({
            isValid: true,
            message: "",
            isChecking: false,
            isDuplicate: false,
          });
        } else {
          setDeliveryValidation({
            isValid: true,
            message: "",
            isChecking: false,
            isDuplicate: false,
          });
        }

        // Only enable button if both validations pass
        checkOverallValidation();
      }
    } catch (error) {
      console.error("Validation error:", error);
      const errorMessage = "Error checking validation. Please try again.";

      if (type === "sales_invoice") {
        setSalesInvoiceValidation({
          isValid: false, // Set to false on error to be safe
          message: errorMessage,
          isChecking: false,
          isDuplicate: true, // Assume duplicate on error
        });
      } else {
        setDeliveryValidation({
          isValid: false, // Set to false on error to be safe
          message: errorMessage,
          isChecking: false,
          isDuplicate: true, // Assume duplicate on error
        });
      }
      setIsButtonDisabled(true);
    }
  };

  // Check overall validation status
  const checkOverallValidation = () => {
    // Don't disable if we're in update mode (editing existing invoice)
    if (isUpdate && id) {
      setIsButtonDisabled(false);
      return;
    }

    const salesInvoiceValid =
      !sales_invoiceText ||
      (salesInvoiceValidation.isValid && !salesInvoiceValidation.isDuplicate);

    const deliveryValid =
      !deliveryText ||
      (deliveryValidation.isValid && !deliveryValidation.isDuplicate);

    setIsButtonDisabled(!(salesInvoiceValid && deliveryValid));
  };

  // Debounced validation handler
  const handleSeriesNumberChange = (type, value) => {
    // Clear existing timer
    if (validationDebounceTimer) {
      clearTimeout(validationDebounceTimer);
    }

    // Set new timer for debounce
    const timer = setTimeout(() => {
      validateSeriesNumber(type, value);
    }, 500); // 500ms debounce

    setValidationDebounceTimer(timer);
  };

  // Handle sales invoice change
  const handleSalesInvoiceChange = (e) => {
    const value = e.target.value;
    setSales_invoiceText(value);

    if (!isCheckedDelivery) {
      handleSeriesNumberChange("sales_invoice", value);
    }
  };

  // Handle delivery text change
  const handleDeliveryTextChange = (e) => {
    const value = e.target.value;
    setDeliveryText(value);
    handleSeriesNumberChange("delivery", value);
  };

  // Handle delivery checkbox change
  const handleDeliveryCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setIsCheckedDelivery(isChecked);
    setSales_invoiceText("");

    // Reset validations when switching modes
    setSalesInvoiceValidation({
      isValid: true,
      message: "",
      isChecking: false,
    });
    setDeliveryValidation({ isValid: true, message: "", isChecking: false });
    setIsButtonDisabled(false);

    // If delivery text exists, validate it with new mode
    if (deliveryText) {
      handleSeriesNumberChange("delivery", deliveryText);
    }
  };

  const handleCurrencyRateChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setCurrencyRate(formattedValue);
  };

  const dateValidation = async (selectedDate, clearField) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      if (res.data === false) {
        swal({
          icon: "error",
          title: "Invalid Date Selection",
          text: "Please Create Cutoff for this Date",
        }).then(() => {
          clearField("");
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDueDateChange = (date) => {
    const dueDate = date;
    setSelectedDueDate(dueDate);
  };

  const handleDueInvoiceDate = (date) => {
    const invoiceDate = date;
    setSelectedInvoiceDate(invoiceDate);
    if (invoiceDate) {
      dateValidation(invoiceDate, setSelectedInvoiceDate);
    }

    const isWithinCutoff =
      cutOffData &&
      cutOffData.some((cutoff) => {
        const fromDate = new Date(cutoff.from);
        const toDate = new Date(cutoff.to);
        const selectedDate = new Date(invoiceDate);

        return selectedDate >= fromDate && selectedDate <= toDate;
      });

    if (isWithinCutoff) {
      swal({
        icon: "warning",
        title: "Invoice Date Conflict",
        text: "The invoice date you selected is already posted in the cutoff period!",
        confirmButtonColor: "#d33",
      }).then(() => {
        setSelectedInvoiceDate("");
      });
    }
  };

  const CancelInvoice = () => {
    navigate("/sales/invoices");
  };

  const handleChangeCurrency = (value) => {
    const curr = currencyData.find((data) => String(data.id) === String(value));
    setSelectedCurrency(curr.id);
    setCurrencyRate(curr.currency_rate);
  };

  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control custom-form-height w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
        backgroundColor: !isEditing ? "white" : "#e9ecef",
        color: !isEditing ? "black" : "gray",
        cursor: !isEditing ? "pointer" : "not-allowed",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      required
      placeholder="Select Date"
    />
  ));

  const handleCheckSelectProduct = (item, isChecked) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);

      if (isChecked) {
        if (existing) {
          return prev.map((i) =>
            i.product_id === item.product_id ? { ...i, isDeleted: false } : i,
          );
        } else {
          const packaging =
            item.prod_packaging || item.ptc_product_id?.prod_packaging;
          return [
            ...prev,
            {
              ...item,
              isDeleted: false,
              quantity: null, // Changed from 0 to null
              unitPrice:
                item.srp_amount || item.ptc_product_id?.srp_amount || 0,
              discount: 0,
              srp_amount:
                item.srp_amount || item.ptc_product_id?.srp_amount || 0,
              packaging_name: packaging?.packaging_name || "",
              unit_quantity: packaging?.unit_quantity || 0,
              unit: packaging?.unit || "",
            },
          ];
        }
      } else {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, isDeleted: true } : i,
        );
      }
    });

    // Update weight validation state when item is selected/deselected
    if (isChecked) {
      setWeightValidations((prev) => ({
        ...prev,
        [item.product_id]: true,
      }));
    } else {
      setWeightValidations((prev) => {
        const newValidations = { ...prev };
        delete newValidations[item.product_id];
        return newValidations;
      });
    }
  };

  const isItemSelected = (item) =>
    selectedItems.some(
      (i) => i.product_id === item.product_id && i.isDeleted === false,
    );

  // Validate weight (must be greater than 0)
  const validateWeight = (weightValue) => {
    return weightValue !== null && weightValue !== undefined && weightValue > 0;
  };

  // item quantity
  const handleQuantityChange = (productId, weightValue) => {
    const item = selectedItems.find((i) => i.product_id === productId);
    if (!item) return;

    // If weightValue is undefined/null/empty, set quantity to null
    if (
      weightValue === undefined ||
      weightValue === null ||
      weightValue === ""
    ) {
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.product_id === productId ? { ...item, quantity: null } : item,
        ),
      );
      // Set weight as invalid when empty
      setWeightValidations((prev) => ({
        ...prev,
        [productId]: false,
      }));
      return;
    }

    // Validate weight
    const isValidWeight = validateWeight(weightValue);
    setWeightValidations((prev) => ({
      ...prev,
      [productId]: isValidWeight,
    }));

    // Convert weight to quantity by dividing by unit_quantity
    const quantity = weightValue / item.unit_quantity;

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: quantity } : item,
      ),
    );
  };

  // item unit price
  const handleUnitPriceChange = (productId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, unitPrice: Number(value) || 0 }
          : item,
      ),
    );
  };

  // item discount
  const handleDiscountChange = (productId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              discount: typeof value === "string" ? value : Number(value) || 0,
            }
          : item,
      ),
    );
  };

  // Calculate subtotal for individual item
  const calculateSubtotal = (quantity, unitPrice, discount) => {
    const gross = quantity * unitPrice;
    const discountAmount = (gross * discount) / 100;
    const subtotal = gross - discountAmount;

    return subtotal;
  };

  // Calculate total gross amount
  const calculateTotalGross = () => {
    return selectedItems
      .filter((item) => item.isDeleted === false)
      .reduce((total, item) => {
        const subtotal = calculateSubtotal(
          item.quantity || 0,
          item.unitPrice || item.srp_amount || 0,
          item.discount || 0,
        );
        return total + subtotal;
      }, 0);
  };

  const calculateDiscountAmount = (quantity, unitPrice, discount) => {
    const gross = quantity * unitPrice;
    return (gross * discount) / 100;
  };

  const calculateTotalDiscountedAmount = () => {
    return selectedItems
      .filter((item) => item.isDeleted === false)
      .reduce((total, item) => {
        const discountAmount = calculateDiscountAmount(
          item.quantity || 0,
          item.unitPrice || 0,
          item.discount || 0,
        );
        return total + discountAmount;
      }, 0);
  };

  // Get selected tax rate
  const getSelectedTaxRate = () => {
    if (!isCheckedTax || !taxSelectedID) return 0;
    const selectedTax = taxSettingsData.find((tax) => tax.id === taxSelectedID);
    return selectedTax ? selectedTax.rate : 0;
  };

  // Calculate withhold tax deduction
  const calculateWithholdTax = () => {
    if (!isCheckedTax) return 0;
    const totalGross = calculateTotalGross();
    const taxRate = getSelectedTaxRate();
    return (totalGross * taxRate) / 100;
  };

  // calculate sca amount
  const calculateSCAAmount = () => {
    const totalGross = calculateTotalGross();
    const totalItemDiscount = calculateTotalDiscountedAmount();
    const baseAmount = totalGross - totalItemDiscount;

    if (baseAmount <= 0) return 0;

    return (baseAmount * scaDiscountPercentage) / 100;
  };

  // calculate vat amount
  const calculateVatAmount = () => {
    const totalGross = calculateTotalGross();
    const totalItemDiscount = calculateTotalDiscountedAmount();
    const scaAmount = calculateSCAAmount();

    const baseAmount = totalGross - totalItemDiscount - scaAmount;
    if (baseAmount <= 0) return 0;

    return (baseAmount * vatPercentage) / 100;
  };

  // Calculate net receivable amount
  const calculateNetReceivable = () => {
    const totalGross = calculateTotalGross();
    const itemDiscount = calculateTotalDiscountedAmount();
    const scaAmount = calculateSCAAmount();
    const vatAmount = calculateVatAmount();
    const withholdTax = calculateWithholdTax();

    return totalGross - itemDiscount - scaAmount + vatAmount - withholdTax;
  };

  // Validate all weights before submission
  const validateAllWeights = () => {
    const activeItems = selectedItems.filter(
      (item) => item.isDeleted === false,
    );
    let allValid = true;

    const newValidations = { ...weightValidations };

    activeItems.forEach((item) => {
      const weightValue =
        item.quantity === null ? null : item.quantity * item.unit_quantity;
      const isValid = validateWeight(weightValue);
      newValidations[item.product_id] = isValid;
      if (!isValid) {
        allValid = false;
      }
    });

    setWeightValidations(newValidations);
    return allValid;
  };

  const handleSubmitFormulation = async (e) => {
    // Check series number validations before submitting
    if (!salesInvoiceValidation.isValid || !deliveryValidation.isValid) {
      e.preventDefault();
      swal({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the series number validation errors before submitting.",
      });
      return;
    }

    if (isButtonDisabled) {
      e.preventDefault();
      swal({
        icon: "error",
        title: "Validation Error",
        text: "Please fix all validation errors before submitting.",
      });
      return;
    }

    // Continue with existing submission logic
    setIsSubmitting(true);
    e.preventDefault();
    const form = e.currentTarget;
    const activeItems = selectedItems.filter(
      (item) => item.isDeleted === false,
    );

    // Validation: required fields
    if (form.checkValidity() === false || activeItems.length === 0) {
      e.preventDefault();
      e.stopPropagation();

      let errorMessage = "Please fill in the red text fields.";
      if (activeItems.length === 0) {
        errorMessage = "Please select at least one product.";
      }

      console.log("Validation failed:", { errorMessage, activeItems });

      swal({
        icon: "error",
        title: "Fields are required",
        text: errorMessage,
      }).then(() => {
        setIsSubmitting(false);
      });

      setValidated(true);
      return;
    }

    // Validation: invalid weight (must be greater than 0)
    const areWeightsValid = validateAllWeights();
    if (!areWeightsValid) {
      swal({
        icon: "error",
        title: "Invalid Weight",
        text: "Please ensure all weights are greater than 0.",
      }).then(() => {
        setIsSubmitting(false);
      });
      return;
    }

    // Validation: invalid quantity or unit price
    const invalidItems = activeItems.filter(
      (item) =>
        item.quantity === null || // Check for null
        item.quantity <= 0 ||
        !item.unitPrice ||
        item.unitPrice <= 0,
    );

    if (invalidItems.length > 0) {
      console.log("Invalid items found:", invalidItems);
      swal({
        icon: "error",
        title: "Invalid Product Data",
        text: "Please ensure all selected products have valid quantity and unit price.",
      }).then(() => {
        setIsSubmitting(false);
      });
      return;
    }

    // Validation: no changes detected for update
    if (isUpdate && !hasDataChanged()) {
      swal({
        icon: "info",
        title: "No Changes Detected",
        text: "No changes have been made to update.",
        timer: 2000,
      }).then(() => {
        setIsSubmitting(false);
      });
      return;
    }

    // Prepare confirmation message
    const confirmMessage = isUpdate
      ? "Update this sales invoice?"
      : "Create this new sales invoice?";

    swal({
      title: confirmMessage,
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (!confirmed) {
        // User clicked Cancel
        setIsSubmitting(false);
        return;
      }

      // Build line items payload
      const lineItems = activeItems.map((item) => {
        const subtotal = calculateSubtotal(
          item.quantity || 0,
          item.unitPrice || item.avgPrice || 0,
          item.discount || 0,
        );

        const base = {
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity || 0,
          unit_price: item.unitPrice || item.avgPrice || 0,
          discount_percentage: item.discount || 0,
          subtotal: subtotal,
        };

        if (isUpdate && item.salesTagProductId) {
          base.salesTagProductId = item.salesTagProductId;
        }

        return base;
      });

      // Calculate totals
      const totalGross = calculateTotalGross();
      const totalDiscountedAmount = calculateTotalDiscountedAmount();
      const withholdTax = calculateWithholdTax();
      const netReceivableAmount = calculateNetReceivable();
      const scaDiscountAmount = calculateSCAAmount(); // FIXED: This is the correct variable
      const vatAmount = calculateVatAmount();

      // Parse the series numbers for submission - FIXED: Call parseSeriesNumber function directly
      const salesInvoiceParsed = parseSeriesNumber(sales_invoiceText);
      const deliveryParsed = parseSeriesNumber(deliveryText);

      const payload = {
        transactionId,
        invoiceTitle,
        // Send separated values
        sales_invoiceText,
        deliveryText,
        isDeliveryConfirmation: isCheckedDelivery, // true for DC, false for DR
        selectedCustomer,
        poNumber,
        selectedDueDate,
        selectedInvoiceDate,
        selectedMethod,
        selectedPaymentTerms,
        selectedOtherTerms,
        remarks,
        userLoggedID,
        selectedDestination,
        selectedCurrency,
        currencyRate,
        selectedWarehouse,
        isCheckedDelivery,
        isCheckedTax,
        isZeroRated,
        taxSelectedID,
        productLists: lineItems,
        lineItems: lineItems,
        totalGross: totalGross,
        totalDiscountedAmount: totalDiscountedAmount,
        withholdTaxAmount: withholdTax,
        netReceivableAmount: netReceivableAmount,
        taxRate: getSelectedTaxRate(),

        scaDiscountPercentage: scaDiscountPercentage,
        scaDiscountAmount: scaDiscountAmount, // FIXED: Changed from scaAmount to scaDiscountAmount
        vatPercentage: vatPercentage,
        vatAmount: vatAmount,

        selectedTaxName:
          isCheckedTax && taxSelectedID
            ? taxSettingsData.find((tax) => tax.id === taxSelectedID)?.name ||
              ""
            : "",
        id: id,
      };

      console.log("Full payload to be submitted:", payload);

      const endpoint = isUpdate
        ? `${BASE_URL}/sales_invoice/updateSales`
        : `${BASE_URL}/sales_invoice/createSales2`;

      axios
        .post(endpoint, payload)
        .then((res) => {
          if (res.status === 200) {
            const successMessage = isUpdate
              ? "Sales invoice updated successfully"
              : "Sales invoice created successfully";

            console.log("Success:", {
              message: successMessage,
              response: res.data,
              totalDiscountedAmount,
            });

            swal({
              title: "Success",
              text: successMessage,
              icon: "success",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              navigate("../sales/invoices");
              // setIsSubmitting(false);
            });
          } else {
            console.error("Unexpected response:", res);
            swal({
              title: "Something Went Wrong",
              text: "Please contact your support immediately",
              icon: "error",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              setIsSubmitting(false);
            });
          }
        })
        .catch((error) => {
          console.error("Error creating sales invoice:", {
            error: error.response ? error.response.data : error.message,
            payload: payload,
            totalDiscountedAmount,
          });

          swal({
            title: "Error",
            text: "Failed to create sales invoice. Please try again.",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            setIsSubmitting(false);
          });
        });
    });

    setValidated(true);
  };

  // formatter
  const formatSmallDecimals = (value) => {
    const num = Number(value);
    if (num < 0.05) {
      // For very small values, show up to 4 decimal places
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 5,
      });
    }
    // For normal values, show 2 decimal places
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // HANDLE SCA/PWD DISCOUNT CHANGE
  const handleScaChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");

    if ((value.match(/\./g) || []).length > 1) return;

    let num = parseFloat(value);

    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;

    setScaDiscount(num);
  };

  // HANDLE VAT CHANGE
  const handleVatChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");

    if ((value.match(/\./g) || []).length > 1) return;

    let num = parseFloat(value);

    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;

    setVatPercentage(num);
  };

  useEffect(() => {
    return () => {
      if (validationDebounceTimer) {
        clearTimeout(validationDebounceTimer);
      }
    };
  }, [validationDebounceTimer]);

  // Reset validations when component mounts or updates
  useEffect(() => {
    if (isUpdate && id) {
      // For update mode, don't validate existing numbers against themselves
      setSalesInvoiceValidation({
        isValid: true,
        message: "",
        isChecking: false,
      });
      setDeliveryValidation({ isValid: true, message: "", isChecking: false });
      setIsButtonDisabled(false);
    }
  }, [isUpdate, id]);

  // Reset validations when component mounts or updates
  useEffect(() => {
    if (isUpdate && id && originalData) {
      // For update mode, don't validate existing numbers against themselves
      // We'll track the original values
      const originalSalesInvoice = originalData.sales_invoice || "";
      const originalDeliveryNumber = originalData.delivery_number || "";

      // Only validate if the user changed the values
      if (sales_invoiceText === originalSalesInvoice) {
        setSalesInvoiceValidation({
          isValid: true,
          message: "",
          isChecking: false,
          isDuplicate: false,
          lastCheckedValue: sales_invoiceText,
        });
      }

      if (deliveryText === originalDeliveryNumber) {
        setDeliveryValidation({
          isValid: true,
          message: "",
          isChecking: false,
          isDuplicate: false,
          lastCheckedValue: deliveryText,
        });
      }

      setIsButtonDisabled(false);
    }
  }, [isUpdate, id, originalData, sales_invoiceText, deliveryText]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmitFormulation}
        className="no-valid-icons"
      >
        <div className="w-100 p-2 d-flex flex-column justify-content-center">
          <div className="w-100 d-flex flex-row justify-content-between">
            <span className="fs-3" style={{ fontWeight: "600" }}>
              <a href="/sales/invoices" className="text-dark mx-2">
                <i className="fa-solid fa-arrow-left"></i>
              </a>
              {isUpdate ? "UPDATE SALES INVOICE" : "CREATE SALES INVOICE"}
            </span>
            {isUpdate && (
              <div className="dropdown dropdown-button d-none">
                <button
                  className="border-0"
                  type="button"
                  id="dropdownMenuButton1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bx bx-dots-horizontal fs-4"></i>
                </button>
                <ul
                  className="dropdown-menu"
                  aria-labelledby="dropdownMenuButton1"
                >
                  <li className="">
                    <span
                      className="dropdown-item"
                      style={{ color: "red", cursor: "pointer" }}
                    >
                      Cancel Transaction
                    </span>
                  </li>
                  {salesStatus === "For-Approval" && (
                    <li>
                      <span
                        className="dropdown-item"
                        onClick={handleEditTransaction}
                        style={{ cursor: "pointer" }}
                      >
                        Edit Details
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="d-flex badge fw-medium ">
            <span className="px-2 py-1 bg-primary text-white fs-6">
              TRANSACTION ID
            </span>
            <span className="px-2 py-1 bg-secondary text-white fs-6">
              {transactionId}
            </span>
          </div>
        </div>

        <div
          className="destination d-flex flex-row align-items-center"
          style={{
            pointerEvents: isEditing ? "none" : "auto",
            cursor: isEditing ? "default" : "pointer",
          }}
        >
          <div className="form-check mx-3">
            <input
              className="form-check-input"
              type="radio"
              name="destination"
              id="Local"
              onClick={() => setSelectedDestination("Local")}
              checked={selectedDestination === "Local"}
              readOnly // ✅ prevents warning since controlled
              disabled={isEditing}
            />
            <label
              onClick={() => setSelectedDestination("Local")}
              className="form-check-label"
              htmlFor="Local"
            >
              Local
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="destination"
              id="Overseas"
              onClick={() => setSelectedDestination("Overseas")}
              checked={selectedDestination === "Overseas"}
              readOnly
              disabled={isEditing}
            />
            <label
              onClick={() => setSelectedDestination("Overseas")}
              className="form-check-label"
              htmlFor="Overseas"
            >
              Overseas
            </label>
          </div>
        </div>

        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Invoice Title:</span>
              <Form.Control
                name=""
                id=""
                placeholder="Enter Invoice Title"
                className="custom-form-height"
                readOnly={isUpdate}
                onChange={(e) => {
                  setInvoiceTitle(e.target.value);
                }}
                value={invoiceTitle}
              />
            </div>

            <div className="col-sm"></div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Sales Invoice :</span>
              <Form.Control
                name=""
                id=""
                className="custom-form-height"
                readOnly={isCheckedDelivery === true}
                onChange={handleSalesInvoiceChange}
                value={sales_invoiceText}
                disabled={isEditing}
              />
              {!isEditing && salesInvoiceValidation.isChecking && (
                <div className="mt-1">
                  <span className="text-muted">
                    <i className="fas fa-spinner fa-spin"></i> Checking
                    availability...
                  </span>
                </div>
              )}
              {!isEditing &&
                !salesInvoiceValidation.isValid &&
                sales_invoiceText && (
                  <div className="mt-1">
                    <span className="text-danger">
                      <i className="fas fa-exclamation-circle"></i>{" "}
                      {salesInvoiceValidation.message}
                      {/* {salesInvoiceValidation.isDuplicate && (
                        <span className="d-block small">
                          Please enter a different Sales Invoice number.
                        </span>
                      )} */}
                    </span>
                  </div>
                )}
              {!isEditing &&
                salesInvoiceValidation.isValid &&
                sales_invoiceText &&
                !salesInvoiceValidation.isChecking &&
                !salesInvoiceValidation.isDuplicate && (
                  <div className="mt-1">
                    <span className="text-success">
                      <i className="fas fa-check-circle"></i> Sales Invoice
                      number is available
                    </span>
                  </div>
                )}
            </div>

            <div className="col-sm mb-3">
              <span>
                {isCheckedDelivery
                  ? "Delivery Confirmation :"
                  : "Delivery Receipt :"}
              </span>
              <InputGroup className="custom-form-height dc-dr-custom-height">
                <InputGroup.Checkbox
                  checked={isCheckedDelivery}
                  onChange={handleDeliveryCheckboxChange}
                  aria-label="Checkbox for following text input"
                  disabled={isUpdate}
                />
                <Form.Control
                  onChange={handleDeliveryTextChange}
                  value={deliveryText}
                  aria-label="Text input with checkbox"
                  disabled={isEditing}
                />
              </InputGroup>
              {!isEditing && deliveryValidation.isChecking && (
                <div className="mt-1">
                  <span className="text-muted">
                    <i className="fas fa-spinner fa-spin"></i> Checking
                    availability...
                  </span>
                </div>
              )}
              {!isEditing && !deliveryValidation.isValid && deliveryText && (
                <div className="mt-1">
                  <span className="text-danger">
                    <i className="fas fa-exclamation-circle"></i>{" "}
                    {deliveryValidation.message}
                    {/* {deliveryValidation.isDuplicate && (
                      <span className="d-block small">
                        Please enter a different{" "}
                        {isCheckedDelivery
                          ? "Delivery Confirmation"
                          : "Delivery Receipt"}{" "}
                        number.
                      </span>
                    )} */}
                  </span>
                </div>
              )}
              {!isEditing &&
                deliveryValidation.isValid &&
                deliveryText &&
                !deliveryValidation.isChecking &&
                !deliveryValidation.isDuplicate && (
                  <div className="mt-1">
                    <span className="text-success">
                      <i className="fas fa-check-circle"></i>{" "}
                      {isCheckedDelivery
                        ? "Delivery Confirmation"
                        : "Delivery Receipt"}{" "}
                      number is available
                    </span>
                  </div>
                )}
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Customer : <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => handleSelectCustomer(e.target.value)}
                value={selectedCustomer}
                disabled={isDisabled}
              >
                <option value="" selected disabled>
                  Select Customer
                </option>
                {customerData.map((data, i) => (
                  <option key={i} value={data.customer_id}>
                    {data.type === "company"
                      ? data.company_name
                      : `${data.first_name} ${data.last_name}`}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-3">
              <span>Purchase Order Number :</span>{" "}
              {/* <span className="text-danger">*</span> */}
              <Form.Control
                name=""
                id=""
                placeholder="Enter Purchase Order Number"
                className="custom-form-height"
                // required
                onChange={(e) => {
                  setPoNumber(e.target.value);
                }}
                value={poNumber}
                disabled={isEditing}
              />
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Delivery Date <span className="text-danger">*</span>
              </span>
              <div>
                <DatePicker
                  selected={selectedDueDate}
                  onChange={handleDueDateChange}
                  dateFormat="MMM dd, yyyy"
                  required
                  customInput={<CustomInput isEditing={isEditing} />}
                  disabled={isEditing}
                />
              </div>
            </div>
            <div className="col-sm mb-3">
              <span>
                Invoice Date <span className="text-danger">*</span>
              </span>
              <div>
                <DatePicker
                  selected={selectedInvoiceDate}
                  onChange={handleDueInvoiceDate}
                  dateFormat="MMM dd, yyyy"
                  required
                  customInput={<CustomInput isEditing={isEditing} />}
                  disabled={isEditing}
                />
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm-6 mb-3">
              <span>
                Payment Method <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => setSelectedMethod(e.target.value)}
                value={selectedMethod}
                disabled={isEditing}
              >
                <option value="" selected disabled>
                  Select Payment Method
                </option>
                <option value="Cash">Cash</option>
                {/* <option value="Online">Online</option> */}
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </Form.Select>
            </div>

            <div
              className={`mb-3 ${
                selectedPaymentTerms === "Other" ? "col-sm-3" : "col-sm-6"
              }`}
            >
              <span>
                Payment Terms <span className="text-danger">*</span>
              </span>
              {/* <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  required
                  onChange={(e) => setInputPaymentTerms(e.target.value)}
                  value={inputPaymentTerms}
                  disabled={isEditing}
                /> */}
              <Form.Select
                value={selectedPaymentTerms}
                onChange={(e) => setSelectedPaymentTerms(e.target.value)}
                disabled={isEditing}
                className="custom-form-height"
                required
              >
                <option value="" selected disabled>
                  Select Term
                </option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="120">120 Days</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>

            {selectedPaymentTerms === "Other" && (
              <div className="col-sm-3 mb-3">
                <span>
                  Other Term <span className="text-danger">*</span>
                </span>
                <Form.Control
                  type="text"
                  value={selectedOtherTerms}
                  onChange={(e) => setSelectedOtherTerms(e.target.value)}
                  placeholder="Enter specific term"
                  className="custom-form-height"
                  required
                />
              </div>
            )}
          </div>
          <div className="row mx-auto">
            <div className="col-sm">
              <div className="col-sm">
                <div className="row mx-auto">
                  <div className="col-sm p-0 mb-3 me-3">
                    <span>Applicable Tax Rate :</span>
                    <InputGroup className="mb-3 custom-form-height">
                      <InputGroup.Checkbox
                        checked={isCheckedTax}
                        disabled={isUpdate}
                        onChange={handleCheckBoxTax}
                        aria-label="Checkbox for following text input"
                      />
                      <Form.Select
                        disabled={isCheckedTax !== true || isEditing}
                        aria-label="Text input with checkbox"
                        required
                        onChange={(e) => {
                          setTaxSelectedID(e.target.value);
                        }}
                        value={taxSelectedID}
                      >
                        <option value="">Select Tax Rate</option>
                        {taxSettingsData.map((data, i) => (
                          <option key={i} value={data.id}>
                            {`${data.name} (${data.rate}%)`}
                          </option>
                        ))}
                      </Form.Select>
                    </InputGroup>
                  </div>
                  <div className="col-sm p-0 mb-3 ">
                    <span>VAT (%)</span>
                    <Form.Control
                      type="text"
                      className="form-control custom-form-height"
                      value={vatPercentage}
                      placeholder="0.00"
                      onChange={handleVatChange}
                      disabled={isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm">
              <div className="row mx-auto ">
                <div className="col-sm p-0 mb-3 me-3">
                  <span>Zero Rated :</span>
                  <InputGroup className="mb-3 custom-form-height">
                    <InputGroup.Checkbox
                      checked={isZeroRated}
                      disabled={isUpdate}
                      onChange={handleCheckBoxZeroRated}
                      aria-label="Checkbox for following zero rated"
                    />
                    <Form.Control
                      disabled={isZeroRated !== true || isEditing}
                      aria-label="Text input with checkbox"
                      id="zeroRatedInvoice"
                      style={{ background: "#E9ECEF" }}
                      required
                      value={
                        isZeroRated
                          ? "Zero Rated is Applied"
                          : "Zero Rated is not Applied"
                      }
                    ></Form.Control>
                  </InputGroup>
                </div>
                <div className="col-sm p-0 mb-3 ">
                  <span>SCA/PWD Discount (%)</span>
                  <Form.Control
                    type="text"
                    className="form-control custom-form-height"
                    value={scaDiscountPercentage}
                    placeholder="0.00"
                    onChange={handleScaChange}
                    disabled={isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm-6">
              <span>
                Currency <span className="text-danger">*</span>
              </span>
              <Form.Select
                name=""
                id=""
                className="form-select custom-form-height"
                required
                onChange={(e) => handleChangeCurrency(e.target.value)}
                value={selectedCurrency}
                disabled={isEditing}
              >
                <option value="" selected disabled>
                  Select Currency
                </option>
                {currencyData.map((data, i) => (
                  <option key={i} value={data.id}>
                    {data.currency_name}
                  </option>
                ))}
              </Form.Select>
            </div>

            {selectedCurrency &&
            selectedCurrency !== "11111111-1111-1111-1111-111111111111" ? (
              <div className="col-sm-6">
                <span>
                  Currency Rate<span className="text-danger">*</span>
                </span>
                <Form.Control
                  type="text"
                  name=""
                  id=""
                  className="form-control custom-form-height"
                  required
                  onChange={handleCurrencyRateChange}
                  value={currencyRate}
                />
              </div>
            ) : null}
          </div>
          <div className="row mx-auto mt-2">
            <div className="col-sm">
              <span>Remarks</span>
              <Form.Control
                as="textarea"
                onChange={(e) => setRemarks(e.target.value)}
                value={remarks}
                rows={3}
                maxLength={250}
                disabled={isEditing}
              />
            </div>
          </div>
        </div>
        <div className="container-fluid ">
          <div className="w-100 d-flex align-items-center mt-3 p-2">
            <h5>Item List</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
            <div className="table-responsive">
              <table
                className="table table-bordered table-hover"
                id="sales-add-update-table"
              >
                <thead className="table-light">
                  <tr>
                    <th className="p-2">Product Code</th>
                    <th className="p-2">
                      Product Name<span className="text-danger">*</span>
                    </th>
                    <th className="p-2">UOM</th>
                    <th className="p-2">Current Stock</th>
                    <th className="p-2">Weight</th>
                    {/* {!isUpdate &&  */}
                    <th className="p-2">New Stock</th>
                    {/* } */}
                    <th
                      className={
                        roleType?.includes("Management") ? "p-2" : "d-none"
                      }
                      style={{ fontSize: 14 }}
                    >
                      Price per Packaging <span className="text-danger">*</span>
                    </th>
                    <th className="p-2">Discount</th>
                    <th
                      className={
                        roleType?.includes("Management") ? "p-2" : "d-none"
                      }
                    >
                      Subtotal
                    </th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems
                    .filter((item) => item.isDeleted === false)
                    .map((item, i) => {
                      let newStock;
                      if (item.current_stock === 0) {
                        newStock = -item.quantity;
                      } else {
                        newStock = calculateNewStockForUpdate(item);
                      }

                      const originalQuantity = getOriginalQuantity(
                        item.product_id,
                      );

                      let forUpdateStock;
                      if (item.current_stock === 0) {
                        // When current stock is 0, subtract the original quantity
                        forUpdateStock = item.current_stock;
                      } else if (newStock <= 0) {
                        // When new stock is less than or equal to 0, set to 0
                        forUpdateStock = item.current_stock;
                      } else {
                        // When current stock > 0, add the original quantity
                        forUpdateStock = item.current_stock + originalQuantity;
                      }

                      const isWeightValid =
                        weightValidations[item.product_id] !== false;

                      let unitQuantity = item.unit_quantity || 1;

                      let currentStock = forUpdateStock * unitQuantity;

                      const displayNewStock =
                        newStock !== null
                          ? newStock < 0
                            ? newStock * unitQuantity
                            : Math.max(newStock, 0) * unitQuantity
                          : null;

                      return (
                        <tr key={i}>
                          <td>{item.product_code}</td>
                          <td>{item.product_name}</td>
                          <td>
                            {item.packaging_name} - ({unitQuantity}
                            {item.unit})
                          </td>

                          {/* none kg convertion */}
                          {/* <td
                            className={
                              item.current_stock === 0 ? "text-danger" : ""
                            }
                          >
                            {forUpdateStock?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td> */}
                          <td className={currentStock < 0 ? "text-danger" : ""}>
                            {currentStock?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}{" "}
                            kg
                          </td>
                          {/* none kg convertion */}
                          {/* <td>
                            <NumericFormat
                              className="form-control"
                              value={item.quantity}
                              thousandSeparator={true}
                              max={9999999999}
                              onValueChange={(values) => {
                                const rawValue = values.floatValue;
                                handleQuantityChange(item.product_id, rawValue);
                              }}
                              isAllowed={(values) => {
                                const { floatValue } = values;
                                return (
                                  floatValue === undefined ||
                                  (floatValue >= 0 && floatValue <= 9999999999)
                                );
                              }}
                              disabled={isEditing}
                              required
                            />
                          </td> */}
                          <td>
                            <div>
                              <NumericFormat
                                className={`form-control ${
                                  validated && !isWeightValid
                                    ? "is-invalid"
                                    : ""
                                }`}
                                value={
                                  item.quantity === null
                                    ? ""
                                    : (
                                        item.quantity * item.unit_quantity
                                      ).toFixed(2)
                                }
                                thousandSeparator={true}
                                decimalScale={2}
                                fixedDecimalScale={true}
                                max={9999999999}
                                onValueChange={(values) => {
                                  const rawValue = values.floatValue;
                                  handleQuantityChange(
                                    item.product_id,
                                    rawValue,
                                  );
                                }}
                                isAllowed={(values) => {
                                  const { floatValue } = values;
                                  return (
                                    floatValue === undefined ||
                                    (floatValue >= 0 &&
                                      floatValue <= 9999999999)
                                  );
                                }}
                                disabled={isEditing}
                                required
                              />
                              {/* WEIGHT VALIDATION LABEL - ONLY FOR WEIGHT FIELD */}
                              {validated && !isWeightValid && (
                                <div className="invalid-feedback d-block">
                                  Weight must be greater than 0
                                </div>
                              )}
                            </div>
                          </td>
                          {/* none kg convertion */}
                          {/* <td
                            className={
                              newStock !== null && newStock <= 0
                                ? "text-danger"
                                : ""
                            }
                          >
                            {newStock !== null
                              ? newStock?.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || "0.00"
                              : ""}
                          </td> */}

                          {/* {!isUpdate && ( */}
                          <td
                            className={displayNewStock < 0 ? "text-danger" : ""}
                          >
                            {displayNewStock !== null
                              ? `${displayNewStock.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} kg`
                              : ""}
                          </td>
                          {/* )} */}

                          <td
                            className={
                              roleType?.includes("Management") ? "" : "d-none"
                            }
                          >
                            <NumericFormat
                              className="form-control"
                              value={item.unitPrice || item.srp_amount || 0}
                              thousandSeparator={true}
                              decimalScale={5}
                              max={9999999999}
                              onValueChange={(values) => {
                                const rawValue = values.floatValue;
                                handleUnitPriceChange(
                                  item.product_id,
                                  rawValue,
                                );
                              }}
                              isAllowed={(values) => {
                                const { floatValue } = values;
                                return (
                                  floatValue === undefined ||
                                  (floatValue >= 0 && floatValue <= 9999999999)
                                );
                              }}
                              disabled={isEditing}
                              required
                            />
                          </td>

                          <td>
                            <div className="input-group mb-3">
                              <Form.Control
                                type="text"
                                className="form-control"
                                placeholder="0.00"
                                value={
                                  item.discount !== undefined &&
                                  item.discount !== null &&
                                  item.discount !== 0
                                    ? item.discount.toString()
                                    : ""
                                }
                                onChange={(e) => {
                                  let value = e.target.value;

                                  // Allow empty value and single decimal point
                                  if (value === "" || value === ".") {
                                    handleDiscountChange(
                                      item.product_id,
                                      value === "." ? "." : "",
                                    );
                                    return;
                                  }

                                  // Allow only numbers and single decimal point
                                  const validChars = /^[0-9]*\.?[0-9]*$/;
                                  if (!validChars.test(value)) {
                                    return; // Don't update if invalid characters
                                  }

                                  // If it's just numbers or has decimal, process it
                                  if (value === ".") {
                                    handleDiscountChange(item.product_id, ".");
                                    return;
                                  }

                                  // Parse the value as float only if it's a complete number
                                  if (value.endsWith(".")) {
                                    // Allow trailing decimal point
                                    handleDiscountChange(
                                      item.product_id,
                                      value,
                                    );
                                    return;
                                  }

                                  let numericValue = parseFloat(value);

                                  // Check if it's a valid number
                                  if (isNaN(numericValue)) {
                                    handleDiscountChange(
                                      item.product_id,
                                      value,
                                    );
                                    return;
                                  }

                                  // Ensure value is between 0 and 100
                                  if (numericValue < 0) numericValue = 0;
                                  if (numericValue > 100) numericValue = 100;

                                  // Format to ensure it has max 2 decimal places
                                  const decimalPart = value.split(".")[1];
                                  if (decimalPart && decimalPart.length > 2) {
                                    numericValue = parseFloat(
                                      numericValue.toFixed(2),
                                    );
                                  }

                                  handleDiscountChange(
                                    item.product_id,
                                    numericValue,
                                  );
                                }}
                                onBlur={(e) => {
                                  // Format on blur to ensure proper decimal display
                                  let value = e.target.value;

                                  // Handle empty value
                                  if (value === "" || value === ".") {
                                    handleDiscountChange(item.product_id, 0);
                                    return;
                                  }

                                  // Handle values ending with decimal point
                                  if (value.endsWith(".")) {
                                    value = value + "0"; // Convert "5." to "5.0"
                                  }

                                  let numericValue = parseFloat(value);
                                  if (isNaN(numericValue)) {
                                    handleDiscountChange(item.product_id, 0);
                                    return;
                                  }

                                  // Ensure value is between 0 and 100
                                  if (numericValue < 0) numericValue = 0;
                                  if (numericValue > 100) numericValue = 100;

                                  // Format to 2 decimal places
                                  numericValue = parseFloat(
                                    numericValue.toFixed(2),
                                  );
                                  handleDiscountChange(
                                    item.product_id,
                                    numericValue,
                                  );
                                }}
                                onKeyDown={(e) => {
                                  // Allow decimal point and numbers
                                  if (
                                    (e.key >= "0" && e.key <= "9") ||
                                    e.key === "." ||
                                    e.key === "Backspace" ||
                                    e.key === "Delete" ||
                                    e.key === "ArrowLeft" ||
                                    e.key === "ArrowRight" ||
                                    e.key === "Tab"
                                  ) {
                                    return; // Allow the input
                                  }
                                  e.preventDefault(); // Prevent other keys
                                }}
                                disabled={isEditing}
                                aria-label="Discount"
                                aria-describedby="basic-addon1"
                              />
                              <div className="input-group-prepend">
                                <span
                                  className="input-group-text"
                                  id="basic-addon1"
                                >
                                  %
                                </span>
                              </div>
                            </div>
                          </td>
                          <td
                            className={
                              roleType?.includes("Management") ? "" : "d-none"
                            }
                          >
                            {formatSmallDecimals(
                              calculateSubtotal(
                                item.quantity || 0,
                                item.unitPrice || item.srp_amount || 0,
                                item.discount || 0,
                              ),
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm text-danger fs-4"
                              onClick={() =>
                                handleCheckSelectProduct(
                                  item,
                                  !isItemSelected(item),
                                )
                              }
                              disabled={isEditing}
                              type="button"
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
          </div>
          <div className="w-100 d-flex justify-content-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleShow}
              disabled={isEditing}
            >
              New Item
            </button>
          </div>
        </div>
        <div className="row mx-auto p-2 mt-4 mb-4">
          <div className="col-sm"></div>
          <div
            className={
              roleType?.includes("Management") ? "col-sm border-end" : "d-none"
            }
          >
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Gross :</span>
              <span className="text-secondary">
                {calculateTotalGross().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total Product Discount :</span>
              <span className="text-danger">
                {calculateTotalDiscountedAmount().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Withhold Tax Deduction :</span>
              <span className="text-danger">
                {isCheckedTax
                  ? `-${calculateWithholdTax().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "0.00"}
              </span>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>SCA/PWD Discount:</span>
              <span className="text-danger">
                {calculateSCAAmount() > 0
                  ? `-${calculateSCAAmount().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "0.00"}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <span>Total VAT:</span>
              <span className="text-success">
                {calculateVatAmount().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="w-100 d-flex flex-row justify-content-between p-2">
              <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                <span className="text-white">Net Receivable Amount :</span>
                <span className="text-white text-underline">
                  {calculateNetReceivable().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
                  <a
                    href="/sales/invoices"
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    // onClick={CancelInvoice}
                  >
                    Cancel
                  </a>
                </div>
                <div className="col-sm">
                  <button
                    className="btn btn-primary w-100"
                    type="submit"
                    disabled={isSubmitting || isEditing || isButtonDisabled}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : isUpdate
                        ? "Update"
                        : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>

      <Modal
        show={show}
        size="xl"
        onHide={() => {
          setShow(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Lists</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchProduct}
              />
            </div>
          </div>
          <table
            className="table table-responsive table-hover"
            id="sales-add-update-table-modal"
          >
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                ></th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Product Code
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Product Name
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  UOM
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Current Stock
                </th>
                <th
                  className="text-muted text-center"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  Product Category
                </th>
              </tr>
            </thead>

            <tbody>
              {paginationProduct.loading ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : paginationProduct.error ? (
                <tr>
                  <td colSpan="6" className="text-center text-danger">
                    Error loading data {paginationProduct.error.message}
                  </td>
                </tr>
              ) : paginationProduct.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    No data available
                  </td>
                </tr>
              ) : (
                paginationProduct.data.map((item) => (
                  <tr
                    key={`${item.product_id}-${item.product_code}`}
                    onClick={() =>
                      handleCheckSelectProduct(item, !isItemSelected(item))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td className="w-25">
                      <Form.Check
                        checked={isItemSelected(item)}
                        onChange={(e) =>
                          handleCheckSelectProduct(item, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{item.product_code}</td>
                    <td>{item.product_name}</td>
                    <td>
                      {item.prod_packaging?.packaging_name} - (
                      {item.prod_packaging?.unit_quantity}
                      {item.prod_packaging?.unit})
                    </td>
                    <td
                      className={item.current_stock === 0 ? "text-danger" : ""}
                    >
                      {(
                        item.current_stock * item.prod_packaging?.unit_quantity
                      )?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge bg-${
                          item.product_category === "Finish Product"
                            ? "primary"
                            : item.product_category === "Raw Materials"
                              ? "warning text-dark"
                              : "success"
                        }`}
                      >
                        {item.product_category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationControls {...paginationProduct} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShow(false)} variant="secondary">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Create_invoice_update;
