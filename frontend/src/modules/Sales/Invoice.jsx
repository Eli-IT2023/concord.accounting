import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  Suspense,
} from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import DateRangePicker from "../../components/DateRangePicker";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { Modal, Tab, Tabs, Button } from "react-bootstrap";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { useValidPage } from "../../hooks/customHook/paginationHook/useValidPage";
import { Rss } from "@phosphor-icons/react";
import { compactNumberFormat } from "../../utils/numberFormatter";
import CurrencySelector from "../../components/CurrencySelector";
import { MultiSelect } from "react-multi-select-component";
import { useObserver } from "../../hooks/customHook/useObserver";
import PendingStatusTab from "./components/Invoice/PendingStatusTab";
import ApprovedStatusTab from "./components/Invoice/ApprovedStatusTab";
import ReturnedStatusTab from "./components/Invoice/ReturnedStatusTab";
import InvoicePdf from "./components/Invoice/InvoicePdf";
import InvoiceCsv from "./components/Invoice/InvoiceCsv";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";

const Invoice = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const { containerRef, containerItemRefs, visible } = useObserver();
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger data re-fetch in child component status tabs
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  }); // state for input select
  const [cutOffs, setCutOffs] = useState([]);
  const [widget, setWidget] = useState({});
  const [lastCutOffReceivableModal, setLastCutOffReceivableModal] = useState(
    []
  );
  const [currentSalesKilo, setCurrentSalesKilo] = useState(0);
  const [previousSalesKilo, setPreviousSalesKilo] = useState(0);
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  const [customerList, setCustomerList] = useState([]);
  const [customerSearchValue, setCustomerSearchValue] = useState("");

  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [exportData, setExportData] = useState([]);
  const csvLinkRef = useRef();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // handle change select cutoff date
  const handleSelect = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === "All") {
      const earliestFrom = new Date(
        Math.min(...cutOffs.map((item) => new Date(item.from).getTime()))
      );

      const latestTo = new Date(
        Math.max(...cutOffs.map((item) => new Date(item.to).getTime()))
      );

      const allCutoff = { id: "All", from: earliestFrom, to: latestTo };

      setSelectedCutOff(allCutoff);
      fetchSalesInvoiceWidgets(allCutoff);
      fetchCollection(allCutoff);
      fetchLastCutoffModal(allCutoff);
      getPreviousSalesKilo(allCutoff);
      getCurrentSalesKilo(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: selectedItem.from,
          to: selectedItem.to,
        };

        setSelectedCutOff(cutoff);
        fetchSalesInvoiceWidgets(cutoff);
        fetchCollection(cutoff);
        fetchLastCutoffModal(cutoff);
        getPreviousSalesKilo(cutoff);
        getCurrentSalesKilo(cutoff);
      }
    }
  };

  function calculateDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDifference = end.getTime() - start.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  }

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.client_transaction_id,
      cell: (row) => (
        <div className="text-center">{row.client_transaction_id}</div>
      ),
    },
    {
      name: "Destination",
      selector: (row) => row.destination,
      cell: (row) => <div className="text-center">{row.destination}</div>,
    },
    {
      name: "Container Number",
      selector: (row) => row.container_number,
      cell: (row) => <div>{row.container_number || "n/a"}</div>,
    },
    {
      name: "Pier",
      selector: (row) => row.pier,
      cell: (row) => <div>{row.pier || "n/a"}</div>,
    },
    {
      name: "Customer",
      selector: (row) =>
        row.customer.first_name && row.customer.last_name
          ? `${row.customer.first_name} ${row.customer.last_name}`
          : `${row.customer.company_name}`,
    },
    {
      name: "Invoice Date",
      selector: (row) => format(row.invoice_date, "MMM/dd/yyyy"),
    },
    {
      name: "Date Approved",
      selector: (row) =>
        row.date_approved
          ? format(row.date_approved, "MMM/dd/yyyy hh:mm a")
          : "n/a",
    },
    {
      name: "Due Date",
      selector: (row) => row.daysDifference,
    },
    {
      name: "DR Number",
      selector: (row) => row.dr_number || "n/a",
    },
    {
      name: "PO Number",
      selector: (row) => row.po_number || "n/a",
    },

    {
      name: "Currency",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "Currency Rate",
      selector: (row) => row.rate,
    },
    {
      name: "Total Amount",
      selector: (row) =>
        row.total_amount?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;
        switch (row.status) {
          case "Pending":
            color = "#FFA500";
            break;
          case "Approved":
            color = "#3B9F3F";
            break;
          case "Returned":
          case "Rejected":
            color = "#FF0000";
            break;
          default:
            color = "initial";
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: color,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {row.status}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("Invoices-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => {
        const status = row.status;
        const isReturned = status === "Returned";
        const isPending = status === "Pending";
        return (
          <div className="d-flex align-items-center gap-2 p-3">
            <button
              type="button"
              className="border-0 bg-transparent"
              disabled={isReturned}
            >
              <i
                className="fas fa-trash"
                style={{
                  cursor: `${isReturned ? "not-allowed" : "pointer"}`,
                  color: "red",
                  fontSize: "1.5rem",
                  opacity: `${isReturned ? "0.5" : "1"}`,
                }}
                onClick={() => {
                  handleDeleteInvoice(
                    row.sales_invoice_id,
                    row.invoice_date,
                    row
                  );
                }}
              ></i>
            </button>
            {/* <div
              style={{
                cursor: `${
                  isReturned || isPending ? "not-allowed" : "pointer"
                }`,
                display: "inline-block",
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleReturnInvoice(
                    row.sales_invoice_id,
                    row.invoice_date,
                    row
                  );
                }}
                disabled={status !== "Approved"}
              >
                Return
              </button>
            </div> */}
          </div>
        );
      },
    });
  }

  const handleDeleteInvoice = async (invoiceId, invoice_date, rowData) => {
    console.log(invoiceId);
    swal({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/invoice/deleteInvoice/${invoiceId}/${invoice_date}`,
            {
              data: { userLoggedID, rowData },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Invoice Deleted Successfully!",
              text: "The invoice has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              // fetchSalesInvoiceData();
              fetchCutOff();
              setRefreshKey((prev) => prev + 1);
            });
          } else if (response.status === 203) {
            const { transactionNumber, moduleType } = response.data;
            let moduleFrom;
            if (moduleType === "Local-Bulk-Collection") {
              moduleFrom = "Local Collection";
            } else {
              moduleFrom = "Overseas Collection";
            }
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the invoice in module <strong>${moduleFrom}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 202) {
            const { invoiceDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Invoice cannot be deleted as its invoice date (${invoiceDate}) falls within the posted cutoff period named "${CutoffName}".`,
              icon: "warning",
              button: "OK",
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
            });
          }
        } catch (err) {
          console.log(err);
          swal({
            icon: "error",
            title: "Error",
            text: "An error occurred while deleting the invoice.",
          });
        }
      }
    });
  };

  // const handleReturnInvoice = async (invoiceId, invoice_date, rowData) => {
  //   swal({
  //     title: "Return Confirmation",
  //     text: "Are you sure you want to proceed with the return?",
  //     icon: "warning",
  //     buttons: true,
  //     dangerMode: true,
  //   }).then(async (willDelete) => {
  //     if (willDelete) {
  //       try {
  //         const response = await axios.delete(
  //           `${BASE_URL}/invoice/returnInvoice/${invoiceId}/${invoice_date}`,
  //           {
  //             data: { userLoggedID, rowData },
  //           }
  //         );
  //         if (response.status === 200) {
  //           swal({
  //             title: "Invoice Returned Successfully!",
  //             text: "The invoice has been successfully returned.",
  //             icon: "success",
  //             button: "OK",
  //           }).then(() => {
  //             // fetchSalesInvoiceData();
  //             fetchCutOff();
  //             setRefreshKey((prev) => prev + 1);
  //           });
  //         } else if (response.status === 203) {
  //           const { transactionNumber, moduleType } = response.data;
  //           let moduleFrom;
  //           if (moduleType == "Local-Bulk-Collection") {
  //             moduleFrom = "Local Collection";
  //           } else {
  //             moduleFrom = "Overseas Collection";
  //           }
  //           const title = document.createElement("div");
  //           const text = document.createElement("div");
  //           const swalInfo = document.createElement("div");

  //           title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Returns Not Allowed!</div>`;
  //           text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
  //                             Delete first the invoice in module <strong>${moduleFrom}</strong> with
  //                             Transaction Number: <strong>${transactionNumber}</strong>
  //                           </div>`;

  //           swalInfo.append(title);
  //           swalInfo.append(text);
  //           swal({
  //             icon: "error",
  //             content: swalInfo,
  //           });
  //         } else if (response.status === 202) {
  //           const { invoiceDate, CutoffName } = response.data;
  //           swal({
  //             title: "Returns Not Allowed!",
  //             text: `Invoice cannot be deleted as its invoice date (${invoiceDate}) falls within the posted cutoff period named "${CutoffName}".`,
  //             icon: "warning",
  //             button: "OK",
  //           });
  //         } else {
  //           swal({
  //             icon: "error",
  //             title: "Something went wrong",
  //             text: "Please contact our support team for assistance.",
  //           });
  //         }
  //       } catch (err) {
  //         console.log(err);
  //         swal({
  //           icon: "error",
  //           title: "Error",
  //           text: "An error occurred while returning the invoice.",
  //         });
  //       }
  //     }
  //   });
  // };

  const modalColumns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Destination",
      selector: (row) => row.destination,
    },
    {
      name: "Customer",
      selector: (row) =>
        row.customer.first_name && row.customer.last_name
          ? `${row.customer.first_name} ${row.customer.last_name}`
          : `${row.customer.company_name}`,
    },
    {
      name: "Invoice Date",
      selector: (row) => row.invoice_date,
    },
    {
      name: "Due Date",
      selector: (row) => {
        const daysDifference = calculateDaysDifference(
          row.createdAt,
          row.due_date
        );
        return `In ${daysDifference} Day(s)`;
      },
    },
    {
      name: "Currency",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "Total Amount",
      selector: (row) =>
        (row.total_amount * row.currency.currency_rate)?.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ),
    },
  ];

  const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/invoice/getCutoffForDisplay")
    //   .then((res) => {
    //     setCutOffs(res.data);

    //     const latestCutoff = res.data.reduce((latest, current) =>
    //       new Date(current.to) > new Date(latest.to) ? current : latest
    //     );

    //     // alert(latestCutoff);

    //     setSelectedCutOff({
    //       id: latestCutoff.id,
    //       from: new Date(latestCutoff.from),
    //       to: new Date(latestCutoff.to),
    //     });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    fetchSalesInvoiceWidgets(initialCutoff);
    fetchCollection(initialCutoff);
    fetchLastCutoffModal(initialCutoff);
    getPreviousSalesKilo(initialCutoff);
    getCurrentSalesKilo(initialCutoff);
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  };

  useEffect(() => {
    fetchCutOff();
  }, [currencyId]);

  const fetchSalesInvoiceWidgets = async (cutoff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/invoice/fetchSalesInvoiceWidgets`,
        {
          params: {
            startDate: cutoff?.from,
            endDate: cutoff?.to,
            currencyId,
          },
        }
      );

      if (res.status === 200) {
        const {
          lastCutoffReceivable,
          currentSalesTotal,
          currentTotalDiscount,
          totalCollection,
          currentCutoffReceivable,
        } = res.data;
        setWidget((prev) => ({
          ...prev,
          lastCutOffReceivable: lastCutoffReceivable,
          currentSalesTotal: currentSalesTotal,
          currentTotalDiscount: currentTotalDiscount,
          // totalCollection: totalCollection,
          currentCutOffReceivable: currentCutoffReceivable,
        }));
        return;
      }

      swal({
        icon: "error",
        title: "Something went wrong",
        text: "Please contact your support immediately",
        timer: 2000,
      });
    } catch (error) {
      console.error(error);
      swal({
        icon: "error",
        title: "Something went wrong",
        text: "Please contact your support immediately",
        timer: 2000,
      });
    }
  };

  // For collection widget
  const fetchCollection = async (cutoff) => {
    try {
      const res = await axios.get(`${BASE_URL}/invoice/summary/collection`, {
        params: {
          startDate: cutoff?.from,
          endDate: cutoff?.to,
          currencyId,
        },
      });

      if (res.status === 200)
        setWidget((prev) => ({
          ...prev,
          totalCollection: res.data,
        }));
    } catch (error) {
      console.error(error);
    }
  };

  const getPreviousSalesKilo = async (cutoff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/invoice/fetchPreviousSalesKilo`,
        {
          params: {
            startDate: cutoff?.from,
            currencyId,
          },
        }
      );
      const { previousSalesKilo } = res.data;
      setPreviousSalesKilo(previousSalesKilo);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentSalesKilo = async (cutoff) => {
    try {
      const res = await axios.get(`${BASE_URL}/invoice/fetchCurrentSalesKilo`, {
        params: {
          startDate: cutoff?.from,
          endDate: cutoff?.to,
          currencyId,
        },
      });
      const { currentSalesKilo } = res.data;
      setCurrentSalesKilo(currentSalesKilo);
    } catch (error) {
      console.error(error);
    }
  };

  const getCustomers = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/invoice/getCustomersDataBySearch`,
        {
          params: {
            customerSearchValue,
          },
        }
      );

      if (res.status === 200) {
        setCustomerList(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const paginationForLastCutoff = useServerPagination(
    `${BASE_URL}/invoice/fetchLastCutoffModal`,
    10,
    {
      startDate: selectedCutOff?.from,
      currencyId,
    }
  );

  const fetchLastCutoffModal = async (cutOff) => {
    paginationForLastCutoff.updateApiUrl(
      `${BASE_URL}/invoice/fetchLastCutoffModal`
    );
    paginationForLastCutoff.updateParams({
      startDate: cutOff?.from,
      currencyId,
    });
  };

  const handleUpdateInvoice = (row) => {
    navigate(`/sales/invoice-update/${row.sales_invoice_id}?page=1`);
  };

  // Options for customer filter
  const customerOptions = customerList.map((item) => ({
    value: item.customer_id,
    label:
      !item.first_name || !item.last_name
        ? item.company_name
        : `${item.first_name} ${item.last_name}`,
  }));

  const widgetList = [
    {
      // Column 1
      widgetOneTitle: "Last Cutoff Receivable",
      widgetOneAmount: widget.lastCutOffReceivable,
      // Column 2
      widgetTwoTitle: "Current Sales Total",
      widgetTwoAmount: widget.currentSalesTotal,
    },
    {
      // Column 1
      widgetOneTitle: "Total Discount",
      widgetOneAmount: widget.currentTotalDiscount,
      // Column 2
      widgetTwoTitle: "Collection",
      widgetTwoAmount: widget.totalCollection,
    },
    {
      // Column 1
      widgetOneTitle: "Current Cutoff Receivable",
      widgetOneAmount: widget.currentCutOffReceivable,
      // Column 2
      widgetTwoTitle: "Current Month Sales Kilo",
      widgetTwoAmount: currentSalesKilo,
    },
    {
      // Column 1
      widgetOneTitle: "Previous Month Sales Kilo",
      widgetOneAmount: previousSalesKilo,
    },
  ];

  const statusProps = {
    selectedCutOff,
    currencyId,
    customerOptions,
    setCustomerSearchValue,
    columns,
    handleUpdateInvoice,
    refreshKey,
    handleDeleteInvoice,
  };

  useEffect(() => {
    setLastCutOffReceivableModal(paginationForLastCutoff.data);
    setIsLoading(false);
  }, [paginationForLastCutoff]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getCustomers();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [customerSearchValue]);

  const [exportTabData, setExportTabData] = useState({
    Pending: [],
    Approved: [],
    Returned: [],
  });

  const exportToPdf = async () => {
    swal({
      icon: "warning",
      title: "Export to PDF?",
      text: "Do you want to export this data as a PDF file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const [pendingRes, approvedRes, returnedRes] = await Promise.all([
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: "Pending",
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: ["Approved", "Partially Collected", "Collected"],
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: "Returned",
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportTabData({
          Pending: pendingRes.data.data,
          Approved: approvedRes.data.data,
          Returned: returnedRes.data.data,
        });
        setShowPdfPreview(true);
      }
    });
  };

  const exportToCsv = async () => {
    swal({
      icon: "warning",
      title: "Export to CSV?",
      text: "Do you want to export this data as a CSV file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const [pendingRes, approvedRes, returnedRes] = await Promise.all([
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: "Pending",
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: ["Approved", "Partially Collected", "Collected"],
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/invoice/getSalesData`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              status: "Returned",
              currencyId,
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportTabData({
          Pending: pendingRes.data.data,
          Approved: approvedRes.data.data,
          Returned: returnedRes.data.data,
        });
        setTimeout(() => {
          csvLinkRef.current.link.click();
        }, 100);
      }
    });
  };

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    fetchSalesInvoiceWidgets(cutoff);
    fetchCollection(cutoff);
    fetchLastCutoffModal(cutoff);
    getPreviousSalesKilo(cutoff);
    getCurrentSalesKilo(cutoff);
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
      ) : authrztn.includes("Invoices-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom w-100">
              <span className="fs-3">SALES | INVOICE</span>
            </div>

            <div className=" w-100 row">
              <div className="col-12 col-md-8 d-flex flex-row align-items-center mb-2"></div>
              <div className="col-12 col-md-4 d-flex justify-content-end mb-2">
                {/* Export Pdf and excel */}
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-success dropdown-toggle pt-2 px-3 me-2"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Export
                  </button>
                  <ul className="dropdown-menu">
                    <li
                      className="dropdown-item border-bottom"
                      style={{ cursor: "pointer" }}
                      onClick={() => exportToPdf()}
                    >
                      PDF
                    </li>
                    <li
                      className="dropdown-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => exportToCsv()}
                    >
                      CSV
                    </li>
                  </ul>
                </div>
                <InvoiceCsv data={exportTabData} csvLinkRef={csvLinkRef} />
                {authrztn.includes("Invoices-Add") && (
                  <Link
                    to="/sales/create-invoice"
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> Create
                  </Link>
                )}
              </div>
            </div>
          </div>
          <CurrencySelector
            setWidgetCurrencySymbol={setWidgetCurrencySymbol}
            fetchCutOff={fetchCutOff}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            // setCurrentPage={pagination.setCurrentPage}
            style={{ maxWidth: "8.5rem" }}
          />
          <div className="position-relative container-fluid">
            {/* Widgets */}
            <div className="mt-3 mb-4" ref={containerRef}>
              {widgetList.map((item, index) => (
                <div
                  className="d-flex mb-3"
                  key={index}
                  ref={(el) => (containerItemRefs.current[index] = el)}
                >
                  {/* Widget Column #1 */}
                  <div className="col-sm w-100 ps-3 pe-2 payable-card">
                    <div
                      className="d-flex align-items-center justify-content-between w-100 border p-3 shadow-sm rounded hover-card"
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      onClick={
                        item.widgetOneTitle === "Last Cutoff Receivable"
                          ? handleShow
                          : undefined
                      }
                    >
                      <div className="d-flex flex-row align-items-center gap-2 text-secondary">
                        <i class="bx bx-bar-chart-alt fs-4"></i>
                        <h3 className="fs-6 mb-0">{item.widgetOneTitle}</h3>
                      </div>

                      <div className="d-flex text-nowrap payable-card-desc">
                        <h1
                          className="text-nowrap mb-0 fs-5 fw-bold"
                          style={{
                            color: "orange",
                            fontSize: "2rem",
                            cursor: "pointer",
                          }}
                          title={item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        >
                          {!item.widgetOneTitle?.includes("Kilo") &&
                            widgetCurrencySymbol}{" "}
                          {item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                          {/* {widgetCurrencySymbol}{" "}
                      {widget.lastCutOffReceivable
                        ? compactNumberFormat(widget.lastCutOffReceivable)
                        : "0.00"} */}
                        </h1>
                      </div>
                    </div>
                  </div>

                  {/* Widget Column #2 */}
                  <div
                    className={`col-sm w-100 px-2 payable-card ${
                      !item.widgetTwoTitle && "d-none"
                    }`}
                  >
                    <div
                      className="d-flex align-items-center justify-content-between w-100 border p-3 shadow-sm rounded hover-card"
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                    >
                      <div className="d-flex gap-2 flex-row align-items-center text-secondary">
                        <i class="bx bx-money-withdraw fs-4"></i>
                        <h3 className="fs-6 mb-0">{item.widgetTwoTitle}</h3>
                      </div>

                      <div className="d-flex flex-column text-nowrap payable-card-desc">
                        <h1
                          // className="payable-amount"
                          className="text-nowrap mb-0 fs-5 fw-bold"
                          style={{
                            color: "green",
                            fontSize: "2rem",
                            cursor: "pointer",
                          }}
                          title={item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        >
                          {!item.widgetTwoTitle?.includes("Kilo") &&
                            widgetCurrencySymbol}{" "}
                          {item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                          {/* {widgetCurrencySymbol}{" "}
                      {widget.currentSalesTotal
                        ? compactNumberFormat(widget.currentSalesTotal)
                        : "0.00"} */}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Widget Controls */}
            {/* <div className="px-3 widget-control text-muted">
              {widgetList.map((_, index) => (
                <span
                  className="rounded fs-5"
                  style={{ cursor: "pointer" }}
                  onClick={() => scrollToIndex(index)}
                >
                  {visible[index] ? "●" : "○"}
                </span>
              ))}
            </div> */}

            <div className="row mx-auto mt-2">
              {/* <div className="col-sm mb-2">
                <label htmlFor="">Currency</label>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Currency
                  </option>
                  {currency_db.map((data) => (
                    <option value={data.id}>{data.currency_name}</option>
                  ))}
                </select>
              </div> */}
              {/* <div className="col-sm-12 col-md-2">
                <span>Customer</span>
                <MultiSelect
                  options={customerOptions}
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  labelledBy="Select Customer"
                  filterOptions={(options, filter) => {
                    setCustomerSearchValue(filter);
                    return options.filter(({ label }) =>
                      label.toLowerCase().includes(filter.toLowerCase())
                    );
                  }}
                  debounceDuration={300}
                  overrideStrings={{
                    selectSomeItems: "Select Customer", // placeholder text
                    search: "Search Customer",
                  }}
                />
              </div> */}
              {/* <div className="col-12 col-md-2">
                <h6>Status</h6>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Returned">Returned</option>
                </select>
              </div> */}
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={selectedCutOff?.from}
                  endDate={selectedCutOff?.to}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <span>Cutoff</span>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  aria-label="Default select example"
                  onMouseDown={(e) => {
                    if (cutOffs?.length === 0) {
                      e.preventDefault();
                      swal({
                        icon: "warning",
                        title: "No Cutoff Found",
                        text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
                      });
                      return;
                    }
                  }}
                >
                  <option value="All">All</option>
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select> */}
              </div>
              {/* <div className="col-sm mb-2">
                <label htmlFor="">From</label>
                <div>
                  <DatePicker
                    selected={selectedCutOff?.from}
                    dateFormat="MMM/dd/yyyy"
                    className="form-control"
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">To</label>
                <div>
                  <DatePicker
                    selected={selectedCutOff?.to}
                    dateFormat="MMM/dd/yyyy"
                    className="form-control"
                    readOnly
                  />
                </div>
              </div> */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button> */}
              </div>
              <div className="col-sm"></div>
            </div>

            <div className="container-fluid mt-3">
              <RefreshContext.Provider value={statusProps}>
                <Tabs
                  transition={false}
                  mountOnEnter
                  unmountOnExit={false}
                  id="status-tabs"
                  className="mb-3"
                >
                  <Tab eventKey="pending" title="Pending">
                    <PendingStatusTab />
                  </Tab>
                  <Tab eventKey="approved" title="Approved">
                    <ApprovedStatusTab />
                  </Tab>
                  {/* <Tab eventKey="returned" title="Returned">
                    <ReturnedStatusTab />
                  </Tab> */}
                </Tabs>
              </RefreshContext.Provider>
            </div>
            {/* <div className="w-100 mt-2 container-fluid">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  // placeholder={
                  //   filterColumn === "all"
                  //     ? "Search"
                  //     : `Search by ${filterColumn}...`
                  // }
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearch}
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
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => handleFilterColumnSelect("all")}
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  {[
                    { value: "transaction_id", label: "Transaction ID" },
                    { value: "destination", label: "Destination" },
                    // { value: "customer", label: "Customer" },
                    { value: "invoice_date", label: "Invoice Date" },
                    { value: "due_date", label: "Due Date" },
                    { value: "dr_number", label: "DR Number" },
                    { value: "po_number", label: "PO Number" },
                    // { value: "currency", label: "Currency" },
                    { value: "totalAmount", label: "Total Amount" },
                    // { value: "status", label: "Status" },
                  ].map(({ value, label }) => (
                    <li key={value}>
                      <button
                        className={`dropdown-item ${
                          filterColumn === value ? "active" : ""
                        }`}
                        onClick={() => handleFilterColumnSelect(value)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div> */}
            {/* data table */}
            {/* <div
              className="w-100 mt-3 container-fluid"
              // style={{ maxWidth: "78.5vw" }}
            >
              <div className="sales-invoice-data-table">
                <DataTable
                  columns={columns}
                  data={salesData}
                  customStyles={customStyles}
                  className="dataTable"
                  onRowClicked={handleUpdateInvoice}
                />
                <PaginationControls {...pagination} />
              </div>
            </div> */}
          </div>

          {/* Last Cutoff Receivable Modal */}
          <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
            centered
            size="xl"
          >
            <Modal.Header closeButton>
              <Modal.Title>Last Cutoff Receivable</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <DataTable
                columns={modalColumns}
                data={lastCutOffReceivableModal}
                customStyles={customStyles}
                className="dataTable"
              />
              <PaginationControls {...paginationForLastCutoff} />
            </Modal.Body>
          </Modal>

          {/* PDF Preview Modal */}
          <Modal
            show={showPdfPreview}
            size="xl"
            onHide={() => setShowPdfPreview(false)}
          >
            <div className="position-relative">
              <PDFDownloadLink
                document={<InvoicePdf data={exportTabData} />}
                fileName="Invoice.pdf"
              >
                {({ blob, url, loading, error }) =>
                  loading ? (
                    <Button
                      variant="light"
                      className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
                      style={{ bottom: "7rem", left: "2rem" }}
                      disabled
                    >
                      <i className="fa-solid fa-download"></i> Preparing PDF...
                    </Button>
                  ) : (
                    <Button
                      variant="light"
                      className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
                      style={{ bottom: "7rem", left: "2rem" }}
                    >
                      <i className="fa-solid fa-download"></i> Download PDF
                    </Button>
                  )
                }
              </PDFDownloadLink>
              <PDFViewer style={{ width: "100%", height: "100vh" }}>
                <InvoicePdf data={exportTabData} />
              </PDFViewer>
            </div>
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

export const RefreshContext = createContext(0);

export default Invoice;
