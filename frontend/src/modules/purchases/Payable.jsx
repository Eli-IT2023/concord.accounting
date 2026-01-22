import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
} from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import DateRangePicker from "../../components/DateRangePicker"; // ADD THIS
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { useValidPage } from "../../hooks/customHook/paginationHook/useValidPage";
import { compactNumberFormat } from "../../utils/numberFormatter";
import CurrencySelector from "../../components/CurrencySelector";
import { truncateText } from "../../utils/textFormatter";

import { MultiSelect } from "react-multi-select-component";
import { useObserver } from "../../hooks/customHook/useObserver";
import { Modal, Button, Tabs, Tab } from "react-bootstrap";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import PendingStatusTab from "./component/Payable/PendingStatusTab";
import ApprovedStatusTab from "./component/Payable/ApprovedStatusTab";
import PayablePdf from "./component/Payable/payablePdf";
import PayableCsv from "./component/Payable/payableCsv";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";
import { use } from "react";

const Payable = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const backloadPagination = useServerPagination(
    `${BASE_URL}/payable/backload/products-to-return`,
    10,
  );
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger data re-fetch in child component status tabs
  const [lastCutoffPayable, setLastCutoffPayable] = useState(0);
  const [currentTotalPayable, setCurrentTotalPayable] = useState(0);
  const [currentCutoffPayable, setCurrentCutoffPayable] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalIssued, setTotalIssued] = useState(0);
  const payableTotalPages = localStorage.getItem("Payable");
  const validPage = useValidPage(payableTotalPages);

  const pagination = useServerPagination(null, 10, {}, validPage);
  const [payable, setPayable] = useState([]);
  const [cutoff, setCutoff] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState([]);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  }); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [deletionTrigger, setDeletionTrigger] = useState(false);
  const [previousPurchaseKilo, setPreviousPurchaseKilo] = useState(0);
  const [currentPurchaseKilo, setCurrentPurchaseKilo] = useState(0);
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111",
  );
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");
  const [vendorFetch, setVendorFetch] = useState([]);
  const [showReturnItemsModal, setShowReturnItemsModal] = useState(false);
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [searchTermFilter, setSearchTermFilter] = useState("");
  const debounceTimer = useRef(null);
  const handleCloseReturnItems = () => setShowReturnItemsModal(false);
  const [exportData, setExportData] = useState([]);
  const csvLinkRef = useRef();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const reloadVendorFetch = () => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((res) => {
        setVendorFetch(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // handle change select cutoff date
  const handleSelect = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === "All") {
      const earliestFrom = new Date(
        Math.min(...cutOffs.map((item) => new Date(item.from).getTime())),
      );

      const latestTo = new Date(
        Math.max(...cutOffs.map((item) => new Date(item.to).getTime())),
      );

      const allCutoff = { id: "All", from: earliestFrom, to: latestTo };

      setSelectedCutOff(allCutoff);
      getLastCutoffPayable(allCutoff);
      getCurrentTotalPayable(allCutoff);
      getCurrentCutoffPayable(allCutoff);
      getTotalDiscount(allCutoff);
      getTotalIssued(allCutoff);
      getPreviousPurchaseKilo(allCutoff);
      getCurrentPurchaseKilo(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: selectedItem.from,
          to: selectedItem.to,
        };

        setSelectedCutOff(cutoff);
        getLastCutoffPayable(cutoff);
        getCurrentTotalPayable(cutoff);
        getCurrentCutoffPayable(cutoff);
        getTotalDiscount(cutoff);
        getTotalIssued(cutoff);
        getPreviousPurchaseKilo(cutoff);
        getCurrentPurchaseKilo(cutoff);
      }
    }
  };

  const fetchCutOff = () => {
    reloadVendorFetch();

    // axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     setCutOffs(res.data);

    //     const latestCutoff = res.data.reduce((latest, current) =>
    //       new Date(current.to) > new Date(latest.to) ? current : latest
    //     );

    //     setSelectedCutOff({
    //       id: latestCutoff.id,
    //       from: new Date(latestCutoff.from),
    //       to: new Date(latestCutoff.to),
    //     });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff({
      id: initialCutoff.id,
      from: initialCutoff.from,
      to: initialCutoff.to,
    });

    getLastCutoffPayable(initialCutoff);
    getCurrentTotalPayable(initialCutoff);
    getCurrentCutoffPayable(initialCutoff);
    getTotalDiscount(initialCutoff);
    getTotalIssued(initialCutoff);
    getPreviousPurchaseKilo(initialCutoff);
    getCurrentPurchaseKilo(initialCutoff);
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  };

  useEffect(() => {
    fetchCutOff();
  }, [currencyId]);

  const columns = [
    {
      name: <div className="text-nowrap">Transaction Date</div>,
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
      cell: (row) => (
        <div className="text-nowrap text-center">
          {format(row.createdAt, "MMM/dd/yyyy, hh:mm a")}
        </div>
      ),
    },
    {
      name: "Transaction No.",
      selector: (row) => row.client_transaction_id,
      cell: (row) => (
        <div className="text-nowrap text-center">
          {row.client_transaction_id}
        </div>
      ),
    },
    {
      name: "Receiving Warehouse",
      selector: (row) => row?.warehouse?.name,
      cell: (row) => <div className="text-center">{row?.warehouse?.name}</div>,
    },
    {
      name: "Mode of Payment",
      selector: (row) =>
        row.MOP === null ? (
          <div className="text-center">No Payment Chosen</div>
        ) : (
          <div className="text-center">{row.MOP}</div>
        ),
    },
    {
      name: "Vendor",
      selector: (row) => (
        <div className="text-center">{row?.vendor?.company_name}</div>
      ),
    },
    {
      name: "Discount",
      selector: (row) => (
        <div className="text-center">{row.discount_value}</div>
      ),
    },
    {
      name: "Container Number",
      selector: (row) => row.container_number,
      cell: (row) => (
        <div
          className="text-center"
          title={row?.container_number?.length > 25 && row.container_number}
        >
          {truncateText(row?.container_number, 25) || "n/a"}
        </div>
      ),
    },
    {
      name: "Pier",
      selector: (row) => row.pier,
      cell: (row) => (
        <div className="text-center" title={row?.pier?.length > 25 && row.pier}>
          {truncateText(row?.pier, 25) || "n/a"}
        </div>
      ),
    },
    {
      name: "Destination",
      selector: (row) => row.domestic_type,
      cell: (row) => (
        <div className="text-center">
          {row.domestic_type === "local" ? "Local" : "Overseas"}
        </div>
      ),
    },
    {
      name: "Deadline",
      selector: (row) => (
        <div className="text-center">
          {row.due_date ? format(row.due_date, "MMM/dd/yyyy") : "TBA"}
        </div>
      ),
    },
    {
      name: "Purchase Date",
      selector: (row) => (
        <div className="text-center">
          {format(row.purchaseDate, "MMM/dd/yyyy")}
        </div>
      ),
    },
    {
      name: "Date Approved",
      selector: (row) =>
        row.date_approved
          ? format(row.date_approved, "MMM/dd/yyyy hh:mm a")
          : "n/a",
    },

    //commented kasi meron na sa payable ang total price or amount
    // {
    //   name: "Total Amount",
    //   cell: (row) => {
    //     let unitPrice = 0;

    //     row?.payable_products.forEach((data) => {
    //       unitPrice += data.unitPrice * data.weight;
    //     });

    //     const moisture = row?.payable_products.reduce((acc, data) => {
    //       if (data.moisture_type === "%") {
    //         return (
    //           acc +
    //           parseFloat(
    //             (data.moisture / 100) * data.unitPrice * data.weight || 0
    //           )
    //         );
    //       } else {
    //         return acc + parseFloat(data.moisture || 0);
    //       }
    //     }, 0);

    //     const totalOtherFees = row.payable_other_fees.reduce(
    //       (acc, data) => acc + parseFloat(data.fee_amount || 0),
    //       0
    //     );

    //     const calculateDiscount =
    //       row.isPercent_Discount === true
    //         ? (row.discount_value / 100) *
    //           parseFloat(
    //             unitPrice - moisture - row.weighing_fee - totalOtherFees
    //           )
    //         : row.discount_value;

    //     return (
    //       <span className="text-center">
    //         {row.currency?.currency_name}{" "}
    //         {(
    //           unitPrice -
    //           moisture -
    //           row.weighing_fee -
    //           totalOtherFees -
    //           calculateDiscount
    //         ).toLocaleString("en-US", {
    //           minimumFractionDigits: 2,
    //           maximumFractionDigits: 2,
    //         })}
    //       </span>
    //     );
    //   },
    // },
    {
      name: "Total Amount",
      selector: (row) => (
        <div className="text-center">{`${
          row.currency?.currency_name
        } ${row.totalPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}</div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let fontColor;

        switch (row.status) {
          case "Pending":
            fontColor = "#FFA500";
            break;
          case "Approved":
            fontColor = "#3B9F3F";
            break;
          case "Paid":
            fontColor = "#3B9F3F";
            break;
          case "Rejected":
            fontColor = "#FF0000";
            break;
          default:
            fontColor = "#000000"; // Default color
            break;
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: fontColor,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
            className="text-center"
          >
            {" "}
            {row.status}
          </div>
        );
      },
    },
  ];

  if (authrztn.includes("Payable-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <div>
          {/* Delete Button */}
          <i
            className="fas fa-trash text-center"
            style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
            onClick={() =>
              handleDeletePayable(row.id, row.purchaseDate, row.transaction_id)
            }
          ></i>

          {/* Return Button */}
          {row.status === "Approved" && (
            <button
              type="button"
              className="bg-transparent border-0"
              onClick={() => {
                getItemsToReturn(row.id, row.transaction_id);
                setShowReturnItemsModal(true);
              }}
              disabled={row.status !== "Approved"}
              // role="button"
            >
              <i
                className="fas fa-rotate text-center"
                style={{
                  cursor: "pointer",
                  color: "#403e92",
                  fontSize: "1.5rem",
                  opacity: row.status === "Approved" ? 1 : 0.5,
                }}
              ></i>
            </button>
          )}
        </div>
      ),
    });
  }

  const handleDeletePayable = async (
    primary_id,
    purchase_date,
    transaction_id,
  ) => {
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
            `${BASE_URL}/payable/deletePayable/`,
            {
              params: {
                primary_id,
                purchase_date,
                transaction_id,
                userLoggedID,
              },
            },
          );
          if (response.status === 200) {
            swal({
              title: "Payable Deleted Successfully!",
              text: "The payable has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchCutOff();
              setDeletionTrigger(true);
            });
          } else if (response.status === 201) {
            swal({
              title: "Delete Prohibited!",
              text: `Payable date (${response.data.purchase_date}) cannot be deleted as its payable date falls within the posted cutoff period named "${response.data.cutoff_name}".`,
              icon: "warning",
              button: "OK",
            });
          } else if (response.status === 202) {
            const { transactionNumber, moduleType } = response.data;
            let moduleFrom;
            if (moduleType === "local") {
              moduleFrom = "Local Purchase";
            } else {
              moduleFrom = "Overseas Purchase";
            }
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the purchase in module <strong>${moduleFrom}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 203) {
            const { transactionNumber } = response.data;

            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the production in module <strong>${`Productions`}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 207) {
            const { transactionNumber } = response.data;
            // console.log(response.data);
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the sales in module <strong>${`Sales Invoice`}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 208) {
            const { transactionNumber } = response.data;
            // console.log(response.data);
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the stock transfered in module <strong>${`Stock Transfer`}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
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

  const getLatestCutoff = () => {
    axios
      .get(BASE_URL + "/payable/getLatestCutoff")
      .then((res) => {
        setCutoff(res.data?.name);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(true);
      });
  };

  const getLastCutoffPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchPreviousCutoffPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      })
      .then((res) => {
        setLastCutoffPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getCurrentTotalPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchCurrentTotalPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      })
      .then((res) => {
        setCurrentTotalPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getCurrentCutoffPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchCurrentCutoffPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      })
      .then((res) => {
        setCurrentCutoffPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getTotalDiscount = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchTotalDiscount", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      })
      .then((res) => {
        setTotalDiscount(res.data.totalDiscount);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getTotalIssued = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/summary/total-issued", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      })
      .then((res) => {
        setTotalIssued(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getPreviousPurchaseKilo = async (cutoff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/payable/fetchPreviousPurchaseKilo`,
        {
          params: {
            startDate: cutoff?.from,
            currencyId,
          },
        },
      );
      const { previousPurchaseKilo } = res.data;
      setPreviousPurchaseKilo(previousPurchaseKilo);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentPurchaseKilo = async (cutoff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/payable/fetchCurrentPurchaseKilo`,
        {
          params: {
            startDate: cutoff?.from,
            endDate: cutoff.to,
            currencyId,
          },
        },
      );
      const { currentPurchaseKilo } = res.data;
      setCurrentPurchaseKilo(currentPurchaseKilo);
    } catch (error) {
      console.error(error);
    }
  };

  const getItemsToReturn = (payableId, payableTransactionNumber) => {
    try {
      backloadPagination.updateParams({
        payableId,
        payableTransactionNumber,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReturnProduct = async (product) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/payable/backload/return-product`,
        {
          product,
        },
      );

      if (res.status === 200) {
        swal({
          icon: "success",
          title: "Return Successful",
          text: "Product has been returned.",
          timer: 2000,
          buttons: false,
        }).then(() => {
          getItemsToReturn(product.payableId, product.payableTransactionNumber);
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const totalStock = error.response.data.totalStock;
        const wrapper = document.createElement("div");
        wrapper.classList.add("center-swal-text");
        wrapper.innerHTML = `The return quantity exceeds the available stock <strong>(${totalStock.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )})</strong>`;
        swal({
          icon: "error",
          title: "Invalid Quantity To Return",
          content: wrapper,
        });
      }

      console.error(error);
    }
  };

  const vendorDataFilter = vendorFetch.map((option) => ({
    value: option.id,
    label: option.company_name || option.first_name + " " + option.last_name,
  }));

  const widgetList = [
    {
      // Column 1
      widgetOneTitle: "Last cut-off Payable",
      widgetOneAmount: lastCutoffPayable,
      // Column 2
      widgetTwoTitle: "Current Total Payable",
      widgetTwoAmount: currentTotalPayable,
    },
    {
      // Column 1
      widgetOneTitle: "Total Discount",
      widgetOneAmount: totalDiscount,
      // Column 2
      widgetTwoTitle: "Total Issued",
      widgetTwoAmount: totalIssued,
    },
    {
      // Column 1
      widgetOneTitle: "Current cut-off Payable",
      widgetOneAmount: currentCutoffPayable,
      // Column 2
      widgetTwoTitle: "Current Month Purchase Kilo",
      widgetTwoAmount: currentPurchaseKilo,
    },
    {
      // Column 1
      widgetOneTitle: "Previous Month Purchase Kilo",
      widgetOneAmount: previousPurchaseKilo,
    },
  ];

  const statusProps = {
    selectedCutOff,
    currencyId,
    vendorDataFilter,
    setSearchTermFilter,
    columns,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      getLatestCutoff();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (backloadPagination.data) {
      setItemsToReturn(
        backloadPagination.data.map((item) => {
          const payableId = item.payable_id;
          const payableTransactionNumber = item.payable.transaction_id;
          const productId = item.product_tag_vendor.product_list.product_id;
          const productCode = item.product_tag_vendor.product_list.product_code;
          const productName = item.product_tag_vendor.product_list.product_name;
          const moisture = item.moisture;
          const unitPrice = item.unitPrice;
          const netWeight = item.net_weight;
          const static_netWeight = item.static_net_weight;
          return {
            payableId,
            payableTransactionNumber,
            productId,
            productCode,
            productName,
            quantity: netWeight,
            moisture,
            quantityToReturn: "",
            unitPrice,
            netWeight,
            static_netWeight,
          };
        }),
      );
    }
  }, [backloadPagination.data]);

  // Fetch vendors when searchTerm changes (debounced)
  useEffect(() => {
    if (searchTermFilter.trim() === "") {
      reloadVendorFetch();
      return;
    }

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(BASE_URL + "/vendors/fetchVendors", {
          params: { search: searchTermFilter, limit: 5 },
        });
        setVendorFetch(data);
        console.log("Fetched vendors:", data);
      } catch (error) {
        console.error(error);
      }
    }, 600);

    // Cleanup timer on unmount or searchTermFilter change
    return () => clearTimeout(debounceTimer.current);
  }, [searchTermFilter]);

  // Export PDF
  const exportToPdf = async () => {
    swal({
      icon: "warning",
      title: "Export to PDF?",
      text: "Do you want to export this data as a PDF file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const [pendingRes, approvedRes] = await Promise.all([
          axios.get(`${BASE_URL}/payable/fetchPayableSs`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              currencyId,
              status: "Pending",
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/payable/fetchPayableSs`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              currencyId,
              status: "Approved",
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportData({
          Pending: pendingRes.data.data || [],
          Approved: approvedRes.data.data || [],
        });
        setShowPdfPreview(true);
      }
    });
  };

  // Export CSV
  const exportToCsv = async () => {
    swal({
      icon: "warning",
      title: "Export to CSV?",
      text: "Do you want to export this data as a CSV file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        const [pendingRes, approvedRes] = await Promise.all([
          axios.get(`${BASE_URL}/payable/fetchPayableSs`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              currencyId,
              status: "Pending",
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/payable/fetchPayableSs`, {
            params: {
              startDate: selectedCutOff?.from,
              endDate: selectedCutOff?.to,
              currencyId,
              status: "Approved",
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportData({
          Pending: pendingRes.data.data || [],
          Approved: approvedRes.data.data || [],
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
    getLastCutoffPayable(cutoff);
    getCurrentTotalPayable(cutoff);
    getCurrentCutoffPayable(cutoff);
    getTotalDiscount(cutoff);
    getTotalIssued(cutoff);
    getPreviousPurchaseKilo(cutoff);
    getCurrentPurchaseKilo(cutoff);
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
      ) : authrztn.includes("Payable-View") ? (
        <>
          <div className="w-100 p-2 mb-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">
                PAYABLE
                {/* -- {cutoff} */}
              </span>
            </div>

            <div className="d-flex flex-row">
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
              <PayableCsv data={exportData} csvLinkRef={csvLinkRef} />

              <div>
                {authrztn.includes("Payable-Add") && (
                  <Link
                    to="/purchases/create_payable"
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
            // handleSearch={handleSearch}
            searchText={searchText}
            style={{ maxWidth: "8.5rem" }}
          />
          <div className="container-fluid position-relative">
            {/* Widgets */}
            <div className="mt-3 mb-4">
              {widgetList.map((item, index) => (
                <div className="d-flex mb-3" key={index}>
                  {/* Widget Column #1 */}
                  <div className="col-sm w-100 ps-3 pe-2 payable-card">
                    <div
                      className="d-flex align-items-center justify-content-between w-100 p-3 border shadow-sm rounded hover-card"
                      style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                    >
                      <div className="d-flex flex-row align-items-center gap-2">
                        <i className="bx bx-bar-chart-alt fs-4 text-secondary"></i>
                        <h3 className="fs-6 mb-0 text-secondary">
                          {item.widgetOneTitle}
                        </h3>
                      </div>

                      <div className="d-flex align-items-center flex-column payable-card-desc">
                        <h1
                          className="text-nowrap fs-5 mb-0 fw-bold"
                          style={{ cursor: "pointer", color: "#28D120" }}
                          title={item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        >
                          {!item.widgetOneTitle?.includes("Kilo") &&
                            widgetCurrencySymbol}
                          {item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
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
                      className="d-flex align-items-center justify-content-between w-100 p-3 border shadow-sm rounded hover-card"
                      style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                    >
                      <div className="d-flex gap-2 flex-row align-items-center">
                        <i className="bx bx-wallet fs-4 text-secondary"></i>
                        <h3 className="fs-6 mb-0 text-secondary">
                          {item.widgetTwoTitle}
                        </h3>
                      </div>

                      <div>
                        <h1
                          className="text-nowrap fs-5 mb-0 fw-bold"
                          style={{ cursor: "pointer", color: "#28D120" }}
                          title={item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        >
                          {!item.widgetTwoTitle?.includes("Kilo") &&
                            widgetCurrencySymbol}
                          {item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cutoff filter */}
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={selectedCutOff?.from}
                  endDate={selectedCutOff?.to}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <label htmlFor="vendor">Cutofaf</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  onMouseDown={(e) => {
                    if (cutOffs.length === 0) {
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
                <label htmlFor="fromDate">From</label>
                <DatePicker
                  selected={selectedCutOff?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="toDate">To</label>
                <DatePicker
                  selected={selectedCutOff?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div> */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100"></div>
              <div className="col-sm"></div>
            </div>

            {/* Status tabs */}
            <div className="container-fluid mt-3">
              <RefreshContext.Provider value={refreshKey}>
                <Tabs
                  transition={false}
                  mountOnEnter
                  unmountOnExit={false}
                  id="status-tabs"
                  className="mb-3"
                >
                  <Tab eventKey="pending" title="Pending">
                    <PendingStatusTab {...statusProps} />
                  </Tab>
                  <Tab eventKey="approved" title="Approved">
                    <ApprovedStatusTab {...statusProps} />
                  </Tab>
                </Tabs>
              </RefreshContext.Provider>
            </div>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* PO Backload Modal */}
      <Modal
        show={showReturnItemsModal}
        onHide={handleCloseReturnItems}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold">Backload</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="overflow-auto">
            <div
              style={{ maxHeight: "80vh", overscrollBehaviorBlock: "contain" }}
              className="overflow-auto"
            >
              <table className="table table-bordered table-striped table-responsive text-center text-nowrap">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Moisture</th>
                    <th>Net Weight</th>
                    <th>Quantity to Return</th>
                    <th>Returned</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <TransitionGroup component={null}>
                    {itemsToReturn.map((item, index) => {
                      return (
                        <CSSTransition
                          key={index}
                          timeout={300}
                          classNames="table-row"
                        >
                          <tr key={index}>
                            <td className="align-middle">{item.productCode}</td>
                            <td className="align-middle">{item.productName}</td>
                            <td className="align-middle">
                              {item.quantity.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="align-middle">{item.moisture}%</td>
                            <td className="align-middle">
                              {item.netWeight.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="align-middle">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="0.00"
                                value={item.quantityToReturn}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  let inputValue = String(value).replace(
                                    /[^0-9.]/g,
                                    "",
                                  );

                                  let [integerPart, decimalPart] =
                                    inputValue.split(".");

                                  if (integerPart) {
                                    integerPart = integerPart.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ",",
                                    );
                                  }
                                  let formattedValue =
                                    decimalPart !== undefined
                                      ? `${integerPart}.${decimalPart}`
                                      : integerPart;

                                  const cleanedValue = formattedValue.replace(
                                    /^0+,|^0+/,
                                    "",
                                  ); // Remove leading zeros and comma

                                  setItemsToReturn((prev) => {
                                    const updatedItems = prev.map(
                                      (returnItem, returnItemIndex) => {
                                        if (returnItemIndex !== index)
                                          return returnItem;

                                        return {
                                          ...returnItem,
                                          quantityToReturn: cleanedValue,
                                        };
                                      },
                                    );

                                    return updatedItems;
                                  });
                                }}
                              />
                            </td>
                            <td className="align-middle">
                              {(
                                parseFloat(item.static_netWeight) -
                                parseFloat(item.quantity)
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  const parseNumber = (num) =>
                                    parseFloat(
                                      String(num || 0).replace(/,/g, ""),
                                    );

                                  if (!parseNumber(item.quantityToReturn)) {
                                    swal({
                                      icon: "warning",
                                      title: "Invalid Quantity To Return",
                                      text: "Quantity to Return should be greater than zero.",
                                    });
                                    return;
                                  }

                                  swal({
                                    icon: "warning",
                                    title: "Confirm Product Return",
                                    text: "Are you sure you want to return this product? This action cannot be undone.",
                                    buttons: ["Cancel", "Yes, Return"],
                                    dangerMode: true,
                                  }).then(async (confirm) => {
                                    if (confirm) {
                                      await handleReturnProduct(item);
                                    }
                                  });
                                }}
                              >
                                Return
                              </button>
                            </td>
                          </tr>
                        </CSSTransition>
                      );
                    })}
                  </TransitionGroup>
                </tbody>
              </table>
            </div>
            <div className="pb-2">
              <PaginationControls {...backloadPagination} />
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* PDF Modal Preview */}
      <Modal
        show={showPdfPreview}
        size="xl"
        onHide={() => setShowPdfPreview(false)}
      >
        <div className="position-relative">
          <PDFDownloadLink
            document={<PayablePdf data={exportData} />}
            fileName={`Payable List.pdf`}
          >
            <Button
              variant="light"
              className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
              style={{ bottom: "7rem", left: "2rem" }}
            >
              <i className="fa-solid fa-download"></i>
            </Button>
          </PDFDownloadLink>
          <PDFViewer style={{ width: "100%", height: "100vh" }}>
            <PayablePdf data={exportData} />
          </PDFViewer>
        </div>
      </Modal>
    </div>
  );
};

export const RefreshContext = createContext(0);

export default Payable;
