import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import useDecodeToken from "../../../../../hooks/customHook/useDecodeToken";

const NewIncomeStatement = () => {
  const userLoggedID = useDecodeToken();

  // For cutoff filter
  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");

  // States per section
  const [revenue, setRevenue] = useState({});
  const [costOfGoodsSold, setCostOfGoodsSold] = useState({});
  const [expenseType, setExpenseType] = useState({
    list: [], // expense type list
    totalOperatingExpense: 0,
  });

  // Gross sale's profit total amount
  const grossSalesProfit = revenue.totalRevenue - costOfGoodsSold.costOfGoodsSold; // prettier-ignore

  // Income before tax total amount
  const incomeBeforeTax = grossSalesProfit - expenseType.totalOperatingExpense;

  // Get the default cutoff
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

  // Handle change cutoff
  const handleCutoffChange = (value) => {
    setSelectedCutoff_id(value);
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);
  };

  // Format the number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get income statement summary
  const getIncomeStatement = async () => {
    try {
      const incomeStatementEndpoint = `${BASE_URL}/incomeReport`;
      const params = {
        startDate: thisFromdate,
        endDate: thisTodate,
      };

      const [revenue, cogs, expenseType] = await Promise.allSettled([
        axios.get(`${incomeStatementEndpoint}/revenue`, { params }),
        axios.get(`${incomeStatementEndpoint}/cost-of-goods-sold`, { params }),
        axios.get(`${incomeStatementEndpoint}/expense-type`, { params }),
      ]);

      setRevenue(revenue.value.data);
      setCostOfGoodsSold(cogs.value.data);
      setExpenseType({
        list: expenseType.value.data.expenseType,
        totalOperatingExpense: expenseType.value.data.totalOperatingExpense,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getIncomeStatement();
  }, [thisFromdate]);

  useEffect(() => {
    getCutoff();
  }, []);

  // Dev note para sa calculations
  const title = `
     Dev note:
     \n--- Revenue ---
     \n• Sales Revenue = total ng sales invoice kasama yung mga discounts pero hindi idadagdag yung moisture,
     status: not equal sa rejected tsaka pending.
     \n• Sales Discount = total ng lahat ng discount
     \n• Other Income = total ng lahat ng approved na other income
     \n• Total Revenue = Sales Revenue - Sales Discount - Other Income
     \n--- Cost of Goods Sold ---
     \n• Opening inventory = Debit - Credit ng inventory journal, less than startDate
     \n• Purchases = total ng lahat ng payable, status: not equal sa pending tsaka rejected
     \n• Close Inventory = Debit - Credit ng inventory journal, less than or equal endDate
     \n• Cost of Goods Sold = Opening Inventory + Purchases - Close Inventory
     \n• Gross Sale's Profit = Total Revenue - Cost of Goods Sold
     \n--- Operating Expense ---
     \n• Subject 1 = List of Expense type one
     \n• Subject 2 = List of Expense type two name tsaka total amount
     \n• Total Operating Expenses = Total ng lahat ng expense type two amount
     \n• Income Before Tax = Gross Sale's Profit - Total Operating Expenses
    `;

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Income Statement</span>
        </div>
        {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
          <div>
            <i
              className="fa-solid fa-circle-info d-inline-flex align-items-center text-primary fs-6 ms-2 mb-1"
              style={{ cursor: "pointer" }}
              title={title}
            ></i>
          </div>
        )}
      </div>

      {/* Cutoff filter */}
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
          <DatePicker
            selected={thisFromdate}
            dateFormat="MMM/dd/yyyy"
            className="form-control"
            readOnly
          />
        </div>
        <div className="col-sm mb-2">
          <span>To</span>
          <DatePicker
            selected={thisTodate}
            dateFormat="MMM/dd/yyyy"
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
                {/* Revenue section */}
                <tr>
                  <td>Revenue</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Sales Revenue</td>
                  <td className="text-end">
                    {formatToTwoDecimal(revenue.salesRevenue)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Sales Discount</td>
                  <td className="text-end">
                    {formatToTwoDecimal(revenue.salesDiscount)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Other Income</td>
                  <td className="text-end">
                    {formatToTwoDecimal(revenue.otherIncome)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Other Revenue</td>
                  <td className="text-end">TBA</td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Total Revenue:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {formatToTwoDecimal(revenue.totalRevenue)}
                    </strong>
                  </td>
                </tr>

                {/* Cost of goods sold section */}
                <tr>
                  <td>Cost of Goods Sold (COGS)</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Opening Inventory</td>
                  <td className="text-end">
                    {formatToTwoDecimal(costOfGoodsSold.openingInventory)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Purchases</td>
                  <td className="text-end">
                    {formatToTwoDecimal(costOfGoodsSold.purchases)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Purchases Discount</td>
                  <td className="text-end">TBA</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Inventory Adjustments</td>
                  <td className="text-end">
                    {formatToTwoDecimal(costOfGoodsSold.adjustments)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Close Inventory</td>
                  <td className="text-end">
                    {formatToTwoDecimal(costOfGoodsSold.closeInventory)}
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Cost of Goods Sold:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {formatToTwoDecimal(costOfGoodsSold.costOfGoodsSold)}
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
                      {formatToTwoDecimal(grossSalesProfit)}
                    </strong>
                  </td>
                </tr>

                {/* Expense type section */}
                {expenseType?.list?.map((typeOne) => (
                  <React.Fragment key={typeOne.expenses_one_id}>
                    <tr>
                      <td>{typeOne.expenses_type_one}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    {typeOne.expenses2s?.map((typeTwo) => (
                      <tr key={typeTwo.id}>
                        <td></td>
                        <td>{typeTwo.sub_type}</td>
                        <td className="text-end">
                          {formatToTwoDecimal(typeTwo.expenseSubTypeAmount)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Total Operating Expenses:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {formatToTwoDecimal(expenseType.totalOperatingExpense)}
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
                      {formatToTwoDecimal(incomeBeforeTax)}
                    </strong>
                  </td>
                </tr>
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Income Tax Expenses:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">TBA</strong>
                  </td>
                </tr>
                {/* Calculation for Net Income: Income Before Tax minus Income Tax Expenses */}
                <tr className="table-secondary">
                  <td></td>
                  <td>
                    <strong>Net Income:</strong>
                  </td>
                  <td className="text-end">
                    <strong className="peso">
                      {formatToTwoDecimal(incomeBeforeTax)}
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

export default NewIncomeStatement;
