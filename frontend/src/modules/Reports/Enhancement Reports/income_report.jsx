import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";

const IncomeReport1 = () => {
  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");

  const [salesInvoice, setSalesInvoice] = useState([]);

  const [salesRevenue, setSalesRevenue] = useState([]);
  const [salesDiscount, setSalesDiscount] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);

  const [openingInventory, setOpeningInventory] = useState(0);
  const [closingInventory, setClosingInventory] = useState(0);
  const [purchase, setPurchase] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [incomeTaxExpenses, setIncomeTaxExpenses] = useState(0);
  const [grossSalesProfit, setGrossSalesProfit] = useState(0);
  const [incomeBeforeTax, setIncomeBeforeTax] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  const [subTypes, setSubTypes] = useState([]);

  const getCutoff = async () => {
    await axios
      .get(`${BASE_URL}/cutoff/getCutoffs`)
      .then((res) => {
        const cutoffList_id = res.data[0].id;
        const cutoff_fromdate = res.data[0].from;
        const cutoff_todate = res.data[0].to;

        setCutoffList(res.data);
        setSelectedCutoff_id(cutoffList_id);
        setThisFromdate(cutoff_fromdate || "");
        setThisTodate(cutoff_todate || "");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchSalesInvoice = () => {
    axios
      .get(`${BASE_URL}/incomeReport/getSalesInvoice`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        const { salesInvoices, totalRevenue, totalSalesDiscount, netRevenue } =
          res.data;
        setSalesInvoice(salesInvoices);
        setSalesRevenue(totalRevenue);
        setSalesDiscount(totalSalesDiscount);
        setNetRevenue(netRevenue);
      })
      .catch((err) => console.log(err));
  };

  const fetchOpeningInventory = () => {
    axios
      .get(`${BASE_URL}/incomeReport/getCostOfGoodsSold`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        const {
          openingInventory,
          totalPurchases,
          closingInventory,
          cogs,
          totalIncomeTaxExpenses,
        } = res.data;
        setOpeningInventory(openingInventory);
        setPurchase(totalPurchases);
        setClosingInventory(closingInventory);
        setCogs(cogs);
        setIncomeTaxExpenses(totalIncomeTaxExpenses);
      })
      .catch((err) => {
        console.log("Error fetching opening inventory:", err);
      });
  };

  const fetchSubTypes = () => {
    axios
      .get(`${BASE_URL}/incomeReport/getOperatingExpensesSubTypes`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        setSubTypes(res.data);
      })
      .catch((err) => console.log(err));
  };

  // const groupedData = subTypes.reduce((acc, curr) => {
  //   const subType = curr?.expenses2?.sub_type || "N/A";
  //   if (!acc[subType]) {
  //     acc[subType] = { sub_type: subType, totalAmount: 0 };
  //   }
  //   acc[subType].totalAmount += curr?.totalAmount || 0;
  //   return acc;
  // }, {});

  const groupedDataByType = subTypes.reduce((acc, data) => {
    const expenseType = data?.expenses2?.expenses_one?.expenses_type_one;
    console.log("*-*-*-*-*expenseType: ", expenseType);
    if (!acc[expenseType]) {
      acc[expenseType] = { type: expenseType, totalAmount: 0 };
    }
    acc[expenseType].totalAmount += data?.totalAmount || 0;
    return acc;
  }, {});

  const calculateTotalOperatingExpenses = () => {
    let totalOperatingExpenses = 0;

    [
      "Selling Expenses",
      "Administrative Expenses",
      "Financial Expenses",
      "Other Operating Expenses",
      "Depreciation Expenses",
    ].forEach((expenseType) => {
      if (groupedDataByType[expenseType]) {
        totalOperatingExpenses +=
          groupedDataByType[expenseType].totalAmount || 0;
      }
    });

    return totalOperatingExpenses;
  };

  const groupedArrayByType = Object.values(groupedDataByType);

  useEffect(() => {
    getCutoff();
  }, []);

  useEffect(() => {
    if (thisFromdate && thisTodate) {
      fetchSalesInvoice();
      fetchSubTypes();
      fetchOpeningInventory();
    }
  }, [thisFromdate, thisTodate]);

  useEffect(() => {
    if (netRevenue !== undefined) {
      const computedGrossSalesProfit =
        cogs > 0 ? netRevenue - cogs : netRevenue;
      setGrossSalesProfit(computedGrossSalesProfit);
    }
  }, [netRevenue, cogs]);

  useEffect(() => {
    if (incomeBeforeTax !== undefined && incomeTaxExpenses !== undefined) {
      setNetIncome(incomeBeforeTax - incomeTaxExpenses);
    }
  }, [incomeBeforeTax, incomeTaxExpenses]);

  const handleCutoffChange = (value) => {
    console.log(value);
    setSelectedCutoff_id(value);
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);
    setGrossSalesProfit(0);
  };

  useEffect(() => {
    if (grossSalesProfit !== undefined) {
      const totalOperatingExpenses = calculateTotalOperatingExpenses();
      const calculatedIncomeBeforeTax =
        grossSalesProfit - totalOperatingExpenses;
      setIncomeBeforeTax(calculatedIncomeBeforeTax);
    }
  }, [grossSalesProfit, subTypes]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Income Statement</span>
        </div>
        <div></div>
      </div>
      <div className="w-100 row mx-auto mt-2">
        <h6>Accounting Period</h6>
        <div className="col-sm mb-2">
          <span>Cutoff Name</span>
          <Form.Select
            value={selectedCutoff_id}
            onChange={(e) => handleCutoffChange(e.target.value)}
            className="form-select"
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
            onChange={(e) => setThisFromdate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
          <DatePicker
            selected={thisFromdate}
            dateFormat="MMM dd, yyyy"
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
            onChange={(e) => setThisTodate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
          <DatePicker
            selected={thisTodate}
            dateFormat="MMM dd, yyyy"
            className="form-control"
            readOnly
          />
        </div>
        <div className="col-sm"></div>
      </div>
      <div className="container-fluid">
        <div className="w-100 d-flex align-items-center mt-4">
          <h5>Income Statement</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="container">
          <div className="table-responsive">
            <table className="table table-bordered mt-4">
              <thead>
                <tr>
                  <th>Subject 1</th>
                  <th>Subject 2</th>
                  <th className="text-end">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Revenue</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Sales Revenue</td>
                  <td className="text-end">
                    {salesRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Sales Discount</td>
                  <td className="text-end">
                    {salesDiscount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Other Revenue</td>
                  <td className="text-end">0.00</td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Total Revenue:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {netRevenue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>Cost of Goods Sold (COGS)</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Opening Inventory</td>
                  <td className="text-end">
                    {openingInventory.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Purchases</td>
                  <td className="text-end">
                    {purchase.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Close Inventory</td>
                  <td className="text-end">
                    {closingInventory.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Cost of Goods Sold:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {cogs.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Gross Sale's Profit:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {grossSalesProfit.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td>Operating Expenses</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Selling Expenses</td>
                  <td className="text-end">
                    {groupedDataByType["Selling Expenses"]
                      ? groupedDataByType[
                          "Selling Expenses"
                        ].totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Administrative Expenses</td>
                  <td className="text-end">
                    {groupedDataByType["Administrative Expenses"]
                      ? groupedDataByType[
                          "Administrative Expenses"
                        ].totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Financial Expenses</td>
                  <td className="text-end">
                    {groupedDataByType["Financial Expenses"]
                      ? groupedDataByType[
                          "Financial Expenses"
                        ].totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Other Operating Expenses</td>
                  <td className="text-end">
                    {groupedDataByType["Other Operating Expenses"]
                      ? groupedDataByType[
                          "Other Operating Expenses"
                        ].totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Depreciation Expenses</td>
                  <td className="text-end">
                    {groupedDataByType["Depreciation Expenses"]
                      ? groupedDataByType[
                          "Depreciation Expenses"
                        ].totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </td>
                </tr>
                {/* <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Total Operating Expenses:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">0.00</strong>
                  </td>
                </tr>
                
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Income Before Tax:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">0.00</strong>
                  </td>
                </tr>
                <tr>
                  <td>Operating Expenses</td>
                  <td></td>
                  <td></td>
                </tr>
                {groupedArrayByType.map((data, index) => (
  <tr key={index}>
    <td></td>
    <td>{data?.type || "N/A"}</td>  
    <td className="text-end">
      {data?.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}
    </td>
  </tr>
))} */}

                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Total Operating Expenses:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {calculateTotalOperatingExpenses().toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </strong>
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Income Before Tax:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {incomeBeforeTax.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Income Tax Expenses:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {incomeTaxExpenses.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Net Income:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {netIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeReport1;
