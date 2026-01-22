import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { useValidPage } from "../../../../hooks/customHook/paginationHook/useValidPage";
import { compactNumberFormat } from "../../../../utils/numberFormatter";
import CurrencySelector from "../../../../components/CurrencySelector";
import { Modal, Button } from "react-bootstrap";
import ExpensesTransactionListModal from "./ExpensesTransactionListModal";
import DateRangePicker from "../../../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../../../utils/newdate";
const LocalOverseasExpensesTab = ({ authrztn, activeTab }) => {
  const userLoggedID = useDecodeToken();
  const [openModalTransaction, setOpenModalTransaction] = useState(false);

  // For currency filter
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");

  // For search filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef(null);

  // For widgets
  const [widgets, setWidgets] = useState({
    totalExpense: 0,
    totalPaid: 0,
  });

  // For cutoff filter
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  });
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off

  // For pagination
  const pagination = useServerPagination(
    BASE_URL + "/expenses/bulk/payments",
    10,
    {}
  );

  // Toggle to Local/Overseas expense tab
  const isLocal = activeTab === "local";
  const isAuthorizedToView = isLocal
    ? "LocalExpenses-View"
    : "OverseasExpenses-View";
  const isAuthorizedToAdd = isLocal
    ? "LocalExpenses-Add"
    : "OverseasExpenses-Add";

  // Get latest cutoff
  const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     setCutOffs(res.data);
    //
    //     const latestCutoff = res.data.reduce((latest, current) =>
    //       new Date(current.to) > new Date(latest.to) ? current : latest
    //     );
    //
    //     setSelectedCutOff({
    //       id: latestCutoff.id,
    //       from: new Date(latestCutoff.from),
    //       to: new Date(latestCutoff.to),
    //     });
    //     fetchPayments(latestCutoff);
    //     fetchWidgets(latestCutoff);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff({
      id: initialCutoff.id,
      from: initialCutoff.from,
      to: initialCutoff.to,
    });
    fetchPayments(initialCutoff);
    fetchWidgets(initialCutoff);
  };

  useEffect(() => {
    fetchCutOff();
  }, [currencyId, activeTab]);  

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
      fetchPayments(allCutoff);
      fetchWidgets(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: selectedItem.from,
          to: selectedItem.to,
        };

        setSelectedCutOff(cutoff);
        fetchPayments(cutoff);
        fetchWidgets(cutoff);
      }
    }

    setSearchText("");
  };

  // Get all Payments for Data table
  const fetchPayments = (cutoff) => {
    pagination.updateApiUrl(`${BASE_URL}/expenses/bulk/payments`);
    pagination.updateParams({
      domestic_type: activeTab,
      startDate: cutoff?.from,
      endDate: cutoff?.to,
      currencyId,
    });
  };

  // Handle search payments
  const handleSearch = (input) => {
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

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pagination.updateApiUrl(`${BASE_URL}/expenses/bulk/payments/search`);
      pagination.updateParams({
        domestic_type: activeTab,
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        filterColumn,
        searchText: searchInput,
        currencyId,
      });
    }, 500);
  };

  // Handle payment approval from table action
  const handleApprovePayment = async (row) => {
    try {
      // check cutoff validation for the payment date
      const cutoffResponse = await axios.get(
        `${BASE_URL}/expenses/payment/${row.id}/cutoff-validation`
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
      console.log(row);
      swal({
        icon: "warning",
        title: "Are you sure you want to approve this?",
        dangerMode: true,
        buttons: ["Cancel", "OK"],
      }).then(async (confirm) => {
        if (confirm) {
          try {
            const res = await axios.put(
              `${BASE_URL}/expenses/bulk/payments/${row.id}/approve`,
              {
                domestic_type: activeTab,
                transactionNumber: row.transactionNumber,
                paymentData: row,
                bulkExpenseId: row.bulkExpenseId,
              }
            );

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
          } catch (error) {
            console.error(error);
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Handle mouse down event for cutoff input selection
  const handleMouseDown = (e) => {
    if (cutOffs.length === 0) {
      e.preventDefault();
      swal({
        icon: "warning",
        title: "No Cutoff Found",
        text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
      });
      return;
    }
  };

  // Get total expense and total paid widgets data
  const fetchWidgets = async (cutoff) => {
    try {
      const params = {
        startDate: cutoff?.from,
        endDate: cutoff?.to,
        domestic_type: activeTab,
        currencyId,
      };

      // prettier-ignore
      const [expenseSummary = 0, paymentSummary = 0] = await Promise.allSettled([
        axios.get(`${BASE_URL}/expenses/summary/total-expense`, { params }),
        axios.get(`${BASE_URL}/expenses/summary/total-paid`, { params }),
      ]);

      setWidgets({
        totalExpense: expenseSummary?.value?.data,
        totalPaid: paymentSummary?.value?.data,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Data table columns
  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.transactionNumber,
    },
    {
      name: "Expense Type",
      selector: (row) => row.expenseTypeOne,
    },
    {
      name: "Expense Sub-Type",
      selector: (row) => row.expenseTypeTwo,
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
      selector: (row) => row.payment_status,
      cell: (row) => {
        let color;
        switch (row.payment_status) {
          case "For-Approval":
            color = "#FFA500";
            break;
          case "Paid":
            color = "#3B9F3F";
            break;
          case "Approved":
            color = "#3B9F3F";
            break;
          case "Partially-Paid":
            color = "#FFA500";
            break;
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

  // For search filter columns
  const searchFilterColumns = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "pay_bulk_expense.transaction_number",
      label: "Transaction No.",
    },
    {
      value: "pay_bulk_expenses_payment.createdAt",
      label: "Date Created",
    },
    {
      value: "date_issued",
      label: "Payment Date",
    },
    {
      value: "pay_bulk_expenses_payment.amount",
      label: "Amount",
    },
    {
      value: "payment_status",
      label: "Status",
    },
  ];

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    setSearchText("");
    pagination.setCurrentPage(1);
    fetchPayments(cutoff);
    fetchWidgets(cutoff);
  };

  return (
    <div className="h-100 py-2 w-100 bg-white ">
      {authrztn.includes(isAuthorizedToView) ? (
        <>
          <div className="w-100 d-flex flex-row justify-content-between px-2">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">{activeTab} EXPENSES</span>
              <span className="text-uppercase">
                {activeTab} accounts expense
              </span>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-end">
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
              {authrztn.includes(isAuthorizedToAdd) && (
                <Link
                  to={`/accounting/pay-expenses/${activeTab}`}
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Pay Expenses
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
            setCurrentPage={pagination.setCurrentPage}
            handleSearch={handleSearch}
            searchText={searchText}
            style={{ maxWidth: "12rem" }}
          />

          {/* Widgets */}
          <div className="row p-2 mx-auto">
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                  <h3>Total Expense</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1
                    title={widgets.totalExpense?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                  >
                    {widgetCurrencySymbol}{" "}
                    {widgets.totalExpense?.toLocaleString("en-US", {
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
                    title={widgets.totalPaid?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                  >
                    {widgetCurrencySymbol}{" "}
                    {widgets.totalPaid?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Cutoff filter */}
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={
                    selectedCutOff?.from ? new Date(selectedCutOff.from) : null
                  }
                  endDate={
                    selectedCutOff?.to ? new Date(selectedCutOff.to) : null
                  }
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <span>Cutoff</span>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  onMouseDown={handleMouseDown}
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
                <span>From</span>
                <DatePicker
                  selected={selectedCutOff?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
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

          {/* Search filter */}
          <div className="w-100 mt-4 mb-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
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
                {searchFilterColumns.map((item) => (
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === item.value ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn(item.value)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Data table */}
          <div className="w-100 mt-3 container-fluid data-table-cell-width">
            <DataTable
              columns={columns}
              data={pagination.data}
              customStyles={customStyles}
              className="dataTable"
            />
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
          <ExpensesTransactionListModal activeTab={activeTab} />
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

export default LocalOverseasExpensesTab;
