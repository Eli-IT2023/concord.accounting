import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { NumericFormat } from "react-number-format";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

import Logo from "../../../assets/img/logo.jpg";

import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../../utils/CustomerDateInput";
import "../../../assets/css/style.css";

const Purchase_request_view = ({ authrztn, roleType }) => {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [purchaseRequest, setPurchaseRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rejectValidated, setRejectValidated] = useState(false);

  // fetch company profile
  const [settings, setSettings] = useState(null);

  // ✅ Hook must always run, even if poData is null
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`,
        );
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // ### fetch resets
  const [warehouseData, setWarehouseData] = useState([]);
  const fetchWarehouse = async () => {
    try {
      const warehouse = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      if (warehouse.data) {
        setWarehouseData(warehouse.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
      navigate("/purchases/purchase-request");
    }
  };

  const [taxData, setTaxData] = useState([]);
  const fetchTax = () => {
    axios.get(BASE_URL + "/PurchaseRequest/getTax").then((res) => {
      setTaxData(res.data);
    });
  };

  const [preparedByData, setPreparedByData] = useState("");
  const fetchPreparedBy = async (userId) => {
    await axios
      .get(BASE_URL + "/PurchaseRequest/getPreparedBy", {
        params: {
          userId,
        },
      })
      .then((response) => {
        setPreparedByData(`${response.data.fname} ${response.data.lname}`);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  // ### fetch reset ends

  useEffect(() => {
    fetchPurchaseRequest();
    fetchWarehouse();
    fetchTax();
  }, [id]);

  const fetchPurchaseRequest = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseRequest/getData/${id}`,
      );
      if (response.data.success) {
        setPurchaseRequest(response.data.data);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error",
        );
        navigate("/purchases/purchase-request");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
      navigate("/purchases/purchase-request");
    } finally {
      setLoading(false);
    }
  };

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/PurchaseRequest/getOrderListData/${id}`,
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ### reject modal ###
  const showRejectModal = () => setShowModal(true);

  const handleClose = () => {
    setShowModal(false);
    setShowModal2(false);
    setRejectRemarks("");
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Validate form
    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      setRejectValidated(true);
      return; // Exit early if invalid
    }

    try {
      const confirmed = await swal({
        title: "Reject this purchase request?",
        text: "This action cannot be undone",
        icon: "warning",
        buttons: ["Cancel", "Confirm"],
        dangerMode: true,
      });

      if (confirmed) {
        setShowModal(false);
        // Actual rejection API call
        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/reject/${id}`,
          {
            rejectRemarks: rejectRemarks,
            rejectedBy: userLoggedID,
          },
        );

        if (response.data.success) {
          swal({
            title: "Rejected!",
            text: "Purchase request has been rejected",
            icon: "success",
            buttons: false,
            timer: 2500,
          }).then(() => {
            navigate("/purchases/purchase-request");
          });
        } else {
          throw new Error(response.data.message || "Failed to reject");
        }
      }
    } catch (error) {
      console.error("Rejection error:", error);
      swal({
        title: "Error",
        text:
          error.response?.data?.message || "Failed to reject purchase request",
        icon: "error",
      });
    }
  };
  // ### reject modal end ###

  // ### update ###
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    date_needed: "",
    remarks: "",
    orderItems: [],
  });

  useEffect(() => {
    if (purchaseRequest) {
      setFormValues({
        date_needed: purchaseRequest.date_needed || "",
        remarks: purchaseRequest.remarks || "",
        orderItems: pagination.data.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_quantity: item.unit_quantity, // Add unit_quantity
          remarks: item.remarks || "",
        })),
      });
    }
  }, [purchaseRequest, pagination.data]);

  const handleSaveChanges = async (e) => {
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
        const updateData = {
          id: purchaseRequest.id,
          date_needed: formValues.date_needed,
          remarks: formValues.remarks,
          updatedBy: userLoggedID,
          orderItems: formValues.orderItems.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            remarks: item.remarks,
          })),
        };

        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/update/${id}`,
          updateData,
        );

        if (response.data.success) {
          swal({
            title: "Success!",
            text: "Changes saved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
          }).then(() => {
            setIsEditing(false);
            reloadTable();
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

  // ### update end

  // ### product list
  const handleProductList = async (e, product_id) => {
    e.preventDefault();

    const remainingItems = pagination.data.length;

    if (remainingItems <= 1) {
      swal(
        "Cannot Delete",
        "You must have at least one item in the list.",
        "warning",
      );
      return;
    }

    const confirmed = await swal({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (confirmed) {
      axios
        .put(`${BASE_URL}/PurchaseRequest/deleteProductList/${product_id}`)
        .then((response) => {
          if (response.data.success) {
            swal({
              title: "Success!",
              text: "Product has been removed successfully",
              icon: "success",
              buttons: false,
              timer: 2500,
            });
            reloadTable();
          } else {
            throw new Error(response.data.message || "Failed to delete");
          }
        })
        .catch((error) => {
          console.error("Delete failed:", error);
          swal("Error", error.message, "error");
        });
    }
  };

  const reloadTable = () => {
    setPaginationUrl(
      `${BASE_URL}/PurchaseRequest/getOrderListData/${id}?t=${Date.now()}`,
    );
    pagination.refreshData();
    fetchPurchaseRequest();
  };

  // ### product list end

  // ### approve
  const [showModal2, setShowModal2] = useState(false);
  const showApproveModal = () => setShowModal2(true);

  const handleApprove = async (e) => {
    e.preventDefault();
    setShowModal2(false);
    if (!id) {
      swal("Error", "Missing purchase request ID. Cannot proceed.", "error");
      return;
    }

    const response = await axios.put(
      `${BASE_URL}/PurchaseRequest/approve/${id}`,
      {
        approvedBy: userLoggedID,
      },
    );

    if (response.data.success) {
      swal({
        title: "Approved!",
        text: "Purchase Request has been approved successfully",
        icon: "success",
        buttons: false,
        timer: 2000,
      }).then(() => {
        navigate("/purchases/purchase-request");
      });
    } else {
      throw new Error(response.data.message || "Failed to save changes");
    }
  };

  // ### approve end

  const getStatusStyles = (status) => {
    switch (status) {
      case "In Progress":
        return { bg: "#FFF4F4", text: "#EE5B5B" };
      case "Partial Order":
        return { bg: "#E4F0FF", text: "#3D96FF" };
      case "Ordered":
        return { bg: "#E1FCE6", text: "#62D665" };
      default:
        return { bg: "#FFFFFF", text: "#000000" };
    }
  };

  // ### select product
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterColumn, setFilterColumn] = useState("all");
  const [searchText, setSearchText] = useState("");

  const handleSearch = (value) => {
    setSearchText(value);
  };

  // ### vendor fetch state
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [vendorPrices, setVendorPrices] = useState({});

  // ### vendor data functions
  const handleVendorFetch = async (product_id) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseRequest/getVendorsByProduct/${product_id}`,
      );
      setVendors(response.data);
      const initialPrices = {};
      response.data.forEach((vendor) => {
        initialPrices[vendor.vendor_id] = vendor.product_price || 0;
      });
      setVendorPrices(initialPrices);
      setSelectedVendors([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      swal("Error", "Failed to fetch vendors", "error");
    }
  };

  const handleCartClick = (product) => {
    // Calculate weight for display
    const quantity = parseFloat(product.quantity) || 0;
    const unit_quantity = parseFloat(product.unit_quantity) || 1;
    const displayWeight = quantity * unit_quantity;

    const productWithWeight = {
      ...product,
      displayWeight: displayWeight,
      originalQuantity: quantity,
    };

    setSelectedProduct(productWithWeight);
    setShowProductModal(true);
    handleVendorFetch(product.product_id);
  };

  // ### selection functions
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    if (isChecked) {
      const allVendorIds = vendors.map((vendor) => vendor.vendor_id);
      setSelectedVendors(allVendorIds);
    } else {
      setSelectedVendors([]);
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors((prev) => {
      let newSelectedVendors;
      if (prev.includes(vendorId)) {
        newSelectedVendors = prev.filter((id) => id !== vendorId);
      } else {
        newSelectedVendors = [...prev, vendorId];
      }

      setSelectAll(newSelectedVendors.length === vendors.length);
      return newSelectedVendors;
    });
  };

  // ### price editing functions
  const handlePriceChange = (vendorId, value) => {
    setVendorPrices((prev) => ({
      ...prev,
      [vendorId]: value,
    }));
  };

  // ### card
  const [vendorCards, setVendorCards] = useState([]);

  const handleConfirmVendors = () => {
    if (!selectedProduct || selectedVendors.length === 0) {
      swal("Error", "Please select at least one vendor", "error");
      return;
    }

    setVendorCards((prevCards) => {
      const newCards = [...prevCards];

      selectedVendors.forEach((vendorId) => {
        const vendor = vendors.find((v) => v.vendor_id === vendorId);
        const vendorName =
          `${vendor.vendor.fname || ""} ${vendor.vendor.lname || ""}`.trim() ||
          vendor.vendor.company_name;
        const vendorAddress = vendor.vendor.company_address;
        const vendorEmail = vendor.vendor.company_email;
        const vat = vendor.vendor.vat;

        const existingCardIndex = newCards.findIndex(
          (card) => card.vendorId === vendorId,
        );

        // Calculate weight for display in PO
        const originalQuantity =
          selectedProduct.originalQuantity || selectedProduct.quantity;
        const unit_quantity = parseFloat(selectedProduct.unit_quantity) || 1;
        const displayWeight = originalQuantity * unit_quantity;

        const productToAdd = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: selectedProduct.product_id,
          productCode: selectedProduct.product_code,
          uom: `${selectedProduct.prod_packaging?.packaging_name} - (${selectedProduct.prod_packaging?.unit_quantity}${selectedProduct.prod_packaging?.unit})`,
          productName: selectedProduct.product_name,
          quantity: displayWeight.toFixed(2), // Pre-fill with calculated weight
          originalQuantity: originalQuantity,
          unit_quantity: unit_quantity, // Make sure this is included
          product_unit_quantity: unit_quantity, // Add this line to ensure it's available
          price: vendorPrices[vendorId] || 0,
          remarks: "",
          orderedQuantity: selectedProduct.ordered_quantity,
        };

        if (existingCardIndex >= 0) {
          const productExists = newCards[existingCardIndex].products.some(
            (p) => p.productId === productToAdd.productId,
          );

          if (!productExists) {
            newCards[existingCardIndex].products.push(productToAdd);
          }
        } else {
          newCards.push({
            poNumber: generatePONumber(),
            vendorId,
            vendorName,
            vendorAddress,
            vendorEmail,
            vat,
            taxId: null,
            taxRate: 0,
            deliveryEstimateFrom: "",
            deliveryEstimateTo: "",
            shippingMethod: "",
            paymentTerm: "",
            deliveryDate: "",
            purchaseOrderDate: "",
            products: [productToAdd],
          });
        }
      });

      return newCards;
    });

    setShowProductModal(false);
    setSearchText("");
    setSelectedVendors([]);
    setSelectAll(false);
  };

  const handleDeliveryDateChange = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].deliveryDate = value;
      return newCards;
    });
  };

  const handlePurchaseOrderDate = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].purchaseOrderDate = value;
      return newCards;
    });
  };

  const handleDeliveryEstimateChange = (cardIndex, type, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      if (type === "from") {
        newCards[cardIndex].deliveryEstimateFrom = value;
      } else {
        newCards[cardIndex].deliveryEstimateTo = value;
      }
      return newCards;
    });
  };

  const handleShippingMethod = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].shippingMethod = value;
      return newCards;
    });
  };

  const handlePaymentTerm = (cardIndex, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[cardIndex].paymentTerm = value;
      return newCards;
    });
  };

  const generatePONumber = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    return `PO-${datetimeStr}${randomNum}`;
  };

  const handleDeleteCard = (cardIndex) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      newCards.splice(cardIndex, 1);
      return newCards;
    });
  };

  const handleRemoveProduct = (cardIndex, productId) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId,
      );

      if (productIndex >= 0) {
        newCards[cardIndex].products.splice(productIndex, 1);
      }

      if (newCards[cardIndex].products.length === 0) {
        newCards.splice(cardIndex, 1);
      }

      return newCards;
    });
  };

  const handleProductQuantityChange = (cardIndex, productId, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId,
      );
      if (productIndex >= 0) {
        newCards[cardIndex].products[productIndex].quantity = value;
      }
      return newCards;
    });
  };

  const handleProductRemarksChange = (cardIndex, productId, value) => {
    setVendorCards((prevCards) => {
      const newCards = [...prevCards];
      const productIndex = newCards[cardIndex].products.findIndex(
        (p) => p.id === productId,
      );
      if (productIndex >= 0) {
        newCards[cardIndex].products[productIndex].remarks = value;
      }
      return newCards;
    });
  };

  // ### preview p.o state and handlers
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedTax, setSelectedTax] = useState(null);
  const [selectedTaxRate, setSelectedTaxRate] = useState(0);

  const handleClosePOModal = () => {
    setShowPOModal(false);
    setSelectedPO(null);
  };

  // ### pdf modal view for vendor products
  const [currentVendorPage, setCurrentVendorPage] = useState(0);
  const [vendorPages, setVendorPages] = useState([]);

  const handleShowPOModal = () => {
    const errors = {
      deliveryDate: {},
      quantities: {},
    };
    let hasErrors = false;

    vendorCards.forEach((card, cardIndex) => {
      if (!card.deliveryDate) {
        errors.deliveryDate[cardIndex] = "Delivery date is required";
        hasErrors = true;
      }

      card.products.forEach((product, productIndex) => {
        if (!product.quantity || isNaN(parseFloat(product.quantity))) {
          if (!errors.quantities[cardIndex]) {
            errors.quantities[cardIndex] = {};
          }
          errors.quantities[cardIndex][productIndex] = "Quantity is required";
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);

    if (hasErrors) {
      swal(
        "Error",
        "Please fill in all required fields (marked in red)",
        "error",
      );
      return;
    }

    const pages = vendorCards.map((card) => ({
      ...card,
      pageNumber: vendorCards.indexOf(card) + 1,
      totalPages: vendorCards.length,
    }));

    setVendorPages(pages);
    setCurrentVendorPage(0);
    setShowPOModal(true);
    fetchPreparedBy(userLoggedID);
  };

  const handleNextPage = () => {
    if (currentVendorPage < vendorPages.length - 1) {
      setCurrentVendorPage(currentVendorPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentVendorPage > 0) {
      setCurrentVendorPage(currentVendorPage - 1);
    }
  };

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // ### create p.o
  const [validationErrors, setValidationErrors] = useState({
    deliveryDate: {},
    quantities: {},
  });

  const preparePOData = () => {
    const productTotals = {};

    vendorCards.forEach((card) => {
      card.products.forEach((product) => {
        const productId = product.productId || product.id;
        if (!productId) {
          console.error("Missing productId in product:", product);
          return;
        }

        // Convert weight back to quantity for backend
        const displayWeight = parseFloat(product.quantity) || 0;
        const unit_quantity = parseFloat(product.unit_quantity) || 1; // Use unit_quantity
        const quantity = displayWeight / unit_quantity;

        if (!productTotals[productId]) {
          productTotals[productId] = {
            productId: productId,
            productCode: product.productCode,
            productName: product.productName,
            totalQuantity: 0,
          };
        }
        productTotals[productId].totalQuantity += quantity;
      });
    });

    return vendorCards.map((card) => {
      const cardSubtotal = card.products.reduce((sum, product) => {
        const displayWeight = parseFloat(product.quantity) || 0;
        const unit_quantity = parseFloat(product.unit_quantity) || 1; // Use unit_quantity
        const quantity = displayWeight / unit_quantity;
        return sum + quantity * (parseFloat(product.price) || 0);
      }, 0);

      const cardTaxRate = card.taxRate || 0;
      const cardVatAmount = cardSubtotal * (card.vat / 100);
      const cardWithholdingTax = cardSubtotal * (cardTaxRate / 100);
      const cardTotal = cardSubtotal + cardVatAmount - cardWithholdingTax;

      return {
        poNumber: card.poNumber,
        vendorId: card.vendorId,
        vendorName: card.vendorName,
        vendorAddress: card.vendorAddress,
        deliveryDate: card.deliveryDate,
        purchaseOrderDate:
          card.purchaseOrderDate || new Date().toISOString().split("T")[0],
        withholdingTaxId: card.taxId,
        withholdingTaxRate: cardTaxRate,
        shippingMethod: card.shippingMethod,
        paymentTerm: card.paymentTerm,
        shipTo: warehouseData[0]?.warehouse_id,
        vatRate: card.vat,
        subtotal: cardSubtotal,
        vatAmount: cardVatAmount,
        withholdingTax: cardWithholdingTax,
        total: cardTotal,
        preparedBy: userLoggedID,
        prId: id,
        productTotals: productTotals,
        products: card.products.map((product) => {
          const displayWeight = parseFloat(product.quantity) || 0;
          const unit_quantity = parseFloat(product.unit_quantity) || 1; // Use unit_quantity
          const quantity = displayWeight / unit_quantity;

          return {
            productId: product.productId,
            productCode: product.productCode,
            productName: product.productName,
            productOriginalQuantity: product.originalQuantity,
            quantity: quantity,
            unit_quantity: unit_quantity, // Make sure this is included for backend
            price: parseFloat(product.price) || 0,
            remarks: product.remarks.substring(0, 50),
            productTotalSum:
              productTotals[product.productId]?.totalQuantity || 0,
          };
        }),
      };
    });
  };

  const calculateProductTotals = () => {
    const productTotals = {};

    const originalProducts = {};
    pagination.data.forEach((item) => {
      originalProducts[item.product_id] = item.quantity;
    });

    vendorCards.forEach((card) => {
      card.products.forEach((product) => {
        const productId = product.productId || product.id;
        if (!productId) {
          console.error("Missing productId in product:", product);
          return;
        }

        // Convert weight back to quantity for calculation
        const displayWeight = parseFloat(product.quantity) || 0;
        const unit_quantity = parseFloat(product.unit_quantity) || 1;
        const quantity = displayWeight / unit_quantity;

        if (productTotals[productId]) {
          productTotals[productId].orderedQuantity += quantity;
        } else {
          productTotals[productId] = {
            productId: productId,
            productCode: product.productCode,
            productName: product.productName,
            orderedQuantity: quantity,
            originalQuantity: originalProducts[productId] || 0,
          };
        }
      });
    });

    Object.keys(productTotals).forEach((productId) => {
      const product = productTotals[productId];
      product.status =
        product.orderedQuantity >= product.originalQuantity
          ? "Ordered"
          : "Partial Order";
    });

    return productTotals;
  };

  // handle create PO
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const handleCreatePO = async () => {
    setIsCreatingPO(true);
    const productTotals = calculateProductTotals();

    const errors = {
      deliveryDate: {},
      quantities: {},
    };
    let hasErrors = false;

    vendorCards.forEach((card, cardIndex) => {
      if (!card.deliveryDate) {
        errors.deliveryDate[cardIndex] = "Delivery date is required";
        hasErrors = true;
      }

      card.products.forEach((product, productIndex) => {
        if (!product.quantity || isNaN(parseFloat(product.quantity))) {
          if (!errors.quantities[cardIndex]) {
            errors.quantities[cardIndex] = {};
          }
          errors.quantities[cardIndex][productIndex] = "Weight is required";
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);

    if (hasErrors) {
      swal(
        "Error",
        "Please fill in all required fields (marked in red)",
        "error",
      );
      return;
    }

    const poData = preparePOData();
    const requestData = {
      poData,
      productTotals: Object.values(productTotals).map((product) => ({
        productId: product.productId,
        productCode: product.productCode,
        productName: product.productName,
        orderedQuantity: product.orderedQuantity,
        originalQuantity: product.originalQuantity,
        status: product.status,
        prId: id,
      })),
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/PurchaseOrder/createPO`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        swal({
          title: "Success!",
          text: "Purchase Order created successfully!",
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          setIsCreatingPO(false);
          handlePurchaseOrderCard();
          setVendorCards([]);
          handleClosePOModal();
          reloadTable();
        });
      } else {
        throw new Error(response.data.message || "Failed to create PO");
      }
    } catch (error) {
      console.error("PO creation error:", error);
      swal({
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to create Purchase Order",
        icon: "error",
      });
    }
  };

  // ### po card state and fetch
  const [purchaseOrderCards, setPurchaseOrderCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const handlePurchaseOrderCard = async () => {
    setLoadingCards(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getPurchaseOrderCards/${id}`,
      );

      if (response.data.success) {
        const formattedCards = response.data.data.map((card) => ({
          ...card,
          po_date: card.po_date ? card.po_date.split("T")[0] : "",
          delivery_date: card.delivery_date
            ? card.delivery_date.split("T")[0]
            : "",
        }));

        setPurchaseOrderCards(formattedCards);
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response,
      });
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    handlePurchaseOrderCard();
  }, [id]);

  // Add these functions for price editing
  const [tempVendorPrices, setTempVendorPrices] = useState({});

  const handleTempPriceChange = (vendorId, value) => {
    setTempVendorPrices((prev) => ({
      ...prev,
      [vendorId]: value,
    }));
  };

  const handlePriceEdit = (vendorId, currentPrice) => {
    setEditingPriceId(vendorId);
    setTempVendorPrices((prev) => ({
      ...prev,
      [vendorId]: currentPrice,
    }));
  };

  const handlePriceSave = (vendorId) => {
    const priceToSave = tempVendorPrices[vendorId] || 0;
    handlePriceChange(vendorId, priceToSave);
    setEditingPriceId(null);

    setTempVendorPrices((prev) => {
      const newTempPrices = { ...prev };
      delete newTempPrices[vendorId];
      return newTempPrices;
    });
  };

  const handlePriceCancel = (vendorId, originalPrice) => {
    setEditingPriceId(null);
    handlePriceChange(vendorId, originalPrice);

    setTempVendorPrices((prev) => {
      const newTempPrices = { ...prev };
      delete newTempPrices[vendorId];
      return newTempPrices;
    });
  };

  if (loading) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseRequest) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <p>Purchase request not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/purchase-request")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">PURCHASE REQUEST DETAILS </span>
          </span>
        </div>
      </div>

      <Form noValidate onSubmit={handleSaveChanges}>
        <div className="container-fluid mt-4">
          <div className="row mb-3">
            <div className="col-sm">
              <label htmlFor="pr_no">PR NO.</label>
              <input
                type="text"
                className="form-control"
                id="pr_no"
                name="pr_no"
                value={purchaseRequest.pr_no || ""}
                readOnly
                required
              />
            </div>
            <div className="col-sm">
              <label htmlFor="requestName">
                Request Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="requestName"
                name="requestName"
                value={purchaseRequest.request_name || ""}
                readOnly
                required
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-sm">
              <label htmlFor="dateNeeded">Date Needed</label>
              <DatePicker
                selected={formValues.date_needed}
                onChange={(date) =>
                  setFormValues({ ...formValues, date_needed: date })
                }
                readOnly={!isEditing}
                dateFormat="MMM dd, yyyy"
                placeholderText="Select date"
                customInput={<CustomDatePickerInput />}
                name="from-date"
                id="from-date"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                popperPlacement="bottom"
                popperProps={{
                  positionFixed: true,
                }}
              />
            </div>
            <div className="col-sm">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                name="remarks"
                id="remarks"
                cols="5"
                rows="5"
                className="form-control"
                value={formValues.remarks}
                onChange={(e) =>
                  setFormValues({ ...formValues, remarks: e.target.value })
                }
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              {purchaseRequest.status === "Rejected" && (
                <div>
                  <label className="">Reject Remarks</label>
                  <textarea
                    name="remarks"
                    id="remarks"
                    cols="5"
                    rows="5"
                    className="form-control"
                    value={purchaseRequest.rejectRemarks || ""}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="container-fluid mt-4">
          <div className="w-100 d-flex align-items-center">
            <span>Order Items</span>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="container-fluid mt-3">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive"
                id="purchaseRequestProductListTableView"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT ID
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      UNIT OF MEASURE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      WEIGHT
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      ORDERED WEIGHT
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      REMARKS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      {/* Empty header for delete button */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="8" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="8" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      // Calculate weight for display: weight = quantity * unit_quantity
                      const quantity = parseFloat(item.quantity) || 0;
                      const unit_quantity = parseFloat(item.unit_quantity) || 1;
                      const displayWeight = quantity * unit_quantity;

                      // Calculate ordered weight similarly
                      const ordered_quantity =
                        parseFloat(item.ordered_quantity) || 0;
                      const orderedWeight = ordered_quantity * unit_quantity;

                      return (
                        <tr key={item.id}>
                          <td className="text-center">{item.product_code}</td>
                          <td className="text-center">{item.product_name}</td>
                          <td className="text-center">{`${item.prod_packaging?.packaging_name} - (${item.prod_packaging?.unit_quantity}${item.prod_packaging?.unit})`}</td>
                          <td className="text-center">
                            {displayWeight.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-center">
                            {orderedWeight.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-center">{item.remarks}</td>
                          <td>
                            <span
                              className="py-2 px-3 rounded text-center"
                              style={{
                                display: "block",
                                backgroundColor: getStatusStyles(item.status)
                                  .bg,
                                color: getStatusStyles(item.status).text,
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="text-center">
                            {roleType?.includes("") &&
                              item.status !== "Ordered" && (
                                <button
                                  type="button"
                                  style={{ marginTop: "3px" }}
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => handleCartClick(item)}
                                >
                                  <i className="fa-solid fa-cart-plus"></i>
                                </button>
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
          </div>
        </div>

        <div className="container-fluid mt-5 d-flex flex-row align-items-center justify-content-end d-none">
          {purchaseRequest.status !== "Rejected" && (
            <div className="d-flex flex-row">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Make Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger mx-3"
                    onClick={showRejectModal}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={showApproveModal}
                  >
                    Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel Changes
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary mx-3"
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Form>

      {/* Purchase Order */}
      <div className="container-fluid mt-5">
        <div className="w-100 d-flex align-items-center">
          <span>Purchase Order</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        {/* card */}
        <div
          className="w-100 mt-3 d-flex flex-column px-5 scrollable-contents"
          style={{ overflowY: "auto", maxHeight: "80rem" }}
        >
          {vendorCards.map((card, index) => (
            <div
              key={index}
              className="mb-4 position-relative"
              style={{ maxWidth: "" }}
            >
              <button
                className="btn btn-danger btn-sm position-absolute"
                style={{ top: "5px", right: "20px", zIndex: 1 }}
                onClick={() => handleDeleteCard(index)}
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="card h-100 border shadow-sm">
                <div className="card-body p-0 pb-3">
                  <div className="card-title p-2 bg-secondary rounded-top text-white">
                    Purchase Order No: {card.poNumber}
                  </div>

                  <div className="px-4 w-100 row">
                    <div className="col-sm d-flex flex-column">
                      <span>
                        <strong>Company Name:</strong>
                        <span className="mx-2">{card.vendorName}</span>
                      </span>
                      <span>
                        <strong>Vendor Address:</strong>
                        <span className="mx-2">{card.vendorAddress}</span>
                      </span>
                      <span>
                        <strong>VAT:</strong>
                        <span className="mx-2">{card.vat}% </span>
                      </span>
                    </div>

                    <div className="col-sm d-flex flex-column align-items-start">
                      <div className="w-100 row mx-auto mb-2">
                        <div className="col-sm p-0 me-2">
                          <label htmlFor="">
                            <strong>PO Date</strong>
                          </label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={
                              card.purchaseOrderDate ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              handlePurchaseOrderDate(index, e.target.value)
                            }
                          />
                        </div>
                        <div className="col-sm p-0">
                          <label htmlFor="">
                            <strong>Delivery Date</strong>
                          </label>
                          <input
                            type="date"
                            name=""
                            id=""
                            className={`form-control form-control-sm ${
                              validationErrors.deliveryDate[index]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={card.deliveryDate || ""}
                            onChange={(e) => {
                              handleDeliveryDateChange(index, e.target.value);
                              if (validationErrors.deliveryDate[index]) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  deliveryDate: {
                                    ...prev.deliveryDate,
                                    [index]: null,
                                  },
                                }));
                              }
                            }}
                          />
                          {validationErrors.deliveryDate[index] && (
                            <div className="invalid-feedback">
                              {validationErrors.deliveryDate[index]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-100 row mx-auto">
                        <div className="col-sm p-0">
                          <label htmlFor="paymentTerm">
                            <strong>Withholding Tax</strong>
                          </label>
                          <br />
                          <select
                            name="tax"
                            id="tax"
                            className="form-select form-select-sm w-100"
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setVendorCards((prevCards) => {
                                  const newCards = [...prevCards];
                                  newCards[index].taxId = null;
                                  newCards[index].taxRate = 0;
                                  return newCards;
                                });
                              } else {
                                const selected = taxData.find(
                                  (tax) => tax.id === e.target.value,
                                );
                                if (selected) {
                                  setVendorCards((prevCards) => {
                                    const newCards = [...prevCards];
                                    newCards[index].taxId = selected.id;
                                    newCards[index].taxRate = parseFloat(
                                      selected.rate,
                                    );
                                    return newCards;
                                  });
                                }
                              }
                            }}
                            value={card.taxId || ""}
                          >
                            <option value="">Select Tax</option>
                            {taxData.map((item, index) => (
                              <option key={index} value={item.id}>
                                {item.name} ({item.rate}%)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-100 d-flex align-items-center">
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="px-4 w-100 row mb-3 ">
                    <div className="col-sm">
                      <label htmlFor="shippingMethod">
                        <strong>Shipping Method</strong>
                      </label>
                      <input
                        type="text"
                        name=""
                        id="shippingMethod"
                        value={card.shippingMethod || ""}
                        className="form-control form-control-sm"
                        onChange={(e) =>
                          handleShippingMethod(index, e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <label htmlFor="paymentTerm">
                        <strong>Payment Term</strong>
                      </label>
                      <input
                        type="text"
                        name=""
                        id="paymentTerm"
                        value={card.paymentTerm || ""}
                        className="form-control form-control-sm"
                        onChange={(e) =>
                          handlePaymentTerm(index, e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="px-3 w-100 table-responsive">
                    <table className="table">
                      <thead>
                        <tr className="table-secondary">
                          <th style={{ width: "20%" }} scope="col">
                            Product Code
                          </th>
                          <th style={{ width: "20%" }} scope="col">
                            Product Name
                          </th>
                          <th
                            style={{ width: "30%" }}
                            className="text-center"
                            scope="col"
                          >
                            Unit of Measure
                          </th>
                          <th style={{ width: "10%" }} scope="col">
                            Weight
                          </th>
                          <th
                            style={{ width: "10%" }}
                            scope="col"
                            className={
                              roleType?.includes("Management") ? "" : "d-none"
                            }
                          >
                            Price
                          </th>
                          <th style={{ width: "20%" }} scope="col">
                            Remarks
                          </th>
                          <th style={{ width: "10%" }} scope="col"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {card.products.map((product, productIndex) => (
                          <tr key={product.id}>
                            <td>{product.productCode}</td>
                            <td>{product.productName}</td>
                            <td className="text-center">{product.uom}</td>
                            <td>
                              <NumericFormat
                                className={`form-control form-control-sm ${
                                  validationErrors.quantities[index]?.[
                                    productIndex
                                  ]
                                    ? "is-invalid"
                                    : ""
                                }`}
                                value={product.quantity}
                                thousandSeparator={true}
                                min={1}
                                onValueChange={(values) => {
                                  const rawValue = values.floatValue || 0;
                                  handleProductQuantityChange(
                                    index,
                                    product.id,
                                    rawValue,
                                  );
                                  if (
                                    validationErrors.quantities[index]?.[
                                      productIndex
                                    ]
                                  ) {
                                    setValidationErrors((prev) => {
                                      const newErrors = { ...prev };
                                      if (newErrors.quantities[index]) {
                                        delete newErrors.quantities[index][
                                          productIndex
                                        ];
                                        if (
                                          Object.keys(
                                            newErrors.quantities[index],
                                          ).length === 0
                                        ) {
                                          delete newErrors.quantities[index];
                                        }
                                      }
                                      return newErrors;
                                    });
                                  }
                                }}
                                isAllowed={(values) => {
                                  const { floatValue } = values;
                                  return (
                                    floatValue === undefined ||
                                    (floatValue >= 0.01 &&
                                      floatValue <= 9999999999)
                                  );
                                }}
                              />
                              {validationErrors.quantities[index]?.[
                                productIndex
                              ] && (
                                <div className="invalid-feedback d-block">
                                  {
                                    validationErrors.quantities[index][
                                      productIndex
                                    ]
                                  }
                                </div>
                              )}
                            </td>
                            <td
                              className={
                                roleType?.includes("Management") ? "" : "d-none"
                              }
                            >
                              {parseFloat(product.price).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={product.remarks}
                                onChange={(e) =>
                                  handleProductRemarksChange(
                                    index,
                                    product.id,
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td>
                              <button
                                className="border-0 btn-sm fs-6"
                                style={{ background: "inherit" }}
                                onClick={() =>
                                  handleRemoveProduct(index, product.id)
                                }
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row mt-2">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm">
            <button
              className="w-100 btn btn-primary py-2"
              onClick={() => handleShowPOModal(true, null)}
              disabled={vendorCards.length === 0}
            >
              Preview PO
            </button>
          </div>
        </div>
      </div>

      {/* on going order card*/}
      {purchaseOrderCards.length > 0 && (
        <div className="container-fluid mt-5">
          <div className="w-100 d-flex align-items-center">
            <span>Purchase Order History</span>
            <hr className="flex-grow-1 mx-3" />
          </div>

          {loadingCards ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="w-100 row mt-">
              {purchaseOrderCards.map((card, index) => (
                <div key={index} className="col-md-6 mb-4 position-relative">
                  <div className="card h-100 border shadow-sm">
                    <div className="card-body p-0 pb-3">
                      <div className="card-title p-2 bg-secondary rounded-top text-white d-flex flex-row justify-content-between">
                        <div>Purchase Order No: {card.po_number}</div>
                        <div>
                          Date Created:{" "}
                          {new Date(card.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "2-digit",
                            },
                          )}
                        </div>
                      </div>

                      <div className="px-4 w-100 row">
                        <div className="col-sm d-flex flex-column">
                          <span>
                            <strong>Company Name:</strong>
                            <span className="mx-2">{card.vendor_name}</span>
                          </span>
                          <span>
                            <strong>Vendor Address:</strong>
                            <span className="mx-2">{card.vendor_address}</span>
                          </span>
                          <span>
                            <strong>VAT:</strong>
                            <span className="mx-2">{card.vat_rate}%</span>
                          </span>
                          <span>
                            <strong>Withholding Tax:</strong>
                            <span className="mx-2">
                              {card.withholding_tax_rate}%
                            </span>
                          </span>
                        </div>

                        <div className="col-sm d-flex flex-column align-items-start">
                          <div className="d-flex flex-row mb-1">
                            <div className="mx-2">
                              <label>
                                <strong>PO Date</strong>
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={card.po_date}
                                readOnly
                              />
                            </div>

                            <div>
                              <label>
                                <strong>Delivery Date</strong>
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={card.delivery_date}
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="mx-2">
                            <strong>Status:</strong>
                            <span
                              className={`mx-2 ${
                                card.status === "For Approval"
                                  ? "text-danger"
                                  : "text-primary"
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-100 d-flex align-items-center">
                        <hr className="flex-grow-1 mx-3" />
                      </div>

                      <div className="px-4 w-100 row mb-3">
                        <div className="col-sm">
                          <label htmlFor="shippingMethod">
                            <strong>Shipping Method</strong>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={card.shipping_method}
                            readOnly
                          />
                        </div>
                        <div className="col-sm">
                          <label htmlFor="paymentTerm">
                            <strong>Payment Term</strong>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={card.payment_term}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="px-3 w-100 table-responsive">
                        <table className="table">
                          <thead>
                            <tr className="table-secondary">
                              <th style={{ width: "15%" }}>Product Code</th>
                              <th style={{ width: "20%" }}>Product Name</th>
                              <th
                                style={{ width: "40%" }}
                                className="text-center"
                              >
                                Unit of Measure
                              </th>
                              <th style={{ width: "5%" }}>Weight</th>
                              <th
                                style={{ width: "10%" }}
                                className={
                                  roleType?.includes("Management")
                                    ? ""
                                    : "d-none"
                                }
                              >
                                Price
                              </th>
                              <th style={{ width: "10%" }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {card.products?.map((product, productIndex) => {
                              // Calculate weight for display in old PO cards
                              const quantity =
                                parseFloat(product.quantity) || 0;
                              const unit_quantity =
                                parseFloat(product.unit_quantity) || 1;
                              const displayWeight = quantity * unit_quantity;

                              return (
                                <tr key={productIndex}>
                                  <td>{product.product_code}</td>
                                  <td>{product.product_name}</td>
                                  <td>{product.uom}</td>
                                  <td>
                                    {displayWeight.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td
                                    className={
                                      roleType?.includes("Management")
                                        ? ""
                                        : "d-none"
                                    }
                                  >
                                    {parseFloat(product.price).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </td>
                                  <td>{product.remarks}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="px-3 w-100">
                        <div className="d-flex flex-row flex-direction-row justify-content-between">
                          <div></div>
                          {roleType?.includes("Management") && (
                            <div className="d-flex flex-row justify-content-end">
                              <div className="d-flex flex-column">
                                <span className="text-start">
                                  <strong>SUBTOTAL ORDER:</strong> PHP{" "}
                                  {parseFloat(card.subtotal).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </span>
                                <span className="text-start">
                                  <strong>TOTAL VAT ({card.vat_rate}%):</strong>{" "}
                                  <span className="text-primary">
                                    PHP{" "}
                                    {parseFloat(card.vat_amount).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </span>
                                </span>
                                <span className="text-start">
                                  <strong>
                                    WITHHOLDING TAX ({card.withholding_tax_rate}
                                    %):
                                  </strong>{" "}
                                  <span className="text-danger">
                                    PHP{" "}
                                    {parseFloat(
                                      card.withholding_tax,
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </span>
                                <span className="text-start">
                                  <strong>TOTAL ORDER AMOUNT:</strong>{" "}
                                  <span className="fw-semibold">
                                    PHP{" "}
                                    {parseFloat(
                                      card.total_amount,
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* modals */}
      <Modal
        show={showProductModal}
        onHide={() => {
          setShowProductModal(false);
          setSearchText("");
          setEditingPriceId(null);
        }}
        backdrop="static"
        size="xl"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="container-fluid">
              <div className="row mb-3">
                <div className="col-md-6">
                  <p>
                    <strong>Product Code:</strong>{" "}
                    {selectedProduct.product_code}
                  </p>
                  <p>
                    <strong>Product Name:</strong>{" "}
                    {selectedProduct.product_name}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Weight:</strong>{" "}
                    {selectedProduct.displayWeight?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ||
                      selectedProduct.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedProduct.status}
                  </p>
                </div>
              </div>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("all")}
                    >
                      All
                    </button>
                  </li>
                  <li className="d-none">
                    <button
                      className={`dropdown-item ${
                        filterColumn === "vendor_id" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("vendor_id")}
                    >
                      Vendor ID
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "vendor_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("vendor_name")}
                    >
                      Company Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "contact" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("contact")}
                    >
                      Contact
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "email" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("email")}
                    >
                      E-Mail
                    </button>
                  </li>
                </ul>
              </div>
              <div className="w-100">
                <div className="table-responsive data-table scrollable-contents">
                  <table
                    className="table table-hover table-responsive"
                    id="purchaseRequestProductDetailsTable"
                  >
                    <thead className="table-light">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectAll && vendors.length > 0}
                            onChange={handleSelectAll}
                            className="form-check-input border border-secondary"
                            style={{ height: "1.3rem", width: "1.3rem" }}
                            disabled={vendors.length === 0}
                          />
                        </th>
                        <th className="d-none">VENDOR ID</th>
                        <th>COMPANY NAME</th>
                        <th>CONTACT</th>
                        <th>EMAIL ADDRESS</th>
                        <th
                          className={
                            roleType?.includes("Management") ? "" : "d-none"
                          }
                        >
                          PRICE
                        </th>
                        <th className="d-none">ADDRESS</th>
                        <th className="d-none">VAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length > 0 ? (
                        vendors.map((vendor) => {
                          const individualName = `${
                            vendor.vendor.fname || ""
                          } ${vendor.vendor.lname || ""}`.trim();
                          const vendorName =
                            individualName ||
                            vendor.vendor.company_name ||
                            "N/A";
                          const contact =
                            vendor.vendor.contact ||
                            vendor.vendor.contact2 ||
                            "N/A";

                          const currentPrice =
                            vendorPrices[vendor.vendor_id] ||
                            vendor.product_price ||
                            0;
                          const tempPrice = tempVendorPrices[vendor.vendor_id];

                          return (
                            <tr key={vendor.vendor_id}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input border border-secondary"
                                  style={{
                                    height: "1.3rem",
                                    width: "1.3rem",
                                  }}
                                  checked={selectedVendors.includes(
                                    vendor.vendor_id,
                                  )}
                                  onChange={() =>
                                    handleVendorSelect(vendor.vendor_id)
                                  }
                                />
                              </td>
                              <td className="d-none">{vendor.vendor_id}</td>
                              <td>{vendorName}</td>
                              <td>{contact}</td>
                              <td>{vendor.vendor.company_email || "N/A"}</td>
                              <td
                                className={
                                  roleType?.includes("Management")
                                    ? ""
                                    : "d-none"
                                }
                              >
                                <div className="d-flex flex-row align-items-center">
                                  <NumericFormat
                                    className="form-control"
                                    value={
                                      editingPriceId === vendor.vendor_id
                                        ? tempPrice
                                        : currentPrice
                                    }
                                    thousandSeparator={true}
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                    readOnly={
                                      editingPriceId !== vendor.vendor_id
                                    }
                                    max={9999999999}
                                    onValueChange={(values) => {
                                      const rawValue = values.floatValue || 0;
                                      handleTempPriceChange(
                                        vendor.vendor_id,
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
                                  />

                                  {editingPriceId === vendor.vendor_id ? (
                                    <>
                                      <button
                                        className="btn btn-success btn-sm mx-2"
                                        onClick={() =>
                                          handlePriceSave(vendor.vendor_id)
                                        }
                                      >
                                        <i className="fa-solid fa-check"></i>
                                      </button>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() =>
                                          handlePriceCancel(
                                            vendor.vendor_id,
                                            vendor.product_price || 0,
                                          )
                                        }
                                      >
                                        <i className="fa-solid fa-times"></i>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      className="btn btn-primary btn-sm mx-2"
                                      onClick={() =>
                                        handlePriceEdit(
                                          vendor.vendor_id,
                                          currentPrice,
                                        )
                                      }
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="d-none">
                                {vendor.vendor.company_address || "N/A"}
                              </td>
                              <td className="d-none">
                                {vendor.vendor.vat || "0"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            No vendors found for this product
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {vendors.length > 0 && <PaginationControls {...pagination} />}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowProductModal(false);
              setSearchText("");
              setEditingPriceId(null);
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleConfirmVendors}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Modal Container for Vendor Products */}
      <div className="pdf-modal-container">
        <Modal
          backdrop="static"
          show={showPOModal}
          onHide={handleClosePOModal}
          dialogClassName="pdf-custom-modal-width"
        >
          <Modal.Header
            className="p-0 text-white p-2 px-3 white-close-btn border-0"
            style={{
              background: "#595959",
              height: "60px",
            }}
            closeButton
          >
            <Modal.Title>PREVIEW P.O LIST</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: "#AEAEAE" }} className="p-4">
            {vendorPages.length > 0 && (
              <div
                className="container-fluid bg-white p-3 rounded"
                id="pdfVendorCanvassPage"
              >
                {/* Header Section */}
                <div className="mb-4 d-flex justify-content-between ">
                  <div className="px-4 py-2 d-flex flex-column justify-content-end">
                    <h6
                      className="mb-2 fs-4 po-font-family"
                      style={{ fontWeight: 400 }}
                    >
                      {settings?.company_name.toUpperCase() ||
                        "E-Logic Innovations"}
                    </h6>
                    <h3 className="fw-bold fs-1 po-font-family">
                      PURCHASE ORDER
                    </h3>
                  </div>
                  <img
                    src={settings?.logo || Logo}
                    className="img-fluid"
                    alt="Logo"
                    style={{ maxHeight: "150px" }}
                  />
                </div>

                {/* Vendor PO Content */}
                <div className="w-100 mb-3 px-4">
                  <div
                    className="w-100 d-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                      gap: "2rem",
                    }}
                  >
                    {/* LEFT COLUMN */}
                    <div className="d-flex flex-column gap-4">
                      {/* Group 1: PO Info */}
                      <div className="d-flex flex-column gap-2">
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "160px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            PO No:
                          </strong>
                          <span className="text-start">
                            {vendorPages[currentVendorPage].poNumber || "N/A"}
                          </span>
                        </div>
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "160px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Date Issued:
                          </strong>
                          <span className="text-start">
                            {new Date(
                              vendorPages[currentVendorPage]
                                ?.purchaseOrderDate || new Date(),
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Group 2: Supplier Info */}
                      <div className="d-flex flex-column gap-2 mt-3">
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "160px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Supplier:
                          </strong>
                          <span className="text-start">
                            {vendorPages[currentVendorPage].vendorName || "N/A"}
                          </span>
                        </div>
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "160px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Address:
                          </strong>
                          <span className="text-start">
                            {vendorPages[currentVendorPage].vendorAddress ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="d-flex flex-column gap-4">
                      {/* Deliver To */}
                      <div
                        className="d-grid"
                        style={{ gridTemplateColumns: "170px 1fr" }}
                      >
                        <strong className="po-font-family text-start">
                          Deliver To:
                        </strong>
                        <span className="text-start text-wrap">
                          {warehouseData[0].name || "N/A"}
                        </span>
                      </div>

                      {/* Delivery Details */}
                      <div className="d-flex flex-column gap-2 mt-3">
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "170px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Delivery Date:
                          </strong>
                          <span className="text-start">
                            {formatDate(
                              vendorPages[currentVendorPage].deliveryDate,
                            )}
                          </span>
                        </div>
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "170px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Shipping Method:
                          </strong>
                          <span className="text-start">
                            {vendorPages[currentVendorPage].shippingMethod ||
                              "N/A"}
                          </span>
                        </div>
                        <div
                          className="d-grid"
                          style={{ gridTemplateColumns: "170px 1fr" }}
                        >
                          <strong className="po-font-family text-start">
                            Payment Terms:
                          </strong>
                          <span className="text-start">
                            {vendorPages[currentVendorPage].paymentTerm ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="mt-5">
                  <table className="table po-font-family" id="pdfProductTable">
                    <thead>
                      <tr>
                        <th
                          className="text-center po-font-family"
                          style={{ background: "#7B7B7B", color: "#fff" }}
                        >
                          WEIGHT
                        </th>
                        <th
                          className="text-center po-font-family"
                          style={{ background: "#7B7B7B", color: "#fff" }}
                        >
                          UNIT OF MEASURE
                        </th>
                        <th
                          className="text-center po-font-family"
                          style={{ background: "#7B7B7B", color: "#fff" }}
                        >
                          PRODUCT NAME
                        </th>
                        <th
                          style={{ background: "#7B7B7B", color: "#fff" }}
                          className={
                            roleType?.includes("Management")
                              ? "text-center po-font-family"
                              : "d-none"
                          }
                        >
                          UNIT PRICE
                        </th>
                        <th
                          style={{ background: "#7B7B7B", color: "#fff" }}
                          className={
                            roleType?.includes("Management")
                              ? "text-center po-font-family"
                              : "d-none"
                          }
                        >
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorPages[currentVendorPage].products.map(
                        (product) => {
                          // Calculate unitQuantity with default value of 1 if not provided
                          const unitQuantity = product.unit_quantity || 1; // Changed from product_unit_quantity to unit_quantity

                          // Parse values safely
                          const quantity = !isNaN(parseFloat(product.quantity))
                            ? parseFloat(product.quantity)
                            : 0;
                          const price = !isNaN(parseFloat(product.price))
                            ? parseFloat(product.price)
                            : 0;

                          // Calculate total: (quantity / unitQuantity) * price
                          const total = (quantity / unitQuantity) * price;

                          return (
                            <tr key={product.id}>
                              <td className="text-center">
                                {quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>

                              <td className="text-center">{product.uom}</td>
                              <td className="text-center">
                                {product.productName}
                              </td>
                              <td
                                className={
                                  roleType?.includes("Management")
                                    ? "text-center"
                                    : "d-none"
                                }
                              >
                                {price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td
                                className={
                                  roleType?.includes("Management")
                                    ? "text-center"
                                    : "d-none"
                                }
                              >
                                {total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* total section */}
                <div
                  className="d-flex flex-row justify-content-between"
                  style={{ margin: "5rem 0" }}
                >
                  <div></div>

                  {roleType?.includes("Management") && (
                    <div className="d-flex flex-row justify-content-end">
                      <div className="d-flex flex-column">
                        {/* Calculate subtotal with unitQuantity */}
                        <span className="text-start po-font-family">
                          <strong className="po-font-family">
                            SUBTOTAL ORDER:
                          </strong>{" "}
                          PHP{" "}
                          {formatNumber(
                            vendorPages[currentVendorPage].products.reduce(
                              (sum, product) => {
                                const unitQuantity = product.unit_quantity || 1;
                                const quantity = !isNaN(
                                  parseFloat(product.quantity),
                                )
                                  ? parseFloat(product.quantity)
                                  : 0;
                                const price = !isNaN(parseFloat(product.price))
                                  ? parseFloat(product.price)
                                  : 0;

                                // Calculate total: (quantity / unitQuantity) * price
                                const productTotal =
                                  (quantity / unitQuantity) * price;
                                return sum + productTotal;
                              },
                              0,
                            ),
                          )}
                        </span>

                        {/* Calculate VAT with unitQuantity */}
                        <span
                          className="text-start po-font-family"
                          title="SUB TOTAL ORDER x VAT RATE"
                        >
                          <strong className="po-font-family">
                            TOTAL VAT ({vendorPages[currentVendorPage].vat ?? 0}
                            %):
                          </strong>{" "}
                          <span className="po-font-family">
                            PHP{" "}
                            {formatNumber(
                              vendorPages[currentVendorPage].products.reduce(
                                (sum, product) => {
                                  const unitQuantity =
                                    product.unit_quantity || 1;
                                  const quantity = !isNaN(
                                    parseFloat(product.quantity),
                                  )
                                    ? parseFloat(product.quantity)
                                    : 0;
                                  const price = !isNaN(
                                    parseFloat(product.price),
                                  )
                                    ? parseFloat(product.price)
                                    : 0;

                                  // Calculate total: (quantity / unitQuantity) * price
                                  const productTotal =
                                    (quantity / unitQuantity) * price;
                                  return sum + productTotal;
                                },
                                0,
                              ) *
                                ((vendorPages[currentVendorPage].vat ?? 0) /
                                  100),
                            )}
                          </span>
                        </span>

                        {/* Calculate Withholding Tax with unitQuantity */}
                        <span
                          className="text-start po-font-family"
                          title="SUB TOTAL ORDER x TAX RATE"
                        >
                          <strong className="po-font-family">
                            WITHHOLDING TAX (
                            {vendorPages[currentVendorPage].taxRate ?? 0}%):
                          </strong>{" "}
                          <span className="po-font-family">
                            PHP{" "}
                            {formatNumber(
                              vendorPages[currentVendorPage].products.reduce(
                                (sum, product) => {
                                  const unitQuantity =
                                    product.unit_quantity || 1;
                                  const quantity = !isNaN(
                                    parseFloat(product.quantity),
                                  )
                                    ? parseFloat(product.quantity)
                                    : 0;
                                  const price = !isNaN(
                                    parseFloat(product.price),
                                  )
                                    ? parseFloat(product.price)
                                    : 0;

                                  // Calculate total: (quantity / unitQuantity) * price
                                  const productTotal =
                                    (quantity / unitQuantity) * price;
                                  return sum + productTotal;
                                },
                                0,
                              ) *
                                (vendorPages[currentVendorPage].taxRate / 100),
                            )}
                          </span>
                        </span>

                        {/* Calculate Grand Total with unitQuantity */}
                        <span
                          className="text-start po-font-family"
                          title="SUB TOTAL ORDER + VAT AMOUNT - TAX AMOUNT"
                        >
                          <strong className="po-font-family">
                            TOTAL ORDER AMOUNT:
                          </strong>{" "}
                          <span className="po-font-family">
                            PHP{" "}
                            {(() => {
                              const subtotal = vendorPages[
                                currentVendorPage
                              ].products.reduce((sum, product) => {
                                const unitQuantity = product.unit_quantity || 1;
                                const quantity = !isNaN(
                                  parseFloat(product.quantity),
                                )
                                  ? parseFloat(product.quantity)
                                  : 0;
                                const price = !isNaN(parseFloat(product.price))
                                  ? parseFloat(product.price)
                                  : 0;

                                // Calculate total: (quantity / unitQuantity) * price
                                const productTotal =
                                  (quantity / unitQuantity) * price;
                                return sum + productTotal;
                              }, 0);
                              const vatAmount =
                                subtotal *
                                (vendorPages[currentVendorPage].vat / 100);
                              const withholdingTax =
                                subtotal *
                                (vendorPages[currentVendorPage].taxRate / 100);
                              const total =
                                subtotal + vatAmount - withholdingTax;
                              return `PHP ${formatNumber(total)}`;
                            })()}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-100 text-center po-font-family">
                  ---------- NOTHING FOLLOWS ----------
                </div>

                {/* Signature Section */}
                <div
                  className="d-flex flex-row justify-content-around text-center"
                  style={{ margin: "5rem 0" }}
                >
                  {/* Requested By */}
                  <div
                    style={{ minWidth: "280px" }}
                    className="d-flex flex-column justify-content-between gap-4"
                  >
                    <p>Requested By: </p>
                    <div>
                      <div
                        style={{
                          borderBottom: "1px solid black",
                          width: "100%",
                          margin: "0 auto",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        {purchaseRequest.requestor.full_name || null}
                      </div>
                      <strong>NAME</strong>
                    </div>
                  </div>

                  {/* Prepared By */}
                  <div
                    style={{ minWidth: "280px" }}
                    className="d-flex flex-column justify-content-between gap-4"
                  >
                    <p>Prepared By: </p>
                    <div>
                      <div
                        style={{
                          borderBottom: "1px solid black",
                          width: "100%",
                          margin: "0 auto",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        {preparedByData || null}
                      </div>
                      <strong>NAME</strong>
                    </div>
                  </div>

                  {/* Approved By */}
                  <div
                    style={{ minWidth: "280px" }}
                    className="d-flex flex-column justify-content-between gap-4"
                  >
                    <p>Approved By: </p>
                    <div>
                      <div
                        style={{
                          borderBottom: "1px solid black",
                          width: "100%",
                          margin: "0 auto",
                          paddingBottom: "0.5rem",
                        }}
                      ></div>
                      <strong>NAME</strong>
                    </div>
                  </div>
                </div>

                {/* COMPANY INFO SECTION */}
                <div className="d-flex justify-content-between px-3 mb-3">
                  <div
                    style={{ width: "27%", wordSpacing: "3px" }}
                    className="po-font-family"
                  >
                    {settings?.company_address ||
                      "2nd Floor Unit B ARCA Corporate Center, 150 F. Dela Cruz Street Cor. Maysan Road, Brgy Maysan, Valenzuela, Philippines"}
                  </div>
                  <div
                    className="w-50 d-flex flex-column align-items-end justify-content-end"
                    style={{ wordSpacing: "3px" }}
                  >
                    <span className="po-font-family">
                      {settings?.email || "N/A"}
                    </span>
                    <span className="po-font-family">
                      VAT Reg. TIN: {settings?.tin || "N/A"}
                    </span>
                    <span className="po-font-family">
                      Telephone No: {settings?.landline || "(02) 8659 8685"}
                    </span>{" "}
                  </div>
                </div>
              </div>
            )}

            {/* Page Navigation */}
            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="secondary"
                onClick={handlePrevPage}
                disabled={currentVendorPage === 0}
              >
                Previous
              </Button>

              <span className="text-white fw-semibold align-self-center">
                Page {currentVendorPage + 1} of {vendorPages.length}
              </span>

              <Button
                variant="secondary"
                onClick={handleNextPage}
                disabled={currentVendorPage === vendorPages.length - 1}
              >
                Next
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer
            className="p-0 p-2 border-0"
            style={{ background: "#595959", height: "60px" }}
          >
            <Button
              variant="primary"
              onClick={handleCreatePO}
              disabled={isCreatingPO}
            >
              {isCreatingPO ? "Creating..." : "Create P.O"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};
export default Purchase_request_view;
