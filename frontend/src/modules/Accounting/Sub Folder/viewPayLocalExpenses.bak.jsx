import React, { useState, useEffect } from "react";
import { Button, Form, Nav, Tab, Table } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { useNavigate, useParams } from "react-router-dom";
import swal from "sweetalert";

const ViewLocalPayExpenses = () => {
  const navigate = useNavigate();
  const { id, foreign_url } = useParams();
  const [bulkExpenses, setBulkExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addDeducts, setAddDeducts] = useState([]);

  const [expensesTotalAmount, setExpensesTotalAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [additionalTotalAmount, setAdditionalTotalAmount] = useState(0);
  const [deductionTotalAmount, setDeductionTotalAmount] = useState(0);
  const [activeTab, setActiveTab] = useState("paymentList");

  const [selected_currency_id, setSelected_currency_id] = useState("");
  const [currency_db, setCurrency_db] = useState([]);
  const [currencyName, setCurrencyName] = useState("");
  const handleCurrencyChange = (value) => {
    setSelected_currency_id(value);
  };

  const fetchCurrency = async () => {
    await axios
      .get(BASE_URL + "/currency/fetchCurrency")
      .then((response) => {
        setCurrency_db(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const foreignExpenses = foreign_url === "local" ? "LOCAL" : "OVERSEAS";

  useEffect(() => {
    fetchCurrency();
    axios
      .get(`${BASE_URL}/paylocalexpenses/localExpensesSpecificDataFetching`, {
        params: { id: id },
      })
      .then((res) => {
        const { data, dataTransaction, dataPayment, dataAddDeduct } = res.data;
        setBulkExpenses(data);
        setTransactions(dataTransaction);
        setPayments(dataPayment);
        setAddDeducts(dataAddDeduct);

        const total = dataTransaction.reduce((acc, transaction) => {
          return acc + (transaction.expense.totalAmount || 0);
        }, 0);

        const totalpayAmount = dataPayment.reduce((acc, pay) => {
          return acc + (pay.amount || 0);
        }, 0);

        const additionaltotal = dataAddDeduct.reduce((acc, adds) => {
          if (adds.type_expenses === "additional") {
            // Add condition to check type_expenses
            return acc + (adds.amount || 0);
          }
          return acc;
        }, 0);

        const deductiontotal = dataAddDeduct.reduce((acc, adds) => {
          if (adds.type_expenses === "deduction") {
            return acc + (adds.amount || 0);
          }
          return acc;
        }, 0);
        setTotalPayment(totalpayAmount);
        setAdditionalTotalAmount(additionaltotal);
        setDeductionTotalAmount(deductiontotal);
        setExpensesTotalAmount(total);

        const currency_symbol = currency_db.find(
          (currency) =>
            String(currency.id) === String(transactions[0].expense.currency_id)
        );

        if (currency_symbol) {
          setSelected_currency_id(currency_symbol.id);
          setCurrencyName(currency_symbol.currency_name);
        }
      })
      .catch((err) => console.log(err));
  }, [id]);

  const handleAddNewExpense = () => {
    const newExpense = {
      expense: {
        totalAmount: 0, // Initialize default values
        currency_id: selected_currency_id || null,
        // Other default fields you might need
      },
    };

    setTransactions([...transactions, newExpense]);

    // Optionally, you can send a request to save the new expense on the server
    axios
      .post(`${BASE_URL}/paylocalexpenses/addExpense`, newExpense)
      .then((res) => {
        // Handle the response if needed
      })
      .catch((err) => console.log(err));
  };

  let cashTotal = 0;
  let bankTotal = 0;
  let checkTotal = 0;
  let onlineTotal = 0;

  // Calculate totals
  payments.forEach((data) => {
    if (data.payment_type === "Cash") {
      cashTotal += data.amount;
    } else if (data.payment_type === "Bank") {
      if (!data.check_number) {
        bankTotal += data.amount; // Bank without check number
      } else {
        checkTotal += data.amount; // Check with check number
      }
    }
    if (data.payment_type === "Bank" && data.online_ref_number) {
      onlineTotal += data.amount; // Online payment with reference number
    }
  });

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const sumOfAdditionalandToPay = additionalTotalAmount + expensesTotalAmount;
  const sumOfDeductionandTotalPayment = deductionTotalAmount + totalPayment;
  const payableExpenses =
    sumOfAdditionalandToPay - sumOfDeductionandTotalPayment;

  const handleApprove = () => {
    swal({
      title: "Approve this pay expenses?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        const processedPayments = payments.map((payment) => {
          return {
            id: payment.id || "",
            pay_bulk_id: payment.pay_bulk_id || "",
            account_list_sub3_id: payment.account_list_sub3_id || "",
            payment_type: payment.payment_type || "",
            check_number: payment.check_number || "",
            amount: payment.amount || "",
            date_issued: payment.date_issued || "",
            createdAt: payment.createdAt || "",
            updatedAt: payment.updatedAt || "",
            account_list_sub3: {
              id: payment.account_list_sub3.id || "",
              account_list_base_sub_id:
                payment.account_list_sub3.account_list_base_sub_id || "",
              account_name: payment.account_list_sub3.account_name || "",
              amount: payment.account_list_sub3.amount || "",
              currency_id: payment.account_list_sub3.currency_id || "",
              createdAt: payment.account_list_sub3.createdAt || "",
              updatedAt: payment.account_list_sub3.updatedAt || "",
            },
          };
        });
        try {
          axios
            .post(`${BASE_URL}/paylocalexpenses/approved`, null, {
              params: {
                id,
                processedPayments,
                transactions_number: bulkExpenses.transaction_number,
                addDeducts,
                date_transacted: bulkExpenses.pay_date,
              },
            })
            .then((res) => {
              if (res.status === 201) {
                swal({
                  title: "Oppss!",
                  text: "Insufficient balance",
                  icon: "error",

                  dangerMode: true,
                });
              } else if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Successfully approved this request",
                  icon: "success",
                  dangerMode: true,
                }).then(() => {
                  navigate("/accounting/local-expenses");
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "warning",
                  buttons: true,
                  dangerMode: true,
                });
              }
            });
        } catch (error) {
          console.log(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          });
        }
      }
    });
  };

  const handleReject = () => {
    swal({
      title: "Reject this pay expenses?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/paylocalexpenses/rejected`, null, {
              params: {
                id,
                transactions,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Successfully rejected this request",
                  icon: "success",

                  dangerMode: true,
                }).then(() => {
                  navigate("/accounting/local-expenses");
                });
              } else {
                swal({
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  icon: "warning",
                  buttons: true,
                  dangerMode: true,
                });
              }
              // setExpensesData(res.data);
              // console.log(res.data);
            });
        } catch (error) {
          console.log(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          });
        }
      }
    });
  };

  const [showEditButton, setShowEditButton] = useState(false);
  const [items, setItems] = useState([
    {
      transactionId: "",
      expensesType: "",
      expensesDate: "",
      totalAmount: "",
      description: "",
    },
  ]);

  const handleEllipsisClick = () => {
    setShowEditButton(!showEditButton); // Toggle edit button display
  };

  const addNewItem = () => {
    setItems([
      ...items,
      {
        transactionId: "",
        expensesType: "",
        expensesDate: "",
        totalAmount: "",
        description: "",
      },
    ]);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="w-100 d-flex flex-row justify-content-between">
          <span className="fs-3">{foreignExpenses} EXPENSES DETAILS</span>

          <div className="dropdown dropdown-button">
            <button
              className="border-0"
              type="button"
              id="dropdownMenuButton1"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-dots-horizontal fs-4"></i>
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
              <li>
                <span style={{ cursor: "pointer" }} className="dropdown-item">
                  Edit Transaction
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container-fluid mt-3">
        <div className="row p-2">
          <div className="col-sm">
            <span>Transaction Number</span>
            <div className="input-group mb-2">
              <Form.Control
                type="text"
                name=""
                id=""
                className=" p-2"
                value={bulkExpenses.transaction_number || ""}
                readOnly
              />
            </div>
          </div>
          <div className="col-sm">
            <span>
              Currency <span className="text-danger">*</span>
            </span>
            <select
              required
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="form-select p-2"
              value={selected_currency_id}
              disabled
            >
              <option value="" selected disabled>
                Select Currency
              </option>
              {currency_db.map((data) => (
                <option key={data.id} value={data.id}>
                  {`${data.currency_name}`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm">
            <span>Balance</span>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <div className="input-group-text h-100">{currencyName}</div>
              </div>
              <input
                type="text"
                className="form-control p-2"
                id="inlineFormInputGroup"
                placeholder="0.00"
                value={expensesTotalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
              />
            </div>
          </div>
          <div className="col-sm">
            <span>Pay Date</span>
            <input
              type="date"
              name=""
              id=""
              readOnly
              className="form-control p-2"
              value={bulkExpenses.pay_date || ""}
              required
            />
          </div>
        </div>
      </div>
      <div className="container-fluid">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Expenses Lists</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Transaction ID</th>
                  <th className="p-2">Expenses Type</th>
                  <th className="p-2">Expenses Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control form-control-sm p-2"
                        type="text"
                        value={t.expense.transaction_id}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm p-2"
                        readOnly
                        value={`${t.expense.expenses2.expenses_one.expenses_type_one} - ${t.expense.expenses2.sub_type}`}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control form-control-sm p-2"
                        readOnly
                        value={
                          new Date(t.expense.expenses_date)
                            .toISOString()
                            .split("T")[0]
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm p-2"
                        value={t.expense.totalAmount}
                        readOnly
                      />
                    </td>
                    <td className="text-center">
                      <div className="input-group mb-2">
                        <Form.Control
                          type="text"
                          className="form-control-sm p-2"
                          id="inlineFormInputGroup"
                          value={t.expense.desc || "n/a"}
                          readOnly
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end mt-2">
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={handleAddNewExpense}
          >
            New Expenses
          </button>
        </div>
      </div>
      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Payment</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-4">
          <div className="w-100 p-2 mt-1 row">
            <div className="">
              <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link
                      eventKey="paymentList"
                      className="text-dark custom-nav-link"
                    >
                      Payment List
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="AddExpenses"
                      className="text-dark custom-nav-link"
                    >
                      Add Expenses
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="DeductionExpenses"
                      className="text-dark custom-nav-link"
                    >
                      Deduction Expenses
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content className="mt-3">
                  <Tab.Pane eventKey="paymentList">
                    <div className="border p-3 rounded">
                      <h5>Payment List</h5>
                      <div className="table-responsive">
                        <Table bordered>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Account Name</th>
                              <th>Amount</th>
                              <th>Check Number</th>
                              <th>Issue Date</th>
                              <th>Online Wallet</th>
                              <th>Online Reference No.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((data, i) => (
                              <tr>
                                <td>{data.payment_type}</td>
                                <td>
                                  {data.account_list_sub3.account_name === ""
                                    ? "--"
                                    : data.account_list_sub3.account_name}
                                </td>
                                <td>
                                  {data.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {data.check_number === ""
                                    ? "--"
                                    : data.check_number}
                                </td>
                                <td>{data.date_issued}</td>
                                <td>
                                  {data.online_name === ""
                                    ? "--"
                                    : data.online_name}
                                </td>
                                <td>
                                  {data.online_ref_number === ""
                                    ? "--"
                                    : data.online_ref_number}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="AddExpenses">
                    <div className="border p-3 rounded">
                      <h5>Additional Expenses</h5>
                      <div className="table-responsive">
                        <Table bordered hover>
                          <thead>
                            <tr>
                              <th>Subject1</th>
                              <th>Subject2</th>
                              <th>Subject3</th>
                              <th>Remarks</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addDeducts
                              .filter((ad) => ad.type_expenses === "additional")
                              .map((ad, i) => (
                                <tr key={i}>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={
                                        ad.account_list_sub3
                                          .account_list_base_sub.module_type
                                      }
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={
                                        ad.account_list_sub3
                                          .account_list_base_sub.subject_name
                                      }
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.account_list_sub3.account_name}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.description}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.amount}
                                      readOnly
                                    />
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="DeductionExpenses">
                    <div className="border p-3 rounded">
                      <h5>Deduction Expenses</h5>
                      <div className="table-responsive">
                        <Table bordered hover>
                          <thead>
                            <tr>
                              <th>Subject1</th>
                              <th>Subject2</th>
                              <th>Subject3</th>
                              <th>Remarks</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addDeducts
                              .filter((ad) => ad.type_expenses === "deduction")
                              .map((ad, i) => (
                                <tr key={i}>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={
                                        ad.account_list_sub3
                                          .account_list_base_sub.module_type
                                      }
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={
                                        ad.account_list_sub3
                                          .account_list_base_sub.subject_name
                                      }
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.account_list_sub3.account_name}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.description}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      value={ad.amount}
                                      readOnly
                                    />
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
            <div className="row mt-5">
              <div className="col-sm">
                <div className="d-flex justify-content-between">
                  <span>Expenses</span>
                  <span className="text-secondary">
                    {expensesTotalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Additional Expenses</span>
                  <span className="text-secondary">
                    {additionalTotalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Deduction Expenses</span>
                  <span className="text-secondary">
                    {deductionTotalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Payments</span>
                  <span className="text-secondary">
                    {totalPayment.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                  <span>Payable Expenses</span>
                  <span>
                    {payableExpenses.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <div className="col-sm"></div>
              <div className="col-sm">
                <div className="d-flex justify-content-between">
                  <span>Cash</span>
                  <span className="text-secondary">
                    {cashTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Bank</span>
                  <span className="text-secondary">
                    {bankTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Check</span>
                  <span className="text-secondary">
                    {checkTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Online</span>
                  <span className="text-secondary">
                    {onlineTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded text-white">
                  <span>Total Payment</span>
                  <span>
                    {totalPayment.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
            {bulkExpenses.status === "For-Approval" && (
              <div className="row mt-4">
                <div className="col-sm"></div>
                <div className="col-sm"></div>
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  <button
                    className="btn btn-outline-danger w-100 me-3"
                    type="button"
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={handleApprove}
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLocalPayExpenses;
