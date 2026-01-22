import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import "../../../assets/css/lionchem.css";
import moment from "moment";

import dayjs from "dayjs";

const ScheduleList = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const userLoggedID = useDecodeToken();

  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);

  // data for filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateRequested, setFilterDateRequested] = useState("");
  const [filterDeliveryDate, setFilterDeliveryDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [filterColumn, setFilterColumn] = useState("all");
  const [formData, setFormData] = useState({
    id: "",
    scheduleId: "",
    scheduleName: "",
    requestor: "",
    batchNo: "",
    approvedBy: "",
    totalQuantity: "",
    dateRequested: "",
    deliveryDate: "",
    originalDeliveryDate: "",
    driver: "",
    porters: "",
    status: "",
    remarks: "",
  });

  // filters
  const handleFilter = () => {
    setPaginationUrl(`${BASE_URL}/ScheduleList/fetchFilteredScheduleList`);
    pagination.updateParams({
      filterStatus,
      filterDateRequested,
      filterDeliveryDate,
    });
  };

  const handleClearFilter = () => {
    setFilterStatus("");
    setFilterDeliveryDate("");
    setFilterDateRequested("");
    setSearchText("");
    setSearchField("all");
    setPaginationUrl(BASE_URL + "/ScheduleList/fetchScheduleList");
    pagination.updateParams({});
  };

  const handleSearchCategoryChange = (category) => {
    setSearchField(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim() === "") {
      setPaginationUrl(BASE_URL + "/ScheduleList/fetchScheduleList");
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchField);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/ScheduleList/fetchSearchScheduleList");

    const params = {
      searchText: text,
    };

    if (category && category !== "all") {
      params.searchField = category;
    }

    if (category === "all") {
      params.searchField = undefined;
    }

    pagination.updateParams(params);
  };

  const searchFieldOptions = {
    all: "All Fields",
    schedule_code: "Schedule Code",
    title: "Schedule Name",
  };

  const handleShow = (data, isRowForApproval) => {
    if (data !== null) {
      setFormData({
        id: data.id,
        scheduleId: data.scheduleId,
        scheduleName: data.title,
        requestor: data.requestor,
        batchNo: data.batchNo,
        approvedBy: data.approvedBy,
        totalQuantity: data.totalQuantity,
        dateRequested: data.dateRequested,
        deliveryDate: data.deliveryDate,
        status: data.status,
        remarks: data.remarks || "",
      });
    }
    setShowModal(true);
    setEnableEdit(false);
    setIsRowForApproval(isRowForApproval);
  };

  const handleClose = () => {
    if (enableEdit) {
      swal({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Do you want to cancel edit and close?",
        icon: "warning",
        buttons: ["No", "Yes"],
        dangerMode: true,
      }).then((willClose) => {
        if (willClose) {
          // User chose to close without saving
          resetModalState();
        }
      });
    } else {
      resetModalState();
    }
  };

  // Create a separate function to reset modal state
  const resetModalState = () => {
    setShowModal(false);
    setEnableEdit(false);
    setIsRowForApproval(false);
    setExpandedRows({});
    setFormData({
      id: "",
      scheduleId: "",
      scheduleName: "",
      requestor: "",
      batchNo: "",
      approvedBy: "",
      totalQuantity: "",
      dateRequested: "",
      deliveryDate: "",
      originalDeliveryDate: "",
      status: "",
      remarks: "",
    });
    setModalInvoiceData({
      items: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    });
    setEditableInvoiceData([]);
    setProductLists({});
    setModalPaginationUrl("");
    setRawInputValues({});
  };

  const handleEdit = () => {
    setEnableEdit(true);

    // Auto-expand all rows when editing Partial-Deliver status
    if (formData.status === "Partial-Deliver") {
      expandAllInvoiceRows();
    }
  };

  const handleCancelEdit = async () => {
    // Confirm with user before discarding changes
    swal({
      title: "Cancel Edit?",
      text: "Any unsaved changes will be lost. Are you sure?",
      icon: "warning",
      buttons: ["No", "Yes"],
      dangerMode: true,
    }).then(async (willCancel) => {
      if (willCancel) {
        // If editing was cancelled, revert to original data
        if (formData.id) {
          try {
            setIsLoading(true);

            // Fetch original schedule details
            const detailsResponse = await axios.get(
              `${BASE_URL}/ScheduleList/getDetails/${formData.id}`
            );
            const detailsData = detailsResponse.data;

            // Update form data with original values
            setFormData({
              id: detailsData.id,
              scheduleId: detailsData.schedule_code,
              scheduleName: detailsData.title,
              deliveryDate: detailsData.delivery_date,
              originalDeliveryDate: detailsData.delivery_date,
              driver: detailsData.driver || "",
              porters: detailsData.porters || "",
              status: detailsData.status,
              remarks: detailsData.remarks || "",
            });

            // Fetch original invoice data
            const invoiceResponse = await axios.get(
              `${BASE_URL}/ScheduleList/getScheduleInvoiceList/${detailsData.id}`
            );

            const transformedData = {
              items: invoiceResponse.data.data || [],
              loading: false,
              error: null,
              currentPage: invoiceResponse.data.currentPage || 1,
              totalPages: invoiceResponse.data.totalPages || 1,
              totalItems: invoiceResponse.data.totalItems || 0,
            };

            setModalInvoiceData(transformedData);
            setEditableInvoiceData([...transformedData.items]);

            // Reset product lists
            setProductLists({});
            setRawInputValues({});
            setExpandedRows({});

            // Exit edit mode
            setEnableEdit(false);

            swal({
              title: "Edit Cancelled",
              text: "All changes have been reverted.",
              icon: "info",
              buttons: false,
              timer: 1500,
            });
          } catch (error) {
            console.error("Error reverting changes:", error);
            swal("Error", "Failed to revert changes", "error");
            setEnableEdit(false); // Still exit edit mode
          } finally {
            setIsLoading(false);
          }
        } else {
          // Just exit edit mode if no data to revert
          setEnableEdit(false);
        }
      }
    });
  };

  // Separate function to expand all invoice rows
  const expandAllInvoiceRows = async () => {
    if (editableInvoiceData.length === 0) return;

    const newExpandedState = {};
    const productListsToFetch = [];

    // Mark all rows as expanded
    editableInvoiceData.forEach((invoice, index) => {
      newExpandedState[index] = true;

      // Check if we need to fetch product data
      if (!productLists[invoice.sales_invoice_id]) {
        productListsToFetch.push({ invoice, index });
      }
    });

    setExpandedRows(newExpandedState);

    // Fetch missing product lists in parallel
    if (productListsToFetch.length > 0) {
      try {
        const fetchPromises = productListsToFetch.map(async ({ invoice }) => {
          const response = await axios.get(
            `${BASE_URL}/ScheduleList/getScheduleProducts/${invoice.sales_invoice_id}`,
            {
              params: {
                schedule_id: formData.id,
              },
            }
          );
          return {
            salesInvoiceId: invoice.sales_invoice_id,
            data: response.data.data || [],
          };
        });

        const results = await Promise.all(fetchPromises);

        // Update product lists state
        const updatedProductLists = { ...productLists };
        results.forEach((result) => {
          updatedProductLists[result.salesInvoiceId] = result.data;
        });

        setProductLists(updatedProductLists);
      } catch (error) {
        console.error("Error fetching product lists:", error);
        swal("Warning", "Some product details failed to load", "warning");
      }
    }
  };

  const [editableInvoiceData, setEditableInvoiceData] = useState([]);
  const [modalPaginationUrl, setModalPaginationUrl] = useState("");
  const modalPagination = useServerPagination(modalPaginationUrl, 10);

  const [modalInvoiceData, setModalInvoiceData] = useState({
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const handleRowClick = async (id) => {
    try {
      setIsLoading(true);
      // Reset states before loading new data
      setEditableInvoiceData([]);
      setProductLists({});
      setRawInputValues({});

      const detailsResponse = await axios.get(
        `${BASE_URL}/ScheduleList/getDetails/${id}`
      );
      const detailsData = detailsResponse.data;

      setFormData({
        id: detailsData.id,
        scheduleId: detailsData.schedule_code,
        scheduleName: detailsData.title,
        deliveryDate: detailsData.delivery_date,
        originalDeliveryDate: detailsData.delivery_date,
        driver: detailsData.driver || "",
        porters: detailsData.porters || "",
        status: detailsData.status,
        remarks: detailsData.remarks || "",
      });

      const invoiceResponse = await axios.get(
        `${BASE_URL}/ScheduleList/getScheduleInvoiceList/${detailsData.id}`
      );

      const transformedData = {
        items: invoiceResponse.data.data || [],
        loading: false,
        error: null,
        currentPage: invoiceResponse.data.currentPage || 1,
        totalPages: invoiceResponse.data.totalPages || 1,
        totalItems: invoiceResponse.data.totalItems || 0,
      };

      setModalInvoiceData(transformedData);
      setEditableInvoiceData([...transformedData.items]); // Set fresh data
      setIsRowForApproval(detailsData.status === "For-Approval");
      setShowModal(true);
      reloadTable();
    } catch (error) {
      console.error("Error details:", error);
      swal("Error", "Failed to fetch schedule details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const [rawInputValues, setRawInputValues] = useState({});

  const formatWithCommas = (value) => {
    if (value === null || value === undefined || value === "") return "0.00";

    // Handle string values that might already have commas
    const stringValue =
      typeof value === "number" ? value.toFixed(2) : String(value);
    const cleanValue = stringValue.replace(/,/g, ""); // Remove existing commas

    // Handle decimal numbers
    if (cleanValue.includes(".")) {
      const [integerPart, decimalPart] = cleanValue.split(".");
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );

      // Ensure 2 decimal places
      const formattedDecimal = decimalPart.padEnd(2, "0").substring(0, 2);
      return `${formattedInteger}.${formattedDecimal}`;
    }

    // Handle integers - convert to decimal format
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ".00";
  };

  const handleQuantityChange = (index, value) => {
    const newEditableData = [...editableInvoiceData];

    if (value === "") {
      newEditableData[index].quantity = "";
    } else {
      const numericString = value.replace(/[^0-9]/g, "");
      if (numericString) {
        newEditableData[index].quantity = String(Number(numericString));
      } else {
        newEditableData[index].quantity = "";
      }
    }

    setEditableInvoiceData(newEditableData);

    const total = newEditableData.reduce((sum, item) => {
      return sum + (item.quantity ? parseInt(item.quantity, 10) : 0);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      totalQuantity: total.toLocaleString("en-PH"),
    }));
  };

  const updateTotalsWithDecimals = (productListsToUse, currentIndex) => {
    // Calculate total weight for the specific invoice with decimals
    const invoiceTotal = productListsToUse[
      editableInvoiceData[currentIndex].sales_invoice_id
    ].reduce((sum, p) => sum + (parseFloat(p.weight_to_delivered) || 0), 0);

    // Update the invoice weight_to_deliver field with 2 decimal places
    const newEditableData = [...editableInvoiceData];
    newEditableData[currentIndex].weight_to_deliver = invoiceTotal.toFixed(2);
    setEditableInvoiceData(newEditableData);

    // Update form totalWeight with decimals
    const formTotal = newEditableData.reduce(
      (sum, item) => sum + (parseFloat(item.weight_to_deliver) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      totalWeight: formatWithCommas(formTotal.toFixed(2)), // Format with 2 decimal places
    }));
  };

  useEffect(() => {
    if (modalPaginationUrl) {
      modalPagination.refresh();
    }
  }, [modalPaginationUrl]);

  useEffect(() => {
    setSearchText("");
    setPaginationUrl(BASE_URL + "/ScheduleList/fetchScheduleList");
    pagination.updateParams({});
  }, [filterColumn]);

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/ScheduleList/fetchScheduleList"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  const handleSave = () => {
    // Calculate total weight from all invoices for the payload
    const calculatedTotalWeight = editableInvoiceData.reduce((sum, invoice) => {
      return sum + (parseFloat(invoice.weight_to_deliver) || 0);
    }, 0);

    const payload = {
      scheduleId: formData.id,
      invoices: editableInvoiceData.map((item) => ({
        id: item.id,
        weight_to_deliver: item.weight_to_deliver
          ? typeof item.weight_to_deliver === "string"
            ? item.weight_to_deliver.replace(/,/g, "")
            : String(item.weight_to_deliver).replace(/,/g, "")
          : "0",
        delivered_quantity: item.delivered_quantity
          ? typeof item.delivered_quantity === "string"
            ? item.delivered_quantity.replace(/,/g, "")
            : String(item.delivered_quantity).replace(/,/g, "")
          : "0",
        products:
          productLists[item.sales_invoice_id]?.map((product) => ({
            id: product.id,
            weight_to_delivered: product.weight_to_delivered
              ? typeof product.weight_to_delivered === "string"
                ? product.weight_to_delivered.replace(/,/g, "")
                : String(product.weight_to_delivered).replace(/,/g, "")
              : "0",
          })) || [],
      })),
      totalWeight: calculatedTotalWeight.toFixed(2),
      deliveryDate: formData.deliveryDate,
      scheduleName: formData.scheduleName,
      driver: formData.driver || "",
      porters: formData.porters || "",
      remarks: formData.remarks,
      userLogged: userLoggedID,
    };

    console.log("Saving payload:", payload);

    // Check if we're only changing delivery date (no weight changes)
    const hasWeightChanges =
      editableInvoiceData.some(
        (invoice) =>
          invoice.weight_to_deliver && parseFloat(invoice.weight_to_deliver) > 0
      ) ||
      Object.keys(productLists).some((salesInvoiceId) =>
        productLists[salesInvoiceId].some(
          (product) =>
            product.weight_to_delivered &&
            parseFloat(product.weight_to_delivered) > 0
        )
      );

    // Only validate weights if there are actual weight changes
    if (hasWeightChanges) {
      // Validate before saving - ONLY PRODUCT LEVEL VALIDATION (since returned_weight only exists there)
      const hasInvalidDeliveries = editableInvoiceData.some((invoice) => {
        if (invoice.status === "Delivered") return false;

        // Calculate total returned weight for this invoice from its products
        const totalReturnedWeight =
          productLists[invoice.sales_invoice_id]?.reduce((sum, product) => {
            return sum + (product.returned_weight || 0);
          }, 0) || 0;

        // CORRECT remaining weight calculation including returned products
        const remainingWeight =
          invoice.ordered_weight -
          (invoice.delivered_quantity || 0) +
          totalReturnedWeight;

        return (
          !invoice.weight_to_deliver ||
          parseFloat(invoice.weight_to_deliver) <= 0 ||
          parseFloat(invoice.weight_to_deliver) > remainingWeight
        );
      });

      if (hasInvalidDeliveries) {
        swal({
          title: "Validation Error",
          text: "All invoices must have a valid weight to deliver (greater than 0 and not exceeding remaining weight including returned products).",
          icon: "error",
        });
        return;
      }

      // Product-level validation WITH returned_weight (since it exists for products)
      const hasInvalidProducts = Object.keys(productLists).some(
        (salesInvoiceId) => {
          return productLists[salesInvoiceId].some((product) => {
            if (product.status === "Delivered") return false;

            const productRemainingWeight =
              product.original_weight -
              (product.delivered_quantity || 0) +
              (product.returned_weight || 0);

            return (
              product.weight_to_delivered &&
              parseFloat(product.weight_to_delivered) > productRemainingWeight
            );
          });
        }
      );

      if (hasInvalidProducts) {
        swal({
          title: "Validation Error",
          text: "Some products have delivery weights exceeding their remaining weight.",
          icon: "error",
        });
        return;
      }
    }

    // Show confirmation dialog before saving
    swal({
      title: "Confirm Update",
      text: "Are you sure you want to update this schedule?",
      icon: "warning",
      buttons: ["Cancel", "Update"],
      dangerMode: true,
    }).then((willUpdate) => {
      if (willUpdate) {
        // Show loading state
        swal({
          title: "Updating Schedule",
          text: "Please wait while we update the schedule...",
          icon: "info",
          buttons: false,
          closeOnClickOutside: false,
          closeOnEsc: false,
        });

        // If no weight changes or validation passed, proceed with save
        axios
          .put(`${BASE_URL}/ScheduleList/updateSchedule`, payload)
          .then((response) => {
            const message = response.data.deliveryDateChanged
              ? "Schedule updated successfully - Delivery date changed"
              : "Schedule updated successfully";

            swal({
              title: "Success",
              text: message,
              icon: "success",
              buttons: false,
              timer: 2000,
            }).then(async () => {
              reloadTable();

              // Refresh product lists for expanded rows
              if (Object.keys(expandedRows).length > 0) {
                const expandedRowIds = Object.entries(expandedRows)
                  .filter(([_, isExpanded]) => isExpanded)
                  .map(([rowId]) => rowId);

                setExpandedRows({});

                for (const rowId of expandedRowIds) {
                  const invoice = editableInvoiceData[rowId];
                  if (invoice) {
                    try {
                      const response = await axios.get(
                        `${BASE_URL}/ScheduleList/getScheduleProducts/${invoice.sales_invoice_id}`,
                        {
                          params: {
                            schedule_id: formData.id,
                          },
                        }
                      );

                      setProductLists((prev) => ({
                        ...prev,
                        [invoice.sales_invoice_id]: response.data.data || [],
                      }));
                    } catch (error) {
                      console.error("Error refreshing product list:", error);
                    }
                  }
                }

                const newExpandedState = {};
                expandedRowIds.forEach((rowId) => {
                  newExpandedState[rowId] = true;
                });
                setExpandedRows(newExpandedState);
              }

              setEnableEdit(false);

              // Refresh the form data to show updated values
              try {
                const refreshedResponse = await axios.get(
                  `${BASE_URL}/ScheduleList/getDetails/${formData.id}`
                );
                const refreshedData = refreshedResponse.data;

                setFormData((prev) => ({
                  ...prev,
                  driver: refreshedData.driver,
                  porters: refreshedData.porters,
                  scheduleName: refreshedData.title,
                  deliveryDate: refreshedData.delivery_date,
                  remarks: refreshedData.remarks,
                }));

                // Also refresh the invoice data
                const invoiceResponse = await axios.get(
                  `${BASE_URL}/ScheduleList/getScheduleInvoiceList/${formData.id}`
                );

                const transformedData = {
                  items: invoiceResponse.data.data || [],
                  loading: false,
                  error: null,
                  currentPage: invoiceResponse.data.currentPage || 1,
                  totalPages: invoiceResponse.data.totalPages || 1,
                  totalItems: invoiceResponse.data.totalItems || 0,
                };

                setModalInvoiceData(transformedData);
                setEditableInvoiceData([...transformedData.items]);
              } catch (error) {
                console.error("Error refreshing form data:", error);
              }
            });
          })
          .catch((error) => {
            console.error("Update failed:", error);
            let errorMessage = "Failed to update schedule";

            if (error.response) {
              // Server responded with error status
              errorMessage =
                error.response.data.message ||
                error.response.data.error ||
                errorMessage;
            } else if (error.request) {
              // Request was made but no response received
              errorMessage =
                "No response from server. Please check your connection.";
            } else {
              // Something else happened
              errorMessage = error.message || errorMessage;
            }

            swal({
              title: "Error",
              text: errorMessage,
              icon: "error",
              button: "OK",
            });
          });
      } else {
        // User cancelled the update
        swal.close();
      }
    });
  };

  const validateInvoiceQuantities = () => {
    if (formData.status === "Delivered") {
      return true;
    }

    const hasInvalidInvoice = editableInvoiceData.some(
      (invoice) =>
        invoice.status !== "Delivered" &&
        (!invoice.weight_to_deliver ||
          parseFloat(invoice.weight_to_deliver) <= 0)
    );

    if (hasInvalidInvoice) {
      swal({
        title: "Validation Error",
        text: "All invoices must have a weight greater than 0 to be delivered.",
        icon: "error",
      });
      return false;
    }

    return true;
  };

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleStatusActionClick = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
    setShowModal(false);
  };

  const handleStatusSubmit = () => {
    // Only validate for "delivered" status
    // console.log(statusAction);
    if (statusAction === "delivered") {
      if (!validateInvoiceQuantities()) {
        return; // Stop if validation fails
      }
    }

    let newStatus;
    let actionText;

    if (statusAction === "approve") {
      newStatus = "Approved";
      actionText = "approved";
    } else if (statusAction === "decline") {
      newStatus = "Declined";
      actionText = "declined";
    } else if (statusAction === "delivered") {
      newStatus = "Delivered";
      actionText = "marked as delivered";
    }

    const statusUpdate = {
      id: formData.id,
      status: newStatus,
      remarks: remarks,
      userLogged: userLoggedID,
      actionDate: new Date().toISOString(),
    };

    axios
      .post(`${BASE_URL}/ScheduleList/updateScheduleStatus`, statusUpdate)
      .then((response) => {
        swal({
          title: "Success",
          text: `Schedule ${actionText} successfully`,
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          reloadTable();
          handleClearFilter();
          handleClose();
          handleStatusModalClose();
          setShowModal(false);
        });
      })
      .catch((error) => {
        console.error("Status update failed:", error);
        swal("Error", `Failed to ${actionText} schedule`, "error");
      });
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setRemarks("");
    setStatusAction("");
    setShowModal(true);
    setEnableEdit(false);
  };

  const reloadTable = () => {
    setPaginationUrl(
      `${BASE_URL}/ScheduleList/fetchScheduleList?t=${Date.now()}`
    );
    if (pagination.refreshData) {
      pagination.refreshData();
    }
  };

  const [expandedRows, setExpandedRows] = useState({});
  const [productLists, setProductLists] = useState({});

  const toggleRowExpand = async (scheduleInvoiceId, rowId, scheduleId) => {
    const newExpandedState = { ...expandedRows };
    newExpandedState[rowId] = !newExpandedState[rowId];

    if (newExpandedState[rowId] && !productLists[scheduleInvoiceId]) {
      try {
        console.log("Fetching products for:", {
          scheduleInvoiceId,
          scheduleId,
          formDataId: formData.id,
        });

        const response = await axios.get(
          `${BASE_URL}/ScheduleList/getScheduleProducts/${scheduleInvoiceId}`,
          {
            params: {
              schedule_id: scheduleId, // Make sure this matches the backend expectation
            },
          }
        );

        setProductLists((prev) => ({
          ...prev,
          [scheduleInvoiceId]: response.data.data || [],
        }));
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to load product list", "error");
      }
    }

    setExpandedRows(newExpandedState);
  };

  // for timeline tracking
  const [timeline, setTimeline] = useState([]);

  const scheduleId = formData?.id;

  const fetchTimeline = async () => {
    if (!scheduleId) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/ScheduleList/getScheduleTimeline/${scheduleId}`
      );

      if (response.data && Array.isArray(response.data)) {
        setTimeline(response.data);
      } else {
        console.warn("Invalid timeline response format:", response.data);
        setTimeline([]);
      }
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
      setTimeline([]);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [scheduleId]);

  const ModalTracking = () => (
    <div className="container-fluid px-2">
      <div className="border ps-3 py-2 scheduleTrackingTimeline scrollable-contents">
        {timeline.map((item, index) => {
          let markerClass = "bg-primary";

          if (item.title?.includes("Partial-Deliver")) {
            markerClass = "bg-warning";
          } else if (item.title?.includes("Re-schedule")) {
            markerClass = "bg-reschedule";
          } else if (item.title?.includes("Declined")) {
            markerClass = "bg-danger";
          } else if (item.title?.includes("Delivered")) {
            markerClass = "bg-success";
          }

          return (
            <div key={index} className="position-relative mb-4">
              <span
                className={`timeline-marker ${markerClass} rounded-circle`}
              />
              <div className="ms-4">
                <div className="fw-bold">{item.title}</div>
                <small className="text-muted" style={{ fontSize: "12px" }}>
                  {dayjs(item.delivered_date).format("MMM DD, YYYY h:mm A")}
                </small>
                <p className="mb-0">
                  {item.remarks}
                  {item.title === "Approved" && item.sd_created_by
                    ? ` ${item.sd_created_by.fname} ${item.sd_created_by.lname}`
                    : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInvoiceTable = () => (
    <table className="table table-hover" id="" style={{ fontSize: "13px" }}>
      <thead className="bg-light">
        <tr>
          <th
            className="text-center"
            style={{ backgroundColor: "#EBEFF4" }}
          ></th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Invoice Number
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Customer
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Address
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Ordered Weight (KG/s)
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Delivered Weight (KG/s)
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Returned Weight (KG/s)
          </th>
          <th className="text-center" style={{ backgroundColor: "#EBEFF4" }}>
            Weight to Deliver (KG/s)
          </th>
        </tr>
      </thead>
      <tbody>
        {modalInvoiceData.loading ? (
          <tr>
            <td colSpan="8" className="text-center py-4">
              Loading...
            </td>
          </tr>
        ) : modalInvoiceData.error ? (
          <tr>
            <td colSpan="8" className="text-center text-danger py-4">
              Error: {modalInvoiceData.error.message}
            </td>
          </tr>
        ) : editableInvoiceData.length === 0 ? (
          <tr>
            <td colSpan="8" className="text-center py-4">
              No invoices found
            </td>
          </tr>
        ) : (
          editableInvoiceData.map((invoice, index) => (
            <React.Fragment key={index}>
              <tr>
                <td>
                  <span
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      toggleRowExpand(
                        invoice.sales_invoice_id,
                        index,
                        formData.id // Make sure this is populated
                      )
                    }
                  >
                    {expandedRows[index] ? "▲" : "▼"}
                  </span>
                </td>
                <td className="text-center">
                  {invoice.sil_sales_invoice_id?.transaction_id || "---"}
                </td>
                <td className="text-center">
                  {invoice.sil_sales_invoice_id?.customer?.company_name ||
                    "---"}
                </td>
                <td className="text-center">
                  {invoice.sil_sales_invoice_id?.customer?.company_address ||
                    "---"}
                </td>
                <td className="text-center">
                  {(invoice.ordered_weight || 0).toLocaleString("en-US")}
                </td>
                <td className="text-center">
                  {(invoice.delivered_quantity || 0).toLocaleString("en-US")}
                </td>
                <td className="text-center">
                  {(invoice.returned_weight || 0).toLocaleString("en-US")}
                </td>
                <td>
                  <Form.Control
                    type="text"
                    readOnly
                    value={formatWithCommas(
                      invoice.weight_to_deliver || "0.00"
                    )}
                    className={`form-control-sm border-0 bg-transparent fs-6 no-action ${
                      (!invoice.weight_to_deliver ||
                        parseFloat(invoice.weight_to_deliver) <= 0) &&
                      statusAction === "delivered"
                        ? "text-danger"
                        : ""
                    } ${
                      // Add warning for invoice level as well
                      invoice.weight_to_deliver &&
                      parseFloat(invoice.weight_to_deliver) >
                        invoice.ordered_weight -
                          invoice.delivered_quantity +
                          invoice.returned_weight
                        ? "text-warning"
                        : ""
                    }`}
                    title={
                      invoice.weight_to_deliver &&
                      parseFloat(invoice.weight_to_deliver) >
                        invoice.ordered_weight -
                          invoice.delivered_quantity +
                          invoice.returned_weight
                        ? "Warning: Total quantity exceeds remaining amount"
                        : ""
                    }
                  />
                </td>
              </tr>
              {expandedRows[index] && (
                <tr>
                  <td colSpan="8">
                    <div className="p-3 bg-light">
                      {productLists[invoice.sales_invoice_id] ? (
                        <table
                          className="table table-sm"
                          style={{ fontSize: "13px" }}
                        >
                          <thead>
                            <tr>
                              <th className="text-center">Product Code</th>
                              <th className="text-center">Product Name</th>
                              <th className="text-center">
                                Ordered Weight (KG/s)
                              </th>
                              <th className="text-center">
                                Delivered Weight (KG/s)
                              </th>
                              <th className="text-center">
                                Returned Weight (KG/s)
                              </th>
                              <th className="text-center">
                                Weight to Deliver (KG/s)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {productLists[invoice.sales_invoice_id].map(
                              (product, productIndex) => (
                                <tr key={product.id}>
                                  <td className="text-center">
                                    {product.product_code}
                                  </td>
                                  <td className="text-center">
                                    {product.product_name}
                                  </td>
                                  <td className="text-center">
                                    {formatWithCommas(product.original_weight)}
                                  </td>
                                  <td className="text-center">
                                    {formatWithCommas(
                                      product.delivered_quantity
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {formatWithCommas(product.returned_weight)}
                                  </td>
                                  <td className="text-center">
                                    <Form.Control
                                      type="text"
                                      readOnly={!enableEdit}
                                      maxLength={15}
                                      value={
                                        // If we have a raw input value for this product, use it (no commas during typing)
                                        // Otherwise, use the formatted value (with commas when not typing)
                                        rawInputValues[
                                          `${invoice.sales_invoice_id}-${product.product_id}`
                                        ] !== undefined
                                          ? rawInputValues[
                                              `${invoice.sales_invoice_id}-${product.product_id}`
                                            ]
                                          : product.weight_to_delivered === ""
                                          ? ""
                                          : formatWithCommas(
                                              product.weight_to_delivered
                                            )
                                      }
                                      onChange={(e) => {
                                        let inputValue = e.target.value;

                                        // Allow only numbers and decimal point
                                        inputValue = inputValue.replace(
                                          /[^0-9.]/g,
                                          ""
                                        );

                                        // Ensure only one decimal point
                                        const parts = inputValue.split(".");
                                        if (parts.length > 2) {
                                          inputValue =
                                            parts[0] +
                                            "." +
                                            parts.slice(1).join("");
                                        }

                                        // Limit decimal places to 2 if needed (optional)
                                        if (
                                          parts.length === 2 &&
                                          parts[1].length > 2
                                        ) {
                                          inputValue =
                                            parts[0] +
                                            "." +
                                            parts[1].substring(0, 2);
                                        }

                                        // Store the raw input value for display (no commas during typing)
                                        setRawInputValues((prev) => ({
                                          ...prev,
                                          [`${invoice.sales_invoice_id}-${product.product_id}`]:
                                            inputValue,
                                        }));

                                        // Update the actual data state
                                        const newProductLists = {
                                          ...productLists,
                                        };
                                        newProductLists[
                                          invoice.sales_invoice_id
                                        ][productIndex].weight_to_delivered =
                                          inputValue;
                                        setProductLists(newProductLists);

                                        // Recalculate totals with decimal support
                                        updateTotalsWithDecimals(
                                          newProductLists,
                                          index
                                        );
                                      }}
                                      onBlur={(e) => {
                                        const raw = e.target.value;

                                        // Clear the raw input value on blur
                                        setRawInputValues((prev) => {
                                          const newValues = { ...prev };
                                          delete newValues[
                                            `${invoice.sales_invoice_id}-${product.product_id}`
                                          ];
                                          return newValues;
                                        });

                                        // If the value is just a decimal point or ends with decimal point, treat it as empty
                                        if (raw === "." || raw.endsWith(".")) {
                                          const cleanValue = raw.replace(
                                            /\.$/,
                                            ""
                                          );
                                          if (cleanValue === "") {
                                            const newProductLists = {
                                              ...productLists,
                                            };
                                            newProductLists[
                                              invoice.sales_invoice_id
                                            ][
                                              productIndex
                                            ].weight_to_delivered = "";
                                            setProductLists(newProductLists);
                                            updateTotalsWithDecimals(
                                              newProductLists,
                                              index
                                            );
                                            return;
                                          } else if (!isNaN(cleanValue)) {
                                            const numericValue =
                                              parseFloat(cleanValue);
                                            const newProductLists = {
                                              ...productLists,
                                            };
                                            newProductLists[
                                              invoice.sales_invoice_id
                                            ][
                                              productIndex
                                            ].weight_to_delivered =
                                              numericValue.toFixed(2);
                                            setProductLists(newProductLists);
                                            updateTotalsWithDecimals(
                                              newProductLists,
                                              index
                                            );
                                            return;
                                          }
                                        }

                                        // If we have a valid number, format it in state
                                        if (raw !== "" && !isNaN(raw)) {
                                          const numericValue = parseFloat(raw);
                                          const newProductLists = {
                                            ...productLists,
                                          };
                                          newProductLists[
                                            invoice.sales_invoice_id
                                          ][productIndex].weight_to_delivered =
                                            numericValue.toFixed(2);
                                          setProductLists(newProductLists);
                                          updateTotalsWithDecimals(
                                            newProductLists,
                                            index
                                          );
                                        } else if (raw === "") {
                                          // Handle empty value
                                          const newProductLists = {
                                            ...productLists,
                                          };
                                          newProductLists[
                                            invoice.sales_invoice_id
                                          ][productIndex].weight_to_delivered =
                                            "";
                                          setProductLists(newProductLists);
                                          updateTotalsWithDecimals(
                                            newProductLists,
                                            index
                                          );
                                        }
                                      }}
                                      className={`form-control-sm fs7 ${
                                        !enableEdit
                                          ? "border-0 bg-transparent"
                                          : ""
                                      } ${
                                        // Add warning color when value exceeds maximum (for visual indicator only)
                                        enableEdit &&
                                        product.weight_to_delivered &&
                                        parseFloat(
                                          product.weight_to_delivered
                                        ) >
                                          product.original_weight -
                                            product.delivered_quantity +
                                            product.returned_weight
                                          ? "text-warning"
                                          : ""
                                      }`}
                                      title={
                                        // Add tooltip warning
                                        enableEdit &&
                                        product.weight_to_delivered &&
                                        parseFloat(
                                          product.weight_to_delivered
                                        ) >
                                          product.original_weight -
                                            product.delivered_quantity +
                                            product.returned_weight
                                          ? "Warning: Quantity exceeds remaining amount"
                                          : ""
                                      }
                                    />
                                    {enableEdit && (
                                      <div className="text-muted small mt-1">
                                        <span
                                          className={
                                            // Add warning color to remaining text as well
                                            product.weight_to_delivered &&
                                            parseFloat(
                                              product.weight_to_delivered
                                            ) >
                                              product.original_weight -
                                                product.delivered_quantity +
                                                product.returned_weight
                                              ? "text-warning"
                                              : ""
                                          }
                                        >
                                          Remaining:{" "}
                                          {formatWithCommas(
                                            (
                                              product.original_weight -
                                              product.delivered_quantity +
                                              product.returned_weight
                                            ).toFixed(2)
                                          )}{" "}
                                          (KG/s)
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                            <tr>
                              <td colSpan="5" className="text-end fw-bold">
                                Total:
                              </td>
                              <td className="fw-bold">
                                {formatWithCommas(
                                  productLists[invoice.sales_invoice_id]
                                    .reduce(
                                      (sum, product) =>
                                        sum +
                                        (parseFloat(
                                          product.weight_to_delivered
                                        ) || 0),
                                      0
                                    )
                                    .toFixed(2) // Ensure 2 decimal places in total
                                )}{" "}
                                (KG/s)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center">
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))
        )}
      </tbody>
    </table>
  );

  const renderEditableFields = () => {
    // Calculate total weight from all invoices
    const calculateTotalWeight = () => {
      const total = editableInvoiceData.reduce((sum, invoice) => {
        return sum + (parseFloat(invoice.weight_to_deliver) || 0);
      }, 0);
      return formatWithCommas(total.toFixed(2));
    };

    // Get today's date for min attribute
    const today = new Date().toISOString().split("T")[0];
    const minDate =
      enableEdit && formData.originalDeliveryDate
        ? formData.originalDeliveryDate
        : today;

    return (
      <div className="row" style={{ minHeight: "150px" }}>
        <div className="col-md-6 d-flex flex-column h-100">
          <Form.Group className="mb-3" controlId="totalQuantity">
            <Form.Label>Total weight to be deliver</Form.Label>
            <Form.Control type="text" value={calculateTotalWeight()} readOnly />
          </Form.Group>
          <Form.Group className="mb-3" controlId="driver">
            <Form.Label>Driver</Form.Label>
            <Form.Control
              type="text"
              value={formData.driver || ""}
              readOnly={!enableEdit}
              onChange={(e) =>
                setFormData({ ...formData, driver: e.target.value })
              }
              placeholder="Enter driver name"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="status">
            <Form.Label>Status</Form.Label>
            <Form.Control type="text" value={formData.status || ""} readOnly />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group className="mb-3" controlId="deliveryDate">
            <Form.Label>Delivery Date</Form.Label>
            <Form.Control
              type="date"
              readOnly={!enableEdit}
              value={formData.deliveryDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, deliveryDate: e.target.value })
              }
              // Disable dates before minDate
              min={minDate}
            />
            {/* {enableEdit && formData.originalDeliveryDate && (
              <Form.Text className="text-muted">
                Cannot select dates before{" "}
                {moment(formData.originalDeliveryDate).format("MMM DD, YYYY")}
              </Form.Text>
            )} */}
          </Form.Group>
          <Form.Group className="mb-3" controlId="porters">
            <Form.Label>Pahinante</Form.Label>
            <Form.Control
              type="text"
              value={formData.porters || ""}
              readOnly={!enableEdit}
              onChange={(e) =>
                setFormData({ ...formData, porters: e.target.value })
              }
              placeholder="Enter pahinante(s) name"
            />
          </Form.Group>
          <Form.Group className="" controlId="remarks">
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              style={{
                height: "calc(86.5% - 20px)",
                minHeight: "100px",
              }}
              value={formData.remarks || ""}
              placeholder="Remarks"
              readOnly={!enableEdit}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </Form.Group>
        </div>
      </div>
    );
  };

  // const renderDeliveryDateField = () => (
  //   <Form.Group className="mb-3" controlId="deliveryDate">
  //     <Form.Label>Delivery Date</Form.Label>
  //     <Form.Control
  //       type="date"
  //       readOnly={!enableEdit}
  //       value={formData.deliveryDate || ""}
  //       onChange={(e) =>
  //         setFormData({ ...formData, deliveryDate: e.target.value })
  //       }
  //     />
  //   </Form.Group>
  // );

  const renderScheduleName = () => (
    <Form.Group className="mb-3" controlId="deliveryDate">
      <Form.Label>Schedule Name</Form.Label>
      <Form.Control
        type="text"
        readOnly={!enableEdit}
        value={formData.scheduleName || ""}
        onChange={(e) =>
          setFormData({ ...formData, scheduleName: e.target.value })
        }
      />
    </Form.Group>
  );

  const ModalFooter = () => (
    <Modal.Footer>
      {isRowForApproval && (
        <>
          {!enableEdit ? (
            <Button variant="primary" onClick={handleEdit}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </>
          )}
          <Button
            variant="danger"
            onClick={() => handleStatusActionClick("decline")}
          >
            Decline
          </Button>
          <Button
            variant="success"
            onClick={() => handleStatusActionClick("approve")}
          >
            Approve
          </Button>
        </>
      )}

      {(formData.status === "Partial-Deliver" ||
        formData.status === "Re-schedule" ||
        formData.status === "On-Schedule") && (
        <>
          {!enableEdit ? (
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
              <Button variant="outline-primary" onClick={handleSave}>
                Save
              </Button>
            </>
          )}
          <Button
            variant="primary"
            disabled={enableEdit}
            onClick={() => handleStatusActionClick("delivered")}
          >
            Delivered
          </Button>
        </>
      )}
      {/* <Button variant="secondary" onClick={handleClose}>
        Close
      </Button> */}
    </Modal.Footer>
  );
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/delivery-management/schedule")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">SCHEDULE LIST</span>
          </span>
        </div>
      </div>
      <div className="container-fluid mt-3">
        <div className="row align-items-end">
          <div className="col-sm mb-3">
            <label htmlFor="status">Status</label>
            <select
              name="status"
              id="status"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="For-Approval">For Approval</option>
              <option value="On-Schedule">On-Schedule</option>
              <option value="Re-schedule">Re-schedule</option>
              <option value="Partial Deliver">Partial Deliver</option>
              <option value="Delivered">Delivered</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="dateRequested">Date Requested</label>
            <input
              type="date"
              className="form-control"
              id="dateRequested"
              name="dateRequested"
              value={filterDateRequested}
              onChange={(e) => setFilterDateRequested(e.target.value)}
            />
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="dateRequested">Delivery Date</label>
            <input
              type="date"
              className="form-control"
              id="deliveryDate"
              name="deliveryDate"
              value={filterDeliveryDate}
              onChange={(e) => setFilterDeliveryDate(e.target.value)}
            />
          </div>
          <div className="col-sm mb-3 d-flex align-items-end gap-2">
            <button
              type="button"
              className="btn btn-dark"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleFilter}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-light border"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
          <div className="col-sm mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={`Search by ${searchFieldOptions[
                  searchField
                ].toLowerCase()}`}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {Object.entries(searchFieldOptions).map(([key, value]) => (
                  <li key={key}>
                    <button
                      className={`dropdown-item ${
                        searchField === key ? "active" : ""
                      }`}
                      onClick={() => {
                        handleSearchCategoryChange(key);
                      }}
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid mt-3">
        <div className="table-responsive data-table scrollable-contents">
          <table
            className="table table-hover table-responsive"
            style={{ fontSize: "14px" }}
          >
            <thead className="bg-light">
              <tr>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  SCHEDULE CODE
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  SCHEDULE NAME
                  <i className="fas fa-sort ms-1"></i>
                </th>

                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  APPROVED BY
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  WEIGHT (KG/s)
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  DELIVERED WEIGHT (KG/s)
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  DATE REQUESTED
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  DELIVERY DATE
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th className="" style={{ backgroundColor: "#EBEFF4" }}>
                  STATUS
                  <i className="fas fa-sort ms-1"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
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
                  <td colSpan="9" className="text-center text-danger py-4">
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
                  <td colSpan="9" className="text-center py-4">
                    <div className="d-flex flex-column align-items-center">
                      <span>No data available</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.data.map((item, index) => {
                  const approver = item?.sm_approved_by
                    ? `${item.sm_approved_by.fname} ${item.sm_approved_by.lname}`
                    : "---";

                  return (
                    <tr
                      key={index}
                      onClick={() => handleRowClick(item.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="">{item?.schedule_code}</td>
                      <td className="">{item?.title}</td>
                      <td className="">{approver}</td>
                      <td className="">
                        {formatWithCommas(
                          item.sil_schedule_id
                            .map((entry) => entry.ordered_weight)
                            .filter(Boolean)
                            .reduce((acc, cur) => acc + parseFloat(cur || 0), 0)
                            .toFixed(2)
                        )}
                      </td>
                      <td className="">
                        {formatWithCommas(
                          item.sil_schedule_id
                            .map(
                              (entry) =>
                                entry.delivered_weight ||
                                entry.delivered_quantity ||
                                0
                            )
                            .filter(Boolean)
                            .reduce((acc, cur) => acc + parseFloat(cur), 0)
                            .toFixed(2)
                        )}
                      </td>

                      <td className="">
                        {moment(item.createdAt).format("MMM DD, YYYY")}
                      </td>
                      <td className="">
                        {moment(item.delivery_date).format("MMM DD, YYYY")}
                      </td>
                      <td
                        className=""
                        style={{
                          color:
                            item.status === "Delivered"
                              ? "#82e885"
                              : item.status === "Declined"
                              ? "#e88282"
                              : item.status === "For-Approval"
                              ? "#20a7db"
                              : item.status === "Partial-Deliver"
                              ? "#c3c340"
                              : item.status === "On-Schedule"
                              ? "#480097"
                              : item.status === "Re-schedule"
                              ? "#df6100ff"
                              : "transparent",
                          fontWeight: 500,
                        }}
                      >
                        {item.status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!pagination.loading &&
          !pagination.error &&
          pagination.data.length > 0 && <PaginationControls {...pagination} />}
      </div>

      <Modal
        size="xl"
        backdrop="static"
        show={showModal}
        onHide={() => {
          if (enableEdit) {
            handleCancelEdit();
          } else {
            handleClose();
          }
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>SCHEDULE DETAILS</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="container-fluid mb-3">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="scheduleId">
                    <Form.Label>Schedule Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.scheduleId || ""}
                      readOnly
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">{renderScheduleName()}</div>
                {/* <div className="col-md-6">{renderDeliveryDateField()}</div> */}
              </div>

              {renderEditableFields()}
            </div>

            {ModalTracking()}

            <div className="container-fluid mt-3">
              <h5>Invoice List</h5>
              <div className="table-responsive data-table scrollable-contents">
                {renderInvoiceTable()}
              </div>
              {!modalPagination.loading &&
                !modalPagination.error &&
                modalPagination.data.length > 0 && (
                  <PaginationControls {...modalPagination} />
                )}
            </div>
          </Form>
        </Modal.Body>
        <ModalFooter />
      </Modal>

      <Modal
        show={showStatusModal}
        onHide={handleStatusModalClose}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6">Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="statusRemarks">
            <h6>
              Are you sure you want to{" "}
              {statusAction === "approve"
                ? "approve"
                : statusAction === "decline"
                ? "decline"
                : "mark as delivered"}{" "}
              this schedule?
            </h6>
            <Form.Control
              className="mt-3"
              as="textarea"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleStatusModalClose}>
            Cancel
          </Button>
          <Button
            variant={
              statusAction === "approve"
                ? "success"
                : statusAction === "decline"
                ? "danger"
                : "primary"
            }
            onClick={handleStatusSubmit}
          >
            {statusAction === "approve"
              ? "Approve"
              : statusAction === "decline"
              ? "Decline"
              : "Delivered"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScheduleList;
