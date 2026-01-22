import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { format } from "date-fns";
import maskCurrency from "../../utils/maskCurrency";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const Cash_flow = ({ authrztn, roleType }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterColumn, setFilterColumn] = useState("all");

  // New state variables for totals
  const [totalCashIn, setTotalCashIn] = useState(0);
  const [totalCashOut, setTotalCashOut] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    setSelectedAccount("");
    reloadTable(filteredCutoff, null);
  };

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
          const [filteredCutoff] = cutOffs.filter((item) => {
            return item.id == selectedCutOff?.id;
          });
          setSelectedCutOff(filteredCutoff); // set default cut off
          reloadTable(filteredCutoff, selectedAccount);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          reloadTable(defaultCutOff, selectedAccount);
          fetchAccountListSub3();
        }
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

  const pagination = useServerPagination(
    BASE_URL + "/cashFlow/getCashflow",
    10
  );

  const reloadTable = (cutOff, accountsName) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      accountsName,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/cashFlow/getCashflow", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       accountsName,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setInboundData(res.data.cashFlow);
    //     setFilteredData(res.data.cashFlow);
    //     // calculateTotals(res.data);

    //     setTotalCashIn(
    //       res.data.totalIn?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    //     );
    //     setTotalCashOut(
    //       res.data.totalOutCombinedAmount
    //         ?.toFixed(2)
    //         .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    //     );
    //     setIsLoading(false);
    //     console.log(res.data);
    //   })
    //   .catch((err) => console.log(err));
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //   }, 1500);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    if (pagination.data) {
      setInboundData(pagination.data.cashFlow);
      setFilteredData(pagination.data.cashFlow);
      // calculateTotals(pagination.data);

      setTotalCashIn(
        pagination.data.totalIn
          ?.toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      );
      setTotalCashOut(
        pagination.data.totalOutCombinedAmount
          ?.toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      );
    }
  }, [pagination.data]);

  useEffect(() => {
    fetchCutOff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const calculateTotals = (data) => {
    const totalIn = data.reduce(
      (sum, item) => sum + parseFloat(item.cash_in || 0),
      0
    );
    const totalOut = data.reduce(
      (sum, item) => sum + parseFloat(item.cash_out || 0),
      0
    );

    setTotalCashIn(totalIn.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    setTotalCashOut(totalOut.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const dataList = inboundData?.map((data, i) => {
    const transactionDate = new Date(data.transaction_date);
    const formattedDate = transactionDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const accountName =
      data.account_list && data.account_list.account_name
        ? data.account_list.account_name
        : "Unknown Account";

    return {
      key: i,
      id: data.id,
      account_list_id_cash_from: data.account_list_id_cash_from,
      account_list_id_cash_to: data.account_list_id_cash_to,
      account_list_id_cash_froms: data.account_list_id_cash_froms,
      account_list_id_cash_tos: data.account_list_id_cash_tos,
      transaction_date: data.transaction_date,
      check_number: data.check_number,
      transaction_number: data.transaction_number,
      module_from: data.module_from,
      description: data.description,
      amount: data.amount,
      status: data.status,
    };
  });

  // List of currency symbol
  const currencySymbol = {
    PHP: "₱",
    JPY: "¥",
    USD: "$",
    EUR: "€",
    HKD: "HK$",
    CNY: "CN¥",
  };

  const columns = [
    {
      name: "Account",
      selector: (row) => row.account_list_id_cash_froms?.account_name || "--",
    },
    {
      name: "Date",
      selector: (row) => format(row.transaction_date, "MMM dd, yyyy"),
    },
    {
      name: "Transaction Number",
      selector: (row) => row.transaction_number,
    },
    {
      name: "Issued To",
      selector: (row) => row.account_list_id_cash_tos?.account_name || "--",
    },
    {
      name: "Subject From",
      selector: (row) => row.module_from,
    },
    {
      name: "Description",
      selector: (row) => row.description || "--",
    },
    {
      name: "Amount",
      selector: (row) =>
        row.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      cell: (row) => (
        <div
          className={`${
            row.account_list_id_cash_froms?.account_name &&
            row.module_from == "Collection Check"
              ? "text-primary"
              : row.transaction_number.includes("TRANSFER-") &&
                row.account_list_id_cash_tos == null
              ? "text-primary"
              : row.account_list_id_cash_froms?.account_name
              ? "text-danger"
              : "text-primary"
          }`}
        >
          {row.account_list_id_cash_froms?.account_name &&
          row.module_from == "Collection Check"
            ? "+"
            : row.transaction_number.includes("TRANSFER-") &&
              row.account_list_id_cash_tos == null
            ? "+"
            : row.account_list_id_cash_froms?.account_name
            ? "-"
            : "+"}{" "}
          {
            currencySymbol[
              row.account_list_id_cash_froms?.currency?.currency_name ||
                row.account_list_id_cash_tos?.currency?.currency_name
            ]
          }
          {row.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            // style: "currency",
            // currency: `${
            //   row.account_list_id_cash_froms
            //     ? row.account_list_id_cash_froms.currency?.currency_name
            //     : row.account_list_id_cash_tos.currency?.currency_name
            // }`,
          })}
        </div>
      ),
      omit: !roleType?.includes("Management"),
    },
    {
      name: "Exchange Rate Used",
      cell: (row) => (
        <div>
          {currencySymbol["PHP"]}
          {row.exchangeRate.toLocaleString("en-US", {
            minimumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
            maximumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
          })}
        </div>
      ),
    },
    {
      name: "Converted Amount",
      cell: (row) => (
        <div>
          {currencySymbol["PHP"]}
          {row.convertedAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    // {
    //   name: "Status",
    //   selector: (row) => (
    //     <span
    //       style={{
    //         color: row.status === "Pending" ? "orange" : "green",
    //         border: `1px solid ${
    //           row.status === "Pending" ? "orange" : "green"
    //         }`,
    //         padding: "2px 15px",
    //         borderRadius: "12px",
    //         display: "inline-block",
    //       }}
    //     >
    //       {row.status}
    //     </span>
    //   ),
    // },
  ];

  // const filteredItems = dataList.filter((item) => {
  //   const referenceNumber = item.reference_number
  //     ? item.reference_number.toLowerCase()
  //     : "";
  //   const itemDate = new Date(item.transaction_date);

  //   if (selectedAccount && item.account !== selectedAccount) return false;
  //   if (searchText && !referenceNumber.includes(searchText.toLowerCase()))
  //     return false;
  //   if (startDate && itemDate < startDate) return false;
  //   if (endDate && itemDate > endDate) return false;

  //   return true;
  // });

  const clearFilter = () => {
    setSearchText("");
    setSelectedAccount("");
    setStartDate(null);
    setEndDate(null);
    reloadTable();
  };

  // const accountOptions = [
  //   ...new Set(
  //     inboundData.map((item) =>
  //       item.account_list && item.account_list.account_name
  //         ? item.account_list.account_name
  //         : "Unknown Account"
  //     )
  //   ),
  // ].map((accountName) => ({
  //   value: accountName,
  //   label: accountName,
  // }));

  const handleAccountFilterChange = (event) => {
    setSelectedAccount(event.target.value);
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
      ) : authrztn.includes("CashFlow-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">CASH FLOW</span>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bx-money me-1 h-100"></i>
                    Total In
                  </h5>
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      ` ₱${parseFloat(totalCashIn).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    ) : (
                      <span
                        className="masked-value"
                        style={{ fontSize: "2rem", fontWeight: "bold" }}
                      >
                        {maskCurrency(100)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bxs-credit-card me-1 h-100"></i>
                    Total Out
                  </h5>
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      ` ₱${parseFloat(totalCashOut).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    ) : (
                      <span
                        className="masked-value"
                        style={{ fontSize: "2rem", fontWeight: "bold" }}
                      >
                        {maskCurrency(100)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <label htmlFor="">Account</label>
                <select
                  className="form-select"
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    const [filteredCutoff] = cutOffs.filter((item) => {
                      return item.id === selectedCutOff?.id;
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
                <label htmlFor="">From</label>
                {/* <input
                  type="date"
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                  value={cutOffDate?.from}
                  readOnly
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
                /> */}
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setSelectedAccount("");
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  Clear Filter
                </button> */}
              </div>
              {/* <div className="col-sm mb-2">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Reference #"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-sm mb-2">
                <div className="input-group">
                  <select
                    name=""
                    id=""
                    className="form-select"
                    value={selectedAccount}
                    onChange={handleAccountFilterChange}
                  >
                    <option value="" disabled>
                      Select Account
                    </option>
                    {accountOptions.map((account) => (
                      <option key={account.value} value={account.value}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-sm mb-2">
                <div className="input-group">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From"
                    className="form-control"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="To"
                    className="form-control"
                    disabled={!startDate}
                  />
                </div>
              </div>

              <div className="input-group">
                <button className="btn btn-secondary" onClick={clearFilter}>
                  Clear Filter
                </button>
              </div>
            </div> */}
            </div>
          </div>
          <div className="w-100 mt-2 mb-2 container-fluid">
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
                {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "account" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("account")}
                  >
                    Account
                  </button>
                </li> */}
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "account_name" ? "active" : ""
                    }`}
                    onClick={() => {
                      setFilterColumn("account_name");
                      // setSelectedAccount("");
                      // const [filteredCutoff] = cutOffs.filter((item) => {
                      //   return item.id === selectedCutOff?.id;
                      // });
                      // reloadTable(filteredCutoff, "");
                    }}
                  >
                    Account Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date")}
                  >
                    Date
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "transaction_number" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_number")}
                  >
                    Transaction Number
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "issued_to" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("issued_to")}
                  >
                    Issued To
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "subject_from" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("subject_from")}
                  >
                    Subject From
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "description" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("description")}
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
              </ul>
            </div>
          </div>

          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={inboundData}
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
    </div>
  );
};

export default Cash_flow;
