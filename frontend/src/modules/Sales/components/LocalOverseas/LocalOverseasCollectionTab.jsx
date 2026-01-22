import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import DateRangePicker from "../../../../components/DateRangePicker";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import {
  PaginationControls,
  usePagination,
} from "../../../../hooks/customHook/paginationHook/usePagination";
import { useValidPage } from "../../../../hooks/customHook/paginationHook/useValidPage";
import { compactNumberFormat } from "../../../../utils/numberFormatter";
import CurrencySelector from "../../../../components/CurrencySelector";
import SalesTransactionListModal from "./SalesTransactionListModal";
import { Button, Modal } from "react-bootstrap";
import {
  getMonthBoundaries,
  initializeCutoff,
} from "../../../../utils/newdate";

const LocalOverseasCollectionTab = ({ authrztn, activeTab }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [openModalTransaction, setOpenModalTransaction] = useState(false);

  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true);

  // For search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef();

  // For cutoff filter
  const [cutOffs, setCutOffs] = useState([]);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  });

  // For currency filter
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );

  // For Widgets
  const [widgets, setWidgets] = useState({
    totalReceivable: 0,
    totalClaimed: 0,
  });

  const isLocal = activeTab === "local";
  const isAuthorizedToAdd = isLocal
    ? "LocalCollections-Add"
    : "OverseasCollections-Add";
  const isAuthorizedToView = isLocal
    ? "LocalCollections-View"
    : "OverseasCollections-View";

  const pagination = useServerPagination(
    BASE_URL + "/bulkcollection/collection-payment",
    10
  );

  // Data table column
  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.transactionNumber,
    },
    {
      name: "Customer",
      selector: (row) => row.customerName,
    },
    {
      name: "Account Name",
      selector: (row) => row.accountName,
    },
    {
      name: "Check Number",
      selector: (row) => row.check_number || "--",
    },
    {
      name: "Date Created",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
    },
    {
      name: "Payment Date",
      selector: (row) => format(row.date_issued, "MMM/dd/yyyy"),
    },
    {
      name: "Amount",
      selector: (row) =>
        `${row.currencyName} ${row.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let textColor = "";
        let fontWeight = "bold";
        let displayStatus = row.status; // Default to the original status

        switch (row.status) {
          case "Pending":
            textColor = "orange";
            break;
          case "Approved":
            textColor = "green";
            break;
          case "Rejected":
            textColor = "red";
            break;
          case "Claimed":
            textColor = "green";
            break;
          default:
            textColor = "black";
        }

        return (
          <div
            style={{
              color: textColor,
              fontWeight: fontWeight,
              padding: "5px",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            {displayStatus}
          </div>
        );
      },
    },
    {
      name: "Action",
      selector: (row) => {
        const isPending = row.status === "Pending";
        return (
          <div className="d-flex gap-2 align-items-center p-1">
            <div>
              <button
                onClick={() => {
                  handleApprovePayment({
                    id: row.id,
                    paymentType: row.payment_type,
                    paymentData: row,
                  });
                }}
                disabled={!isPending}
                style={{
                  opacity: isPending ? 1 : 0.5,
                }}
                className="border-0 bg-transparent"
              >
                <i
                  className="fa-solid fa-circle-check"
                  style={{
                    cursor: "pointer",
                    color: "green",
                    fontSize: "1.5rem",
                  }}
                ></i>
              </button>
            </div>
            <div className="d-none">
              <i
                className="fas fa-trash"
                role="button"
                style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
              ></i>
            </div>
          </div>
        );
      },
    },
  ];

  // Search filter column options
  const searchFilterColumns = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "bulk_collection.transaction_number",
      label: "Transaction No.",
    },
    {
      value: "bulk_collection_payment.createdAt",
      label: "Date Created",
    },
    {
      value: "date_issued",
      label: "Payment Date",
    },
    {
      value: "bulk_collection_payment.amount",
      label: "Amount",
    },
    {
      value: "bulk_collection_payment.status",
      label: "Status",
    },
  ];

  // Handle change select cutoff date
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
      fetchSalesInvoiceData(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: selectedItem.from,
          to: selectedItem.to,
        };

        setSelectedCutOff(cutoff);
        fetchSalesInvoiceData(cutoff);
        fetchCollectionWidgets(cutoff);
      }
    }

    setSearchTerm("");
  };

  // Get latest cutoff
  const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/invoice/getCutoffForDisplay")
    //   .then((res) => {
    //     setCutOffs(res.data);

    // const latestCutoff = res.data?.reduce((latest, current) =>
    //   new Date(current.to) > new Date(latest.to) ? current : latest
    // );

    // setSelectedCutOff({
    //   id: latestCutoff.id,
    //   from: new Date(latestCutoff.from),
    //   to: new Date(latestCutoff.to),
    // });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    fetchSalesInvoiceData(initialCutoff);
    fetchCollectionWidgets(initialCutoff);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  useEffect(() => {
    fetchCutOff();
  }, [currencyId]);

  // Get data table contents
  const fetchSalesInvoiceData = (cutOff) => {
    pagination.updateApiUrl(BASE_URL + "/bulkcollection/collection-payment");
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      domestic_type: activeTab,
      currencyId,
    });
  };

  // Get data of widgets
  const fetchCollectionWidgets = async (cutoff) => {
    try {
      const params = {
        startDate: cutoff?.from,
        endDate: cutoff?.to,
        domestic_type: activeTab,
        currencyId,
      };

      const [receivableSummary, paymentSummary] = await Promise.all([
        axios.get(`${BASE_URL}/invoice/summary/total-receivable`, { params }),
        axios.get(`${BASE_URL}/invoice/summary/total-claimed`, { params }),
      ]);

      setWidgets({
        totalReceivable: receivableSummary.data,
        totalClaimed: paymentSummary.data,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Handle search filter change
  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
  };

  // Handle search change
  const handleSearch = (e) => {
    let input = e.target.value;
    let searchInput = "";

    const raw = String(input).replace(/,/g, ""); // Remove commas

    const [intPart, decimalPart] = raw.split(".");

    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas to integer part

    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas; // Join back decimal part if it exists

    const isAmountMatch = pagination.data.some((item) =>
      String(item.amount).includes(raw)
    );

    if (isAmountMatch) {
      setSearchTerm(formatted);
      searchInput = formatted;
    } else {
      const isNumeric = isNaN(input) ? input : raw; // To prevent removing comma for non numeric values
      setSearchTerm(isNumeric);
      searchInput = isNumeric;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(
        `${BASE_URL}/bulkcollection/collection-payment/search`
      );
      pagination.updateParams({
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        domestic_type: activeTab,
        currencyId,
        searchText: searchInput,
        filterColumn,
      });
    }, 500);
  };

  // Table action: Handle payment approval
  const handleApprovePayment = async ({ id, paymentType, paymentData }) => {
    try {
      // check cutoff validation for the payment date
      const cutoffResponse = await axios.get(
        `${BASE_URL}/invoice/payment/${id}/cutoff-validation`
      );
      const { isPosted, cutoffExists } = cutoffResponse.data;

      // Show alert if cutoff is posted
      if (isPosted) {
        return swal({
          icon: "error",
          title: "Action Prohibited",
          text: "Action is prohibited as the Payment date has already been posted.",
        });
      }

      // Show alert if cutoff doesn't exist
      if (!cutoffExists) {
        return swal({
          icon: "error",
          title: "Action Prohibited",
          text: "Action is prohibited as the Payment date has not been created.",
        });
      }

      // If cutoff validation passes, show confirmation modal
      swal({
        icon: "warning",
        title: "Are you sure you want to approve this?",
        dangerMode: true,
        buttons: ["Cancel", "OK"],
      }).then(async (confirmed) => {
        if (confirmed) {
          try {
            const res = await axios.put(
              `${BASE_URL}/invoice/payment/${id}/approve`,
              {
                paymentType,
                subject3: paymentData.subject3,
                amount: paymentData.amount,
                issuedDate: paymentData.date_issued,
                checkNumber: paymentData.check_number,
                refNumber: paymentData.ref_number,
                moduleType: `${paymentData.domesticType} Collection`,
                transactionNumber: paymentData.transactionNumber,
                bulkCollectionId: paymentData.bulkCollectionId,
                transactionDate: paymentData.transactionDate,
                customerId: paymentData.customerId,
                currencyName: paymentData.currencyName ?? "PHP",
                currencyRate: paymentData.currencyRate ?? 1,
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Success",
                text: "Payment has been approved successfully.",
              }).then(() => {
                fetchCutOff();
              });
            }
          } catch (error) {
            if (error && error.response.status === 404) {
              swal({
                icon: "error",
                title: "Payment Not Found",
                text: "The payment record you're trying to approve does not exist.",
              });
            }
            console.error(error);
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    fetchSalesInvoiceData(cutoff);
    fetchCollectionWidgets(cutoff);
    setSearchTerm(""); // Reset search when date changes
  };

  return (
    <div className="h-100 w-100 bg-white custom-container">
      {authrztn.includes(isAuthorizedToView) ? (
        <>
          <div className="w-100 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">
                {activeTab === "local" ? "collection" : "receivable"}
              </span>
              <span className="text-uppercase">
                {activeTab === "local"
                  ? "local accounts collection"
                  : "overseas accounts receivable"}
              </span>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-end">
              <span
                onClick={() => setOpenModalTransaction(true)}
                className="mx-2 text-primary"
                title="Transaction Lists"
                style={{
                  textDecoration: "underline",
                  display: "inline-block",
                  transition: "transform 0.2s ease-in-out",
                  cursor: "pointer",
                  opacity: 1, // Key change: use opacity
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                Transaction List
              </span>
              {authrztn.includes(isAuthorizedToAdd) && (
                <Link
                  to={`/sales/${activeTab}-bulk-collection`}
                  className="btn btn-primary d-flex flex-row align-items-center title-button mx-2"
                >
                  <i className="bx bx-plus fs-5"></i> Bulk Receivable
                </Link>
              )}
            </div>
          </div>

          {/* Currency filter */}
          <CurrencySelector
            setWidgetCurrencySymbol={setWidgetCurrencySymbol}
            fetchCutOff={fetchCutOff}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            style={{ maxWidth: "13rem" }}
          />

          <div className="container-fluid mt-0 p-0">
            {/* Widget */}
            <div className="row mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3>Total Receivable</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1
                      title={widgets.totalReceivable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      style={{ cursor: "pointer", color: "#28D120" }}
                    >
                      {widgetCurrencySymbol}{" "}
                      {widgets.totalReceivable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-wallet fs-3 h-100"></i>
                    <h3>Total Claimed</h3>
                  </div>

                  <div className=" mt-2">
                    <h1
                      style={{ cursor: "pointer", color: "#28D120" }}
                      title={widgets.totalClaimed?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    >
                      {widgetCurrencySymbol}{" "}
                      {widgets.totalClaimed?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Cutoff filter */}
            <div className="row mx-auto mt-2">
              <div className="col-12 col-md-3">
                <DateRangePicker
                  startDate={selectedCutOff?.from}
                  endDate={selectedCutOff?.to}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <h6>Cutoff</h6>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  aria-label="Default select example"
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
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100"></div>
              <div className="col-sm"></div>
            </div>
          </div>

          {/* Search filter */}
          <div className="w-100 mt-2 mb-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
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
                {searchFilterColumns.map(({ value, label }) => (
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
          </div>

          {/* Data table */}
          <div className="w-100 mt-3 container-fluid">
            <div className="data-table-cell-width">
              <DataTable
                columns={columns}
                data={pagination.data}
                customStyles={customStyles}
                className="dataTable"
              />
            </div>
            <PaginationControls {...pagination} />
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* Transaction List Modal */}
      <Modal
        show={openModalTransaction}
        onHide={() => setOpenModalTransaction(false)}
        backdrop="static"
        keyboard={false}
        dialogClassName="custom-modal-vw90"
      >
        <Modal.Header closeButton>
          <Modal.Title>Transaction List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SalesTransactionListModal activeTab={activeTab} />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setOpenModalTransaction(false)}
          >
            Close
          </Button>
          {/* <Button variant="primary">Understood</Button> */}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LocalOverseasCollectionTab;
