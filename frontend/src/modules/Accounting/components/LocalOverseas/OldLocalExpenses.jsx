import React, { useState, useEffect, useCallback } from "react";
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

const LocalExpenses = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  // filter
  function formatDatetime(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletionTrigger, setDeletionTrigger] = useState(false);
  const localExpenseTotalPages = localStorage.getItem("Local-Expense");
  const validPage = useValidPage(localExpenseTotalPages);
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [payExpensesData, setExpensesData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  const handleCutoffChange = (value) => {
    let filteredCutoff;
    if (value === "All Cutoff" || !value) {
      const ascendingSortedCutoff = cutOffs.sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );
      filteredCutoff = {
        from: ascendingSortedCutoff[ascendingSortedCutoff.length - 1]?.from,
        to: ascendingSortedCutoff[0]?.to,
      };
    } else {
      [filteredCutoff] = cutOffs.filter((item) => {
        return item.id == value;
      });
    }
    return filteredCutoff;
  };

  // handle change select cutoff date
  const handleSelect = (e) => {
    const filteredCutoff = handleCutoffChange(e.target.value);
    const params = new URLSearchParams(searchParams);
    params.set("page", 1);
    setSearchParams(params);
    pagination.setCurrentPage(1);
    setSearchText("");

    setSelectedCutOff(filteredCutoff);
    fetchLocalPayExpenses(filteredCutoff);
    fetchTotalExpense(filteredCutoff);
    fetchTotalPaid(filteredCutoff);
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/cutoff/getCutoffs")
      .then((res) => {
        let defaultCutOff = res.data[0];
        // get the latest date for default cut off
        for (let index = 1; index < res.data.length; index++) {
          if (res.data[index].to > defaultCutOff.to) {
            defaultCutOff = res.data[index];
          }
        }
        if (selectedCutOff) {
          const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

          setSelectedCutOff(filteredCutoff); // set default cut off
          fetchLocalPayExpenses(filteredCutoff);
          fetchTotalExpense(filteredCutoff);
          fetchTotalPaid(filteredCutoff);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          fetchLocalPayExpenses(defaultCutOff);
          fetchTotalExpense(defaultCutOff);
          fetchTotalPaid(defaultCutOff);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const pagination = useServerPagination(
    BASE_URL + "/paylocalexpenses/payLocalOverseasExpensesTable",
    10,
    {},
    validPage
  );

  const fetchLocalPayExpenses = (cutOff) => {
    pagination.updateApiUrl(
      `${BASE_URL}/paylocalexpenses/payLocalOverseasExpensesTable`
    );
    pagination.updateParams({
      foreign_url: "Local Expenses",
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      currencyId,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/paylocalexpenses/payLocalExpensesDataFetching", {
    //     params: {
    //       foreign_url: "Local Expenses",
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setExpensesData(res.data);
    //     setIsLoading(false);
    //     console.log(res.data);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  const handleSearch = (input) => {
    // let input = e.target.value;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    if (
      payExpensesData.find(
        (item) =>
          Number(item.totalExpenses.toPrecision(17)).toString().includes(raw) ||
          item.totalExpenses.toFixed(17).includes(raw)
      )
    ) {
      setSearchText(formatted);
    } else {
      setSearchText(raw);
    }

    pagination.updateApiUrl(
      `${BASE_URL}/paylocalexpenses/payLocalOverseasExpensesForSearch`
    );
    pagination.updateParams({
      foreign_url: "Local Expenses",
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      filterColumn,
      searchText: input,
      currencyId,
    });
    setIsLoading(false);
  };

  const fetchTotalExpense = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/fetchTotalExpense`, {
        params: {
          domestic_type: "local",
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalExpense(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTotalPaid = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/fetchTotalPaid`, {
        params: {
          domestic_type: "local",
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalPaid(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   // Get the current date in the Philippines timezone
  //   const currentDate = moment().tz("Asia/Manila");

  //   // Get the first date of the current month
  //   const firstDay = currentDate.clone().startOf("month");
  //   setFromDate(firstDay.format("YYYY-MM-DD"));

  //   // Get the last date of the current month
  //   const lastDay = currentDate.clone().endOf("month");
  //   setToDate(lastDay.format("YYYY-MM-DD"));
  // }, []);

  // useEffect(() => {
  //   //check calculations if tugma na ba sa widgets
  //   if (fromDate && toDate) {
  //     axios
  //       .get(`${BASE_URL}/expenses/fetch_data`, {
  //         params: {
  //           type: "Local",
  //           fromDate,
  //           toDate,
  //         },
  //       })
  //       .then((res) => {
  //         setExpensesData(res.data);
  //       });
  //   }
  // }, [fromDate, toDate]);

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_number,
    },
    // {
    //   name: "Amount",
    //   selector: (row) =>
    //     `${
    //       row?.pay_bulk_expenses_transactions[0]?.expense.currency
    //         ?.currency_name || row?.currencyName
    //     }` +
    //       " " +
    //       row.totalExpenses.toLocaleString("en-US", {
    //         minimumFractionDigits: 2,
    //         maximumFractionDigits: 2,
    //       }) || "0.00",
    // },
    {
      name: "Amount",
      selector: (row) => {
        const currency =
          row?.pay_bulk_expenses_transactions?.[0]?.expense?.currency
            ?.currency_name ||
          row?.currencyName ||
          "";

        const total = row?.totalExpenses
          ? row.totalExpenses.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "0.00";

        return `${currency} ${total}`;
      },
    },

    {
      name: "Date Requested",
      selector: (row) => format(row.pay_date, "MMM/dd/yyyy"),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;
        switch (row.status) {
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
            {row.status}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("LocalExpenses-Delete")) {
    columns.push({
      name: "ACTION",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() =>
            handleDeleteLocalExpenses(
              row.id,
              row.pay_date,
              row.transaction_number
            )
          }
        ></i>
      ),
    });
  }

  const handleDeleteLocalExpenses = async (
    localExpensesId,
    localExpensesDate,
    transaction_id
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
            `${BASE_URL}/paylocalexpenses/deleteLocalOverseasExpenses/${localExpensesId}/${localExpensesDate}`,
            {
              data: {
                userLoggedID: userLoggedID,
                moduleFrom: "Overseas",
                transaction_id,
              },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Local Expenses Deleted Successfully!",
              text: "The local expenses has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchLocalPayExpenses();
              fetchCutOff();
              setDeletionTrigger(true);
            });
          } else if (response.status === 203) {
            const { transactionNumber } = response.data;
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first all data in module <strong>Bank Transaction/Issued Check</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 202) {
            const { expensesLocalDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Local Expenses cannot be deleted as its expenses date (${expensesLocalDate}) falls within the posted cutoff period named "${CutoffName}".`,
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
          if (err.response) {
            const { status, data } = err.response;

            if (status === 300) {
              const { fixedAssetTransactionNumber, module } = data;
              const title = document.createElement("div");
              const text = document.createElement("div");
              const swalInfo = document.createElement("div");

              title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
              text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                                  Delete first the expenses in module <strong>${module}</strong> with 
                                  Transaction Number: <strong>${fixedAssetTransactionNumber}</strong>
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
          } else {
            swal({
              icon: "error",
              title: "Error",
              text: "An error occurred while deleting the expenses.",
            });
          }
        }
      }
    });
  };

  // search
  const filteredItems = payExpensesData?.filter((item) => {
    if (!searchText) return true;

    // const searchLower = searchText.toLowerCase();
    // // const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

    // switch (filterColumn) {
    //   case "transaction_no":
    //     return item.transaction_no.toLowerCase().includes(searchLower);
    //   case "receiving_warehouse":
    //     return item.receiving_warehouse.toLowerCase().includes(searchLower);
    //   case "date_created":
    //     return item.date_created.toLowerCase().includes(searchLower);
    //   case "payment_method":
    //     return item.payment_method.toLowerCase().includes(searchLower);
    //   case "vendor_id":
    //     return item.vendor_id.toLowerCase().includes(searchLower);
    //   case "due_date":
    //     return item.due_date.toLowerCase().includes(searchLower);
    //   case "amount":
    //     return item.amount.toLowerCase().includes(searchLower);
    //   case "status":
    //     return item.status.toLowerCase().includes(searchLower);
    //   default:
    //     return (
    //       item.transaction_no.toLowerCase().includes(searchLower) ||
    //       item.receiving_warehouse.toLowerCase().includes(searchLower) ||
    //       item.date_created.toLowerCase().includes(searchLower) ||
    //       item.payment_method.toLowerCase().includes(searchLower) ||
    //       item.vendor_id.toLowerCase().includes(searchLower) ||
    //       item.due_date.toLowerCase().includes(searchLower) ||
    //       item.amount.toLowerCase().includes(searchLower) ||
    //       item.status.toLowerCase().includes(searchLower)
    //     );
    // }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  const handleRowClick = (data) => {
    navigate(
      `/accounting/view-pay-expenses/local/${data.id}?page=${pagination.currentPage}`
    );
    window.scrollTo(0, 10);
  };
  // const total_to_Pay = payExpensesData.reduce(
  //   (acc, data) =>
  //     acc + parseFloat(data.totalAmount || 0),
  //   0
  // );

  // const Paid = payExpensesData.reduce((acc, expense) => {
  //   const totalPayments = expense.expenses_payments.reduce(
  //     (sum, payment) => sum + parseFloat(payment.amount || 0),
  //     0
  //   );
  //   // Add to the overall accumulator
  //   return acc + totalPayments;
  // }, 0);

  useEffect(() => {
    const sortedExpensesData = pagination.data.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setExpensesData(sortedExpensesData);

    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    const currentPage = isNaN(pageFromUrl) ? 1 : pageFromUrl;
    const safePage = Math.max(1, Math.min(currentPage, pagination.totalPages));

    if (pagination.data.length > 0) {
      localStorage.setItem("Local-Expense", pagination.totalPages);
    }

    if (deletionTrigger && pagination.data.length === 0 && currentPage > 1) {
      pagination.setCurrentPage(currentPage - 1);
    }

    if (safePage != pagination.currentPage) {
      const params = new URLSearchParams(searchParams);
      params.set("page", pagination.currentPage);
      setSearchParams(params);
      return;
    }

    pagination.setCurrentPage(safePage);
  }, [pagination.data, pagination.totalPages, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCutOff();
    }, 1000);
    return () => clearTimeout(timer);
  }, [filterColumn]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);
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
      ) : authrztn.includes("LocalExpenses-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between mb-2">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">LOCAL EXPENSES</span>
              {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
            </div>
            <div>
              {authrztn.includes("LocalExpenses-Add") && (
                <Link
                  to={`/accounting/pay-expenses/${"local"}`}
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Pay Expenses
                </Link>
              )}
            </div>
          </div>

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
          <div className="row p-2 mx-auto">
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                  <h3>Total Expense</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1
                    // className="payable-amount"
                    title={totalExpense?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                  >
                    {widgetCurrencySymbol}{" "}
                    {totalExpense?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                    {/* {widgetCurrencySymbol}{" "}
                    {totalExpense ? compactNumberFormat(totalExpense) : "0.00"} */}
                    {/* {new Intl.NumberFormat("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(total_to_Pay)} */}
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
                    // className="payable-amount"
                    title={totalPaid?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                  >
                    {widgetCurrencySymbol}{" "}
                    {totalPaid?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                    {/* {widgetCurrencySymbol}{" "}
                    {totalPaid ? compactNumberFormat(totalPaid) : "0.00"} */}
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <span>Cutoff</span>
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
                  <option value="All Cutoff">All</option>
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>From</span>
                {/* <input
                  type="date"
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  value={cutOffDate?.from}
                  className="form-control"
                  readOnly
                /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button> */}
              </div>
            </div>
          </div>
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
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "transaction_number" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_number")}
                  >
                    Transaction ID
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "Amount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("Amount")}
                  >
                    Amount
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_requested" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_requested")}
                  >
                    Date Requested
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "status" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("status")}
                  >
                    Status
                  </button>
                </li>
              </ul>
            </div>
          </div>
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={payExpensesData}
              customStyles={customStyles}
              onRowClicked={handleRowClick}
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
    </div>
  );
};

export default LocalExpenses;
