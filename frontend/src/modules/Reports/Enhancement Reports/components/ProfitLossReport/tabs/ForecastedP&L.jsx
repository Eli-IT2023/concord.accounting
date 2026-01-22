import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";
import swal from "sweetalert";

import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../../assets/global/url";
import "../../../../../../assets/css/style.css";

import useExchangeProfitLoss from "../../../../../../hooks/useExchangeProfitLoss";
import { useServerPagination } from "../../../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../../../hooks/customHook/paginationHook/usePagination";
import DateRangePicker from "../../../../../../components/DateRangePicker";
import {
  getMonthBoundaries,
  initializeCutoff,
} from "../../../../../../utils/newdate.js";
const ForecastedPL = ({ authrztn }) => {
  const boundaries = getMonthBoundaries();
  const initialDate = initializeCutoff(boundaries);
  // const formatDateOnly = (date) => date.toISOString().split("T")[0];

  // const [p_L_data, setP_L_Data] = useState([]);
  // const [allP_L_data, setAllP_L_Data] = useState([]);
  const [totalGainLossInfos, setTotalGainLossInfos] = useState({
    previous_cutoff_gain_loss: 0,
    current_cutoff_gain_loss: 0,
    overall_gain_loss: 0,
    previous_cutoff_percentage: 0,
    current_cutoff_percentage: 0,
    overall_gain_percentage: 0,
  });

  const [dateRangefilter, setDateRangeFilter] = useState({
    from: initialDate?.from,
    to: initialDate?.to,
  });

  // Initialize pagination
  const pagination = useServerPagination(
    `${BASE_URL}/profit_loss/forecast/getData`,
    10,
    {
      date_from: dateRangefilter?.from,
      date_to: dateRangefilter?.to,
    }
  );

  // console.log("Date Range Filter:", dateRangefilter);

  // console.log("Pagination Data:", pagination.data);

  // Fetch all P&L data for total
  // const fetchAllP_L_Data = () => {
  //   if (dateRangefilter.from && dateRangefilter.to) {
  //     axios
  //       .get(BASE_URL + "/profit_loss/getJournalv2DataTotals", {
  //         params: {
  //           date_from: dateRangefilter?.from,
  //           date_to: dateRangefilter?.to,
  //         },
  //       })
  //       .then((res) => {
  //         setAllP_L_Data(res.data);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }
  // };

  const getTotalGainLossInfos = () => {
    axios
      .get(BASE_URL + "/profit_loss/getTotalGainLossInfos", {
        params: {
          date_from: dateRangefilter?.from,
          date_to: dateRangefilter?.to,
        },
      })
      .then((res) => {
        setTotalGainLossInfos((prev) => {
          const prevGain = res.data.previous_cutoff_gain_loss || 0;
          const prevPercent = res.data.previous_cutoff_percentage || 0;
          const currGain = res.data.current_cutoff_gain_loss || 0;
          const currPercent = res.data.current_cutoff_percentage || 0;

          // Reconstruct bases (avoid division by zero)
          const prevBase =
            prevPercent !== 0 ? prevGain / (prevPercent / 100) : 0;
          const currBase =
            currPercent !== 0 ? currGain / (currPercent / 100) : 0;

          const overallGain = prevGain + currGain;

          const totalBase = prevBase + currBase;

          const overallPercent =
            totalBase !== 0 ? (overallGain / totalBase) * 100 : 0;

          return {
            previous_cutoff_gain_loss: prevGain,
            previous_cutoff_percentage: prevPercent,
            current_cutoff_gain_loss: currGain,
            current_cutoff_percentage: currPercent,
            overall_gain_loss: overallGain,
            overall_gain_percentage: overallPercent,
          };
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Update pagination when dates change
  useEffect(() => {
    if (dateRangefilter?.from && dateRangefilter?.to) {
      // fetchAllP_L_Data();
      // getTotalGainLossInfos();
    }
  }, [dateRangefilter?.from, dateRangefilter?.to]);

  // Update p_L_data when pagination data changes
  // useEffect(() => {
  //   setP_L_Data(pagination.data);
  // }, [pagination.data]);

  // const { rows, totalPL, totalPercent } = useExchangeProfitLoss(
  //   pagination.data
  // );
  // const {
  //   rows: allRows,
  //   totalPL: allTotalPL,
  //   totalPercent: allTotalPercent,
  // } = useExchangeProfitLoss(allP_L_data);

  function formatNumber(num, currency) {
    if (currency === "PHP")
      return num.toLocaleString("US-en", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "PHP",
      });

    if (currency === "USD") {
      return num.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "USD",
      });
    }
    if (currency === "CNY") {
      return num.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        style: "currency",
        currency: "CNY",
      });
    } else return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // const handleDateRangeChange = (startDate, endDate) => {
  //   onDateRangeChange(startDate, endDate);
  //   pagination.setCurrentPage(1);
  // };

  const handleDateRangeChange = (startDate, endDate) => {
    setDateRangeFilter({
      from: startDate,
      to: endDate,
    });

    pagination.updateParams({
      date_from: startDate,
      date_to: endDate,
    });

    getTotalGainLossInfos();
    // fetchAllP_L_Data();
  };

  // console.log("Updated Date Range Filter:", dateRangefilter);

  return (
    <div>
      <div className="w-100 row mx-auto mt-2">
        <h6>Accounting Period</h6>
        <div className="col-sm mb-2">
          <DateRangePicker
            startDate={dateRangefilter?.from}
            endDate={dateRangefilter?.to}
            onDateRangeChange={handleDateRangeChange}
            label="Accounting Period"
          />
        </div>
        <div className="col-sm"></div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ transition: "box-shadow 0.3s" }}
          >
            <div className="card-body">
              <div className="small text-muted fw-medium mb-2">
                Previous Cutoffs
              </div>
              <div className="d-flex align-items-center">
                <h3
                  className="mb-0 me-2"
                  style={{
                    color:
                      totalGainLossInfos.previous_cutoff_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                    fontWeight: "700",
                  }}
                >
                  {`${formatNumber(
                    totalGainLossInfos?.previous_cutoff_gain_loss,
                    "PHP"
                  )} (${totalGainLossInfos.previous_cutoff_percentage.toFixed(
                    2
                  )}%)`}
                </h3>
                <i
                  className={`fas fa-arrow-trend-${
                    totalGainLossInfos.previous_cutoff_gain_loss >= 0
                      ? "up"
                      : "down"
                  }`}
                  style={{
                    color:
                      totalGainLossInfos.previous_cutoff_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ transition: "box-shadow 0.3s" }}
          >
            <div className="card-body">
              <div className="small text-muted fw-medium mb-2">
                Current Cutoff
              </div>
              <div className="d-flex align-items-center">
                <h3
                  className="mb-0 me-2"
                  style={{
                    color:
                      totalGainLossInfos.current_cutoff_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                    fontWeight: "700",
                  }}
                >
                  {`${formatNumber(
                    totalGainLossInfos.current_cutoff_gain_loss,
                    "PHP"
                  )} (${totalGainLossInfos.current_cutoff_percentage.toFixed(
                    2
                  )}%)`}
                </h3>
                <i
                  className={`fas fa-arrow-trend-${
                    totalGainLossInfos.current_cutoff_gain_loss >= 0
                      ? "up"
                      : "down"
                  }`}
                  style={{
                    color:
                      totalGainLossInfos.current_cutoff_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ transition: "box-shadow 0.3s" }}
          >
            <div className="card-body">
              <div className="small text-muted fw-medium mb-2">
                Overall Cutoff
              </div>
              <div className="d-flex align-items-center">
                <h3
                  className="mb-0 me-2"
                  style={{
                    color:
                      totalGainLossInfos.overall_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                    fontWeight: "700",
                  }}
                >
                  {`${formatNumber(
                    totalGainLossInfos.overall_gain_loss,
                    "PHP"
                  )} (${totalGainLossInfos.overall_gain_percentage.toFixed(
                    2
                  )}%)`}
                </h3>
                <i
                  className={`fas fa-arrow-trend-${
                    totalGainLossInfos.overall_gain_loss >= 0 ? "up" : "down"
                  }`}
                  style={{
                    color:
                      totalGainLossInfos.overall_gain_loss >= 0
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase">
                    Module From
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    Amount From
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    Received Rate
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    Received Amount (Assumed)
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    Actual Rate
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    Actual Amount
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    P/L (₱)
                  </th>
                  <th className="px-4 py-3 text-muted small fw-semibold text-uppercase text-end">
                    P/L (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination?.data.map((r, i) => {
                  const moduleData = r.module;
                  const transaction_rate = r.transaction_rate;
                  const currency_name = r.currency_name;
                  const original_amount = r.original_amount;
                  const system_rate = r.system_rate;

                  const assumed_rate_amount =
                    original_amount * transaction_rate;
                  const actual_rate_amount = original_amount * system_rate;

                  const profitLossPHP =
                    actual_rate_amount - assumed_rate_amount;
                  const percentPL =
                    assumed_rate_amount !== 0
                      ? (profitLossPHP / assumed_rate_amount) * 100
                      : 0;

                  return (
                    <tr key={i}>
                      <td className="px-4 py-3">{moduleData}</td>
                      <td className="px-4 py-3 text-end fw-medium">
                        {formatNumber(original_amount, currency_name)}
                      </td>
                      <td className="px-4 py-3 text-end text-muted">
                        {formatNumber(transaction_rate, "PHP")}
                      </td>
                      <td className="px-4 py-3 text-end text-muted">
                        {formatNumber(assumed_rate_amount, "PHP")}
                      </td>
                      <td className="px-4 py-3 text-end fw-medium">
                        {formatNumber(system_rate, "PHP")}
                      </td>
                      <td className="px-4 py-3 text-end fw-medium">
                        {formatNumber(actual_rate_amount, "PHP")}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span
                          className="badge rounded-pill px-3 py-2"
                          style={{
                            backgroundColor:
                              profitLossPHP >= 0 ? "#dcfce7" : "#fee2e2",
                            color: profitLossPHP >= 0 ? "#16a34a" : "#dc2626",
                            fontWeight: "600",
                          }}
                        >
                          {profitLossPHP >= 0 ? "+" : "-"}{" "}
                          {formatNumber(Math.abs(profitLossPHP), "PHP")}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-end">
                        <span
                          className="badge rounded-pill px-3 py-2"
                          style={{
                            backgroundColor:
                              percentPL >= 0 ? "#dcfce7" : "#fee2e2",
                            color: percentPL >= 0 ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {percentPL >= 0 ? "+" : "-"}{" "}
                          {Math.abs(percentPL).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* <tfoot
                style={{
                  backgroundColor: "#f8f9fa",
                  borderTop: "2px solid #dee2e6",
                }}
              >
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-3 text-end fw-bold text-uppercase small"
                  >
                    Total Profit / Loss:
                  </td>

                  <td className="px-4 py-3 text-end">
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={{
                        backgroundColor: totalPL >= 0 ? "#d1fae5" : "#fecaca",
                        color: totalPL >= 0 ? "#16a34a" : "#dc2626",
                        fontWeight: "700",
                        fontSize: "1.5rem",
                      }}
                    >
                      {formatNumber(totalPL, "PHP")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={{
                        backgroundColor:
                          totalPercent >= 0 ? "#dcfce7" : "#fee2e2",
                        color: totalPercent >= 0 ? "#16a34a" : "#dc2626",
                        fontSize: "1.5rem",
                      }}
                    >
                      {totalPercent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              </tfoot> */}
            </table>
          </div>
        </div>
      </div>
      <PaginationControls {...pagination} />
    </div>
  );
};

export default ForecastedPL;
