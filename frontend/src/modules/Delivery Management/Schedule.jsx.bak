import { React, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Card } from "react-bootstrap";
import swal from "sweetalert";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";

import "@schedule-x/theme-default/dist/index.css";
import dayjs from "dayjs";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useSort } from "../../hooks/customHook/tableSort"; // adjust path accordingly
import axios from "axios";

import "../../assets/css/lionchem.css";
import "../../assets/css/style.css";

const eventsServicePlugin = createEventsServicePlugin();
function getEvents(scheduleData) {
  const events = scheduleData.map((data) => ({
    id: data.id.toString(),
    title: data.title,
    start: dayjs(data.delivery_date).format("YYYY-MM-DD"),
    end: dayjs(data.delivery_date).format("YYYY-MM-DD"),
    status: data.status,
    schedule_code: data.schedule_code,
    batch_transcation_number:
      data?.sil_schedule_id?.[0]?.sil_batch_entry_id?.batch_transaction_number,
    customer_company_name:
      data?.sil_schedule_id?.[0]?.sil_sales_invoice_id?.customer?.company_name,
  }));
  const updatedEvents = events.map((event) => {
    const lowerStatus = event.status.toLowerCase().replace(" ", "-");
    const dateToDeliver = dayjs(event.end);

    const startOfCurrentWeek = dayjs().startOf("week");
    const endOfCurrentWeek = dayjs().endOf("week");
    const startOfNextWeek = dayjs().startOf("week").add(1, "week");
    const endOfNextWeek = dayjs().endOf("week").add(1, "week");

    let scheduled = "";

    if (
      dateToDeliver.isBetween(startOfCurrentWeek, endOfCurrentWeek, "day", "[]")
    ) {
      scheduled = "this-week";
    } else if (
      dateToDeliver.isBetween(startOfNextWeek, endOfNextWeek, "day", "[]")
    ) {
      scheduled = "next-week";
    } else if (dateToDeliver.isAfter(endOfNextWeek)) {
      scheduled = "upcoming-week";
    }

    const additionalClasses = [];

    if (lowerStatus === "for-approval") {
      // Only use scheduled class
      additionalClasses.push(`scheduled-${scheduled}`);
    } else {
      // Use only status class
      additionalClasses.push(`status-${lowerStatus}`);
    }

    return {
      ...event,
      status: lowerStatus,
      _options: {
        additionalClasses,
      },
    };
  });

  return updatedEvents;
}

