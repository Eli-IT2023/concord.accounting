import React, { useState, useEffect } from "react";
import "../../styles/accounting.css";
import axios from "axios";
import {
  Dropdown,
  DropdownButton,
  Card,
  Button,
  Form,
  Table,
  Modal,
} from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import { useParams } from "react-router-dom";
import {
  Cardholder,
  ArrowCircleUp,
  ArrowCircleDown,
  HandWithdraw,
} from "@phosphor-icons/react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ViewAccountList = () => {
  const { id } = useParams();
  const [accountTransactionData, setAccountTransactionData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [accountListData, setAccountListData] = useState([]);

  const [validated, setValidated] = useState(false);
  const [currency, setCurrency] = useState("");
  const [CurrencyId, setCurrencyId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankType, setBankType] = useState("");
  const [bankBalance, setBankBalance] = useState(0);
  const [convertedBankBalance, setConvertedBankBalance] = useState(0);
  const [currencyData, setCurrencyData] = useState([]);
  const [selectConvertedCurrency, setSelectedConvertedCurrency] =
    useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [Remarks, setRemarks] = useState("");
  const [UsedFor, setUsedFor] = useState("");
  const [Reference, setReference] = useState("");
  const [DateTransaction, setDateTransaction] = useState("");
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const [TransactionOption, setOption] = useState("");
  const [chartData, setChartData] = useState({
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Balance",
        data: Array(12).fill(0), // Initialize with 0 balance for all months
        borderColor: "rgb(178, 161, 255)",
        backgroundColor: "rgba(178, 161, 255, 0.3)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [modalBankTransfer, setModalBankTransfer] = useState(false);
  const [modalWithdrawDeposit, setModalWithdrawDeposit] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  const handleModalWithdrawDepositClose = () => {
    setModalWithdrawDeposit(false);
    setTotalAmount(0);
    setRemarks("");
    setUsedFor("");
    setReference("");
    setDateTransaction("");
    setOption("");
  };
  const handleModalWithdrawDepositShow = (title) => {
    setModalTitle(title);
    setModalWithdrawDeposit(true);
  };

  const handleModalBankTransferClose = () => {
    setModalBankTransfer(false);
    setTotalAmount(0);
    setRemarks("");
    setUsedFor("");
    setReference("");
    setDateTransaction("");
    setSelectedBankAccount("");
  };

  const handleModalBankTransferShow = (title) => {
    setModalTitle(title);
    setModalBankTransfer(true);
  };

  const fetchAccountData = async () => {
    try {
      axios
        .get(`${BASE_URL}/accountList/fetchAccountLists`, {
          params: { id: id },
        })
        .then((res) => {
          if (res.data) {
            setAccountListData(res.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching account transaction data:", error);
        });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAccountListData = () => {
    axios
      .get(`${BASE_URL}/accountList/fetchAccountEdit`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          setAccountName(res.data[0].account_name);
          setAccountNumber(res.data[0].account_number);
          setBankName(res.data[0].bank_name);
          setBankBalance(res.data[0].bank_amount);
          setBankType(res.data[0].account_type);
          setCurrency(res.data[0].currency.currency_name);
          setCurrencyId(res.data[0].currency.id);
        }
      })
      .catch((error) => {
        console.error("Error fetching account transaction data:", error);
      });
  };

  const fetchAccountTransactionData = () => {
    axios
      .get(`${BASE_URL}/accountList/getAccountTransaction`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          setAccountTransactionData(res.data);
          setFilteredData(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching account transaction data:", error);
      });
  };

  const fetchAccountBalance = () => {
    axios
      .get(`${BASE_URL}/accountList/getAccountBalance`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const balances = res.data.map((item) => item.total_balance);
          setChartData((prevData) => ({
            ...prevData,
            datasets: [
              {
                ...prevData.datasets[0],
                data: balances,
              },
            ],
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching account transaction data:", error);
      });
  };

  const fetchCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrencyData(res.data);
    });
  };

  useEffect(() => {
    fetchCurrency();
    fetchAccountTransactionData();
    fetchAccountListData();
    fetchAccountData();
    fetchAccountBalance();
  }, []);

  //informing the user for the inputted amount exceed to their balance
  useEffect(() => {
    if (totalAmount > bankBalance) {
      swal({
        icon: "warning",
        title: "Exceeds Balance",
        text: "The entered amount exceeds your bank balance.",
      }).then(() => {
        setTotalAmount(bankBalance);
      });
    }
  }, [totalAmount, bankBalance]);

  //filter function section
  const filterData = () => {
    let filtered = accountTransactionData;

    if (fromDate) {
      filtered = filtered.filter((acc) => {
        const transactionDate = new Date(acc.transaction_date);
        return transactionDate >= new Date(fromDate);
      });
    }

    if (toDate) {
      filtered = filtered.filter((acc) => {
        const transactionDate = new Date(acc.transaction_date);
        return transactionDate <= new Date(toDate);
      });
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    filterData();
  }, [fromDate, toDate]);
  //filter function section

  //function sa pag select ng currency at pag input ng amount
  // const handleCurrencyChange = (event) => {
  //   const selectedCurrencyId = event.target.value;
  //   setSelectedCurrencyId(selectedCurrencyId);
  //   const selected = currencyData.find(
  //     (currency) => currency.id === parseInt(selectedCurrencyId)
  //   );
  //   setSelectedCurrency(selected);
  //   calculateTotalAmount(amount, selected);
  // };
  // const handleAmountChange = (event) => {
  //   const inputAmount = event.target.value;
  //   setAmount(inputAmount);
  //   calculateTotalAmount(inputAmount, selectedCurrency);
  // };

  // const calculateTotalAmount = (inputAmount, currency) => {
  //   if (inputAmount && currency) {
  //     const total = parseFloat(inputAmount) * currency.currency_rate;
  //     setTotalAmount(total.toFixed(2));
  //   } else {
  //     setTotalAmount(0);
  //   }
  // };
  //function sa pag select ng currency at pag input ng amount

  const handleCurrencySelect = (currencyId) => {
    const selectedCurrencyData = currencyData.find(
      (currency) => currency.id === currencyId
    );

    if (selectedCurrencyData) {
      const currencyRate = selectedCurrencyData.currency_rate; // Assuming this exists
      const newConvertedBalance = bankBalance * currencyRate;

      setSelectedConvertedCurrency(selectedCurrencyData.currency_name);
      setConvertedBankBalance(newConvertedBalance);
    }
  };

  useEffect(() => {
    setConvertedBankBalance(bankBalance);
  }, [bankBalance]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1500000,
        ticks: {
          callback: (value) => `₱${value.toLocaleString()}`,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
      },
    },
  };

  //function for create transaction
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      axios
        .post(BASE_URL + "/accountList/createTransaction", {
          id,
          modalTitle,
          CurrencyId,
          totalAmount,
          Remarks,
          UsedFor,
          Reference,
          DateTransaction,
          TransactionOption,
        })
        .then((response) => {
          if (response.status === 200) {
            swal({
              title: `${modalTitle} Successfully!`,
              text: `The ${modalTitle} has been successful.`,
              icon: "success",
              button: "OK",
            }).then(() => {
              setValidated(false);
              handleModalWithdrawDepositClose();
              fetchAccountTransactionData();
              fetchAccountListData();
            });
          } else if (response.status === 201) {
            swal({
              title: `Error on ${modalTitle} process`,
              text: "Please check information.",
              icon: "error",
            }).then(() => {
              setValidated(false);
              handleModalWithdrawDepositClose();
              fetchAccountTransactionData();
              fetchAccountListData();
            });
          }
        });
    }
    setValidated(true);
  };

  //function for bank transfer
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      axios
        .post(BASE_URL + "/accountList/bankTransfer", {
          id,
          selectedBankAccount,
          modalTitle,
          CurrencyId,
          totalAmount,
          Remarks,
          UsedFor,
          Reference,
          DateTransaction,
          TransactionOption,
        })
        .then((response) => {
          if (response.status === 200) {
            swal({
              title: `${modalTitle} Successfully!`,
              text: `The ${modalTitle} has been successful.`,
              icon: "success",
              button: "OK",
            }).then(() => {
              setValidated(false);
              handleModalBankTransferClose();
              fetchAccountTransactionData();
              fetchAccountListData();
            });
          } else if (response.status === 201) {
            swal({
              title: `Error on ${modalTitle} process`,
              text: "Please check information.",
              icon: "error",
            }).then(() => {
              setValidated(false);
              handleModalBankTransferClose();
              fetchAccountTransactionData();
              fetchAccountListData();
            });
          }
        });
    }
    setValidated(true);
  };
  return (
    <>
      <div className="account-summary-container">
        <div className="first-content">
          <div className="header">
            <h1>ACCOUNT SUMMARY</h1>
            <div className="currency-converter">
              <span>Currency Converter</span>
              <DropdownButton
                id="currency-dropdown"
                title={selectConvertedCurrency || "Select Currency"}
                size="sm"
                variant="outline-secondary"
              >
                {currencyData.map((currency, index) => (
                  <Dropdown.Item
                    key={index}
                    eventKey={currency.id}
                    onClick={() => handleCurrencySelect(currency.id)}
                  >
                    {currency.currency_name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </div>
            <DropdownButton
              id="options-dropdown"
              title="⋮"
              variant="link"
              className="three-dots"
            >
              <Dropdown.Item>Export</Dropdown.Item>
            </DropdownButton>
          </div>

          <div className="content">
            <div className="account-details">
              <div className="header-account-details">
                <span>Account Details</span>
                <span>{bankType}</span>
              </div>
              <div className="account-info-content">
                <span>{accountName}</span>
                <span>{accountNumber}</span>
                <span>{bankName}</span>
              </div>

              <div className="my-balance-info">
                <div className="head-my-balance">
                  <span>My Balance</span>
                  <Button
                    variant="secondary"
                    onClick={() => handleModalBankTransferShow("Bank Transfer")}
                  >
                    <HandWithdraw
                      size={20}
                      color="#f7f7f7"
                      style={{ marginRight: "5px" }}
                    />
                    Bank Transfer
                  </Button>
                </div>
                <span>
                  {convertedBankBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span>
                  <Cardholder size={32} color="#5eb159" />
                </span>
              </div>

              <div className="btn-withdraw-deposit">
                <Button
                  variant="outline-success"
                  onClick={() => handleModalWithdrawDepositShow("Withdraw")}
                >
                  <ArrowCircleUp
                    size={20}
                    color="#5eb159"
                    style={{ marginRight: "5px" }}
                  />
                  Withdraw
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleModalWithdrawDepositShow("Deposit")}
                >
                  <ArrowCircleDown
                    size={20}
                    color="#f7f7f7"
                    style={{ marginRight: "5px" }}
                  />
                  Deposit
                </Button>
              </div>
            </div>

            <div className="balance-chart">
              <Card>
                <Card.Body>
                  <Card.Title>Balance</Card.Title>
                  <Line options={chartOptions} data={chartData} />
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>

        <div className="second-content">
          <div className="transaction-section">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a className="nav-link active" href="#">
                  Transaction History
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Distributed Funds
                </a>
              </li>
            </ul>

            <div className="transaction-filters">
              <div className="date-range">
                <Form.Group className="mb-3">
                  <Form.Label>From:</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>To:</Form.Label>
                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </Form.Group>
              </div>
              {/* <Form.Control
                type="text"
                placeholder="Search"
                className="search-input"
              /> */}
            </div>

            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TRANSACTION NO.</th>
                  <th>USED FOR</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((acc, index) => (
                  <tr key={index}>
                    <td>{acc.transaction_date}</td>
                    <td>{acc.reference}</td>
                    <td>{acc.used_for}</td>
                    <td>{acc.remarks}</td>
                    <td>
                      {acc.total_amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{acc.type}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Withdraw and Deposit  */}
      <Modal
        show={modalWithdrawDeposit}
        onHide={handleModalWithdrawDepositClose}
        size="lg"
      >
        <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
          <Modal.Header closeButton style={{ borderBottom: "none" }}>
            <Modal.Title></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-column">
              <div className="d-flex">
                <h3>{modalTitle}</h3>
              </div>
              <div className="d-flex">
                <p style={{ fontSize: "12px" }}>
                  This transaction is an instant {bankType}
                  {modalTitle === "Withdraw" ? (
                    <strong> Withdrawal</strong>
                  ) : modalTitle === "Deposit" ? (
                    <strong> Deposit</strong>
                  ) : (
                    ""
                  )}
                </p>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="bankAccount">
                  <Form.Label>Bank Account</Form.Label>
                  <Form.Control
                    type="text"
                    readOnly
                    className="p-3"
                    value={`${bankName} - ${accountName}`}
                  />
                </Form.Group>
              </div>
              <div className="col-sm">
                <Form.Group controlId="option">
                  <Form.Label>
                    {modalTitle === "Withdraw"
                      ? "Withdrawal"
                      : modalTitle === "Deposit"
                      ? "Deposit"
                      : ""}
                  </Form.Label>
                  <Form.Select
                    className="p-3"
                    onChange={(e) => setOption(e.target.value)}
                    value={TransactionOption}
                    required
                  >
                    <option value="" disabled>
                      Select Option
                    </option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Check">Check</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-5">
                <Form.Group controlId="date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="date"
                    onChange={(e) => setDateTransaction(e.target.value)}
                    value={DateTransaction}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-2">
                <Form.Group controlId="currency">
                  <Form.Label>Currency</Form.Label>
                  <Form.Control
                    type="text"
                    readOnly
                    className="p-3"
                    value={currency}
                  />
                </Form.Group>
              </div>
              <div className="col-5">
                <Form.Group controlId="date">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="number"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="date">
                  <Form.Label>Reference</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="text"
                    placeholder="0000 000 000"
                    onChange={(e) => setReference(e.target.value)}
                    required
                    value={Reference}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">Used For</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="used for"
                    className="p-3"
                    required
                    onChange={(e) => setUsedFor(e.target.value)}
                    value={UsedFor}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    style={{
                      fontSize: "16px",
                      height: "200px",
                      maxHeight: "200px",
                      resize: "none",
                      overflowY: "auto",
                    }}
                    placeholder="Enter Remarks"
                    onChange={(e) => setRemarks(e.target.value)}
                    value={Remarks}
                    required
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "none" }}>
            <Button
              variant="secondary"
              type="button"
              onClick={handleModalWithdrawDepositClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Bank Transfer */}
      <Modal
        show={modalBankTransfer}
        onHide={handleModalBankTransferClose}
        size="lg"
      >
        <Form noValidate validated={validated} onSubmit={handleBankSubmit}>
          <Modal.Header closeButton style={{ borderBottom: "none" }}>
            <Modal.Title></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-column">
              <div className="d-flex">
                <h3>{modalTitle}</h3>
              </div>
              <div className="d-flex">
                <p style={{ fontSize: "12px" }}>
                  This transaction is an instant <strong>{modalTitle}</strong>
                </p>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="bankAccount">
                  <Form.Label>Bank Account</Form.Label>
                  <Form.Control
                    type="text"
                    readOnly
                    className="p-3"
                    value={`${bankName} - ${accountName}`}
                  />
                </Form.Group>
              </div>
              <div className="col-sm">
                <Form.Group controlId="option">
                  <Form.Label>Account Lists</Form.Label>
                  <Form.Select
                    className="p-3"
                    required
                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                    value={selectedBankAccount}
                  >
                    <option value="" disabled>
                      Select Option
                    </option>
                    {accountListData.map((acc, index) => (
                      <option key={index} value={acc.account_list_id}>
                        {`${acc.bank_name} - ${acc.account_name}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-5">
                <Form.Group controlId="date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="date"
                    required
                    onChange={(e) => setDateTransaction(e.target.value)}
                    value={DateTransaction}
                  />
                </Form.Group>
              </div>
              <div className="col-2">
                <Form.Group controlId="currency">
                  <Form.Label>Currency</Form.Label>
                  <Form.Control
                    type="text"
                    readOnly
                    className="p-3"
                    value={currency}
                  />
                </Form.Group>
              </div>
              <div className="col-5">
                <Form.Group controlId="date">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="number"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="date">
                  <Form.Label>Reference</Form.Label>
                  <Form.Control
                    className="p-3"
                    type="text"
                    placeholder="0000 000 000"
                    required
                    onChange={(e) => setReference(e.target.value)}
                    value={Reference}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">Used For</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="used for"
                    className="p-3"
                    required
                    onChange={(e) => setUsedFor(e.target.value)}
                    value={UsedFor}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-sm">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    style={{
                      fontSize: "16px",
                      height: "200px",
                      maxHeight: "200px",
                      resize: "none",
                      overflowY: "auto",
                    }}
                    placeholder="Enter Remarks"
                    required
                    onChange={(e) => setRemarks(e.target.value)}
                    value={Remarks}
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "none" }}>
            <Button
              variant="secondary"
              type="button"
              onClick={handleModalBankTransferClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ViewAccountList;
