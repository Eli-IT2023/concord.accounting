import React, { useState, useEffect } from "react";
import NoAccess from "../../assets/img/NoAccess.png";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import "../../assets/css/style.css";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { format } from "date-fns";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const getDaysOfCurrentWeek = () => {
  const today = new Date();
  const day = today.getDay(),
    diff = today.getDate() - day + (day == 0 ? -6 : 1);
  const startOfWeek = new Date(today.setDate(diff));

  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + i);
    daysOfWeek.push(currentDay);
  }

  return daysOfWeek;
};

const graphFormatDate = (date) => {
  const options = { month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

const Dashboard = ({ authrztn }) => {
  const [payablesByDate, setPayablesByDate] = useState({});
  const [salesByDate, setSalesByDate] = useState({});

  const [updatedData, setUpdatedData] = useState([]);

  const [chartData, setChartData] = useState([]);
  const [payables, setPayables] = useState([]);

  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalPurchasedDate, setTotalPurchasedDate] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalSalesDate, setTotalSalesDate] = useState(null);
  const [collectionCheck, setCollectionCheck] = useState(0);
  const [accountList, setAccountList] = useState([]);
  const [bankTransaction, setBankTransaction] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [cashFlow, setCashFlow] = useState([]);

  const [cutOffData, setCutOffData] = useState([]);
  const [currentCutOff, setCurrentCutOff] = useState(0);

  const [customerTransacData, setCustomerTransacData] = useState([]);
  const [vendorTransacData, setVendorTransacData] = useState([]);

  const dateToday = new Date().toISOString().split("T")[0];

  const cutOffFrom = cutOffData[currentCutOff]?.from
    ? cutOffData[currentCutOff]?.from
    : dateToday;
  const cutOffTo = cutOffData[currentCutOff]?.to
    ? cutOffData[currentCutOff]?.to
    : dateToday;

  const getDatesForCutOff = (cutOffFrom, cutOffTo) => {
    const startDate = new Date(cutOffFrom);
    const endDate = new Date(cutOffTo);

    const cutOffDates = [];

    while (startDate <= endDate) {
      cutOffDates.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return cutOffDates;
  };

  const [tenBankTransaction, setTenBankTransaction] = useState([]);

  useEffect(() => {
    // const fetchTotalPurchased = async () => {
    //   try {
    //     const response = await axios.get(
    //       BASE_URL + "/dashboard/getTotalPurchased"
    //     );

    //     setTotalPurchased(response.data.totalPurchased);
    //     setPurchaseCount(response.data.purchaseCount || 0);
    //   } catch (error) {
    //     console.error("Error fetching total purchased:", error);
    //   }
    // };

    // const fetchTotalsales = async () => {
    //   try {
    //     const response = await axios.get(BASE_URL + "/dashboard/getTotalSales");
    //     setTotalSales(response.data.total_amount);
    //   } catch (error) {
    //     console.error("Error fetching total Sales:", error);
    //   }
    // };

    // const fetchCollectionCheck = async () => {
    //   try {
    //     const response = await axios.get(
    //       BASE_URL + "/dashboard/getCollectionCheck"
    //     );
    //     setCollectionCheck(response.data.amount);
    //   } catch (error) {
    //     console.error("Error fetching collection check:", error);
    //   }
    // };

    const fetchAccountList = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getAccountList"
        );
        setAccountList(response.data);
      } catch (error) {
        console.error("Error fetching account list:", error);
      }
    };

    // const fetBankTransaction = async () => {
    //   try {
    //     const response = await axios.get(
    //       BASE_URL + "/dashboard/getBankTransaction"
    //     );
    //     setBankTransaction(response.data);
    //   } catch (error) {
    //     console.error("Error fetching bank transaction:", error);
    //   }
    // };

    // const fetCashFlow = async () => {
    //   try {
    //     const response = await axios.get(BASE_URL + "/dashboard/getCashFlow");
    //     setCashFlow(response.data);
    //   } catch (error) {
    //     console.error("Error fetching cash flow:", error);
    //   }
    // };

    // const fetchPayables = async () => {
    //   try {
    //     const response = await axios.get(BASE_URL + "/dashboard/getPayables");
    //     setPayablesByDate(response.data);
    //   } catch (error) {
    //     console.error("Error fetching payables", error);
    //   }
    // };

    // const fetchSalesInvoice = async () => {
    //   try {
    //     const response = await axios.get(
    //       BASE_URL + "/dashboard/getSalesInvoice"
    //     );
    //     setSalesByDate(response.data);
    //   } catch (error) {
    //     console.error("Error fetching sales invoice", error);
    //   }
    // };

    // const fetchTotalExpense = async () => {
    //   try {
    //     const response = await axios.get(
    //       BASE_URL + "/dashboard/getTotalExpenses",
    //       {
    //         params: {
    //           cutOffFrom,
    //           cutOffTo,
    //         },
    //       }
    //     );
    //     setTotalExpense(response.data.totalExpenses);
    //   } catch (error) {
    //     console.error("Error fetching total expenses", error);
    //   }
    // };

    // fetchTotalPurchased();
    // fetchTotalsales();
    // fetchCollectionCheck();
    fetchAccountList();
    // fetBankTransaction();
    // fetCashFlow();
    // fetchPayables();
    // fetchSalesInvoice();
    // fetchTotalExpense();
  }, [totalSales, totalPurchased, totalPurchasedDate]);

  useEffect(() => {
    const fetchTotalExpense = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getTotalExpenses",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );
        setTotalExpense(response.data.totalExpenses);
      } catch (error) {
        console.error("Error fetching total expenses", error);
      }
    };

    const fetchTotalsales = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getTotalSales",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );
        setTotalSales(response.data.total_amount);
      } catch (error) {
        console.error("Error fetching total Sales:", error);
      }
    };

    const fetchTotalPurchased = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getTotalPurchased",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );

        setTotalPurchased(response.data.totalPurchased);
        setPurchaseCount(response.data.purchaseCount || 0);
      } catch (error) {
        console.error("Error fetching total purchased:", error);
      }
    };

    const fetchCollectionCheck = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getCollectionCheck",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );
        setCollectionCheck(response.data.amount);
      } catch (error) {
        console.error("Error fetching collection check:", error);
      }
    };

    const fetchCashFlow = async () => {
      try {
        const response = await axios.get(BASE_URL + "/dashboard/getCashFlow", {
          params: {
            cutOffFrom,
            cutOffTo,
          },
        });
        setCashFlow(response.data);
        console.log("cash flow", response.data);
      } catch (error) {
        console.error("Error fetching cash flow:", error);
      }
    };

    const fetchPayables = async () => {
      try {
        const response = await axios.get(BASE_URL + "/dashboard/getPayables", {
          params: {
            cutOffFrom,
            cutOffTo,
          },
        });
        setPayablesByDate(response.data);
      } catch (error) {
        console.error("Error fetching payables", error);
      }
    };

    const fetchSalesInvoice = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getSalesInvoice",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );
        setSalesByDate(response.data);
      } catch (error) {
        console.error("Error fetching sales invoice", error);
      }
    };

    const fetchBankTransaction = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getBankTransaction",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );
        setBankTransaction(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching bank transaction:", error);
      }
    };

    const fetchCustomerGraph = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getCustomerGraph",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );

        setCustomerTransacData(response.data);
      } catch (error) {
        console.error("Error fetching bank transaction:", error);
      }
    };

    const fetchVendorGraph = async () => {
      try {
        const response = await axios.get(
          BASE_URL + "/dashboard/getVendorGraph",
          {
            params: {
              cutOffFrom,
              cutOffTo,
            },
          }
        );

        setVendorTransacData(response.data);
      } catch (error) {
        console.error("Error fetching bank transaction:", error);
      }
    };

    fetchVendorGraph();
    fetchCustomerGraph();
    fetchBankTransaction();
    fetchPayables();
    fetchSalesInvoice();
    fetchCashFlow();
    fetchCollectionCheck();
    fetchTotalPurchased();
    fetchTotalsales();
    fetchTotalExpense();
  }, [cutOffFrom, cutOffTo]);

  useEffect(() => {
    const fetchCutoffs = async () => {
      try {
        const response = await axios.get(BASE_URL + "/dashboard/getCutoffs");
        setCutOffData(response.data);
      } catch (error) {
        console.error("Error fetching total expenses", error);
      }
    };

    fetchCutoffs();
  }, []);
  const handlePrevCutOff = () => {
    setCurrentCutOff((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : cutOffData.length - 1
    );
  };

  const handleNextCutOff = () => {
    setCurrentCutOff((prevIndex) =>
      prevIndex < cutOffData.length - 1 ? prevIndex + 1 : 0
    );
  };

  useEffect(() => {
    const daysOfWeek = getDatesForCutOff(cutOffFrom, cutOffTo);

    const filteredData = daysOfWeek.map((day) => {
      const dateString = graphFormatDate(day);
      const dateKey = day.toISOString().split("T")[0];
      const dayData = payablesByDate[dateKey] || 0;
      const salesData = salesByDate[dateKey] || 0;

      return {
        name: dateString,
        Sales: salesData,
        Purchases: dayData,
      };
    });

    setUpdatedData(filteredData);
  }, [payablesByDate, salesByDate, currentCutOff]);

  const customerChart = customerTransacData.map((item) => ({
    name: item.customer_name,
    value: item.total_transactions,
  }));
  const vendorChart = vendorTransacData.map((item) => ({
    name: item.vendor_name,
    value: item.total_transactions,
  }));

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const options = {
      // weekday: 'long',
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const formattedDate = date.toLocaleString("en-US", options);

    return formattedDate;
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

  const defaultData = [{ name: "No Data", value: 1 }];

  const formatNumber = (number) => {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    }).format(number);
  };

  return (
    <>
      {authrztn.includes("Dashboard-View") ? (
        <div className="h-100 w-100 custom-container">
          <div className="w-100 p-2">
            <div
              className="p-4 w-100 container-fluid border shadow-sm bg-white"
              style={{
                borderRadius: "1rem",
              }}
            >
              <h5 className="fw-bold text-uppercase mb-3">Dashboard</h5>
              {/* <h5 className="fw-bold text-uppercase">Cutoff Sales</h5> */}
              {/* <p style={{ fontSize: "0.9rem" }}>Sales Summary</p> */}
              <div className="row mx-auto">
                {/* Filtering */}
                <div className="col-sm ">
                  <h6 className="text-secondary text-center pt-2">
                    Date Filtering
                  </h6>
                  <div className="card rounded shadow p-2 border-0 d-flex flex-row justify-content-between p-3">
                    <i
                      className="bx bx-chevron-left fs-3 shadow-sm border p-1 rounded"
                      onClick={handleNextCutOff}
                      style={{
                        cursor: "pointer",
                        transition: "0.3s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#f0f0f0")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "white")
                      }
                    ></i>
                    <h5 className="text-center m-0 pt-2">
                      {cutOffData[currentCutOff]?.name}
                    </h5>

                    <i
                      className="bx bx-chevron-right fs-3 shadow-sm border p-1 rounded"
                      onClick={handlePrevCutOff}
                      style={{ cursor: "pointer", transition: "0.3s" }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#f0f0f0")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "white")
                      }
                    ></i>
                  </div>
                  <div className="d-flex mt-3 justify-content-evenly">
                    <p className="border p-1 px-2 shadow-sm rounded">
                      {format(cutOffFrom, "MMM/dd/yyyy")}
                    </p>
                    <p className="pt-1">To</p>
                    <p className="border p-1 px-2 shadow-sm rounded">
                      {format(cutOffTo, "MMM/dd/yyyy")}
                    </p>
                  </div>
                </div>

                <div className="col-sm p-2">
                  <div
                    className="card rounded shadow-sm p-3 border"
                    style={{ background: "#FFE2E5" }}
                  >
                    <span
                      className="p-2 rounded-circle text-center"
                      style={{ width: "2.7rem", background: "#FA5A7D" }}
                    >
                      <i class="fa-solid fa-chart-column fs-5 text-white"></i>
                    </span>
                    <div className="mt-2 text-truncate">
                      <span
                        title={totalPurchased.toLocaleString("en", {
                          maximumFractionDigits: 2,
                        })}
                        className="peso fw-bold fs-4"
                      >
                        {" "}
                        {totalPurchased.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                          currency: "PHP",
                        })}
                        {/* {formatNumber(totalPurchased)} */}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span>Purchased</span>
                    </div>
                    <div>
                      {/* <span
                        className="text-primary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        +8% from yesterday
                      </span> */}
                    </div>
                  </div>
                </div>
                <div className="col-sm p-2">
                  <div
                    className="card rounded shadow-sm p-3 border"
                    style={{ background: "#FBF0DB" }}
                  >
                    <span
                      className="p-2 rounded-circle text-center"
                      style={{ width: "2.7rem", background: "#FF947A" }}
                    >
                      <i class="fa-solid fa-file-invoice fs-5 text-white"></i>
                    </span>
                    <div className="mt-2 text-truncate">
                      <span
                        title={totalSales.toLocaleString("en", {
                          maximumFractionDigits: 2,
                        })}
                        className="peso fw-bold fs-4"
                      >
                        {totalSales.toLocaleString("en-US", {
                          currency: "PHP",
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                        {/* {formatNumber(totalSales)} */}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span>Sales</span>
                    </div>
                    <div>
                      {/* <span
                        className="text-primary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        +5% from yesterday
                      </span> */}
                    </div>
                  </div>
                </div>

                <div className="col-sm p-2">
                  <div
                    className="card rounded shadow-sm p-3 border"
                    style={{ background: "#DCFCE7" }}
                  >
                    <span
                      className="p-2 rounded-circle text-center"
                      style={{ width: "2.7rem", background: "#3CD856" }}
                    >
                      <i class="fa-solid fa-tag fs-5 text-white"></i>
                    </span>
                    <div className="mt-2 text-truncate">
                      <span
                        title={collectionCheck.toLocaleString("en", {
                          maximumFractionDigits: 2,
                        })}
                        className="peso fw-bold fs-4"
                      >
                        {collectionCheck.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                          currency: "PHP",
                        })}
                        {/* {formatNumber(collectionCheck)} */}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span>Receivable Check</span>
                    </div>
                    <div>
                      {/* <span
                        className="text-primary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Total Check: <strong>15</strong>
                      </span> */}
                    </div>
                  </div>
                </div>
                <div className="col-sm p-2">
                  <div
                    className="card rounded shadow-sm p-3 border"
                    style={{ background: "#F3E8FF" }}
                  >
                    <span
                      className="p-2 rounded-circle text-center"
                      style={{ width: "2.7rem", background: "#BF83FF" }}
                    >
                      <i class="fa-solid fa-user-plus fs-5 text-white"></i>
                    </span>
                    <div className="mt-2 text-truncate">
                      <span
                        title={totalExpense.toLocaleString("en", {
                          maximumFractionDigits: 2,
                        })}
                        className="peso fw-bold fs-4"
                      >
                        {isNaN(parseFloat(totalExpense))
                          ? "0"
                          : parseFloat(totalExpense).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                              currency: "PHP",
                            })}
                        {/* {formatNumber(totalExpense)} */}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span>Total Expenses</span>
                    </div>
                    <div>
                      {/* <span
                        className="text-primary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        +3 from Yes
                      </span> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-100 container-fluid mt-2">
            <div className="row">
              <div className="col-sm p-2">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem" }}
                >
                  <div className="w-100 d-flex flex-row justify-content-between mb-4">
                    <h5 className="fw-bold">Customer Transactions</h5>
                  </div>
                  <div
                    className="scrollable-contents"
                    style={{
                      height: "20rem",
                      maxHeight: "20rem",
                      overflowY: "auto",
                    }}
                  >
                    <div className="w-100">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={
                              customerChart.length > 0
                                ? customerChart
                                : defaultData
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name} (${value})`}
                            labelLine={false}
                          >
                            {(customerChart.length > 0
                              ? customerChart
                              : defaultData
                            ).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="col-sm p-2">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem", height: "26.78rem" }}
                >
                  <h5 className="fw-bold">Banks</h5>
                  <div
                    className="table-responsive w-100 h-100 scrollable-contents mt-3"
                    style={{
                      // height: "20rem",
                      maxHeight: "20rem",
                      overflowY: "auto",
                    }}
                  >
                    <table className="table table-borderless w-100 h-100">
                      <thead>
                        <tr className="border-bottom">
                          <th scope="col" style={{ fontWeight: 500 }}>
                            #
                          </th>
                          <th scope="col" style={{ fontWeight: 500 }}>
                            Banks
                          </th>
                          <th scope="col" style={{ fontWeight: 500 }}>
                            Savings
                          </th>
                          <th scope="col" style={{ fontWeight: 500 }}>
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountList.map((data) => (
                          <tr className="border-bottom" key={data.id}>
                            <td>{data.id}</td>
                            <td>
                              {data.account_list_base_sub.subject_name} -{" "}
                              {data.account_name}
                            </td>
                            <td>
                              ₱
                              {data.amount.toLocaleString("en-US", {
                                currency: "PHP",
                              })}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div> */}
              <div className="col-sm p-2">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem", height: "26.78rem" }}
                >
                  <h5 className="fw-bold">Vendor Transactions</h5>
                  <div
                    className="table-responsive w-100 h-100 scrollable-contents mt-3"
                    style={{
                      // height: "20rem",
                      maxHeight: "20rem",
                      overflowY: "auto",
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={
                            vendorChart.length > 0 ? vendorChart : defaultData
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name} (${value})`}
                          labelLine={false}
                        >
                          {(vendorChart.length > 0
                            ? vendorChart
                            : defaultData
                          ).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-100 container-fluid mt-2">
            <div className="row">
              <div className="col-sm p-2">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem" }}
                >
                  <div className="w-100 d-flex flex-row justify-content-between mb-4">
                    <h5 className="fw-bold">Sales and Purchases</h5>
                  </div>
                  <div
                    className="scrollable-contents"
                    style={{
                      height: "20rem",
                      maxHeight: "20rem",
                      overflowY: "auto",
                    }}
                  >
                    <ResponsiveContainer className="w-100 h-100">
                      <BarChart data={updatedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            value.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            value.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          }
                        />
                        <Legend />
                        <Bar dataKey="Sales" fill="#007bff" />
                        <Bar dataKey="Purchases" fill="#00c87b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-100 container-fluid mt-2">
            <div className="row">
              <div className="col-sm p-2 w-25">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem" }}
                >
                  <h5 className="fw-bold">Cash Flows</h5>
                  <div
                    className="scrollable-contents"
                    style={{ maxHeight: "50rem", overflowY: "auto" }}
                  >
                    <Tabs
                      defaultActiveKey="totalReceivable"
                      id="uncontrolled-tab-example"
                      className="mb-3 mt-4 w-100 h-100 d-none"
                    >
                      <Tab
                        eventKey="totalReceivable"
                        title="Total Receivable"
                        className="w-100 h-100"
                      >
                        <div className="container-fluid h-100 w-100">
                          <div className="table-responsive overflow-auto">
                            <table className="w-100">
                              <thead className="border-bottom">
                                <th
                                  className="text-center text-secondary pe-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Account
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Date
                                </th>
                                <th
                                  className="text-center text-secondary text-nowrap px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Transaction Number
                                </th>
                                <th
                                  className="text-center text-secondary text-nowrap px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Subject From
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Description
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Amount
                                </th>
                                <th
                                  className="text-end text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Status
                                </th>
                              </thead>
                              <tbody>
                                {/* {cashFlow.map((data) => (
                                  <tr className="border-bottom" key={data.id}>
                                    <td colSpan="1"></td>
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {data.account_list_id_cash_froms
                                            ?.account_name || ""}
                                        </span>
                                        <span
                                          className="text-secondary"
                                          style={{ fontSize: "0.6rem" }}
                                        >
                                          {formatDate(data.createdAt)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center">Cash</td>
                                    <td className="text-center">
                                      <span className="peso">
                                        {data?.amount.toLocaleString("en-US", {
                                          currency: "PHP",
                                        })}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="peso fw-bold">
                                        {data.account_list_id_cash_froms.amount.toLocaleString(
                                          "en-US",
                                          { currency: "PHP" }
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))} */}
                                {cashFlow.map((item) => (
                                  <tr key={item.id}>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="py-2"
                                    >
                                      {item.account_list_id_cash_froms
                                        ?.account_name ||
                                        item.account_list_id_cash_tos
                                          ?.account_name}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {format(
                                        item.transaction_date,
                                        "MMM/dd/yyyy"
                                      )}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {item.transaction_number}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {" "}
                                      {item.module_from}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap mx-5"
                                    >
                                      {item.description}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className={`text-center text-nowrap ${
                                        item.account_list_id_cash_froms
                                          ?.account_name &&
                                        item.module_from == "Collection Check"
                                          ? "text-primary"
                                          : item.transaction_number.includes(
                                              "TRANSFER-"
                                            ) &&
                                            item.account_list_id_cash_tos ==
                                              null
                                          ? "text-primary"
                                          : item.account_list_id_cash_froms
                                              ?.account_name
                                          ? "text-danger"
                                          : "text-primary"
                                      }`}
                                    >
                                      {item.account_list_id_cash_froms
                                        ?.account_name &&
                                      item.module_from == "Collection Check"
                                        ? "+"
                                        : item.transaction_number.includes(
                                            "TRANSFER-"
                                          ) &&
                                          item.account_list_id_cash_tos == null
                                        ? "+"
                                        : item.account_list_id_cash_froms
                                            ?.account_name
                                        ? "-"
                                        : "+"}
                                      {item.amount.toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-end text-nowrap"
                                    >
                                      {item.status}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Tab>

                      <Tab eventKey="totalPayable" title="Total Payable">
                        <div className="container-fluid h-100 w-100">
                          <div className="table-responsive">
                            <table className="w-100 custom-dashboard-table">
                              <thead>
                                <th></th>
                                <th></th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Payment Method
                                </th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Amount
                                </th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Balance
                                </th>
                              </thead>
                              <tbody>
                                {/* {cashFlow.map((data) => (
                                  <tr className="border-bottom" key={data.id}>
                                    <td colSpan="1"></td>
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {data.account_list_id_cash_froms
                                            ?.account_name || ""}
                                        </span>
                                        <span
                                          className="text-secondary"
                                          style={{ fontSize: "0.6rem" }}
                                        >
                                          {formatDate(data.createdAt)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center">Cash</td>
                                    <td className="text-center">
                                      <span className="peso">
                                        {data.amount.toLocaleString("en-US", {
                                          currency: "PHP",
                                        })}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="peso fw-bold">
                                        {data.account_list_id_cash_froms.amount.toLocaleString(
                                          "en-US",
                                          { currency: "PHP" }
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))} */}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </div>
              </div>
              <div className="col-sm p-2 w-25">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem" }}
                >
                  <h5 className="fw-bold">Bank Transaction</h5>
                  <div
                    className="scrollable-contents"
                    style={{ maxHeight: "50rem", overflowY: "auto" }}
                  >
                    <Tabs
                      defaultActiveKey="totalReceivable"
                      id="uncontrolled-tab-example"
                      className="mb-3 mt-4 w-100 h-100 d-none"
                    >
                      <Tab
                        eventKey="totalReceivable"
                        title="Total Receivable"
                        className="w-100 h-100"
                      >
                        <div className="container-fluid h-100 w-100">
                          <div className="table-responsive overflow-auto">
                            <table className="w-100">
                              <thead className="border-bottom">
                                <th
                                  className="text-center text-secondary pe-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Account
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Date
                                </th>
                                <th
                                  className="text-center text-secondary text-nowrap px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Transaction Number
                                </th>
                                <th
                                  className="text-center text-secondary text-nowrap px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Subject From
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Description
                                </th>
                                <th
                                  className="text-center text-secondary px-4"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Amount
                                </th>
                                <th
                                  className="text-end text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Status
                                </th>
                              </thead>
                              <tbody>
                                {/* {bankTransaction.map((data) => (
                                  <tr className="border-bottom" key={data.id}>
                                    <td colSpan="1"></td>
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {data.account_list_id_bank_froms
                                            ?.account_name || ""}
                                        </span>
                                        <span
                                          className="text-secondary"
                                          style={{ fontSize: "0.6rem" }}
                                        >
                                        
                                          {formatDate(data.createdAt)}
                                       
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center">Bank</td>
                                    <td className="text-center">
                                      <span className="peso">
                                        {data.amount.toLocaleString("en-US", {
                                          currency: "PHP",
                                        })}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="peso fw-bold">
                                        {data.account_list_id_bank_froms?.amount.toLocaleString(
                                          "en-US",
                                          { currency: "PHP" }
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))} */}

                                {bankTransaction.map((item) => (
                                  <tr key={item.id}>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="py-2"
                                    >
                                      {item.account_list_id_bank_froms
                                        ?.account_name ||
                                        item.account_list_id_bank_tos
                                          ?.account_name}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {format(
                                        item.transaction_date,
                                        "MMM/dd/yyyy"
                                      )}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {item.transaction_number}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap"
                                    >
                                      {" "}
                                      {item.module_from}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-center text-nowrap mx-5"
                                    >
                                      {item.description}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className={`text-center text-nowrap ${
                                        item.account_list_id_bank_froms
                                          ?.account_name &&
                                        item.module_from == "Collection Check"
                                          ? "text-primary"
                                          : item.transaction_number.includes(
                                              "TRANSFER-"
                                            ) &&
                                            item.account_list_id_bank_tos ==
                                              null
                                          ? "text-primary"
                                          : item.account_list_id_bank_froms
                                              ?.account_name
                                          ? "text-danger"
                                          : "text-primary"
                                      }`}
                                    >
                                      {item.account_list_id_bank_froms
                                        ?.account_name &&
                                      item.module_from == "Collection Check"
                                        ? "+"
                                        : item.transaction_number.includes(
                                            "TRANSFER-"
                                          ) &&
                                          item.account_list_id_bank_tos == null
                                        ? "+"
                                        : item.account_list_id_bank_froms
                                            ?.account_name
                                        ? "-"
                                        : "+"}
                                      {item.amount.toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                      }}
                                      className="text-end text-nowrap"
                                    >
                                      {item.status}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Tab>

                      <Tab eventKey="totalPayable" title="Total Payable">
                        <div className="container-fluid h-100 w-100">
                          <div className="table-responsive">
                            <table className="w-100 custom-dashboard-table">
                              <thead>
                                <th></th>
                                <th></th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Payment Method
                                </th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Amount
                                </th>
                                <th
                                  className="text-center text-secondary"
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Balance
                                </th>
                              </thead>
                              <tbody>
                                {bankTransaction.map((data) => (
                                  <tr className="border-bottom" key={data.id}>
                                    <td colSpan="1"></td>
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            data.account_list_id_bank_froms
                                              ?.account_name
                                          }
                                        </span>
                                        <span
                                          className="text-secondary"
                                          style={{ fontSize: "0.6rem" }}
                                        >
                                          {/* {data.transaction_date}   */}
                                          {formatDate(data.createdAt)}
                                          {/* September 13, 2024 - 03:30 PM */}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center">Bank</td>
                                    <td className="text-center">
                                      <span className="peso">
                                        {data.amount.toLocaleString("en-US", {
                                          currency: "PHP",
                                        })}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="peso fw-bold">
                                        {data.account_list_id_bank_froms?.amount.toLocaleString(
                                          "en-US",
                                          { currency: "PHP" }
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="col-sm p-2">
                <div
                  className="p-4 border bg-white"
                  style={{ borderRadius: "1rem", height: "26.78rem" }}
                >
                  <h5 className="fw-bold">Banks</h5>
                  <div
                    className="table-responsive w-100 h-100 scrollable-contents mt-3"
                    style={{
                      // height: "20rem",
                      maxHeight: "20rem",
                      overflowY: "auto",
                    }}
                  >
                    <table className="table table-borderless w-100 h-100">
                      <thead>
                        <tr className="border-bottom">
                          {/* <th scope="col" style={{ fontWeight: 500 }}>
                            #
                          </th> */}
                          <th scope="col" style={{ fontWeight: 500 }}>
                            Banks
                          </th>
                          {/* <th scope="col" style={{ fontWeight: 500 }}>
                            Savings
                          </th> */}
                          <th scope="col" style={{ fontWeight: 500 }}>
                            Current Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountList.map((data) => (
                          <tr className="border-bottom" key={data.id}>
                            {/* <td>{data.id}</td> */}
                            <td>
                              {data.account_list_base_sub.subject_name} -{" "}
                              {data.account_name}
                            </td>
                            <td>
                              ₱
                              {data.amount.toLocaleString("en-US", {
                                currency: "PHP",
                              })}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="w-100 container-fluid mt-2">
            <div className="row">
              <div className="col-sm p-2">
                <div
                  className="p-2 border bg-white"
                  style={{ height: "25rem", borderRadius: "1rem" }}
                ></div>
              </div>
              <div className="col-sm p-2">
                <div
                  className="p-2 border bg-white"
                  style={{ height: "25rem", borderRadius: "1rem" }}
                ></div>
              </div>
            </div>
          </div> */}
        </div>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </>
  );
};

export default Dashboard;
