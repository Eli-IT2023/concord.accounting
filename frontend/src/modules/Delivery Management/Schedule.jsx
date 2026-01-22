import { React, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Card } from "react-bootstrap";
import swal from "sweetalert";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import Select from "react-select";
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

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

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

const Schedule = ({ authrztn, roleType, rbacUserRole }) => {
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
        eventsServiceRef.current.getAll(),
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
        "[]",
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
  const [driver, setDriver] = useState("");
  const [porters, setPorter] = useState("");
  const [remarks, setRemarks] = useState("");
  const [plateNo, setPlateNo] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    deliveryDate: false,
    scheduleTitle: false,
    quantityToDeliver: {},
  });

  // formats
  const formatNumberWithCommas = (value, isRawInput = false) => {
    if (value === "" || value === null || value === undefined) return "";

    // If it's a raw input (during typing), don't format with commas
    if (isRawInput) {
      return value;
    }

    let num = Number(value);
    if (isNaN(num)) return "";

    // If number has more than 2 decimals, round to 2
    const decimalPart = num.toString().split(".")[1];
    if (decimalPart && decimalPart.length > 2) {
      num = Math.round(num * 100) / 100;
    }

    const [intPart, decPart] = num.toString().split(".");

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
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
      }),
    );
  };

  // Optional: Add this function if you want to handle clearing of invoice selection
  const handleClearInvoice = (id) => {
    const updatedRows = rows.map((row) => {
      if (row.id === id) {
        return {
          ...row,
          invoiceId: "",
          transactionId: "",
          customerName: "",
          location: "",
          contactNo: "",
          totalOrdered: "",
          quantityToDeliver: "",
          isSelected: false,
        };
      }
      return row;
    });

    // Update rows state
    setRows(updatedRows);

    // Clear expanded state and product list for this row
    setExpandedRows((prev) => {
      const newExpanded = { ...prev };
      delete newExpanded[id];
      return newExpanded;
    });

    setProductLists((prev) => {
      const newProductLists = { ...prev };
      const oldInvoiceId = rows.find((row) => row.id === id)?.invoiceId;
      if (oldInvoiceId) {
        delete newProductLists[oldInvoiceId];
      }
      return newProductLists;
    });

    // Update delivery date based on remaining selected DRs
    updateDeliveryDateBasedOnSelectedDRs(updatedRows);
  };

  const navigate = useNavigate();
  // State variables
  const [showModal, setShowModal] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  const [scheduleID, setScheduleID] = useState("");
  const [totalWeight, setTotalWeight] = useState(0);
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
    setTotalWeight(newTotal);
  }, [rows]);

  // Function to handle input changes
  const handleInputChange = (id, field, value) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      }),
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
          `${BASE_URL}/ScheduleList/fetchInvoiceDR`,
        );

        console.log("Raw API response:", response.data); // Debugging log

        // Transform the data to match what you need
        const transformedData = response.data.data.map((item) => {
          // Change here
          // Fallback values in case any data is missing
          const customer = item.customer || {};
          const products = item.sales_invoice_tag_products || [];
          const totalWeightOrdered = products.reduce(
            (a, c) => a + c.quantity * c.packaging_unit_quantity,
            0,
          );

          return {
            invoice_id: item.sales_invoice_id || "",
            transaction_id: item.transaction_id || "",
            invoice_title: item.invoice_title || "",
            delivery_number: item.delivery_number || "",
            customerName: customer.company_name || "",
            location: customer.company_address || item.destination || "",
            contactNo: customer.mobile_no || customer.telephone_no || "",
            totalOrdered: (totalWeightOrdered || "0")
              .toString()
              .replace(/,/g, ""),
            quantityToDeliver: "0",
            dr_delivery_date: item.due_date || "",
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

  // FETCH INVOICE DR
  // useEffect(() => {
  //   const fetchInvoiceDR = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${BASE_URL}/ScheduleList/fetchInvoiceDR`
  //       );

  //       console.log("Raw API response:", response.data); // Debugging log

  //       // Transform the data to match what you need
  //       const transformedData = response.data.map((item) => {
  //         // Fallback values in case any data is missing
  //         const salesInvoice = item.sales_invoice || {};
  //         const customer = salesInvoice.customer || {};
  //         const batchEntryMain = item.batch_entry_main || {};
  //         const ppBatchEntry = batchEntryMain.pp_batch_entry_id?.[0] || {};

  //         return {
  //           invoice_id: salesInvoice.sales_invoice_id || "",
  //           transaction_id: salesInvoice.transaction_id || "",
  //           customerName: customer.company_name || "",
  //           location:
  //             customer.company_address || salesInvoice.destination || "",
  //           contactNo: customer.mobile_no || customer.telephone_no || "",
  //           totalOrdered: (
  //             salesInvoice.total_ordered ||
  //             ppBatchEntry.total_quantity_ordered ||
  //             "0"
  //           )
  //             .toString()
  //             .replace(/,/g, ""),
  //           quantityToDeliver: (
  //             salesInvoice.total_ordered ||
  //             ppBatchEntry.total_quantity_ordered ||
  //             "0"
  //           )
  //             .toString()
  //             .replace(/,/g, ""),
  //         };
  //       });

  //       setInvoices(transformedData);
  //       setIsLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //       swal("Error", "Failed to fetch data: " + error.message, "error");
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchInvoiceDR();
  // }, []);

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

    // Create updated rows without the deleted row
    const updatedRows = rows.filter((row) => row.id !== id);

    // Update rows state
    setRows(updatedRows);

    // Update expandedRows state to remove the deleted row's expansion state
    setExpandedRows((prev) => {
      const newExpanded = { ...prev };
      delete newExpanded[id];
      return newExpanded;
    });

    // If the row had a product selected, remove it from productLists
    const deletedRow = rows.find((row) => row.id === id);
    if (deletedRow && deletedRow.invoiceId) {
      setProductLists((prev) => {
        const newProductLists = { ...prev };
        delete newProductLists[deletedRow.invoiceId];
        return newProductLists;
      });
    }

    // Update delivery date based on remaining selected DRs
    updateDeliveryDateBasedOnSelectedDRs(updatedRows);
  };

  // Handle product selection change
  const handleInvoiceChange = (id, invoiceId) => {
    const selectedInvoice = invoices.find(
      (invoice) => invoice.invoice_id === invoiceId,
    );

    // AUTO-EXPAND: Automatically expand the row when an invoice is selected
    setExpandedRows((prev) => ({
      ...prev,
      [id]: true, // Changed from false to true
    }));

    // Clear the product list for this row if it exists
    setProductLists((prev) => {
      const newProductLists = { ...prev };
      // Find the old invoice ID for this row
      const oldInvoiceId = rows.find((row) => row.id === id)?.invoiceId;
      if (oldInvoiceId && newProductLists[oldInvoiceId]) {
        delete newProductLists[oldInvoiceId];
      }
      return newProductLists;
    });

    // Create updated rows first
    const updatedRows = rows.map((row) => {
      if (row.id === id) {
        return {
          ...row,
          invoiceId: invoiceId,
          transactionId: selectedInvoice?.transaction_id || "",
          customerName: selectedInvoice?.customerName || "",
          location: selectedInvoice?.location || "",
          contactNo: selectedInvoice?.contactNo || "",
          totalOrdered: selectedInvoice?.totalOrdered || "",
          quantityToDeliver: selectedInvoice?.totalOrdered || "", // Set to total ordered by default
          isSelected: !!selectedInvoice,
        };
      }
      return row;
    });

    // Update rows state
    setRows(updatedRows);

    // Update delivery date based on selected DRs
    updateDeliveryDateBasedOnSelectedDRs(updatedRows);

    // Fetch products immediately since we're expanding
    if (invoiceId) {
      fetchProductsForInvoice(invoiceId, id);
    }
  };

  // Add this helper function to fetch products
  const fetchProductsForInvoice = async (invoiceId, rowId) => {
    if (!invoiceId || productLists[invoiceId]) return;

    try {
      console.log("Auto-fetching products for invoice:", invoiceId);
      const response = await axios.get(
        `${BASE_URL}/ScheduleList/fetchInvoiceDRProductList?sales_invoice_id=${invoiceId}`,
      );

      console.log("Products API response:", response.data);

      // Initialize quantities with total ordered as default
      const productsWithQtys = response.data.map((product) => ({
        ...product,
        quantity: product.quantity * product.packaging_unit_quantity,
        quantityToDeliver: (
          product.quantity * product.packaging_unit_quantity
        ).toString(), // Set default to total ordered
      }));

      console.log("Processed products:", productsWithQtys);

      setProductLists((prev) => ({
        ...prev,
        [invoiceId]: productsWithQtys,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      swal("Error", "Failed to load product list", "error");
    }
  };

  // Add this function to filter available invoices
  const getAvailableInvoice = (currentRowId) => {
    // Get all invoice IDs that are selected in other rows
    const selectedInvoiceIds = rows
      .filter((row) => row.id !== currentRowId && row.invoiceId)
      .map((row) => row.invoiceId);

    // Filter out invoices that are already selected in other rows
    return invoices.filter(
      (invoice) => !selectedInvoiceIds.includes(invoice.invoice_id),
    );
  };

  const handeCloseModal = () => {
    setShowModal(false);
    setScheduleID("");
    setTotalWeight(0);
    setDeliveryDate(""); // Reset to empty
    setDriver("");
    setPorter("");
    setRemarks("");
    setPlateNo("");
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
      driver: !driver, // ADD THIS
      porters: !porters,
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
        },
      );
      return;
    }

    if (totalWeight <= 0) {
      swal(
        "Warning",
        "Quantity does not meet the required quantity for Order",
        "warning",
      ).then(() => {
        setIsSubmit(false);
      });
      return;
    }

    // Prepare data for confirmation
    const submissionData = {
      scheduleID,
      scheduleTitle,
      deliveryDate,
      driver,
      porters,
      remarks,
      plateNo,
      totalWeight: totalWeight,
      createdBy: userLoggedID,
      invoices: rows.map((invoice) => ({
        invoiceId: invoice.invoiceId,
        transactionId: invoice.transactionId,
        customerName: invoice.customerName,
        weightToDeliver: invoice.quantityToDeliver,
        totalWeightOrdered: invoice.totalOrdered,
        products: invoice.invoiceId
          ? productLists[invoice.invoiceId]?.map((product) => ({
              productId: product.product_id,
              productCode: product.product_code,
              quantity: product.quantity,
              weightToDeliver: product.quantityToDeliver,
              packagingUnitQuantity: product.packaging_unit_quantity,
            }))
          : [],
      })),
    };

    // Show confirmation dialog
    swal({
      title: "Confirm Schedule",
      content: {
        element: "div",
        attributes: {
          innerHTML: `
        <div style="text-align: center;">
          Are you sure you want to create this schedule?<br>
          for ${dayjs(deliveryDate).format("MMM D, YYYY")}
        </div>
      `,
        },
      },
      icon: "warning",
      buttons: ["Cancel", "Submit"],
      dangerMode: true,
    }).then(async (willSubmit) => {
      if (willSubmit) {
        try {
          console.log("Submitting data:", submissionData);

          const response = await axios.post(
            `${BASE_URL}/ScheduleList/create`,
            submissionData,
          );

          if (response.data.success) {
            swal({
              title: "Success!",
              text: "Scheduled Delivery created successfully",
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
    console.log("toggleRowExpand called with:", { invoiceId, rowId });

    if (!invoiceId) {
      swal("Warning", "Please select an invoice first", "warning");
      return;
    }

    const newExpandedState = { ...expandedRows };
    newExpandedState[rowId] = !newExpandedState[rowId];

    // Fetch products if not already loaded
    if (newExpandedState[rowId] && !productLists[invoiceId]) {
      try {
        console.log("Fetching products for invoice:", invoiceId);
        const response = await axios.get(
          `${BASE_URL}/ScheduleList/fetchInvoiceDRProductList?sales_invoice_id=${invoiceId}`,
        );

        console.log("Products API response:", response.data);

        // Initialize quantities with total ordered as default
        const productsWithQtys = response.data.map((product) => ({
          ...product,
          quantity: product.quantity * product.packaging_unit_quantity,
          quantityToDeliver: (
            product.quantity * product.packaging_unit_quantity
          ).toString(), // Set default to total ordered
        }));

        console.log("Processed products:", productsWithQtys);

        setProductLists((prev) => ({
          ...prev,
          [invoiceId]: productsWithQtys,
        }));

        // REMOVED: The automatic total calculation here since we're handling it in handleInvoiceChange
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to load product list", "error");
      }
    }

    setExpandedRows(newExpandedState);
  };

  const [rawInputValues, setRawInputValues] = useState({});

  const handleExpandedQuantityChange = (invoiceId, productId, value) => {
    console.log("🔍 handleExpandedQuantityChange called with:", {
      invoiceId,
      productId,
      value,
      valueType: typeof value,
      currentProductLists: productLists,
    });

    if (!invoiceId || !productId) {
      console.error("❌ Missing invoiceId or productId", {
        invoiceId,
        productId,
      });
      return;
    }

    setProductLists((prev) => {
      const newProductLists = { ...prev };

      if (!newProductLists[invoiceId]) {
        console.error(`❌ Invoice ${invoiceId} not found in productLists`);
        return prev;
      }

      console.log("🔄 Updating product quantity:", {
        invoiceId,
        productId,
        value,
        products: newProductLists[invoiceId],
      });

      newProductLists[invoiceId] = newProductLists[invoiceId].map((product) => {
        if (product.product_id === productId) {
          // Get the max quantity for this product
          const maxQuantity = Number(product.quantity) || 0;

          // Allow empty string, decimal point, or valid numbers with decimals
          if (value === "" || value === ".") {
            return {
              ...product,
              quantityToDeliver: value,
            };
          }

          // Check if it's a valid number format (including numbers with decimals)
          if (/^\d*\.?\d*$/.test(value)) {
            // If it ends with a decimal point, keep it as is for typing
            if (value.endsWith(".")) {
              return {
                ...product,
                quantityToDeliver: value,
              };
            }

            // Parse the value only when it's a complete number
            const numericValue = parseFloat(value);
            console.log("🧮 Numeric value calculation:", {
              value,
              numericValue,
              maxQuantity,
              isNaN: isNaN(numericValue),
            });

            if (isNaN(numericValue)) {
              return {
                ...product,
                quantityToDeliver: "",
              };
            } else {
              // ENFORCE MAX LIMIT - if value exceeds maxQuantity, cap it at maxQuantity
              const newQuantity = Math.min(numericValue, maxQuantity);
              console.log("✅ Final newQuantity:", newQuantity);

              return {
                ...product,
                quantityToDeliver: newQuantity.toString(),
              };
            }
          } else {
            // If not a valid number format, keep the previous value
            console.log("❌ Invalid number format, keeping previous value");
            return product;
          }
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
    productListsToUse = productLists,
  ) => {
    console.log("updateRowQuantityFromExpanded called with:", {
      invoiceId,
      productListsToUse,
    });

    if (!productListsToUse[invoiceId]) {
      console.error("No products found for invoice:", invoiceId);
      return;
    }

    const totalExpandedQty = productListsToUse[invoiceId].reduce(
      (sum, product) => sum + (Number(product.quantityToDeliver) || 0),
      0,
    );

    console.log("Calculated total quantity:", totalExpandedQty);

    setRows(
      rows.map((row) => {
        if (row.invoiceId === invoiceId) {
          return {
            ...row,
            quantityToDeliver: totalExpandedQty.toString(),
          };
        }
        return row;
      }),
    );
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "delivered") return "#82e885";
    if (lowerStatus === "rejected") return "#e88282";
    if (lowerStatus === "for-approval") return "#20a7db";
    if (lowerStatus === "partial-deliver") return "#c3c340";
    if (lowerStatus === "on-schedule") return "#480097";
    if (lowerStatus === "re-schedule") return "#f57c1fff";
    return "#6c757d"; // default color
  };

  // Helper function to format status display
  const formatStatusDisplay = (status) => {
    const statusMap = {
      delivered: "Delivered",
      rejected: "Rejected",
      "for-approval": "For Approval",
      "partial-deliver": "Partial Deliver",
      "on-schedule": "On Schedule",
      "re-schedule": "Re-Schedule",
    };

    const lowerStatus = status.toLowerCase();
    return statusMap[lowerStatus] || status;
  };

  const updateDeliveryDateBasedOnSelectedDRs = (currentRows) => {
    // Get all selected invoices with dr_delivery_date
    const selectedInvoices = currentRows
      .filter((row) => row.invoiceId && row.isSelected)
      .map((row) => {
        const invoice = invoices.find(
          (inv) => inv.invoice_id === row.invoiceId,
        );
        return invoice ? invoice.dr_delivery_date : null;
      })
      .filter((date) => date); // Remove null/empty dates

    // If no invoices are selected, keep current delivery date or leave empty
    if (selectedInvoices.length === 0) {
      // You can choose to keep the current deliveryDate or clear it
      // setDeliveryDate(""); // Uncomment to clear when no DRs selected
      return;
    }

    // Check if all selected invoices have the same dr_delivery_date
    const firstDate = selectedInvoices[0];
    const allDatesSame = selectedInvoices.every((date) => date === firstDate);

    if (allDatesSame) {
      // All selected DRs have the same delivery date
      setDeliveryDate(firstDate);
    } else {
      // Different delivery dates among selected DRs
      setDeliveryDate(""); // Clear the delivery date
    }
  };

  // get delivery date status
  const getDeliveryDateStatus = () => {
    const selectedRows = rows.filter((row) => row.invoiceId && row.isSelected);

    if (selectedRows.length === 0) {
      return "No DRs selected";
    }

    const selectedInvoices = selectedRows
      .map((row) => {
        const invoice = invoices.find(
          (inv) => inv.invoice_id === row.invoiceId,
        );
        return invoice
          ? {
              id: invoice.invoice_id,
              delivery_number: invoice.delivery_number,
              dr_delivery_date: invoice.dr_delivery_date,
            }
          : null;
      })
      .filter((inv) => inv);

    const uniqueDates = [
      ...new Set(selectedInvoices.map((inv) => inv.dr_delivery_date)),
    ];

    if (uniqueDates.length === 1) {
      return `All ${selectedInvoices.length} DRs have same date: ${uniqueDates[0]}`;
    } else {
      return `${selectedInvoices.length} DRs selected with different dates`;
    }
  };

  // Add this useEffect to debug state changes
  useEffect(() => {
    console.log("📊 Current productLists state:", productLists);
  }, [productLists]);

  useEffect(() => {
    console.log("📊 Current rows state:", rows);
  }, [rows]);

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
      ) : authrztn.includes("Schedule-View") ? (
        <>
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
                              Delivery Date:{" "}
                              {dayjs(event.end).format("MMM D, YYYY")}
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
                        <Form.Label>Total Weight (KG/s)</Form.Label>
                        <Form.Control
                          type="text"
                          value={formatNumberWithCommas(totalWeight)}
                          placeholder="Enter Quantity"
                          readOnly
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3" controlId="driver">
                        <Form.Label>Driver</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Driver Name"
                          value={driver}
                          onChange={(e) => {
                            setDriver(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3" controlId="porters">
                        <Form.Label>Pahinante(s)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Pahinante(s) separated by commas"
                          value={porters}
                          onChange={(e) => {
                            setPorter(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3" controlId="plateNo">
                        <Form.Label>Truck/Plate No.</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Truck/Plate No."
                          value={plateNo}
                          onChange={(e) => setPlateNo(e.target.value)}
                        />
                      </Form.Group>
                    </div>
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
                              Total Weight Ordered
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
                              Weight to be Delivered
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
                                    !row.invoiceId
                                      ? "Select an invoice first"
                                      : ""
                                  }
                                >
                                  {expandedRows[row.id] ? "▲" : "▼"}
                                </span>
                              </td>
                              <td
                                style={{
                                  width: "20%",
                                  whiteSpace: "nowrap",
                                  zIndex: 9999,
                                }}
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
                                  <Select
                                    classNamePrefix="react-select"
                                    className="react-select-container"
                                    value={
                                      row.invoiceId
                                        ? (() => {
                                            const invoice = invoices.find(
                                              (inv) =>
                                                inv.invoice_id ===
                                                row.invoiceId,
                                            );
                                            return {
                                              value: row.invoiceId,
                                              label: invoice
                                                ? invoice.invoice_title
                                                  ? `${invoice.delivery_number} - ${invoice.invoice_title}`
                                                  : invoice.delivery_number
                                                : "Selected Invoice",
                                            };
                                          })()
                                        : null
                                    }
                                    onChange={(selectedOption) => {
                                      if (selectedOption === null) {
                                        handleClearInvoice(row.id);
                                      } else {
                                        handleInvoiceChange(
                                          row.id,
                                          selectedOption.value,
                                        );
                                      }
                                    }}
                                    options={[
                                      ...getAvailableInvoice(row.id).map(
                                        (invoice) => ({
                                          value: invoice.invoice_id,
                                          label: invoice.invoice_title
                                            ? `${invoice.delivery_number} - ${invoice.invoice_title}`
                                            : invoice.delivery_number,
                                        }),
                                      ),
                                      ...(row.invoiceId &&
                                      !getAvailableInvoice(row.id).some(
                                        (inv) =>
                                          inv.invoice_id === row.invoiceId,
                                      )
                                        ? [
                                            (() => {
                                              const invoice = invoices.find(
                                                (inv) =>
                                                  inv.invoice_id ===
                                                  row.invoiceId,
                                              );
                                              return {
                                                value: row.invoiceId,
                                                label: invoice
                                                  ? invoice.invoice_title
                                                    ? `${invoice.delivery_number} - ${invoice.invoice_title}`
                                                    : invoice.delivery_number
                                                  : "Selected Invoice",
                                                isDisabled: true,
                                              };
                                            })(),
                                          ]
                                        : []),
                                    ]}
                                    isDisabled={
                                      !row.invoiceId &&
                                      getAvailableInvoice(row.id).length === 0
                                    }
                                    placeholder="Select Invoice"
                                    isSearchable
                                    menuShouldScrollIntoView={false}
                                    menuPortalTarget={document.body}
                                    styles={{
                                      menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                      }),
                                      menu: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                        whiteSpace: "normal",
                                        minWidth: "max-content",
                                        width: "auto",
                                      }),
                                      menuList: (base) => ({
                                        ...base,
                                        overflowX: "hidden",
                                      }),
                                      option: (base) => ({
                                        ...base,
                                        whiteSpace: "normal",
                                        wordWrap: "break-word",
                                      }),
                                    }}
                                  />
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
                                <div className="input-group">
                                  <Form.Control
                                    type="text"
                                    value={formatNumberWithCommas(
                                      row.totalOrdered,
                                    )}
                                    readOnly
                                  />
                                  <div className="input-group-prepend">
                                    <div className="input-group-text h-100">
                                      <label>kg/s</label>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{ width: "10%", whiteSpace: "nowrap" }}
                                className="text-center"
                              >
                                <div className="input-group">
                                  <Form.Control
                                    type="text"
                                    value={formatNumberWithCommas(
                                      row.quantityToDeliver,
                                    )}
                                    readOnly
                                    className={
                                      validationErrors.quantityToDeliver[row.id]
                                        ? "is-invalid border-0 bg-transparent"
                                        : "border-0 bg-transparent"
                                    }
                                  />
                                  <div className="input-group-prepend">
                                    <div className="input-group-text h-100">
                                      <label>kg/s</label>
                                    </div>
                                  </div>
                                </div>
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
                                            <th>Weight (KG/s)</th>
                                            <th>Weight to Deliver (KG/s)</th>
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
                                                      product.quantity,
                                                    )}
                                                    readOnly
                                                    className="border-0 bg-transparent"
                                                  />
                                                </td>
                                                <td>
                                                  <Form.Control
                                                    type="text"
                                                    value={
                                                      // If we have a raw input value for this product, use it (no commas during typing)
                                                      // Otherwise, use the formatted value (with commas when not typing)
                                                      rawInputValues[
                                                        `${row.invoiceId}-${product.product_id}`
                                                      ] !== undefined
                                                        ? rawInputValues[
                                                            `${row.invoiceId}-${product.product_id}`
                                                          ]
                                                        : product.quantityToDeliver ===
                                                            ""
                                                          ? ""
                                                          : formatNumberWithCommas(
                                                              product.quantityToDeliver,
                                                            )
                                                    }
                                                    onChange={(e) => {
                                                      console.log(
                                                        "⌨️ Input onChange triggered:",
                                                        {
                                                          originalValue:
                                                            e.target.value,
                                                          productId:
                                                            product.product_id,
                                                          currentQuantityToDeliver:
                                                            product.quantityToDeliver,
                                                        },
                                                      );

                                                      let inputValue =
                                                        e.target.value;

                                                      // ✅ Allow only numbers and one decimal point
                                                      inputValue =
                                                        inputValue.replace(
                                                          /[^0-9.]/g,
                                                          "",
                                                        );
                                                      const parts =
                                                        inputValue.split(".");
                                                      if (parts.length > 2) {
                                                        inputValue =
                                                          parts[0] +
                                                          "." +
                                                          parts
                                                            .slice(1)
                                                            .join("");
                                                      }

                                                      // ✅ Limit decimal places to 2
                                                      if (
                                                        parts.length === 2 &&
                                                        parts[1].length > 2
                                                      ) {
                                                        inputValue =
                                                          parts[0] +
                                                          "." +
                                                          parts[1].substring(
                                                            0,
                                                            2,
                                                          );
                                                      }

                                                      // ✅ Check if the value exceeds the max quantity
                                                      const maxQuantity =
                                                        Number(
                                                          product.quantity,
                                                        ) || 0;
                                                      const numericValue =
                                                        parseFloat(inputValue);

                                                      if (
                                                        !isNaN(numericValue) &&
                                                        numericValue >
                                                          maxQuantity
                                                      ) {
                                                        // If value exceeds max, show warning and cap at max
                                                        swal(
                                                          "Warning",
                                                          `Value cannot exceed ${formatNumberWithCommas(
                                                            maxQuantity,
                                                          )}`,
                                                          "warning",
                                                        );
                                                        inputValue =
                                                          maxQuantity.toString();
                                                      }

                                                      // Store the raw input value for display (no commas during typing)
                                                      setRawInputValues(
                                                        (prev) => ({
                                                          ...prev,
                                                          [`${row.invoiceId}-${product.product_id}`]:
                                                            inputValue,
                                                        }),
                                                      );

                                                      // ✅ Directly call the handler with the cleaned value
                                                      handleExpandedQuantityChange(
                                                        row.invoiceId,
                                                        product.product_id,
                                                        inputValue,
                                                      );
                                                    }}
                                                    onBlur={(e) => {
                                                      const raw =
                                                        e.target.value;

                                                      // Clear the raw input value on blur
                                                      setRawInputValues(
                                                        (prev) => {
                                                          const newValues = {
                                                            ...prev,
                                                          };
                                                          delete newValues[
                                                            `${row.invoiceId}-${product.product_id}`
                                                          ];
                                                          return newValues;
                                                        },
                                                      );

                                                      // If the value is just a decimal point or ends with decimal point, treat it as empty
                                                      if (
                                                        raw === "." ||
                                                        raw.endsWith(".")
                                                      ) {
                                                        const cleanValue =
                                                          raw.replace(
                                                            /\.$/,
                                                            "",
                                                          );
                                                        if (cleanValue === "") {
                                                          e.target.value = "";
                                                          handleExpandedQuantityChange(
                                                            row.invoiceId,
                                                            product.product_id,
                                                            "",
                                                          );
                                                        } else if (
                                                          !isNaN(cleanValue)
                                                        ) {
                                                          const numericValue =
                                                            parseFloat(
                                                              cleanValue,
                                                            );
                                                          const formatted =
                                                            formatNumberWithCommas(
                                                              numericValue,
                                                            );
                                                          e.target.value =
                                                            formatted;
                                                          handleExpandedQuantityChange(
                                                            row.invoiceId,
                                                            product.product_id,
                                                            numericValue.toString(),
                                                          );
                                                        }
                                                        return;
                                                      }

                                                      // If we have a valid number, format it
                                                      if (
                                                        raw !== "" &&
                                                        !isNaN(raw)
                                                      ) {
                                                        const numericValue =
                                                          parseFloat(raw);
                                                        const formatted =
                                                          formatNumberWithCommas(
                                                            numericValue,
                                                          );
                                                        e.target.value =
                                                          formatted;
                                                        handleExpandedQuantityChange(
                                                          row.invoiceId,
                                                          product.product_id,
                                                          numericValue.toString(),
                                                        );
                                                      }
                                                    }}
                                                    onKeyDown={(e) => {
                                                      console.log(
                                                        "⌨️ Key pressed:",
                                                        {
                                                          key: e.key,
                                                          code: e.code,
                                                          targetValue:
                                                            e.target.value,
                                                        },
                                                      );

                                                      // Prevent entering values that would exceed the max
                                                      const maxQuantity =
                                                        Number(
                                                          product.quantity,
                                                        ) || 0;
                                                      const currentValue =
                                                        e.target.value;

                                                      if (
                                                        e.key >= "0" &&
                                                        e.key <= "9"
                                                      ) {
                                                        const newValue =
                                                          currentValue + e.key;
                                                        const numericValue =
                                                          parseFloat(newValue);

                                                        if (
                                                          !isNaN(
                                                            numericValue,
                                                          ) &&
                                                          numericValue >
                                                            maxQuantity
                                                        ) {
                                                          e.preventDefault();
                                                          swal(
                                                            "Warning",
                                                            `Value cannot exceed ${formatNumberWithCommas(
                                                              maxQuantity,
                                                            )}`,
                                                            "warning",
                                                          );
                                                        }
                                                      }
                                                    }}
                                                    className="form-control-sm"
                                                    // Add a title for better UX
                                                    title={`Maximum allowed: ${formatNumberWithCommas(
                                                      product.quantity,
                                                    )}`}
                                                  />
                                                  <small className="text-muted">
                                                    Max:{"  "}
                                                    {formatNumberWithCommas(
                                                      product.quantity,
                                                    )}{" "}
                                                    (kg/s)
                                                  </small>
                                                </td>
                                              </tr>
                                            ),
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

export default Schedule;
