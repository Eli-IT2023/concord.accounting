import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import { Table, Modal, Button, Form, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ViewCutoff = () => {
  const navigate = useNavigate();
  // State for dropdown selections
  const [subject1, setSubject1] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject2, setSubject2] = useState("");
  const [subject2Type, setSubject2Type] = useState("");
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [subject3, setSubject3] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [checkNo, setCheckNo] = useState("");
  const [date, setDate] = useState("");
  // State to manage disabled states
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [isPaymentMethodDisabled, setIsPaymentMethodDisabled] = useState(true);
  const [isRemarksDisabled, setIsRemarksDisabled] = useState(true);
  const [transaction, setTransaction] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [returnEarnings, setReturnEarnings] = useState(0);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const { id } = useParams();
  const [cutoff, setCutoff] = useState([]);
  const [validated, setValidated] = useState(false);
  const [totalAmountGraph, setTotalAmountGraph] = useState(0);

  const handleClose = () => {
    setShowModal(false);
    setValidated(false);
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setPaymentMethod("");
    setAmount("");
    setCheckNo("");
    setDate("");
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
    setIsPaymentMethodDisabled(true);
    setIsRemarksDisabled(true);
  };

  const reloadTable = () => {
    axios
      .get(`${BASE_URL}/cutoff/getTransaction`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setTransaction(res.data);

        const sumNetAmount = res.data.reduce(
          (acc, curr) => acc + curr.netAmount * curr.currency_rate,
          0
        );
        setReturnEarnings(sumNetAmount);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error.response || error);
      });
  };

  const Balance = () => {
    axios
      .get(`${BASE_URL}/accountListSub/getBalance`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        const balanceData = res.data.data; // Assuming res.data contains an array of { date, amount }
        const totalAmount = res.data.totalAmount;
        setTotalAmountGraph(totalAmount);

        // Initialize an array for 12 months (January = 0, December = 11)
        const monthlyData = Array(12).fill(0);

        // Loop through the balance data and accumulate amounts by month
        balanceData.forEach((balance) => {
          const date = new Date(balance.date); // Parse the date
          const month = date.getMonth(); // Get the month (0 = January, 11 = December)

          const amount = Math.abs(balance.amount); // Get the balance amount
          const amount_type = balance.type;

          if (amount_type === "Debit") {
            monthlyData[month] += amount; // Sum amounts for Debit types
          } else if (amount_type === "Credit") {
            monthlyData[month] -= amount; // Subtract amounts for Credit types
          }
        });

        // Log to verify the monthlyData array
        console.log("Monthly balance data:", monthlyData);

        // Update the chartData state with the accumulated monthly amounts
        setChartData((prevState) => ({
          ...prevState,
          datasets: [
            {
              ...prevState.datasets[0],
              data: monthlyData, // Set the processed monthly data to the chart
            },
          ],
        }));
      })
      .catch((error) => {
        console.error("Error fetching balance:", error);
      });
  };

  const reloadCutoffDetails = () => {
    axios
      .get(`${BASE_URL}/cutoff/fetchCutoffbyID`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setCutoff(res.data);
      });
  };

  useEffect(() => {
    Balance();

    reloadCutoffDetails();

    reloadTable();
  }, []);

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
        label: "Net Balance",
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
        max: totalAmountGraph,
        ticks: {
          callback: (value) =>
            // `${cutoff?.currency?.currency_name} ${value.toLocaleString()}`,
            `P`,
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

  // Update subject2 and subject3 based on Subject 1 selection
  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      account_selected = "Account-List";
    } else if (selectedSubject1 === "Asset Account") {
      account_selected = "Asset Account";
    } else if (selectedSubject1 === "Liabilities Account") {
      account_selected = "Liabilities Account";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      account_selected = "Owner's Equity Account";
    }

    try {
      axios
        .get(`${BASE_URL}/accountListSub/getSubject`, {
          params: {
            account_selected: account_selected,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);

          setSubject2("");
          setSubject3("");
          setPaymentMethod("");
          setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
          setIsSubject3Disabled(true); // Reset and disable Subject 3
          setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
          setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.

          setSubject2DataList(res.data); //retrieve subject 2 data
        });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
  };

  // Update Subject 3 based on Subject 2 selection
  const handleSubject2Change = (event, subject_type) => {
    const selectedSubject2 = event.target.value;

    try {
      axios
        .get(`${BASE_URL}/accountListSub/getSubject3ChainDropdown`, {
          params: {
            subjectId: selectedSubject2,
            id: 0,
          },
        })
        .then((res) => {
          setSubject3DataList(res.data);
          setSubject2(selectedSubject2);
          setSubject3("");
          setPaymentMethod("");
          setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
          setIsPaymentMethodDisabled(true); // Reset and disable Payment Method
          setIsRemarksDisabled(true); // Reset and disable Remarks/Check No.
          setSubject2Type(subject_type);
        });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
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

  //function for create transaction
  const handleFormSubmit = async (e, type) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      try {
        const willProceed = await swal({
          title: "Are you sure?",
          text: "Once submitted, you will not be able to edit this transaction.",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });

        if (willProceed) {
          const response = await axios.post(
            `${BASE_URL}/cutoff/addOtherIncome`,
            {
              subject3,
              paymentMethod,
              amount,
              checkNo,
              date,
              type,
              id,
            }
          );

          if (response.status === 200) {
            swal({
              icon: "success",
              title: "Other Income created successfully",
              timer: 2000,
            }).then(() => {
              handleClose();
              reloadTable();
              reloadCutoffDetails();
              Balance();
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
            });
          }
        }
      } catch (error) {
        console.error(error);
        swal({
          icon: "error",
          title: "Something went wrong",
          text: "Please contact your support immediately",
          timer: 2000,
        });
      }
    }
  };

  const handleAmountChange = (value) => {
    setAmount(value);
  };

  const columns = [
    {
      name: "Date",
      selector: (row) => row.date && format(row.date, "MMM/dd/yyyy"),
    },
    {
      name: "Amount",
      selector: (row) =>
        `${row.currency_name} ${
          row.netAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`,
    },
  ];

  const handleReportChange = (value) => {
    navigate(value);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            {" "}
            <Link to="/accounting/cutoff" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            View Cutoff
          </span>
        </div>
        <div className="d-flex flex-row align-items-center row">
          <div className="col-sm">
            <span className="">Check Report</span>
          </div>
          <div className="col-sm">
            <select
              name=""
              id=""
              className="form-select p-2"
              onClick={(e) => handleReportChange(e.target.value)}
            >
              <option value="" selected disabled>
                Select Report
              </option>
              <option
                value={`/reports/new-report/balance_sheet/cutoff/${cutoff.id}/${cutoff.from}/${cutoff.to}`}
              >
                Balance Sheet
              </option>
              <option
                value={`/reports/new-report/inventory_report/cutoff/${cutoff.id}/${cutoff.from}/${cutoff.to}`}
              >
                Inventory Report
              </option>
            </select>
          </div>
        </div>
      </div>
      <div className="container-fluid mt-3">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="w-100 h-100 border shadow-sm rounded p-2">
              <h5>{cutoff.name}</h5>
              <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <span>
                  <strong>Cutoff Status:</strong>{" "}
                  <span
                    className={`${
                      cutoff.isPosted ? "text-success" : "text-danger"
                    } rounded-pill `}
                  >
                    {cutoff.isPosted ? "Posted" : "Unposted"}{" "}
                  </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Cutoff From:</strong>{" "}
                  <span>
                    {" "}
                    {/* {new Date(cutoff.from).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} */}
                    {cutoff.from ? format(cutoff.from, "MMM/dd/yyyy") : null}
                  </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Cutoff To:</strong>{" "}
                  <span>
                    {" "}
                    {/* {new Date(cutoff.to).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "} */}
                    {cutoff.to ? format(cutoff.to, "MMM/dd/yyyy") : null}
                  </span>
                </span>
              </div>
              <br />
              <h5>Earnings</h5>
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
                  {returnEarnings.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    style: "currency",
                    currency: "PHP",
                  })}
                </span>
              </div>
              <br />
              {/* <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <div className="w-100 h-100 d-flex flex-column justify-content-around align-items-center">
                  <button
                    className="btn btn-outline-success px-5 w-75"
                    onClick={() => setShowModal(true)}
                    disabled={cutoff.isPosted}
                  >
                    <i className="fas fa-plus"></i> Other Income
                  </button>
                </div>
              </div> */}
              <br />
            </div>
          </div>
          <div className="col-12 col-md-8">
            <div className="balance-chart w-100">
              <Card>
                <Card.Body>
                  <Card.Title>Transaction Summary</Card.Title>
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

      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={transaction}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div>
      {/* In */}

      <Modal show={showModal} onHide={handleClose} backdrop="static" size="xl">
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleFormSubmit(e, "Debit")}
        >
          <Modal.Header className="border-0">
            <Modal.Title>Other Income</Modal.Title>
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
                  <th>Date</th>
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
                      required
                    >
                      <option value="" selected disabled>
                        Select Account
                      </option>
                      <option value="Account-List">Account-List</option>
                      {/* <option value="Asset Account">Asset Account</option>
                      <option value="Liabilities Account">
                        Liabilities Account
                      </option> */}
                      <option value="Owner's Equity Account">
                        Owner's Equity Account
                      </option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <select
                      className="form-select"
                      onChange={(e) =>
                        handleSubject2Change(
                          e,
                          e.target.options[e.target.selectedIndex].getAttribute(
                            "data-subject-type"
                          )
                        )
                      }
                      value={subject2}
                      disabled={isSubject2Disabled}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 2
                      </option>
                      {subject2DataList.map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                          data-subject-type={option.subject_type}
                        >
                          {option.subject_name}
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
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject 3
                      </option>
                      {subject3DataList.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.account_name}
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
                      required
                    >
                      <option value="" selected disabled>
                        Select Payment Method
                      </option>
                      {subject2Type === "Cash" ? (
                        <option value="Cash">Cash</option>
                      ) : (
                        <option value="Bank">Bank</option>
                      )}

                      {/* <option value="Online">Online</option> */}
                    </select>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      onChange={(e) => setCheckNo(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="date"
                      className="form-control"
                      disabled={isRemarksDisabled}
                      max={cutoff.to}
                      min={cutoff.from}
                      required
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0.00"
                      disabled={isRemarksDisabled}
                      required
                      onInput={onInputFloat}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* Out */}
    </div>
  );
};

export default ViewCutoff;
