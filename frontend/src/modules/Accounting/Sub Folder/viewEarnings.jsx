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

const ViewEarnings = () => {
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState([]);
  const [returnEarnings, setReturnEarnings] = useState(0);

  const { id } = useParams();
  const [earnings, setEarnings] = useState([]);
  const [totalAmountGraph, setTotalAmountGraph] = useState(0);

  const reloadTable = () => {
    axios
      .get(`${BASE_URL}/earnings/getTransaction`, {
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
      .get(`${BASE_URL}/earnings/fetchEarningbyID`, {
        params: {
          id: id,
        },
      })
      .then((res) => {
        setEarnings(res.data);
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

  //function for create transaction

  const columns = [
    {
      name: "Cutoff Name",
      selector: (row) => row.cutoff_name,
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
            <Link to="/accounting/retained-earnings" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            View Earnings
          </span>
        </div>
        <div className="d-flex flex-row align-items-center row w-25">
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
                value={`/reports/new-report/balance_sheet/earnings/${earnings.id}/${earnings.from}/${earnings.to}`}
              >
                Balance Sheet
              </option>
              <option
                value={`/reports/new-report/inventory_report/earnings/${earnings.id}/${earnings.from}/${earnings.to}`}
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
              <h5>{earnings.name}</h5>
              <div
                className="card p-2 mt-2 text-start shadow-sm"
                style={{ height: "8rem" }}
              >
                <span>
                  <strong>Earnings Status:</strong>{" "}
                  <span
                    className={`${
                      earnings.isPosted ? "text-success" : "text-danger"
                    } rounded-pill `}
                  >
                    {earnings.isPosted ? "Posted" : "Unposted"}{" "}
                  </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Earnings From:</strong>{" "}
                  <span>
                    {" "}
                    {/* {new Date(earnings.from).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} */}
                    {earnings.to && format(earnings.from, "MMM dd, yyyy")}
                  </span>
                </span>
                <span className="mt-2 mb-2" style={{ fontWeight: 500 }}>
                  <strong>Earnings To:</strong>{" "}
                  <span>
                    {" "}
                    {/* {new Date(earnings.to).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "} */}
                    {earnings.to && format(earnings.to, "MMM dd, yyyy")}
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

              <br />
            </div>
          </div>
          <div className="col-12 col-md-8">
            <div className="w-100 d-flex align-items-center ">
              <span>Cutoff Details</span>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="w-100 mt-3 container-fluid">
              <DataTable
                columns={columns}
                data={transaction}
                customStyles={customStyles}
                pagination
                className="dataTable"
              />
            </div>
          </div>
        </div>
      </div>
      {/* <div className="w-100 d-flex align-items-center my-4">
        <span>Transaction History</span>
        <hr className="flex-grow-1 mx-3" />
      </div> */}

      {/* data table */}
      {/* <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={transaction}
          customStyles={customStyles}
          pagination
          className="dataTable"
        />
      </div> */}
      {/* In */}
    </div>
  );
};

export default ViewEarnings;
