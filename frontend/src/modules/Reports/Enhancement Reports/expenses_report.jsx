import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import "../../../assets/css/style.css";
import { MultiSelect } from "react-multi-select-component";
import { Form } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import DatePicker from "react-datepicker";
const ExpensesReport1 = () => {
  const [cutoffData, setCutoffData] = useState([]);
  const [selectedOptionsCutoff, setSelectedOptionsCutoff] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentMonthTotalExpenses1, setCurrentMonthTotalExpenses1] = useState(
    {}
  );
  const [lastMonthTotalExpenses1, setLastMonthTotalExpenses1] = useState({});
  const [currentMonthTotalExpenses2, setCurrentMonthTotalExpenses2] = useState(
    {}
  );
  const [lastMonthTotalExpenses2, setLastMonthTotalExpenses2] = useState({});
  // wag burahin pang abang para sa multiple cutoff filter
  // const getCutoffs = async () => {
  //   try {
  //     const res = await axios.get(`${BASE_URL}/expensesReport/getCutoffs`);
  //     const sortedData = res.data.sort(
  //       (a, b) => new Date(b.from) - new Date(a.from)
  //     );
  //     setCutoffData(sortedData);

  //     if (sortedData.length > 0) {
  //       const defaultCutoff = sortedData[0];
  //       setSelectedOptionsCutoff([
  //         {
  //           value: defaultCutoff.id,
  //           label: defaultCutoff.name,
  //           from: defaultCutoff.from,
  //           to: defaultCutoff.to,
  //         },
  //       ]);
  //       setDateFrom(new Date(defaultCutoff.from).toISOString().split("T")[0]);
  //       setDateTo(new Date(defaultCutoff.to).toISOString().split("T")[0]);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const cutoffOptions = cutoffData.map((option) => ({
  //   value: option.id,
  //   label: option.name,
  //   from: option.from,
  //   to: option.to,
  // }));

  // const handleChange = (selected) => {
  //   setSelectedOptionsCutoff(selected);
  //   if (selected.length > 0) {
  //     const datesFrom = selected.map((option) => new Date(option.from));
  //     const datesTo = selected.map((option) => new Date(option.to));
  //     setDateFrom(new Date(Math.min(...datesFrom)).toISOString().split("T")[0]);
  //     setDateTo(new Date(Math.max(...datesTo)).toISOString().split("T")[0]);
  //   } else {
  //     setDateFrom("");
  //     setDateTo("");
  //   }
  // };

  // const calculateTotalAmounts = (data) => {
  //   const totals = {};

  //   data.forEach((expense1) => {
  //     const expenseTypeOne = expense1.expenses_type_one;
  //     if (!totals[expenseTypeOne]) {
  //       totals[expenseTypeOne] = 0;
  //     }
  //     expense1.expenses2s.forEach((expense2) => {
  //       expense2.expenses.forEach((expense) => {
  //         totals[expenseTypeOne] += expense.totalAmount;
  //       });
  //     });
  //   });

  //   return totals;
  // };

  // useEffect(() => {
  //   const fetchInitialData = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${BASE_URL}/expensesReport/getExpenses1Report`,
  //         {
  //           params: {
  //             dateFrom,
  //             dateTo,
  //           },
  //         }
  //       );
  //       const groupedTotals = calculateTotalAmounts(response.data);
  //       setExpenses1DataReport(response.data);
  //       setCurrentMonthTotal(groupedTotals);
  //     } catch (error) {
  //       console.error("Error fetching initial expense data:", error);
  //     }
  //   };

  //   fetchInitialData();
  // }, [dateFrom, dateTo]);

  // wag burahin pang abang para sa multiple cutoff filter

  const getCutoffs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expensesReport/getCutoffs`);
      const sortedData = res.data.sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );
      setCutoffData(sortedData);

      if (sortedData.length > 0) {
        const defaultCutoff = sortedData[0];
        setSelectedOptionsCutoff(defaultCutoff.id.toString());
        setDateFrom(new Date(defaultCutoff.from).toISOString().split("T")[0]);
        setDateTo(new Date(defaultCutoff.to).toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCutoffChange = (e) => {
    const selectedId = e.target.value;
    setSelectedOptionsCutoff(selectedId);

    const selectedCutoff = cutoffData.find(
      (cutoff) => cutoff.id.toString() === selectedId
    );

    if (selectedCutoff) {
      setDateFrom(new Date(selectedCutoff.from).toISOString().split("T")[0]);
      setDateTo(new Date(selectedCutoff.to).toISOString().split("T")[0]);
    }
  };

  const handleClearFilter = () => {
    setSelectedOptionsCutoff([]);
    setDateFrom("");
    setDateTo("");
  };

  const handleApplyFilter = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/expensesReport/getExpenses1Report`,
        {
          params: {
            dateFrom,
            dateTo,
          },
        }
      );
      // const groupedTotals = calculateTotalAmounts(response.data);
      // setCurrentMonthTotal(groupedTotals);
      setCurrentMonthTotalExpenses1(response.data.currentMonthTotals1);
      setLastMonthTotalExpenses1(response.data.lastMonthTotals1);
      setCurrentMonthTotalExpenses2(response.data.currentMonthTotals2);
      setLastMonthTotalExpenses2(response.data.lastMonthTotals2);
    } catch (error) {
      console.error("Error fetching expense data:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/expensesReport/getExpenses1Report`,
          {
            params: {
              dateFrom,
              dateTo,
            },
          }
        );
        setCurrentMonthTotalExpenses1(response.data.currentMonthTotals1);
        setLastMonthTotalExpenses1(response.data.lastMonthTotals1);
        setCurrentMonthTotalExpenses2(response.data.currentMonthTotals2);
        setLastMonthTotalExpenses2(response.data.lastMonthTotals2);
      } catch (error) {
        console.error("Error fetching initial expense data:", error);
      }
    };

    fetchInitialData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    getCutoffs();
  }, []);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Expenses Report</span>
        </div>
        <div>
          {/* <button className="btn btn-primary">Post Cutoff</button> */}
        </div>
      </div>
      <div className="w-100 row mx-auto mt-2">
        <h6>Accounting Period</h6>
        <div className="col-sm mb-2">
          <label htmlFor="subject2">Filter Cutoff</label>
          {/* <MultiSelect
            required
            options={cutoffOptions}
            value={selectedOptionsCutoff}
            onChange={handleChange}
            labelledBy="Select"
            className="w-100"
          /> */}

          <Form.Select
            id="cutoffSelect"
            value={selectedOptionsCutoff}
            onChange={handleCutoffChange}
          >
            {cutoffData.map((cutoff) => (
              <option key={cutoff.id} value={cutoff.id}>
                {cutoff.name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-sm mb-2">
          <span>From</span>
          {/* <input
            type="date"
            value={dateFrom}
            name=""
            className="form-control"
            readOnly
            id=""
          /> */}
          <DatePicker
            selected={dateFrom}
            dateFormat="MMM dd, yyyy"
            className="form-control"
            readOnly
          />
        </div>
        <div className="col-sm mb-2">
          <span>To</span>
          {/* <input
            type="date"
            value={dateTo}
            name=""
            className="form-control"
            readOnly
            id=""
          /> */}
          <DatePicker
            selected={dateTo}
            dateFormat="MMM dd, yyyy"
            className="form-control"
            readOnly
          />
        </div>

        <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
          <button className="btn" onClick={handleApplyFilter}>
            Apply Filter
          </button>
          <button className="btn btn-secondary" onClick={handleClearFilter}>
            Clear Filter
          </button>
        </div>
        <div className="col-sm"></div>
      </div>
      {/* <div className="w-100 container-fluid mt-2">
        <div className="d-flex justify-content-between align-items-center">
          <h5>Production Overview</h5>
          <button className="btn btn-primary" onClick={toggleTable}>
            {showTable ? "Hide Overview" : "Show Overview"}
          </button>
        </div>

        <CSSTransition
          in={showTable}
          timeout={300}
          classNames="slide"
          unmountOnExit
        >
          <div className="table-responsive mt-3">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Last Month</th>
                  <th>Current Month</th>
                  <th>Growth Index (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Selling Expenses</td>
                  <td>45,506.00</td>
                  <td>51,100.00</td>
                  <td>12.3%</td>
                </tr>
                <tr>
                  <td>Administrative Expenses</td>
                  <td>549,039.00</td>
                  <td>603,013.00</td>
                  <td>9.8%</td>
                </tr>
                <tr>
                  <td>Depreciation Expense</td>
                  <td>15,452.00</td>
                  <td>15,452.00</td>
                  <td>0.0%</td>
                </tr>
                <tr>
                  <td>Financial expenses</td>
                  <td>17,224.00</td>
                  <td>55,000.00</td>
                  <td>219.3%</td>
                </tr>
                <tr>
                  <td>Income Tax Expense</td>
                  <td>50,000.00</td>
                  <td>50,000.00</td>
                  <td>0.0%</td>
                </tr>
                <tr className="table-primary">
                  <td className="fw-bold text-success">Total Expenses:</td>
                  <td className="fw-bold text-success">677,221.00</td>
                  <td className="fw-bold text-success">774,565.00</td>
                  <td className="fw-bold text-success">14.4%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CSSTransition>
      </div> */}

      <div className="container-fluid mt-2">
        <div className="w-100 d-flex align-items-center mt-4">
          <h5>Summary Of Expenses</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>

        <div className="row">
          <div className="col-sm mb-3">
            <div className="w-100 d-flex justify-content-between mt-4">
              <h5>Overview</h5>
              <button className="btn btn-primary" onClick={toggleTable}>
                {showTable ? "Hide Overview" : "Show Overview"}
              </button>
            </div>

            <CSSTransition
              in={showTable}
              timeout={300}
              classNames="slide"
              unmountOnExit
            >
              <div className="table-responsive mt-3">
                {/* Current Month Table */}
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th colSpan="2">Current Month</th>
                      <th>Growth Index %</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th colSpan="2">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(currentMonthTotalExpenses1).map(
                      ([expenseTypeOne, total]) => {
                        const lastMonthValue =
                          lastMonthTotalExpenses1[expenseTypeOne] || 0;
                        const growthIndex =
                          lastMonthValue === 0
                            ? "--"
                            : (
                                ((total - lastMonthValue) / lastMonthValue) *
                                100
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + "%";

                        return (
                          <tr key={expenseTypeOne}>
                            <td>{expenseTypeOne}</td>
                            <td colSpan="2">
                              {total.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>{growthIndex}</td>
                          </tr>
                        );
                      }
                    )}

                    {/* TOTAL EXPENSES ROW */}
                    {(() => {
                      const lastMonthTotal = Object.values(
                        lastMonthTotalExpenses1
                      ).reduce((sum, val) => sum + val, 0);
                      const currentMonthTotal = Object.values(
                        currentMonthTotalExpenses1
                      ).reduce((sum, val) => sum + val, 0);

                      const totalGrowthIndex =
                        lastMonthTotal === 0
                          ? "--"
                          : (
                              ((currentMonthTotal - lastMonthTotal) /
                                lastMonthTotal) *
                              100
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + "%";

                      return (
                        <tr
                          style={{
                            fontWeight: "bold",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <td>Total Expenses</td>
                          <td colSpan="2">
                            {currentMonthTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{totalGrowthIndex}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>

                {/* Last Month Table */}
                <table className="table table-bordered table-striped mt-4">
                  <thead>
                    <tr>
                      <th>Comparison to Previous Month</th>
                      <th colSpan="2">Last Month</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th colSpan="2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...new Set([
                        ...Object.keys(currentMonthTotalExpenses1),
                        ...Object.keys(lastMonthTotalExpenses1),
                      ]),
                    ].map((expenseTypeOne) => {
                      const lastMonthValue =
                        lastMonthTotalExpenses1[expenseTypeOne] || 0;
                      return (
                        <tr key={expenseTypeOne}>
                          <td>{expenseTypeOne}</td>
                          <td colSpan="2">
                            {lastMonthValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}

                    {/* TOTAL EXPENSES ROW for Last Month */}
                    <tr
                      style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}
                    >
                      <td>Total Expenses</td>
                      <td colSpan="2">
                        {Object.values(lastMonthTotalExpenses1)
                          .reduce((sum, val) => sum + val, 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CSSTransition>
          </div>
        </div>

        <div className="row">
          <div className="col-sm mb-3">
            <div className="w-100 d-flex align-items-center mt-4">
              <h5>Expenses Type 1</h5>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="w-100">
              <div className="table-responsive">
                <table className="table table-bordered mt-4">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th colSpan="2">Last Month</th>
                      <th colSpan="2">Current Month</th>
                      <th>Growth Index %</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th colSpan="2">Amount</th>
                      <th colSpan="2">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(currentMonthTotalExpenses1).map(
                      ([expenseTypeOne, total]) => {
                        const lastMonthValue =
                          lastMonthTotalExpenses1[expenseTypeOne] || 0;
                        console.log(
                          "******************************************************************-" +
                            lastMonthValue
                        );
                        const growthIndex =
                          lastMonthValue === 0
                            ? "--"
                            : (
                                ((total - lastMonthValue) / lastMonthValue) *
                                100
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + "%";

                        return (
                          <tr key={expenseTypeOne}>
                            <td>{expenseTypeOne}</td>
                            <td colSpan="2">
                              {lastMonthValue.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td colSpan="2">
                              {total.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>{growthIndex}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-sm mb-3">
            <div className="w-100 d-flex align-items-center mt-4">
              <h5>Expenses Type 2</h5>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="w-100">
              <div className="table-responsive report-table scrollable-contents">
                <table className="table table-bordered mt-4 ">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th colSpan="2">Last Month</th>
                      <th colSpan="2">Current Month</th>
                      <th>Growth Index %</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th colSpan="2">Amount</th>
                      <th colSpan="2">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(currentMonthTotalExpenses2).map((subType) => {
                      const lastMonthTotal =
                        lastMonthTotalExpenses2[subType] || 0;
                      const currentMonthTotal =
                        currentMonthTotalExpenses2[subType] || 0;
                      const growthIndex =
                        lastMonthTotal > 0
                          ? ((currentMonthTotal - lastMonthTotal) /
                              lastMonthTotal) *
                            100
                          : "--";

                      return (
                        <tr key={subType}>
                          <td>{subType}</td>
                          <td colSpan="2">
                            {lastMonthTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td colSpan="2">
                            {currentMonthTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            {typeof growthIndex === "number"
                              ? `${growthIndex.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}%`
                              : growthIndex}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesReport1;
