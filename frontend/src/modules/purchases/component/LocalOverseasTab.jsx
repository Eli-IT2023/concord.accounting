import DatePicker from "react-datepicker";
import { Link } from "react-router-dom";
import { compactNumberFormat } from "../../../utils/numberFormatter";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { customStyles } from "../../styles/table-style";
import { useEffect, useRef, useState } from "react";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../assets/global/url";
import CurrencySelector from "../../../components/CurrencySelector";
import { format } from "date-fns";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import ModalContentPO from "./modalLocalPOtransaction";
import NoAccess from "../../../assets/img/NoAccess.png";
import DateRangePicker from "../../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../../utils/newdate";

const LocalOverseasTab = ({ authrztn, activeTab }) => {
  // Search filter states
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef(null);
  // Widget states
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  // Cutoff filter states
  const [cutOffs, setCutOffs] = useState([]);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  });

  const [openModalTransaction, setOpenModalTransaction] = useState(false);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true);

  const pagination = useServerPagination(
    BASE_URL + "/payable/getLocalOverseasPayableBulk",
    10
  );

  const isLocal = activeTab === "local";
  const isAuthorized = isLocal ? "LocalPurchase-View" : "OverseasPurchase-View";

  // Data Table Columns
  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.payable_bulk.transaction_number,
    },
    {
      name: "Vendor",
      selector: (row) => row.payable_bulk.vendor.company_name,
    },
    {
      name: "Account Name",
      selector: (row) => row.account_list_sub3.account_name,
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
        row.payable_bulk.currency?.currency_name +
        " " +
        row.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Status",
      selector: (row) => row.payment_status,
      cell: (row) => {
        let fontColor;

        switch (row.payment_status) {
          case "For-Approval":
            fontColor = "#FFA500";
            break;
          case "Approved":
            fontColor = "#3B9F3F";
            break;
          case "Rejected":
            fontColor = "#FF0000";
            break;
          default:
            fontColor = "black";
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
          >
            {" "}
            {row.payment_status}
          </div>
        );
      },
    },
    {
      name: "Action",
      selector: (row) => {
        const isApproved = row.payment_status === "Approved";
        return (
          <div className="d-flex gap-2 align-items-center p-1">
            <div>
              <button
                onClick={() => {
                  handleApprovePayment(row);
                }}
                disabled={isApproved}
                style={{
                  opacity: isApproved ? 0.5 : 1,
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

  const searchFilterColumns = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "payable_bulk.transaction_number",
      label: "Transaction No.",
    },
    {
      value: "payable_bulk_payment.createdAt",
      label: "Date Created",
    },
    {
      value: "date_issued",
      label: "Payment Date",
    },
    {
      value: "amount",
      label: "Amount",
    },
    {
      value: "payment_status",
      label: "Status",
    },
  ];

  // For Data Table content
  const fetchPayablePayment = async (cutOff) => {
    try {
      pagination.updateApiUrl(
        `${BASE_URL}/payable/getLocalOverseasPayableBulk`
      );
      pagination.updateParams({
        startDate: cutOff?.from,
        endDate: cutOff?.to,
        domestic_type: activeTab,
        currencyId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // For Total Payable widget
  const fetchTotalPayable = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/payable/summary/total-payable`, {
        params: {
          domestic_type: activeTab,
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalPayable(res.data.totalPayable);
    } catch (error) {
      console.error(error);
    }
  };

  // For Total Paid widget
  const fetchTotalPaid = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/payable/summary/total-paid`, {
        params: {
          domestic_type: activeTab,
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalPaid(res.data.totalPaid);
    } catch (error) {
      console.error(error);
    }
  };

  // Get the latest cutoff
  const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     setCutOffs(res.data);

    //     const latestCutoff = res.data.reduce((latest, current) =>
    //       new Date(current.to) > new Date(latest.to) ? current : latest
    //     );

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff({
      id: initialCutoff.id,
      from: initialCutoff.from,
      to: initialCutoff.to,
    });

    fetchPayablePayment(initialCutoff);
    fetchTotalPaid(initialCutoff);
    fetchTotalPayable(initialCutoff);
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  };

  useEffect(() => {
    fetchCutOff();
  }, [currencyId]);

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
      fetchPayablePayment(allCutoff);
      fetchTotalPaid(allCutoff);
      fetchTotalPayable(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: selectedItem.from,
          to: selectedItem.to,
        };

        setSelectedCutOff(cutoff);
        fetchPayablePayment(cutoff);
        fetchTotalPaid(cutoff);
        fetchTotalPayable(cutoff);
      }
    }

    setSearchText("");
  };

  // Handle Payment approval
  const handleApprovePayment = async (row) => {
    try {
      // check cutoff validation for the payment date
      const cutoffResponse = await axios.get(
        `${BASE_URL}/payable/payment/${row.id}/cutoff-validation`
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
      }).then(async (confirm) => {
        if (confirm) {
          // Destructured Payable bulk transaction to get the transaction id and domestic type
          const [
            {
              payable: { domestic_type, transaction_id },
            },
          ] = row.payable_bulk.payable_bulk_transactions;

          const payableIdList = row.payable_bulk.payable_bulk_transactions.map(
            (item) => item.payable.id
          );

          const vendorId = row.payable_bulk.vendor_id;
          const currencyName = row.payable_bulk.currency.currency_name ?? "PHP";
          const currencyRate = row.payable_bulk.currency.currency_rate ?? 1;

          // Approve payment
          const res = await axios.post(`${BASE_URL}/payable/payment/approve`, {
            paymentId: row.id,
            payableIdList: payableIdList,
            module: domestic_type,
            paymentData: row,
            vendorId,
            currencyName,
            currencyRate,
          });

          // Send success message to user and then reload the table
          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Success",
              text: "Payment has been approved successfully.",
            }).then(() => {
              fetchCutOff();
            });
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    let input = e.target.value;
    let searchInput;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    const isMatchAmount = pagination.data.some((item) =>
      String(item.amount).includes(raw)
    );

    if (isMatchAmount) {
      setSearchText(formatted);
      searchInput = formatted;
    } else {
      const isNumeric = isNaN(input) ? input : raw; // To prevent removing comma for non numeric values
      setSearchText(isNumeric);
      searchInput = isNumeric;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(
        `${BASE_URL}/payable/getLocalOverseasPayableBulk/search`
      );
      pagination.updateParams({
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        domestic_type: activeTab,
        filterColumn,
        searchText: searchInput,
        currencyId,
      });
    }, 500);
  };

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    fetchPayablePayment(cutoff);
    fetchTotalPaid(cutoff);
    fetchTotalPayable(cutoff);
    setSearchText("");
  };
  return (
    <div>
      {authrztn.includes(isAuthorized) ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">
                {isLocal ? "Local" : "Overseas"} Purchase
              </span>
              <span>{isLocal ? "LOCAL" : "OVERSEAS"} ACCOUNTS PAYABLE</span>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-end mx-2">
              <span
                onClick={() => setOpenModalTransaction(true)}
                className="mx-3 text-primary"
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
              <span className="">
                {" "}
                {authrztn.includes("LocalPurchase-Add") && (
                  <Link
                    to={`/Purchases/bulk-payable/${activeTab}`}
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> Pay
                  </Link>
                )}
              </span>
            </div>
          </div>

          {/* Currency Filter */}
          <CurrencySelector
            setWidgetCurrencySymbol={setWidgetCurrencySymbol}
            fetchCutOff={fetchCutOff}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            style={{ maxWidth: "7rem", marginRight: "0.5rem" }}
          />

          <div className="container-fluid p-0">
            {/* Widgets */}
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3>Total Payable</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1
                      title={totalPayable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      style={{ cursor: "pointer", color: "#28D120" }}
                    >
                      {widgetCurrencySymbol}{" "}
                      {totalPayable?.toLocaleString("en-US", {
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
                    <h3>Total Paid</h3>
                  </div>

                  <div className=" mt-2">
                    <h1
                      style={{ cursor: "pointer", color: "#28D120" }}
                      title={totalPaid?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    >
                      {widgetCurrencySymbol}{" "}
                      {totalPaid?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Cutoff Filters */}
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={selectedCutOff?.from}
                  endDate={selectedCutOff?.to}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />

                {/* <label htmlFor="">Cutoff</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select p-2"
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
                <label htmlFor="cutoff-start-date">From</label>
                <DatePicker
                  selected={selectedCutOff?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="cutoff-end-date">To</label>
                <DatePicker
                  selected={selectedCutOff?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div> */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100"></div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="w-100 mt-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
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
                {searchFilterColumns.map((item) => (
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === item.value ? "active" : ""
                      }`}
                      onClick={() => {
                        setFilterColumn(item.value);
                        setSearchText("");
                      }}
                    >
                      {item.label}
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
              <PaginationControls {...pagination} />
            </div>
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
          <ModalContentPO
            openModalTransaction={openModalTransaction}
            setOpenModalTransaction={setOpenModalTransaction}
            activeTab={activeTab}
          />
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

export default LocalOverseasTab;
