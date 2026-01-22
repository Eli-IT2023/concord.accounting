import React, { useState, useEffect, useCallback } from "react";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { customStyles } from "../styles/table-style";
import "../../assets/css/style.css";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import swal from "sweetalert";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { Modal } from "react-bootstrap";
import { format } from "date-fns";
import maskCurrency from "../../utils/maskCurrency";
import CustomDatePickerInput from "../../utils/CustomerDateInput";
import "../../assets/css/style.css";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

function BankTransaction({ authrztn, roleType }) {
  const userLoggedID = useDecodeToken();
  const [search, setSearch] = useState("");
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [show, setShow] = useState(false);
  const handleCloseModal = () => setShow(false);
  const handleShowModal = () => setShow(true);
  const [currencyRate, setCurrencyRate] = useState("");
  const [bankTransactionRowData, setBankTransactionRowData] = useState([]);
  const [paymentData, setPaymentData] = useState({});

  const [totals, setTotals] = useState({
    totalBalance: 0,
    totalWithdraw: 0,
    totalDeposit: 0,
  });
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  const pagination = useServerPagination(
    BASE_URL + "/bankTransaction/getBankTransaction",
    10
  );

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
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
    //   .get(BASE_URL + "/bankTransaction/getBankTransaction", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       accountsName,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setInboundData(res.data.bankTransaction);
    //     setFilteredData(res.data.bankTransaction);
    //     console.log(res.data.bankTransaction);
    //     // calculateTotals(res.data);

    //     setTotals({
    //       totalBalance: (0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    //       totalWithdraw:
    //         res.data.totalIn
    //           ?.toFixed(2)
    //           .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || 0,
    //       totalDeposit:
    //         res.data.totalOutCombinedAmount
    //           ?.toFixed(2)
    //           .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || 0,
    //     });
    //     console.log(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  const fetchAccountListSub3 = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/issuedCheck/getAccountListSub3`
      );
      console.log("This is response of fetchAccountListSub3", response);
      const accountNames = response.data.map((item) => {
        return { id: item.id, account_name: item.account_name };
      });
      const uniqueAccountsSet = [...new Set(accountNames)];
      setAccounts(uniqueAccountsSet);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     filterData();
  //   }, 1500);

  //   return () => clearTimeout(timer);
  // }, [selectedAccount, startDate, endDate]);
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     filterData();
  //   }, 1500);

  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setInboundData(pagination.data.bankTransaction);
    setFilteredData(pagination.data.bankTransaction);
    // calculateTotals(pagination);
    setTotals({
      totalBalance: (0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      totalWithdraw:
        pagination.data.totalIn
          ?.toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || 0,
      totalDeposit:
        pagination.data.totalOutCombinedAmount
          ?.toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",") || 0,
    });
  }, [pagination.data]);

  useEffect(() => {
    fetchCutOff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
    fetchCutOff();
  }, [filterColumn]);

  useEffect(() => {
    if (selectedAccount && filterColumn == "account_name") {
      setFilterColumn("all");
    }
  }, [selectedAccount]);

  const filterData = () => {
    let filtered = inboundData;
    console.log(inboundData);
    if (selectedAccount) {
      filtered = filtered.filter(
        (data) => data.account_list?.account_name === selectedAccount
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (data) =>
          new Date(data.transaction_date).setHours(0, 0, 0, 0) >=
          startDate.setHours(0, 0, 0, 0)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (data) =>
          new Date(data.transaction_date).setHours(23, 59, 59, 999) <=
          endDate.setHours(23, 59, 59, 999)
      );
    }

    setFilteredData(filtered);
    calculateTotals(filtered);
    setIsLoading(false);
  };

  const calculateTotals = (data) => {
    const totalBalance = data.reduce(
      (sum, item) => sum + parseFloat(item.balanace || 0),
      0
    );
    const totalWithdraw = data.reduce(
      (sum, item) => sum + parseFloat(item.withdraw || 0),
      0
    );
    const totalDeposit = data.reduce(
      (sum, item) => sum + parseFloat(item.deposit || 0),
      0
    );

    setTotals({
      totalBalance: totalBalance
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      totalWithdraw: totalWithdraw
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      totalDeposit: totalDeposit
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    });
  };

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
      selector: (row) => row.account_list_id_bank_froms?.account_name,
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
      selector: (row) => row.account_list_id_bank_tos?.account_name,
    },
    {
      name: "Subject From",
      selector: (row) => row.module_from,
    },
    {
      name: "Description",
      selector: (row) => row.description,
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
            row.account_list_id_bank_froms?.account_name &&
            row.module_from == "Collection Check"
              ? "text-primary"
              : row.transaction_number.includes("TRANSFER-") &&
                row.account_list_id_bank_tos == null
              ? "text-primary"
              : row.account_list_id_bank_froms?.account_name
              ? "text-danger"
              : "text-primary"
          }`}
        >
          {row.account_list_id_bank_froms?.account_name &&
          row.module_from == "Collection Check"
            ? "+"
            : row.transaction_number.includes("TRANSFER-") &&
              row.account_list_id_bank_tos == null
            ? "+"
            : row.account_list_id_bank_froms?.account_name
            ? "-"
            : "+"}{" "}
          {
            currencySymbol[
              row.account_list_id_bank_froms?.currency?.currency_name ||
                row.account_list_id_bank_tos?.currency?.currency_name
            ]
          }
          {row.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            // style: "currency",
            // currency: `${
            //   row.account_list_id_bank_froms
            //     ? row.account_list_id_bank_froms?.currency?.currency_name
            //     : row.account_list_id_bank_tos?.currency?.currency_name
            // }`,
          })}
        </div>
      ),
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
    {
      name: "Exchange Rate Used",
      cell: (row) => (
        <div>
          {currencySymbol["PHP"]}
          {row.exchangeRate.toLocaleString("en-US", {
            minimumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
            maximumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
          })}{" "}
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
      omit: !roleType?.includes("Management"), // Hide if not Management
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            color: row.status
              ? row.status === "Pending"
                ? "#FFA500"
                : "#3B9F3F"
              : "initial",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <div>
          <button
            onClick={() => {
              const rowData = inboundData.find((data) => data.id == row.id);
              handleConfirm(
                row.id,
                row.account_list_id_bank_from,
                row.amount,
                row.transaction_date,
                row.transaction_number,
                row.module_from,
                row.description,
                row.account_list_id_bank_froms.currency,
                rowData
              );
            }}
            className={`btn btn-primary ${
              row.status !== "Pending" ? "disabled" : ""
            }`}
            disabled={row.status !== "Pending"}
            style={{
              cursor: row.status !== "Pending" ? "not-allowed" : "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      ),
    },
  ];

  const handleConfirm = async (
    id,
    account_list_id_bank_from,
    amount,
    date,
    transaction_number,
    module_from,
    description,
    currency,
    rowData
  ) => {
    const amountToUse =
      rowData.amount_to_deduct != null ? rowData.amount_to_deduct : amount;

    console.log(
      "amount to use",
      amountToUse,
      rowData.amount_to_deduct,
      rowData.account_list_id_bank_to
    );

    const res = await axios.get(
      `${BASE_URL}/bankTransaction/validateBankTransaction/${account_list_id_bank_from}`
    );
    if (amountToUse > res.data.amount) {
      swal({
        title: "Oops!",
        text: "Insufficient Balance",
        icon: "error",
        button: false,
        timer: 2000,
      });
      return;
    }

    // if (currency.currency_name !== "PHP" || currency.id !== 1) {
    //   setBankTransactionRowData(rowData);
    //   setPaymentData({
    //     id,
    //     account_list_id_bank_from,
    //     amount,
    //     date,
    //     transaction_number,
    //     module_from,
    //     description,
    //     userLoggedID,
    //   });
    //   handleShowModal();
    //   return;
    // }

    try {
      const toPay = await swal({
        title: "Are you sure?",
        text: "Once confirmed, you will not be able to recover this transaction",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (toPay) {
        await axios
          .post(BASE_URL + "/bankTransaction/confirmBankTransaction", {
            id,
            account_list_id_bank_from,
            amount,
            date,
            transaction_number,
            module_from,
            description,
            userLoggedID,
            amountToDeduct:
              rowData.amount_to_deduct != null ? rowData.amount_to_deduct : 0,
            account_list_id_bank_to: rowData.account_list_id_bank_to,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Bank Transaction Confirmed",
                text: "The bank transaction has been confirmed",
                icon: "success",
                timer: 2000,
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id === selectedCutOff?.id;
                });
                reloadTable(filteredCutoff, null);
              });
            } else if (res.status === 202) {
              swal({
                title: "Oopps!",
                text: "Action is prohibited as the date has already been posted",
                icon: "error",
                button: true,
              });
              return;
            } else {
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            }
          });
      }
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  console.log(bankTransactionRowData);

  const handleSubmit = async () => {
    try {
      if (currencyRate == "") {
        swal({
          title: "Field required.",
          text: "Please fill in the Foreign rate.",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const toPay = await swal({
        title: "Are you sure?",
        text: "Once confirmed, you will not be able to recover this transaction",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (toPay) {
        const {
          id,
          account_list_id_bank_from,
          amount,
          date,
          transaction_number,
          module_from,
          description,
          userLoggedID,
        } = paymentData;

        await axios
          .post(BASE_URL + "/bankTransaction/confirmBankTransaction", {
            id,
            account_list_id_bank_from,
            amount,
            date,
            transaction_number,
            module_from,
            description,
            userLoggedID,
            bankTransactionRowData,
            currencyRate,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Bank Transaction Confirmed",
                text: "The bank transaction has been confirmed",
                icon: "success",
                timer: 2000,
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id === selectedCutOff?.id;
                });
                reloadTable(filteredCutoff, null);
                handleCloseModal();
              });
            } else if (res.status === 202) {
              swal({
                title: "Oopps!",
                text: "Action is prohibited as the date has already been posted",
                icon: "error",
                button: true,
              });
              return;
            } else {
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            }
          });
      }
    } catch (error) {
      console.error(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  const userData = filteredData?.map((data, i) => {
    const transactionDate = new Date(data.transaction_date);
    const formattedDate = transactionDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return {
      key: i,
      id: data.id,
      account_list_id_bank_from: data.account_list_id_bank_from,
      account_list_id_bank_to: data.account_list_id_bank_to,
      account_list_id_bank_froms: data.account_list_id_bank_froms,
      account_list_id_bank_tos: data.account_list_id_bank_tos,
      transaction_date: data.transaction_date,
      transaction_number: data.transaction_number,
      module_from: data.module_from,
      description: data.description,
      amount: data.amount,
      status: data.status,
      exchangeRate: data.exchangeRate,
      convertedAmount: data.convertedAmount,
    };
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Transaction #",
          "Account",
          "Transaction Date",
          "Description",
          "Issued To",
          "Subject From",
          "Amount",
          "Status",
        ],
      ],
      body: filteredData.map((data) => [
        data.transaction_number,
        data.account_list_id_bank_froms?.account_name,
        new Date(data.transaction_date).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        data.description,
        data.withdraw,
        data.module_from,
        data.amount,
        data.status,
      ]),
    });
    doc.save("bank_transactions.pdf");
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
      ) : authrztn.includes("BankTransactions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">BANK TRANSACTION - DETAILS</span>
            </div>
          </div>

          <div className="row mt-3">
            {/* <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Remaining Balance</h5>
                  <p className="card-text text-success amount">
                    ₱{totals.totalBalance}
                  </p>
                </div>
              </div>
            </div> */}
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bx-money me-1 h-100"></i>
                    Total In
                  </h5>
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      ` ₱${parseFloat(totals.totalWithdraw).toLocaleString(
                        "en-PH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
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
                      ` ₱${parseFloat(totals.totalDeposit).toLocaleString(
                        "en-PH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
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

          <div className="w-100 row mx-0 mt-3 align-items-end">
            <div className="col-sm mb-2">
              {/* <select
                  className="form-select"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <option value="">Account</option>
                  {accounts.map((account, index) => (
                    <option key={index} value={account}>
                      {account}
                    </option>
                  ))}
                </select> */}
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
            {/* <div className="col-sm mb-2">
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
            </div> */}
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
          </div>

          {/* <div className="w-100 row mx-0 mt-3 align-items-center">
            {authrztn.includes("BankTransactions-IE") && (
              <div className="col-sm d-flex input-group justify-content-end mb-2 align-items-center">
                <CSVLink
                  data={userData}
                  filename={"bank_transactions.csv"}
                  className="btn btn-primary me-2 custom-btn"
                >
                  Export CSV
                </CSVLink>
                <button
                  onClick={exportPDF}
                  className="btn btn-primary custom-btn"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div> */}
          <div className="w-100 mt-2 container-fluid">
            <div className="input-group mb-3">
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
                      setSelectedAccount("");
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
            <DataTable
              columns={columns}
              data={userData}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...pagination} />

            {/* Currency Rate Modal */}
            <Modal show={show} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>Currency Rate</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div>
                  <label htmlFor="currency-rate" className="mb-2">
                    Foreign Rate
                  </label>
                  <input
                    type="number"
                    id="currency-rate"
                    name="currency_rate"
                    className="form-control"
                    placeholder="Enter Foreign Rate"
                    value={currencyRate}
                    onChange={(e) => setCurrencyRate(e.target.value)}
                    onKeyDown={(e) => {
                      ["-", "e", "+"].includes(e.key) && e.preventDefault();
                    }}
                    min={0}
                    required
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </Modal.Footer>
            </Modal>
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
}

export default BankTransaction;
