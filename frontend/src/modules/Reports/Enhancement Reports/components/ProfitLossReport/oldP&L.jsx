import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../../../assets/css/style.css";
import { parse } from "date-fns";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../../assets/img/NoAccess.png";
import { compactNumberFormat } from "../../../../../utils/numberFormatter";

const Profit_Loss = ({ authrztn }) => {
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");
  const [cutoffName, setCutOffName] = useState("");
  const [cutoffList, setCutoffList] = useState([]);

  const [previousData, setPreviousData] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");

  const [actualTransactionRate, setActualTransactionRate] = useState("");

  const [accountUSD, setAccountUSD] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [accounts, setAccounts] = useState(accountUSD);
  const [selectedTabID, setSelectedTabID] = useState(
    "22222222-2222-2222-2222-222222222222"
  );

  const [widget, setWidget] = useState({
    totalAmount: 0,
    totalConverted: 0,
    totalExchange: 0,
  });

  const [expandedRow, setExpandedRow] = useState(null);

  const getCutoff = async () => {
    await axios
      .get(`${BASE_URL}/cutoff/getCutoffs`)
      .then((res) => {
        const cutoffList_id = res.data[0].id;
        const cutoff_fromdate = res.data[0].from;
        const cutoff_todate = res.data[0].to;

        setCutoffList(res.data);
        setSelectedCutoff_id(cutoffList_id);
        setCutOffName(res.data[0].name);
        setThisFromdate(cutoff_fromdate || "");
        setThisTodate(cutoff_todate || "");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  console.log(thisFromdate, "from");
  console.log(thisTodate);

  const getCurrency = async () => {
    await axios
      .get(`${BASE_URL}/currency/fetchCurrency`)
      .then((res) => {
        setCurrencyData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccount = async () => {
    await axios
      .get(`${BASE_URL}/profit_loss/fetchAccountListUSD`, {
        params: {
          id: selectedTabID,
          thisFromdate,
          thisTodate,
        },
      })
      .then((res) => {
        setAccountUSD(res.data);
        console.log(res.data);
        const currentRate = res.data[0].currency.currency_rate;
        setActualTransactionRate(currentRate);
        setAccounts(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchPreviousCurrency = async () => {
    await axios
      .get(`${BASE_URL}/profit_loss/fetchPreviousCurrency`, {
        params: {
          id: selectedTabID,
          thisFromdate,
          thisTodate,
        },
      })
      .then((res) => {
        setPreviousData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    const totalAmount = accountUSD.reduce((total, acc) => {
      return total + acc.amount * acc.currency.currency_rate;
    }, 0);

    const totalConverted = accountUSD.reduce((grandTotal, account) => {
      const transactions = account.transactions ?? [];

      const accountTotal = transactions.reduce((total, tx) => {
        const amount = tx.amount || 0;
        const rate = tx.rate ?? tx.currency?.currency_rate ?? 1;
        return total + amount * rate;
      }, 0);

      return grandTotal + accountTotal;
    }, 0);

    const totalExchange = accountUSD.reduce((grandTotal, account) => {
      const transactions = account.transactions ?? [];

      const accountTotal = transactions.reduce((total, tx) => {
        const amount =
          tx.amount_to_deduct * tx.rate - tx.amount_to_deduct * tx.orig_rate;
        return total + amount;
      }, 0);

      return grandTotal + accountTotal;
    }, 0);

    setWidget({
      totalAmount: totalAmount,
      totalConverted: totalConverted,
      totalExchange: totalExchange,
    });
  }, [accountUSD, accounts]);

  // const handleRateChange = (index, newRate) => {
  //   const updatedAccounts = accounts.map((account, i) => {
  //     if (i === index) {
  //       const updatedRate = parseFloat(newRate) || 0;

  //       const systemAccount = accountUSD.find(
  //         (sysAcc) => sysAcc.id === account.id
  //       );

  //       const systemValue = systemAccount
  //         ? systemAccount.amount * systemAccount.currency.currency_rate
  //         : 0;

  //       const actualTransactionAmount = account.amount * updatedRate;

  //       const exchangeGainLoss = actualTransactionAmount - systemValue;

  //       return {
  //         ...account,
  //         currency: { ...account.currency, currency_rate: updatedRate },
  //         actualTransactionAmount,
  //         exchangeGainLoss,
  //       };
  //     }
  //     return account;
  //   });

  //   setAccounts(updatedAccounts);
  // };

  useEffect(() => {
    console.log("Acc", accountUSD);
  }, [accountUSD]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const dataAccount = accountUSD.map((item) => [
      item.account_name,
      item.currency.currency_name,
      item.amount,
      item.currency.currency_rate,
      item.amount * item.currency.currency_rate,
      actualTransactionRate,
      item.amount * actualTransactionRate,
      item.amount * actualTransactionRate -
        item.amount * item.currency.currency_rate,
    ]);

    const previous = previousData.map((item) => [
      item.account_list_sub3
        ? item.account_list_sub3.account_name
        : "Sales Receivable",
      item.currency.currency_name,
      item.amount,
      item.system_rate,
      item.system_value,
      item.actual_rate,
      item.actual_amount,
      item.exchange_gain_loss,
    ]);

    const exchange = accountUSD.flatMap((item) => {
      if (item.transactions && item.transactions.length > 0) {
        return item.transactions.map((txn) => [
          item.account_name,
          txn.amount_to_deduct,
          txn.rate,
          txn.account_list_id_bank_tos.account_name,
          txn.amount_to_deduct * txn.rate,
          txn.orig_rate,
          txn.amount_to_deduct * txn.orig_rate,
          txn.amount_to_deduct * txn.rate -
            txn.amount_to_deduct * txn.orig_rate,
        ]);
      } else {
        return [];
      }
    });

    // Overview Data with Headers
    const overviewData = [
      ["Accounting Period", cutoffName],
      ["Start Date", thisFromdate],
      ["End Date", thisTodate],
      ["Total Amount", widget.totalAmount],
      ["Total Converted Amount", widget.totalConverted],
      ["Total Exchange Rate", widget.totalConverted],
      [],
      [
        "Comming Account",
        "Currency",
        "Amount",
        "System Rate",
        "System Value",
        "Actual Transaction Rate",
        "Actual Transaction Amount",
        "Exhange Rate Gain or Loss",
      ],
      ...dataAccount,
      [],
      ["Exchange Rate"],
      [
        "Comming Account",
        "Amount",
        "Converted Rate",
        "Converted Value",
        "Going Account",
        "Actual Transaction Rate",
        "Actual Transaction Amount",
        "Exhange Rate Gain or Loss",
      ],
      ...exchange,
      [],
      ["Previous Currency"],
      [
        "Comming Account",
        "Currency",
        "Amount",
        "System Rate",
        "System Value",
        "Actual Transaction Rate",
        "Actual Transaction Amount",
        "Exhange Rate Gain or Loss",
      ],
      ...previous,
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

    // Export the workbook
    XLSX.writeFile(workbook, "Profit_&_Loss.xlsx");
  };

  const handleRateChange = (newRate) => {
    const updatedRate = parseFloat(newRate) || 0;

    const updatedAccounts = accounts.map((account) => {
      const systemAccount = accountUSD.find(
        (sysAcc) => sysAcc.id === account.id
      );

      const systemValue = systemAccount
        ? systemAccount.amount * systemAccount.currency.currency_rate
        : 0;

      const actualTransactionAmount = account.amount * updatedRate;

      const exchangeGainLoss = actualTransactionAmount - systemValue;

      return {
        ...account,
        currency: { ...account.currency, currency_rate: updatedRate },
        actualTransactionAmount,
        exchangeGainLoss,
      };
    });

    setAccounts(updatedAccounts);
  };

  // const handleRateChangeForTransactions = (index, tIndex, newRate) => {
  //   const updatedAccounts = [...accountUSD];

  //   const account = updatedAccounts[index];
  //   const transaction = account.transactions[tIndex];

  //   const updatedRate = parseFloat(newRate);
  //   // if (isNaN(updatedRate) || updatedRate <= 0) {
  //   //   return;
  //   // }

  //   const convertedValue = transaction.amount_to_deduct / transaction.rate;

  //   const actualTransactionAmount = transaction.amount_to_deduct / updatedRate;

  //   const exchangeGainLoss = actualTransactionAmount - convertedValue;

  //   transaction.currency.currency_rate = updatedRate;
  //   // transaction.rate = updatedRate;
  //   transaction.exchangeGainLoss = exchangeGainLoss;

  //   setAccounts(updatedAccounts);
  // };

  useEffect(() => {
    if (thisFromdate && thisTodate) {
      fetchAccount();
      fetchPreviousCurrency();
      getCurrency();
    }
  }, [thisFromdate, thisTodate, selectedTabID]);

  useEffect(() => {
    getCutoff();
  }, []);

  // useEffect(() => {
  //   // console.log("Accs", accounts);
  //   console.log("Dateee", thisFromdate);
  // }, [accounts, previousData, currencyData]);

  const handleClickTab = (id) => {
    // fetchAccount(parseFloat(id));
    // fetchPreviousCurrency(parseFloat(id));
    setSelectedTabID(id);

    setExpandedRow(null);
  };
  const handleCutoffChange = (value) => {
    console.log(value);
    setSelectedCutoff_id(value);
    const cutoff_fromdate =
      cutoffList.find((cutoff) => cutoff.id === value).from || "";
    const cutoff_todate =
      cutoffList.find((cutoff) => cutoff.id === value).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);
    setExpandedRow(null);
  };

  return (
    <div className="h-100 w-100  bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Profit & Loss</span>
            </div>
            <div>
              {authrztn.includes("Reporting-IE") && (
                <button className="btn btn-success" onClick={exportToExcel}>
                  Export Excel
                </button>
              )}
            </div>
          </div>
          <div className="w-100 row mx-auto mt-2">
            <h6>Accounting Period</h6>
            <div className="col-sm mb-2">
              <span>Cutoff</span>
              <Form.Select
                value={selectedCutoff_id}
                onChange={(e) => handleCutoffChange(e.target.value)}
                className="form-select"
                onMouseDown={(e) => {
                  if (cutoffList.length === 0) {
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
                {cutoffList.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-2">
              <span>From</span>
              {/* <input
            value={thisFromdate}
            type="date"
            readOnly
            name=""
            className="form-control"
            id=""
          /> */}
              <DatePicker
                selected={thisFromdate}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm mb-2">
              <span>To</span>
              {/* <input
            value={thisTodate}
            type="date"
            readOnly
            name=""
            className="form-control"
            id=""
          /> */}
              <DatePicker
                selected={thisTodate}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>

            <div className="col-sm"></div>
          </div>

          <div className="row my-3">
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bx-money me-1 h-100"></i>
                    Total Amount
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={widget.totalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {widget.totalAmount.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱
                    {widget.totalAmount
                      ? compactNumberFormat(widget.totalAmount)
                      : "0.00"} */}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bx-money me-1 h-100"></i>
                    Total Converted Amount
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={widget.totalConverted.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {widget.totalConverted.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱
                    {widget.totalConverted
                      ? compactNumberFormat(widget.totalConverted)
                      : "0.00"} */}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-center">
                    <i class="bx bx-money me-1 h-100"></i>
                    Total Exchange Rate
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={widget.totalExchange.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {widget.totalExchange.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱
                    {widget.totalExchange
                      ? compactNumberFormat(widget.totalExchange)
                      : "0.00"} */}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid mt-2">
            <Tabs
              defaultActiveKey="22222222-2222-2222-2222-222222222222"
              id="uncontrolled-tab-example"
              className="mb-3"
              onSelect={(key) => handleClickTab(key)}
            >
              {currencyData
                .filter((curr) => curr.currency_name !== "PHP")
                .map((curr) => (
                  <Tab
                    eventKey={String(curr.id)}
                    title={curr.currency_name}
                    key={curr.id}
                  >
                    <div className="container-fluid">
                      {/* Latest */}
                      <div className="row">
                        <div className="col-sm mb-3">
                          <div className="w-100 d-flex align-items-center mt-3 mb-3">
                            <h5>Latest Currency</h5>
                            <hr className="flex-grow-1 mx-3" />
                          </div>
                          <div className="w-100 d-flex align-items-center mt-3 mb-3">
                            <div className="d-flex w-50 justify-content-start align-items-center">
                              <h5 className="mb-0">
                                Actual Transaction Rate ({curr.currency_name}) ={" "}
                              </h5>
                              <Form.Control
                                type="number"
                                className="w-25"
                                step="any"
                                value={actualTransactionRate}
                                onChange={(e) => {
                                  setActualTransactionRate(e.target.value);
                                  handleRateChange(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  ["e", "E", "-", "+"].includes(e.key) &&
                                    e.preventDefault();
                                }}
                              />
                            </div>
                            <div className="w-50"></div>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-bordered table-striped">
                              <thead className="thead-light">
                                <tr>
                                  {/* Coming Account  */}
                                  <th></th>
                                  <th>Coming Account</th>
                                  <th>Currency</th>
                                  <th>Amount</th>
                                  <th>System Rate</th>
                                  <th>System Value</th>

                                  {/* Going Account  */}
                                  {/* <th>Going Account</th> */}
                                  <th>Actual Transaction Rate</th>
                                  <th>Actual Transaction Amount</th>
                                  <th>Exchange Rate Gain or Loss</th>
                                </tr>
                              </thead>
                              <tbody>
                                {accountUSD.map((account, index) => {
                                  const goingAccount = accounts[index] || {};

                                  return (
                                    <>
                                      <tr key={index}>
                                        <td>
                                          {account.transactions.length > 0 && (
                                            <i
                                              className={`bx ${
                                                expandedRow === index
                                                  ? "bx-chevron-up"
                                                  : "bx-chevron-down"
                                              }`}
                                              onClick={() =>
                                                expandedRow === index
                                                  ? setExpandedRow(null)
                                                  : setExpandedRow(index)
                                              }
                                            ></i>
                                          )}
                                        </td>
                                        <td className="">
                                          {account.account_name}
                                        </td>
                                        <td>
                                          {account.currency.currency_name}
                                        </td>
                                        <td>
                                          {account.amount.toLocaleString(
                                            "en-US",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </td>
                                        <td>
                                          {account.currency.currency_rate}
                                        </td>
                                        <td>
                                          {(
                                            account.amount *
                                            account.currency.currency_rate
                                          ).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </td>

                                        {/* Going Account Data */}
                                        {/* <td>{goingAccount.account_name || ""}</td> */}
                                        <td>
                                          <Form.Control
                                            type="number"
                                            step="any"
                                            value={
                                              goingAccount.currency
                                                ?.currency_rate || ""
                                            }
                                            // onChange={(e) =>
                                            //   handleRateChange(index, e.target.value)
                                            // }
                                            readOnly
                                          />
                                        </td>
                                        <td>
                                          {goingAccount.amount
                                            ? (
                                                goingAccount.amount *
                                                goingAccount.currency
                                                  ?.currency_rate
                                              ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : ""}
                                        </td>
                                        <td
                                          style={{
                                            color:
                                              !goingAccount.exchangeGainLoss ||
                                              goingAccount.exchangeGainLoss ===
                                                0
                                                ? "black"
                                                : goingAccount.exchangeGainLoss >
                                                  0
                                                ? "green"
                                                : "red",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {goingAccount.exchangeGainLoss?.toLocaleString(
                                            "en-US",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          ) || "0.00"}
                                        </td>
                                      </tr>

                                      {/* Expandeed */}
                                      {expandedRow === index && (
                                        <tr>
                                          <td colSpan="10">
                                            <div className="table-responsive">
                                              <table className="table table-primary mt-2">
                                                <thead className="thead-light">
                                                  <tr>
                                                    <th>Coming Account</th>
                                                    {/* <th>Currency</th> */}
                                                    <th>Amount</th>
                                                    <th>Converted Rate</th>
                                                    <th>Converted Value</th>
                                                    <th>Going Account</th>
                                                    <th>
                                                      Actual Transaction Rate
                                                    </th>
                                                    <th>
                                                      Actual Transaction Amount
                                                    </th>
                                                    <th>
                                                      Exchange Rate Gain or Loss
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {account.transactions.map(
                                                    (transaction, tIndex) => {
                                                      // Find the correct going account for this transaction
                                                      const transactionGoingAccount =
                                                        accounts.find(
                                                          (acc) =>
                                                            acc.id ===
                                                            transaction.account_list_id_bank_from
                                                        ) || {};

                                                      return (
                                                        <tr key={tIndex}>
                                                          <td>
                                                            {
                                                              account.account_name
                                                            }
                                                          </td>
                                                          {/* <td>
                                                    {
                                                      account.currency
                                                        .currency_name
                                                    }
                                                  </td> */}
                                                          <td>
                                                            {transaction.amount_to_deduct.toLocaleString(
                                                              "en-US",
                                                              {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                              }
                                                            )}
                                                          </td>
                                                          <td>
                                                            {/* {
                                                      account.currency
                                                        .currency_rate
                                                    } */}
                                                            {transaction.rate}
                                                          </td>
                                                          <td>
                                                            {(
                                                              transaction.amount_to_deduct *
                                                              transaction.rate
                                                            ).toLocaleString(
                                                              "en-US",
                                                              {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                              }
                                                            )}
                                                          </td>

                                                          <td>
                                                            {transaction
                                                              .account_list_id_bank_tos
                                                              .account_name ||
                                                              ""}
                                                          </td>
                                                          <td>
                                                            {/* <Form.Control
                                                      type="number"
                                                      step="any"
                                                      value={
                                                        accountUSD[index]
                                                          .transactions[tIndex]
                                                          .currency
                                                          .currency_rate
                                                      }
                                                      // value={transaction.rate}
                                                      // onChange={(e) => {
                                                      //   console.log(
                                                      //     "Rate Before Update:",
                                                      //     transaction.currency
                                                      //       .currency_rate
                                                      //   );
                                                      //   handleRateChangeForTransactions(
                                                      //     index,
                                                      //     tIndex,
                                                      //     e.target.value
                                                      //   );
                                                      // }}
                                                    /> */}

                                                            {
                                                              transaction.orig_rate
                                                            }
                                                          </td>
                                                          <td>
                                                            {transaction.amount_to_deduct
                                                              ? (
                                                                  transaction.amount_to_deduct *
                                                                  transaction.orig_rate
                                                                ) // Default to 0 if currency_rate is NaN
                                                                  .toLocaleString(
                                                                    "en-US",
                                                                    {
                                                                      minimumFractionDigits: 2,
                                                                      maximumFractionDigits: 2,
                                                                    }
                                                                  )
                                                              : "0.00"}
                                                          </td>
                                                          <td
                                                            style={{
                                                              color:
                                                                transaction.amount_to_deduct *
                                                                  transaction.rate -
                                                                  transaction.amount_to_deduct *
                                                                    transaction.orig_rate ===
                                                                0
                                                                  ? "black"
                                                                  : transaction.amount_to_deduct *
                                                                      transaction.rate -
                                                                      transaction.amount_to_deduct *
                                                                        transaction.orig_rate >
                                                                    0
                                                                  ? "green"
                                                                  : "red",
                                                              fontWeight:
                                                                "bold",
                                                            }}
                                                          >
                                                            {/* {isNaN(
                                                      transaction.exchangeGainLoss
                                                    )
                                                      ? "0.00"
                                                      : transaction.exchangeGainLoss?.toLocaleString(
                                                          "en-US",
                                                          {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                          }
                                                        ) ?? "0.00"} */}

                                                            {(
                                                              transaction.amount_to_deduct *
                                                                transaction.rate -
                                                              transaction.amount_to_deduct *
                                                                transaction.orig_rate
                                                            ).toLocaleString(
                                                              "en-US",
                                                              {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                              }
                                                            )}
                                                          </td>
                                                        </tr>
                                                      );
                                                    }
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      {/* Previous */}
                      <div className="row">
                        <div className="col-sm mb-3">
                          <div className="w-100 d-flex align-items-center mt-3 mb-3">
                            <h5>Previous Currency</h5>
                            <hr className="flex-grow-1 mx-3" />
                          </div>
                          <div className="table-responsive">
                            <table className="table table-bordered table-striped">
                              <thead className="thead-light">
                                <tr>
                                  {/* Coming Account  */}

                                  <th>Coming Account</th>
                                  <th>Currency</th>
                                  <th>Amount</th>
                                  <th>System Rate</th>
                                  <th>System Value</th>

                                  {/* Going Account  */}
                                  {/* <th>Going Account</th> */}
                                  <th>Actual Transaction Rate</th>
                                  <th>Actual Transaction Amount</th>
                                  <th>Exchange Rate Gain or Loss</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previousData.map((data, index) => (
                                  <>
                                    <tr key={index}>
                                      <td>
                                        {data.account_list_sub3
                                          ? data.account_list_sub3.account_name
                                          : "Sales Receivable"}
                                      </td>
                                      <td>{data.currency.currency_name}</td>
                                      <td>
                                        {data.amount.toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </td>
                                      <td>
                                        {data.system_rate.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </td>
                                      <td>
                                        {data.system_value.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </td>
                                      <td>{data.actual_rate}</td>
                                      <td>
                                        {data.actual_amount.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          color:
                                            data.exchange_gain_loss === 0
                                              ? "black"
                                              : data.exchange_gain_loss > 0
                                              ? "green"
                                              : "red",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {data.exchange_gain_loss.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </td>
                                    </tr>
                                  </>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab>
                ))}
            </Tabs>
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

export default Profit_Loss;
