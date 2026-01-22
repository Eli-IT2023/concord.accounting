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

const OtherIncome = ({ authrztn, roleType }) => {
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
  // const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  // const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const selectedCutOff = useRef("");
  const cutOffs = useRef([]);

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.current.filter((item) => {
      return item.id == e.target.value;
    });

    // setSelectedCutOff(filteredCutoff);
    selectedCutOff.current = filteredCutoff?.id;
    setSelectedAccount("");
    reloadTable(filteredCutoff, null);
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
        // setCutOffs(res.data); // store all cut off
        // setSelectedCutOff(defaultCutOff); // set default cut off

        fetchAccountListSub3();
        // Avoid setting to default cutoff again when fetching for search filter
        if (selectedCutOff.current) {
          const [filteredCutoff] = cutOffs.current.filter((item) => {
            return item.id == selectedCutOff.current;
          });
          reloadTable(filteredCutoff, selectedAccount); // fetch with selected cutoff
          return;
        } else {
          cutOffs.current = res.data; // store all cut off
          selectedCutOff.current = defaultCutOff?.id; // set default cut off
          reloadTable(defaultCutOff, selectedAccount); // fetch with default cutoff
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const [filteredCutoff] = cutOffs.current.filter((item) => {
      return item.id === selectedCutOff.current;
    });

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs.current, selectedCutOff.current]);

  useEffect(() => {
    startAndEndDate();
    console.log("render=====");
  }, [selectedCutOff.current]);

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

  const pagination = useServerPagination(
    `${BASE_URL}/otherIncome/fetch_data`,
    10
  );

  const reloadTable = (cutOff, accountsName) => {
    const dateFrom = cutOff?.from;
    const dateTo = cutOff?.to;
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
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Description",
      selector: (row) => (row.desc === "" ? "NA" : row.desc),
    },
    {
      name: "Amount",
      selector: (row) =>
        row.totalAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      omit: !roleType?.includes("Management"),
    },
    {
      name: "Date Requested",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
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
              {authrztn.includes("OtherIncome-Add") && (
                <Link
                  to="/accounts/add-otherIncome"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
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
                <select
                  className="form-select"
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    const [filteredCutoff] = cutOffs.current.filter((item) => {
                      return item.id === selectedCutOff.current;
                    });
                    reloadTable(filteredCutoff, e.target.value);
                  }}
                >
                  <option value="">All Account</option>
                  {accounts.map((account, index) => (
                    <option key={index} value={account?.id}>
                      {account?.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Cutoff</label>
                <select
                  value={selectedCutOff.current}
                  onChange={handleSelect}
                  className="form-select"
                >
                  {cutOffs.current.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">From</label>
                {/* <input
                  type="date"
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                  value={cutOffDate?.from}
                  readOnly
                  // onChange={(e) => setDateFrom(e.target.value)}
                /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">To</label>
                {/* <input
                  type="date"
                  className="form-control"
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  value={cutOffDate?.to}
                  readOnly
                  // onChange={(e) => setDateTo(e.target.value)}
                /> */}
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
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
                <li
                  className={roleType?.includes("Management") ? "" : "d-none"}
                >
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
