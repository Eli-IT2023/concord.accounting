import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../../assets/img/NoAccess.png";

const ExpensesCopy = ({ authrztn }) => {
  const navigate = useNavigate();
  const { id } = useParams();
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

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [expensesData, setExpensesData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastCutoffExpenses, setLastCutoffExpenses] = useState(0);
  const [currentTotalExpense, setCurrentTotalExpense] = useState(0);
  const [totalIssued, setTotalIssued] = useState(0);
  const [currentCutoffExpense, setCurrentCutoffExpense] = useState(0);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    fetchExpensesData(filteredCutoff);
    getLastCutoffExpenses(filteredCutoff);
    getCurrentTotalExpense(filteredCutoff);
    getTotalIssued(filteredCutoff);
    getCurrentCutoffExpense(filteredCutoff);
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
        setCutOffs(res.data); // store all cut off
        setSelectedCutOff(defaultCutOff); // set default cut off
        fetchExpensesData(defaultCutOff);
        getLastCutoffExpenses(defaultCutOff);
        getCurrentTotalExpense(defaultCutOff);
        getTotalIssued(defaultCutOff);
        getCurrentCutoffExpense(defaultCutOff);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id === selectedCutOff?.id;
    });

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const fetchExpensesData = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/getExpensesDataNotification`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
            id,
          },
        }
      );
      setExpensesData(res.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getLastCutoffExpenses = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchLastCutoffExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
          },
        }
      );
      setLastCutoffExpenses(res.data.totalPrice);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentTotalExpense = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchCurrentTotalExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
          },
        }
      );
      setCurrentTotalExpense(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getTotalIssued = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/fetchTotalIssued`, {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      });
      setTotalIssued(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentCutoffExpense = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchCurrentCutoffExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
          },
        }
      );
      setCurrentCutoffExpense(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpensesData();
      fetchCutOff();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },

    {
      name: "Expenses Type",
      selector: (row) =>
        row.expenses2_id === null
          ? "NA"
          : `${row.expenses2.expenses_one.expenses_type_one} (${row.expenses2.sub_type})`,
    },
    {
      name: "Foreign Type",
      selector: (row) => (row.foreign === "" ? "NA" : row.foreign),
    },
    {
      name: "Amount",
      selector: (row) =>
        `${row.currency.currency_name} ${
          row.totalAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`,
    },
    {
      name: "Description",
      selector: (row) => (row.desc === "" ? "NA" : row.desc),
    },
    {
      name: "Expenses Date",
      selector: (row) => row.expenses_date,
    },
    {
      name: "Status",
      selector: (row) => row.status,
    },
  ];

  //   filter
  // search
  const filteredItems = expensesData.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    // const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

    switch (filterColumn) {
      case "transaction_no":
        return item.transaction_no.toLowerCase().includes(searchLower);
      case "receiving_warehouse":
        return item.receiving_warehouse.toLowerCase().includes(searchLower);
      case "date_created":
        return item.date_created.toLowerCase().includes(searchLower);
      case "payment_method":
        return item.payment_method.toLowerCase().includes(searchLower);
      case "vendor_id":
        return item.vendor_id.toLowerCase().includes(searchLower);
      case "due_date":
        return item.due_date.toLowerCase().includes(searchLower);
      case "amount":
        return item.amount.toLowerCase().includes(searchLower);
      case "status":
        return item.status.toLowerCase().includes(searchLower);
      default:
        return (
          item.transaction_no.toLowerCase().includes(searchLower) ||
          item.receiving_warehouse.toLowerCase().includes(searchLower) ||
          item.date_created.toLowerCase().includes(searchLower) ||
          item.payment_method.toLowerCase().includes(searchLower) ||
          item.vendor_id.toLowerCase().includes(searchLower) ||
          item.due_date.toLowerCase().includes(searchLower) ||
          item.amount.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
        );
    }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  const handleFilter = () => {
    fetchExpensesData();
  };

  const handleRowClick = (data) => {
    navigate(`/accounting/view-expenses/${data.id}`);
  };

  // const total_to_Pay = expensesData.reduce(
  //   (acc, data) => acc + parseFloat(data.totalAmount || 0),
  //   0
  // );

  // const To_Pay = expensesData.reduce((acc, expense) => {
  //   // Sum up the amounts in the expenses_payments array for the current expense
  //   const totalPayments = expense.expenses_payments.reduce(
  //     (sum, payment) => sum + parseFloat(payment.amount || 0),
  //     0
  //   );
  //   // Add to the overall accumulator
  //   return acc + totalPayments;
  // }, 0);

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
      ) : authrztn.includes("Expenses-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">EXPENSES</span>
              {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
            </div>
            <div>
              {authrztn.includes("Expenses-Add") && (
                <Link
                  to="/accounting/add-expenses"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> CREATE
                </Link>
              )}
            </div>
          </div>

          <div className="row p-2 mx-auto">
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                  <h3 className="fs-5">Last cut-off Expenses</h3>
                </div>

                <div className=" mt-4 d-flex flex-column payable-card-desc">
                  <h1
                    className="payable-amount text-nowrap"
                    style={{ fontSize: "2rem" }}
                  >
                    {lastCutoffExpenses?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
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
                  <h3 className="fs-5">Current Total Expense</h3>
                </div>

                <div className=" mt-4 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amount" style={{ fontSize: "2rem" }}>
                    {currentTotalExpense?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                    {/* {new Intl.NumberFormat("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(To_Pay)} */}
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-credit-card fs-3 h-100"></i>
                  <h3 className="fs-5">Total Issued</h3>
                </div>

                <div className=" mt-4 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amount" style={{ fontSize: "2rem" }}>
                    {totalIssued?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                    {/* {new Intl.NumberFormat("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(total_to_Pay - To_Pay)} */}
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-sm w-100 p-3 payable-card">
              <div className="w-100 border p-3 shadow-sm rounded h-100">
                <div className=" d-flex flex-row align-items-center payable-icon">
                  <i class="bx bx-credit-card fs-3 h-100"></i>
                  <h3 className="fs-5">Current cut-off Expense</h3>
                </div>

                <div className=" mt-4 d-flex flex-column payable-card-desc">
                  <h1 className="payable-amount" style={{ fontSize: "2rem" }}>
                    {currentCutoffExpense?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <span>Cutoff</span>
                {/* <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Status
                  </option>
                </select> */}
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                >
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>From</span>
                <input
                  type="date"
                  className="form-control"
                  value={cutOffDate?.from || ""}
                  readOnly
                  // onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input
                  type="date"
                  className="form-control"
                  value={cutOffDate?.to || ""}
                  readOnly
                  // onChange={(e) => setToDate(e.target.value)}
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
                // onChange={(e) => setSearchText(e.target.value)}
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
                      filterColumn === "transaction_no" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_no")}
                  >
                    Transaction No.
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "receiving_warehouse" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("receiving_warehouse")}
                  >
                    Receiving Warehouse
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_created" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_created")}
                  >
                    Date Created
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "vendor_id" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("vendor_id")}
                  >
                    Vendor
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "due_date" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("due_date")}
                  >
                    Due Date
                  </button>
                </li>
              </ul>
            </div>
          </div>
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={expensesData}
              customStyles={customStyles}
              pagination
              onRowClicked={handleRowClick}
              className="dataTable"
            />
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

export default ExpensesCopy;