const Schedule = ({ authrztn }) => {
  // Refs and state
  const calendarRef = useRef(null);
  const eventsServiceRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [getSchedule, setGetSchedule] = useState([]);
  const userLoggedID = useDecodeToken();

  // Initialize calendar with empty events
  const calendar = useCalendarApp({
    firstDayOfWeek: 0,
    defaultView: "week",
    views: [createViewMonthGrid(), createViewMonthAgenda()],
    events: [],
    plugins: [eventsServicePlugin],
  });

  // Store calendar and events service in refs
  useEffect(() => {
    if (calendar && !calendarRef.current) {
      calendarRef.current = calendar;
      eventsServiceRef.current = eventsServicePlugin;
    }
  }, [calendar]);

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/ScheduleList/fetchData`);
        if (response.data.success) {
          setGetSchedule(response.data.data);
          setEvents(getEvents(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        swal("Error", "Failed to load schedule data", "error");
      }
    };
    fetchSchedule();
  }, []);

  // Effect to update calendar events
  useEffect(() => {
    if (!eventsServiceRef.current || events.length === 0) return;

    try {
      const currentEvents = eventsServiceRef.current.getAll();
      const existingEventIds = new Set(currentEvents.map((e) => e.id));
      const newEventIds = new Set(events.map((e) => e.id));

      // Remove old events
      currentEvents.forEach((event) => {
        if (!newEventIds.has(event.id)) {
          eventsServiceRef.current.remove(event.id);
        }
      });

      // Add new events
      events.forEach((event) => {
        if (!existingEventIds.has(event.id)) {
          eventsServiceRef.current.add(event);
        }
      });
    } catch (error) {
      console.error("Error updating calendar events:", error);
    }
  }, [events]);

  // 5. Add debug logging
  useEffect(() => {
    console.log("Current events in state:", events);
    if (eventsServiceRef.current) {
      console.log(
        "Current events in calendar:",
        eventsServiceRef.current.getAll()
      );
    }
  }, [events]);

  // const events = getEvents(getSchedule);
  const getThisWeeksEvents = () => {
    const startOfWeek = dayjs().startOf("week");
    const endOfWeek = dayjs().endOf("week");
    return events.filter((event) => {
      return dayjs(event.end).isBetween(startOfWeek, endOfWeek, "day", "[]");
    });
  };

  const getNextWeeksEvents = () => {
    const startOfNextWeek = dayjs().startOf("week").add(1, "week");
    const endOfNextWeek = dayjs().endOf("week").add(1, "week");
    return events.filter((event) => {
      return dayjs(event.end).isBetween(
        startOfNextWeek,
        endOfNextWeek,
        "day",
        "[]"
      );
    });
  };

  const thisWeeksEvents = getThisWeeksEvents();
  const nextWeeksEvents = getNextWeeksEvents();

  // const eventsForDisplay = eventsService.getAll();

  // for creation
  // Add this state for delivery date
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    deliveryDate: false,
    scheduleTitle: false,
    quantityToDeliver: {},
  });

  // formats
  // Utility function to format number with commas
  const formatNumberWithCommas = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    // Remove all non-digit characters first (in case it's called with a formatted value)
    const numString = value.toString().replace(/\D/g, "");
    // Format with commas if not empty
    return numString === "" ? "" : parseInt(numString, 10).toLocaleString();
  };

  const parseFormattedNumber = (formattedValue) => {
    if (
      formattedValue === "" ||
      formattedValue === null ||
      formattedValue === undefined
    )
      return "";
    return formattedValue.toString().replace(/,/g, "");
  };

  // Modify the quantityToDeliver input to be editable
  const handleQuantityChange = (id, formattedValue) => {
    // First parse the formatted value back to raw number
    const rawValue = parseFormattedNumber(formattedValue);

    // Then apply your existing validation logic
    const row = rows.find((r) => r.id === id);
    const totalOrdered = Number(parseFormattedNumber(row.totalOrdered)) || 0;

    // Allow empty string or valid number
    const newQuantity =
      rawValue === "" ? "" : Math.min(Number(rawValue), totalOrdered);

    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            quantityToDeliver: newQuantity === "" ? "" : newQuantity.toString(),
          };
        }
        return row;
      })
    );
  };

  const navigate = useNavigate();
  // State variables
  const [showModal, setShowModal] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  const [scheduleID, setScheduleID] = useState("");
  const [totalQty, setTotalQty] = useState(0);
  const [deliveryReceipts, setDeliveryReceipts] = useState([
    "DELIVERY-1",
    "DELIVERY-2",
    "DELIVERY-3",
    // Add more as needed or fetch from API
  ]);

  // Table rows state
  const [rows, setRows] = useState([
    {
      id: 1,
      invoiceId: "",
      transactionId: "",
      customerName: "",
      location: "",
      contactNo: "",
      totalOrdered: "",
      quantityToDeliver: "",
      isSelected: false,
    },
  ]);

  // Calculate total quantity whenever rows change
  useEffect(() => {
    const newTotal = rows.reduce((sum, row) => {
      return sum + (Number(parseFormattedNumber(row.quantityToDeliver)) || 0);
    }, 0);
    setTotalQty(newTotal);
  }, [rows]);

  // Function to handle input changes
  const handleInputChange = (id, field, value) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  // Function to generate SCHDL ID
  const generateScheduleID = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    const generatedScheduleID = `SCHDL-${datetimeStr}${randomNum}`;
    setScheduleID(generatedScheduleID);
  };

  const handleShowModal = () => {
    setShowModal(true);
    generateScheduleID();
  };

  // const addEventToolTip = () => {
  //   // built-in class for events ng calendar library
  //   const eventDivs = document.querySelectorAll(".sx__month-grid-event");

  //   eventDivs.forEach((event) => {
  //     // data-event-id na built in sa library na sineset depende sa iseset mo na ID sa particular event
  //     const eventId = event?.dataset.eventId;

  //     // dito hahanapin yung event na need para makuha yung SCHID
  //     const foundEvent = events?.find((e) => e.id === eventId);

  //     event.setAttribute("data-bs-toggle", "tooltip");
  //     event.setAttribute("data-bs-placement", "top");

  //     // pwede rin foundEvent.id if want SCHID yung lalabas sa tool tip pag hover
  //     event.setAttribute("title", foundEvent.title);
  //   });
  // };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     addEventToolTip();
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Fetch invoice dr on component mount
  const [invoices, setInvoices] = useState([]); // State for product list
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchInvoiceDR = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/ScheduleList/fetchInvoiceDR`
        );

        console.log("Raw API response:", response.data); // Debugging log

        // Transform the data to match what you need
        const transformedData = response.data.map((item) => {
          // Fallback values in case any data is missing
          const salesInvoice = item.sales_invoice || {};
          const customer = salesInvoice.customer || {};
          const batchEntryMain = item.batch_entry_main || {};
          const ppBatchEntry = batchEntryMain.pp_batch_entry_id?.[0] || {};

          return {
            invoice_id: salesInvoice.sales_invoice_id || "",
            transaction_id: salesInvoice.transaction_id || "",
            customerName: customer.company_name || "",
            location:
              customer.company_address || salesInvoice.destination || "",
            contactNo: customer.mobile_no || customer.telephone_no || "",
            totalOrdered: (
              salesInvoice.total_ordered ||
              ppBatchEntry.total_quantity_ordered ||
              "0"
            )
              .toString()
              .replace(/,/g, ""),
            quantityToDeliver: (
              salesInvoice.total_ordered ||
              ppBatchEntry.total_quantity_ordered ||
              "0"
            )
              .toString()
              .replace(/,/g, ""),
          };
        });

        setInvoices(transformedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        swal("Error", "Failed to fetch data: " + error.message, "error");
        setIsLoading(false);
      }
    };

    fetchInvoiceDR();
  }, []);

  // Function to add a new row
  const addNewRow = () => {
    const newId =
      rows.length > 0 ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([
      ...rows,
      {
        id: newId,
        invoiceId: "",
        transactionId: "",
        customerName: "",
        location: "",
        contactNo: "",
        totalOrdered: "",
        quantityToDeliver: "",
        isSelected: false, // Track if product is selected
      },
    ]);
  };

  // Function to delete a row
  const deleteRow = (id) => {
    if (rows.length <= 1) {
      swal("Warning", "You must have at least one item", "warning");
      return;
    }

    // Update expandedRows state to remove the deleted row's expansion state
    setExpandedRows((prev) => {
      const newExpanded = { ...prev };
      delete newExpanded[id];
      return newExpanded;
    });

    // Find the row being deleted
    const deletedRow = rows.find((row) => row.id === id);

    // If the row had a product selected, we need to update state
    if (deletedRow && deletedRow.invoiceId) {
      setRows(rows.filter((row) => row.id !== id));
    } else {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  // Handle product selection change
  const handleInvoiceChange = (id, invoiceId) => {
    const selectedInvoice = invoices.find(
      (invoice) => invoice.invoice_id === invoiceId
    );

    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            invoiceId: invoiceId,
            transactionId: selectedInvoice?.transaction_id || "",
            customerName: selectedInvoice?.customerName || "",
            location: selectedInvoice?.location || "",
            contactNo: selectedInvoice?.contactNo || "",
            totalOrdered: selectedInvoice?.totalOrdered || "",
            quantityToDeliver: "",
            isSelected: !!selectedInvoice,
          };
        }
        return row;
      })
    );
  };

  // Add this function to filter available invoices
  const getAvailableInvoice = (currentRowId) => {
    // Get all invoice IDs that are selected in other rows
    const selectedInvoiceIds = rows
      .filter((row) => row.id !== currentRowId && row.invoiceId)
      .map((row) => row.invoiceId);

    // Filter out invoices that are already selected in other rows
    return invoices.filter(
      (invoice) => !selectedInvoiceIds.includes(invoice.invoice_id)
    );
  };

  const handeCloseModal = () => {
    setShowModal(false);
    setScheduleID("");
    setTotalQty(0);
    setDeliveryDate("");
    setRemarks("");
    setScheduleTitle("");
    setRows([
      {
        id: 1,
        invoiceId: "",
        transactionId: "",
        customerName: "",
        location: "",
        contactNo: "",
        totalOrdered: "",
        quantityToDeliver: "",
        isSelected: false,
      },
    ]);
    // Reset validation errors
    setValidationErrors({
      deliveryDate: false,
      scheduleTitle: false,
      quantityToDeliver: {},
    });

    setExpandedRows(false);
    setProductLists({});
    setIsSubmit(false);
  };

  // fetch the data
  const fetchScheduleData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/ScheduleList/fetchData`);
      if (response.data.success) {
        setGetSchedule(response.data.data);
        setEvents(getEvents(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
      swal("Error", "Failed to load schedule data", "error");
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmit(true);
    // Reset validation errors
    const newValidationErrors = {
      deliveryDate: !deliveryDate,
      scheduleTitle: !scheduleTitle, // Add this if scheduleTitle is required
      quantityToDeliver: {},
    };

    // Check quantity fields
    let hasQuantityErrors = false;
    rows.forEach((row) => {
      const isEmpty = !row.quantityToDeliver || row.quantityToDeliver === "";
      newValidationErrors.quantityToDeliver[row.id] = isEmpty;
      if (isEmpty) hasQuantityErrors = true;
    });

    setValidationErrors(newValidationErrors);

    // Validate required fields
    if (!scheduleTitle) {
      swal("Warning", "Please enter a schedule name", "warning").then(() => {
        setIsSubmit(false);
      });
      return;
    }

    if (!deliveryDate) {
      document
        .getElementById("deliveryDate")
        ?.scrollIntoView({ behavior: "smooth" });
      swal("Warning", "Please select a delivery date", "warning").then(() => {
        setIsSubmit(false);
      });
      return;
    }

    if (rows.some((row) => !row.invoiceId)) {
      swal("Warning", "Please select an invoice for all items", "warning").then(
        () => {
          setIsSubmit(false);
        }
      );
      return;
    }

    if (totalQty <= 0) {
      swal("Warning", "Total quantity must be greater than 0", "warning").then(
        () => {
          setIsSubmit(false);
        }
      );
      return;
    }

    // Prepare data for confirmation
    const submissionData = {
      scheduleID,
      scheduleTitle,
      deliveryDate,
      remarks,
      totalQty: totalQty,
      createdBy: userLoggedID,
      items: rows.map((row) => ({
        invoiceId: row.invoiceId,
        transactionId: row.transactionId,
        customerName: row.customerName,
        quantityToDeliver: row.quantityToDeliver,
        totalOrdered: row.totalOrdered,
        products: row.invoiceId
          ? productLists[row.invoiceId]?.map((product) => ({
              productId: product.product_id,
              productCode: product.product_code,
              quantity: product.quantity,
              quantityToDeliver: product.quantityToDeliver,
            }))
          : [],
      })),
    };

    // Show confirmation dialog
    swal({
      title: "Confirm Schedule",
      text: `Are you sure you want to create this schedule for ${dayjs(
        deliveryDate
      ).format("MMM D, YYYY")} with ${totalQty} total quantity?`,
      icon: "warning",
      buttons: ["Cancel", "Submit"],
      dangerMode: true,
    }).then(async (willSubmit) => {
      if (willSubmit) {
        try {
          console.log("Submitting data:", submissionData);

          const response = await axios.post(
            `${BASE_URL}/ScheduleList/create`,
            submissionData
          );

          if (response.data.success) {
            swal({
              title: "Success!",
              text: "Purchase request created successfully",
              icon: "success",
              button: false,
              timer: 2500,
            }).then(() => {
              handeCloseModal();
              setIsSubmit(false);
              window.location.reload();
              // handeCloseModal();
              // fetchScheduleData();
            });
          } else {
            throw new Error(response.data.message || "Failed to create data");
          }
        } catch (error) {
          console.error("Error submitting schedule:", error);
          swal("Error", "Failed to create schedule: " + error.message, "error");
        }
      } else {
        setIsSubmit(false);
      }
    });
  };

  // for invoice tr product list
  const [expandedRows, setExpandedRows] = useState({});
  const [productLists, setProductLists] = useState({});

  // Function to toggle row expansion
  const toggleRowExpand = async (invoiceId, rowId) => {
    console.log("toggleRowExpand called with:", { invoiceId, rowId }); // Debug log

    if (!invoiceId) {
      swal("Warning", "Please select an invoice first", "warning");
      return;
    }

    const newExpandedState = { ...expandedRows };
    newExpandedState[rowId] = !newExpandedState[rowId];

    // Fetch products if not already loaded
    if (newExpandedState[rowId] && !productLists[invoiceId]) {
      try {
        console.log("Fetching products for invoice:", invoiceId); // Debug log
        const response = await axios.get(
          `${BASE_URL}/ScheduleList/fetchInvoiceDRProductList?sales_invoice_id=${invoiceId}`
        );

        console.log("Products API response:", response.data); // Debug log

        // Initialize quantities for each product
        const productsWithQtys = response.data.map((product) => ({
          ...product,
          quantityToDeliver: "", // Changed from product.quantity to empty string
        }));

        console.log("Processed products:", productsWithQtys); // Debug log

        setProductLists((prev) => ({
          ...prev,
          [invoiceId]: productsWithQtys,
        }));
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to load product list", "error");
      }
    }

    setExpandedRows(newExpandedState);
  };

  const handleExpandedQuantityChange = (invoiceId, productId, value) => {
    console.log("handleExpandedQuantityChange called with:", {
      invoiceId,
      productId,
      value,
      currentProductLists: productLists,
    }); // Debug log

    if (!invoiceId || !productId) {
      console.error("Missing invoiceId or productId", { invoiceId, productId });
      return;
    }

    // Parse the input value to get the raw number
    const rawValue = value === "" ? "" : value.replace(/\D/g, "");

    setProductLists((prev) => {
      const newProductLists = { ...prev };

      if (!newProductLists[invoiceId]) {
        console.error(`Invoice ${invoiceId} not found in productLists`);
        return prev;
      }

      console.log("Updating product quantity:", {
        invoiceId,
        productId,
        rawValue,
        products: newProductLists[invoiceId],
      }); // Debug log

      newProductLists[invoiceId] = newProductLists[invoiceId].map((product) => {
        if (product.product_id === productId) {
          // Changed from product.id to product.product_id
          // Get the max quantity for this product
          const maxQuantity = Number(product.quantity) || 0;
          // Calculate the new quantity, ensuring it doesn't exceed max
          const newQuantity =
            rawValue === "" ? "" : Math.min(Number(rawValue), maxQuantity);
          return {
            ...product,
            quantityToDeliver: newQuantity,
          };
        }
        return product;
      });

      // Update the row's total quantity
      updateRowQuantityFromExpanded(invoiceId, newProductLists);
      return newProductLists;
    });
  };

  const updateRowQuantityFromExpanded = (
    invoiceId,
    productListsToUse = productLists
  ) => {
    console.log("updateRowQuantityFromExpanded called with:", {
      invoiceId,
      productListsToUse,
    }); // Debug log

    if (!productListsToUse[invoiceId]) {
      console.error("No products found for invoice:", invoiceId);
      return;
    }

    const totalExpandedQty = productListsToUse[invoiceId].reduce(
      (sum, product) => sum + (Number(product.quantityToDeliver) || 0),
      0
    );

    console.log("Calculated total quantity:", totalExpandedQty); // Debug log

    setRows(
      rows.map((row) => {
        if (row.invoiceId === invoiceId) {
          return {
            ...row,
            quantityToDeliver: totalExpandedQty.toString(),
          };
        }
        return row;
      })
    );
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "completed") return "#82e885";
    if (lowerStatus === "rejected") return "#e88282";
    if (lowerStatus === "for-approval") return "#20a7db";
    if (lowerStatus === "partial-deliver") return "#c3c340";
    if (lowerStatus === "on-schedule") return "#480097";
    return "#6c757d"; // default color
  };

  // Helper function to format status display
  const formatStatusDisplay = (status) => {
    const statusMap = {
      completed: "Completed",
      rejected: "Rejected",
      "for-approval": "For Approval",
      "partial-deliver": "Partial Deliver",
      "on-schedule": "On Schedule",
    };

    const lowerStatus = status.toLowerCase();
    return statusMap[lowerStatus] || status;
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">SCHEDULING</span>
        </div>

        <div className="d-flex flex-row align-items-center justify-content-center gap-2">
          {/* Button to show schedule list */}
          <button
            className="d-flex align-items-center title-button"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#0d6efd",
              boxShadow: "none",
              padding: "0.375rem 0.75rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.querySelector("span").style.textDecoration =
                "underline";
            }}
            onMouseOut={(e) => {
              e.currentTarget.querySelector("span").style.textDecoration =
                "none";
            }}
            onClick={() => {
              navigate("/delivery-management/schedule-list");
            }}
          >
            <span style={{ color: "#0d6efd", marginLeft: 4 }}>
              Schedule List
            </span>
          </button>
          <button
            className="btn btn-primary d-flex align-items-center title-button"
            onClick={handleShowModal}
          >
            <i className="bx bx-plus fs-5"></i> Set Schedule
          </button>
        </div>
      </div>

      <div className="shadow">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>

      <div className="row mt-4 h-auto gap-2">
        <div
          className="col gap-2 container-fluid scrollable-contents w-100 mh-100"
          style={{ height: "780px" }}
        >
          <div className="w-100 h2 p-2 m-0">This Week</div>

          {events.length > 0 && (
            <div
              className="container-fluid scrollable-contents w-100 mh-100"
              style={{ height: "730px", overflowY: "scroll" }}
            >
              {getThisWeeksEvents().map((event) => (
                <Card key={event.id} className="my-4 shadow-sm">
                  <Card.Header as="h5" className="this-week-card-header">
                    <div className="d-flex justify-content-between">
                      <span>Schedule Code: {event.schedule_code}</span>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-1">
                    <div className="row">
                      <div className="col d-flex flex-column gap-1 text-muted">
                        <Card.Text className="m-0 px-2">
                          Customer: {event.customer_company_name}
                        </Card.Text>
                      </div>
                      <div className="col d-flex flex-column justify-content-end align-items-end gap-1 text-muted mb-1">
                        <Card.Text
                          className="m-0 px-2"
                          style={{
                            color: getStatusColor(event.status),
                            fontWeight: "bold",
                          }}
                        >
                          Status: {formatStatusDisplay(event.status)}
                        </Card.Text>
                      </div>
                    </div>
                    <div className="row mb-1">
                      <div className="col d-flex flex-column gap-1 text-muted">
                        <Card.Text className="m-0 px-2">
                          Schedule Name: {event.title}
                        </Card.Text>
                        <Card.Text className="m-0 px-2">
                          {dayjs(event.end).format("dddd")}
                        </Card.Text>
                      </div>
                      <div className="col d-flex flex-column justify-content-end align-items-end gap-1 text-muted">
                        <Card.Text className="m-0 px-2">
                          Batch No: {event.batch_transcation_number}
                        </Card.Text>
                        <Card.Text className="m-0 px-2">
                          Delivery Date:{" "}
                          {dayjs(event.end).format("MMM    D, YYYY")}
                        </Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* NEXT WEEK  */}
        <div
          className="col gap-2 container-fluid scrollable-contents w-100 mh-100"
          style={{ height: "780px" }}
        >
          <div className="w-100 h2 p-2 m-0">Next Week</div>

          {nextWeeksEvents.length > 0 && (
            <div
              className="container-fluid scrollable-contents w-100 mh-100"
              style={{ height: "730px", overflowY: "scroll" }}
            >
              {getNextWeeksEvents().map((event) => (
                <Card key={event.id} className="my-4 shadow-sm">
                  <Card.Header as="h5" className="next-week-card-header">
                    <div className="d-flex justify-content-between">
                      <span>Schedule Code: {event.schedule_code}</span>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-1">
                    <div className="row">
                      <div className="col d-flex flex-column gap-1 text-muted">
                        <Card.Text className="m-0 px-2">
                          Customer: {event.customer_company_name}
                        </Card.Text>
                      </div>
                      <div className="col d-flex flex-column justify-content-end align-items-end gap-1 text-muted mb-1">
                        <Card.Text
                          className="m-0 px-2"
                          style={{
                            color: getStatusColor(event.status),
                            fontWeight: "bold",
                          }}
                        >
                          Status: {formatStatusDisplay(event.status)}
                        </Card.Text>
                      </div>
                    </div>
                    <div className="row mb-1">
                      <div className="col d-flex flex-column gap-1 text-muted">
                        <Card.Text className="m-0 px-2 ">
                          Schedule Name: {event.title}
                        </Card.Text>
                        <Card.Text className="m-0 px-2">
                          {dayjs(event.end).format("dddd")}
                        </Card.Text>
                      </div>
                      <div className="col d-flex flex-column justify-content-end align-items-end gap-1 text-muted">
                        <Card.Text className="m-0 px-2">
                          Batch No: {event.batch_transcation_number}
                        </Card.Text>
                        <Card.Text className="m-0 px-2">
                          Delivery Date:{" "}
                          {dayjs(event.end).format("MMM    D, YYYY")}
                        </Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        size="xl"
        backdrop="static"
        show={showModal}
        onHide={handeCloseModal}
      >
        <Modal.Header closeButton>
          <Modal.Title>SCHEDULE DETAILS</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="scheduleId">
                    <Form.Label>Schedule Code</Form.Label>
                    <Form.Control type="text" value={scheduleID} readOnly />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="scheduleTitle">
                    <Form.Label>
                      Schedule Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="Enter Title"
                      value={scheduleTitle}
                      onChange={(e) => {
                        setScheduleTitle(e.target.value);
                        setValidationErrors((prev) => ({
                          ...prev,
                          scheduleTitle: false,
                        }));
                      }}
                      className={
                        validationErrors.scheduleTitle ? "is-invalid" : ""
                      }
                      style={
                        validationErrors.scheduleTitle
                          ? { borderColor: "red" }
                          : {}
                      }
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="deliveryDate">
                    <Form.Label>
                      Delivery Date <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        setValidationErrors((prev) => ({
                          ...prev,
                          deliveryDate: false,
                        }));
                      }}
                      min={dayjs().format("YYYY-MM-DD")}
                      className={
                        validationErrors.deliveryDate ? "is-invalid" : ""
                      }
                      style={
                        validationErrors.deliveryDate
                          ? { borderColor: "red" }
                          : {}
                      }
                    />
                    {/* {validationErrors.deliveryDate && (
                      <div
                        className="invalid-feedback"
                        style={{ color: "red" }}
                      >
                        Please select a delivery date
                      </div>
                    )} */}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="totalQuantity">
                    <Form.Label>Total Quantity</Form.Label>
                    <Form.Control
                      type="text"
                      value={formatNumberWithCommas(totalQty)}
                      placeholder="Enter Quantity"
                      readOnly
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3" controlId="remarks">
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6"></div>
              </div>
            </div>
            <div className="container-fluid mt-1">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted w-20 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      ></th>
                      <th
                        className="text-muted w-20 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Delivery Receipts
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted w-20 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Customer Name
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted w-25 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Location
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted w-15 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Contact No.
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted w-10 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Total Ordered
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted w-10 text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          cursor: "pointer",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center justify-content-center">
                          Quantity to Delivered
                          <span className="d-flex flex-column mx-2">
                            <i
                              className="fa-solid fa-chevron-up"
                              style={{ fontSize: 8 }}
                            ></i>
                            <i
                              className="fa-solid fa-chevron-down"
                              style={{ fontSize: 8 }}
                            ></i>
                          </span>
                        </div>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{
                          backgroundColor: "#EBEFF4",
                          padding: "0.3rem 0.5rem",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <>
                        <tr key={row.id} style={{ cursor: "pointer" }}>
                          <td>
                            <span
                              onClick={() =>
                                toggleRowExpand(row.invoiceId, row.id)
                              }
                              className={`btn btn-sm btn-outline-primary ${
                                !row.invoiceId ? "disabled" : ""
                              }`}
                              title={
                                !row.invoiceId ? "Select an invoice first" : ""
                              }
                            >
                              {expandedRows[row.id] ? "▲" : "▼"}
                            </span>
                          </td>
                          <td
                            style={{ width: "20%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            {isLoading ? (
                              <div className="text-center">
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <select
                                className="form-select"
                                value={row.invoiceId}
                                required
                                onChange={(e) =>
                                  handleInvoiceChange(row.id, e.target.value)
                                }
                              >
                                <option value="" disabled>
                                  Select Invoice
                                </option>
                                {getAvailableInvoice(row.id).map((invoice) => (
                                  <option
                                    key={invoice.invoice_id}
                                    value={invoice.invoice_id}
                                  >
                                    {invoice.transaction_id}
                                  </option>
                                ))}
                                {/* Show currently selected invoice even if it's selected elsewhere */}
                                {row.invoiceId &&
                                  !getAvailableInvoice(row.id).some(
                                    (inv) => inv.invoice_id === row.invoiceId
                                  ) && (
                                    <option value={row.invoiceId} disabled>
                                      {
                                        invoices.find(
                                          (inv) =>
                                            inv.invoice_id === row.invoiceId
                                        )?.transaction_id
                                      }{" "}
                                      -
                                      {
                                        invoices.find(
                                          (inv) =>
                                            inv.invoice_id === row.invoiceId
                                        )?.customerName
                                      }
                                    </option>
                                  )}
                              </select>
                            )}
                          </td>
                          <td
                            style={{ width: "20%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            <Form.Control
                              type="text"
                              value={row.customerName}
                              readOnly
                            />
                          </td>
                          <td
                            style={{ width: "25%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            <Form.Control
                              type="text"
                              value={row.location}
                              readOnly
                            />
                          </td>
                          <td
                            style={{ width: "15%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            <Form.Control
                              type="text"
                              value={row.contactNo}
                              readOnly
                            />
                          </td>
                          <td
                            style={{ width: "10%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            <Form.Control
                              type="text"
                              value={formatNumberWithCommas(row.totalOrdered)}
                              readOnly
                            />
                          </td>
                          <td
                            style={{ width: "10%", whiteSpace: "nowrap" }}
                            className="text-center"
                          >
                            <Form.Control
                              type="text"
                              value={formatNumberWithCommas(
                                row.quantityToDeliver
                              )}
                              readOnly
                              className={
                                validationErrors.quantityToDeliver[row.id]
                                  ? "is-invalid border-0 bg-transparent"
                                  : "border-0 bg-transparent"
                              }
                            />
                            {/* <Form.Control
                              type="text"
                              value={formatNumberWithCommas(
                                row.quantityToDeliver
                              )}
                              onChange={(e) => {
                                handleQuantityChange(row.id, e.target.value);
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  quantityToDeliver: {
                                    ...prev.quantityToDeliver,
                                    [row.id]: false,
                                  },
                                }));
                              }}
                              disabled={!row.invoiceId}
                              className={
                                validationErrors.quantityToDeliver[row.id]
                                  ? "is-invalid"
                                  : ""
                              }
                              style={
                                validationErrors.quantityToDeliver[row.id]
                                  ? { borderColor: "red" }
                                  : {}
                              }
                            />
                            {row.invoiceId && (
                              <small className="text-muted">
                                Max: {formatNumberWithCommas(row.totalOrdered)}
                              </small>
                            )}
                            {validationErrors.quantityToDeliver[row.id] && (
                              <div
                                className="invalid-feedback"
                                style={{ color: "red", fontSize: "0.8rem" }}
                              >
                                Quantity is required
                              </div>
                            )} */}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteRow(row.id)}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                        {/* Expanded product list row */}
                        {expandedRows[row.id] && (
                          <tr>
                            <td colSpan="8">
                              <div className="p-3 bg-light">
                                {productLists[row.invoiceId] ? (
                                  <table
                                    className="table table-sm"
                                    style={{ fontSize: "13px" }}
                                  >
                                    <thead>
                                      <tr>
                                        <th>Product Code</th>
                                        <th>Product Name</th>
                                        <th>Quantity</th>
                                        <th>Quantity to Deliver</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {productLists[row.invoiceId].map(
                                        (product) => (
                                          <tr key={product.id}>
                                            <td>{product.product_code}</td>
                                            <td>{product.product_name}</td>
                                            <td>
                                              <Form.Control
                                                type="text"
                                                value={formatNumberWithCommas(
                                                  product.quantity
                                                )}
                                                readOnly
                                                className="border-0 bg-transparent"
                                              />
                                            </td>
                                            <td>
                                              <Form.Control
                                                type="text"
                                                value={
                                                  product.quantityToDeliver ===
                                                  ""
                                                    ? ""
                                                    : formatNumberWithCommas(
                                                        product.quantityToDeliver
                                                      )
                                                }
                                                onChange={(e) => {
                                                  console.log(
                                                    "Quantity input changed:",
                                                    e.target.value
                                                  ); // Debug log
                                                  handleExpandedQuantityChange(
                                                    row.invoiceId,
                                                    product.product_id, // Changed from product.id to product.product_id
                                                    e.target.value
                                                  );
                                                }}
                                                className="form-control-sm"
                                                onFocus={(e) => {
                                                  // Show raw value when focused
                                                  if (
                                                    product.quantityToDeliver !==
                                                    ""
                                                  ) {
                                                    e.target.value =
                                                      product.quantityToDeliver;
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  // Show formatted value when blurred
                                                  if (
                                                    product.quantityToDeliver !==
                                                    ""
                                                  ) {
                                                    e.target.value =
                                                      formatNumberWithCommas(
                                                        product.quantityToDeliver
                                                      );
                                                  }
                                                }}
                                              />
                                              <small className="text-muted">
                                                Max:{" "}
                                                {formatNumberWithCommas(
                                                  product.quantity
                                                )}
                                              </small>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="text-center">
                                    <div
                                      className="spinner-border spinner-border-sm"
                                      role="status"
                                    >
                                      <span className="visually-hidden">
                                        Loading...
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="w-100 d-flex justify-content-end my-2">
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center "
                onClick={addNewRow}
              >
                <i className="bx bx-plus fs-5"></i> New Item
              </button>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handeCloseModal}>
            Cancel
          </Button>

          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmit}
          >
            {isSubmit ? "Submitting..." : "Submit"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Schedule;
