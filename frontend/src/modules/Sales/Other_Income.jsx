import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import swal from "sweetalert";
import Select from "react-select";
import { selectCustomStyles } from "../../assets/global/selectCustomStyles";
import DateRangePicker from "../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";
import { use } from "react";

const OtherIncome = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [otherIncomeData, setOtherIncomeData] = useState([]);
  const [selectedOtherIncome, setSelectedOtherIncome] = useState([]);

  const uniqueSelectedOtherIncome = [...new Set(selectedOtherIncome)];

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  useEffect(() => {
    // Get the current date in the Philippines timezone
    const currentDate = moment().tz("Asia/Manila");

    // Get the first date of the current month
    const firstDay = currentDate.clone().startOf("month");
    setFromDate(firstDay.format("YYYY-MM-DD"));

    // Get the last date of the current month
    const lastDay = currentDate.clone().endOf("month");
    setToDate(lastDay.format("YYYY-MM-DD"));
  }, []);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  // const selectedCutOff = useRef("");
  // const cutOffs = useRef([]);

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
    pagination.setCurrentPage(1);
    setSearchText("");

    // setSelectedCutOff(filteredCutoff);
    setSelectedCutOff(filteredCutoff);
    setSelectedAccount("");
    reloadTable(filteredCutoff, null);
  };

  const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     let defaultCutOff = res.data[0];
    //     // get the latest date for default cut off
    //     for (let index = 1; index < res.data.length; index++) {
    //       if (res.data[index].to > defaultCutOff.to) {
    //         defaultCutOff = res.data[index];
    //       }
    //     }
    //     // setCutOffs(res.data); // store all cut off
    //     // setSelectedCutOff(defaultCutOff); // set default cut off

    //     // Avoid setting to default cutoff again when fetching for search filter
    //     if (selectedCutOff) {
    //       const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    //       setSelectedCutOff(filteredCutoff); // set default cut off
    //       reloadTable(filteredCutoff, selectedAccount?.value); // fetch with selected cutoff
    //       return;
    //     } else {
    //       setCutOffs(res.data); // store all cut off
    //       setSelectedCutOff(defaultCutOff); // set default cut off
    //       reloadTable(defaultCutOff, selectedAccount?.value); // fetch with default cutoff
    //       fetchAccountListSub3();
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    setCutOffDate(initialCutoff);
    reloadTable(initialCutoff, selectedAccount?.value);
    fetchAccountListSub3();
  };

  useEffect(() => {
    fetchCutOff();
  }, []);
  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const fetchAccountListSub3 = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/issuedCheck/getAccountListSub3`
      );
      const accountNames = response.data.map((item) => {
        return { id: item.id, account_name: item.account_name };
      });
      const uniqueAccountsSet = [...new Set(accountNames)];
      setAccounts(uniqueAccountsSet);
    } catch (error) {
      console.error(error);
    }
  };

  // Other Income Soft Delete
  const handleDeleteOtherIncome = (id) => {
    swal({
      icon: "warning",
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    })
      .then(async (confirm) => {
        if (confirm) {
          const res = await axios.put(
            `${BASE_URL}/otherIncome/deleteOtherIncome/${id}`
          );

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Successfully Deleted",
              text: "Other Income has been Successfully deleted.",
            }).then(() => {
              fetchCutOff();
            });
          }
        }
      })
      .catch((error) => {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      });
  };

  const handleOtherIncomeBulkDeletion = () => {
    try {
      swal({
        icon: "warning",
        title: "Are you sure?",
        text: "Are you sure you want to delete?",
        buttons: ["Cancel", "OK"],
        dangerMode: true,
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/otherIncome/otherIncomeBulkSoftDelete`,
              {
                selectedOtherIncome: uniqueSelectedOtherIncome,
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Other Income Successfully Deleted",
                text: res.data.message,
              }).then(() => {
                fetchCutOff();
              });
            }
          }
        })
        .catch((error) => {
          console.error(error);
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact your support immediately",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
  };

  const pagination = useServerPagination(
    `${BASE_URL}/otherIncome/fetch_data`,
    10
  );

  const reloadTable = (cutOff, accountsName) => {
    const dateFrom = cutOff?.from;
    const dateTo = cutOff?.to;
    console.log(dateFrom);
    pagination.updateParams({
      type: "All",
      startDate: dateFrom,
      endDate: dateTo,
      accountsName,
      searchText,
      filterColumn,
    });
    setIsLoading(false);
    // axios
    //   .get(`${BASE_URL}/otherIncome/fetch_data`, {
    //     params: {
    //       type: "All",
    //       startDate: dateFrom,
    //       endDate: dateTo,
    //       accountsName,
    //       searchText,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setOtherIncomeData(res.data);
    //     setIsLoading(false);
    //     console.log(res.data);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching otherIncome data:", error);
    //   });
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //   }, 200);
  //   return () => clearTimeout(timer);
  // }, [fromDate, toDate, searchText]);

  useEffect(() => {
    setOtherIncomeData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchCutOff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          checked={otherIncomeData
            .map((item) => item.id)
            .every((item) => selectedOtherIncome.includes(item))} // Checkbox is checked if all items on the current page exist in selectedOtherIncome
          onChange={(e) =>
            e.target.checked
              ? // Add all items on the current page
                setSelectedOtherIncome((prev) => [
                  ...prev,
                  ...otherIncomeData.map((item) => item.id),
                ])
              : // Remove currently visible items (on this page) from the selectedOtherIncome list
                // Keeps only the selected items from other pages
                setSelectedOtherIncome((prev) =>
                  prev.filter(
                    (otherIncomeId) =>
                      !otherIncomeData
                        .map((item) => item.id)
                        .includes(otherIncomeId)
                  )
                )
          }
        />
      ),
      selector: (row) => (
        <input
          type="checkbox"
          checked={selectedOtherIncome.includes(row.id)}
          onChange={(e) =>
            setSelectedOtherIncome((prev) =>
              e.target.checked
                ? [...prev, row.id]
                : prev.filter((item) => item !== row.id)
            )
          }
        />
      ),
      width: "8rem",
    },
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Description",
      selector: (row) => (row.desc === "" ? "--" : row.desc),
    },
    {
      name: "Amount",
      selector: (row) =>
        row.totalAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Date Requested",
      selector: (row) => format(row.income_date, "MMM/dd/yyyy"),
    },
    {
      name: "Status",
      cell: (row) => {
        if (row.status === "Posted") {
          return (
            <span style={{ color: "green", fontWeight: "bold" }}>
              Posted
              {/* <i class="fa-regular fa-circle-check"></i> */}
            </span>
          );
        } else if (row.status === "Rejected") {
          return (
            <span style={{ color: "red", fontWeight: "bold" }}>
              Rejected
              {/* <i class="fa-regular fa-circle-xmark"></i> */}
            </span>
          );
        } else if (row.status === "Approved") {
          return (
            <span style={{ color: "green", fontWeight: "bold" }}>
              Approved
              {/* <i class="fa-regular fa-circle-xmark"></i> */}
            </span>
          );
        } else {
          // return (
          //   <div className="d-flex justify-content-between">
          //     <button
          //       className="btn btn-danger btn-sm me-2 bg-notpaids border-0 text-danger"
          //       // onClick={() => handleReject(row.transaction_no)}
          //     >
          //       Reject
          //     </button>
          //     <button
          //       className="btn btn-success btn-sm"
          //       // onClick={() => handleApprove(row.transaction_no)}
          //     >
          //       Approve
          //     </button>
          //   </div>
          // );
          return (
            <span style={{ color: "orange", fontWeight: "bold" }}>
              Pending
              {/* <i class="fa-regular fa-circle-check"></i> */}
            </span>
          );
        }
      },
    },
    {
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => handleDeleteOtherIncome(row.id)}
        ></i>
      ),
    },
  ];

  //   filter
  // search
  // const filteredItems = otherIncomeData.filter((item) => {
  //   if (!searchText) return true;

  //   const searchLower = searchText.toLowerCase();
  //   // const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

  //   switch (filterColumn) {
  //     case "transaction_no":
  //       return item.transaction_no.toLowerCase().includes(searchLower);
  //     case "receiving_warehouse":
  //       return item.receiving_warehouse.toLowerCase().includes(searchLower);
  //     case "date_created":
  //       return item.date_created.toLowerCase().includes(searchLower);
  //     case "payment_method":
  //       return item.payment_method.toLowerCase().includes(searchLower);
  //     case "vendor_id":
  //       return item.vendor_id.toLowerCase().includes(searchLower);
  //     case "due_date":
  //       return item.due_date.toLowerCase().includes(searchLower);
  //     case "amount":
  //       return item.amount.toLowerCase().includes(searchLower);
  //     case "status":
  //       return item.status.toLowerCase().includes(searchLower);
  //     default:
  //       return (
  //         item.transaction_no.toLowerCase().includes(searchLower) ||
  //         item.receiving_warehouse.toLowerCase().includes(searchLower) ||
  //         item.date_created.toLowerCase().includes(searchLower) ||
  //         item.payment_method.toLowerCase().includes(searchLower) ||
  //         item.vendor_id.toLowerCase().includes(searchLower) ||
  //         item.due_date.toLowerCase().includes(searchLower) ||
  //         item.amount.toLowerCase().includes(searchLower) ||
  //         item.status.toLowerCase().includes(searchLower)
  //       );
  //   }
  // });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  const handleFilter = () => {
    reloadTable();
  };

  const handleRowClick = (data) => {
    navigate(`/accounts/viewOtherIncome/${data.id}`);
  };

  const total_to_Pay = otherIncomeData?.reduce(
    (acc, data) => acc + parseFloat(data.totalAmount || 0),
    0
  );

  const To_Pay = otherIncomeData?.reduce((acc, expense) => {
    // Ensure otherIncome_payments is an array
    const payments = Array.isArray(expense.otherIncome_payments)
      ? expense.otherIncome_payments
      : [];

    // Sum up the amounts in the otherIncome_payments array
    const totalPayments = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount || 0),
      0
    );
    // Add to the overall accumulator
    return acc + totalPayments;
  }, 0);

  // Account Options for dropdown select
  const accountOptions = accounts.map((item) => ({
    value: item.id,
    label: item.account_name,
  }));

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    setCutOffDate(cutoff);
    setSearchText("");
    pagination.setCurrentPage(1);
    setSelectedAccount("");
    reloadTable(cutoff, null);
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
      ) : authrztn.includes("OtherIncome-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">OTHER INCOME</span>
              {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
            </div>
            <div>
              {authrztn.includes("OtherIncome-Add") &&
                (uniqueSelectedOtherIncome.length > 0 ? (
                  <button
                    className="btn btn-danger title-button"
                    onClick={handleOtherIncomeBulkDeletion}
                  >
                    <i
                      className="fas fa-trash"
                      style={{
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                    ></i>{" "}
                    Delete <span>({uniqueSelectedOtherIncome.length})</span>
                  </button>
                ) : (
                  <Link
                    to="/accounts/add-otherIncome"
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> Create
                  </Link>
                ))}
            </div>
          </div>

          {/* <div className="row p-2 mx-auto">
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                  <h3>Total to Pay</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amount">
                    {new Intl.NumberFormat("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(total_to_Pay)}
                  </h1>
                  <span className="text-secondary ">
                    {fromDate} <strong>to</strong> {toDate}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-wallet fs-3 h-100"></i>
                  <h3>To Pay</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amount">
                    {new Intl.NumberFormat("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(To_Pay)}
                  </h1>
                  <span className="text-secondary ">
                    {fromDate} <strong>to</strong> {toDate}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-credit-card fs-3 h-100"></i>
                  <h3>Paid</h3>
                </div>

                <div className=" mt-2 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amounts">
                    {new Intl.NumberFormat("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(total_to_Pay - To_Pay)}
                  </h1>

                  <span className="text-secondary ">
                    {fromDate} <strong>to</strong> {toDate}
                  </span>
                </div>
              </div>
            </div>
          </div> */}
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              {/* <div className="col-sm mb-2">
                <span>Status</span>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Status
                  </option>
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>From</span>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div> */}
              <div className="col-sm mb-2">
                <label htmlFor="">Account</label>
                {/* <select
                  className="form-select"
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    const [filteredCutoff] = cutOffs.current.filter((item) => {
                      return item.id === selectedCutOff.current;
                    });
                    reloadTable(filteredCutoff, e.target.value);
                  }}
                  onMouseDown={(e) => {
                    if (accounts.length === 0) {
                      e.preventDefault();
                      swal({
                        icon: "warning",
                        title: "No Account Found",
                        text: "No account found. Please add an account first",
                      });
                      return;
                    }
                  }}
                >
                  <option value="">All Account</option>
                  {accounts.map((account, index) => (
                    <option key={index} value={account?.id}>
                      {account?.account_name}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={accountOptions}
                  value={selectedAccount}
                  onChange={(selectedOption) => {
                    setSelectedAccount(selectedOption);
                    const filteredCutoff = handleCutoffChange(
                      selectedCutOff?.id
                    );

                    reloadTable(filteredCutoff, selectedOption?.value);
                  }}
                  onMenuOpen={() => {
                    if (accounts.length === 0) {
                      swal({
                        icon: "warning",
                        title: "No Account Found",
                        text: "No account found. Please add an account first",
                      });
                      return;
                    }
                  }}
                  menuIsOpen={accounts.length === 0 ? false : undefined}
                  placeholder={`All Account`}
                  styles={selectCustomStyles(selectedAccount)}
                  isSearchable
                  isClearable
                />
              </div>
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={
                    cutOffDate?.from ? new Date(cutOffDate.from) : null
                  }
                  endDate={cutOffDate?.to ? new Date(cutOffDate.to) : null}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <label htmlFor="">Cutoff</label>
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
                </select> */}
              </div>
              {/*   */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button
                  className="btn w-100"
                  type="button"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>
                <button className="btn btn-secondary w-100" type="button">
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
                onChange={(e) => setSearchText(e.target.value)}
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
                      filterColumn === "transaction_no" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_no")}
                  >
                    Transaction ID
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "desc" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("desc")}
                  >
                    Description
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "amount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("amount")}
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
                      filterColumn === "accounts" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("accounts")}
                  >
                    Accounts
                  </button>
                </li>
              </ul>
            </div>
          </div>
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={otherIncomeData}
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

export default OtherIncome;
