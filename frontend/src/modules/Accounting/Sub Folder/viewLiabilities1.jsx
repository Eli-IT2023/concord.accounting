import React, { useState, useEffect } from "react";
import { Table, Modal, Button, Form, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
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

const ViewLiabilities1 = () => {
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleShow2 = () => setShowModal2(true);

  const handleClose = () => {
    setShowModal(false);
    setShowModal2(false);
  };

  // function for the specific row undisabled
  const [enabledRow, setEnabledRow] = useState(null);

  const handleEnableRow = (rowId) => {
    setEnabledRow(rowId); // Enable the clicked row, and disable all others
  };

  const isRowEnabled = (rowId) => enabledRow === rowId; // Check if a specific row is enabled
  // State for dropdown selections
  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // State to manage disabled states
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);

  // Options mapping
  const dropdownOptions = {
    Bank: {
      subject2: ["BDO", "AUB", "BPI"],
      subject3: [
        "0105 0203 04",
        "1234 5678 90",
        "0987 6543 21",
        "0690 6901 96",
        "Chester Minoza",
      ],
    },
    Cash: {
      subject2: ["Cash G", "Bills", "Shipping", "Petty Cash 1"],
      subject3: ["Meralco", "NMAX", "Spaylater", "Cash Subject 3", "Lalamove"],
    },
    Liabilities: {
      subject2: ["Employee Loan", "SSS Loan", "Car Loan", "Advance Payment"],
      subject3: [
        "Chester Employee Loan",
        "Gerard SSS Loan",
        "Chester Car Loan",
        "Rental",
        "Tax",
      ],
    },
    Asset: {
      subject2: ["Real Estate", "Commodities", "Futures", "Other Derivatives"],
      subject3: ["Malinta Lupa", "Pepsi Resell", "Stocks"],
    },
    Capital: {
      subject2: ["Building", "Vehicle", "Patents"],
      subject3: [
        "Gerard's Lambo",
        "Chester's 15 hectare property",
        "Joseph's 70 foot building",
      ],
    },
  };

  // Update subject2 and subject3 based on Subject 1 selection
  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    setSubject1(selectedSubject1);
    setSubject2("");
    setSubject3("");
    setPaymentMethod("");
    setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
    setIsSubject3Disabled(true); // Reset and disable Subject 3
    setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
    setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  };

  // Update Subject 3 based on Subject 2 selection
  const handleSubject2Change = (event) => {
    const selectedSubject2 = event.target.value;
    setSubject2(selectedSubject2);
    setSubject3("");
    setPaymentMethod("");
    setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
    setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
    setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  };

  // Enable payment method after Subject 3 selection
  const handleSubject3Change = (event) => {
    const selectedSubject3 = event.target.value;
    setSubject3(selectedSubject3);
    setPaymentMethod("");
    setIsPaymentMethodDisabled(false); // Enable Payment Method after Subject 3 selection
    setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
  };

  // Enable Remarks/Check No. after Payment Method selection
  const handlePaymentMethodChange = (event) => {
    const selectedPaymentMethod = event.target.value;
    setPaymentMethod(selectedPaymentMethod);
    setIsRemarksDisabled(false); // Enable Remarks/Check No. after Payment Method selection
  };

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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 150000000,
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
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link to="/accounting/liabilities1" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            View Account
          </span>
        </div>
        <div className="d-flex flex-row align-items-center row">
          <div className="col-sm">
            <span className="">Currency Converter</span>
          </div>
          <div className="col-sm">
            <select name="" id="" className="form-select p-2">
              <option value="" selected disabled>
                Select Currency
              </option>
            </select>
          </div>
        </div>
      </div>
      <div className="container mt-3">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="w-100 h-100 border shadow-sm rounded p-2">
              <h5>Account Details</h5>
              <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <span
                  className="text-primary"
                  style={{ fontWeight: 500, fontSize: "1.1rem" }}
                >
                  Employee 1
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  Bank
                </span>
                <span style={{ fontWeight: 500 }}>Local Currency</span>
              </div>
              <br />
              <h5>Account Balance</h5>
              <div
                className="card p-2 mt-2 shadow-sm d-flex align-items-center justify-content-center"
                style={{ height: "8rem" }}
              >
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "2rem",
                    color: "#4b49ac",
                  }}
                >
                  ₱ 150,133.02
                </span>
              </div>
              <br />
              <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <div className="w-100 h-100 d-flex flex-row justify-content-around align-items-center">
                  <button
                    className="btn btn-outline-danger px-5"
                    onClick={handleShow}
                  >
                    Credit
                  </button>
                  <button
                    className="btn btn-outline-success px-5"
                    onClick={handleShow}
                  >
                    Debit
                  </button>
                </div>
              </div>
              <br />
            </div>
          </div>
          <div className="col-12 col-md-8">
            <div className="balance-chart w-100">
              <Card>
                <Card.Body>
                  <Card.Title>Balance</Card.Title>
                  <Line options={chartOptions} data={chartData} />
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <div className="w-100 d-flex align-items-center my-4">
        <span>Transaction History</span>
        <hr className="flex-grow-1 mx-3" />
      </div>

      <div className="w-100">
        <div className="row">
          <div className="col-sm">
            <div className="row">
              <div className="col-sm mb-2">
                <span>From</span>
                <input type="date" name="" id="" className="form-control p-2" />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input type="date" name="" id="" className="form-control p-2" />
              </div>
            </div>
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
            <button className="btn w-100">Apply Filter</button>
            <button className="btn btn-secondary w-100">Clear Filter</button>
          </div>
          <div className="col-sm"></div>
        </div>
        <table className="table table-bordered table-hover mt-2">
          <thead className="table-light">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Payment Method</th>
              <th className="p-2">Transaction No.</th>
              <th className="p-2">Withdraw</th>
              <th className="p-2">Payment Method</th>
              <th className="p-2">Deposit</th>
              <th className="p-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-02-15</td>
              <td>Cash</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>200,000.00</td>
              <td>200,000.00</td>
            </tr>
            <tr>
              <td>2024-02-15</td>
              <td>Check</td>
              <td>#16182932</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>250,000.00</td>
              <td>450,000.00</td>
            </tr>
            <tr>
              <td>2024-02-18</td>
              <td>Check</td>
              <td>#00012389-001</td>
              <td>150,000.00</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>300,000.00</td>
            </tr>
            <tr>
              <td>2024-02-18</td>
              <td>Check</td>
              <td>#00012389-002</td>
              <td>150,000.00</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>150,000.00</td>
            </tr>
            <tr>
              <td>2024-02-29</td>
              <td>Other Income</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>156.23</td>
              <td>150,156.23</td>
            </tr>
            <tr>
              <td>2024-02-29</td>
              <td>Expenses</td>
              <td>-- -- --</td>
              <td>23.21</td>
              <td>-- -- --</td>
              <td>-- -- --</td>
              <td>150,133.02</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* In */}
      <Modal show={showModal} onHide={handleClose} backdrop="static" size="xl">
        <Modal.Header className="border-0">
          <Modal.Title>Payment Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table bordered>
            <thead>
              <tr>
                <th>Subject 1</th>
                <th>Subject 2</th>
                <th>Subject 3</th>
                <th>Payment Method</th>
                <th>{paymentMethod === "Bank" ? "Check No." : "Remarks"}</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "15px" }}>
                  <select
                    className="form-select"
                    onChange={handleSubject1Change}
                    value={subject1}
                  >
                    <option value="" selected disabled>
                      Select Subject 1
                    </option>
                    {Object.keys(dropdownOptions).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "15px" }}>
                  <select
                    className="form-select"
                    onChange={handleSubject2Change}
                    value={subject2}
                    disabled={isSubject2Disabled}
                  >
                    <option value="" selected disabled>
                      Select Subject 2
                    </option>
                    {dropdownOptions[subject1]?.subject2.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "15px" }}>
                  <select
                    className="form-select"
                    onChange={handleSubject3Change}
                    value={subject3}
                    disabled={isSubject3Disabled}
                  >
                    <option value="" selected disabled>
                      Select Subject 3
                    </option>
                    {dropdownOptions[subject1]?.subject3.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "15px" }}>
                  <select
                    className="form-select"
                    onChange={handlePaymentMethodChange}
                    value={paymentMethod}
                    disabled={isPaymentMethodDisabled}
                  >
                    <option value="" selected disabled>
                      Select Payment Method
                    </option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Online">Online</option>
                  </select>
                </td>
                <td style={{ padding: "15px" }}>
                  <input
                    type="text"
                    className="form-control"
                    disabled={isRemarksDisabled}
                  />
                </td>
                <td style={{ padding: "15px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.00"
                    disabled={isRemarksDisabled}
                  />
                </td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Out */}

      <Modal show={showModal2} onHide={handleClose} backdrop="static" size="xl">
        <Modal.Header className="border-0">
          <Modal.Title>Payment Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table bordered>
            <thead>
              <tr>
                <th>Subject 1</th>
                <th>Subject 2</th>
                <th>Payment Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEnableRow("bank")}
                    >
                      Bank
                    </Button>
                  </div>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("bank")}
                  >
                    <option value="" selected disabled>
                      Select Account
                    </option>
                    <option value="">Bank 1</option>
                    <option value="">Bank 2</option>
                    <option value="">Bank 3</option>
                    <option value="">Bank 4</option>
                  </select>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("bank")}
                  >
                    <option value="" selected disabled>
                      Select Payment Method
                    </option>
                    <option value="">Bank</option>
                    <option value="">Cash</option>
                    <option value="">Check</option>
                    <option value="">Online</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    placeholder="0.00"
                    disabled={!isRowEnabled("bank")}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEnableRow("cash")}
                    >
                      Cash
                    </Button>
                  </div>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("cash")}
                  >
                    <option value="" selected disabled>
                      Select Account
                    </option>
                    <option value="">Cash 1</option>
                    <option value="">Cash 2</option>
                    <option value="">Cash 3</option>
                    <option value="">Cash 4</option>
                  </select>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("cash")}
                  >
                    <option value="" selected disabled>
                      Select Payment Method
                    </option>
                    <option value="">Bank</option>
                    <option value="">Cash</option>
                    <option value="">Check</option>
                    <option value="">Online</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    placeholder="0.00"
                    disabled={!isRowEnabled("cash")}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEnableRow("asset")}
                    >
                      Asset
                    </Button>
                  </div>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("asset")}
                  >
                    <option value="" selected disabled>
                      Select Account
                    </option>
                    <option value="">Asset 1</option>
                    <option value="">Asset 2</option>
                    <option value="">Asset 3</option>
                    <option value="">Asset 4</option>
                  </select>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("asset")}
                  >
                    <option value="" selected disabled>
                      Select Payment Method
                    </option>
                    <option value="">Bank</option>
                    <option value="">Cash</option>
                    <option value="">Check</option>
                    <option value="">Online</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    placeholder="0.00"
                    disabled={!isRowEnabled("asset")}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleEnableRow("liabilities")}
                    >
                      Liabilities
                    </Button>
                  </div>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("liabilities")}
                  >
                    <option value="" selected disabled>
                      Select Account
                    </option>
                    <option value="">Liabilities 1</option>
                    <option value="">Liabilities 2</option>
                    <option value="">Liabilities 3</option>
                    <option value="">Liabilities 4</option>
                  </select>
                </td>
                <td>
                  <select
                    name=""
                    id=""
                    className="form-select p-2"
                    disabled={!isRowEnabled("liabilities")}
                  >
                    <option value="" selected disabled>
                      Select Payment Method
                    </option>
                    <option value="">Bank</option>
                    <option value="">Cash</option>
                    <option value="">Check</option>
                    <option value="">Online</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name=""
                    id=""
                    className="form-control p-2"
                    placeholder="0.00"
                    disabled={!isRowEnabled("liabilities")}
                  />
                </td>
              </tr>
            </tbody>
          </Table>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ViewLiabilities1;
